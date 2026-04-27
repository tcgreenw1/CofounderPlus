import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import {
  Rocket,
  Map,
  Briefcase,
  LayoutDashboard,
  GraduationCap,
  StickyNote,
  Sparkles,
  MessageSquare,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  Zap,
  FileText,
  Star
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  color: string;
}

interface OnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
  userId?: string; // Add userId to make completion user-specific
}

const tourSteps: TourStep[] = [
  // Welcome
  {
    id: 'welcome',
    title: '👋 Welcome!',
    description: 'Let\'s take a quick tour of Cofounder+ features.',
    route: '/dashboard',
    icon: <Rocket className="w-4 h-4" />,
    position: 'bottom',
    color: '#00E0FF',
  },

  // Dashboard - 2 steps (removed overview step)
  {
    id: 'dashboard-priority',
    title: 'Priority Tasks',
    description: 'Track your business metrics at a glance. See upcoming tasks and goals right here.',
    route: '/dashboard',
    icon: <Target className="w-4 h-4" />,
    targetSelector: '[class*="priority"], [class*="task"], [class*="goal"], [class*="card"]',
    position: 'left',
    color: '#6CFF6C',
  },

  // Roadmap - 3 steps
  {
    id: 'roadmap-main',
    title: 'Your Roadmap',
    description: 'Step-by-step path to your dreams with gamified milestones.',
    route: '/roadmap',
    icon: <Map className="w-4 h-4" />,
    targetSelector: '.roadmap-container, [class*="roadmap"], [class*="milestone"], main',
    position: 'right',
    color: '#FFCF00',
  },
  {
    id: 'roadmap-xp',
    title: 'Track Progress',
    description: 'Complete tasks to unlock rewards and level up!',
    route: '/roadmap',
    icon: <TrendingUp className="w-4 h-4" />,
    targetSelector: '[class*="xp"], [class*="experience"], [class*="level"], [class*="hud"]',
    position: 'bottom',
    color: '#4B00FF',
  },
  {
    id: 'roadmap-complete',
    title: 'Active Tasks',
    description: 'Click any task to view details and mark complete.',
    route: '/roadmap',
    icon: <CheckCircle className="w-4 h-4" />,
    targetSelector: '[class*="complete"], button[class*="Complete"], [class*="mark-complete"]',
    position: 'top',
    color: '#FF4F4F',
  },

  // Operations - 1 step only
  {
    id: 'operations-main',
    title: 'Business OS',
    description: 'Manage finances, HR, products, sales & marketing.',
    route: '/operations',
    icon: <Briefcase className="w-4 h-4" />,
    targetSelector: '.operations-container, [class*="operations"], main',
    position: 'top',
    color: '#FF4F4F',
  },

  // University - 1 step only
  {
    id: 'university-main',
    title: 'University',
    description: 'Learn business skills through bite-sized lessons.',
    route: '/university',
    icon: <GraduationCap className="w-4 h-4" />,
    targetSelector: '.university-container, [class*="university"], main',
    position: 'right',
    color: '#6CFF6C',
  },

  // Notes - 2 steps
  {
    id: 'notes-main',
    title: 'Smart Notes',
    description: 'Capture ideas, meeting notes, and to-dos.',
    route: '/notes',
    icon: <StickyNote className="w-4 h-4" />,
    targetSelector: '.notes-container, [class*="notes"], main',
    position: 'left',
    color: '#00E0FF',
  },
  {
    id: 'notes-boards',
    title: 'Organize by Board',
    description: 'Create boards to keep everything organized.',
    route: '/notes',
    icon: <FileText className="w-4 h-4" />,
    targetSelector: '[class*="board"], [class*="sidebar"], aside',
    position: 'right',
    color: '#FFCF00',
  },

  // Dream Board - 2 steps (swapped descriptions)
  {
    id: 'dreamboard-main',
    title: 'Dream Board',
    description: 'Add goals and track your progress toward them.',
    route: '/dream-board',
    icon: <Sparkles className="w-4 h-4" />,
    targetSelector: '.dream-board-container, [class*="dream"], main',
    position: 'top',
    color: '#FFCF00',
  },
  {
    id: 'dreamboard-goals',
    title: 'Set Goals',
    description: 'Visualize your goals and celebrate wins!',
    route: '/dream-board',
    icon: <Target className="w-4 h-4" />,
    targetSelector: '[class*="goal"], [class*="card"], [class*="add"]',
    position: 'left',
    color: '#6CFF6C',
  },

  // Cofounder AGI - 2 steps (updated titles and descriptions)
  {
    id: 'ai-main',
    title: 'Cofounder AGI',
    description: 'More than just a chatbot, it can operate your entire business, 24/7.',
    route: '/cofounder-ai',
    icon: <MessageSquare className="w-4 h-4" />,
    targetSelector: '.cofounder-ai-container, [class*="chat"], [class*="ai"], main',
    position: 'left',
    color: '#4B00FF',
  },
  {
    id: 'ai-command',
    title: 'Take Command',
    description: 'Have Cofounder fill in the monotonous paperwork so you have more time for business.',
    route: '/cofounder-ai',
    icon: <Zap className="w-4 h-4" />,
    targetSelector: '[class*="input"], [class*="message"], textarea',
    position: 'top',
    color: '#00E0FF',
  },

  // Complete
  {
    id: 'complete',
    title: '🎉 All Set!',
    description: 'You\'re ready to build something amazing!',
    route: '/dashboard',
    icon: <CheckCircle className="w-4 h-4" />,
    position: 'bottom',
    color: '#6CFF6C',
  }
];

