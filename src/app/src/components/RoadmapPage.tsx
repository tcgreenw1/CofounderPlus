/**
 * AI-POWERED ROADMAP PAGE
 * Users say "build my roadmap" and AI generates actual tasks with Cofounder quick actions
 * Uses design system CSS variables for consistent theming
 */

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Rocket, 
  Send, 
  Sparkles, 
  CheckCircle2,
  Circle,
  TrendingUp,
  Users,
  Scale,
  DollarSign,
  Briefcase,
  Gavel,
  ShoppingCart,
  Code,
  Megaphone,
  Loader2,
  ArrowRight,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from '../contexts/BusinessContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getSupabaseClient } from '../utils/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCredits } from '../hooks/useCredits';
import { useIsMobile } from './ui/use-mobile';
import { isIOS } from '../utils/platformDetection';

interface RoadmapPageProps {
  user: any;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  cofounderAction?: 'hr' | 'marketing' | 'sales' | null;
  completed?: boolean;
}

interface Department {
  id: string;
  name: string;
  icon: string;
  color: string;
  tasks: Task[];
}

interface Roadmap {
  detectedStage: 'foundation' | 'mvp' | 'growth' | 'scale';
  stageReasoning: string;
  departments: Department[];
}

const DEPARTMENT_ICONS: Record<string, any> = {
  target: Target,
  gavel: Gavel,
  'dollar-sign': DollarSign,
  megaphone: Megaphone,
  'shopping-cart': ShoppingCart,
  code: Code,
  users: Users,
  briefcase: Briefcase,
};

const STAGE_CONFIG = {
  foundation: {
    label: 'Foundation',
    color: '#4B00FF',
    gradient: 'linear-gradient(135deg, #4B00FF, #7C3AED)',
    description: 'Setting up the basics',
  },
  mvp: {
    label: 'MVP',
    color: '#FF6B00',
    gradient: 'linear-gradient(135deg, #FF6B00, #FF8C42)',
    description: 'Building & validating',
  },
  growth: {
    label: 'Growth',
    color: '#00D4AA',
    gradient: 'linear-gradient(135deg, #00D4AA, #00B894)',
    description: 'Scaling operations',
  },
  scale: {
    label: 'Scale',
    color: '#2B7FFF',
    gradient: 'linear-gradient(135deg, #2B7FFF, #60A5FA)',
    description: 'Optimizing & expanding',
  },
};

