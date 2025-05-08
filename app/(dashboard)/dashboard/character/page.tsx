"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function CharacterPage() {
  // Mock character data
  const character = {
    name: "HeroName",
    level: 5,
    xp: 750,
    xpToNextLevel: 1000,
    class: "Warrior",
    stats: {
      strength: 12,
      intelligence: 15,
      focus: 10,
      dexterity: 8,
      willpower: 14,
      influence: 9,
    },
    achievements: [
      { id: "a1", name: "First Blood", description: "Completed your first quest" },
      { id: "a2", name: "Consistent Hero", description: "Maintained a 5-day streak" },
      { id: "a3", name: "Mind Over Matter", description: "Completed 10 intelligence-based quests" },
    ],
    equipmentSlots: [
      { type: "Weapon", name: "Novice's Training Sword", bonus: "+2 Strength", rarity: "Common", equipped: true },
      { type: "Armor", name: "Disciplined Mind Robe", bonus: "+3 Willpower", rarity: "Uncommon", equipped: true },
      { type: "Accessory", name: "Focus Pendant", bonus: "+1 Focus", rarity: "Common", equipped: true },
      { type: "Helm", name: "", bonus: "", rarity: "", equipped: false },
      { type: "Gloves", name: "", bonus: "", rarity: "", equipped: false },
    ],
    classProgress: [
      { name: "Novice", level: 1, completed: true },
      { name: "Warrior", level: 5, completed: true },
      { name: "Guardian", level: 15, completed: false },
      { name: "Champion", level: 25, completed: false },
      { name: "Legend", level: 40, completed: false },
    ]
  };

  // Calculate total stats (base + equipment)
  const totalStats = { ...character.stats };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Character Sheet</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Stats & Skills</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Character Identity */}
            <Card className="bg-gray-800 border-gray-700 md:col-span-2">
              <CardHeader>
                <CardTitle>Hero Identity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <Avatar className="h-24 w-24 border-2 border-purple-500">
                    <AvatarImage src="/avatar.png" />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-xl">
                      {character.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">{character.name}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-purple-800">Level {character.level}</Badge>
                        <Badge variant="outline">{character.class}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>XP to next level</span>
                        <span>{character.xp} / {character.xpToNextLevel}</span>
                      </div>
                      <Progress value={(character.xp / character.xpToNextLevel) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Path */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Class Path</CardTitle>
                <CardDescription>Your evolving heroic journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {character.classProgress.map((classStage, index) => (
                    <div key={classStage.name} className="relative">
                      <div className={`flex items-center space-x-3 ${classStage.completed ? 'text-white' : 'text-gray-500'}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                          classStage.completed 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{classStage.name}</p>
                          <p className="text-xs">Level {classStage.level}</p>
                        </div>
                      </div>
                      {index < character.classProgress.length - 1 && (
                        <div className={`absolute left-3 top-6 w-0.5 h-5 ${
                          classStage.completed ? 'bg-green-600' : 'bg-gray-700'
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
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Character Stats</CardTitle>
              <CardDescription>Your hero&apos;s capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.entries(totalStats).map(([stat, value]) => (
                  <div key={stat} className="space-y-1">
                    <div className="flex justify-between text-sm capitalize">
                      <span>{stat}</span>
                      <span>{value}</span>
                    </div>
                    <Progress value={(value / 20) * 100} className="h-2" />
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
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
              <CardDescription>Gear that enhances your abilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {character.equipmentSlots.map((slot) => (
                  <div 
                    key={slot.type} 
                    className={`p-4 rounded-lg border ${
                      slot.equipped 
                        ? 'border-purple-600 bg-gray-700' 
                        : 'border-gray-700 bg-gray-800 opacity-50'
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
                      {slot.equipped && (
                        <button className="text-xs text-gray-400 hover:text-white">Change</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your heroic accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {character.achievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 rounded-lg bg-gray-700 border border-gray-600">
                    <h3 className="font-bold text-lg">{achievement.name}</h3>
                    <p className="text-gray-300 text-sm">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 