import { db } from './firebase';
import { auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  Timestamp, 
  serverTimestamp,
  writeBatch,
  limit,
  DocumentReference,
  orderBy
} from 'firebase/firestore';
import { 
  Character, 
  CharacterStats, 
  Quest, 
  QuestStatus
} from '../types';

// Character operations
export async function getCharacter() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  try {
    const characterRef = collection(db, 'users', user.uid, 'character');
    const characterDocs = await getDocs(characterRef);
    
    if (characterDocs.empty) {
      // Create a default character if none exists
      console.log('No character found, creating initial character');
      return createInitialCharacter('Hero');
    }
    
    const characterData = characterDocs.docs[0].data();
    return {
      id: characterDocs.docs[0].id,
      ...characterData,
      createdAt: characterData.createdAt?.toDate(),
      updatedAt: characterData.updatedAt?.toDate()
    } as Character;
  } catch (error) {
    console.error('Error fetching character:', error);
    throw error;
  }
}

export async function createInitialCharacter(name: string) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  // Check if character already exists
  const characterRef = collection(db, 'users', user.uid, 'character');
  const characterDocs = await getDocs(characterRef);
  
  // If character exists, return it
  if (!characterDocs.empty) {
    const characterData = characterDocs.docs[0].data();
    
    // Check if the character has all the required stats
    // If not, update with missing stats
    const hasAllStats = 
      'strength' in characterData.stats &&
      'intelligence' in characterData.stats &&
      'focus' in characterData.stats &&
      'consistency' in characterData.stats &&
      'willpower' in characterData.stats &&
      'influence' in characterData.stats &&
      'relationships' in characterData.stats;
    
    if (!hasAllStats) {
      // Add any missing stats with default value
      const updatedStats = { ...characterData.stats };
      if (!('strength' in updatedStats)) updatedStats.strength = 5;
      if (!('intelligence' in updatedStats)) updatedStats.intelligence = 5;
      if (!('focus' in updatedStats)) updatedStats.focus = 5;
      if (!('consistency' in updatedStats)) updatedStats.consistency = 5;
      if (!('willpower' in updatedStats)) updatedStats.willpower = 5;
      if (!('influence' in updatedStats)) updatedStats.influence = 5;
      if (!('relationships' in updatedStats)) updatedStats.relationships = 5;
      
      // Update the character with all stats
      const characterDocRef = doc(db, 'users', user.uid, 'character', characterDocs.docs[0].id);
      await updateDoc(characterDocRef, {
        'stats': updatedStats,
        'updatedAt': serverTimestamp()
      });
      
      // Return updated character data
      return {
        id: characterDocs.docs[0].id,
        ...characterData,
        stats: updatedStats,
        createdAt: characterData.createdAt?.toDate(),
        updatedAt: new Date()
      } as Character;
    }
    
    return {
      id: characterDocs.docs[0].id,
      ...characterData,
      createdAt: characterData.createdAt?.toDate(),
      updatedAt: characterData.updatedAt?.toDate()
    } as Character;
  }
  
  const initialStats: CharacterStats = {
    strength: 5,
    intelligence: 5,
    focus: 5,
    consistency: 5,
    willpower: 5,
    influence: 5,
    relationships: 5
  };
  
  const newCharacter: Omit<Character, 'id'> = {
    userId: user.uid,
    name: name,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalXpEarned: 0,
    class: 'Novice',
    stats: initialStats,
    skills: [],
    inventory: [],
    questLog: [],
    streakCount: 0,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(characterRef, {
    ...newCharacter,
    lastActive: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return {
    id: docRef.id,
    ...newCharacter
  };
}

export async function updateCharacterStats(newStats: Partial<CharacterStats>) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const character = await getCharacter();
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  // Skip empty stat updates to prevent overwriting existing stats
  if (!newStats || Object.keys(newStats).length === 0) {
    console.log("Skipping character stats update - empty stats object");
    return;
  }
  
  console.log("Updating character stats:", newStats);
  console.log("Current character stats:", character.stats);
  
  // Create a merged stats object, carefully preserving all existing stats
  const mergedStats: CharacterStats = { ...character.stats };
  
  // Only update specific stats that are provided in newStats
  Object.entries(newStats).forEach(([statName, statValue]) => {
    if (statValue !== undefined && statValue !== null) {
      // Get the current stat value
      const currentValue = mergedStats[statName as keyof CharacterStats] || 0;
      
      // Add the new value to the current value
      mergedStats[statName as keyof CharacterStats] = currentValue + statValue;
      
      console.log(`Stat ${statName} updated: ${currentValue} + ${statValue} = ${mergedStats[statName as keyof CharacterStats]}`);
    }
  });
  
  console.log("Merged stats to save:", mergedStats);
  
  const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
  
  await updateDoc(characterDocRef, {
    'stats': mergedStats,
    'updatedAt': serverTimestamp()
  });
}

export async function addXpToCharacter(xpAmount: number) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const character = await getCharacter();
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
  
  let newXp = character.xp + xpAmount;
  let newLevel = character.level;
  let newXpToNextLevel = character.xpToNextLevel;
  
  // Update total lifetime XP earned
  const totalXpEarned = (character.totalXpEarned || 0) + xpAmount;
  
  // Level up logic
  while (newXp >= newXpToNextLevel) {
    newXp -= newXpToNextLevel;
    newLevel++;
    // Each level requires 10% more XP
    newXpToNextLevel = Math.floor(newXpToNextLevel * 1.1);
  }
  
  await updateDoc(characterDocRef, {
    'xp': newXp,
    'level': newLevel,
    'xpToNextLevel': newXpToNextLevel,
    'totalXpEarned': totalXpEarned,
    'updatedAt': serverTimestamp()
  });
  
  return { newXp, newLevel, newXpToNextLevel, totalXpEarned };
}

