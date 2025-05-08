"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CharacterAvatar from "./CharacterAvatar";
import AvatarSelector from "./AvatarSelector";

export default function AvatarTestComponent() {
  const [currentAvatar, setCurrentAvatar] = useState<string | undefined>(undefined);
  const [characterName, setCharacterName] = useState("Hero");
  
  const handleAvatarChange = (avatarId: string) => {
    setCurrentAvatar(avatarId);
  };
  
  // Determine avatar type for display
  const getAvatarType = (avatarId?: string) => {
    if (!avatarId) return "No Avatar";
    if (avatarId.startsWith("base64:")) return "Base64 Encoded";
    if (avatarId.startsWith("online:")) return "Online Generated";
    return "Local Image";
  };
  
  return (
    <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 md:col-span-2 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
      <CardHeader>
        <CardTitle className="flex items-center text-purple-300">
          Avatar System Demo
        </CardTitle>
        <CardDescription>
          Select an avatar from local collection or generate one online
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Main character display */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-3">Main Character Display</h3>
            <CharacterAvatar 
              avatarId={currentAvatar} 
              name={characterName}
              className="h-32 w-32" 
            />
            <AvatarSelector 
              currentAvatar={currentAvatar} 
              onAvatarChange={handleAvatarChange} 
            />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">When you select an avatar, it will be synced to sidebar</p>
            </div>
          </div>
          
          {/* Sidebar preview */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-3">Sidebar Preview</h3>
            <div className="w-full max-w-xs bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-lg">
              <div className="flex items-center space-x-3">
                <CharacterAvatar 
                  avatarId={currentAvatar} 
                  name={characterName}
                  className="h-12 w-12" 
                />
                <div>
                  <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                    {characterName}
                  </h3>
                  <p className="text-sm text-gray-400">Lvl 1 Novice</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Badge className="bg-purple-700">
                Avatar Type: {getAvatarType(currentAvatar)}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-700/40 rounded-lg border border-gray-600 mt-6">
          <h3 className="text-lg font-medium mb-3">Storage Details</h3>
          <p className="text-sm text-gray-300 mb-2">
            When you select an online avatar, it's converted to base64 for storage in Firebase.
            This eliminates the need to call external APIs repeatedly and ensures your avatar is always available.
          </p>
          
          {currentAvatar?.startsWith("base64:") && (
            <div className="bg-gray-800/80 p-2 rounded text-xs text-gray-400 mt-2 max-h-20 overflow-y-auto">
              <p>Base64 Data Preview (truncated):</p>
              <code>{currentAvatar.slice(0, 100)}...{currentAvatar.slice(-20)}</code>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <Card className="bg-gray-700/60 border-gray-600">
            <CardContent className="pt-4 flex flex-col items-center">
              <CharacterAvatar name="Rogue" avatarId="online:pixel:character1" className="h-16 w-16" />
              <p className="mt-2 text-sm">Online Pixel Avatar</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700/60 border-gray-600">
            <CardContent className="pt-4 flex flex-col items-center">
              <CharacterAvatar name="Mage" avatarId="online:adventurer:magic22" className="h-16 w-16" />
              <p className="mt-2 text-sm">Online Adventurer Avatar</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700/60 border-gray-600">
            <CardContent className="pt-4 flex flex-col items-center">
              <CharacterAvatar name="Warrior" avatarId="online:bottts:robot87" className="h-16 w-16" />
              <p className="mt-2 text-sm">Online Robot Avatar</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
} 