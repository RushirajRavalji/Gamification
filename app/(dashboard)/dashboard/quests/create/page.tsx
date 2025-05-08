"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily Quest</SelectItem>
                      <SelectItem value="SideQuest">Side Quest</SelectItem>
                      <SelectItem value="Dungeon">Dungeon</SelectItem>
                      <SelectItem value="BossFight">Boss Fight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Body">Body</SelectItem>
                      <SelectItem value="Mind">Mind</SelectItem>
                      <SelectItem value="Career">Career</SelectItem>
                    </SelectContent>
                  </Select>
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
              
              <div className="space-y-4">
                <Label>Stat Rewards (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="statStrength" className="text-sm">Strength</Label>
                    <Input 
                      id="statStrength"
                      name="statStrength"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={5}
                      className="bg-gray-700 border-gray-600"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          statRewards: {
                            ...prev.statRewards,
                            strength: value
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="statIntelligence" className="text-sm">Intelligence</Label>
                    <Input 
                      id="statIntelligence"
                      name="statIntelligence"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={5}
                      className="bg-gray-700 border-gray-600"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          statRewards: {
                            ...prev.statRewards,
                            intelligence: value
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="statFocus" className="text-sm">Focus</Label>
                    <Input 
                      id="statFocus"
                      name="statFocus"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={5}
                      className="bg-gray-700 border-gray-600"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          statRewards: {
                            ...prev.statRewards,
                            focus: value
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="statDexterity" className="text-sm">Dexterity</Label>
                    <Input 
                      id="statDexterity"
                      name="statDexterity"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={5}
                      className="bg-gray-700 border-gray-600"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          statRewards: {
                            ...prev.statRewards,
                            dexterity: value
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="statWillpower" className="text-sm">Willpower</Label>
                    <Input 
                      id="statWillpower"
                      name="statWillpower"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={5}
                      className="bg-gray-700 border-gray-600"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          statRewards: {
                            ...prev.statRewards,
                            willpower: value
                          }
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="statInfluence" className="text-sm">Influence</Label>
                    <Input 
                      id="statInfluence"
                      name="statInfluence"
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={5}
                      className="bg-gray-700 border-gray-600"
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          statRewards: {
                            ...prev.statRewards,
                            influence: value
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proofRequired">Proof Required</Label>
                <Select
                  value={formData.proofRequired}
                  onValueChange={(value) => handleSelectChange("proofRequired", value as ProofType)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select proof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Photo">Photo</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Link">Link</SelectItem>
                    <SelectItem value="Text">Text</SelectItem>
                  </SelectContent>
                </Select>
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