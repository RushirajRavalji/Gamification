import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { getCharacter, updateCharacterStats, addXpToCharacter, createInitialCharacter } from '@/lib/firebase/db';
import { Character, CharacterStats } from '@/lib/types';

export function useCharacter() {
  const { user, loading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const isFetchingRef = useRef(false);

  // Use useCallback to memoize the fetchCharacter function
  const fetchCharacter = useCallback(async () => {
    // Skip if already fetching
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      if (user) {
        const characterData = await getCharacter();
        setCharacter(prev => {
          // Only update if the data is different or null
          if (!prev || JSON.stringify(prev) !== JSON.stringify(characterData)) {
            return characterData;
          }
          return prev;
        });
        setHasFetched(true);
      }
    } catch (err) {
      console.error("Error fetching character:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasFetched && !isFetchingRef.current) {
      fetchCharacter();
    } else if (!user) {
      setCharacter(null);
      setIsLoading(false);
      setHasFetched(false);
    }
  }, [user, fetchCharacter, hasFetched]);

  const updateStats = async (newStats: Partial<CharacterStats>) => {
    try {
      if (!character) {
        throw new Error("Character not found");
      }
      
      await updateCharacterStats(newStats);
      
      // Update local state
      setCharacter(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          stats: {
            ...prev.stats,
            ...newStats
          }
        };
      });
      
      return true;
    } catch (err) {
      console.error("Error updating character stats:", err);
      return false;
    }
  };

  const addXp = async (xpAmount: number) => {
    try {
      if (!character) {
        throw new Error("Character not found");
      }
      
      const result = await addXpToCharacter(xpAmount);
      
      // Update local state
      setCharacter(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          xp: result.newXp,
          level: result.newLevel,
          xpToNextLevel: result.newXpToNextLevel,
          totalXpEarned: result.totalXpEarned
        };
      });
      
      return true;
    } catch (err) {
      console.error("Error adding XP:", err);
      return false;
    }
  };

  return {
    character,
    isLoading,
    error,
    fetchCharacter,
    updateStats,
    addXp
  };
} 