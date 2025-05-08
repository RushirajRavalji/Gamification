"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Online avatar styles from DiceBear
const onlineAvatarStyles = [
  { id: "anime", name: "Anime", apiPath: "https://api.dicebear.com/7.x/thumbs/svg" },
  { id: "pixel", name: "Pixel", apiPath: "https://api.dicebear.com/7.x/pixel-art/svg" },
  { id: "avataaars", name: "Avataaars", apiPath: "https://api.dicebear.com/7.x/avataaars/svg" },
  { id: "bottts", name: "Robots", apiPath: "https://api.dicebear.com/7.x/bottts/svg" },
  { id: "adventurer", name: "Adventurer", apiPath: "https://api.dicebear.com/7.x/adventurer/svg" },
  { id: "openPeeps", name: "Peeps", apiPath: "https://api.dicebear.com/7.x/open-peeps/svg" },
  { id: "personas", name: "Personas", apiPath: "https://api.dicebear.com/7.x/personas/svg" },
  { id: "micah", name: "Micah", apiPath: "https://api.dicebear.com/7.x/micah/svg" },
];

// Generate random seeds for online avatars
const generateAvatarSeeds = (count = 12) => {
  const seeds = [];
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < count; i++) {
    let seed = '';
    for (let j = 0; j < 8; j++) {
      seed += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    seeds.push(seed);
  }
  
  return seeds;
};

// Convert image URL to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching image as base64:", error);
    return null;
  }
}

export default function AvatarSelector({ currentAvatar, onAvatarChange }: { 
  currentAvatar?: string;
  onAvatarChange: (avatar: string) => void;
}) {
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "");
  const [selectedTab, setSelectedTab] = useState<string>("local");
  const [selectedStyle, setSelectedStyle] = useState("anime");
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarSeeds, setAvatarSeeds] = useState<string[]>(generateAvatarSeeds(12));
  const [base64Cache, setBase64Cache] = useState<Record<string, string>>({});
  
  // Generate new random seeds when style changes
  useEffect(() => {
    setAvatarSeeds(generateAvatarSeeds(12));
  }, [selectedStyle]);
  
  const updateCharacterAvatar = async (avatarId: string) => {
    if (!user) {
      setMessage("You must be logged in to update your avatar");
      return;
    }
    
    try {
      setIsUpdating(true);
      setMessage("Processing avatar...");
      
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
      
      let finalAvatarId = avatarId;
      
      // If it's an online avatar, convert to base64 and store
      if (avatarId.startsWith('online:')) {
        const parts = avatarId.split(':');
        if (parts.length === 3) {
          const [_, style, seed] = parts;
          
          // Check if we already have this avatar in cache
          if (base64Cache[avatarId]) {
            finalAvatarId = `base64:${base64Cache[avatarId]}`;
          } else {
            // Generate avatar URL
            const apiPath = onlineAvatarStyles.find(s => s.id === style)?.apiPath;
            if (apiPath) {
              const url = `${apiPath}?seed=${seed}&backgroundColor=4c1d95&radius=50`;
              
              // Convert to base64
              const base64Data = await fetchImageAsBase64(url);
              if (base64Data) {
                // Store in cache for future use
                setBase64Cache(prev => ({ ...prev, [avatarId]: base64Data }));
                finalAvatarId = `base64:${base64Data}`;
              }
            }
          }
        }
      }
      
      // Update avatar
      await updateDoc(characterDocRef, {
        avatarId: finalAvatarId,
        updatedAt: new Date()
      });
      
      onAvatarChange(finalAvatarId);
      setSelectedAvatar(finalAvatarId);
      setMessage("Avatar updated successfully!");
      setOpen(false);
    } catch (error) {
      console.error("Error updating avatar:", error);
      setMessage("Failed to update avatar");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle online avatar selection (style:seed format)
  const handleOnlineAvatarSelect = (style: string, seed: string) => {
    const onlineAvatarId = `online:${style}:${seed}`;
    setSelectedAvatar(onlineAvatarId);
  };

  const getAvatarUrl = (style: string, seed: string) => {
    const apiPath = onlineAvatarStyles.find(s => s.id === style)?.apiPath;
    return `${apiPath}?seed=${seed}&backgroundColor=4c1d95&radius=50`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          Change Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[675px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select from local anime avatars or generate an online avatar
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="local" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full mb-4 bg-gray-700">
            <TabsTrigger value="local" className="flex-1">Anime Collection</TabsTrigger>
            <TabsTrigger value="online" className="flex-1">Online Avatars</TabsTrigger>
          </TabsList>
          
          <TabsContent value="local" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {animeAvatars.map((avatar) => (
                <div 
                  key={avatar.id}
                  className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all
                    ${selectedAvatar === avatar.id 
                      ? 'bg-gradient-to-br from-purple-800/80 to-purple-900/80 ring-2 ring-purple-500 shadow-lg' 
                      : 'bg-gray-700/80 hover:bg-gray-600/80'}`}
                  onClick={() => setSelectedAvatar(avatar.id)}
                >
                  <Avatar className="h-16 w-16 mb-2 border border-gray-600">
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
          </TabsContent>
          
          <TabsContent value="online" className="space-y-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {onlineAvatarStyles.map((style) => (
                <Button
                  key={style.id}
                  variant={selectedStyle === style.id ? "default" : "outline"}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`text-sm px-3 ${selectedStyle === style.id ? 'bg-purple-700' : 'bg-gray-700/50'}`}
                >
                  {style.name}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {avatarSeeds.map((seed) => {
                const avatarId = `online:${selectedStyle}:${seed}`;
                const isSelected = selectedAvatar === avatarId;
                
                return (
                  <div 
                    key={seed}
                    className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-gradient-to-br from-purple-800/80 to-purple-900/80 ring-2 ring-purple-500 shadow-lg' 
                        : 'bg-gray-700/80 hover:bg-gray-600/80'}`}
                    onClick={() => handleOnlineAvatarSelect(selectedStyle, seed)}
                  >
                    <Avatar className="h-16 w-16 mb-2 border border-gray-600 overflow-hidden">
                      <AvatarImage 
                        src={getAvatarUrl(selectedStyle, seed)} 
                        alt="Generated Avatar"
                        className="scale-110"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
                        ?
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-gray-400 mt-1">Avatar #{seed.substring(0, 4)}</p>
                  </div>
                );
              })}
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setAvatarSeeds(generateAvatarSeeds(12))}
              className="w-full mt-2"
            >
              Generate More Options
            </Button>
          </TabsContent>
        </Tabs>

        {message && (
          <p className="text-sm text-center my-2 text-yellow-400">{message}</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-700">
            Cancel
          </Button>
          <Button 
            onClick={() => updateCharacterAvatar(selectedAvatar)}
            disabled={isUpdating || !selectedAvatar}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isUpdating ? "Processing..." : "Save Avatar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 