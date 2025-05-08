"use client";

import React, { useRef, useState } from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { CharacterStats } from '@/lib/types';
import { motion } from 'framer-motion';

interface StatPoint {
  stat: string;
  value: number;
  fullMark: number;
}

interface CharacterRadarChartProps {
  stats: CharacterStats;
  maxValue?: number;
}

export default function CharacterRadarChart({ 
  stats, 
  maxValue = 20 
}: CharacterRadarChartProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Transform character stats into the format expected by RadarChart
  const chartData: StatPoint[] = [
    { stat: 'Strength', value: stats.strength, fullMark: maxValue },
    { stat: 'Intelligence', value: stats.intelligence, fullMark: maxValue },
    { stat: 'Focus', value: stats.focus, fullMark: maxValue },
    { stat: 'Dexterity', value: stats.dexterity, fullMark: maxValue },
    { stat: 'Willpower', value: stats.willpower, fullMark: maxValue },
    { stat: 'Influence', value: stats.influence, fullMark: maxValue },
  ];
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate center point of the element
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate cursor position relative to the center
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    // Calculate rotation degrees (max 6°)
    const rotationY = (x / centerX) * 6;
    const rotationX = -(y / centerY) * 6;
    
    setRotation({ x: rotationX, y: rotationY });
  };
  
  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ 
        rotateX: rotation.x,
        rotateY: rotation.y,
        scale: isHovered ? 1.02 : 1
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15,
        mass: 0.8
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.15)" />
          <PolarAngleAxis 
            dataKey="stat" 
            tick={{ fill: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}
            stroke="rgba(255, 255, 255, 0.2)" 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, maxValue]} 
            stroke="rgba(255, 255, 255, 0.2)"
            tick={{ fill: 'rgba(255, 255, 255, 0.6)' }} 
          />
          <Radar
            name="Character Stats"
            dataKey="value"
            stroke="rgba(147, 51, 234, 0.8)"
            fill="rgba(147, 51, 234, 0.5)"
            fillOpacity={0.7}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(30, 30, 30, 0.9)', 
              borderColor: 'rgba(147, 51, 234, 0.5)',
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              padding: '8px 12px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Animated glow effect */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.2) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }}
        />
      )}
    </motion.div>
  );
} 