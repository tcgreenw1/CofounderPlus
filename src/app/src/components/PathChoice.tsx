import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, HelpCircle, Brain, List, TrendingUp, Target, Users, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

function PathChoice() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePathSelection = (path: string) => {
    setSelectedPath(path);
    
    setTimeout(() => {
      // Store the selected path for future reference
      localStorage.setItem('questionnaire_path', path);
      
      if (path === 'personality') {
        // Go to personality test first, then industries, then signup
        navigate('/personality-test');
      } else if (path === 'industry') {
        // Go directly to auth/signup
        navigate('/auth?mode=signup');
      }
    }, 500);
  };

  const handleHelpClick = () => {
    setShowHelpDialog(true);
  };

  const handleGoBack = () => {
    navigate('/questionnaire');
  };

  const helpContent = {
    title: "Which path is right for you?",
    description: "Both paths will help you find the perfect business. Choose the approach that feels more comfortable to you.",
    tips: [
      {
        icon: <Brain className="w-4 h-4 sm:w-5 sm:h-5" />,
        title: "Choose 'Personality Test First' if:",
        description: "You want a personalized recommendation based on your working style, motivations, and preferences. This helps us find businesses that match your natural strengths."
      },
      {
        icon: <List className="w-4 h-4 sm:w-5 sm:h-5" />,
        title: "Choose 'Browse Industries' if:",
        description: "You prefer to explore different business types directly and make your own choice. Great if you already have some ideas about what interests you."
      },
      {
        icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />,
        title: "Both paths lead to success:",
        description: "No matter which you choose, you'll get a complete business roadmap tailored to your selected industry and goals."
      },
      {
        icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
        title: "You can always change later:",
        description: "Your choice isn't permanent. You can explore other business types and take the personality test anytime from your dashboard."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Gentle meteors for path choice */}
      <div className="shooting-star" style={{ animationDelay: '24s', animationDuration: '4.9s', top: '35%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '66s', animationDuration: '5.4s', top: '78%' }}></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <motion.button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">Cofounder</span>
        </motion.button>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center w-full"
        >
          {/* Progress Bar */}
          <div className="w-full h-2 bg-white/20 dark:bg-gray-800/20 rounded-full mb-6 sm:mb-8 backdrop-blur-lg">
            <motion.div
              initial={{ width: '20%' }}
              animate={{ width: '40%' }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
            ></motion.div>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto"
          >
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Choose Your Path
          </h1>

          {/* Progress indicator */}
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12">
            Question 2 of 5
          </p>

          {/* Question */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl sm:text-2xl md:text-3xl font-semibold mb-8 sm:mb-12 text-gray-800 dark:text-gray-200 px-2"
          >
            How would you like to find your business?
          </motion.h2>

          {/* Path Options */}
          <div className="space-y-3 sm:space-y-4">
            <motion.button
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              whileHover={{ scale: isMobile ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePathSelection('personality')}
              className={`w-full p-4 sm:p-6 rounded-2xl font-semibold text-left transition-all duration-300 backdrop-blur-lg border ${
                selectedPath === 'personality'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent scale-105'
                  : 'bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30'
              }`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-base sm:text-lg">Take personality test first</div>
                  <div className="text-sm sm:text-sm opacity-70">Get personalized recommendations based on your style</div>
                </div>
              </div>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              whileHover={{ scale: isMobile ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePathSelection('industry')}
              className={`w-full p-4 sm:p-6 rounded-2xl font-semibold text-left transition-all duration-300 backdrop-blur-lg border ${
                selectedPath === 'industry'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent scale-105'
                  : 'bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30'
              }`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <List className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-base sm:text-lg">Pick from industry list</div>
                  <div className="text-sm sm:text-sm opacity-70">Browse all business types and choose what interests you</div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Help Button - Show inline on desktop, floating on mobile */}
          {!isMobile && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              onClick={handleHelpClick}
              className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-xl hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300 flex items-center gap-2 mx-auto text-sm sm:text-base"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Not sure which to choose?
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Help Dialog - Mobile responsive */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              {helpContent.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {helpContent.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {helpContent.tips.map((tip, index) => (
              <Card key={index} className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                      {tip.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold mb-1 sm:mb-2 text-blue-800 dark:text-blue-200 text-sm sm:text-base">{tip.title}</h5>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{tip.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Encouragement Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-600 rounded-full flex-shrink-0">
                    <Target className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm sm:text-base">Both paths work great!</p>
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      There's no wrong choice here. Pick whichever approach feels more comfortable and exciting to you right now.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-3 sm:pt-4">
              <Button 
                onClick={() => setShowHelpDialog(false)} 
                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
              >
                Got it, thanks!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Help Button - Mobile only */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          onClick={handleHelpClick}
          className="fixed bottom-4 right-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-50"
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
}

export default PathChoice;