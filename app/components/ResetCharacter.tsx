"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/firebase/auth";
import { useState } from "react";
import { doc, collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

export default function ResetCharacter() {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState("");

  const resetCharacter = async () => {
    if (!user) {
      setMessage("You must be logged in to reset your character");
      return;
    }
    
    try {
      setIsResetting(true);
      setMessage("Resetting character...");
      
      // Get character document
      const characterRef = collection(db, 'users', user.uid, 'character');
      const characterDocs = await getDocs(characterRef);
      
      if (characterDocs.empty) {
        setMessage("No character found to reset");
        setIsResetting(false);
        return;
      }
      
      // Get the first character document
      const characterDoc = characterDocs.docs[0];
      const characterDocRef = doc(db, 'users', user.uid, 'character', characterDoc.id);
      
      // Reset to default values
      await updateDoc(characterDocRef, {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        class: 'Novice',
        stats: {
          strength: 5,
          intelligence: 5,
          focus: 5,
          dexterity: 5,
          willpower: 5,
          influence: 5
        },
        streakCount: 0,
        updatedAt: new Date()
      });
      
      setMessage("Character reset successful! Refresh the page to see changes.");
      
    } catch (error) {
      console.error("Error resetting character:", error);
      setMessage("Failed to reset character");
    } finally {
      setIsResetting(false);
    }
  };
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 mt-4">
      <h3 className="text-lg font-medium mb-2">Reset Character</h3>
      <p className="text-sm text-gray-400 mb-4">
        If you're experiencing issues with incorrect character stats or level, you can reset your character to level 1 with default stats.
      </p>
      
      <Button 
        variant="destructive" 
        onClick={resetCharacter} 
        disabled={isResetting}
      >
        {isResetting ? "Resetting..." : "Reset Character"}
      </Button>
      
      {message && (
        <p className="mt-2 text-sm text-gray-300">{message}</p>
      )}
    </div>
  );
} 