export async function updateStreak(increasedBy: number = 1) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const character = await getCharacter();
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
  
  await updateDoc(characterDocRef, {
    'streakCount': character.streakCount + increasedBy,
    'lastActive': serverTimestamp(),
    'updatedAt': serverTimestamp()
  });
  
  return character.streakCount + increasedBy;
}

// Add new function to check streak status based on last activity date
export async function checkAndUpdateStreak() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const character = await getCharacter();
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
  const today = new Date();
  
  // Debug what we received from Firestore
  console.log("Raw lastActive from Firestore:", character.lastActive);
  console.log("Raw lastActive type:", character.lastActive ? typeof character.lastActive : "undefined");
  if (character.lastActive && typeof character.lastActive === 'object') {
    console.log("lastActive has properties:", Object.keys(character.lastActive));
    if ('toDate' in character.lastActive && typeof character.lastActive.toDate === 'function') {
      console.log("lastActive is a Firestore Timestamp");
    }
  }
  
  // Safely get the last active date, falling back to creation date or today
  let lastActive;
  
  try {
    // Check if lastActive is a Firestore Timestamp
    if (character.lastActive && typeof character.lastActive === 'object' && 
        'toDate' in character.lastActive && typeof character.lastActive.toDate === 'function') {
      // Use toDate() method for Firestore Timestamp
      lastActive = character.lastActive.toDate();
      console.log("Converted Firestore Timestamp to Date:", lastActive);
    } 
    // Check if lastActive is already a Date
    else if (character.lastActive instanceof Date) {
      lastActive = character.lastActive;
      console.log("lastActive is already a Date:", lastActive);
    }
    // Check if lastActive is a valid date string or number
    else if (character.lastActive) {
      lastActive = new Date(character.lastActive);
      // Validate the date is reasonable
      if (isNaN(lastActive.getTime())) {
        throw new Error("Invalid time value");
      }
      console.log("Converted string/number to Date:", lastActive);
    }
    // Try createdAt as fallback
    else if (character.createdAt) {
      if (typeof character.createdAt === 'object' && 
          'toDate' in character.createdAt && 
          typeof character.createdAt.toDate === 'function') {
        lastActive = character.createdAt.toDate();
      } else if (character.createdAt instanceof Date) {
        lastActive = character.createdAt;
      } else {
        lastActive = new Date(character.createdAt);
        // Validate the date is reasonable
        if (isNaN(lastActive.getTime())) {
          throw new Error("Invalid createdAt time value");
        }
      }
      console.log("Using createdAt as fallback:", lastActive);
    } 
    // Last resort - use today's date
    else {
      lastActive = today;
      console.log("No valid date found, using today as fallback");
    }
  } catch (error) {
    console.error("Error converting dates:", error);
    // If date conversion fails, default to today
    lastActive = today;
  }
  
  // Ensure the date is valid before proceeding
  if (!lastActive || isNaN(lastActive.getTime())) {
    console.error("Invalid lastActive date detected, defaulting to today");
    console.error("lastActive value was:", character.lastActive);
    lastActive = today;
  }
  
  // Calculate days since last activity
  const lastActiveDate = new Date(lastActive);
  lastActiveDate.setHours(0, 0, 0, 0);
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  
  // Safe calculation of the time difference
  const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  console.log("Streak check - Current streak:", character.streakCount);
  console.log("Streak check - Normalized lastActiveDate:", lastActiveDate);
  console.log("Streak check - Normalized todayDate:", todayDate);
  console.log("Streak check - Days difference:", diffDays);
  
  // Check for any daily quests completed today
  try {
    const questsRef = collection(db, 'users', user.uid, 'quests');
    const questsQuery = query(questsRef, where('type', '==', 'Daily'), where('status', '==', 'Completed'));
    const questsSnapshot = await getDocs(questsQuery);
    
    console.log("Streak check - Completed daily quests count:", questsSnapshot.size);
    
    // Update streak based on days since last active and whether daily quests were completed
    let newStreakCount = character.streakCount;
    let streakMessage = '';
    
    if (diffDays === 0) {
      // Same day, check if there are completed quests to maintain streak
      if (questsSnapshot.size > 0 && character.streakCount === 0) {
        // First completion today and no streak yet, start one
        newStreakCount = 1;
        streakMessage = '🔥 Streak started! Complete daily quests tomorrow to continue!';
        
        await updateDoc(characterDocRef, {
          'streakCount': newStreakCount,
          'lastActive': serverTimestamp(),
          'updatedAt': serverTimestamp()
        });
        
        console.log("Streak started with count:", newStreakCount);
        return { streakCount: newStreakCount, message: streakMessage };
      }
      // Already have a streak and completed quests today, no change necessary
      if (questsSnapshot.size > 0 && character.streakCount > 0) {
        streakMessage = `🔥 ${character.streakCount} day streak - keep it up tomorrow!`;
        console.log("Streak maintained:", character.streakCount);
        return { streakCount: character.streakCount, message: streakMessage };
      }
      // No quests completed yet today
      if (questsSnapshot.size === 0) {
        if (character.streakCount > 0) {
          streakMessage = `🔥 ${character.streakCount} day streak - complete a daily quest to maintain it!`;
        } else {
          streakMessage = 'Complete a daily quest to start your streak!';
        }
        console.log("No quests completed yet today");
        return { streakCount: character.streakCount, message: streakMessage };
      }
    } else if (diffDays === 1) {
      // Yesterday - check if we completed tasks today to continue streak
      if (questsSnapshot.size > 0) {
        // Completed daily quests today, increase streak
        newStreakCount = character.streakCount + 1;
        streakMessage = `🔥 ${newStreakCount} day streak - well done!`;
        
        await updateDoc(characterDocRef, {
          'streakCount': newStreakCount,
          'lastActive': serverTimestamp(),
          'updatedAt': serverTimestamp()
        });
        
        console.log("Streak increased to:", newStreakCount);
        return { streakCount: newStreakCount, message: streakMessage };
      } else {
        // Haven't completed quests yet today, but still have a chance
        if (character.streakCount > 0) {
          streakMessage = `🔥 ${character.streakCount} day streak - complete a daily quest to maintain it!`;
        } else {
          streakMessage = 'Complete a daily quest to start your streak!';
        }
        console.log("No quests completed yet today, streak:", character.streakCount);
        return { streakCount: character.streakCount, message: streakMessage };
      }
    } else {
      // Multiple days since last active - check if completed quests today to restart streak
      if (questsSnapshot.size > 0) {
        // Missed days, but completed quests today - reset streak to 1
        newStreakCount = 1;
        streakMessage = '🔥 Streak restarted! Complete daily quests tomorrow to continue!';
        
        await updateDoc(characterDocRef, {
          'streakCount': newStreakCount,
          'lastActive': serverTimestamp(),
          'updatedAt': serverTimestamp()
        });
        
        console.log("New streak started:", newStreakCount);
        return { streakCount: newStreakCount, message: streakMessage };
      } else {
        // No streak, no completed quests
        streakMessage = 'Complete a daily quest to start your streak!';
        console.log("No streak and no completed quests");
        return { streakCount: 0, message: streakMessage };
      }
    }
  } catch (error) {
    console.error("Error in streak checking:", error);
    return { 
      streakCount: character.streakCount, 
      message: 'Error checking streak status. Please try again.' 
    };
  }
}

