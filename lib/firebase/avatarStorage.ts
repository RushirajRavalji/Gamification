import { storage } from './firebase';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from './firebase';
// Import dynamically to avoid bundling issues
let imageCompression: any = null;

// Dynamically import the module
if (typeof window !== 'undefined') {
  import('browser-image-compression').then(module => {
    imageCompression = module.default;
  }).catch(err => {
    console.error("Error loading image compression module:", err);
  });
}

// Maximum avatar size in bytes (500KB)
const MAX_AVATAR_SIZE = 500 * 1024;

// Valid content types for avatars
const VALID_CONTENT_TYPES = [
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

// Maximum dimensions for avatars
const MAX_AVATAR_DIMENSIONS = {
  width: 512,
  height: 512,
};

// Cache management
interface CacheItem {
  url: string;
  timestamp: number;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ITEMS = 20;

// In-memory LRU cache
let avatarUrlCache: Map<string, CacheItem> = new Map();

// Initialize cache from localStorage
try {
  const storedCache = localStorage.getItem('avatarUrlCache');
  if (storedCache) {
    const parsedCache = JSON.parse(storedCache);
    
    // Filter out expired items
    const now = Date.now();
    const validEntries = Object.entries(parsedCache)
      .filter(([_, value]: [string, any]) => {
        return now - (value as CacheItem).timestamp < CACHE_EXPIRY;
      })
      .slice(0, MAX_CACHE_ITEMS);
      
    avatarUrlCache = new Map(validEntries as [string, CacheItem][]);
  }
} catch (e) {
  console.error('Error loading avatar cache from localStorage:', e);
  // Ignore and use empty cache
}

// Persist cache to localStorage
const persistCache = () => {
  try {
    const cacheObject = Object.fromEntries(avatarUrlCache.entries());
    localStorage.setItem('avatarUrlCache', JSON.stringify(cacheObject));
  } catch (e) {
    console.error('Error persisting avatar cache to localStorage:', e);
  }
};

// Clean expired items from cache
const cleanCache = () => {
  const now = Date.now();
  
  // Remove expired items
  for (const [key, value] of avatarUrlCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      avatarUrlCache.delete(key);
    }
  }
  
  // If still too many items, remove oldest
  if (avatarUrlCache.size > MAX_CACHE_ITEMS) {
    const sortedEntries = [...avatarUrlCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    while (avatarUrlCache.size > MAX_CACHE_ITEMS) {
      const [oldestKey] = sortedEntries.shift() || [];
      if (oldestKey) {
        avatarUrlCache.delete(oldestKey);
      }
    }
  }
  
  persistCache();
};

// Validate base64 image data
export const validateImageData = async (dataUrl: string): Promise<{ 
  valid: boolean, 
  error?: string,
  contentType?: string,
  size?: number 
}> => {
  return new Promise((resolve) => {
    try {
      if (!dataUrl.startsWith('data:')) {
        return resolve({ valid: false, error: 'Invalid data URL format' });
      }
      
      // Extract content type
      const contentTypeMatch = dataUrl.match(/^data:([^;]+);base64,/);
      if (!contentTypeMatch) {
        return resolve({ valid: false, error: 'Invalid data URL format' });
      }
      
      const contentType = contentTypeMatch[1];
      
      // Validate content type
      if (!VALID_CONTENT_TYPES.includes(contentType)) {
        return resolve({ 
          valid: false, 
          error: `Invalid content type: ${contentType}. Allowed: ${VALID_CONTENT_TYPES.join(', ')}` 
        });
      }
      
      // Create an image to validate dimensions and check if it loads properly
      const img = new Image();
      
      img.onload = () => {
        // Check dimensions
        if (img.width > MAX_AVATAR_DIMENSIONS.width || img.height > MAX_AVATAR_DIMENSIONS.height) {
          return resolve({ 
            valid: false, 
            error: `Image dimensions exceed maximum allowed (${MAX_AVATAR_DIMENSIONS.width}x${MAX_AVATAR_DIMENSIONS.height})` 
          });
        }
        
        // Estimate size (base64 is ~4/3 the size of binary)
        const base64Data = dataUrl.split(',')[1];
        const size = Math.ceil((base64Data.length * 3) / 4);
        
        if (size > MAX_AVATAR_SIZE) {
          return resolve({ 
            valid: false, 
            error: `Image size (${Math.ceil(size / 1024)}KB) exceeds maximum allowed (${MAX_AVATAR_SIZE / 1024}KB)` 
          });
        }
        
        return resolve({ valid: true, contentType, size });
      };
      
      img.onerror = () => {
        return resolve({ valid: false, error: 'Invalid or corrupted image data' });
      };
      
      img.src = dataUrl;
    } catch (error) {
      return resolve({ valid: false, error: `Validation error: ${error}` });
    }
  });
};

// Compress image if needed
export const compressImageIfNeeded = async (dataUrl: string): Promise<string> => {
  try {
    const validation = await validateImageData(dataUrl);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // If image is already small enough, return as is
    if (validation.size && validation.size <= MAX_AVATAR_SIZE) {
      return dataUrl;
    }
    
    // If compression module is not loaded, return original
    if (!imageCompression) {
      console.warn("Image compression module not loaded, using original image");
      return dataUrl;
    }
    
    // Extract the image format
    const contentType = validation.contentType || 'image/jpeg';
    
    // Convert data URL to File object
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], "avatar.jpg", { type: contentType });
    
    // Compression options
    const options = {
      maxSizeMB: MAX_AVATAR_SIZE / (1024 * 1024), // Convert bytes to MB
      maxWidthOrHeight: Math.max(MAX_AVATAR_DIMENSIONS.width, MAX_AVATAR_DIMENSIONS.height),
      useWebWorker: true,
      onProgress: () => {} // Progress tracking if needed
    };
    
    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    // Convert compressed file back to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error("Error compressing image:", error);
    // Return original if compression fails
    return dataUrl;
  }
};

