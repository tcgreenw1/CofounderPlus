import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { LoadingContent } from './LoadingScreen';

interface MesmerizingLoaderProps {
  message?: string;
  compact?: boolean;
}

export const MesmerizingLoader: React.FC<MesmerizingLoaderProps> = ({ 
  message = 'Syncing your empire...',
  compact = false 
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
           <Logo size="sm" showText={false} />
        </motion.div>
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          {message}
        </span>
      </div>
    );
  }

  // Use the unified LoadingContent for consistency
  return <LoadingContent message={message} isFixed={false} />;
};