const RoadmapPage: React.FC<RoadmapPageProps> = ({ user }) => {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showInitialPrompt, setShowInitialPrompt] = useState(true);
  const { credits, deductCredits } = useCredits();

  // Track active polling intervals to prevent multiple simultaneous refreshes
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Helper to get auth token
  const getAuthToken = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  };

  // Load existing roadmap on mount
  useEffect(() => {
    if (selectedBusiness?.id) {
      loadExistingRoadmap();
    }
  }, [selectedBusiness?.id]);

  // Cleanup polling intervals on component unmount
  useEffect(() => {
    return () => {
      // Clear any active polling when component unmounts
      if (pollingIntervalRef.current) {
        console.log('🧹 Cleaning up polling interval on unmount');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current) {
        console.log('🧹 Cleaning up polling timeout on unmount');
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, []);

  const loadExistingRoadmap = async () => {
    if (!selectedBusiness?.id) return;

    try {
      const authToken = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/current?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.roadmap) {
          setRoadmap(data.roadmap);
          setShowInitialPrompt(false);
        }
      }
    } catch (error) {
      console.error('Error loading roadmap:', error);
    }
  };

  const generateRoadmap = async () => {
    if (!selectedBusiness?.id) {
      toast.error('Please select a business first');
      return;
    }

    if (credits < 1) {
      toast.error('You do not have enough credits to generate a roadmap. Please purchase more credits.');
      return;
    }

    setIsGenerating(true);
    setShowInitialPrompt(false);

    try {
      console.log('🤖 Requesting AI roadmap generation...');
      const authToken = await getAuthToken();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/ai-generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            businessData: selectedBusiness,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate roadmap');
      }

      const data = await response.json();
      console.log('✅ Roadmap generated:', data);

      setRoadmap(data.roadmap);
      toast.success('Roadmap generated! Ready to execute.');
      deductCredits(1);

    } catch (error: any) {
      console.error('❌ Roadmap generation error:', error);
      toast.error(error.message || 'Failed to generate roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCofounderAction = (department: string, task: Task) => {
    const routes: Record<string, string> = {
      hr: '/operations/hr',
      marketing: '/operations/marketing',
      sales: '/operations/sales',
    };

    const route = routes[department];
    if (route) {
      // Navigate with task context
      navigate(route, { state: { taskContext: task } });
      toast.success(`Opening ${department.toUpperCase()} Cofounder...`);
    }
  };

  const toggleTaskComplete = (departmentId: string, taskId: string) => {
    if (!roadmap) return;

    setRoadmap({
      ...roadmap,
      departments: roadmap.departments.map(dept => {
        if (dept.id === departmentId) {
          return {
            ...dept,
            tasks: dept.tasks.map(task => {
              if (task.id === taskId) {
                return { ...task, completed: !task.completed };
              }
              return task;
            }),
          };
        }
        return dept;
      }),
    });
  };

  const handleIntelligentRefresh = async () => {
    if (!selectedBusiness?.id || !roadmap) {
      toast.error('No roadmap to refresh');
      return;
    }

    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      console.log('⚠️ Refresh already in progress, ignoring duplicate request');
      toast.info('Roadmap refresh already in progress');
      return;
    }

    // Check if there's already an active polling interval
    if (pollingIntervalRef.current) {
      console.log('⚠️ Active polling detected, clearing before starting new refresh');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (pollingTimeoutRef.current) {
      console.log('⚠️ Active timeout detected, clearing before starting new refresh');
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    if (credits < 1) {
      toast.error('You do not have enough credits. Please purchase more credits.');
      return;
    }

    setIsRefreshing(true);

    try {
      console.log('🔄 Requesting intelligent roadmap refresh...');
      const authToken = await getAuthToken();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/intelligent-refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            businessData: selectedBusiness,
            currentRoadmap: roadmap,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh roadmap');
      }

      const data = await response.json();
      console.log('✅ Roadmap refresh started:', data);

      // Show success toast - processing in background
      toast.success('Roadmap refresh started! Check notifications for updates.');
      
      deductCredits(1);

      // Reload roadmap every 3 seconds until we see changes
      const checkForUpdates = setInterval(async () => {
        try {
          const authToken = await getAuthToken();
          const checkResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/current?businessId=${selectedBusiness.id}`,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );

          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.roadmap && checkData.roadmap.lastRefreshed !== roadmap.lastRefreshed) {
              // New roadmap available!
              setRoadmap(checkData.roadmap);
              clearInterval(checkForUpdates);
              setIsRefreshing(false);
              console.log('✅ Roadmap updated in background');
              toast.success('Roadmap updated successfully!');
            }
          }
        } catch (error) {
          console.error('Error checking for roadmap updates:', error);
        }
      }, 3000);

      // Store the interval reference
      pollingIntervalRef.current = checkForUpdates;

      // Stop checking after 60 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkForUpdates);
        setIsRefreshing(false);
        console.log('⏱️ Polling timeout reached');
      }, 60000);

      // Store the timeout reference
      pollingTimeoutRef.current = timeout;

    } catch (error: any) {
      console.error('❌ Roadmap refresh error:', error);
      toast.error(error.message || 'Failed to start roadmap refresh');
      setIsRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF375F';
      case 'medium': return '#FFD60A';
      case 'low': return '#00DC82';
      default: return '#999999';
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'var(--background)',
        padding: 'var(--spacing-6)',
        paddingBottom: isMobile && isIOSApp ? 'max(env(safe-area-inset-bottom, 0px) + 120px, 120px)' : 'var(--spacing-6)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div 
          className="mb-8"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--spacing-4)',
          }}
        >
          <div>
            <h1 
              style={{
                marginBottom: 'var(--spacing-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
              }}
            >
              <Rocket 
                className="w-8 h-8" 
                style={{ color: '#4B00FF' }} 
              />
              Roadmap
            </h1>
            <p style={{ color: 'var(--muted-foreground)' }}>
              AI-generated roadmap for {selectedBusiness?.name || 'your business'}
            </p>
          </div>

          {roadmap && (
            <Badge 
              variant="outline"
              style={{
                background: STAGE_CONFIG[roadmap.detectedStage].gradient,
                color: '#ffffff',
                border: 'none',
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {STAGE_CONFIG[roadmap.detectedStage].label} Stage
            </Badge>
          )}
        </div>

        {/* Initial Prompt or Generate Button */}
        {showInitialPrompt && !roadmap && (
          <Card 
            style={{
              marginBottom: 'var(--spacing-6)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}
          >
            <CardContent 
              style={{
                padding: 'var(--spacing-8)',
                textAlign: 'center',
              }}
            >
              <div 
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto var(--spacing-6)',
                  borderRadius: 'var(--radius-2xl)',
                  background: 'linear-gradient(135deg, #4B00FF20, #7C3AED10)',
                  border: '2px solid #4B00FF30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles className="w-10 h-10" style={{ color: '#4B00FF' }} />
              </div>

              <h2 style={{ marginBottom: 'var(--spacing-3)' }}>
                Ready to Build Your Roadmap?
              </h2>
              
              <p 
                style={{ 
                  color: 'var(--muted-foreground)',
                  marginBottom: 'var(--spacing-6)',
                  maxWidth: '600px',
                  margin: '0 auto var(--spacing-6)',
                }}
              >
                I'll analyze your business and create a complete roadmap with actionable tasks 
                across all departments. I'll even tell you which tasks your Cofounder AI's can help with!
              </p>

              <Button
                onClick={generateRoadmap}
                disabled={isGenerating}
                size="lg"
                style={{
                  background: 'linear-gradient(135deg, #4B00FF, #7C3AED)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-4) var(--spacing-8)',
                  border: 'none',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing & Building...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate My Roadmap
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card 
            style={{
              marginBottom: 'var(--spacing-6)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}
          >
            <CardContent 
              style={{
                padding: 'var(--spacing-8)',
                textAlign: 'center',
              }}
            >
              <Loader2 
                className="w-12 h-12 animate-spin mx-auto mb-4" 
                style={{ color: '#4B00FF' }} 
              />
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>
                Building Your Roadmap...
              </h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Analyzing business stage, creating department tasks, and mapping Cofounder capabilities
              </p>
            </CardContent>
          </Card>
        )}

        {/* Roadmap Display */}
        {roadmap && !isGenerating && (
          <>
            {/* Stage Info */}
            <Card 
              style={{
                marginBottom: 'var(--spacing-6)',
                borderRadius: 'var(--radius-2xl)',
                border: '2px solid',
                borderColor: STAGE_CONFIG[roadmap.detectedStage].color + '40',
                background: `linear-gradient(135deg, ${STAGE_CONFIG[roadmap.detectedStage].color}10, ${STAGE_CONFIG[roadmap.detectedStage].color}05)`,
              }}
            >
              <CardContent style={{ padding: 'var(--spacing-6)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-4)' }}>
                  <div 
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 'var(--radius-xl)',
                      background: STAGE_CONFIG[roadmap.detectedStage].gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Target className="w-7 h-7" style={{ color: '#ffffff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: 'var(--spacing-2)' }}>
                      You're in the {STAGE_CONFIG[roadmap.detectedStage].label} Stage
                    </h3>
                    <p style={{ color: 'var(--muted-foreground)' }}>
                      {roadmap.stageReasoning}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Tasks */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: 'var(--spacing-6)',
              }}
            >
              {roadmap.departments.map((department) => {
                const IconComponent = DEPARTMENT_ICONS[department.icon] || Briefcase;
                const completedTasks = department.tasks.filter(t => t.completed).length;
                const totalTasks = department.tasks.length;

                return (
                  <Card 
                    key={department.id}
                    style={{
                      borderRadius: 'var(--radius-2xl)',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                    }}
                  >
                    <CardHeader style={{ padding: 'var(--spacing-6)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div 
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: `${department.color}20`,
                            border: `1px solid ${department.color}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: department.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <CardTitle>{department.name}</CardTitle>
                          <CardDescription>
                            {completedTasks}/{totalTasks} tasks completed
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent 
                      style={{ 
                        padding: '0 var(--spacing-6) var(--spacing-6)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                        {department.tasks.map((task) => (
                          <div
                            key={task.id}
                            style={{
                              padding: 'var(--spacing-4)',
                              borderRadius: 'var(--radius-lg)',
                              border: '1px solid var(--border)',
                              background: task.completed ? 'var(--success-soft)' : 'var(--background)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                              <button
                                onClick={() => toggleTaskComplete(department.id, task.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  marginTop: '2px',
                                }}
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
                                ) : (
                                  <Circle className="w-5 h-5" style={{ color: 'var(--muted-foreground)' }} />
                                )}
                              </button>

                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                                  <h4 
                                    style={{ 
                                      textDecoration: task.completed ? 'line-through' : 'none',
                                      color: task.completed ? 'var(--muted-foreground)' : 'var(--foreground)',
                                    }}
                                  >
                                    {task.title}
                                  </h4>
                                </div>

                                <p 
                                  className="text-sm"
                                  style={{ 
                                    color: 'var(--muted-foreground)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  {task.description}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                                  <Badge 
                                    variant="outline"
                                    style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      background: `${getPriorityColor(task.priority)}20`,
                                      borderColor: `${getPriorityColor(task.priority)}40`,
                                      color: getPriorityColor(task.priority),
                                    }}
                                  >
                                    {task.priority}
                                  </Badge>

                                  <Badge 
                                    variant="outline"
                                    style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderColor: 'var(--border)',
                                      color: 'var(--muted-foreground)',
                                    }}
                                  >
                                    {task.timeline}
                                  </Badge>

                                  {task.cofounderAction && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCofounderAction(task.cofounderAction!, task)}
                                      style={{
                                        height: '24px',
                                        padding: '0 var(--spacing-2)',
                                        fontSize: '11px',
                                        background: 'linear-gradient(135deg, #4B00FF20, #7C3AED10)',
                                        border: '1px solid #4B00FF40',
                                        color: '#4B00FF',
                                      }}
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Ask {task.cofounderAction.toUpperCase()} Cofounder
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Regenerate Button */}
            <div 
              style={{
                marginTop: 'var(--spacing-8)',
                textAlign: 'center',
                display: 'flex',
                gap: 'var(--spacing-3)',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <Button
                onClick={handleIntelligentRefresh}
                disabled={isRefreshing}
                style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-3) var(--spacing-6)',
                  background: 'linear-gradient(135deg, #4B00FF, #7C3AED)',
                  border: 'none',
                  color: '#ffffff'
                }}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Progress...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Intelligent Refresh
                  </>
                )}
              </Button>
              <Button
                onClick={generateRoadmap}
                disabled={isGenerating}
                variant="outline"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--spacing-3) var(--spacing-6)',
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate from Scratch
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;