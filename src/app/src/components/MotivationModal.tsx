import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Heart, Target, TrendingUp, Star, Zap, DollarSign, Users, Rocket, Crown, Building2 } from 'lucide-react';
import { useMotivation } from './MotivationProvider';
import { useBusiness } from './BusinessContext';

// Base motivational messages
const baseMotivationalMessages = [
  {
    title: "You're Building Something Amazing",
    message: "Every successful business started with a single step. You've already taken yours by being here, learning, and growing.",
    icon: <Sparkles className="w-8 h-8" />,
    color: "from-purple-400 to-pink-400"
  },
  {
    title: "Your Dreams Are Valid",
    message: "The vision you have for your business is uniquely yours. Trust in your ability to make it a reality, one decision at a time.",
    icon: <Heart className="w-8 h-8" />,
    color: "from-rose-400 to-orange-400"
  },
  {
    title: "Progress Over Perfection",
    message: "You don't need to have everything figured out right now. Focus on taking the next small step forward.",
    icon: <Target className="w-8 h-8" />,
    color: "from-blue-400 to-cyan-400"
  },
  {
    title: "You're Closer Than You Think",
    message: "Every challenge you overcome, every lesson you learn brings you closer to success. Keep going – you've got this!",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "from-green-400 to-emerald-400"
  },
  {
    title: "Your Future Self Thanks You",
    message: "The work you're doing today is an investment in the life and business you want tomorrow. Stay committed to your journey.",
    icon: <Star className="w-8 h-8" />,
    color: "from-yellow-400 to-amber-400"
  },
  {
    title: "You Have Everything You Need",
    message: "You already possess the creativity, determination, and resilience needed to succeed. Trust yourself and take action.",
    icon: <Zap className="w-8 h-8" />,
    color: "from-indigo-400 to-purple-400"
  }
];

// Business-specific motivational messages
const getBusinessSpecificMessages = (progress: any) => {
  const messages = [];

  if (progress.businessCount === 0) {
    messages.push({
      title: "Every Empire Starts with One Decision",
      message: "You're here because you have the vision. Now it's time to take the first step. Create your business and begin your journey to $1M net worth.",
      icon: <Building2 className="w-8 h-8" />,
      color: "from-blue-500 to-purple-500",
      cta: "Ready to start your first business?"
    });
  }

  if (progress.businessCount > 0 && !progress.hasRevenue) {
    messages.push({
      title: "Your First Sale Is Everything",
      message: "You've created your business – that's huge! Now focus on that first sale. It will validate your idea and fuel your confidence for what's next.",
      icon: <DollarSign className="w-8 h-8" />,
      color: "from-green-500 to-teal-500",
      cta: "Ready to make your first sale?"
    });
  }

  if (progress.hasRevenue && !progress.hasEmployees) {
    messages.push({
      title: "Scale Beyond Yourself",
      message: "You've proven your business works! Now imagine what you could achieve with a team. Your first hire will multiply your impact.",
      icon: <Users className="w-8 h-8" />,
      color: "from-orange-500 to-red-500",
      cta: "Ready to build your team?"
    });
  }

  if (progress.hasRevenue && progress.hasEmployees) {
    messages.push({
      title: "You're Building an Empire",
      message: "Look at you go! You have revenue, a team, and momentum. The path to $1M is clearer than ever. Keep scaling what works.",
      icon: <Crown className="w-8 h-8" />,
      color: "from-yellow-500 to-orange-500",
      cta: "Ready to reach $1M?"
    });
  }

  return messages;
};