export function OnboardingTour({ onComplete, onSkip, userId }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Navigate to the current step's route
  useEffect(() => {
    if (step.route !== location.pathname) {
      navigate(step.route);
    }
  }, [currentStep, step.route, navigate, location.pathname]);

  // Calculate highlight position
  useEffect(() => {
    if (!step.targetSelector) {
      setHighlightRect(null);
      return;
    }

    const timer = setTimeout(() => {
      const selectors = step.targetSelector.split(',').map(s => s.trim());
      let targetElement: Element | null = null;

      for (const selector of selectors) {
        targetElement = document.querySelector(selector);
        if (targetElement) break;
      }

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, step.targetSelector]);

  // Calculate tooltip position near the highlighted element
  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 16;
    const offset = 12; // Distance from highlighted element

    let top = 0;
    let left = 0;

    if (highlightRect && step.position) {
      // Position relative to highlighted element
      switch (step.position) {
        case 'right':
          top = highlightRect.top + (highlightRect.height / 2) - (tooltipRect.height / 2);
          left = highlightRect.right + offset;
          break;
        case 'left':
          top = highlightRect.top + (highlightRect.height / 2) - (tooltipRect.height / 2);
          left = highlightRect.left - tooltipRect.width - offset;
          break;
        case 'top':
          top = highlightRect.top - tooltipRect.height - offset;
          left = highlightRect.left + (highlightRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = highlightRect.bottom + offset;
          left = highlightRect.left + (highlightRect.width / 2) - (tooltipRect.width / 2);
          break;
      }
    } else {
      // Center position for welcome/complete screens
      top = window.innerHeight / 2 - tooltipRect.height / 2;
      left = window.innerWidth / 2 - tooltipRect.width / 2;
    }

    // Keep tooltip on screen
    const maxLeft = window.innerWidth - tooltipRect.width - padding;
    const maxTop = window.innerHeight - tooltipRect.height - padding;
    
    left = Math.max(padding, Math.min(left, maxLeft));
    top = Math.max(padding, Math.min(top, maxTop));

    setTooltipPosition({ top, left });
  }, [highlightRect, step.position]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Shared function to save onboarding completion to both localStorage and server
  const saveOnboardingCompletion = async (reason: 'completed' | 'skipped') => {
    if (userId) {
      console.log(`🎓 OnboardingTour: Saving ${reason} for user:`, userId);
      
      // Set localStorage for immediate persistence
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
      localStorage.setItem(`onboarding_completed_date_${userId}`, new Date().toISOString());
      localStorage.setItem(`onboarding_completion_reason_${userId}`, reason);
      
      // Also save to server for persistence across cache clears - CRITICAL
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          console.log('🎓 OnboardingTour: Saving to server...');
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/customization/save`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId,
                key: 'onboarding_completed',
                value: true
              })
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ OnboardingTour: ${reason} saved to server successfully`, result);
          } else {
            console.error('❌ OnboardingTour: Failed to save to server, status:', response.status);
            const errorText = await response.text();
            console.error('❌ OnboardingTour: Server error:', errorText);
            console.error('❌ OnboardingTour: BUT localStorage is saved, so tour won\'t show on next load');
          }
        } else {
          console.error('❌ OnboardingTour: No access token available');
        }
      } catch (error) {
        console.error('❌ OnboardingTour: Error saving to server:', error);
      }
    } else {
      // Fallback to global key only if no userId
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_completed_date', new Date().toISOString());
      localStorage.setItem('onboarding_completion_reason', reason);
    }
  };

  const handleSkip = async () => {
    console.log('🎓 OnboardingTour: User clicked Skip button');
    console.log('🎓 OnboardingTour: User ID:', userId);
    
    // CRITICAL: Save immediately to prevent race conditions
    if (userId) {
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
      localStorage.setItem(`onboarding_completed_date_${userId}`, new Date().toISOString());
      localStorage.setItem(`onboarding_completion_reason_${userId}`, 'skipped');
      console.log('✅ OnboardingTour: Saved skip to localStorage immediately');
    }
    
    setIsVisible(false);
    
    // CRITICAL: Save skip state to database so tour never shows again
    await saveOnboardingCompletion('skipped');
    
    // Call the parent callback AFTER saving to ensure state is persisted
    if (onSkip) onSkip();
  };

  const handleComplete = async () => {
    console.log('🎓 OnboardingTour: User completed tour');
    setIsVisible(false);
    // CRITICAL: Save completion state to database so tour never shows again
    await saveOnboardingCompletion('completed');
    // Call the parent callback AFTER saving to ensure state is persisted
    if (onComplete) onComplete();
  };
  
  // CRITICAL: If user navigates away or component unmounts during tour, save as skipped
  useEffect(() => {
    return () => {
      if (isVisible && userId) {
        console.log('🎓 OnboardingTour: Component unmounting while visible, saving as skipped');
        // Save immediately without async to ensure it completes before unmount
        localStorage.setItem(`onboarding_completed_${userId}`, 'true');
        localStorage.setItem(`onboarding_completed_date_${userId}`, new Date().toISOString());
        localStorage.setItem(`onboarding_completion_reason_${userId}`, 'dismissed');
      }
    };
  }, [isVisible, userId]);

  if (!isVisible) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Subtle highlight glow on element - NO OVERLAY */}
        {highlightRect && step.targetSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute rounded-lg pointer-events-none"
            style={{
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12,
              border: `2px solid ${step.color}`,
              boxShadow: `0 0 0 4px ${step.color}20, 0 0 20px ${step.color}50`,
            }}
          >
            {/* Pulse animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-lg"
              style={{
                border: `2px solid ${step.color}`,
              }}
            />
          </motion.div>
        )}

        {/* Small floating tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: '280px',
          }}
        >
          <Card
            className="border-2 shadow-lg backdrop-blur-sm"
            style={{
              borderColor: step.color,
              boxShadow: `0 8px 24px ${step.color}30`,
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
            }}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${step.color}20`,
                    color: step.color,
                  }}
                >
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-sm leading-tight mb-1"
                    style={{ color: step.color }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                  style={{ color: step.color }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: step.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  {currentStep + 1}/{tourSteps.length}
                </span>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    size="sm"
                    className="flex-1 h-8 text-xs"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back
                  </Button>
                )}

                {isLastStep ? (
                  <Button
                    onClick={handleComplete}
                    size="sm"
                    className="flex-1 h-8 text-xs bouncy-button"
                    style={{
                      backgroundColor: '#6CFF6C',
                      color: '#000000',
                    }}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Done
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className={`h-8 text-xs bouncy-button ${isFirstStep ? 'flex-1' : 'flex-1'}`}
                    style={{
                      backgroundColor: step.color,
                      color:
                        step.color === '#FFCF00' || step.color === '#6CFF6C'
                          ? '#000000'
                          : '#FFFFFF',
                    }}
                  >
                    Next
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {/* Skip link */}
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Skip tour
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Hook to check if user needs onboarding
export function useOnboarding(userId?: string) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Only check user-specific key if userId is provided
      if (userId) {
        console.log('🎓 useOnboarding: Checking onboarding status for user:', userId);
        
        // Check localStorage ONLY - this is the source of truth
        const userSpecificCompleted = localStorage.getItem(`onboarding_completed_${userId}`);
        console.log('🎓 useOnboarding: localStorage value:', userSpecificCompleted);
        
        if (userSpecificCompleted === 'true') {
          console.log('✅ useOnboarding: Tour already completed - NOT showing');
          setNeedsOnboarding(false);
          setIsFirstLogin(false);
        } else {
          console.log('🎓 useOnboarding: No completion found - showing tour');
          const isFirstLoginFlag = localStorage.getItem('is_first_login');
          setNeedsOnboarding(true);
          setIsFirstLogin(isFirstLoginFlag === 'true');
        }
      } else {
        // Fallback to global key only if no userId
        const globalCompleted = localStorage.getItem('onboarding_completed');
        const isFirstLoginFlag = localStorage.getItem('is_first_login');
        
        setNeedsOnboarding(!globalCompleted);
        setIsFirstLogin(isFirstLoginFlag === 'true');
      }
    };
    
    checkOnboardingStatus();
  }, [userId]);

  const markOnboardingComplete = async () => {
    console.log('🎓 useOnboarding: markOnboardingComplete called');
    
    // CRITICAL: Update state immediately so tour doesn't show again
    setNeedsOnboarding(false);
    
    // Only set user-specific key if userId is provided
    if (userId) {
      console.log('✅ useOnboarding: Marking onboarding complete for user:', userId);
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
      localStorage.setItem(`onboarding_completed_date_${userId}`, new Date().toISOString());
      console.log('✅ useOnboarding: Saved to localStorage - tour will NOT show again');
    } else {
      // Fallback to global key only if no userId
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_completed_date', new Date().toISOString());
    }
  };

  const resetOnboarding = async () => {
    // Only remove user-specific key if userId is provided
    if (userId) {
      localStorage.removeItem(`onboarding_completed_${userId}`);
      localStorage.removeItem(`onboarding_completed_date_${userId}`);
    } else {
      // Fallback to global key only if no userId
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('onboarding_completed_date');
    }
    setNeedsOnboarding(true);
  };

  return {
    needsOnboarding,
    isFirstLogin,
    markOnboardingComplete,
    resetOnboarding,
  };
}