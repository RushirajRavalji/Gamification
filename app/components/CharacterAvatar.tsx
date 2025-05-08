"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Anime avatar collection - same as in AvatarSelector
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

interface CharacterAvatarProps {
  avatarId?: string;
  name: string;
  className?: string;
}

export default function CharacterAvatar({ avatarId, name, className = "h-24 w-24" }: CharacterAvatarProps) {
  const avatar = avatarId ? animeAvatars.find(a => a.id === avatarId) : null;
  
  return (
    <Avatar className={`${className} border-2 border-purple-500`}>
      {avatar ? (
        <AvatarImage src={avatar.src} alt={avatar.alt} />
      ) : null}
      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-xl">
        {name.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
} 