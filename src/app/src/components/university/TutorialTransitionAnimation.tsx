import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Zap, Star, Sparkles } from 'lucide-react';

interface TutorialTransitionAnimationProps {
  tutorialTitle: string;
  xpEarned: number;
  onComplete: () => void;
}

export default function TutorialTransitionAnimation({ 
  tutorialTitle, 
  xpEarned, 
  onComplete 
}: TutorialTransitionAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Generate sparkles
  const sparkles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 400 - 200,
    y: Math.random() * 400 - 200,
    delay: Math.random() * 0.3,
    scale: 0.5 + Math.random() * 0.5,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-black/20"
      >
        {/* Main completion card */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            duration: 0.6,
            ease: "easeOut"
          }}
          className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00E0FF]/20 via-[#6CFF6C]/20 to-[#FFCF00]/20 rounded-3xl blur-2xl" />
          
          {/* Content */}
          <div className="relative text-center space-y-4">
            {/* Big checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0, 1.3, 1],
                rotate: [0, 360]
              }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#6CFF6C] to-[#00E0FF] rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
            </motion.div>

            {/* Success message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-2">Tutorial Complete!</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{tutorialTitle}</p>
            </motion.div>

            {/* XP earned */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFCF00]/20 to-[#FF4F4F]/20 border-2 border-[#FFCF00] rounded-xl px-6 py-3"
            >
              <Zap className="w-6 h-6 text-[#FFCF00]" fill="#FFCF00" />
              <span className="text-2xl font-bold text-[#FF4F4F]">+{xpEarned}</span>
              <span className="text-sm font-semibold text-gray-700">XP</span>
            </motion.div>

            {/* Next tutorial hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-gray-500"
            >
              Loading next tutorial...
            </motion.p>
          </div>
        </motion.div>

        {/* Sparkles */}
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: sparkle.x,
              y: sparkle.y,
              scale: [0, sparkle.scale, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              delay: sparkle.delay,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Sparkles className="w-4 h-4 text-[#FFCF00]" fill="#FFCF00" />
          </motion.div>
        ))}

        {/* Radiating circles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{
              scale: [0, 3],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              ease: "easeOut"
            }}
            className="absolute w-40 h-40 border-4 border-[#00E0FF] rounded-full"
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
