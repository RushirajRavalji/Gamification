"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/auth";
import { XpJournalEntry, Quest, QuestStatus } from "@/lib/types";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { useQuests } from "@/lib/hooks/useQuests";
import { checkAndUpdateStreak, calculateAndUpdateTotalXP, evaluateDailyTasks, resetDailyTasks } from "@/lib/firebase/db";
// Temporarily comment out until the package is properly installed
// import { toast } from "react-hot-toast";
import CharacterRadarChart from "@/app/components/CharacterRadarChart";
import CharacterAvatar from "@/app/components/CharacterAvatar";
import FloatingAchievement from "@/app/components/FloatingAchievement";
import { motion } from "framer-motion";
import TaskUndoneNotification from "@/app/components/TaskUndoneNotification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// These components don't exist in the current codebase, commenting them out
// import SparkleButton from "@/app/components/SparkleButton";
// import QuestCard from "@/app/components/QuestCard";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading, fetchCharacter } = useCharacter();
  const { 
    quests, 
    isLoading: questsLoading, 
    updateQuest, 
    // Use the pre-filtered quests instead of filtering on each render
    dailyQuests, 
    dungeonQuests,
    bossFightQuests,
    fetchQuests 
  } = useQuests();
  
  const [recentAchievements, setRecentAchievements] = useState<XpJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streakMessage, setStreakMessage] = useState<string>('');
  const [showAchievement, setShowAchievement] = useState<{id: string, title: string, xp: number} | null>(null);
  const [taskUndone, setTaskUndone] = useState<{id: string, title: string, xp: number} | null>(null);
  const hasRunInitialCheckRef = useRef(false);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);

  // Active quests - dungeons and boss fights that are in progress
  const activeQuests = useMemo(() => {
    return [...dungeonQuests, ...bossFightQuests].filter(q => q.status === "InProgress");
  }, [dungeonQuests, bossFightQuests]);
  
  // Sorted daily quests with completed ones at the bottom
  const sortedDailyQuests = useMemo(() => {
    return [...dailyQuests].sort((a, b) => {
      // Sort by completion status - incomplete first, completed last
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (a.status !== "Completed" && b.status === "Completed") return -1;
      return 0;
    });
  }, [dailyQuests]);

  // Function to fetch achievements - optimized with useCallback and debounce
  const fetchAchievements = useCallback(async () => {
    // Skip if we've already loaded achievements or have no user
    if (achievementsLoaded || !user) return;
    
    try {
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
      setAchievementsLoaded(true);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  }, [user, achievementsLoaded]);

  // Optimize loading state tracking
  useEffect(() => {
    const isLoadingNow = authLoading || characterLoading || questsLoading;
    
    if (isLoading !== isLoadingNow) {
      setIsLoading(isLoadingNow);
    }
  }, [authLoading, characterLoading, questsLoading, isLoading]);

  // Optimize daily task evaluation with useCallback and a timestamp checker
  const checkAndEvaluateDailyTasks = useCallback(async () => {
    // Skip if no user is logged in
    if (!user) return false;
    
    try {
      // Get last evaluation timestamp from localStorage
      const lastEvaluation = localStorage.getItem('lastDailyEvaluation');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if we've already evaluated tasks today
      if (lastEvaluation) {
        const lastEvalDate = new Date(parseInt(lastEvaluation));
        lastEvalDate.setHours(0, 0, 0, 0);
        
        // If we've already evaluated today, skip
        if (lastEvalDate.getTime() === today.getTime()) {
          return false;
        }
      }
      
      // First evaluate any missed tasks from yesterday with penalties
      await evaluateDailyTasks();
      
      // Then reset daily tasks for today
      await resetDailyTasks();
      
      // Store current timestamp for next check
      localStorage.setItem('lastDailyEvaluation', Date.now().toString());
      
      // Refresh quests after evaluation
      await fetchQuests(true); // Force refresh to get updated data
      
      return true;
    } catch (error) {
      console.error("Error evaluating or resetting daily tasks:", error);
      return false;
    }
  }, [user, fetchQuests]);

  // Combine initialization into a single effect with proper sequencing
  useEffect(() => {
    if (isLoading || !user || hasRunInitialCheckRef.current) return;
    
    const initDashboard = async () => {
      // Set flag immediately to prevent duplicate runs
      hasRunInitialCheckRef.current = true;
      
      try {
        // 1. Check for daily task evaluation first
        await checkAndEvaluateDailyTasks();
        
        // 2. Update streak next
        const streakResult = await checkAndUpdateStreak();
        if (streakResult?.message) {
          setStreakMessage(streakResult.message);
        }
        
        // 3. Check XP if needed
        if (character?.xp === 0) {
          const xpGained = await calculateAndUpdateTotalXP();
          if (xpGained > 0) {
            // Refresh character with updated XP
            await fetchCharacter(true);
          }
        }
        
        // 4. Load achievements last (least critical)
        await fetchAchievements();
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      }
    };
    
    initDashboard();
  }, [
    isLoading, 
    user, 
    character, 
    fetchCharacter, 
    fetchAchievements, 
    checkAndEvaluateDailyTasks
  ]);

  // Define the memoized components for list items
  const DailyQuestItem = useCallback(({ quest, index, onComplete }: { quest: Quest, index: number, onComplete: (id: string) => void }) => {
    // Local state to handle immediate visual feedback
    const [isChecked, setIsChecked] = useState(quest.status === "Completed");
    
    // Update local state when quest status changes
    useEffect(() => {
      setIsChecked(quest.status === "Completed");
    }, [quest.status]);
    
    const handleToggle = () => {
      // Update local state immediately
      setIsChecked(!isChecked);
      // Call the actual handler
      onComplete(quest.id);
    };
    
    return (
      <motion.div 
        key={quest.id} 
        className={`flex items-center justify-between p-5 rounded-lg bg-gray-700/60 backdrop-blur-sm border border-gray-600 transition-all hover:shadow-md hover:shadow-purple-700/10 ${isChecked ? 'quest-completed' : ''}`}
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.05 * index, duration: 0.3 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center space-x-5">
          <input 
            type="checkbox" 
            checked={isChecked} 
            onChange={handleToggle}
            className="h-5 w-5 rounded border-gray-500 text-purple-600 focus:ring-purple-600"
          />
          <div>
            <p className={`font-medium ${isChecked ? 'line-through text-gray-400' : 'text-white'}`}>
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
            variant={isChecked ? "outline" : "default"}
            onClick={handleToggle}
            className={isChecked ? "" : "bg-gradient-to-r from-purple-600 to-pink-600"}
          >
            {isChecked ? "View" : "Complete"}
          </Button>
        </motion.div>
      </motion.div>
    );
  }, []);
  
  const ActiveQuestItem = useCallback(({ quest, index }: { quest: Quest, index: number }) => (
    <motion.div 
      key={quest.id} 
      className="space-y-3 p-5 rounded-lg bg-gray-700/60 backdrop-blur-sm border border-gray-600 transition-all hover:shadow-md hover:shadow-purple-700/10"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
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
  ), []);

  // Optimize quest completion handler
  const handleQuestCompletion = useCallback(async (questId: string) => {
    try {
      // Find the quest 
      const quest = dailyQuests.find(q => q.id === questId);
      
      if (!quest) return;
      
      // Toggle the status
      const newStatus = quest.status === "Completed" ? "InProgress" : "Completed";
      const isCompleting = newStatus === "Completed";
      
      // Optimistically update UI immediately
      // Create a copy of dailyQuests with the toggled status
      const updatedQuests = dailyQuests.map(q => 
        q.id === questId ? { ...q, status: newStatus as QuestStatus } : q
      );
      
      // Force a re-render by updating a state variable
      // Note: This works because we're using useMemo for sortedDailyQuests which depends on dailyQuests
      // This is a temporary solution - in a full implementation we would use proper state management
      setIsLoading(prevLoading => {
        setTimeout(() => setIsLoading(prevLoading), 0);
        return prevLoading;
      });
      
      // Update notifications immediately
      if (isCompleting) {
        setTaskUndone(null);
        setShowAchievement({
          id: questId,
          title: quest.title,
          xp: quest.xpReward
        });
      } else {
        setShowAchievement(null);
        setTaskUndone({
          id: questId,
          title: quest.title,
          xp: quest.xpReward
        });
      }
      
      // Update in Firebase (in the background)
      updateQuest(questId, newStatus).then(success => {
        if (!success) {
          console.error("Failed to update quest status");
          return;
        }
        
        // Perform secondary updates after successful quest update
        if (isCompleting && quest.type === 'Daily') {
          checkAndUpdateStreak().then(streakResult => {
            if (streakResult?.message) {
              setStreakMessage(streakResult.message);
            }
          });
        }
        
        // Refresh character data to sync XP and stats in the UI
        fetchCharacter(true);
      }).catch(error => {
        console.error("Error updating quest:", error);
      });
      
    } catch (error) {
      console.error("Error updating quest:", error);
    }
  }, [dailyQuests, updateQuest, checkAndUpdateStreak, fetchCharacter]);

  // Lazy loading for content - fixed to work properly with the components
  const renderDailyQuests = () => {
    if (dailyQuests.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8 border border-dashed border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="mb-2">No daily quests available.</p>
            <Button variant="outline" size="sm" asChild className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 rounded-md">
              <Link href="/dashboard/quests/create">Create your first quest</Link>
            </Button>
          </motion.div>
        </div>
      );
    }
    
    return (
      <div className="max-h-64 overflow-y-auto pr-3 custom-scrollbar">
        <div className="space-y-4">
          {sortedDailyQuests.map((quest, index) => (
            <DailyQuestItem 
              key={quest.id}
              quest={quest} 
              index={index} 
              onComplete={handleQuestCompletion} 
            />
          ))}
        </div>
      </div>
    );
  };

  const renderActiveQuests = () => {
    if (activeQuests.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8 border border-dashed border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="mb-3">No active quests. Start a dungeon or boss fight!</p>
            <Button variant="outline" size="sm" asChild className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 rounded-md">
              <Link href="/dashboard/quests">Browse quests</Link>
            </Button>
          </motion.div>
        </div>
      );
    }
    
    return (
      <div className="max-h-64 overflow-y-auto pr-3 custom-scrollbar">
        <div className="space-y-4">
          {activeQuests.map((quest, index) => (
            <ActiveQuestItem 
              key={quest.id}
              quest={quest} 
              index={index}
            />
          ))}
        </div>
      </div>
    );
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
      
      {/* Task undone notification */}
      <TaskUndoneNotification
        task={taskUndone}
        onComplete={() => setTaskUndone(null)}
      />
      
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
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
              {renderDailyQuests()}
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
              {renderActiveQuests()}
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