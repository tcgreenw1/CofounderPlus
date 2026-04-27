import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Building2, 
  User, 
  Target,
  Sparkles,
  CreditCard,
  Users,
  FileText,
  Rocket,
  TrendingUp,
  Map,
  Cable,
  StickyNote,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  actionLabel: string;
  actionPath: string;
  order: number;
}

interface GettingStartedChecklistProps {
  user: any;
  selectedBusiness: any;
  hasNumberOneGoal: boolean;
}

export const GettingStartedChecklist: React.FC<GettingStartedChecklistProps> = ({ 
  user, 
  selectedBusiness,
  hasNumberOneGoal 
}) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'business',
      title: 'Create Your First Business',
      description: 'Set up your business to start managing operations and finances',
      icon: Building2,
      completed: false,
      actionLabel: 'Create Business',
      actionPath: '/business-management',
      order: 1
    },
    {
      id: 'goal',
      title: 'Set Your #1 Goal',
      description: 'Define your most important goal to stay focused and motivated',
      icon: Target,
      completed: false,
      actionLabel: 'Set Goal',
      actionPath: '/dream-board',
      order: 2
    },
    {
      id: 'roadmap',
      title: 'Start Your Roadmap',
      description: 'Begin feeding your Cofounder information so it can start building your business and laying the bricks to success',
      icon: Map,
      completed: false,
      actionLabel: 'Start Roadmap',
      actionPath: '/roadmap',
      order: 3
    },
    {
      id: 'finance',
      title: 'Add Your First Transaction',
      description: 'Start tracking your revenue and expenses to monitor cash flow',
      icon: TrendingUp,
      completed: false,
      actionLabel: 'Add Transaction',
      actionPath: '/operations/finance',
      order: 4
    },
    {
      id: 'integration',
      title: 'Connect Your First API Integration',
      description: 'Start merging all of your business tools into one',
      icon: Cable,
      completed: false,
      actionLabel: 'View Integrations',
      actionPath: '/integrations',
      order: 5
    },
    {
      id: 'note',
      title: 'Jot Your First Note',
      description: 'Simplify life with drag-and-drop notes, lists and boards meant for founders',
      icon: StickyNote,
      completed: false,
      actionLabel: 'Create Note',
      actionPath: '/notes',
      order: 6
    },
    {
      id: 'subscription',
      title: 'Upgrade Your Plan',
      description: 'Unlock advanced features and more AI tasks',
      icon: CreditCard,
      completed: false,
      actionLabel: 'View Plans',
      actionPath: '/settings?tab=plan',
      order: 7
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState<number>(0);

  useEffect(() => {
    loadChecklistState();
  }, [user?.id, selectedBusiness?.id]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reload checklist when window gains focus (user comes back to dashboard)
  useEffect(() => {
    const handleFocus = () => {
      console.log('📋 Window focused, reloading checklist...');
      loadChecklistState();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  // Also reload every 30 seconds to catch changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadChecklistState();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const loadChecklistState = async (showRefreshingIndicator = false) => {
    if (!user?.id) return;

    try {
      // Only show loading on first load to prevent flickering
      if (!hasLoadedOnce) {
        setIsLoading(true);
      }
      
      if (showRefreshingIndicator) {
        setIsRefreshing(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('📋 No session available for checklist');
        setIsLoading(false);
        setHasLoadedOnce(true);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/checklist/status`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      
      if (response.ok) {
        const status = await response.json();
        
        console.log('📋 Checklist status loaded:', status);
        
        // Update checklist items based on server status (backend auto-detects completion)
        setChecklistItems(prevItems => prevItems.map(item => {
          let completed = false;
          switch(item.id) {
            case 'business': completed = status.business; break;
            case 'goal': completed = status.goal; break;
            case 'roadmap': completed = status.roadmap; break;
            case 'finance': completed = status.finance; break;
            case 'integration': completed = status.integration; break;
            case 'note': completed = status.note; break;
            case 'subscription': completed = status.subscription; break;
          }
          return { ...item, completed };
        }));
      } else {
        // If response fails (e.g. server not ready), we keep default items
        console.log('📋 Checklist status fetch returned non-OK status:', response.status);
      }
      
      setIsLoading(false);
      setHasLoadedOnce(true);
      setIsRefreshing(false);
    } catch (error) {
      // Silently fail and show default checklist state
      console.log('📋 Checklist status unavailable, showing default state');
      // Ensure we stop loading even on error
      setIsLoading(false);
      setHasLoadedOnce(true);
      setIsRefreshing(false);
    }
  };

  const handleRefreshChecklist = async () => {
    console.log('🔄 Manually refreshing checklist and clearing manual overrides...');
    setIsRefreshing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Clear manual overrides so backend can auto-detect everything fresh
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/checklist/reset`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );
        console.log('✅ Manual overrides cleared, reloading checklist...');
      }
    } catch (error) {
      console.error('Error clearing manual overrides:', error);
    }
    
    // Now reload the checklist status (will use auto-detection since overrides are cleared)
    await loadChecklistState(true);
  };

  const handleAction = (path: string) => {
    navigate(path);
  };

  const handleToggleComplete = async (taskId: string) => {
    // Optimistically update the UI
    setChecklistItems(prevItems => 
      prevItems.map(item => 
        item.id === taskId ? { ...item, completed: !item.completed } : item
      )
    );

    // Save to backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/checklist/toggle`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ taskId })
          }
        );

        if (!response.ok) {
          console.error('Failed to save checklist task status');
          // Revert on error
          setChecklistItems(prevItems => 
            prevItems.map(item => 
              item.id === taskId ? { ...item, completed: !item.completed } : item
            )
          );
        } else {
          console.log(`✅ Task ${taskId} toggled successfully`);
        }
      }
    } catch (error) {
      console.error('Error toggling checklist task:', error);
      // Revert on error
      setChecklistItems(prevItems => 
        prevItems.map(item => 
          item.id === taskId ? { ...item, completed: !item.completed } : item
        )
      );
    }
  };

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isFullyComplete = completedCount === totalCount;

  // IMPORTANT: Only hide on initial load to prevent checklist popping up during initial page load
  // After first load, keep showing the component even during refreshes to prevent flickering
  if (isLoading && !hasLoadedOnce) return null;

  // If loading, show a skeleton or just render with default items (which are all false)
  // We'll just render normally as we have initialized default items

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="col-span-full"
    >
      <Card 
        className="liquid-glass-card border-2"
        style={{
          borderColor: 'var(--color-info)',
          boxShadow: '0 4px 24px rgba(0, 224, 255, 0.15)',
        }}
      >
        <CardHeader className={isMobile ? "pb-2 px-3 pt-3" : "pb-3"}>
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <motion.div 
                className={isMobile ? "p-2 rounded-lg flex-shrink-0" : "p-3 rounded-xl flex-shrink-0"}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.2), rgba(150, 235, 255, 0.15))',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0, 224, 255, 0.3)',
                  boxShadow: '0 2px 8px rgba(0, 224, 255, 0.15)',
                }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Rocket className={isMobile ? "w-4 h-4" : "w-6 h-6"} style={{ color: 'var(--color-info)' }} />
              </motion.div>
              <div className="min-w-0 flex-1">
                <CardTitle className={`flex items-center gap-1.5 sm:gap-2 ${isMobile ? "text-base" : ""}`}>
                  <span>Getting Started</span>
                  <Badge 
                    variant="secondary"
                    className={isMobile ? "text-xs px-1.5 py-0.5" : ""}
                    style={{
                      background: 'rgba(0, 224, 255, 0.15)',
                      color: 'var(--color-info)',
                      border: '1px solid rgba(0, 224, 255, 0.3)',
                    }}
                  >
                    {completedCount}/{totalCount}
                  </Badge>
                </CardTitle>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">
                    Complete these steps to get the most out of Cofounder
                  </p>
                )}
              </div>
            </div>
            
            {/* Refresh Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleRefreshChecklist}
                      disabled={isRefreshing}
                      variant="outline"
                      size="sm"
                      className={`flex-shrink-0 ${isMobile ? 'px-2 min-w-[2rem]' : 'gap-2'}`}
                      style={{
                        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.08), rgba(150, 235, 255, 0.05))',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(0, 224, 255, 0.3)',
                        padding: isMobile ? 'var(--spacing-1) var(--spacing-2)' : undefined
                      }}
                    >
                      <RefreshCw 
                        className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${isRefreshing ? 'animate-spin' : ''}`}
                        style={{ color: 'var(--color-info)' }}
                      />
                      {!isMobile && <span>Refresh</span>}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Scan for completed tasks & update checklist</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Progress Bar */}
          <div className={isMobile ? "mt-2 space-y-1.5" : "mt-4 space-y-2"}>
            <div className={`flex items-center justify-between ${isMobile ? "text-xs" : "text-sm"}`}>
              <span className="text-muted-foreground">Your progress</span>
              <span style={{ 
                color: 'var(--color-info)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className={isMobile ? "h-1.5" : "h-2"}
              style={{
                backgroundColor: 'rgba(0, 224, 255, 0.1)',
              }}
            />
          </div>
        </CardHeader>

        <CardContent className={isMobile ? "px-3 pb-3 pt-2" : ""}>
          <div className={`grid grid-cols-1 ${isMobile ? "gap-2" : "md:grid-cols-2 lg:grid-cols-3 gap-3"}`}>
            {checklistItems
              .sort((a, b) => a.order - b.order)
              .map((item, index) => {
                const IconComponent = item.icon;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div
                      className={`
                        ${isMobile ? 'p-3' : 'p-4'} rounded-xl border transition-all duration-200
                        ${item.completed 
                          ? 'liquid-glass-success border-[var(--color-success)]' 
                          : 'liquid-glass-nav border-border hover:border-[var(--color-info)]'
                        }
                      `}
                      style={{
                        boxShadow: item.completed 
                          ? '0 2px 8px rgba(108, 255, 108, 0.15)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      {/* Header with Icon and Status */}
                      <div className={`flex items-start ${isMobile ? 'gap-2 mb-2' : 'gap-3 mb-3'}`}>
                        <div 
                          className={isMobile ? "p-1.5 rounded-lg flex-shrink-0" : "p-2 rounded-lg flex-shrink-0"}
                          style={{
                            background: item.completed
                              ? 'linear-gradient(135deg, rgba(108, 255, 108, 0.2), rgba(200, 255, 200, 0.15))'
                              : 'linear-gradient(135deg, rgba(0, 224, 255, 0.15), rgba(150, 235, 255, 0.1))',
                            border: item.completed
                              ? '1px solid rgba(108, 255, 108, 0.3)'
                              : '1px solid rgba(0, 224, 255, 0.2)',
                          }}
                        >
                          <IconComponent 
                            className={isMobile ? "w-4 h-4" : "w-5 h-5"} 
                            style={{ 
                              color: item.completed 
                                ? 'var(--color-success)' 
                                : 'var(--color-info)' 
                            }} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-center ${isMobile ? 'gap-1.5 mb-0.5' : 'gap-2 mb-1'}`}>
                            <h4 className={`truncate ${isMobile ? 'text-sm' : 'text-sm'}`} style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                              {item.title}
                            </h4>
                            <motion.button
                              onClick={() => handleToggleComplete(item.id)}
                              className="flex-shrink-0 p-0.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              title={item.completed ? "Mark as incomplete" : "Mark as complete"}
                              style={{
                                background: item.completed 
                                  ? 'linear-gradient(135deg, rgba(108, 255, 108, 0.2), rgba(200, 255, 200, 0.15))'
                                  : 'linear-gradient(135deg, rgba(0, 224, 255, 0.1), rgba(150, 235, 255, 0.05))',
                                border: item.completed
                                  ? '1px solid rgba(108, 255, 108, 0.4)'
                                  : '1px solid rgba(0, 224, 255, 0.3)',
                              }}
                            >
                              {item.completed ? (
                                <CheckCircle2 
                                  className="w-4 h-4" 
                                  style={{ color: 'var(--color-success)' }}
                                />
                              ) : (
                                <Circle 
                                  className="w-4 h-4" 
                                  style={{ color: 'var(--color-info)' }}
                                />
                              )}
                            </motion.button>
                          </div>
                          {!isMobile && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      {!item.completed && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={() => handleAction(item.actionPath)}
                            variant="outline"
                            size={isMobile ? "sm" : "default"}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bouncy-button"
                            style={{
                              background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.08), rgba(108, 255, 108, 0.05))',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(0, 224, 255, 0.2)',
                              padding: isMobile ? 'var(--spacing-1) var(--spacing-2)' : undefined
                            }}
                          >
                            <span className="text-xs">{item.actionLabel}</span>
                            <ChevronRight className={isMobile ? "w-3 h-3" : "w-3.5 h-3.5"} />
                          </Button>
                        </motion.div>
                      )}

                      {/* Completed Badge */}
                      {item.completed && (
                        <div 
                          className="text-xs font-semibold text-center py-2 px-3 rounded-lg"
                          style={{
                            background: 'rgba(108, 255, 108, 0.1)',
                            color: 'var(--color-success)',
                          }}
                        >
                          ✓ Completed
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </div>
          
          {/* Completion Message - Show when all tasks are done */}
          {isFullyComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={isMobile ? "mt-2 p-3 rounded-xl" : "mt-4 p-4 rounded-xl"}
              style={{
                background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.15), rgba(200, 255, 200, 0.1))',
                border: '1px solid rgba(108, 255, 108, 0.3)',
                boxShadow: '0 2px 12px rgba(108, 255, 108, 0.2)',
              }}
            >
              <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
                <div
                  className={isMobile ? "p-1.5 rounded-lg flex-shrink-0" : "p-2 rounded-lg flex-shrink-0"}
                  style={{
                    background: 'rgba(108, 255, 108, 0.2)',
                    border: '1px solid rgba(108, 255, 108, 0.4)',
                  }}
                >
                  <CheckCircle2 className={isMobile ? "w-4 h-4" : "w-5 h-5"} style={{ color: 'var(--color-success)' }} />
                </div>
                <div className="flex-1">
                  <h4 className={`${isMobile ? 'text-sm mb-0.5' : 'text-sm mb-1'}`} style={{ 
                    color: 'var(--color-success)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    🎉 All Tasks Completed!
                  </h4>
                  <p className={`text-xs text-muted-foreground leading-relaxed ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                    {isMobile ? "You can customize your dashboard to remove this." : "Great job! You've completed all the getting started tasks. You can customize your dashboard to remove this checklist if you'd like."}
                  </p>
                  <Button
                    onClick={() => navigate('/settings?tab=dashboard')}
                    variant="outline"
                    size="sm"
                    className={`gap-2 text-xs bouncy-button ${isMobile ? 'w-full' : ''}`}
                    style={{
                      background: 'rgba(108, 255, 108, 0.1)',
                      borderColor: 'rgba(108, 255, 108, 0.3)',
                      color: 'var(--color-success)',
                      padding: isMobile ? 'var(--spacing-1) var(--spacing-2)' : undefined
                    }}
                  >
                    <Target className="w-3 h-3" />
                    Customize Dashboard
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};