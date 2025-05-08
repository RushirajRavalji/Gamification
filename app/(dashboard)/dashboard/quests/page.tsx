"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

// Define types for our quest data
interface BaseQuest {
  id: string;
  title: string;
  description: string;
  type: string;
  xpReward: number;
  deadline: string;
  category: string;
}

interface DailyQuest extends BaseQuest {
  type: "Daily";
  completed: boolean;
}

interface SideQuest extends BaseQuest {
  type: "SideQuest";
  completed: boolean;
}

interface DungeonTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Dungeon extends BaseQuest {
  type: "Dungeon";
  progress: number;
  tasks: DungeonTask[];
}

interface BossFight extends BaseQuest {
  type: "BossFight";
  progress: number;
  validation: string;
}

export default function QuestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock quest data
  const dailyQuests: DailyQuest[] = [
    { id: "d1", title: "Morning Physical Training", description: "Complete a 30-minute workout session", type: "Daily", xpReward: 50, completed: false, deadline: "Today", category: "Body" },
    { id: "d2", title: "Study Focus Session", description: "Spend 1 hour learning a new skill", type: "Daily", xpReward: 40, completed: true, deadline: "Today", category: "Mind" },
    { id: "d3", title: "Evening Meditation", description: "Meditate for 15 minutes before sleep", type: "Daily", xpReward: 30, completed: false, deadline: "Today", category: "Mind" },
    { id: "d4", title: "Healthy Meal Preparation", description: "Cook a balanced meal with protein and vegetables", type: "Daily", xpReward: 35, completed: false, deadline: "Today", category: "Body" },
  ];

  const sideQuests: SideQuest[] = [
    { id: "s1", title: "Weekly Run Challenge", description: "Run 5km outdoors", type: "SideQuest", xpReward: 100, deadline: "2 days", completed: false, category: "Body" },
    { id: "s2", title: "Language Practice", description: "Practice a foreign language for 30 minutes", type: "SideQuest", xpReward: 80, deadline: "3 days", completed: false, category: "Mind" },
    { id: "s3", title: "Networking Call", description: "Reach out to a professional in your field", type: "SideQuest", xpReward: 120, deadline: "5 days", completed: false, category: "Career" },
  ];

  const dungeons: Dungeon[] = [
    { 
      id: "dg1", 
      title: "Deep Work Dungeon", 
      description: "Complete 3 focused work sessions of 25 minutes each with no distractions", 
      type: "Dungeon", 
      xpReward: 200, 
      progress: 33, 
      deadline: "3 days",
      tasks: [
        { id: "dg1t1", title: "Session 1", completed: true },
        { id: "dg1t2", title: "Session 2", completed: false },
        { id: "dg1t3", title: "Session 3", completed: false },
      ],
      category: "Mind"
    },
    { 
      id: "dg2", 
      title: "Strength Training Gauntlet", 
      description: "Complete a full strength workout routine with progressive overload", 
      type: "Dungeon", 
      xpReward: 250, 
      progress: 50, 
      deadline: "5 days",
      tasks: [
        { id: "dg2t1", title: "Upper Body", completed: true },
        { id: "dg2t2", title: "Lower Body", completed: true },
        { id: "dg2t3", title: "Core Workout", completed: false },
        { id: "dg2t4", title: "Recovery Session", completed: false },
      ],
      category: "Body"
    },
  ];

  const bossFights: BossFight[] = [
    { 
      id: "b1", 
      title: "Portfolio Website Launch", 
      description: "Design, build, and publish your personal portfolio website", 
      type: "BossFight", 
      xpReward: 500, 
      progress: 65, 
      deadline: "2 weeks",
      validation: "GitHub repository link and live site URL",
      category: "Career"
    },
    { 
      id: "b2", 
      title: "Marathon Preparation", 
      description: "Train for and complete a half-marathon distance run", 
      type: "BossFight", 
      xpReward: 750, 
      progress: 40, 
      deadline: "3 weeks",
      validation: "Strava activity with GPS tracking",
      category: "Body"
    },
  ];

  // Filter quests based on search term
  const filterQuests = <T extends BaseQuest>(quests: T[]): T[] => {
    if (!searchTerm) return quests;
    return quests.filter(quest => 
      quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredDaily = filterQuests(dailyQuests);
  const filteredSide = filterQuests(sideQuests);
  const filteredDungeons = filterQuests(dungeons);
  const filteredBoss = filterQuests(bossFights);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Quest Log</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input 
            placeholder="Search quests..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
            Create New Quest
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Daily Quests</TabsTrigger>
          <TabsTrigger value="side">Side Quests</TabsTrigger>
          <TabsTrigger value="dungeons">Dungeons</TabsTrigger>
          <TabsTrigger value="boss">Boss Fights</TabsTrigger>
        </TabsList>

        {/* Daily Quests Tab */}
        <TabsContent value="daily">
          {filteredDaily.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No daily quests match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDaily.map((quest) => (
                <Card key={quest.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input 
                          type="checkbox" 
                          checked={quest.completed} 
                          className="h-5 w-5 mt-1 rounded border-gray-500 text-purple-600 focus:ring-purple-600"
                        />
                        <div className="space-y-1">
                          <h3 className={`font-medium ${quest.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                            {quest.title}
                          </h3>
                          <p className="text-sm text-gray-400">{quest.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {quest.type}
                            </Badge>
                            <Badge className={`text-xs ${
                              quest.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                              quest.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                              'bg-green-900 hover:bg-green-800'
                            }`}>
                              {quest.category}
                            </Badge>
                            <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                            <span className="text-xs text-gray-400">Due: {quest.deadline}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant={quest.completed ? "outline" : "default"}>
                        {quest.completed ? "View" : "Complete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Side Quests Tab */}
        <TabsContent value="side">
          {filteredSide.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No side quests match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSide.map((quest) => (
                <Card key={quest.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-medium text-white">{quest.title}</h3>
                        <p className="text-sm text-gray-400">{quest.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs bg-purple-900 text-purple-200">
                            {quest.type}
                          </Badge>
                          <Badge className={`text-xs ${
                            quest.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                            quest.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                            'bg-green-900 hover:bg-green-800'
                          }`}>
                            {quest.category}
                          </Badge>
                          <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                          <span className="text-xs text-gray-400">Due: {quest.deadline}</span>
                        </div>
                      </div>
                      <Button size="sm">Start</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Dungeons Tab */}
        <TabsContent value="dungeons">
          {filteredDungeons.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No dungeons match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredDungeons.map((dungeon) => (
                <Card key={dungeon.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{dungeon.title}</CardTitle>
                        <CardDescription>{dungeon.description}</CardDescription>
                      </div>
                      <Button size="sm" variant="outline">Continue</Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-purple-900 text-purple-200">
                        {dungeon.type}
                      </Badge>
                      <Badge className={`${
                        dungeon.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                        dungeon.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                        'bg-green-900 hover:bg-green-800'
                      }`}>
                        {dungeon.category}
                      </Badge>
                      <span className="text-sm text-gray-400">+{dungeon.xpReward} XP</span>
                      <span className="text-sm text-gray-400">Due: {dungeon.deadline}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{dungeon.progress}%</span>
                      </div>
                      <Progress value={dungeon.progress} className="h-2" />
                    </div>
                    <div className="space-y-2 pl-2 border-l-2 border-gray-700">
                      {dungeon.tasks.map((task: DungeonTask) => (
                        <div key={task.id} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={task.completed} 
                            className="h-4 w-4 rounded border-gray-500 text-purple-600 focus:ring-purple-600"
                          />
                          <span className={task.completed ? 'line-through text-gray-400' : 'text-white'}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Boss Fights Tab */}
        <TabsContent value="boss">
          {filteredBoss.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No boss fights match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredBoss.map((boss) => (
                <Card key={boss.id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <CardTitle className="text-2xl">{boss.title}</CardTitle>
                        <CardDescription className="text-base">{boss.description}</CardDescription>
                      </div>
                      <Button className="bg-gradient-to-r from-amber-500 to-red-600">
                        Battle Boss
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="secondary" className="bg-red-800 text-red-200">
                        BOSS FIGHT
                      </Badge>
                      <Badge className={`${
                        boss.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                        boss.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                        'bg-green-900 hover:bg-green-800'
                      }`}>
                        {boss.category}
                      </Badge>
                      <span className="text-sm text-gray-400">+{boss.xpReward} XP</span>
                      <span className="text-sm text-gray-400">Due: {boss.deadline}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{boss.progress}%</span>
                      </div>
                      <Progress value={boss.progress} className="h-2" />
                    </div>
                    <div className="bg-gray-700 p-3 rounded-md">
                      <p className="text-sm font-medium text-white">Proof Required:</p>
                      <p className="text-sm text-gray-300 mt-1">{boss.validation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 