// Quest operations
export async function getQuests(type?: string, status?: QuestStatus) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  try {
    const questsRef = collection(db, 'users', user.uid, 'quests');
    
    // Build query based on parameters
    let questsQuery: any = questsRef;
    
    if (type && status) {
      questsQuery = query(
        questsRef, 
        where('type', '==', type),
        where('status', '==', status)
      );
    } else if (type) {
      questsQuery = query(questsRef, where('type', '==', type));
    } else if (status) {
      questsQuery = query(questsRef, where('status', '==', status));
    }
    
    const questsDocs = await getDocs(questsQuery);
    
    return questsDocs.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        ...data,
        deadline: data.deadline?.toDate?.(),
        createdAt: data.createdAt?.toDate?.(),
        updatedAt: data.updatedAt?.toDate?.()
      } as Quest;
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    throw error;
  }
}

export async function createQuest(quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const questsRef = collection(db, 'users', user.uid, 'quests');
  
  // Filter out any undefined values which Firestore doesn't support
  const cleanedQuest = Object.entries(quest).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  const docRef = await addDoc(questsRef, {
    ...cleanedQuest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return {
    id: docRef.id,
    ...quest,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function updateQuestStatus(questId: string, status: QuestStatus) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const questRef = doc(db, 'users', user.uid, 'quests', questId);
  
  // Get the quest data to check for penalties or rewards
  const questDoc = await getDoc(questRef);
  const questData = questDoc.data() as Quest;
  
  // Get the previous status
  const previousStatus = questData.status;
  
  // Update the quest status
  await updateDoc(questRef, {
    'status': status,
    'updatedAt': serverTimestamp()
  });
  
  // Track if we need to update the character
  let needsCharacterUpdate = false;
  
  // Handle XP and stat rewards based on status changes
  if (previousStatus !== status) {
    // If completing the quest (changing from not completed to completed)
    if (status === 'Completed' && previousStatus !== 'Completed') {
      if (questData && questData.xpReward) {
        // Add XP to the character
        await addXpToCharacter(questData.xpReward);
        needsCharacterUpdate = true;
        
        // Add entry to XP journal for task completion
        await addToXpJournal({
          title: `Task Completed: ${questData.title}`,
          description: `Earned ${questData.xpReward} XP for completing task`,
          xpGained: questData.xpReward,
          statsGained: questData.statRewards || {}
        });
        
        // If there are stat rewards, update character stats
        if (questData.statRewards && Object.keys(questData.statRewards).length > 0) {
          // Get current character stats
          const character = await getCharacter();
          if (!character) return;
          
          // Create updated stats by adding the rewards to current stats
          const updatedStats: Partial<CharacterStats> = {};
          
          Object.entries(questData.statRewards).forEach(([statName, value]) => {
            if (typeof value === 'number' && value > 0) {
              // Only include stats that have positive values
              updatedStats[statName as keyof CharacterStats] = value;
            }
          });
          
          // Log rewards being applied
          console.log("Applying stat rewards:", updatedStats);
          
          // Update character stats by adding the rewards
          if (Object.keys(updatedStats).length > 0) {
            await updateCharacterStats(updatedStats);
          }
        }
        
        // If it's a daily quest, update the streak
        if (questData.type === 'Daily') {
          await checkAndUpdateStreak();
        }
      }
    }
    // If un-completing the quest (changing from completed to not completed)
    else if (previousStatus === 'Completed' && status !== 'Completed') {
      if (questData && questData.xpReward) {
        // Remove XP from character
        await removeXpFromCharacter(questData.xpReward);
        needsCharacterUpdate = true;
        
        // Add entry to XP journal with negative XP
        await addToXpJournal({
          title: `Task Undone: ${questData.title}`,
          description: `Removed ${questData.xpReward} XP for uncompleting task`,
          xpGained: -questData.xpReward,
          statsGained: {}
        });
        
        // If there are stat rewards, remove them from character stats
        if (questData.statRewards && Object.keys(questData.statRewards).length > 0) {
          // Get current character stats
          const character = await getCharacter();
          if (!character) return;
          
          // Create updated stats by subtracting the rewards from current stats
          const updatedStats: Partial<CharacterStats> = {};
          
          Object.entries(questData.statRewards).forEach(([statName, value]) => {
            if (typeof value === 'number' && value > 0) {
              // Make the value negative to subtract
              updatedStats[statName as keyof CharacterStats] = -value;
            }
          });
          
          // Log rewards being removed
          console.log("Removing stat rewards:", updatedStats);
          
          // Update character stats by removing the rewards
          if (Object.keys(updatedStats).length > 0) {
            await updateCharacterStats(updatedStats);
          }
        }
        
        // If it's a daily quest, update the streak (may need to decrease)
        if (questData.type === 'Daily') {
          await checkAndUpdateStreak();
        }
      }
    }
  }
  
  return true;
}

// Journal operations
export async function addXpJournalEntry(entry: Record<string, unknown>) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const entriesRef = collection(db, 'users', user.uid, 'xpJournal');
  
  await addDoc(entriesRef, {
    ...entry,
    userId: user.uid,
    timestamp: serverTimestamp()
  });
}

// Function to check if a daily quest was completed on a specific date
export async function hasDailyQuestCompletionForDate(date: Date) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  // Set the date to start of day
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  // Set the date to end of day
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  // Convert to Firestore timestamps
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  
  // Query for daily quests that were completed on this date
  const questsRef = collection(db, 'users', user.uid, 'quests');
  const questsQuery = query(
    questsRef, 
    where('type', '==', 'Daily'), 
    where('status', '==', 'Completed'),
    where('updatedAt', '>=', startTimestamp),
    where('updatedAt', '<=', endTimestamp)
  );
  
  const questsSnapshot = await getDocs(questsQuery);
  
  return !questsSnapshot.empty;
}

// New function to calculate and update total XP
export async function calculateAndUpdateTotalXP() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  // Get the character
  const character = await getCharacter();
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  // If character already has XP, just return it, don't recalculate
  if (character.xp > 0 || character.level > 1) {
    return character.xp;
  }
  
  // Get all completed quests
  const questsRef = collection(db, 'users', user.uid, 'quests');
  const questsQuery = query(questsRef, where('status', '==', 'Completed'));
  const questsSnapshot = await getDocs(questsQuery);
  
  // Calculate total XP
  let totalXP = 0;
  questsSnapshot.forEach(doc => {
    const questData = doc.data();
    totalXP += questData.xpReward || 0;
  });
  
  // Only update if we found XP and the character's XP is still 0
  // This prevents unnecessary updates that could cause infinite loops
  if (totalXP > 0 && character.xp === 0) {
    const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
    
    // First update to set initial XP value
    await updateDoc(characterDocRef, {
      'xp': totalXP,
      'updatedAt': serverTimestamp()
    });
    
    // Calculate level based on XP
    let newLevel = 1;
    let xpRequired = 100; // XP required for level 2
    let remainingXP = totalXP;
    
    while (remainingXP >= xpRequired) {
      remainingXP -= xpRequired;
      newLevel++;
      xpRequired = Math.floor(xpRequired * 1.1); // Each level requires 10% more XP
    }
    
    // Only update again if level changed, to minimize Firestore writes
    if (newLevel > 1) {
      // Update level and XP to next level in a single operation
      await updateDoc(characterDocRef, {
        'level': newLevel,
        'xp': remainingXP,
        'xpToNextLevel': xpRequired,
        'updatedAt': serverTimestamp()
      });
    }
    
    return remainingXP; // Return current XP
  }
  
  return character.xp; // Return existing XP, even if it's 0
}

