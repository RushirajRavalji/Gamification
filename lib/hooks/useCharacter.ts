import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { getCharacter, updateCharacterStats, addXpToCharacter } from '@/lib/firebase/db';
import { Character, CharacterStats } from '@/lib/types';

// Cache for character data across hook instances
const characterCache = new Map<string, {
  data: Character | null;
  timestamp: number;
}>();

// Cache TTL in milliseconds (10 seconds)
const CACHE_TTL = 10000;

export function useCharacter() {
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Get userId for cache key
  const userId = useMemo(() => user?.uid || '', [user]);
  
  // Check if cached data exists and is still valid
  const getCachedCharacter = useCallback(() => {
    if (!userId) return null;
    
    const cached = characterCache.get(userId);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL) {
      characterCache.delete(userId);
      return null;
    }
    
    return cached.data;
  }, [userId]);

  // Use useCallback to memoize the fetchCharacter function
  const fetchCharacter = useCallback(async (force = false) => {
    // Skip if already fetching
    if (isFetchingRef.current) return;
    
    // Check for throttling unless force=true
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 2000) {
      return; // Throttle requests to max 1 every 2 seconds
    }
    
    // Use cache if available and not forced refresh
    if (!force) {
      const cachedCharacter = getCachedCharacter();
      if (cachedCharacter) {
        setCharacter(cachedCharacter);
        setIsLoading(false);
        setHasFetched(true);
        return;
      }
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    lastFetchTimeRef.current = now;
    
    try {
      if (user) {
        const characterData = await getCharacter();
        
        // Update cache
        characterCache.set(userId, {
          data: characterData,
          timestamp: Date.now()
        });
        
        setCharacter(characterData);
        setHasFetched(true);
      }
    } catch (err) {
      console.error("Error fetching character:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, userId, getCachedCharacter]);

  useEffect(() => {
    if (user && !hasFetched && !isFetchingRef.current) {
      fetchCharacter();
    } else if (!user) {
      setCharacter(null);
      setIsLoading(false);
      setHasFetched(false);
    }
  }, [user, fetchCharacter, hasFetched]);

  const updateStats = useCallback(async (newStats: Partial<CharacterStats>) => {
    try {
      if (!character || !userId) {
        throw new Error("Character not found");
      }
      
      await updateCharacterStats(newStats);
      
      // Update local state optimistically
      const updatedStats = { ...character.stats };
      
      // Add each new stat value to the current value
      Object.entries(newStats).forEach(([statName, value]) => {
        if (value !== undefined && value !== null) {
          const currentValue = updatedStats[statName as keyof CharacterStats] || 0;
          updatedStats[statName as keyof CharacterStats] = currentValue + value;
        }
      });
      
      const updatedCharacter = {
        ...character,
        stats: updatedStats
      };
      
      // Update local state
      setCharacter(updatedCharacter);
      
      // Update cache
      characterCache.set(userId, {
        data: updatedCharacter,
        timestamp: Date.now()
      });
      
      return true;
    } catch (err) {
      console.error("Error updating character stats:", err);
      return false;
    }
  }, [character, userId]);

  const addXp = useCallback(async (xpAmount: number) => {
    try {
      if (!character || !userId) {
        throw new Error("Character not found");
      }
      
      const result = await addXpToCharacter(xpAmount);
      
      // Create updated character with new XP data
      const updatedCharacter = {
        ...character,
        xp: result.newXp,
        level: result.newLevel,
        xpToNextLevel: result.newXpToNextLevel,
        totalXpEarned: result.totalXpEarned
      };
      
      // Update local state
      setCharacter(updatedCharacter);
      
      // Update cache
      characterCache.set(userId, {
        data: updatedCharacter,
        timestamp: Date.now()
      });
      
      return true;
    } catch (err) {
      console.error("Error adding XP:", err);
      return false;
    }
  }, [character, userId]);

  return {
    character,
    isLoading,
    error,
    fetchCharacter,
    updateStats,
    addXp
  };
} 