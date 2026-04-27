import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { useBusiness } from './BusinessContext';

interface MotivationButtonProps {
  variant?: 'default' | 'minimal' | 'floating' | 'full';
  className?: string;
}

export const MotivationButton: React.FC<MotivationButtonProps> = ({ 
  variant = 'default',
  className = ''
}) => {
  const navigate = useNavigate();
  const { selectedBusiness, userBusinesses } = useBusiness();

  // Get user progress for smart motivation
  const getUserProgress = () => {
    const businessCount = userBusinesses.length;
    const hasRevenue = userBusinesses.some(b => b.revenue && b.revenue > 0);
    const hasEmployees = userBusinesses.some(b => b.employees && b.employees > 0);
    
    return {
      businessCount,
      hasRevenue,
      hasEmployees,
      hasSelectedBusiness: !!selectedBusiness
    };
  };

  const progress = getUserProgress();

  // Smart motivational text based on user progress
  const getMotivationalText = () => {
    if (progress.businessCount === 0) {
      return "Start Your Journey";
    }
    if (!progress.hasRevenue) {
      return "Achieve First Sale";
    }
    if (!progress.hasEmployees) {
      return "Scale Your Team";
    }
    return "Reach $1M Goal";
  };

  const getMotivationalIcon = () => {
    if (progress.businessCount === 0) {
      return Target;
    }
    if (!progress.hasRevenue) {
      return TrendingUp;
    }
    if (!progress.hasEmployees) {
      return Zap;
    }
    return Sparkles;
  };

  const MotivationalIcon = getMotivationalIcon();
  const motivationalText = getMotivationalText();

  const handleClick = () => {
    navigate('/dream-board');
  };

  if (variant === 'minimal') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm transition-all duration-300 group ${className}`}
        title="View your Dream Board"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <MotivationalIcon className="w-4 h-4 group-hover:text-purple-500 transition-colors" />
        </motion.div>
        <span className="text-sm font-medium">Dream Board</span>
      </motion.button>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.button
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:shadow-xl text-white backdrop-blur-sm transition-all duration-300 group ${className}`}
        title={`Stay motivated! ${motivationalText}`}
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <MotivationalIcon className="w-6 h-6" />
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
          initial={false}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>
    );
  }

  if (variant === 'full') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-orange-500/20 border border-purple-200/30 dark:border-purple-700/30 backdrop-blur-sm transition-all duration-300 group ${className}`}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <MotivationalIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </motion.div>
          <div className="flex-1 text-left">
            <div className="font-medium text-purple-700 dark:text-purple-300 text-sm">
              Stay Motivated
            </div>
            <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
              {motivationalText}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-purple-500 opacity-60 group-hover:opacity-100 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-600/90 hover:to-pink-600/90 text-white shadow-md hover:shadow-lg backdrop-blur-sm transition-all duration-300 group ${className}`}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <MotivationalIcon className="w-4 h-4" />
      </motion.div>
      <span className="text-sm font-medium">{motivationalText}</span>
    </motion.button>
  );
};