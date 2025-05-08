"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/firebase/auth";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

// Anime avatar collection
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

export default function AvatarSelector({ currentAvatar, onAvatarChange }: { 
  currentAvatar?: string;
  onAvatarChange: (avatar: string) => void;
}) {
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const updateCharacterAvatar = async (avatarId: string) => {
    if (!user) {
      setMessage("You must be logged in to update your avatar");
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Get character document
      const characterRef = collection(db, 'users', user.uid, 'character');
      const characterDocs = await getDocs(characterRef);
      
      if (characterDocs.empty) {
        setMessage("No character found");
        setIsUpdating(false);
        return;
      }
      
      // Get the first character document
      const characterDoc = characterDocs.docs[0];
      const characterDocRef = doc(db, 'users', user.uid, 'character', characterDoc.id);
      
      // Update avatar
      await updateDoc(characterDocRef, {
        avatarId: avatarId,
        updatedAt: new Date()
      });
      
      onAvatarChange(avatarId);
      setSelectedAvatar(avatarId);
      setMessage("Avatar updated successfully!");
      setOpen(false);
    } catch (error) {
      console.error("Error updating avatar:", error);
      setMessage("Failed to update avatar");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderAvatar = (avatarId: string) => {
    const avatar = animeAvatars.find(a => a.id === avatarId);
    if (!avatar) {
      return (
        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-xl">
          ?
        </AvatarFallback>
      );
    }
    
    return (
      <>
        <AvatarImage src={avatar.src} alt={avatar.alt} />
        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-xl">
          {avatar.alt.substring(0, 2)}
        </AvatarFallback>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          Change Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          {animeAvatars.map((avatar) => (
            <div 
              key={avatar.id}
              className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all
                ${selectedAvatar === avatar.id ? 'bg-purple-800 ring-2 ring-purple-500' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => setSelectedAvatar(avatar.id)}
            >
              <Avatar className="h-16 w-16 mb-2">
                <AvatarImage src={avatar.src} alt={avatar.alt} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
                  {avatar.alt.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">{avatar.alt}</p>
              <p className="text-xs text-gray-400">{avatar.series}</p>
            </div>
          ))}
        </div>

        {message && (
          <p className="text-sm text-center my-2 text-yellow-400">{message}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => updateCharacterAvatar(selectedAvatar)}
            disabled={isUpdating || !selectedAvatar}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isUpdating ? "Updating..." : "Save Avatar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 