"use client";

import { useState } from "react";
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

// You'll need to add the Switch component to your project
// You can create this in components/ui/switch.tsx
// For now, let's use a checkbox as a temporary solution
const Switch = ({ id, checked, onCheckedChange }: { id: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
  <input 
    type="checkbox" 
    id={id} 
    checked={checked} 
    onChange={(e) => onCheckedChange(e.target.checked)} 
    className="h-4 w-4 rounded"
  />
);

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
    endDate: "", // For daily tasks that repeat until a specific date
    isDailyTask: false, // Toggle for marking as daily
    proofRequired: "None" as ProofType,
    statRewards: {
      strength: 0,
      intelligence: 0,
      focus: 0,
      consistency: 0,
      willpower: 0,
      influence: 0,
      relationships: 0
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
  
  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleStatSelect = (stat: string) => {
    setFormData(prev => {
      // Check if stat is already selected
      const isSelected = prev.selectedStats.includes(stat);
      
      // Toggle stats
      const newSelectedStats = isSelected 
        ? prev.selectedStats.filter(s => s !== stat)
        : [...prev.selectedStats, stat];
      
      // Update stat values based on selected stats
      const newStatRewards = {...prev.statRewards};
      
      // Reset all stats to 0
      Object.keys(newStatRewards).forEach(key => {
        newStatRewards[key as keyof typeof newStatRewards] = 0;
      });
      
      // Set selected stats to 1
      newSelectedStats.forEach(s => {
        newStatRewards[s as keyof typeof newStatRewards] = 1;
      });
      
      return {
        ...prev,
        selectedStats: newSelectedStats,
        statRewards: newStatRewards
      };
    });
  };
  
  const statOptions = [
    { value: 'strength', label: 'Strength', description: 'Physical power and endurance' },
    { value: 'intelligence', label: 'Intelligence', description: 'Learning capacity and problem solving' },
    { value: 'focus', label: 'Focus', description: 'Concentration and attention to detail' },
    { value: 'consistency', label: 'Consistency', description: 'Regular practice and habit formation' },
    { value: 'willpower', label: 'Willpower', description: 'Mental fortitude and discipline' },
    { value: 'influence', label: 'Influence', description: 'Social impact and leadership' },
    { value: 'relationships', label: 'Relationships', description: 'Interpersonal connections and networking' }
  ];
  
  const proofOptions = [
    { value: "None", label: "None Required" },
    { value: "Image", label: "Image Upload" },
    { value: "Text", label: "Text Description" }
  ];
  
  const xpOptions = [
    { value: 10, label: "10 XP" },
    { value: 25, label: "25 XP" },
    { value: 50, label: "50 XP" },
    { value: 100, label: "100 XP" },
  ];
  
  const categoryOptions = [
    { value: "Body", label: "Body" },
    { value: "Mind", label: "Mind" },
    { value: "Skills", label: "Skills" }
  ];
  
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
        type: formData.isDailyTask ? "Daily" : formData.type,
        status: "Available" as QuestStatus,
        xpReward: Number(formData.xpReward),
        statRewards: formData.statRewards,
        category: formData.category,
        proofRequired: [formData.proofRequired], // Convert string to array of ProofType
        progress: 0,
        selectedStats: formData.selectedStats,
        penaltyForMissing: formData.isDailyTask ? true : false, // If daily, add penalty flag
      };
      
      // Set up deadline
      if (formData.deadlineDate) {
        newQuest.deadline = new Date(formData.deadlineDate);
      }
      
      // Set up end date for repeating daily tasks
      if (formData.isDailyTask && formData.endDate) {
        newQuest.endDate = new Date(formData.endDate);
      }

      // Set up repeat frequency
      if (formData.isDailyTask) {
        newQuest.repeat = "Daily" as QuestRepeat;
      } else {
        newQuest.repeat = "None" as QuestRepeat;
      }
      
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
      if (formData.type === "Daily" || formData.type === "SideQuest" || formData.isDailyTask) {
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
      // toast.error("Failed to create quest");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Body':
        return 'bg-red-900 border-red-700';
      case 'Mind':
        return 'bg-blue-900 border-blue-700';
      case 'Skills':
        return 'bg-green-900 border-green-700';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
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
                {/* Daily Task Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isDailyTask">Set as Daily Task</Label>
                    <Switch 
                      id="isDailyTask"
                      checked={formData.isDailyTask}
                      onCheckedChange={(checked) => handleToggleChange("isDailyTask", checked)}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Daily tasks reset every day and can have penalties for missing them
                  </p>
                </div>

                {/* Quest Type selector (shown only if not daily task) */}
                {!formData.isDailyTask && (
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
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="relative">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleSelectChange("category", e.target.value)}
                      className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-sm appearance-none"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proofRequired">Proof Required</Label>
                  <div className="relative">
                    <select
                      id="proofRequired"
                      value={formData.proofRequired}
                      onChange={(e) => handleSelectChange("proofRequired", e.target.value as ProofType)}
                      className="w-full bg-gray-700 border-gray-600 rounded-md px-3 py-2 text-sm appearance-none"
                    >
                      {proofOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
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
                  <Input 
                    id="xpReward"
                    name="xpReward"
                    type="number"
                    value={formData.xpReward}
                    onChange={handleChange}
                    min={10}
                    max={1000}
                    required
                    className="bg-gray-700 border-gray-600"
                  />
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
              
              {/* End date for daily tasks */}
              {formData.isDailyTask && (
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Required for daily tasks)</Label>
                  <Input 
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required={formData.isDailyTask}
                    className="bg-gray-700 border-gray-600"
                  />
                  <p className="text-xs text-gray-400">
                    You must complete this task every day until the end date.
                    If you miss a day, the XP allocated to this quest will be deducted from your total XP.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="statRewards" className="text-base font-medium">Stat Rewards (Optional)</Label>
                  <p className="text-xs text-gray-400 mb-3">Select which stats will improve by completing this quest</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left column - Physical & Mental stats */}
                    <div>
                      <div className="mb-2 px-1">
                        <span className="text-sm font-medium text-purple-300">Core Attributes</span>
                      </div>
                      <div className="space-y-2">
                        {statOptions.slice(0, 4).map(stat => (
                          <button
                            key={stat.value}
                            type="button"
                            onClick={() => handleStatSelect(stat.value)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                              formData.selectedStats.includes(stat.value)
                                ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/60 border border-purple-500/80 shadow-md shadow-purple-900/20'
                                : 'bg-gray-800/80 border border-gray-700 hover:bg-gray-700/60'
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{stat.label}</span>
                              <span className="text-xs text-gray-400 mt-0.5">{stat.description}</span>
                            </div>
                            
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-transform ${
                              formData.selectedStats.includes(stat.value) 
                                ? 'bg-purple-500 scale-110' 
                                : 'bg-gray-700'
                            }`}>
                              {formData.selectedStats.includes(stat.value) && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Right column - Social & Character stats */}
                    <div>
                      <div className="mb-2 px-1">
                        <span className="text-sm font-medium text-purple-300">Social Attributes</span>
                      </div>
                      <div className="space-y-2">
                        {statOptions.slice(4).map(stat => (
                          <button
                            key={stat.value}
                            type="button"
                            onClick={() => handleStatSelect(stat.value)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                              formData.selectedStats.includes(stat.value)
                                ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/60 border border-purple-500/80 shadow-md shadow-purple-900/20'
                                : 'bg-gray-800/80 border border-gray-700 hover:bg-gray-700/60'
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{stat.label}</span>
                              <span className="text-xs text-gray-400 mt-0.5">{stat.description}</span>
                            </div>
                            
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-transform ${
                              formData.selectedStats.includes(stat.value) 
                                ? 'bg-purple-500 scale-110' 
                                : 'bg-gray-700'
                            }`}>
                              {formData.selectedStats.includes(stat.value) && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {formData.selectedStats.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-800/60 rounded-lg border border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedStats.map(stat => (
                          <Badge key={stat} className="bg-purple-800 hover:bg-purple-700 px-2 py-1">
                            +1 {stat.charAt(0).toUpperCase() + stat.slice(1)}
                            <button 
                              onClick={() => handleStatSelect(stat)} 
                              className="ml-1 text-gray-400 hover:text-white"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" asChild className="border-gray-700">
                  <Link href="/dashboard/quests">Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
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