// Floating particle component
const FloatingParticle = ({ delay, duration, startX, startY }: { delay: number; duration: number; startX: number; startY: number }) => (
  <motion.div
    className="absolute w-2 h-2 bg-white/20 rounded-full"
    style={{ left: startX, top: startY }}
    animate={{
      y: [0, -100, -200, -100, 0],
      x: [0, 30, -20, 40, 0],
      opacity: [0, 0.6, 0.8, 0.4, 0],
      scale: [0, 1, 1.2, 1, 0]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Breathing animation component
const BreathingOrb = ({ size, delay }: { size: number; delay: number }) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-r from-white/10 to-white/5 blur-xl"
    style={{ width: size, height: size }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.6, 0.3]
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

export const MotivationModal: React.FC = () => {
  const { isOpen, closeMotivation } = useMotivation();
  const { userBusinesses, selectedBusiness } = useBusiness();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Get user progress for smart motivation
  const getUserProgress = () => {
    const businessCount = userBusinesses.length;
    const hasRevenue = userBusinesses.some(b => b.revenue && b.revenue > 0);
    const hasEmployees = userBusinesses.some(b => b.employees && b.employees > 0);
    
    return {
      businessCount,
      hasRevenue,
      hasEmployees,
      hasSelectedBusiness: !!selectedBusiness,
      totalRevenue: userBusinesses.reduce((sum, b) => sum + (b.revenue || 0), 0),
      totalEmployees: userBusinesses.reduce((sum, b) => sum + (b.employees || 0), 0)
    };
  };

  const progress = getUserProgress();

  // Combine base messages with business-specific ones
  const getAllMessages = () => {
    const businessMessages = getBusinessSpecificMessages(progress);
    return [...businessMessages, ...baseMotivationalMessages];
  };

  const allMessages = getAllMessages();

  // Rotate through messages
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % allMessages.length);
    }, 8000); // Change message every 8 seconds

    return () => clearInterval(interval);
  }, [isOpen, allMessages.length]);

  // Reset message index when modal opens - prioritize business-specific messages
  useEffect(() => {
    if (isOpen) {
      const businessSpecificCount = getBusinessSpecificMessages(progress).length;
      if (businessSpecificCount > 0) {
        // Start with a business-specific message
        setCurrentMessageIndex(Math.floor(Math.random() * businessSpecificCount));
      } else {
        setCurrentMessageIndex(Math.floor(Math.random() * allMessages.length));
      }
    }
  }, [isOpen]);

  const currentMessage = allMessages[currentMessageIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={closeMotivation}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-4 z-50 flex items-center justify-center"
          >
            <div className={`relative w-full max-w-4xl h-full max-h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br ${currentMessage.color} shadow-2xl`}>
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Breathing orbs */}
                <BreathingOrb size={300} delay={0} />
                <BreathingOrb size={200} delay={2} />
                <BreathingOrb size={400} delay={4} />
                
                {/* Floating particles */}
                {Array.from({ length: 20 }, (_, i) => (
                  <FloatingParticle
                    key={i}
                    delay={i * 0.5}
                    duration={8 + Math.random() * 4}
                    startX={Math.random() * 100 + '%'}
                    startY={Math.random() * 100 + '%'}
                  />
                ))}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={closeMotivation}
                className="absolute top-6 right-6 z-10 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm group"
              >
                <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </motion.button>

              {/* Main content */}
              <div className="relative h-full flex flex-col items-center justify-center text-center px-8 py-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center space-y-8"
                  >
                    {/* Icon */}
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="p-6 rounded-full bg-white/20 backdrop-blur-sm text-white"
                    >
                      {currentMessage.icon}
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
                    >
                      {currentMessage.title}
                    </motion.h2>

                    {/* Message */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed font-light"
                    >
                      {currentMessage.message}
                    </motion.p>

                    {/* Business-specific stats */}
                    {progress.businessCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-6 mt-6 px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-sm"
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{progress.businessCount}</div>
                          <div className="text-xs text-white/70">Business{progress.businessCount !== 1 ? 'es' : ''}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">${progress.totalRevenue.toLocaleString()}</div>
                          <div className="text-xs text-white/70">Total Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{progress.totalEmployees}</div>
                          <div className="text-xs text-white/70">Team Member{progress.totalEmployees !== 1 ? 's' : ''}</div>
                        </div>
                      </motion.div>
                    )}

                    {/* CTA for business-specific messages */}
                    {currentMessage.cta && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-lg text-white/80 font-medium"
                      >
                        {currentMessage.cta}
                      </motion.p>
                    )}

                    {/* Breathing instruction */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="mt-8 text-white/70 text-lg"
                    >
                      <motion.p
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        Take a deep breath and feel your confidence growing
                      </motion.p>
                    </motion.div>

                    {/* Progress indicator */}
                    <div className="flex space-x-2 mt-6">
                      {allMessages.map((_, index) => (
                        <motion.div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            index === currentMessageIndex ? 'bg-white' : 'bg-white/30'
                          }`}
                          animate={index === currentMessageIndex ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.5 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};