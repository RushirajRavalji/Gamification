"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface TaskUndoneProps {
  task: {
    id: string;
    title: string;
    xp: number;
  } | null;
  onComplete: () => void;
}

export default function TaskUndoneNotification({ task, onComplete }: TaskUndoneProps) {
  useEffect(() => {
    if (task) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [task, onComplete]);
  
  if (!task) return null;
  
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 left-4 z-50 bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-red-500/30 max-w-md"
    >
      <h3 className="text-lg font-bold text-white">Task Marked Incomplete ❌</h3>
      <p className="text-gray-200 mb-2">{task.title}</p>
      <p className="text-red-400 font-bold">-{task.xp} XP removed</p>
    </motion.div>
  );
} 