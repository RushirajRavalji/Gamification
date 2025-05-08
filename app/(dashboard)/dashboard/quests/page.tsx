"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/firebase/auth";
import { QuestType, QuestStatus } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuests } from "@/lib/hooks/useQuests";
// import { toast } from "react-hot-toast";

export default function QuestsPage() {
  const { user, loading: authLoading } = useAuth();
  const { quests, isLoading: questsLoading, updateQuest, updateDungeonTask, getQuestsByType } = useQuests();
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search query parameter if available
  const questId = searchParams.get('id');

  // Handle quest status changes
  const handleQuestStatusChange = async (questId: string, newStatus: QuestStatus) => {
    try {
      // Update in Firebase
      const success = await updateQuest(questId, newStatus);
      
      if (success) {
        // Temporarily comment out
        // toast.success(newStatus === "Completed" ? 
        //   "Quest completed! XP awarded!" : 
        //   "Quest status updated");
        console.log(newStatus === "Completed" ? 
          "Quest completed! XP awarded!" : 
          "Quest status updated");
      } else {
        // toast.error("Failed to update quest status");
        console.error("Failed to update quest status");
      }
      
    } catch (error) {
      console.error("Error updating quest status:", error);
      // toast.error("An error occurred while updating");
      console.error("An error occurred while updating");
    }
  };

  // Handle dungeon task changes
  const handleDungeonTaskChange = async (dungeonId: string, taskIndex: number) => {
    try {
      const success = await updateDungeonTask(dungeonId, taskIndex);
      
      if (success) {
        // toast.success("Task updated");
        console.log("Task updated");
      } else {
        // toast.error("Failed to update task");
        console.error("Failed to update task");
      }
      
    } catch (error) {
      console.error("Error updating dungeon task:", error);
      // toast.error("An error occurred while updating");
      console.error("An error occurred while updating");
    }
  };

  // Filter quests based on search term and type
  const filterQuests = (type: QuestType) => {
    if (!searchTerm) {
      return getQuestsByType(type);
    }
    
    return getQuestsByType(type).filter(quest => 
      (quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       quest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (quest.category && quest.category.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  };

  // Get filtered quests by type
  const dailyQuests = filterQuests('Daily');
  const sideQuests = filterQuests('SideQuest');
  const dungeons = filterQuests('Dungeon');
  const bossFights = filterQuests('BossFight');

  // Handle creating a new quest
  const handleCreateQuest = () => {
    router.push('/dashboard/quests/create');
  };

  if (authLoading || questsLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Please log in to view your quests</h1>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

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
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={handleCreateQuest}
          >
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
          {dailyQuests.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No daily quests match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dailyQuests.map((quest) => (
                <Card key={quest.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <input 
                          type="checkbox" 
                          checked={quest.status === "Completed"} 
                          onChange={() => handleQuestStatusChange(quest.id, quest.status === "Completed" ? "InProgress" : "Completed")}
                          className="h-5 w-5 mt-1 rounded border-gray-500 text-purple-600 focus:ring-purple-600"
                        />
                        <div className="space-y-1">
                          <h3 className={`font-medium ${quest.status === "Completed" ? 'line-through text-gray-400' : 'text-white'}`}>
                            {quest.title}
                          </h3>
                          <p className="text-sm text-gray-400">{quest.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {quest.type}
                            </Badge>
                            {quest.category && (
                              <Badge className={`text-xs ${
                                quest.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                                quest.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                                'bg-green-900 hover:bg-green-800'
                              }`}>
                                {quest.category}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                            <span className="text-xs text-gray-400">
                              Due: {quest.deadline ? new Date(quest.deadline).toLocaleDateString() : 'No deadline'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={quest.status === "Completed" ? "outline" : "default"}
                        onClick={() => handleQuestStatusChange(quest.id, quest.status === "Completed" ? "InProgress" : "Completed")}
                      >
                        {quest.status === "Completed" ? "View" : "Complete"}
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
          {sideQuests.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No side quests match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sideQuests.map((quest) => (
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
                          {quest.category && (
                            <Badge className={`text-xs ${
                              quest.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                              quest.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                              'bg-green-900 hover:bg-green-800'
                            }`}>
                              {quest.category}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                          <span className="text-xs text-gray-400">
                            Due: {quest.deadline ? new Date(quest.deadline).toLocaleDateString() : 'No deadline'}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleQuestStatusChange(quest.id, "InProgress")}
                      >
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Dungeons Tab */}
        <TabsContent value="dungeons">
          {dungeons.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No dungeons match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {dungeons.map((dungeon) => (
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
                      {dungeon.category && (
                        <Badge className={`${
                          dungeon.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                          dungeon.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                          'bg-green-900 hover:bg-green-800'
                        }`}>
                          {dungeon.category}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-400">+{dungeon.xpReward} XP</span>
                      <span className="text-sm text-gray-400">
                        Due: {dungeon.deadline ? new Date(dungeon.deadline).toLocaleDateString() : 'No deadline'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{dungeon.progress || 0}%</span>
                      </div>
                      <Progress value={dungeon.progress || 0} className="h-2" />
                    </div>
                    {dungeon.tasks && dungeon.tasks.length > 0 && (
                      <div className="space-y-2 pl-2 border-l-2 border-gray-700">
                        {dungeon.tasks.map((task, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              checked={task.completed} 
                              onChange={() => handleDungeonTaskChange(dungeon.id, index)}
                              className="h-4 w-4 rounded border-gray-500 text-purple-600 focus:ring-purple-600"
                            />
                            <span className={task.completed ? 'line-through text-gray-400' : 'text-white'}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Boss Fights Tab */}
        <TabsContent value="boss">
          {bossFights.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <p className="text-center text-gray-400">No boss fights match your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bossFights.map((boss) => (
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
                      {boss.category && (
                        <Badge className={`${
                          boss.category === 'Body' ? 'bg-red-900 hover:bg-red-800' : 
                          boss.category === 'Mind' ? 'bg-blue-900 hover:bg-blue-800' : 
                          'bg-green-900 hover:bg-green-800'
                        }`}>
                          {boss.category}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-400">+{boss.xpReward} XP</span>
                      <span className="text-sm text-gray-400">
                        Due: {boss.deadline ? new Date(boss.deadline).toLocaleDateString() : 'No deadline'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{boss.progress || 0}%</span>
                      </div>
                      <Progress value={boss.progress || 0} className="h-2" />
                    </div>
                    <div className="bg-gray-700 p-3 rounded-md">
                      <p className="text-sm font-medium text-white">Proof Required:</p>
                      <p className="text-sm text-gray-300 mt-1">
                        {boss.proofRequired ? 
                          boss.proofRequired.join(", ") : 
                          "No proof required"}
                      </p>
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