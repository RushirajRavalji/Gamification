"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/firebase/auth";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { db } from "@/lib/firebase/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { XpJournalEntry } from "@/lib/types";

// Create an interface for our entries with proper date formatting
interface FormattedJournalEntry extends Omit<XpJournalEntry, 'timestamp'> {
  timestamp: Date;
}

export default function JournalPage() {
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading } = useCharacter();
  const [journalEntries, setJournalEntries] = useState<FormattedJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch journal entries
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get entries from Firestore, ordered by timestamp descending
        const entriesRef = collection(db, 'users', user.uid, 'journal');
        const entriesQuery = query(entriesRef, orderBy('timestamp', 'desc'));
        const entriesSnapshot = await getDocs(entriesQuery);
        
        const entriesData = entriesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as FormattedJournalEntry;
        });
        
        setJournalEntries(entriesData);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && !authLoading) {
      fetchEntries();
    }
  }, [user, authLoading]);
  
  // Group entries by month
  const groupEntriesByMonth = () => {
    const grouped: {[key: string]: FormattedJournalEntry[]} = {};
    
    journalEntries.forEach(entry => {
      const monthKey = entry.timestamp.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(entry);
    });
    
    return grouped;
  };
  
  const groupedEntries = groupEntriesByMonth();
  
  // Calculate stats
  const totalXP = journalEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  
  // Calculate total stats gained
  const calculateTotalStats = () => {
    const totals: {[key: string]: number} = {};
    
    journalEntries.forEach(entry => {
      if (entry.statsGained) {
        Object.entries(entry.statsGained).forEach(([stat, value]) => {
          if (!totals[stat]) {
            totals[stat] = 0;
          }
          totals[stat] += value as number;
        });
      }
    });
    
    return totals;
  };
  
  const totalStats = calculateTotalStats();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };
  
  const renderStatBadge = (stat: string, value: number) => {
    const statColors: {[key: string]: string} = {
      strength: 'bg-red-700',
      intelligence: 'bg-blue-700',
      focus: 'bg-purple-700',
      dexterity: 'bg-green-700',
      willpower: 'bg-yellow-700',
      influence: 'bg-pink-700'
    };
    
    return (
      <Badge key={stat} className={`${statColors[stat] || 'bg-gray-700'}`}>
        <span className="capitalize">{stat}</span> +{value}
      </Badge>
    );
  };
  
  const isFullyLoading = authLoading || characterLoading || isLoading;
  
  if (isFullyLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Please log in to view your XP journal</h1>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">XP Journal</h1>
        <Button>Export Log</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Achievement History</CardTitle>
              <CardDescription>Your journey to greatness</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedEntries).length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p>No achievements recorded yet.</p>
                  <p className="mt-2">Complete quests to start building your journal!</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedEntries).map(([month, entries]) => (
                    <div key={month}>
                      <h3 className="text-lg font-medium mb-4 pb-2 border-b border-gray-700">{month}</h3>
                      <div className="space-y-6">
                        {entries.map((entry) => (
                          <div key={entry.id} className="relative pl-6 pb-6 border-l border-gray-700">
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-0 w-3 h-3 -translate-x-1.5 rounded-full bg-purple-500"></div>
                            
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                  <h4 className="text-base font-medium">{entry.title}</h4>
                                  <span className="text-xs text-gray-400">{formatDate(entry.timestamp)}</span>
                                </div>
                                <p className="text-sm text-gray-400">{entry.description}</p>
                                {entry.statsGained && Object.keys(entry.statsGained).length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {Object.entries(entry.statsGained).map(([stat, value]) => 
                                      renderStatBadge(stat, value as number)
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center mt-2 md:mt-0">
                                <div className="text-right">
                                  <span className="inline-block px-3 py-1 bg-purple-700 rounded-full text-white font-medium">
                                    +{entry.xpGained} XP
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>XP Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {character && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Level Progress</h3>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Level {character.level}</span>
                      <span>{character.xp}/{character.xpToNextLevel} XP</span>
                    </div>
                    <Progress 
                      value={(character.xp / character.xpToNextLevel) * 100} 
                      className="h-2" 
                    />
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Total XP Earned</h3>
                  <p className="text-3xl font-bold text-purple-400">{totalXP} XP</p>
                  <p className="text-sm text-gray-400 mt-1">Lifetime accumulation</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Stats Improved</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(totalStats).map(([stat, value]) => (
                      <div key={stat} className="flex justify-between items-center">
                        <span className="capitalize">{stat}</span>
                        <Badge variant="outline" className="font-medium">+{value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Entries</span>
                  <span>{journalEntries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last 7 Days</span>
                  <span>{journalEntries.filter(e => 
                    (new Date().getTime() - e.timestamp.getTime()) < 7 * 24 * 60 * 60 * 1000
                  ).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Largest XP Gain</span>
                  <span className="text-purple-400">+{journalEntries.length > 0 ? Math.max(...journalEntries.map(e => e.xpGained)) : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Entry</span>
                  <span>{journalEntries.length > 0 ? formatDate(journalEntries[0].timestamp) : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 