// Add this function to handle XP journal entries

interface XpJournalEntryInput {
  title: string;
  description: string;
  xpGained: number;
  statsGained: Partial<CharacterStats>;
  questId?: string;
  proofUrl?: string[];
}

export async function addToXpJournal(entry: XpJournalEntryInput) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  // Get the character
  const character = await getCharacter();
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  const journalRef = collection(db, 'users', user.uid, 'xpJournal');
  
  await addDoc(journalRef, {
    userId: user.uid,
    characterId: character.id,
    questId: entry.questId || null,
    title: entry.title,
    description: entry.description,
    xpGained: entry.xpGained,
    statsGained: entry.statsGained,
    proofUrl: entry.proofUrl || [],
    timestamp: serverTimestamp(),
  });
}

// Function to evaluate daily tasks at the end of the day
export async function evaluateDailyTasks() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  // Get today's date (without time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Get all daily tasks that are not completed and should have been done today
    const questsRef = collection(db, 'users', user.uid, 'quests');
    const dailyQuestsQuery = query(
      questsRef, 
      where('type', '==', 'Daily'),
      where('status', '!=', 'Completed'),
      where('penaltyForMissing', '==', true)
    );
    
    const dailyQuestsSnapshot = await getDocs(dailyQuestsQuery);
    
    if (dailyQuestsSnapshot.empty) {
      return { 
        tasksEvaluated: 0,
        message: 'No daily tasks to evaluate'
      };
    }
    
    // Evaluate each incomplete daily task
    const tasks = dailyQuestsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id,
        ...data, 
        deadline: data.deadline?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Quest;
    });
    
    // Use batch write for better performance
    const batch = writeBatch(db);
    const failedTasks: Quest[] = [];
    
    for (const task of tasks) {
      // Check if task is still valid (end date hasn't passed)
      if (task.endDate) {
        const endDate = new Date(task.endDate);
        if (endDate < today) {
          // Task has expired, no need to mark as failed
          continue;
        }
      }
      
      // Add task to failed batch
      const taskRef = doc(db, 'users', user.uid, 'quests', task.id);
      batch.update(taskRef, {
        status: 'Failed',
        updatedAt: serverTimestamp()
      });
      failedTasks.push(task);
    }
    
    if (failedTasks.length > 0) {
      // Commit batch update
      await batch.commit();
      
      // Add penalty for missed daily task
      if (failedTasks.length > 0) {
        // Apply XP penalty
        const totalPenalty = failedTasks.reduce((sum, task) => sum + (task.xpReward || 0), 0) * -0.5;
        
        if (totalPenalty < 0) {
          await addXpToCharacter(totalPenalty);
          
          // Add to XP journal
          await addToXpJournal({
            title: `Missed Daily Tasks`,
            description: `Penalty for missing ${failedTasks.length} daily tasks`,
            xpGained: totalPenalty,
            statsGained: {}
          });
        }
      }
    }
    
    return { 
      tasksEvaluated: failedTasks.length,
      message: `Evaluated ${failedTasks.length} daily tasks`
    };
  } catch (error) {
    console.error('Error evaluating daily tasks:', error);
    throw error;
  }
}

