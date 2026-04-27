import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Rocket, Zap, Star, TrendingUp } from 'lucide-react';

export const CofounderInitialLoader: React.FC = () => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    { icon: Rocket, text: "Building your business empire...", color: "#00E0FF" },
    { icon: TrendingUp, text: "Preparing your roadmap...", color: "#6CFF6C" },
    { icon: Star, text: "Loading your success journey...", color: "#FFCF00" },
    { icon: Zap, text: "Powering up your AI cofounder...", color: "#FF4F4F" },
    { icon: Sparkles, text: "Making magic happen...", color: "#4B00FF" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentTipData = tips[currentTip];
  const Icon = currentTipData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#00E0FF', '#FFCF00', '#FF4F4F', '#6CFF6C', '#4B00FF'][i % 5],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6">
        {/* Animated logo container */}
        <motion.div
          className="mb-8 relative"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 -m-12"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="3"
                strokeDasharray="10 5"
              />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E0FF" />
                  <stop offset="25%" stopColor="#FFCF00" />
                  <stop offset="50%" stopColor="#FF4F4F" />
                  <stop offset="75%" stopColor="#6CFF6C" />
                  <stop offset="100%" stopColor="#4B00FF" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Center logo pulse */}
          <motion.div
            className="relative w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #00E0FF 0%, #4B00FF 100%)'
            }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(0, 224, 255, 0.5)',
                '0 0 40px rgba(0, 224, 255, 0.8)',
                '0 0 20px rgba(0, 224, 255, 0.5)',
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <motion.div
              className="text-white font-black text-5xl"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              C
            </motion.div>
          </motion.div>

          {/* Orbiting icons */}
          {[0, 72, 144, 216, 288].map((angle, index) => (
            <motion.div
              key={angle}
              className="absolute top-1/2 left-1/2"
              style={{
                transformOrigin: '0 0',
              }}
              animate={{
                rotate: [angle, angle + 360]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.div
                className="absolute rounded-full p-2 shadow-lg"
                style={{
                  width: 60,
                  height: 60,
                  marginLeft: -30,
                  marginTop: -30,
                  backgroundColor: ['#00E0FF', '#FFCF00', '#FF4F4F', '#6CFF6C', '#4B00FF'][index]
                }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.3
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {[Rocket, Star, Zap, Sparkles, TrendingUp][index] && 
                    React.createElement([Rocket, Star, Zap, Sparkles, TrendingUp][index], {
                      className: "w-6 h-6 text-white"
                    })
                  }
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* App name */}
        <motion.h1
          className="text-6xl font-black mb-4"
          style={{
            background: 'linear-gradient(90deg, #00E0FF, #FFCF00, #FF4F4F, #6CFF6C, #4B00FF)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          Cofounder
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl text-gray-600 dark:text-white/80 mb-12 font-semibold"
          animate={{
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          Your AI Business Partner
        </motion.p>

        {/* Animated tip with icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                },
                scale: {
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              }}
            >
              <Icon 
                className="w-6 h-6"
                style={{ color: currentTipData.color }}
              />
            </motion.div>
            <span className="text-lg text-gray-700 dark:text-white/90 font-semibold">
              {currentTipData.text}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #00E0FF, #FFCF00, #FF4F4F, #6CFF6C, #4B00FF)',
                backgroundSize: '200% 100%'
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 0%'],
                width: ['0%', '100%']
              }}
              transition={{
                backgroundPosition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                },
                width: {
                  duration: 3,
                  ease: 'easeInOut',
                  repeat: Infinity
                }
              }}
            />
          </div>
          
          {/* Animated loading dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#00E0FF', '#FFCF00', '#FF4F4F', '#6CFF6C'][i]
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Corner sparkles */}
      {[
        { top: '10%', left: '10%', delay: 0 },
        { top: '10%', right: '10%', delay: 0.5 },
        { bottom: '10%', left: '10%', delay: 1 },
        { bottom: '10%', right: '10%', delay: 1.5 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={pos}
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: pos.delay,
            ease: 'easeInOut'
          }}
        >
          <Sparkles 
            className="w-8 h-8"
            style={{ color: ['#00E0FF', '#FFCF00', '#FF4F4F', '#6CFF6C'][i] }}
          />
        </motion.div>
      ))}
    </div>
  );
};
