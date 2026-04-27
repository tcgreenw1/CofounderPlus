import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../ThemeProvider';
import { ArrowLeft, ArrowRight, Brain, Heart, Target, Lightbulb, Users, Settings, DollarSign, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface QuizQuestion {
  id: string;
  prompt: string;
  dimension: string;
  subdimension: string;
  input_type: 'likert' | 'single_choice';
  min?: number;
  max?: number;
  options?: string[];
  reverse_scored?: boolean;
}

interface QuizQuestionProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (value: any) => void;
  onBack: () => void;
  selectedValue?: any;
  canGoBack: boolean;
  showBackButton?: boolean;
}

export function QuizQuestion({ 
  question, 
  currentIndex, 
  totalQuestions, 
  onAnswer, 
  onBack, 
  selectedValue,
  canGoBack,
  showBackButton = true
}: QuizQuestionProps) {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(selectedValue);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setLocalValue(selectedValue);
  }, [selectedValue, question.id]);

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (value: any) => {
    if (isAnimating) return;
    
    setLocalValue(value);
    setIsAnimating(true);
    
    // Instant response for maximum speed
    onAnswer(value);
    setIsAnimating(false);
  };

  const getQuestionIcon = () => {
    if (question.dimension === 'BigFive') {
      const iconMap: { [key: string]: any } = {
        'Extraversion': <Users className="w-8 h-8" />,
        'Conscientiousness': <Target className="w-8 h-8" />,
        'EmotionalStability': <Heart className="w-8 h-8" />,
        'Openness': <Lightbulb className="w-8 h-8" />
      };
      return iconMap[question.subdimension] || <Brain className="w-8 h-8" />;
    } else if (question.dimension === 'RIASEC') {
      const iconMap: { [key: string]: any } = {
        'Realistic': <Settings className="w-8 h-8" />,
        'Investigative': <Brain className="w-8 h-8" />,
        'Artistic': <Lightbulb className="w-8 h-8" />,
        'Social': <Users className="w-8 h-8" />,
        'Enterprising': <Target className="w-8 h-8" />,
        'Conventional': <Settings className="w-8 h-8" />
      };
      return iconMap[question.subdimension] || <Brain className="w-8 h-8" />;
    } else if (question.dimension === 'constraints') {
      const iconMap: { [key: string]: any } = {
        'capital': <DollarSign className="w-8 h-8" />,
        'hours': <Clock className="w-8 h-8" />,
        'sales_comfort': <Users className="w-8 h-8" />,
        'hands_on': <Settings className="w-8 h-8" />,
        'risk': <Target className="w-8 h-8" />,
        'revenue_goal': <DollarSign className="w-8 h-8" />
      };
      return iconMap[question.subdimension] || <Brain className="w-8 h-8" />;
    }
    return <Brain className="w-8 h-8" />;
  };

  const getLikertLabels = () => {
    return [
      { value: 1, label: 'Strongly Disagree', shortLabel: '1' },
      { value: 2, label: 'Disagree', shortLabel: '2' },
      { value: 3, label: 'Neutral', shortLabel: '3' },
      { value: 4, label: 'Agree', shortLabel: '4' },
      { value: 5, label: 'Strongly Agree', shortLabel: '5' }
    ];
  };

  const getDimensionInfo = () => {
    if (question.dimension === 'BigFive') {
      return {
        category: 'Personality',
        color: 'from-purple-600 to-blue-600'
      };
    } else if (question.dimension === 'RIASEC') {
      return {
        category: 'Interests',
        color: 'from-blue-600 to-cyan-600'
      };
    } else {
      return {
        category: 'Preferences',
        color: 'from-pink-600 to-purple-600'
      };
    }
  };

  const dimensionInfo = getDimensionInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      {/* Background elements */}
      <div className="shooting-star" style={{ animationDelay: '8s', animationDuration: '5s', top: '15%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '35s', animationDuration: '4.5s', top: '80%' }}></div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with progress */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {showBackButton ? (
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={!canGoBack}
                className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:bg-white/10 dark:hover:bg-gray-800/10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
            ) : (
              <div /> // Empty div to maintain spacing
            )}
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentIndex + 1} of {totalQuestions}
              </span>
              <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${dimensionInfo.color} text-white`}>
                {dimensionInfo.category}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/20 dark:bg-gray-800/20 rounded-full backdrop-blur-lg">
            <motion.div
              initial={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full"
            ></motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
            className="max-w-4xl mx-auto w-full text-center"
          >
            {/* Question Icon */}
            <div className={`w-20 h-20 bg-gradient-to-r ${dimensionInfo.color} rounded-full flex items-center justify-center mb-8 mx-auto text-white`}>
              {getQuestionIcon()}
            </div>

            {/* Question Text */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800 dark:text-gray-200 leading-tight max-w-3xl mx-auto">
                {question.prompt}
              </h2>
            </div>

            {/* Answer Options */}
            <div className="max-w-3xl mx-auto">
              {question.input_type === 'likert' ? (
                <div className="space-y-3">
                  {getLikertLabels().map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      disabled={isAnimating}
                      className={`w-full p-4 rounded-xl font-medium text-left transition-all duration-75 backdrop-blur-lg border flex items-center justify-between transform hover:scale-[1.01] active:scale-[0.99] ${
                        localValue === option.value
                          ? `bg-gradient-to-r ${dimensionInfo.color} text-white border-transparent scale-105 shadow-2xl`
                          : 'bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 hover:border-purple-300 dark:hover:border-purple-500'
                      }`}
                    >
                      <span className="text-lg">{option.label}</span>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        localValue === option.value ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {option.shortLabel}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 max-w-2xl mx-auto">
                  {question.options?.map((option, index) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      disabled={isAnimating}
                      className={`p-4 rounded-xl font-medium text-lg transition-all duration-75 backdrop-blur-lg border transform hover:scale-[1.01] active:scale-[0.99] ${
                        localValue === option
                          ? `bg-gradient-to-r ${dimensionInfo.color} text-white border-transparent scale-105 shadow-2xl`
                          : 'bg-white/20 dark:bg-gray-800/20 border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 hover:border-purple-300 dark:hover:border-purple-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Helper Text */}
            {question.input_type === 'likert' && (
              <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                Choose the option that best reflects your natural preference
              </div>
            )}
          </motion.div>
        </div>

        {/* Navigation Hint - Simplified */}
        {localValue && (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Answer recorded</span>
              <ArrowRight className="w-4 h-4" />
              <span>Moving to next question...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}