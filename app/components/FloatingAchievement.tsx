"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  xp: number;
}

interface FloatingAchievementProps {
  achievement?: Achievement | null;
  onComplete?: () => void;
}

export default function FloatingAchievement({ 
  achievement, 
  onComplete 
}: FloatingAchievementProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement, onComplete]);
  
  if (!achievement) return null;
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-5 right-5 z-50 pointer-events-none"
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
              type: 'spring',
              stiffness: 300,
              damping: 20
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -30, 
            scale: 0.5,
            transition: { duration: 0.2 } 
          }}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-purple-500/30 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="star-particles absolute inset-0"></div>
            </div>
            
            <div className="flex items-center mb-4 relative z-10">
              <motion.div
                initial={{ rotate: -20, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="text-2xl mr-4"
              >
                🏆
              </motion.div>
              <div>
                <h3 className="font-bold text-amber-300 text-xl">Achievement Unlocked!</h3>
              </div>
            </div>
            
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white text-lg font-medium mb-3"
            >
              {achievement.title}
            </motion.div>
            
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-purple-300 font-bold"
            >
              +{achievement.xp} XP
            </motion.div>
            
            <motion.div 
              className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
            >
              <div className="bg-purple-500 h-full" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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