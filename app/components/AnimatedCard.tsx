"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'tilt' | 'glow' | 'raise' | 'none';
  glowColor?: string;
  onClick?: () => void;
}

export default function AnimatedCard({
  children,
  className = '',
  hoverEffect = 'tilt',
  glowColor = 'rgba(147, 51, 234, 0.5)', // Purple by default
  onClick
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Calculate rotation and position for the glow effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || hoverEffect === 'none') return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Get mouse position relative to card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update state with the mouse position
    setMousePosition({ x, y });
    
    if (hoverEffect === 'tilt') {
      // Calculate rotation based on mouse position
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * 8; // Max 8 degrees (more subtle)
      const rotateY = ((centerX - x) / centerX) * 8; // Max 8 degrees (more subtle)
      
      // Apply the transformation with a smoother transition
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      cardRef.current.style.transition = 'transform 0.2s ease-out';
    }
  };
  
  const resetCardTransform = () => {
    if (!cardRef.current || hoverEffect === 'none') return;
    if (hoverEffect === 'tilt') {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
      cardRef.current.style.transition = 'transform 0.5s ease-out';
    }
    setIsHovered(false);
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden p-2 rounded-xl ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={resetCardTransform}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      whileHover={
        hoverEffect === 'raise' 
          ? { y: -8, scale: 1.03, transition: { duration: 0.3 } } 
          : undefined
      }
      style={{
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        willChange: 'transform',
        boxShadow: isHovered ? '0 10px 30px -10px rgba(0, 0, 0, 0.3)' : 'none'
      }}
    >
      {/* Glow effect when hovered */}
      {hoverEffect === 'glow' && isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-60 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor} 0%, transparent 75%)`,
            filter: 'blur(3px)'
          }}
        />
      )}
      
      {/* Card content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
} 