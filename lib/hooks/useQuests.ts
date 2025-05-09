import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../firebase/auth';
import { getQuests, updateQuestStatus } from '../firebase/db';
import { Quest, QuestStatus, QuestType } from '../types';

// Cache for quests data across hook instances
const questsCache = new Map<string, {
  data: Quest[];
  timestamp: number;
  questsByType: Record<string, Quest[]>;
}>();

// Cache TTL in milliseconds (10 seconds)
const CACHE_TTL = 10000;

export function useQuests() {
  const { user, loading } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Store categorized quests to avoid recalculation
  const questsByTypeRef = useRef<Record<string, Quest[]>>({});
  
  // Get userId for cache key
  const userId = useMemo(() => user?.uid || '', [user]);
  
  // Check if cached data exists and is still valid
  const getCachedQuests = useCallback(() => {
    if (!userId) return null;
    
    const cached = questsCache.get(userId);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL) {
      questsCache.delete(userId);
      return null;
    }
    
    return cached;
  }, [userId]);

  const fetchQuests = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;
    
    // Check for throttling unless force=true
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 2000) {
      return; // Throttle requests to max 1 every 2 seconds
    }
    
    // Use cache if available and not forced refresh
    if (!force) {
      const cached = getCachedQuests();
      if (cached) {
        setQuests(cached.data);
        questsByTypeRef.current = cached.questsByType;
        setIsLoading(false);
        setHasFetched(true);
        return;
      }
    }
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      lastFetchTimeRef.current = now;
      
      const questsData = await getQuests();
      
      // Pre-categorize quests by type for faster filtering later
      const byType: Record<string, Quest[]> = {};
      
      questsData.forEach(quest => {
        if (!byType[quest.type]) {
          byType[quest.type] = [];
        }
        byType[quest.type].push(quest);
      });
      
      // Update cache
      questsCache.set(userId, {
        data: questsData,
        timestamp: Date.now(),
        questsByType: byType
      });
      
      questsByTypeRef.current = byType;
      setQuests(questsData);
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching quests:", err);
      setError("Failed to load quests data");
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [userId, getCachedQuests]);

  useEffect(() => {
    // Only fetch data when we have a logged in user and haven't fetched yet
    if (!loading && user && !hasFetched && !isFetchingRef.current) {
      fetchQuests();
    } else if (!user) {
      setQuests([]);
      setIsLoading(false);
      setHasFetched(false);
      questsByTypeRef.current = {};
    }
  }, [user, loading, hasFetched, fetchQuests]);

  const updateQuest = useCallback(async (questId: string, newStatus: QuestStatus) => {
    try {
      await updateQuestStatus(questId, newStatus);
      
      // Update local state
      setQuests(prevQuests => {
        const updatedQuests = prevQuests.map(q => 
          q.id === questId ? { ...q, status: newStatus } : q
        );
        
        // Update cache
        if (userId) {
          // Get existing cache or create new one
          const existing = questsCache.get(userId);
          
          if (existing) {
            // Re-categorize quests by type
            const byType: Record<string, Quest[]> = {};
            
            updatedQuests.forEach(quest => {
              if (!byType[quest.type]) {
                byType[quest.type] = [];
              }
              byType[quest.type].push(quest);
            });
            
            questsCache.set(userId, {
              data: updatedQuests,
              timestamp: Date.now(),
              questsByType: byType
            });
            
            questsByTypeRef.current = byType;
          }
        }
        
        return updatedQuests;
      });
      
      return true;
    } catch (err) {
      console.error("Error updating quest:", err);
      return false;
    }
  }, [userId]);

  const updateDungeonTask = useCallback(async (dungeonId: string, taskIndex: number) => {
    try {
      // Find the dungeon
      const dungeon = quests.find(q => q.id === dungeonId);
      
      if (!dungeon || !dungeon.tasks || dungeon.tasks.length <= taskIndex) {
        console.error("Invalid dungeon or task index");
        return false;
      }
      
      // Get tasks from the dungeon quest
      const tasks = [...dungeon.tasks];
      
      // Toggle the task completion
      tasks[taskIndex].completed = !tasks[taskIndex].completed;
      
      // Calculate progress based on completed tasks
      const completedTasks = tasks.filter(t => t.completed).length;
      const progress = Math.round((completedTasks / tasks.length) * 100);
      
      // Create updated quest object
      const updatedQuest = {
        ...dungeon,
        tasks,
        progress,
        // If all tasks are complete, mark the quest as completed
        status: progress === 100 ? 'Completed' as QuestStatus : dungeon.status
      };
      
      // Update local state optimistically
      setQuests(prevQuests => {
        const updatedQuests = prevQuests.map(q => 
          q.id === dungeonId ? updatedQuest : q
        );
        
        // Update cache
        if (userId) {
          const existing = questsCache.get(userId);
          
          if (existing) {
            // Re-categorize quests
            const byType: Record<string, Quest[]> = {};
            
            updatedQuests.forEach(quest => {
              if (!byType[quest.type]) {
                byType[quest.type] = [];
              }
              byType[quest.type].push(quest);
            });
            
            questsCache.set(userId, {
              data: updatedQuests,
              timestamp: Date.now(),
              questsByType: byType
            });
            
            questsByTypeRef.current = byType;
          }
        }
        
        return updatedQuests;
      });
      
      // For simplicity in this implementation, we'll update the entire quest doc
      // In a real app, you might have a specific function for updating tasks
      if (progress === 100) {
        await updateQuestStatus(dungeonId, 'Completed');
      }
      
      return true;
    } catch (err) {
      console.error("Error updating dungeon task:", err);
      return false;
    }
  }, [quests, userId]);

  // Optimized filter quests by type - uses pre-categorized quests
  const getQuestsByType = useCallback((type: string) => {
    // First check in our pre-categorized cache
    if (questsByTypeRef.current[type]) {
      return questsByTypeRef.current[type];
    }
    
    // Fallback to filtering the full list
    return quests.filter(quest => quest.type === type);
  }, [quests]);
  
  // Memoized getters for common quest types to further reduce calculations
  const dailyQuests = useMemo(() => getQuestsByType('Daily'), [getQuestsByType]);
  const dungeonQuests = useMemo(() => getQuestsByType('Dungeon'), [getQuestsByType]);
  const bossFightQuests = useMemo(() => getQuestsByType('BossFight'), [getQuestsByType]);
  const sideQuests = useMemo(() => getQuestsByType('SideQuest'), [getQuestsByType]);

  return {
    quests,
    isLoading,
    error,
    fetchQuests,
    updateQuest,
    updateDungeonTask,
    getQuestsByType,
    // Add pre-filtered quest lists
    dailyQuests,
    dungeonQuests,
    bossFightQuests,
    sideQuests
  };
} 