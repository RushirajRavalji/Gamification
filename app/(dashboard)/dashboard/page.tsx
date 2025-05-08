"use client";

import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/auth";
import { XpJournalEntry } from "@/lib/types";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { useQuests } from "@/lib/hooks/useQuests";
import { checkAndUpdateStreak, calculateAndUpdateTotalXP } from "@/lib/firebase/db";
// Temporarily comment out until the package is properly installed
// import { toast } from "react-hot-toast";
import CharacterRadarChart from "@/app/components/CharacterRadarChart";
import CharacterAvatar from "@/app/components/CharacterAvatar";
import AnimatedCard from "@/app/components/AnimatedCard";
import FloatingAchievement from "@/app/components/FloatingAchievement";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading, fetchCharacter } = useCharacter();
  const { quests, isLoading: questsLoading, updateQuest, getQuestsByType } = useQuests();
  const [recentAchievements, setRecentAchievements] = useState<XpJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streakMessage, setStreakMessage] = useState<string>('');
  const [showAchievement, setShowAchievement] = useState<{id: string, title: string, xp: number} | null>(null);
  const [calculatedXP, setCalculatedXP] = useState<number | null>(null);
  const hasRunInitialCheckRef = useRef(false);

  // Get daily and active quests
  const dailyQuests = getQuestsByType("Daily");
  const activeQuests = [...getQuestsByType("Dungeon"), ...getQuestsByType("BossFight")].filter(q => q.status === "InProgress");

  // Track when all data is loaded
  useEffect(() => {
    if (!authLoading && !characterLoading && !questsLoading) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [authLoading, characterLoading, questsLoading]);

  // Handle initial data check - streak and XP calculation
  useEffect(() => {
    // Only run once after initial data is loaded and when we have a user
    if (!isLoading && user && !hasRunInitialCheckRef.current) {
      hasRunInitialCheckRef.current = true;
      
      // Check and update streak
      checkAndUpdateStreak().then(result => {
        if (result && result.message) {
          setStreakMessage(result.message);
        }
      }).catch(error => {
        console.error("Error updating streak:", error);
      });
      
      // Check and update total XP if character has 0 XP
      if (character && character.xp === 0) {
        calculateAndUpdateTotalXP().then(xp => {
          setCalculatedXP(xp);
          // Refresh character data if XP was updated
          if (xp > 0) {
            fetchCharacter();
          }
        }).catch(error => {
          console.error("Error calculating total XP:", error);
        });
      }
      
      // Fetch achievements only once at the beginning
      fetchAchievements();
    }
  }, [isLoading, user, character, fetchCharacter]);

  const fetchAchievements = async () => {
    try {
      // Fetch recent achievements
      if (user) {
        const journalRef = collection(db, 'users', user.uid, 'xpJournal');
        const journalQuery = query(journalRef, orderBy('timestamp', 'desc'), limit(2));
        const journalSnap = await getDocs(journalQuery);
        
        const achievements = journalSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate()
          } as XpJournalEntry;
        });
        
        setRecentAchievements(achievements);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  // Handle quest completion
  const handleQuestCompletion = async (questId: string) => {
    try {
      // Find the quest
      const quest = dailyQuests.find(q => q.id === questId);
      
      if (!quest) return;
      
      // Toggle the status
      const newStatus = quest.status === "Completed" ? "InProgress" : "Completed";
      
      // Update in Firebase
      const success = await updateQuest(questId, newStatus);
      
      if (success) {
        // Show achievement popup on completion
        if (newStatus === "Completed") {
          setShowAchievement({
            id: questId,
            title: quest.title,
            xp: quest.xpReward
          });
          
          // Update streak status for daily quests
          if (quest.type === 'Daily') {
            const streakResult = await checkAndUpdateStreak();
            if (streakResult && streakResult.message) {
              setStreakMessage(streakResult.message);
            }
          }
        }
      } else {
        console.error("Failed to update quest status");
      }
      
    } catch (error) {
      console.error("Error completing quest:", error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Please log in to view your dashboard</h1>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(60,20,120,0.2),transparent_70%)] pointer-events-none"></div>
      
      {/* Achievement notification */}
      <FloatingAchievement 
        achievement={showAchievement}
        onComplete={() => setShowAchievement(null)}
      />
      
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
      >
        <div className="flex items-center">
          {character && (
            <CharacterAvatar 
              avatarId={character.avatarId}
              name={character.name}
              className="h-12 w-12 mr-4 animate-float"
            />
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Hero&apos;s Dashboard
            </h1>
            <p className="text-gray-400">Welcome back, {character?.name || "Hero"}!</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-700/20 hover:shadow-purple-700/40 transition-all" asChild>
            <Link href="/dashboard/quests/create">
              <span className="mr-2">✨</span> New Quest
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-full"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden relative group hover:shadow-lg hover:shadow-purple-700/10 transition-all h-full p-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="pb-3 pt-1">
              <h3 className="text-lg flex items-center text-purple-300">
                <span className="mr-3 animate-pulse-slow">⚡</span> Total XP
              </h3>
            </div>
            <div>
              <p className="text-4xl font-bold">{character?.totalXpEarned || 0}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className="px-2 py-0.5 bg-purple-900/80 rounded-full text-white text-xs">
                  Level {character?.level || 1}
                </span>
                <p className="text-sm text-gray-400">{character?.class || "Novice"}</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-full"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden relative group hover:shadow-lg hover:shadow-purple-700/10 transition-all h-full p-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="pb-3 pt-1">
              <h3 className="text-lg flex items-center text-purple-300">
                <span className="mr-3 animate-pulse-slow">🏆</span> Quests Completed
              </h3>
            </div>
            <div>
              <p className="text-4xl font-bold">{quests.filter(q => q.status === "Completed").length}</p>
              <p className="text-sm text-gray-400 mt-2">
                Daily: {dailyQuests.filter(q => q.status === "Completed").length} | 
                Boss: {quests.filter(q => q.status === "Completed" && q.type === "BossFight").length}
              </p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="h-full"
        >
          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden relative group hover:shadow-lg hover:shadow-purple-700/10 transition-all h-full p-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="pb-3 pt-1">
              <h3 className="text-lg flex items-center text-purple-300">
                <span className="mr-3 animate-pulse-slow">🔥</span> Current Streak
              </h3>
            </div>
            <div>
              <p className="text-4xl font-bold">{character?.streakCount || 0} Days</p>
              <p className="text-sm text-gray-400 mt-2">{streakMessage || "Complete daily quests to maintain your streak!"}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Daily Quests */}
        <motion.div 
          className="md:col-span-2 space-y-4 sm:space-y-6 md:space-y-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden relative group hover:shadow-lg hover:shadow-purple-700/10 transition-all">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="pt-5 pb-3 px-5">
              <h3 className="flex items-center text-xl text-purple-300">
                <span className="mr-3 animate-pulse-slow">📝</span> Today&apos;s Quests
              </h3>
              <p className="text-sm text-gray-400">Complete your daily challenges to maintain your streak</p>
            </div>
            <div className="px-5 pb-5">
              {dailyQuests.length === 0 ? (
                <div className="text-center text-gray-400 py-8 border border-dashed border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="mb-2">No daily quests available.</p>
                    <Button variant="outline" size="sm" asChild className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 rounded-md">
                      <Link href="/dashboard/quests/create">Create your first quest</Link>
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-3 custom-scrollbar">
                  <div className="space-y-4">
                    {dailyQuests.map((quest, index) => (
                      <motion.div 
                        key={quest.id} 
                        className={`flex items-center justify-between p-5 rounded-lg bg-gray-700/60 backdrop-blur-sm border border-gray-600 transition-all hover:shadow-md hover:shadow-purple-700/10 ${quest.status === "Completed" ? 'quest-completed' : ''}`}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center space-x-5">
                          <input 
                            type="checkbox" 
                            checked={quest.status === "Completed"} 
                            onChange={() => handleQuestCompletion(quest.id)}
                            className="h-5 w-5 rounded border-gray-500 text-purple-600 focus:ring-purple-600"
                          />
                          <div>
                            <p className={`font-medium ${quest.status === "Completed" ? 'line-through text-gray-400' : 'text-white'}`}>
                              {quest.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs border-purple-500/30">
                                {quest.type}
                              </Badge>
                              <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                            </div>
                          </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button 
                            size="sm" 
                            variant={quest.status === "Completed" ? "outline" : "default"}
                            onClick={() => handleQuestCompletion(quest.id)}
                            className={quest.status === "Completed" ? "" : "bg-gradient-to-r from-purple-600 to-pink-600"}
                          >
                            {quest.status === "Completed" ? "View" : "Complete"}
                          </Button>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden relative group hover:shadow-lg hover:shadow-purple-700/10 transition-all">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="pt-5 pb-3 px-5">
              <h3 className="flex items-center text-xl text-purple-300">
                <span className="mr-3 animate-pulse-slow">⚔️</span> Active Quests
              </h3>
              <p className="text-sm text-gray-400">Your ongoing adventures</p>
            </div>
            <div className="px-5 pb-5">
              {activeQuests.length === 0 ? (
                <div className="text-center text-gray-400 py-8 border border-dashed border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="mb-3">No active quests. Start a dungeon or boss fight!</p>
                    <Button variant="outline" size="sm" asChild className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 rounded-md">
                      <Link href="/dashboard/quests">Browse quests</Link>
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-3 custom-scrollbar">
                  <div className="space-y-4">
                    {activeQuests.map((quest, index) => (
                      <motion.div 
                        key={quest.id} 
                        className="space-y-3 p-5 rounded-lg bg-gray-700/60 backdrop-blur-sm border border-gray-600 transition-all hover:shadow-md hover:shadow-purple-700/10"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-white">{quest.title}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs bg-purple-900/80 backdrop-blur-sm text-purple-200">
                                {quest.type}
                              </Badge>
                              <span className="text-xs text-gray-400">+{quest.xpReward} XP</span>
                            </div>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button size="sm" variant="outline" className="border-purple-500/30 hover:bg-purple-950/30" asChild>
                              <Link href={`/dashboard/quests?id=${quest.id}`}>Continue</Link>
                            </Button>
                          </motion.div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{quest.progress || 0}%</span>
                          </div>
                          <Progress 
                            value={quest.progress || 0} 
                            className="h-2 bg-gray-700"
                            indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-slow"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Character Stats & Recent Activity */}
        <motion.div 
          className="space-y-4 sm:space-y-6 md:space-y-8"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden relative group hover:shadow-lg hover:shadow-purple-700/10 transition-all">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="pt-5 pb-3 px-5">
              <h3 className="flex items-center text-xl text-purple-300">
                <span className="mr-3 animate-pulse-slow">📊</span> Character Stats
              </h3>
            </div>
            <div className="px-5 pb-5">
              <div className="h-[200px] mb-5">
                {character && (
                  <div className="h-full">
                    <CharacterRadarChart stats={character.stats} />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {character && Object.entries(character.stats).map(([stat, value]) => (
                  <motion.div 
                    key={stat} 
                    className="space-y-2 p-3 rounded-lg hover:bg-purple-900/10 transition-all"
                    whileHover={{ 
                      x: 5,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                  >
                    <div className="flex justify-between text-sm capitalize">
                      <span>{stat}</span>
                      <span>{value}</span>
                    </div>
                    <div className="relative w-full">
                      <Progress 
                        value={(value / 20) * 100} 
                        className="h-2 bg-gray-700"
                        indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-slow"
                      />
                      <motion.div 
                        className="absolute inset-0 pointer-events-none opacity-0"
                        whileHover={{ opacity: 0.5, transition: { duration: 0.3 } }}
                        style={{ 
                          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                          filter: 'blur(3px)',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-purple-500/30 hover:bg-purple-950/30 hover:text-purple-300 rounded-md py-2" 
                    asChild
                  >
                    <Link href="/dashboard/character">
                      View Character
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-900/20 rounded-xl overflow-hidden relative group hover:shadow-lg hover:shadow-purple-700/10 transition-all">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
            <div className="pt-5 pb-3 px-5">
              <h3 className="flex items-center text-xl text-purple-300">
                <span className="mr-3 animate-pulse-slow">🎯</span> Recent Achievements
              </h3>
            </div>
            <div className="px-5 pb-5">
              {recentAchievements.length === 0 ? (
                <div className="text-center text-gray-400 py-8 border border-dashed border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                  <p>Complete quests to earn achievements!</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto pr-3 custom-scrollbar">
                  <div className="space-y-4">
                    {recentAchievements.map((achievement, index) => (
                      <motion.div 
                        key={achievement.id} 
                        className="border-l-4 border-purple-500 pl-5 py-3 transition-all hover:bg-purple-900/10 rounded-r-md"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                        whileHover={{ x: 5 }}
                      >
                        <p className="font-medium text-amber-300 text-base">{achievement.title}</p>
                        <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-3">
                          {achievement.timestamp ? new Date(achievement.timestamp).toLocaleString() : ""}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-5">
                    <Button 
                      variant="outline" 
                      className="w-full border-purple-500/30 hover:bg-purple-950/30 hover:text-purple-300 rounded-md py-2" 
                      asChild
                    >
                      <Link href="/dashboard/journal">
                        View XP Journal
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 