import React from 'react';
import { motion } from 'motion/react';
import { CONFETTI_COLORS } from './constants';

interface ConfettiParticleProps {
  delay: number;
  index: number;
}

export const ConfettiParticle: React.FC<ConfettiParticleProps> = ({ delay, index }) => {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  
  return (
    <motion.div
      initial={{ 
        y: -50, 
        x: typeof window !== 'undefined' 
          ? (window.innerWidth * 0.2) + (Math.random() * window.innerWidth * 0.6) 
          : 300 + Math.random() * 400, 
        opacity: 1, 
        rotate: 0 
      }}
      animate={{ 
        y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800, 
        rotate: 180,
        opacity: 0 
      }}
      transition={{ 
        duration: 2.5 + Math.random() * 1, 
        delay,
        ease: "easeOut"
      }}
      className="absolute w-2 h-2 pointer-events-none rounded-sm"
      style={{
        backgroundColor: color,
        willChange: 'transform, opacity'
      }}
    />
  );
};