// Function to reset daily tasks for the next day
export async function resetDailyTasks() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    // Get all daily tasks
    const questsRef = collection(db, 'users', user.uid, 'quests');
    const dailyQuestsQuery = query(
      questsRef, 
      where('type', '==', 'Daily'),
      where('repeat', '==', 'Daily')
    );
    
    const dailyQuestsSnapshot = await getDocs(dailyQuestsQuery);
    
    if (dailyQuestsSnapshot.empty) {
      return { 
        tasksReset: 0,
        message: 'No daily tasks to reset'
      };
    }
    
    // Reset eligible tasks
    const resettableTasks = dailyQuestsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id,
        ...data, 
        deadline: data.deadline?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Quest;
    });
    
    // Use batch write for better performance
    const batch = writeBatch(db);
    let resetCount = 0;
    
    for (const task of resettableTasks) {
      // Check if task is still within its date range
      if (task.endDate) {
        const endDate = new Date(task.endDate);
        if (endDate < today) {
          // Task has expired, don't reset
          continue;
        }
      }
      
      // Reset task status to InProgress if it was completed or failed
      if (task.status === 'Completed' || task.status === 'Failed') {
        const taskRef = doc(db, 'users', user.uid, 'quests', task.id);
        batch.update(taskRef, {
          'status': 'InProgress',
          'updatedAt': serverTimestamp()
        });
        resetCount++;
      }
    }
    
    if (resetCount > 0) {
      // Commit batch update
      await batch.commit();
    }
    
    return { 
      tasksReset: resetCount,
      message: `Reset ${resetCount} daily tasks for the new day`
    };
  } catch (error) {
    console.error('Error resetting daily tasks:', error);
    throw error;
  }
}

