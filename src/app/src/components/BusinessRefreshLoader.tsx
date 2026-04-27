import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2 } from 'lucide-react';

interface BusinessRefreshLoaderProps {
  isLoading: boolean;
  message?: string;
}

export const BusinessRefreshLoader: React.FC<BusinessRefreshLoaderProps> = ({ 
  isLoading,
  message = 'Loading your businesses...'
}) => {
  const colors = ['#00E0FF', '#FFCF00', '#FF4F4F', '#6CFF6C', '#4B00FF'];
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center gap-8">
            {/* Apple Glass morphism card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/20 dark:border-gray-700/20"
            >
              {/* Animated building icon with bouncy dots */}
              <div className="relative flex items-center justify-center">
                {/* Building icon */}
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative z-10"
                >
                  <Building2 className="w-16 h-16 text-[#00E0FF]" strokeWidth={2.5} />
                </motion.div>

                {/* Bouncing dots around icon */}
                {colors.map((color, index) => (
                  <motion.div
                    key={index}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: color,
                      left: '50%',
                      top: '50%',
                    }}
                    animate={{
                      x: [
                        0,
                        Math.cos((index * 72 * Math.PI) / 180) * 50,
                        0,
                      ],
                      y: [
                        0,
                        Math.sin((index * 72 * Math.PI) / 180) * 50,
                        0,
                      ],
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* Loading bar */}
              <div className="mt-8 w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #00E0FF, #4B00FF, #FF4F4F)',
                  }}
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>

            {/* Message text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.p 
                className="text-lg font-medium text-gray-800 dark:text-white"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {message}
              </motion.p>
              
              {/* Animated dots */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#00E0FF]"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
