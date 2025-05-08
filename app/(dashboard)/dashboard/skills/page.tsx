"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/firebase/auth";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { db } from "@/lib/firebase/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { Skill } from "@/lib/types";

// Custom interface for skill nodes in the skill tree that includes UI-specific properties
interface SkillNode extends Omit<Skill, 'prerequisites'> {
  category: string;
  requirements: string[];
  position: { x: number; y: number };
  unlocked: boolean;
}

// Default skill tree structure - will be merged with user's progress from Firebase
const defaultSkills: SkillNode[] = [
  {
    id: "str1",
    name: "Physical Strength",
    description: "Base strength increases all physical activities",
    level: 0,
    maxLevel: 5,
    statAffected: "strength",
    bonusAmount: 1,
    unlocked: false,
    requirements: [],
    category: "Body",
    position: { x: 0, y: 0 }
  },
  {
    id: "str2",
    name: "Powerlifting",
    description: "Advanced strength training for major muscle groups",
    level: 0,
    maxLevel: 3,
    statAffected: "strength",
    bonusAmount: 2,
    unlocked: false,
    requirements: ["str1"],
    category: "Body",
    position: { x: 0, y: 1 }
  },
  {
    id: "int1",
    name: "Knowledge Base",
    description: "Foundational learning techniques and knowledge retention",
    level: 0,
    maxLevel: 5,
    statAffected: "intelligence",
    bonusAmount: 1,
    unlocked: false,
    requirements: [],
    category: "Mind",
    position: { x: 1, y: 0 }
  },
  {
    id: "int2",
    name: "Deep Research",
    description: "Ability to research complex topics efficiently",
    level: 0,
    maxLevel: 3,
    statAffected: "intelligence",
    bonusAmount: 2,
    unlocked: false,
    requirements: ["int1"],
    category: "Mind",
    position: { x: 1, y: 1 }
  },
  {
    id: "foc1",
    name: "Concentration",
    description: "Basic focus training and attention control",
    level: 0,
    maxLevel: 5,
    statAffected: "focus",
    bonusAmount: 1,
    unlocked: false,
    requirements: [],
    category: "Mind",
    position: { x: 2, y: 0 }
  },
  {
    id: "foc2",
    name: "Deep Work",
    description: "Extended focus sessions with minimal distractions",
    level: 0,
    maxLevel: 3,
    statAffected: "focus",
    bonusAmount: 2,
    unlocked: false,
    requirements: ["foc1"],
    category: "Mind",
    position: { x: 2, y: 1 }
  },
];