export async function removeXpFromCharacter(xpAmount: number) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const character = await getCharacter();
  
  if (!character) {
    throw new Error('Character not found');
  }
  
  const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
  
  // Calculate the new XP values
  const newXp = Math.max(0, character.xp - xpAmount); // Don't go below 0 XP
  
  // Calculate total XP earned (may need to decrease)
  const totalXpEarned = Math.max(0, (character.totalXpEarned || 0) - xpAmount);
  
  // Get target level based on new total XP
  let targetLevel = 1;
  let xpRequired = 100; // XP required for level 2
  let accumulatedXp = 0;
  let newXpToNextLevel = xpRequired;
  
  // Recalculate level based on total XP earned
  while (accumulatedXp + xpRequired <= totalXpEarned) {
    accumulatedXp += xpRequired;
    targetLevel++;
    xpRequired = Math.floor(xpRequired * 1.1); // Each level requires 10% more XP
  }
  
  // Calculate XP towards next level
  const xpTowardsNextLevel = totalXpEarned - accumulatedXp;
  
  // If level changed, update level-related fields
  if (targetLevel !== character.level) {
    // Update character with new values
    await updateDoc(characterDocRef, {
      'xp': xpTowardsNextLevel,
      'level': targetLevel,
      'xpToNextLevel': xpRequired,
      'totalXpEarned': totalXpEarned,
      'updatedAt': serverTimestamp()
    });
    
    return { 
      newXp: xpTowardsNextLevel, 
      newLevel: targetLevel, 
      newXpToNextLevel: xpRequired, 
      totalXpEarned 
    };
  } else {
    // Just update XP values if level hasn't changed
    await updateDoc(characterDocRef, {
      'xp': newXp,
      'totalXpEarned': totalXpEarned,
      'updatedAt': serverTimestamp()
    });
    
    return { 
      newXp, 
      newLevel: character.level, 
      newXpToNextLevel: character.xpToNextLevel, 
      totalXpEarned 
    };
  }
}

// Add batch update function for multiple quests at once
export async function batchUpdateQuests(
  updates: Array<{ id: string; status: QuestStatus }>
) {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  if (updates.length === 0) return true;
  
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, status }) => {
      const questRef = doc(db, 'users', user.uid, 'quests', id);
      batch.update(questRef, {
        status,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error batch updating quests:', error);
    throw error;
  }
} 