// Upload avatar to Firebase Storage
export const uploadAvatar = async (
  dataUrl: string, 
  userId: string, 
  signal?: AbortSignal
): Promise<string> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    // Validate and compress image
    const validation = await validateImageData(dataUrl);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Compress if needed
    const optimizedDataUrl = await compressImageIfNeeded(dataUrl);
    
    // Generate a unique avatar ID
    const avatarId = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `avatars/${userId}/${avatarId}`;
    const storageRef = ref(storage, storagePath);
    
    // Check if operation was aborted
    if (signal?.aborted) {
      throw new Error('Upload aborted');
    }
    
    // Upload the image
    await uploadString(storageRef, optimizedDataUrl, 'data_url');
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Update cache
    avatarUrlCache.set(avatarId, {
      url: downloadUrl,
      timestamp: Date.now()
    });
    
    // Clean and persist cache
    cleanCache();
    
    // Return the avatar ID (not the full URL)
    return `storage:${avatarId}`;
  } catch (error) {
    if (signal?.aborted) {
      throw new Error('Upload aborted');
    }
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// Get avatar URL from ID
export const getAvatarUrl = async (
  avatarId: string, 
  userId?: string,
  retryCount = 2
): Promise<string> => {
  try {
    if (!avatarId) {
      throw new Error('Avatar ID is required');
    }
    
    // Handle case for old format avatarIds
    if (avatarId.startsWith('base64:')) {
      // Extract base64 data
      return avatarId.substring(7);
    }
    
    if (!avatarId.startsWith('storage:')) {
      return avatarId; // Return as is for other formats
    }
    
    const storageId = avatarId.substring(8);
    
    // Check cache first
    if (avatarUrlCache.has(storageId)) {
      // Update timestamp to mark it as recently used
      const item = avatarUrlCache.get(storageId)!;
      item.timestamp = Date.now();
      avatarUrlCache.set(storageId, item);
      return item.url;
    }
    
    // Get current user if userId not provided
    const currentUser = userId || auth.currentUser?.uid;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Get from Firebase Storage
    const storagePath = `avatars/${currentUser}/${storageId}`;
    const storageRef = ref(storage, storagePath);
    
    try {
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Update cache
      avatarUrlCache.set(storageId, {
        url: downloadUrl,
        timestamp: Date.now()
      });
      
      // Clean and persist cache
      cleanCache();
      
      return downloadUrl;
    } catch (error) {
      // Retry logic for network issues
      if (retryCount > 0) {
        console.warn(`Avatar fetch failed, retrying... (${retryCount} attempts left)`);
        // Wait before retrying (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        return getAvatarUrl(avatarId, userId, retryCount - 1);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error getting avatar URL:", error);
    throw error;
  }
};

// Delete avatar from storage
export const deleteAvatar = async (avatarId: string, userId?: string): Promise<boolean> => {
  try {
    if (!avatarId || !avatarId.startsWith('storage:')) {
      return false; // Nothing to delete or not a storage avatar
    }
    
    const storageId = avatarId.substring(8);
    
    // Get current user if userId not provided
    const currentUser = userId || auth.currentUser?.uid;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Delete from Firebase Storage
    const storagePath = `avatars/${currentUser}/${storageId}`;
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    
    // Remove from cache
    avatarUrlCache.delete(storageId);
    persistCache();
    
    return true;
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return false;
  }
};

// Generate temporary avatar URL from name
export const getTemporaryAvatarUrl = (name: string, style: string = 'avataaars'): string => {
  const seed = name.replace(/\s+/g, '-').toLowerCase();
  
  // DiceBear API paths
  const apiPaths: Record<string, string> = {
    anime: "https://api.dicebear.com/7.x/thumbs/svg",
    pixel: "https://api.dicebear.com/7.x/pixel-art/svg",
    avataaars: "https://api.dicebear.com/7.x/avataaars/svg", 
    bottts: "https://api.dicebear.com/7.x/bottts/svg",
    adventurer: "https://api.dicebear.com/7.x/adventurer/svg",
    openPeeps: "https://api.dicebear.com/7.x/open-peeps/svg",
    personas: "https://api.dicebear.com/7.x/personas/svg",
    micah: "https://api.dicebear.com/7.x/micah/svg",
  };
  
  const apiPath = apiPaths[style] || apiPaths.avataaars;
  return `${apiPath}?seed=${seed}&backgroundColor=4c1d95&radius=50`;
};

// Upload a base64 avatar image to Firebase Storage
export async function uploadAvatarImage(
  userId: string, 
  base64Data: string, 
  avatarId: string
): Promise<string> {
  try {
    // Validate inputs
    if (!userId || !base64Data || !avatarId) {
      throw new Error('Missing required parameters for avatar upload');
    }

    // Format the storage path
    const storageRef = ref(storage, `avatars/${userId}/${avatarId}`);
    
    // Remove data URL prefix if present
    const base64Content = base64Data.startsWith('data:')
      ? base64Data
      : `data:image/png;base64,${base64Data}`;
    
    // Upload the image
    await uploadString(storageRef, base64Content, 'data_url');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

// Delete an avatar image from Firebase Storage
export async function deleteAvatarImage(userId: string, avatarId: string): Promise<boolean> {
  try {
    // Validate inputs
    if (!userId || !avatarId) {
      throw new Error('Missing required parameters for avatar deletion');
    }
    
    // Format the storage path
    const storageRef = ref(storage, `avatars/${userId}/${avatarId}`);
    
    // Delete the file
    await deleteObject(storageRef);
    
    return true;
  } catch (error: unknown) {
    console.error('Error deleting avatar:', error);
    return false;
  }
} 