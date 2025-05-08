import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/auth';
import { getQuests, updateQuestStatus } from '../firebase/db';
import { Quest, QuestStatus } from '../types';

export function useQuests() {
  const { user, loading } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data when we have a logged in user
    if (!loading && user) {
      fetchQuests();
    }
  }, [user, loading]);

  const fetchQuests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const questsData = await getQuests();
      setQuests(questsData);
    } catch (err) {
      console.error("Error fetching quests:", err);
      setError("Failed to load quests data");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuest = async (questId: string, newStatus: QuestStatus) => {
    try {
      await updateQuestStatus(questId, newStatus);
      
      // Update local state
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === questId ? { ...q, status: newStatus } : q
        )
      );
      
      return true;
    } catch (err) {
      console.error("Error updating quest:", err);
      return false;
    }
  };

  const updateDungeonTask = async (dungeonId: string, taskIndex: number) => {
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
      
      // Update local state
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === dungeonId ? updatedQuest : q
        )
      );
      
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
  };

  // Filter quests by type
  const getQuestsByType = (type: string) => {
    return quests.filter(quest => quest.type === type);
  };

  return {
    quests,
    isLoading,
    error,
    fetchQuests,
    updateQuest,
    updateDungeonTask,
    getQuestsByType
  };
} 