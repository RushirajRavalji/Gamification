"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/firebase/auth";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { 
  getTemporaryAvatarUrl, 
  uploadAvatar, 
  getAvatarUrl 
} from "@/lib/firebase/avatarStorage";

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

// Validate seed to prevent injection
const sanitizeSeed = (seed: string): string => {
  // Only allow alphanumeric and hyphen
  return seed.replace(/[^a-zA-Z0-9-]/g, '');
};

export default function AvatarSelector({ currentAvatar, onAvatarChange }: { 
  currentAvatar?: string;
  onAvatarChange: (avatar: string) => void;
}) {
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "");
  const [selectedTab, setSelectedTab] = useState<string>("local");
  const [selectedStyle, setSelectedStyle] = useState("anime");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarSeeds, setAvatarSeeds] = useState<string[]>(generateAvatarSeeds(12));
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset error messages when tab changes
  useEffect(() => {
    setErrorMessage("");
    setMessage("");
  }, [selectedTab]);
  
  // Generate new random seeds when style changes
  useEffect(() => {
    setAvatarSeeds(generateAvatarSeeds(12));
  }, [selectedStyle]);
  
  // Cleanup function for pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  const updateCharacterAvatar = async (avatarId: string) => {
    if (!user) {
      setErrorMessage("You must be logged in to update your avatar");
      return;
    }
    
    try {
      setIsUpdating(true);
      setMessage("Processing avatar...");
      setProcessProgress(10);
      setErrorMessage("");
      
      // Clean up previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      // Get character document
      const characterRef = collection(db, 'users', user.uid, 'character');
      const characterDocs = await getDocs(characterRef);
      
      if (characterDocs.empty) {
        setErrorMessage("No character found");
        setIsUpdating(false);
        return;
      }
      
      setProcessProgress(20);
      
      // Get the first character document
      const characterDoc = characterDocs.docs[0];
      const characterDocRef = doc(db, 'users', user.uid, 'character', characterDoc.id);
      
      let finalAvatarId = avatarId;
      
      // For online avatars, fetch and upload to Firebase Storage
      if (avatarId.startsWith('online:')) {
        try {
          setIsProcessing(true);
          setMessage("Converting avatar...");
          setProcessProgress(30);
          
          const parts = avatarId.split(':');
          if (parts.length === 3) {
            const [_, style, rawSeed] = parts;
            
            // Sanitize seed
            const seed = sanitizeSeed(rawSeed);
            
            // Get temporary URL
            const tempUrl = getTemporaryAvatarUrl(seed, style);
            
            setProcessProgress(50);
            setMessage("Uploading to secure storage...");
            
            // Fetch image as data URL
            const response = await fetch(tempUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch avatar: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            // Convert to data URL
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            setProcessProgress(70);
            
            // Upload to Firebase Storage
            finalAvatarId = await uploadAvatar(dataUrl, user.uid, abortController.signal);
          }
        } catch (error) {
          if (abortController.signal.aborted) {
            throw new Error('Avatar update aborted');
          }
          
          console.error("Error processing avatar:", error);
          throw new Error(error instanceof Error ? error.message : "Failed to process avatar");
        } finally {
          setIsProcessing(false);
        }
      }
      
      setProcessProgress(90);
      
      // Update avatar in character document
      await updateDoc(characterDocRef, {
        avatarId: finalAvatarId,
        updatedAt: new Date()
      });
      
      setProcessProgress(100);
      
      onAvatarChange(finalAvatarId);
      setSelectedAvatar(finalAvatarId);
      setMessage("Avatar updated successfully!");
      setTimeout(() => setOpen(false), 1000);
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      console.error("Error updating avatar:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to update avatar");
      setMessage("");
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsUpdating(false);
        abortControllerRef.current = null;
      }
    }
  };
  
  // Handle online avatar selection
  const handleOnlineAvatarSelect = (style: string, seed: string) => {
    // Sanitize seed
    const sanitizedSeed = sanitizeSeed(seed);
    const onlineAvatarId = `online:${style}:${sanitizedSeed}`;
    setSelectedAvatar(onlineAvatarId);
  };

  // Get the URL for an online avatar
  const getOnlineAvatarUrl = (style: string, seed: string): string => {
    return getTemporaryAvatarUrl(sanitizeSeed(seed), style);
  };
  
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsUpdating(false);
    setIsProcessing(false);
    setMessage("");
    setErrorMessage("");
    setProcessProgress(0);
  };
  
  const handleDialogClose = (open: boolean) => {
    // If we're in the middle of updating, prevent closing
    if (isUpdating && open === false) {
      return;
    }
    
    setOpen(open);
    
    // Reset states when dialog is closed
    if (!open) {
      setErrorMessage("");
      setMessage("");
      handleCancelUpload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
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

        {errorMessage && (
          <Alert variant="destructive" className="bg-red-900/30 border-red-900 text-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="local" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full mb-4 bg-gray-700">
            <TabsTrigger value="local" className="flex-1" disabled={isUpdating}>Anime Collection</TabsTrigger>
            <TabsTrigger value="online" className="flex-1" disabled={isUpdating}>Online Avatars</TabsTrigger>
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
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${avatar.alt} avatar`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedAvatar(avatar.id);
                      e.preventDefault();
                    }
                  }}
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
                  disabled={isUpdating}
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
                    role="button"
                    tabIndex={0}
                    aria-label={`Select generated avatar ${seed}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleOnlineAvatarSelect(selectedStyle, seed);
                        e.preventDefault();
                      }
                    }}
                  >
                    <Avatar className="h-16 w-16 mb-2 border border-gray-600 overflow-hidden">
                      <AvatarImage 
                        src={getOnlineAvatarUrl(selectedStyle, seed)} 
                        alt={`Generated ${selectedStyle} avatar`}
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
              disabled={isUpdating}
            >
              Generate More Options
            </Button>
          </TabsContent>
        </Tabs>

        {message && (
          <div className="text-sm text-center my-2 text-yellow-400">
            <p>{message}</p>
            {isProcessing && (
              <div className="mt-2 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${processProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between gap-2 sm:justify-between mt-4">
          {isUpdating ? (
            <Button 
              variant="outline" 
              onClick={handleCancelUpload}
              className="border-red-700 text-red-300 hover:bg-red-900/30"
            >
              Cancel
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="border-gray-700"
            >
              Close
            </Button>
          )}
          
          <Button 
            onClick={() => updateCharacterAvatar(selectedAvatar)}
            disabled={isUpdating || !selectedAvatar}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {isUpdating ? 
              (isProcessing ? "Processing..." : "Saving...") : 
              "Save Avatar"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 