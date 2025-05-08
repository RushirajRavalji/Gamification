// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Character Types
export interface Character {
  id: string;
  userId: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpEarned: number;
  class: CharacterClass;
  stats: CharacterStats;
  skills: Skill[];
  inventory: InventoryItem[];
  questLog: Quest[];
  streakCount: number;
  avatarId?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CharacterClass = 
  | "Novice" 
  | "Warrior" // Body focus
  | "Shadow" // Focus branch
  | "Sage" // Mind branch
  | "Guardian" // Advanced body
  | "Mystic" // Advanced mind
  | "Phantom" // Advanced focus
  | "Legendary"; // Final form

export interface CharacterStats {
  strength: number; // Physical capabilities
  intelligence: number; // Learning capacity
  focus: number; // Attention span
  dexterity: number; // Physical coordination  
  willpower: number; // Mental fortitude
  influence: number; // Social impact
}

// Skill Types
export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  statAffected: keyof CharacterStats;
  bonusAmount: number;
  unlocked: boolean;
  prerequisites: string[]; // IDs of prerequisite skills
}

// Quest Types
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  xpReward: number;
  statRewards: Partial<CharacterStats>;
  deadline?: Date;
  proofRequired: ProofType[];
  repeat?: QuestRepeat;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  progress?: number;
  tasks?: QuestTask[];
}

export interface QuestTask {
  title: string;
  completed: boolean;
}

export type QuestType = 
  | "Daily" 
  | "SideQuest" 
  | "Dungeon" 
  | "BossFight";

export type QuestStatus = 
  | "Available" 
  | "InProgress" 
  | "Completed" 
  | "Failed";

export type ProofType = 
  | "Photo" 
  | "Video" 
  | "Link" 
  | "Text" 
  | "API" 
  | "None";

export type QuestRepeat = 
  | "Daily" 
  | "Weekly" 
  | "Monthly" 
  | "None";

// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  statBoost?: Partial<CharacterStats>;
  equipped: boolean;
  imageUrl?: string;
  acquiredAt: Date;
}

export type ItemType = 
  | "Weapon" 
  | "Armor" 
  | "Accessory" 
  | "Consumable" 
  | "Badge" 
  | "Trophy";

export type ItemRarity = 
  | "Common" 
  | "Uncommon" 
  | "Rare" 
  | "Epic" 
  | "Legendary";

// Progress Tracking
export interface XpJournalEntry {
  id: string;
  userId: string;
  characterId: string;
  questId?: string;
  title: string;
  description: string;
  xpGained: number;
  statsGained: Partial<CharacterStats>;
  proofUrl?: string[];
  timestamp: Date;
}

// Streak and anti-cheat
export interface StreakInfo {
  current: number;
  longest: number;
  shieldsAvailable: number;
  lastActive: Date;
} 