export default function SkillTreePage() {
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading, updateStats } = useCharacter();
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [skillPoints, setSkillPoints] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const isLoading = authLoading || characterLoading;

  // Initialize skills by merging default skills with character skills from Firebase
  useEffect(() => {
    if (character) {
      if (character.skills && character.skills.length > 0) {
        // Merge existing skills from character with default skills
        const updatedSkills = defaultSkills.map(defaultSkill => {
          const existingSkill = character.skills.find(s => s.id === defaultSkill.id);
          if (existingSkill) {
            return {
              ...defaultSkill,
              level: existingSkill.level,
              unlocked: existingSkill.unlocked || existingSkill.level > 0
            };
          }
          return defaultSkill;
        });
        
        // Automatically unlock base skills for new characters
        const finalSkills = updatedSkills.map(skill => {
          if (skill.requirements.length === 0 && skill.level === 0) {
            return {
              ...skill,
              unlocked: true
            };
          }
          return skill;
        });
        
        setSkills(finalSkills);
      } else {
        // New character - unlock base skills
        const initialSkills = defaultSkills.map(skill => ({
          ...skill,
          unlocked: skill.requirements.length === 0 // Unlock skills with no requirements
        }));
        setSkills(initialSkills);
      }
      
      // Calculate available skill points (level * 3 - used points)
      const usedPoints = character.skills ? character.skills.reduce((sum, skill) => sum + skill.level, 0) : 0;
      const totalPoints = character.level * 3;
      setSkillPoints(totalPoints - usedPoints);
    }
  }, [character]);

  const handleSkillClick = (skill: SkillNode) => {
    setSelectedSkill(skill);
  };

  const canUpgradeSkill = (skill: SkillNode) => {
    if (!character || skillPoints <= 0) return false;
    
    // Check if skill is already at max level
    if (skill.level >= skill.maxLevel) return false;
    
    // Check if skill is unlocked
    if (!skill.unlocked) {
      // Check requirements
      for (const reqId of skill.requirements) {
        const reqSkill = skills.find(s => s.id === reqId);
        if (!reqSkill || reqSkill.level < 1) {
          return false;
        }
      }
    }
    
    return true;
  };

  const upgradeSkill = async () => {
    if (!selectedSkill || !character || !canUpgradeSkill(selectedSkill)) return;
    
    setIsUpdating(true);
    
    try {
      // Update skill in state
      const updatedSkills = skills.map(skill => {
        if (skill.id === selectedSkill.id) {
          return {
            ...skill,
            level: skill.level + 1,
            unlocked: true
          };
        }
        return skill;
      });
      
      setSkills(updatedSkills);
      setSkillPoints(prev => prev - 1);
      
      // Update the selected skill reference
      const updatedSelectedSkill = {...selectedSkill, level: selectedSkill.level + 1, unlocked: true};
      setSelectedSkill(updatedSelectedSkill);
      
      // Update character in Firebase
      const characterDocRef = doc(db, 'users', user!.uid, 'character', character.id);
      
      // Check if skill already exists in character.skills
      const existingSkillIndex = character.skills.findIndex(s => s.id === selectedSkill.id);
      
      if (existingSkillIndex >= 0) {
        // Update existing skill
        const skillsClone = [...character.skills];
        skillsClone[existingSkillIndex] = {
          ...skillsClone[existingSkillIndex],
          level: skillsClone[existingSkillIndex].level + 1,
          unlocked: true
        };
        
        await updateDoc(characterDocRef, {
          'skills': skillsClone,
          'updatedAt': serverTimestamp()
        });
      } else {
        // Add new skill
        await updateDoc(characterDocRef, {
          'skills': arrayUnion({
            id: selectedSkill.id,
            name: selectedSkill.name,
            level: 1,
            maxLevel: selectedSkill.maxLevel,
            statAffected: selectedSkill.statAffected,
            bonusAmount: selectedSkill.bonusAmount,
            prerequisites: selectedSkill.requirements,
            unlocked: true
          }),
          'updatedAt': serverTimestamp()
        });
      }
      
      // Update character stats
      const statUpdate = {
        [selectedSkill.statAffected]: character.stats[selectedSkill.statAffected as keyof typeof character.stats] + selectedSkill.bonusAmount
      };
      
      await updateStats(statUpdate);
      
      toast.success(`${selectedSkill.name} upgraded to level ${selectedSkill.level + 1}!`);
    } catch (error) {
      console.error("Error upgrading skill:", error);
      toast.error("Failed to upgrade skill");
    } finally {
      setIsUpdating(false);
    }
  };

  const resetSkills = async () => {
    if (!character || isUpdating) return;
    
    if (!confirm("Are you sure you want to reset all your skills? This will refund all skill points but reset your stats.")) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Reset skills in state
      const resetSkillList = defaultSkills.map(skill => ({
        ...skill,
        unlocked: skill.requirements.length === 0 // Only base skills are unlocked
      }));
      
      setSkills(resetSkillList);
      setSelectedSkill(null);
      
      // Calculate total skill points
      const totalPoints = character.level * 3;
      setSkillPoints(totalPoints);
      
      // Reset character skills in Firebase
      const characterDocRef = doc(db, 'users', user!.uid, 'character', character.id);
      
      await updateDoc(characterDocRef, {
        'skills': [],
        'updatedAt': serverTimestamp()
      });
      
      // Reset character stats to base values
      const baseStats = {
        strength: 5,
        intelligence: 5,
        focus: 5,
        dexterity: 5,
        willpower: 5,
        influence: 5
      };
      
      await updateStats(baseStats);
      
      toast.success("Skills have been reset and all skill points refunded");
    } catch (error) {
      console.error("Error resetting skills:", error);
      toast.error("Failed to reset skills");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSkillNode = (skill: SkillNode) => {
    const isUnlocked = skill.unlocked || skill.level > 0;
    const canUpgrade = canUpgradeSkill(skill);
    
    return (
      <div 
        key={skill.id}
        className={`flex flex-col items-center p-4 m-2 rounded-lg cursor-pointer transition-all
          ${isUnlocked 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-800 opacity-50'
          }
          ${selectedSkill?.id === skill.id ? 'ring-2 ring-purple-500' : ''}
        `}
        onClick={() => handleSkillClick(skill)}
      >
        <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center mb-2">
          <span className="text-xl font-bold">{skill.level}/{skill.maxLevel}</span>
        </div>
        <h3 className="text-sm font-medium">{skill.name}</h3>
        <Badge className={`mt-1 ${
          skill.category === 'Body' ? 'bg-red-700' : 
          skill.category === 'Mind' ? 'bg-blue-700' : 
          'bg-green-700'
        }`}>
          {skill.category}
        </Badge>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Please log in to view your skill tree</h1>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Skill Tree</h1>
        <Button variant="outline" onClick={resetSkills} disabled={isUpdating}>Reset Skills</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Character Skills</CardTitle>
              <CardDescription>Develop your hero's skills and abilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {skills.map(skill => renderSkillNode(skill))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Skill Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSkill ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedSkill.name}</h2>
                    <p className="text-gray-400 mt-1">{selectedSkill.description}</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Level: {selectedSkill.level}/{selectedSkill.maxLevel}</span>
                      <span>+{selectedSkill.bonusAmount} {selectedSkill.statAffected}</span>
                    </div>
                    <Progress value={(selectedSkill.level / selectedSkill.maxLevel) * 100} className="h-2 mt-1" />
                  </div>
                  
                  {selectedSkill.requirements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Requirements</h3>
                      <ul className="text-sm text-gray-400">
                        {selectedSkill.requirements.map((reqId) => {
                          const reqSkill = skills.find(s => s.id === reqId);
                          return (
                            <li key={reqId} className="flex justify-between">
                              <span>{reqSkill?.name}</span>
                              <span>{reqSkill?.level}/{reqSkill?.maxLevel}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-4"
                    disabled={!canUpgradeSkill(selectedSkill) || isUpdating}
                    onClick={upgradeSkill}
                  >
                    {isUpdating ? "Upgrading..." : 
                      selectedSkill.level === 0 ? "Unlock Skill" : "Upgrade Skill"}
                  </Button>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-10">
                  Select a skill to view details
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 mt-4">
            <CardHeader>
              <CardTitle>Skill Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold">Available Points</p>
                  <p className="text-2xl font-bold text-purple-500">{skillPoints}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Next point in</p>
                  <p className="text-md font-medium">{3 - ((character?.level || 1) % 3 || 3)} level ups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 