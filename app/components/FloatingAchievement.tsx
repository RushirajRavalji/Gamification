"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface FloatingAchievementProps {
  achievement: {
    id: string;
    title: string;
    xp: number;
  } | null;
  onComplete: () => void;
}

export default function FloatingAchievement({ achievement, onComplete }: FloatingAchievementProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement, onComplete]);
  
  if (!achievement) return null;
  
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 right-4 z-50 bg-purple-900/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-purple-500/30 max-w-md"
    >
      <h3 className="text-lg font-bold text-white">Achievement Unlocked! 🏆</h3>
      <p className="text-purple-200 mb-2">{achievement.title}</p>
      <p className="text-yellow-300 font-bold">+{achievement.xp} XP</p>
    </motion.div>
  );
}

// Add this to your global CSS
export const floatingAchievementStyles = `
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.5); }
}

.star-particles::before,
.star-particles::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8);
  animation: twinkle 2s infinite;
}

.star-particles::before {
  top: 20%;
  left: 20%;
  animation-delay: 0.3s;
}

.star-particles::after {
  top: 60%;
  left: 80%;
  animation-delay: 0.7s;
}
`; 