"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CharacterRadarChart from "@/app/components/CharacterRadarChart";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { useAuth } from "@/lib/firebase/auth";
import ResetCharacter from "@/app/components/ResetCharacter";
import CharacterAvatar from "@/app/components/CharacterAvatar";
import AvatarSelector from "@/app/components/AvatarSelector";

export default function CharacterPage() {
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading, fetchCharacter } = useCharacter();
  const [selectedTab, setSelectedTab] = useState("overview");
  
  const handleAvatarChange = async (avatarId: string) => {
    // Reload character data after avatar change
    await fetchCharacter();
  };
  
  if (authLoading || characterLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-purple-600 rounded-full mb-4"></div>
          <div className="h-8 w-48 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-36 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || !character) {
    return <div className="flex justify-center items-center h-screen">Please log in to view your character</div>;
  }

  // Calculate total stats (base + equipment)
  const totalStats = { ...character.stats };
  
  // Mock achievements and equipment until we implement them properly
  const achievements = [
    { id: "a1", name: "First Steps", description: "Created your character" },
  ];
  
  const equipmentSlots = [
    { type: "Weapon", name: "", bonus: "", rarity: "", equipped: false },
    { type: "Armor", name: "", bonus: "", rarity: "", equipped: false },
    { type: "Accessory", name: "", bonus: "", rarity: "", equipped: false },
    { type: "Helm", name: "", bonus: "", rarity: "", equipped: false },
    { type: "Gloves", name: "", bonus: "", rarity: "", equipped: false },
  ];
  
  const classProgress = [
    { name: "Novice", level: 1, completed: character.level >= 1 },
    { name: "Warrior", level: 5, completed: character.level >= 5 },
    { name: "Guardian", level: 15, completed: character.level >= 15 },
    { name: "Champion", level: 25, completed: character.level >= 25 },
    { name: "Legend", level: 40, completed: character.level >= 40 },
  ];

  return (
    <div className="relative">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(60,20,120,0.3),transparent_70%)] pointer-events-none"></div>
      
      <h1 className="text-3xl font-bold mb-6 text-center relative">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Character Sheet
        </span>
      </h1>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setSelectedTab} value={selectedTab}>
        <TabsList className="mb-6 w-full justify-center bg-gray-800/60 backdrop-blur-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-800">Overview</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-purple-800">Stats & Skills</TabsTrigger>
          <TabsTrigger value="equipment" className="data-[state=active]:bg-purple-800">Equipment</TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-purple-800">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Character Identity */}
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 md:col-span-2 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-300">
                  <span className="mr-2">⚔️</span> Hero Identity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <div className="flex flex-col items-center">
                    <CharacterAvatar 
                      avatarId={character.avatarId} 
                      name={character.name} 
                    />
                    <AvatarSelector 
                      currentAvatar={character.avatarId} 
                      onAvatarChange={handleAvatarChange} 
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                        {character.name}
                      </h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-purple-800/80 backdrop-blur-sm">
                          Level {character.level}
                        </Badge>
                        <Badge variant="outline" className="border-purple-500/50">
                          {character.class}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>XP to next level</span>
                        <span>{character.xp} / {character.xpToNextLevel}</span>
                      </div>
                      <Progress 
                        value={(character.xp / character.xpToNextLevel) * 100} 
                        className="h-2 bg-gray-700"
                        indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Path */}
            <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-300">
                  <span className="mr-2">✨</span> Class Path
                </CardTitle>
                <CardDescription>Your evolving heroic journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classProgress.map((classStage, index) => (
                    <div key={classStage.name} className="relative">
                      <div className={`flex items-center space-x-3 ${classStage.completed ? 'text-white' : 'text-gray-500'}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                          classStage.completed 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-700/30' 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{classStage.name}</p>
                          <p className="text-xs">Level {classStage.level}</p>
                        </div>
                      </div>
                      {index < classProgress.length - 1 && (
                        <div className={`absolute left-3 top-6 w-0.5 h-5 ${
                          classStage.completed ? 'bg-gradient-to-b from-purple-600 to-pink-600' : 'bg-gray-700'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-300">
                <span className="mr-2">📊</span> Character Stats
              </CardTitle>
              <CardDescription>Your hero&apos;s capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mb-6">
                <CharacterRadarChart stats={totalStats} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(totalStats).map(([stat, value]) => (
                  <div key={stat} className="space-y-1">
                    <div className="flex justify-between text-sm capitalize">
                      <span>{stat}</span>
                      <span>{value}</span>
                    </div>
                    <Progress 
                      value={(value / 20) * 100} 
                      className="h-2 bg-gray-700"
                      indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600"
                    />
                    <p className="text-xs text-gray-400">
                      {stat === 'strength' && 'Physical power and endurance'}
                      {stat === 'intelligence' && 'Learning capacity and problem solving'}
                      {stat === 'focus' && 'Concentration and attention to detail'}
                      {stat === 'dexterity' && 'Coordination and reflexes'}
                      {stat === 'willpower' && 'Mental fortitude and discipline'}
                      {stat === 'influence' && 'Social impact and leadership'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-300">
                <span className="mr-2">🛡️</span> Equipment
              </CardTitle>
              <CardDescription>Gear that enhances your abilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipmentSlots.map((slot) => (
                  <div 
                    key={slot.type} 
                    className={`p-4 rounded-lg border transition-all ${
                      slot.equipped 
                        ? 'border-purple-600 bg-gray-700/60 backdrop-blur-sm shadow-md shadow-purple-700/20' 
                        : 'border-gray-700 bg-gray-800/60 backdrop-blur-sm opacity-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-400">{slot.type}</p>
                        <p className="font-medium">
                          {slot.equipped ? slot.name : `No ${slot.type} Equipped`}
                        </p>
                        {slot.equipped && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-green-400">{slot.bonus}</span>
                            <Badge variant="outline" className={`text-xs ${
                              slot.rarity === 'Common' ? 'border-gray-500 text-gray-300' :
                              slot.rarity === 'Uncommon' ? 'border-green-500 text-green-300' :
                              slot.rarity === 'Rare' ? 'border-blue-500 text-blue-300' :
                              slot.rarity === 'Epic' ? 'border-purple-500 text-purple-300' :
                              'border-amber-500 text-amber-300'
                            }`}>
                              {slot.rarity}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {slot.equipped ? (
                        <button className="text-xs text-gray-400 hover:text-white transition-colors">
                          Change
                        </button>
                      ) : (
                        <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                          Equip
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-300">
                <span className="mr-2">🏆</span> Achievements
              </CardTitle>
              <CardDescription>Your heroic accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className="p-4 rounded-lg bg-gray-700/60 backdrop-blur-sm border border-gray-600 shadow-md shadow-purple-700/10 transition-transform hover:scale-105"
                  >
                    <h3 className="font-bold text-lg text-amber-300">{achievement.name}</h3>
                    <p className="text-gray-300 text-sm">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResetCharacter />
    </div>
  );
} 