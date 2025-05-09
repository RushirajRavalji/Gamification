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
import { useRouter } from "next/navigation";
import { useQuests } from "@/lib/hooks/useQuests";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { checkAndUpdateStreak } from "@/lib/firebase/db";
// import { toast } from "react-hot-toast";

export default function QuestsPage() {
  const { user, loading: authLoading } = useAuth();
  const { quests, isLoading: questsLoading, updateQuest, updateDungeonTask, getQuestsByType, fetchQuests } = useQuests();
  const { fetchCharacter } = useCharacter();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  
  // Handle quest status changes
  const handleQuestStatusChange = async (questId: string, newStatus: QuestStatus) => {
    try {
      // Get the current quest
      const currentQuest = quests.find(q => q.id === questId);
      if (!currentQuest) return;
      
      // Determine if we're completing or uncompleting
      const isCompleting = newStatus === "Completed";
      const wasCompleted = currentQuest.status === "Completed";
      
      // Update in Firebase
      const success = await updateQuest(questId, newStatus);
      
      if (success) {
        // Message based on operation
        if (isCompleting) {
          console.log("Quest completed! XP awarded!");
          // You could add a toast here
        } else if (wasCompleted) {
          console.log("Quest marked as incomplete. XP and rewards have been removed.");
          // You could add a toast here
        } else {
          console.log("Quest status updated");
        }
        
        // Refresh character data to sync XP and stats in the UI when a quest status changes
        if (isCompleting || wasCompleted) {
          console.log("Refreshing character data after quest status change");
          await fetchCharacter();
          
          // Update streak for daily quests
          if (currentQuest.type === 'Daily') {
            await checkAndUpdateStreak();
          }
        }
        
        // Reload quests list to update the UI
        await fetchQuests();
      }
    } catch (error) {
      console.error("Error updating quest status:", error);
    }
  };

  // Handle dungeon task changes
  const handleDungeonTaskChange = async (dungeonId: string, taskIndex: number) => {
    try {
      const success = await updateDungeonTask(dungeonId, taskIndex);
      
      if (success) {
        // toast.success("Task updated");
        console.log("Task updated");
        
        // Find the quest to check if it was completed
        const dungeon = quests.find(q => q.id === dungeonId);
        if (dungeon && dungeon.type === 'Dungeon' && dungeon.tasks) {
          // Check if all tasks are completed
          const allTasksCompleted = dungeon.tasks.every(task => task.completed);
          
          // If all tasks are completed, refresh character data
          if (allTasksCompleted) {
            await fetchCharacter();
          }
        }
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
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Quest Log</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input 
            placeholder="Search quests..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700/70 border-gray-600/50 text-white focus:border-purple-500"
          />
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-700/20"
            onClick={handleCreateQuest}
          >
            Create New Quest
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <div className="mb-6 overflow-x-auto pb-2">
          <TabsList className="w-full md:w-auto min-w-max bg-gray-800/40 p-1 border border-purple-900/20 rounded-lg">
            <TabsTrigger value="daily" className="whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-800/80 data-[state=active]:to-pink-900/80 data-[state=active]:border-none">Daily Quests</TabsTrigger>
            <TabsTrigger value="side" className="whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-800/80 data-[state=active]:to-pink-900/80 data-[state=active]:border-none">Side Quests</TabsTrigger>
            <TabsTrigger value="dungeons" className="whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-800/80 data-[state=active]:to-pink-900/80 data-[state=active]:border-none">Dungeons</TabsTrigger>
            <TabsTrigger value="boss" className="whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-800/80 data-[state=active]:to-pink-900/80 data-[state=active]:border-none">Boss Fights</TabsTrigger>
          </TabsList>
        </div>

        {/* Daily Quests Tab */}
        <TabsContent value="daily">
          {dailyQuests.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl p-6">
              <p className="text-center text-gray-400">No daily quests match your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...dailyQuests]
                .sort((a, b) => {
                  // Sort by completion status - incomplete first, completed last
                  if (a.status === "Completed" && b.status !== "Completed") return 1;
                  if (a.status !== "Completed" && b.status === "Completed") return -1;
                  return 0;
                })
                .map((quest) => (
                <div key={quest.id} className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
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
                            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300 border border-gray-600/50">
                              {quest.type}
                            </span>
                            {quest.category && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                quest.category === 'Body' ? 'bg-red-900/80 text-red-100' : 
                                quest.category === 'Mind' ? 'bg-blue-900/80 text-blue-100' : 
                                'bg-green-900/80 text-green-100'
                              }`}>
                                {quest.category}
                              </span>
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
                        className={`w-full sm:w-auto ${quest.status !== "Completed" ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-purple-500/30 hover:bg-purple-950/30'}`}
                      >
                        {quest.status === "Completed" ? "View" : "Complete"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Side Quests Tab */}
        <TabsContent value="side">
          {sideQuests.length === 0 ? (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl p-6">
              <p className="text-center text-gray-400">No side quests match your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sideQuests.map((quest) => (
                <div key={quest.id} className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-medium text-white">{quest.title}</h3>
                        <p className="text-sm text-gray-400">{quest.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 bg-purple-900/80 rounded-full text-purple-100">
                            {quest.type}
                          </span>
                          {quest.category && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              quest.category === 'Body' ? 'bg-red-900/80 text-red-100' : 
                              quest.category === 'Mind' ? 'bg-blue-900/80 text-blue-100' : 
                              'bg-green-900/80 text-green-100'
                            }`}>
                              {quest.category}
                            </span>
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
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
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