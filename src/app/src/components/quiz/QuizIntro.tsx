import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../ThemeProvider';
import { Brain, Target, Lightbulb, TrendingUp, Clock, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface QuizIntroProps {
  onStart: () => void;
  onBack: () => void;
  showBackButton?: boolean;
}

export function QuizIntro({ onStart, onBack, showBackButton = true }: QuizIntroProps) {
  const { theme } = useTheme();

  const benefits = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Personalized Industry Matches",
      description: "Get your top 3 industry recommendations based on your unique personality and preferences"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Science-Backed Analysis", 
      description: "Our algorithm uses proven personality frameworks (Big Five & RIASEC) for accurate matching"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Success Roadmap",
      description: "Each recommendation includes a detailed 30-day action plan to get started"
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Why It Fits You",
      description: "Understand exactly why each industry aligns with your strengths and working style"
    }
  ];

  const features = [
    {
      icon: <Clock className="w-5 h-5" />,
      text: "Takes 2-3 minutes"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      text: "Your data stays private"
    },
    {
      icon: <Target className="w-5 h-5" />,
      text: "Instant results"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Background elements */}
      <div className="shooting-star" style={{ animationDelay: '12s', animationDuration: '6s', top: '20%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '45s', animationDuration: '4.8s', top: '75%' }}></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        {showBackButton && (
          <div className="p-6">
            <motion.button
              onClick={onBack}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              ← Back
            </motion.button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Hero Section */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full flex items-center justify-center mb-8 mx-auto"
            >
              <Brain className="w-12 h-12 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
            >
              Industry Match Quiz
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Discover which industries are perfect for your personality, skills, and goals. 
              Get personalized recommendations with detailed action plans to start your business journey.
            </motion.p>

            {/* Features row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-6 mb-12"
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 rounded-full"
                >
                  {feature.icon}
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Benefits Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                >
                  <Card className="h-full bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-300">
                    <CardContent className="p-6 text-left">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg flex-shrink-0">
                          {benefit.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                            {benefit.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Privacy Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="mb-8 p-4 bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-lg max-w-2xl mx-auto"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4 inline mr-2" />
                We use your answers to personalize your recommendations. You can delete this data anytime in Settings.
                <button className="text-purple-600 dark:text-purple-400 hover:underline ml-1">
                  Settings → Data
                </button>
              </p>
            </motion.div>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              <Button
                onClick={onStart}
                size="lg"
                className="text-xl px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-white border-0"
              >
                Start Quiz
              </Button>
            </motion.div>

            {/* What to expect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 2 }}
              className="mt-8 text-sm text-gray-500 dark:text-gray-400"
            >
              Next: 16 quick questions about your preferences and goals
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}