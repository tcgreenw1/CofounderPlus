import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

interface LoadingContentProps {
  message?: string;
  isFixed?: boolean;
}

export const LoadingContent: React.FC<LoadingContentProps> = ({ message, isFixed = false }) => {
  const [loadingPhase, setLoadingPhase] = useState(0);

  const phases = [
    "Initializing workspace...",
    "Aligning goals...",
    "Structuring modules...",
    "Ready to build."
  ];

  useEffect(() => {
    if (message) return;
    const timer = setInterval(() => {
      setLoadingPhase(prev => (prev < phases.length - 1 ? prev + 1 : prev));
    }, 1500);

    return () => clearInterval(timer);
  }, [message]);

  const currentText = message || phases[loadingPhase];
  const progress = message ? 100 : ((loadingPhase + 1) / phases.length) * 100;

  return (
    <div className={`flex flex-col items-center justify-center ${isFixed ? 'fixed inset-0 z-[100] bg-background' : 'w-full py-12'}`}>
      {isFixed && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 pointer-events-none" />
          <motion.div
            className="absolute w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* Pulsing Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
             <Logo size="xl" showText={false} />
          </motion.div>
          
          {/* Floor shadow */}
          <motion.div 
            className="w-20 h-2 mx-auto mt-6 rounded-full bg-black/5 dark:bg-white/5 blur-sm"
            animate={{
              scaleX: [1, 0.8, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Loading Text */}
        <div className="h-8 flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-lg font-medium text-muted-foreground"
            >
              {currentText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          {message ? (
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          )}
        </div>
      </div>
      
      {/* Bottom Inspiration - Only for fixed full screen */}
      {isFixed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 text-sm font-medium text-muted-foreground/50 tracking-wide uppercase"
        >
          Your Digital Cofounder
        </motion.p>
      )}
    </div>
  );
};

export const LoadingScreen: React.FC = () => {
  return <LoadingContent isFixed={true} />;
};
