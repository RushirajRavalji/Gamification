"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

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

interface CharacterAvatarProps {
  avatarId?: string;
  name: string;
  className?: string;
  useOnlineAvatar?: boolean;
  base64Data?: string; // Base64 encoded image data
}

export default function CharacterAvatar({ 
  avatarId, 
  name, 
  className = "h-24 w-24",
  useOnlineAvatar = true,
  base64Data
}: CharacterAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Check if we have base64 data directly
  const hasBase64 = !!base64Data;
  
  // Parse the avatar ID to check if it's an online avatar
  const isOnlineAvatar = avatarId?.startsWith('online:');
  // Check if it's a base64 encoded avatar
  const isBase64Avatar = avatarId?.startsWith('base64:');
  
  // Check if it's a local avatar
  const localAvatar = (avatarId && !isOnlineAvatar && !isBase64Avatar) 
    ? animeAvatars.find(a => a.id === avatarId) 
    : null;
  
  useEffect(() => {
    // If we have base64 data or it's a base64 avatar ID, no need to fetch online
    if (hasBase64 || isBase64Avatar) return;
    
    // If it's a local avatar, no need to fetch online
    if (!useOnlineAvatar || localAvatar) return;
    
    const fetchOnlineAvatar = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        let url = '';
        
        if (isOnlineAvatar && avatarId) {
          // Parse online avatar ID (format: online:style:seed)
          const parts = avatarId.split(':');
          if (parts.length === 3) {
            const [_, style, seed] = parts;
            const apiStyle = avatarApis[style as keyof typeof avatarApis] || avatarApis.anime;
            url = `${apiStyle}?seed=${seed}&backgroundColor=4c1d95&radius=50`;
          }
        } else {
          // Generate a random avatar based on name
          const seed = name.replace(/\s+/g, '-').toLowerCase();
          
          // Choose avatar style randomly
          const apiKey = Object.keys(avatarApis)[Math.floor(Math.random() * Object.keys(avatarApis).length)];
          const apiUrl = avatarApis[apiKey as keyof typeof avatarApis];
          
          // Generate avatar URL with options
          url = `${apiUrl}?seed=${seed}&backgroundColor=4c1d95&radius=50`;
        }
        
        setAvatarUrl(url);
      } catch (error) {
        console.error("Error fetching avatar:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOnlineAvatar();
  }, [avatarId, name, useOnlineAvatar, localAvatar, isOnlineAvatar, isBase64Avatar, hasBase64]);
  
  // Extract base64 data from avatarId if it's in base64 format
  const extractBase64FromId = (): string | null => {
    if (!isBase64Avatar || !avatarId) return null;
    
    // Format is "base64:imageData"
    const parts = avatarId.split(":");
    if (parts.length >= 2) {
      return parts.slice(1).join(":");
    }
    return null;
  };
  
  // Determine the image source
  const getImageSource = () => {
    if (hasBase64) {
      return base64Data;
    } else if (isBase64Avatar) {
      return extractBase64FromId();
    } else if (localAvatar) {
      return localAvatar.src;
    } else if (avatarUrl) {
      return avatarUrl;
    }
    return null;
  };
  
  const imageSource = getImageSource();
  
  return (
    <Avatar className={`${className} relative border-2 border-purple-500 overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
          <span className="sr-only">Loading avatar...</span>
        </div>
      )}
      
      {imageSource ? (
        <AvatarImage 
          src={imageSource} 
          alt={localAvatar?.alt || name} 
          className={isOnlineAvatar || isBase64Avatar ? "scale-110" : ""}
        />
      ) : null}
      
      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-xl">
        {name.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
} 