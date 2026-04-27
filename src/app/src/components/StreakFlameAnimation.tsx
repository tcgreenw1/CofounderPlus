import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Award, Zap } from 'lucide-react';

interface StreakFlameAnimationProps {
  streakCount: number;
  onComplete: () => void;
}

export default function StreakFlameAnimation({ streakCount, onComplete }: StreakFlameAnimationProps) {
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Generate random particle positions
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: Math.random() * 200 - 100,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      >
        {/* Flame burst particles */}
        {showParticles && particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: 1 
            }}
            animate={{ 
              x: particle.x,
              y: particle.y,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
              rotate: particle.rotation
            }}
            transition={{
              duration: 1.5,
              delay: particle.delay,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Flame 
              className="w-6 h-6"
              fill={particle.id % 3 === 0 ? '#FF4F4F' : particle.id % 3 === 1 ? '#FFCF00' : '#FF4F4F'}
              color={particle.id % 3 === 0 ? '#FF4F4F' : particle.id % 3 === 1 ? '#FFCF00' : '#FF4F4F'}
            />
          </motion.div>
        ))}

        {/* Main flame icon with pulsing effect */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.3, 1],
            rotate: [0, 10, -10, 5, -5, 0]
          }}
          transition={{
            duration: 0.8,
            times: [0, 0.5, 1],
            ease: "easeOut"
          }}
          className="relative z-10"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FF4F4F] to-[#FFCF00] rounded-full blur-3xl opacity-60" />
            
            {/* Main flame */}
            <div className="relative bg-white rounded-full p-8 shadow-2xl">
              <Flame 
                className="w-24 h-24" 
                fill="#FF4F4F"
                color="#FFCF00"
                strokeWidth={2}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Streak count */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute mt-64"
        >
          <div className="bg-white rounded-2xl px-8 py-4 shadow-2xl border-4 border-[#FF4F4F]">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ 
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.4
              }}
              className="text-center"
            >
              <div className="flex items-center gap-3 mb-1">
                <Zap className="w-6 h-6 text-[#FFCF00]" fill="#FFCF00" />
                <span className="text-4xl font-bold bg-gradient-to-r from-[#FF4F4F] to-[#FFCF00] bg-clip-text text-transparent">
                  {streakCount}
                </span>
                <Flame className="w-6 h-6 text-[#FF4F4F]" fill="#FF4F4F" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {streakCount === 1 ? 'Day Streak!' : 'Day Streak!'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {streakCount === 1 ? 'Keep it going!' : 'You\'re on fire! 🔥'}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Sparkles around the flame */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const radius = 150;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={`sparkle-${i}`}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: x,
                y: y,
              }}
              transition={{
                duration: 1.5,
                delay: 0.2 + i * 0.05,
                ease: "easeOut"
              }}
              className="absolute"
            >
              <div className="w-2 h-2 rounded-full bg-[#FFCF00]" />
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
