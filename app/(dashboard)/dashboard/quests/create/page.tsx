"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createQuest } from "@/lib/firebase/db";
import { QuestType, QuestStatus, ProofType, QuestRepeat } from "@/lib/types";
import { useAuth } from "@/lib/firebase/auth";
// import { toast } from 'react-hot-toast';

export default function CreateQuestPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Daily" as QuestType,
    xpReward: 50,
    category: "Mind",
    deadlineDate: "",
    proofRequired: "None" as ProofType,
    statRewards: {
      strength: 0,
      intelligence: 0,
      focus: 0,
      dexterity: 0,
      willpower: 0,
      influence: 0
    },
    selectedStats: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatToggle = (stat: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedStats.includes(stat);
      let newSelectedStats;
      
      if (isSelected) {
        // Remove stat if already selected
        newSelectedStats = prev.selectedStats.filter(s => s !== stat);
      } else {
        // Add stat if not selected
        newSelectedStats = [...prev.selectedStats, stat];
      }
      
      // Calculate stat reward values (1 point per selected stat)
      const newStatRewards = { ...prev.statRewards };
      
      // Type-safe way to update stat rewards
      if (stat === "strength" || 
          stat === "intelligence" || 
          stat === "focus" || 
          stat === "dexterity" || 
          stat === "willpower" || 
          stat === "influence") {
        // Update all stats based on whether they're in the selected list
        newStatRewards.strength = newSelectedStats.includes("strength") ? 1 : 0;
        newStatRewards.intelligence = newSelectedStats.includes("intelligence") ? 1 : 0;
        newStatRewards.focus = newSelectedStats.includes("focus") ? 1 : 0;
        newStatRewards.dexterity = newSelectedStats.includes("dexterity") ? 1 : 0;
        newStatRewards.willpower = newSelectedStats.includes("willpower") ? 1 : 0;
        newStatRewards.influence = newSelectedStats.includes("influence") ? 1 : 0;
      }
      
      return {
        ...prev,
        selectedStats: newSelectedStats,
        statRewards: newStatRewards
      };
    });
  };

  const handleStatRewardChange = (stat: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      statRewards: {
        ...prev.statRewards,
        [stat]: value
      }
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // toast.error("You must be logged in to create a quest");
      console.error("You must be logged in to create a quest");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create quest object
      const newQuest: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type as QuestType,
        status: "Available" as QuestStatus,
        xpReward: Number(formData.xpReward),
        statRewards: formData.statRewards,
        category: formData.category,
        deadline: formData.deadlineDate ? new Date(formData.deadlineDate) : null,
        proofRequired: [formData.proofRequired], // Convert string to array of ProofType
        repeat: formData.type === "Daily" ? "Daily" as QuestRepeat : "None" as QuestRepeat,
        progress: 0,
        selectedStats: formData.selectedStats
      };
      
      // Only add tasks for Dungeon type quests
      if (formData.type === "Dungeon") {
        newQuest.tasks = [
          { title: "Task 1", completed: false },
          { title: "Task 2", completed: false },
          { title: "Task 3", completed: false },
        ];
      }
      
      // Set up boss fight with initial progress
      if (formData.type === "BossFight") {
        newQuest.progress = 0; // Start at 0% progress
      }
      
      // Set quest status based on type
      if (formData.type === "Daily" || formData.type === "SideQuest") {
        newQuest.status = "Available";
      } else {
        // Dungeons and BossFights start as InProgress
        newQuest.status = "InProgress";
      }
      
      await createQuest(newQuest);
      // toast.success("Quest created successfully!");
      console.log("Quest created successfully!");
      router.push("/dashboard/quests");
      
    } catch (error) {
      console.error("Error creating quest:", error);
      // toast.error("Failed to create quest. Please try again.");
      console.error("Failed to create quest. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Available stats options
  const statOptions = [
    { value: "strength", label: "Strength" },
    { value: "intelligence", label: "Intelligence" },
    { value: "focus", label: "Focus" },
    { value: "dexterity", label: "Dexterity" },
    { value: "willpower", label: "Willpower" },
    { value: "influence", label: "Influence" }
  ];
  
  // Define XP options
  const xpOptions = [
    { value: 10, label: "10 XP - Quick Task" },
    { value: 20, label: "20 XP - Easy" },
    { value: 30, label: "30 XP - Medium" },
    { value: 40, label: "40 XP - Hard" },
    { value: 50, label: "50 XP - Very Hard" },
    { value: 100, label: "100 XP - Boss Challenge" }
  ];
  
  // Update XP reward when quest type changes
  useEffect(() => {
    // Reset to 50 XP default unless it's a boss fight
    if (formData.type === "BossFight") {
      setFormData(prev => ({ ...prev, xpReward: 100 }));
    } else if (formData.xpReward === 100) {
      // If it was a boss fight and now it's not, reset to 50
      setFormData(prev => ({ ...prev, xpReward: 50 }));
    }
  }, [formData.type]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Please log in to create quests</h1>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Quest</CardTitle>
            <CardDescription>Add a new challenge to your hero's journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Quest Title</Label>
                <Input 
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter quest title"
                  required
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What needs to be accomplished?"
                  required
                  className="bg-gray-700 border-gray-600 min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Quest Type</Label>
                  <div className="relative">
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleSelectChange("type", e.target.value)}
                      className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-sm appearance-none"
                    >
                      <option value="Daily">Daily Quest</option>
                      <option value="SideQuest">Side Quest</option>
                      <option value="Dungeon">Dungeon</option>
                      <option value="BossFight">Boss Fight</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="relative">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleSelectChange("category", e.target.value)}
                      className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-sm appearance-none"
                    >
                      <option value="Body">Body</option>
                      <option value="Mind">Mind</option>
                      <option value="Career">Career</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xpReward">XP Reward</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {xpOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, xpReward: option.value }))}
                        disabled={option.value === 100 && formData.type !== "BossFight"}
                        className={`py-2 px-3 rounded-md text-sm transition-all ${
                          formData.xpReward === option.value
                            ? 'bg-purple-700 text-white'
                            : option.value === 100 && formData.type !== "BossFight"
                              ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {formData.type === "BossFight" && formData.xpReward !== 100 && (
                    <p className="text-xs text-amber-400 mt-1">Boss Fights are recommended to use 100 XP</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadlineDate">Deadline (Optional)</Label>
                  <Input 
                    id="deadlineDate"
                    name="deadlineDate"
                    type="date"
                    value={formData.deadlineDate}
                    onChange={handleChange}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Stat Rewards (Optional)</Label>
                <div className="grid grid-cols-1 gap-4 p-4 bg-gray-700/40 rounded-lg">
                  <div>
                    <Label className="mb-2 block">Select Stats to Improve</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {statOptions.map((stat) => (
                        <div
                          key={stat.value}
                          className={`p-3 rounded-lg border flex items-center space-x-2 cursor-pointer transition-all ${
                            formData.selectedStats.includes(stat.value)
                              ? 'bg-purple-900/50 border-purple-500'
                              : 'bg-gray-800/50 border-gray-600 hover:bg-gray-700/50'
                          }`}
                          onClick={() => handleStatToggle(stat.value)}
                        >
                          <div className="flex items-center">
                            <input 
                              type="checkbox"
                              id={`stat-${stat.value}`}
                              checked={formData.selectedStats.includes(stat.value)}
                              readOnly
                              className="h-4 w-4 rounded-sm text-purple-600 bg-gray-700 border-gray-500"
                            />
                            <span className="ml-2">{stat.label}</span>
                          </div>
                          {formData.selectedStats.includes(stat.value) && (
                            <Badge className="ml-auto bg-purple-600">+1</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    <p>Selected stats will receive +1 point when the quest is completed.</p>
                    <p>For quests with multiple tasks, each task completion will add +1 to the selected stats.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proofRequired">Proof Required</Label>
                <div className="relative">
                  <select
                    id="proofRequired"
                    value={formData.proofRequired}
                    onChange={(e) => handleSelectChange("proofRequired", e.target.value)}
                    className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-sm appearance-none"
                  >
                    <option value="None">None</option>
                    <option value="Photo">Photo</option>
                    <option value="Video">Video</option>
                    <option value="Link">Link</option>
                    <option value="Text">Text</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Quest"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 