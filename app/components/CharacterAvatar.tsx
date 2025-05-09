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
  size?: 'small' | 'medium' | 'large';
}

export default function CharacterAvatar({ 
  avatarId, 
  name, 
  className = "",
  size = 'medium'
}: CharacterAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Size mappings
  const sizeClasses = {
    small: "w-10 h-10",
    medium: "w-20 h-20",
    large: "w-32 h-32"
  };
  
  // Generate random colors based on name
  const generateNameBasedAvatar = () => {
    try {
      // Handle missing name
      if (!name) {
        return;
      }
      
      // Generate a color based on the name
      const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash) % 360;
        // Pastel colors work well for avatars
        return `hsl(${hue}, 70%, 60%)`;
      };
      
      const backgroundColor = stringToColor(name);
      
      // Create canvas with initials
      const canvas = document.createElement('canvas');
      const size = 200; // High resolution for better quality
      canvas.width = size;
      canvas.height = size;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Fill background
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, size, size);
      
      // Add text
      context.font = `bold ${size / 2}px sans-serif`;
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      // Get initials (up to 2 characters)
      const initials = name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
      
      context.fillText(initials, size / 2, size / 2);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setAvatarUrl(dataUrl);
    } catch (error) {
      console.error('Error generating name-based avatar:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load avatar based on ID or generate one based on name
  useEffect(() => {
    const fetchAvatar = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (avatarId) {
          // For now, just generate from name as we're only fixing linting errors
          generateNameBasedAvatar();
        } else {
          // No ID, generate from name
          generateNameBasedAvatar();
        }
      } catch (fetchError) {
        console.error('Avatar fetch error:', fetchError);
        setError(fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
        setIsLoading(false);
        
        // Fallback to name-based avatar
        generateNameBasedAvatar();
      }
    };
    
    fetchAvatar();
  }, [avatarId, name]);
  
  const handleImageError = () => {
    console.error('Error loading avatar image');
    generateNameBasedAvatar();
  };
  
  // Combine user class with size class
  const avatarClasses = `rounded-full overflow-hidden shadow-lg ${sizeClasses[size]} ${className}`;
  
  return (
    <div className={avatarClasses}>
      {isLoading ? (
        <div className={`flex items-center justify-center h-full w-full bg-gray-700`}>
          <div className="animate-spin h-1/2 w-1/2 border-4 border-t-transparent border-purple-500 rounded-full"></div>
        </div>
      ) : avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={`${name}'s avatar`} 
          className="h-full w-full object-cover" 
          onError={handleImageError}
        />
      ) : (
        <div className={`flex items-center justify-center h-full w-full bg-purple-700`}>
          <span className="text-white font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
} 