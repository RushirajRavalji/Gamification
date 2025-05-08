"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth";
import { useState } from "react";
import { doc, collection, getDocs, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export default function ResetCharacter() {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const openResetDialog = () => {
    setShowConfirmDialog(true);
  };

  const resetCharacter = async () => {
    if (!user) {
      setMessage("You must be logged in to reset your character");
      return;
    }
    
    setShowConfirmDialog(false);
    
    try {
      setIsResetting(true);
      setMessage("Resetting all character data...");
      
      // Get character document
      const characterRef = collection(db, 'users', user.uid, 'character');
      const characterDocs = await getDocs(characterRef);
      
      if (characterDocs.empty) {
        setMessage("No character found to reset");
        setIsResetting(false);
        return;
      }
      
      // Get the character document
      const characterDoc = characterDocs.docs[0];
      const characterDocRef = doc(db, 'users', user.uid, 'character', characterDoc.id);
      
      // 1. Reset character to default values
      await updateDoc(characterDocRef, {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        class: 'Novice',
        skills: [],
        stats: {
          strength: 5,
          intelligence: 5,
          focus: 5,
          consistency: 5,
          willpower: 5,
          influence: 5,
          relationships: 5
        },
        streakCount: 0,
        totalXpEarned: 0,
        updatedAt: new Date()
      });
      
      // Force double-check both XP fields are reset
      await updateDoc(characterDocRef, {
        xp: 0,
        totalXpEarned: 0,
      });
      
      // 2. Delete all quests
      const questsRef = collection(db, 'users', user.uid, 'quests');
      const questDocs = await getDocs(questsRef);
      
      const questDeletePromises = questDocs.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(questDeletePromises);
      
      // 3. Delete all XP journal entries (achievements)
      const journalRef = collection(db, 'users', user.uid, 'xpJournal');
      const journalDocs = await getDocs(journalRef);
      
      const journalDeletePromises = journalDocs.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(journalDeletePromises);
      
      // 4. Delete any additional collections that might be related
      // Add more collections here if needed
      
      setMessage("Character reset successful! All data has been reset to default values. Refresh the page to see changes.");
      
    } catch (error) {
      console.error("Error resetting character:", error);
      setMessage("Failed to reset character");
    } finally {
      setIsResetting(false);
    }
  };
  
  return (
    <>
      <div className="p-4 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 mt-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" /> 
          Reset Character Data
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          This will permanently reset ALL your character data, including stats, achievements, quests, and progress. Use only as a last resort.
        </p>
        
        <Button 
          variant="destructive" 
          onClick={openResetDialog} 
          disabled={isResetting}
          className="bg-red-700 hover:bg-red-800"
        >
          {isResetting ? "Resetting..." : "Reset All Data"}
        </Button>
        
        {message && (
          <p className="mt-2 text-sm text-gray-300">{message}</p>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> 
              Confirm Complete Character Reset
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-white">The following data will be permanently deleted:</p>
            
            <div className="bg-gray-700/60 p-3 rounded-md space-y-2">
              <p className="text-amber-300">• Character Level &amp; Experience</p> 
              <p className="text-amber-300">• All Stats &amp; Skills</p>
              <p className="text-amber-300">• Daily &amp; Side Quests</p>
              <p className="text-amber-300">• Dungeons &amp; Boss Fights</p>
              <p className="text-amber-300">• Achievements &amp; Progress History</p>
              <p className="text-amber-300">• Streaks &amp; Activity Records</p>
            </div>
            
            <p className="text-gray-300">Are you absolutely sure you want to reset all data and start from level 1?</p>
          </div>
          
          <DialogFooter className="flex sm:justify-between gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={resetCharacter}
              disabled={isResetting}
              className="bg-red-700 hover:bg-red-800"
            >
              {isResetting ? "Resetting..." : "Reset Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 