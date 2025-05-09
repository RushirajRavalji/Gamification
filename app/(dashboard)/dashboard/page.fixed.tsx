"use client";

import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/firebase/auth";
import { XpJournalEntry } from "@/lib/types";
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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading, fetchCharacter } = useCharacter();
  const { quests, isLoading: questsLoading, updateQuest, getQuestsByType, fetchQuests } = useQuests();
  const [recentAchievements, setRecentAchievements] = useState<XpJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streakMessage, setStreakMessage] = useState<string>('');
  const [showAchievement, setShowAchievement] = useState<{id: string, title: string, xp: number} | null>(null);
  const [taskUndone, setTaskUndone] = useState<{id: string, title: string, xp: number} | null>(null);
  const hasRunInitialCheckRef = useRef(false);

  // Get daily and active quests
  const dailyQuests = getQuestsByType("Daily");
  const activeQuests = [...getQuestsByType("Dungeon"), ...getQuestsByType("BossFight")].filter(q => q.status === "InProgress");

  // Function to fetch achievements
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

  // Track when all data is loaded
  useEffect(() => {
    if (!authLoading && !characterLoading && !questsLoading) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [authLoading, characterLoading, questsLoading]);

  // Check if daily tasks need to be evaluated and reset
  const checkAndEvaluateDailyTasks = async () => {
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
          return;
        }
      }
      
      // First evaluate any missed tasks from yesterday with penalties
      await evaluateDailyTasks();
      
      // Then reset daily tasks for today
      await resetDailyTasks();
      
      // Store current timestamp for next check
      localStorage.setItem('lastDailyEvaluation', Date.now().toString());
      
      // Refresh quests after evaluation
      await fetchQuests();
      
      console.log("Daily tasks evaluated and reset for today");
    } catch (error) {
      console.error("Error evaluating or resetting daily tasks:", error);
    }
  };

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
      
      // Check if we need to evaluate yesterday's tasks
      checkAndEvaluateDailyTasks();
    }
  }, [isLoading, user, character, fetchCharacter, fetchAchievements]);

  // Handle quest completion
  const handleQuestCompletion = async (questId: string) => {
    try {
      // Find the quest
      const quest = dailyQuests.find(q => q.id === questId);
      
      if (!quest) return;
      
      // Toggle the status
      const newStatus = quest.status === "Completed" ? "InProgress" : "Completed";
      const isCompleting = newStatus === "Completed";
      
      // Update in Firebase
      const success = await updateQuest(questId, newStatus);
      
      if (success) {
        // Show achievement popup on completion (only when marking as complete)
        if (isCompleting) {
          setShowAchievement({
            id: questId,
            title: quest.title,
            xp: quest.xpReward
          });
          
          // Clear any task undone notification
          setTaskUndone(null);
          
          // Update streak status for daily quests
          if (quest.type === 'Daily') {
            const streakResult = await checkAndUpdateStreak();
            if (streakResult && streakResult.message) {
              setStreakMessage(streakResult.message);
            }
          }
        } else {
          // Show task undone notification
          setTaskUndone({
            id: questId,
            title: quest.title,
            xp: quest.xpReward
          });
          
          // Clear any achievement notification
          setShowAchievement(null);
          
          // Message for undoing a task
          console.log(`Task "${quest.title}" marked as incomplete. XP and rewards have been removed.`);
          // You could add a toast notification here
        }
        
        // Refresh character data to sync XP and stats in the UI
        await fetchCharacter();
        console.log("Character data refreshed after quest status update");
      } else {
        console.error("Failed to update quest status");
      }
      
    } catch (error) {
      console.error("Error updating quest:", error);
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
      
      {/* Task undone notification */}
      <TaskUndoneNotification
        task={taskUndone}
        onComplete={() => setTaskUndone(null)}
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
        {/* Rest of the component remains the same */}
        {/* ... */}
      </div>
    </div>
  );
} 