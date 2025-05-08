"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  // Mock data for dashboard
  const dailyQuests = [
    { id: "d1", title: "Morning Physical Training", type: "Daily", xpReward: 50, completed: false },
    { id: "d2", title: "Study Focus Session", type: "Daily", xpReward: 40, completed: true },
    { id: "d3", title: "Evening Meditation", type: "Daily", xpReward: 30, completed: false },
  ];

  const activeQuests = [
    { id: "q1", title: "Web Development Project", type: "BossFight", xpReward: 500, progress: 65 },
    { id: "q2", title: "Reading Challenge", type: "Dungeon", xpReward: 200, progress: 30 },
  ];

  const stats = {
    strength: 12,
    intelligence: 15,
    focus: 10,
    dexterity: 8,
    willpower: 14,
    influence: 9,
  };

  const recentAchievements = [
    { id: "a1", title: "First Blood", description: "Completed your first quest", date: "2 days ago" },
    { id: "a2", title: "Consistent Hero", description: "Maintained a 5-day streak", date: "Yesterday" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hero&apos;s Dashboard</h1>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
          New Quest
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total XP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4,750</p>
            <p className="text-sm text-gray-400">+250 XP this week</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quests Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">27</p>
            <p className="text-sm text-gray-400">Daily: 18 | Boss: 2</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">7 Days 🔥</p>
            <p className="text-sm text-gray-400">Best: 12 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Quests */}
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Today&apos;s Quests</CardTitle>
              <CardDescription>Complete your daily challenges to maintain your streak</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyQuests.map((quest) => (
                  <div key={quest.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={quest.completed} 
                        className="h-5 w-5 rounded border-gray-500 text-purple-600 focus:ring-purple-600"
                      />
                      <div>
                        <p className={`font-medium ${quest.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                          {quest.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {quest.type}
                          </Badge>
                          <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant={quest.completed ? "outline" : "default"}>
                      {quest.completed ? "View" : "Complete"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Active Quests</CardTitle>
              <CardDescription>Your ongoing adventures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeQuests.map((quest) => (
                  <div key={quest.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">{quest.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-purple-900 text-purple-200">
                            {quest.type}
                          </Badge>
                          <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Continue</Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{quest.progress}%</span>
                      </div>
                      <Progress value={quest.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Character Stats & Recent Activity */}
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Character Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(stats).map(([stat, value]) => (
                <div key={stat} className="space-y-1">
                  <div className="flex justify-between text-sm capitalize">
                    <span>{stat}</span>
                    <span>{value}</span>
                  </div>
                  <Progress value={(value / 20) * 100} className="h-2" />
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" asChild>
                <Link href="/dashboard/character">
                  View Character
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="border-l-4 border-purple-500 pl-3 py-1">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{achievement.date}</p>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href="/dashboard/journal">
                    View XP Journal
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 