import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Star, Trophy, Coins, Sparkles, Info } from 'lucide-react';
import { Button } from './ui/button';
import { ConfettiParticle } from './slot-machine/ConfettiParticle';
import { 
  SLOT_MACHINE_SYMBOLS, 
  WINNING_COMBINATION, 
  ANIMATION_TIMINGS, 
  ANIMATION_VARIANTS 
} from './slot-machine/constants';

interface SlotMachineWinAnimationProps {
  isVisible: boolean;
  onClose: () => void;
  onViewDetails?: () => void;
  taskTitle?: string;
  reward?: string;
}

const SlotMachineWinAnimation: React.FC<SlotMachineWinAnimationProps> = ({
  isVisible,
  onClose,
  onViewDetails,
  taskTitle = "Task Completed!",
  reward = "+100 XP"
}) => {
  const [showReels, setShowReels] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reelValues, setReelValues] = useState(['🎰', '🎰', '🎰']);

  const safeTaskTitle = taskTitle || "Task Completed!";
  const safeReward = reward || "+100 XP";

  useEffect(() => {
    let spinInterval: NodeJS.Timeout;
    let winTimeout: NodeJS.Timeout;

    if (isVisible) {
      console.log('SlotMachine: becoming visible, starting animation');
      setShowReels(true);
      setShowCelebration(false);
      setReelValues(['🎰', '🎰', '🎰']);
      
      spinInterval = setInterval(() => {
        setReelValues([
          SLOT_MACHINE_SYMBOLS[Math.floor(Math.random() * SLOT_MACHINE_SYMBOLS.length)],
          SLOT_MACHINE_SYMBOLS[Math.floor(Math.random() * SLOT_MACHINE_SYMBOLS.length)],
          SLOT_MACHINE_SYMBOLS[Math.floor(Math.random() * SLOT_MACHINE_SYMBOLS.length)]
        ]);
      }, ANIMATION_TIMINGS.SPIN_INTERVAL);

      winTimeout = setTimeout(() => {
        clearInterval(spinInterval);
        setReelValues(WINNING_COMBINATION);
        setShowCelebration(true);
        console.log('SlotMachine: showing celebration');
      }, ANIMATION_TIMINGS.SPIN_DURATION);
    } else {
      console.log('SlotMachine: becoming invisible, resetting state');
      setShowReels(false);
      setShowCelebration(false);
      setReelValues(['🎰', '🎰', '🎰']);
      
      if (spinInterval) clearInterval(spinInterval);
      if (winTimeout) clearTimeout(winTimeout);
    }

    return () => {
      if (spinInterval) clearInterval(spinInterval);
      if (winTimeout) clearTimeout(winTimeout);
    };
  }, [isVisible]);

  const handleClose = () => {
    console.log('SlotMachine: close button clicked');
    onClose();
  };

  const handleViewDetails = () => {
    console.log('SlotMachine: view details button clicked');
    if (onViewDetails) {
      onViewDetails();
    }
  };

  const confettiElements = useMemo(() => 
    showCelebration ? Array.from({ length: ANIMATION_TIMINGS.CONFETTI_COUNT }, (_, i) => (
      <ConfettiParticle key={i} delay={i * ANIMATION_TIMINGS.CONFETTI_DELAY_MULTIPLIER} index={i} />
    )) : []
  , [showCelebration]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="slot-machine-overlay"
          {...ANIMATION_VARIANTS.overlay}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          style={{ willChange: 'opacity' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
          
          {confettiElements}

          <motion.div
            key="slot-machine-content"
            {...ANIMATION_VARIANTS.container}
            className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 max-w-2xl mx-4 shadow-2xl"
            style={{ willChange: 'transform' }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.6)',
                  '0 0 40px rgba(255, 107, 107, 0.6)',
                  '0 0 20px rgba(255, 215, 0, 0.6)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl"
              style={{ willChange: 'box-shadow' }}
            />

            <motion.div {...ANIMATION_VARIANTS.header} className="text-center mb-6">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <Trophy className="w-16 h-16 text-yellow-200 drop-shadow-lg" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">JACKPOT!</h1>
              <p className="text-xl text-yellow-200">{safeTaskTitle}</p>
            </motion.div>

            <motion.div
              {...ANIMATION_VARIANTS.slotMachine}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 shadow-inner"
            >
              <div className="flex justify-center space-x-2 mb-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ backgroundColor: ['#FFD700', '#FF6B6B', '#FFD700'] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ willChange: 'background-color' }}
                  />
                ))}
              </div>

              <div className="flex justify-center space-x-4 bg-white rounded-xl p-4">
                {reelValues.map((symbol, index) => (
                  <motion.div
                    key={index}
                    animate={showReels && !showCelebration ? { y: [0, -10, 0] } : {}}
                    transition={{
                      duration: 0.3,
                      repeat: showCelebration ? 0 : Infinity,
                      delay: index * 0.1
                    }}
                    className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-4 border-yellow-400 rounded-lg w-20 h-20 flex items-center justify-center shadow-lg"
                    style={{ willChange: showReels && !showCelebration ? 'transform' : 'auto' }}
                  >
                    <span className="text-4xl">{symbol}</span>
                  </motion.div>
                ))}
              </div>

              {showCelebration && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full mt-4 shadow-lg"
                />
              )}
            </motion.div>

            {showCelebration && (
              <>
                <motion.div {...ANIMATION_VARIANTS.celebration} className="text-center mb-6">
                  <motion.div
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(255, 215, 0, 0.8)',
                        '0 0 20px rgba(255, 107, 107, 0.8)', 
                        '0 0 10px rgba(255, 215, 0, 0.8)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl font-bold text-white mb-4"
                    style={{ willChange: 'text-shadow' }}
                  >
                    WINNER!
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex items-center justify-center space-x-4 text-2xl text-yellow-200"
                  >
                    <Coins className="w-8 h-8" />
                    <span className="font-bold">{safeReward}</span>
                    <Sparkles className="w-8 h-8" />
                  </motion.div>
                </motion.div>

                {[Crown, Star].map((Icon, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      rotate: 180,
                      x: [0, (index % 2 === 0 ? 60 : -60), 0],
                      y: [0, -30, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.8 + index * 0.3,
                      repeat: 2,
                      repeatDelay: 1
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ willChange: 'transform' }}
                  >
                    <Icon className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
                  </motion.div>
                ))}

                <motion.div {...ANIMATION_VARIANTS.buttons} className="text-center">
                  {onViewDetails ? (
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="bg-white/20 border-white/40 text-white hover:bg-white/30 font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <motion.span
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          🎉 Continue! 🎉
                        </motion.span>
                      </Button>
                      <Button
                        onClick={handleViewDetails}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <Info className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleClose}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
                      size="lg"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🎉 Awesome! Continue 🎉
                      </motion.span>
                    </Button>
                  )}
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlotMachineWinAnimation;