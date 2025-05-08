import { db } from './firebase';
import { auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Character, 
  CharacterStats, 
  Quest, 
  QuestType, 
  QuestStatus
} from '../types';

// Character operations
export async function getCharacter() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
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
    dexterity: 5,
    willpower: 5,
    influence: 5
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
  
  const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
  
  await updateDoc(characterDocRef, {
    'stats': { ...character.stats, ...newStats },
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
  const lastActive = character.lastActive || character.createdAt;
  
  // Calculate days since last activity
  const lastActiveDate = new Date(lastActive);
  lastActiveDate.setHours(0, 0, 0, 0);
  const todayDate = new Date(today);
  todayDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(todayDate.getTime() - lastActiveDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Check for any daily quests completed today
  const questsRef = collection(db, 'users', user.uid, 'quests');
  const questsQuery = query(questsRef, where('type', '==', 'Daily'), where('status', '==', 'Completed'));
  const questsSnapshot = await getDocs(questsQuery);
  
  // Update streak based on days since last active and whether daily quests were completed
  let newStreakCount = character.streakCount;
  let streakMessage = '';
  
  if (diffDays === 0) {
    // Same day, no change to streak
    return { 
      streakCount: character.streakCount, 
      message: 'Complete a daily quest to maintain your streak!' 
    };
  } else if (diffDays === 1) {
    // Consecutive day, check if completed at least one daily quest
    if (!questsSnapshot.empty) {
      // At least one daily quest was completed today, increment streak
      newStreakCount += 1;
      streakMessage = `🔥 ${newStreakCount} day streak! Keep it going!`;
      
      await updateDoc(characterDocRef, {
        'streakCount': newStreakCount,
        'lastActive': serverTimestamp(),
        'updatedAt': serverTimestamp()
      });
    } else {
      // No daily quests completed yet today
      streakMessage = 'Complete a daily quest to continue your streak!';
    }
    
    return { streakCount: newStreakCount, message: streakMessage };
  } else {
    // More than one day missed, reset streak
    streakMessage = 'Streak reset! Complete a daily quest to start a new streak.';
    
    await updateDoc(characterDocRef, {
      'streakCount': 0,
      'lastActive': serverTimestamp(),
      'updatedAt': serverTimestamp()
    });
    
    return { streakCount: 0, message: streakMessage };
  }
}

// Quest operations
export async function getQuests() {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No authenticated user');
  }
  
  const questsRef = collection(db, 'users', user.uid, 'quests');
  const questsDocs = await getDocs(questsRef);
  
  return questsDocs.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      deadline: data.deadline?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Quest;
  });
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
  
  await updateDoc(questRef, {
    'status': status,
    'updatedAt': serverTimestamp()
  });
  
  // If completed, add XP to the character
  if (status === 'Completed') {
    const questDoc = await getDoc(questRef);
    const questData = questDoc.data() as Quest;
    
    if (questData && questData.xpReward) {
      await addXpToCharacter(questData.xpReward);
      
      // If there are stat rewards, update character stats
      if (questData.statRewards) {
        await updateCharacterStats(questData.statRewards);
      }
      
      // If it's a daily quest, check and update streak
      if (questData.type === 'Daily') {
        // Get the character
        const character = await getCharacter();
        if (!character) return;
        
        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get last active date (without time)
        const lastActive = character.lastActive || character.createdAt;
        const lastActiveDate = new Date(lastActive);
        lastActiveDate.setHours(0, 0, 0, 0);
        
        // Only update lastActive, streak is managed by checkAndUpdateStreak
        const characterDocRef = doc(db, 'users', user.uid, 'character', character.id);
        await updateDoc(characterDocRef, {
          'lastActive': serverTimestamp(),
          'updatedAt': serverTimestamp()
        });
      }
    }
  }
}

// Journal operations
export async function addXpJournalEntry(entry: any) {
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