import React from 'react';
import { motion } from 'motion/react';
import { Flame, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useStreak } from './StreakContext';

export default function StreakWidget() {
  const { streakData, isLoading } = useStreak();

  if (isLoading) {
    return null;
  }

  // Use default values if streakData is null
  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const totalActiveDays = streakData?.totalActiveDays ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-xl border border-[#FF4F4F]/20 bg-gradient-to-br from-white to-[#FF4F4F]/5 overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#FF4F4F]/20 to-[#FFCF00]/20">
                <Flame className="w-3.5 h-3.5 text-[#FF4F4F]" fill="#FF4F4F" />
              </div>
              <h3 className="text-sm font-semibold">Daily Streak</h3>
            </div>
          </div>

          {/* Current Streak */}
          <div className="text-center mb-2">
            <motion.div
              animate={currentStreak > 0 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ 
                duration: 2,
                repeat: currentStreak > 0 ? Infinity : 0,
                repeatDelay: 1
              }}
              className="inline-flex items-center gap-2 mb-1"
            >
              {currentStreak > 0 && (
                <Flame className="w-5 h-5 text-[#FF4F4F]" fill="#FF4F4F" />
              )}
              <span className="text-3xl font-bold bg-gradient-to-r from-[#FF4F4F] to-[#FFCF00] bg-clip-text text-transparent">
                {currentStreak}
              </span>
              {currentStreak > 0 && (
                <Flame className="w-5 h-5 text-[#FFCF00]" fill="#FFCF00" />
              )}
            </motion.div>
            <p className="text-xs text-gray-600">
              {currentStreak === 0 ? 'Start your streak today!' : 
               currentStreak === 1 ? 'Day streak - keep it going!' :
               `${currentStreak} day streak - you're on fire!`}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Award className="w-3 h-3 text-[#4B00FF]" />
                <span className="text-lg font-bold text-[#4B00FF]">{longestStreak}</span>
              </div>
              <p className="text-[10px] text-gray-600">Best Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3 text-[#00E0FF]" />
                <span className="text-lg font-bold text-[#00E0FF]">{totalActiveDays}</span>
              </div>
              <p className="text-[10px] text-gray-600">Total Days</p>
            </div>
          </div>

          {/* Motivational message */}
          {currentStreak > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 p-2 bg-[#6CFF6C]/10 border border-[#6CFF6C]/30 rounded-lg text-center"
            >
              <p className="text-xs font-semibold text-gray-700">
                {currentStreak < 3 ? '🎯 Keep going!' :
                 currentStreak < 7 ? '⚡ You\'re building momentum!' :
                 currentStreak < 14 ? '🔥 Incredible consistency!' :
                 currentStreak < 30 ? '🚀 You\'re unstoppable!' :
                 '👑 Legendary dedication!'}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
