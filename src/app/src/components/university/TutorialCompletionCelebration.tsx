import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Star, Sparkles, Zap, Trophy } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TutorialCompletionCelebrationProps {
  show: boolean;
  tutorialTitle: string;
  xpEarned: number;
  onComplete?: () => void;
}

export default function TutorialCompletionCelebration({
  show,
  tutorialTitle,
  xpEarned,
  onComplete
}: TutorialCompletionCelebrationProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.3,
        color: ['#00E0FF', '#FFCF00', '#FF4F4F', '#6CFF6C', '#4B00FF'][Math.floor(Math.random() * 5)]
      }));
      setParticles(newParticles);

      // Auto-hide after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
        {/* Particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: particle.color }}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: 1 
            }}
            animate={{ 
              x: particle.x * 8,
              y: particle.y * 8,
              scale: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1.5,
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Main celebration card */}
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: -100 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            duration: 0.6
          }}
          className="pointer-events-auto bg-white rounded-3xl shadow-2xl border-4 border-[#6CFF6C] p-8 max-w-md mx-4"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.2,
              type: "spring",
              stiffness: 200
            }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#6CFF6C] rounded-full blur-xl opacity-50" />
              <div className="relative w-20 h-20 bg-[#6CFF6C] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-3"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Tutorial Complete! 🎉
            </h2>
            <p className="text-gray-600">
              {tutorialTitle}
            </p>
          </motion.div>

          {/* XP Badge */}
          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.5,
              type: "spring",
              stiffness: 200
            }}
            className="mt-6 bg-gradient-to-r from-[#FFCF00] to-[#FF4F4F] rounded-2xl p-1"
          >
            <div className="bg-white rounded-xl p-4 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#FFCF00]" fill="#FFCF00" />
                <span className="text-2xl font-bold text-gray-900">
                  +{xpEarned} XP
                </span>
              </div>
            </div>
          </motion.div>

          {/* Floating Icons */}
          <div className="absolute -top-4 -right-4">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Star className="w-8 h-8 text-[#FFCF00]" fill="#FFCF00" />
            </motion.div>
          </div>
          
          <div className="absolute -bottom-4 -left-4">
            <motion.div
              animate={{ 
                rotate: [360, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="w-8 h-8 text-[#00E0FF]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Background glow effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-gradient-to-r from-[#00E0FF]/20 via-[#6CFF6C]/20 to-[#FFCF00]/20 blur-3xl"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
