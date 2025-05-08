"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getTemporaryAvatarUrl } from "@/lib/firebase/avatarStorage";

// Local anime avatar collection for fallback
const animeAvatars = [
  { id: "naruto1", src: "/avatars/naruto1.jpg", alt: "Naruto", series: "Naruto" },
  { id: "naruto2", src: "/avatars/naruto2.jpg", alt: "Sasuke", series: "Naruto" },
  { id: "onepiece1", src: "/avatars/onepiece1.jpg", alt: "Luffy", series: "One Piece" },
  { id: "onepiece2", src: "/avatars/onepiece2.jpg", alt: "Zoro", series: "One Piece" },
  { id: "sololeveling1", src: "/avatars/sololeveling1.jpg", alt: "Sung Jin-Woo", series: "Solo Leveling" },
  { id: "sololeveling2", src: "/avatars/sololeveling2.jpg", alt: "Shadow Monarch", series: "Solo Leveling" },
  { id: "bluelock1", src: "/avatars/bluelock1.jpg", alt: "Isagi", series: "Blue Lock" },
  { id: "bluelock2", src: "/avatars/bluelock2.jpg", alt: "Bachira", series: "Blue Lock" },
];

// Online avatar APIs
const avatarApis = {
  anime: "https://api.dicebear.com/7.x/thumbs/svg",
  pixel: "https://api.dicebear.com/7.x/pixel-art/svg",
  avataaars: "https://api.dicebear.com/7.x/avataaars/svg",
  bottts: "https://api.dicebear.com/7.x/bottts/svg",
  adventurer: "https://api.dicebear.com/7.x/adventurer/svg",
  openPeeps: "https://api.dicebear.com/7.x/open-peeps/svg",
  personas: "https://api.dicebear.com/7.x/personas/svg",
};

// Preload image function
const preloadImage = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = (e) => reject(new Error(`Failed to preload image: ${e}`));
    img.src = src;
  });
};

interface CharacterAvatarProps {
  avatarId?: string;
  name: string;
  className?: string;
  useOnlineAvatar?: boolean;
  base64Data?: string; // Base64 encoded image data
  userId?: string; // User ID for storage lookup
}

export default function CharacterAvatar({ 
  avatarId, 
  name, 
  className = "h-24 w-24",
  useOnlineAvatar = true,
  base64Data,
  userId
}: CharacterAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;
  
  // Check if we have base64 data directly
  const hasBase64 = !!base64Data;
  
  // Parse the avatar ID to check its type
  const isLocalAvatar = avatarId && animeAvatars.some(a => a.id === avatarId);
  const isOnlineAvatar = avatarId?.startsWith('online:');
  const isBase64Avatar = avatarId?.startsWith('base64:');
  const isStorageAvatar = avatarId?.startsWith('storage:');
  
  // Find local avatar if it's a local avatar ID
  const localAvatar = isLocalAvatar 
    ? animeAvatars.find(a => a.id === avatarId) 
    : null;
  
  // Cleanup function to abort any pending requests
  const cleanupRequests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  useEffect(() => {
    // If we have direct base64 data, use it
    if (hasBase64) {
      setAvatarUrl(base64Data);
      return;
    }
    
    // If it's a local avatar, use its src
    if (localAvatar) {
      setAvatarUrl(localAvatar.src);
      return;
    }
    
    // If not using online avatar or no avatarId, create fallback
    if (!useOnlineAvatar || !avatarId) {
      setAvatarUrl(null);
      return;
    }
    
    // For other avatar types, we need to fetch
    const fetchAvatar = async () => {
      cleanupRequests();
      
      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);
      
      // Setup timeout
      const TIMEOUT_DURATION = 15000; // 15 seconds
      timeoutRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setErrorMessage("Avatar loading timed out. Using fallback.");
          setHasError(true);
          setIsLoading(false);
          
          // Generate fallback
          try {
            setAvatarUrl(getTemporaryAvatarUrl(name));
          } catch (e) {
            setAvatarUrl(null);
          }
          
          // Clean up refs
          abortControllerRef.current = null;
          timeoutRef.current = null;
        }
      }, TIMEOUT_DURATION);
      
      try {
        let url: string | null = null;
        
        if (isBase64Avatar && avatarId) {
          // Base64 avatars can be used directly
          const base64Data = avatarId.substring(7);
          url = base64Data;
        } 
        else if (isStorageAvatar) {
          // Get URL from Firebase Storage
          try {
            url = await getAvatarUrl(avatarId, userId);
            
            // Try to preload the image
            if (url) {
              try {
                await preloadImage(url);
              } catch (preloadError) {
                console.warn("Failed to preload image:", preloadError);
                // Continue anyway, the AvatarImage component will handle load errors
              }
            }
          } catch (storageError) {
            console.error("Storage avatar fetch error:", storageError);
            throw storageError;
          }
        }
        else if (isOnlineAvatar) {
          // Parse online avatar ID (format: online:style:seed)
          const parts = avatarId.split(':');
          if (parts.length === 3) {
            const [_, style, seed] = parts;
            url = getTemporaryAvatarUrl(seed, style);
          }
        } 
        else {
          // Generate one based on name
          url = getTemporaryAvatarUrl(name);
        }
        
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }
        
        // Clear timeout since we succeeded
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setAvatarUrl(url);
        // Reset retry count on success
        retryCountRef.current = 0;
      } catch (error) {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }
        
        console.error("Error fetching avatar:", error);
        
        // Clear timeout since we handled the error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Retry logic for network/timeout errors - only for storage avatars
        if (isStorageAvatar && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.warn(`Retrying avatar fetch (${retryCountRef.current}/${MAX_RETRIES})...`);
          
          // Wait before retrying
          setTimeout(() => {
            if (!abortController.signal.aborted) {
              fetchAvatar();
            }
          }, 1000);
          return;
        }
        
        setHasError(true);
        
        // Special handling for timeout errors
        if (error instanceof Error && error.message.includes('timed out')) {
          setErrorMessage("Avatar loading timed out. Using fallback.");
          console.warn("Avatar fetch timed out, using fallback for:", avatarId);
        } else {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load avatar");
        }
        
        // Set fallback avatar
        if (name) {
          try {
            setAvatarUrl(getTemporaryAvatarUrl(name));
          } catch (e) {
            setAvatarUrl(null);
          }
        } else {
          setAvatarUrl(null);
        }
      } finally {
        // Check if request was aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }
    };
    
    fetchAvatar();
    
    // Cleanup function
    return cleanupRequests;
  }, [avatarId, name, useOnlineAvatar, localAvatar, isOnlineAvatar, isBase64Avatar, hasBase64, base64Data, isStorageAvatar, userId, isLocalAvatar]);
  
  return (
    <Avatar className={`${className} relative border-2 border-purple-500 overflow-hidden`} aria-label={`Avatar for ${name}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
          <span className="sr-only">Loading avatar...</span>
        </div>
      )}
      
      {avatarUrl ? (
        <AvatarImage 
          src={avatarUrl} 
          alt={localAvatar?.alt || `${name}'s avatar`} 
          className={(isOnlineAvatar || isBase64Avatar || isStorageAvatar) ? "scale-110" : ""}
          onError={() => {
            setHasError(true);
            setAvatarUrl(null);
          }}
        />
      ) : null}
      
      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-xl">
        {name.substring(0, 2).toUpperCase()}
      </AvatarFallback>
      
      {hasError && errorMessage && (
        <div className="absolute inset-0 bg-gray-900/75 flex items-center justify-center text-xs text-red-300 p-1 text-center">
          Error
        </div>
      )}
    </Avatar>
  );
} 