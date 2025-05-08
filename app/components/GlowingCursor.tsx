"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlowingCursorProps {
  color?: string;
  size?: number;
  opacity?: number;
  showTrail?: boolean;
  trailLength?: number;
  pulseEffect?: boolean;
  spinEffect?: boolean;
  throttleMs?: number;
}

export default function GlowingCursor({
  color = "rgba(147, 51, 234, 0.8)", // Default purple color
  size = 30,
  opacity = 0.6,
  showTrail = true,
  trailLength = 5,
  pulseEffect = true,
  spinEffect = false,
  throttleMs = 16 // Approx 60fps
}: GlowingCursorProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number; id: string }[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const trailIdCounterRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  
  // Throttle function to limit how often we update the cursor position
  const throttledUpdatePosition = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current >= throttleMs) {
      lastUpdateTimeRef.current = now;
      
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      if (showTrail) {
        setTrail(prevTrail => {
          // Increment counter each time to ensure unique IDs
          trailIdCounterRef.current += 1;
          const uniqueId = `${now}-${trailIdCounterRef.current}`;
          
          const newTrail = [
            { x: e.clientX, y: e.clientY, id: uniqueId },
            ...prevTrail
          ].slice(0, trailLength);
          return newTrail;
        });
      }
    }
  }, [showTrail, trailLength, throttleMs]);
  
  useEffect(() => {
    // Set initial position to center of screen to avoid awkward positioning
    setMousePosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
    
    // Small delay before showing the cursor effect
    const timer = setTimeout(() => {
      setIsActive(true);
    }, 500);
    
    // Attach the throttled handler for mouse movement
    window.addEventListener('mousemove', throttledUpdatePosition);
    
    // Handle hover states for interactive elements
    const handleMouseOver = () => setIsHovering(true);
    const handleMouseOut = () => setIsHovering(false);
    
    // Get all interactive elements that should trigger hover state
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseover', handleMouseOver);
      el.addEventListener('mouseout', handleMouseOut);
    });
    
    return () => {
      window.removeEventListener('mousemove', throttledUpdatePosition);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseover', handleMouseOver);
        el.removeEventListener('mouseout', handleMouseOut);
      });
      clearTimeout(timer);
    };
  }, [throttledUpdatePosition]);
  
  if (!isActive) return null;
  
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Main cursor glow */}
      <motion.div
        className={`absolute rounded-full ${pulseEffect ? 'animate-cursor-pulse' : ''} ${spinEffect ? 'animate-cursor-spin' : ''}`}
        style={{
          background: `radial-gradient(circle, ${isHovering ? 'rgba(236, 72, 153, 0.8)' : color} 0%, rgba(0,0,0,0) 70%)`,
          width: isHovering ? size * 2.5 : size * 2,
          height: isHovering ? size * 2.5 : size * 2,
          opacity: isHovering ? opacity * 1.2 : opacity,
          top: mousePosition.y - (isHovering ? size * 1.25 : size),
          left: mousePosition.x - (isHovering ? size * 1.25 : size),
          boxShadow: `0 0 ${size / 2}px ${isHovering ? 'rgba(236, 72, 153, 0.8)' : color}`,
          filter: 'blur(5px)',
        }}
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      />
      
      {/* Inner glow for hover effect */}
      {isHovering && (
        <motion.div
          className="absolute rounded-full animate-cursor-glow"
          style={{
            background: `radial-gradient(circle, rgba(236, 72, 153, 0.9) 0%, rgba(0,0,0,0) 70%)`,
            width: size,
            height: size,
            top: mousePosition.y - size / 2,
            left: mousePosition.x - size / 2,
            filter: 'blur(3px)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            ease: "easeOut"
          }}
        />
      )}
      
      {/* Cursor trail */}
      <AnimatePresence>
        {showTrail && trail.map((point, index) => (
          <motion.div
            key={point.id}
            className="absolute rounded-full animate-trail-fade"
            style={{
              background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
              width: size * (1 - index * 0.15),
              height: size * (1 - index * 0.15),
              opacity: opacity * (1 - index * 0.2),
              top: point.y - (size * (1 - index * 0.15)) / 2,
              left: point.x - (size * (1 - index * 0.15)) / 2,
              filter: 'blur(3px)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
} 