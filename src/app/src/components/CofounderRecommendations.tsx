import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Sparkles,
  DollarSign,
  Users,
  Package,
  Megaphone,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  Star,
  Zap,
  CheckCircle2,
  Target,
  Clock,
  Award,
  BookOpen
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useNavigate } from 'react-router-dom';
import { CofounderQuickStart } from './CofounderQuickStart';

interface ToolRecommendation {
  toolId: string;
  name: string;
  icon: React.ElementType;
  route: string;
  color: string;
  priority: number;
  reason: string;
  quickWins: string[];
  estimatedValue: string;
  timeToValue: string;
  usageCount: number;
}

interface LearningPath {
  stage: number;
  title: string;
  description: string;
  tools: string[];
  completed: boolean;
}

export function CofounderRecommendations() {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<ToolRecommendation[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [totalUsage, setTotalUsage] = useState(0);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string>('');

  useEffect(() => {
    if (!selectedBusiness?.id) return;

    // Analyze current usage
    const tools = [
      { 
        id: 'finance', 
        name: 'Finance', 
        icon: DollarSign, 
        route: '/operations?tab=finance',
        color: 'var(--success)',
        storageKey: 'cpa-chat',
        value: '$1,830/mo',
        time: '5 min'
      },
      { 
        id: 'hr', 
        name: 'HR', 
        icon: Users, 
        route: '/operations?tab=hr',
        color: 'var(--primary)',
        storageKey: 'hr-chat',
        value: '$500/mo',
        time: '10 min'
      },
      { 
        id: 'marketing', 
        name: 'Marketing', 
        icon: Megaphone, 
        route: '/operations?tab=marketing',
        color: '#ec4899',
        storageKey: 'marketing-chat',
        value: '$500/mo',
        time: '10 min'
      },
      { 
        id: 'product', 
        name: 'Product', 
        icon: Package, 
        route: '/operations?tab=product',
        color: '#f59e0b',
        storageKey: 'product-chat',
        value: '$500/mo',
        time: '10 min'
      },
      { 
        id: 'sales', 
        name: 'Sales', 
        icon: BarChart3, 
        route: '/operations?tab=sales',
        color: '#8b5cf6',
        storageKey: 'sales-chat',
        value: '$500/mo',
        time: '10 min'
      }
    ];

    const usageData: { [key: string]: number } = {};
    let total = 0;

    // Collect usage data
    tools.forEach(tool => {
      const chatData = sessionStorage.getItem(`${tool.storageKey}-${selectedBusiness.id}`);
      let count = 0;
      
      if (chatData) {
        try {
          const messages = JSON.parse(chatData);
          const userMessages = messages.filter((m: any) => m.role === 'user');
          count = userMessages.length;
          total += count;
        } catch (error) {
          console.error(`Failed to load ${tool.name} usage:`, error);
        }
      }
      
      usageData[tool.id] = count;
    });

    setTotalUsage(total);

    // Generate intelligent recommendations
    const recs: ToolRecommendation[] = [];

    // Finance - Always top priority if unused (most value)
    if (usageData.finance === 0) {
      recs.push({
        toolId: 'finance',
        name: 'Cofounder Finance',
        icon: DollarSign,
        route: '/operations?tab=finance',
        color: 'var(--success)',
        priority: 1,
        reason: 'Highest value - Get expert CPA guidance worth $1,830/month',
        quickWins: [
          'Ask about tax deductions you might be missing',
          'Get help with quarterly tax planning',
          'Review your expense categorization'
        ],
        estimatedValue: '$1,830/mo',
        timeToValue: '5 minutes',
        usageCount: 0
      });
    }

    // HR - Recommend if Finance is used but HR isn't
    if (usageData.finance > 0 && usageData.hr === 0) {
      recs.push({
        toolId: 'hr',
        name: 'Cofounder HR',
        icon: Users,
        route: '/operations?tab=hr',
        color: 'var(--primary)',
        priority: 2,
        reason: 'You\'re using Finance - now optimize your team with HR guidance',
        quickWins: [
          'Create employee handbook templates',
          'Get hiring process recommendations',
          'Review compensation structures'
        ],
        estimatedValue: '$500/mo',
        timeToValue: '10 minutes',
        usageCount: 0
      });
    }

    // Sales - Recommend if no sales but using other tools
    if (usageData.sales === 0 && total > 5) {
      recs.push({
        toolId: 'sales',
        name: 'Cofounder Sales',
        icon: BarChart3,
        route: '/operations?tab=sales',
        color: '#8b5cf6',
        priority: 3,
        reason: 'Drive revenue growth with sales strategy guidance',
        quickWins: [
          'Build your sales funnel strategy',
          'Get pricing optimization advice',
          'Create sales scripts and templates'
        ],
        estimatedValue: '$500/mo',
        timeToValue: '10 minutes',
        usageCount: 0
      });
    }

    // Marketing - Recommend if using Sales but not Marketing
    if (usageData.sales > 0 && usageData.marketing === 0) {
      recs.push({
        toolId: 'marketing',
        name: 'Cofounder Marketing',
        icon: Megaphone,
        route: '/operations?tab=marketing',
        color: '#ec4899',
        priority: 4,
        reason: 'You\'re doing sales - supercharge it with marketing strategy',
        quickWins: [
          'Create content marketing plan',
          'Get social media strategy advice',
          'Review your brand messaging'
        ],
        estimatedValue: '$500/mo',
        timeToValue: '10 minutes',
        usageCount: 0
      });
    }

    // Product - Recommend if using multiple tools but not Product
    if (usageData.product === 0 && total > 10) {
      recs.push({
        toolId: 'product',
        name: 'Cofounder Product',
        icon: Package,
        route: '/operations?tab=product',
        color: '#f59e0b',
        priority: 5,
        reason: 'Optimize your offerings with product strategy guidance',
        quickWins: [
          'Define your product roadmap',
          'Get feature prioritization help',
          'Review pricing and packaging'
        ],
        estimatedValue: '$500/mo',
        timeToValue: '10 minutes',
        usageCount: 0
      });
    }

    // If all tools are used, recommend deepening usage on least-used tool
    const allUsed = Object.values(usageData).every(count => count > 0);
    if (allUsed) {
      const leastUsedTool = tools.reduce((min, tool) => 
        usageData[tool.id] < usageData[min.id] ? tool : min
      );
      
      recs.push({
        toolId: leastUsedTool.id,
        name: `Cofounder ${leastUsedTool.name}`,
        icon: leastUsedTool.icon,
        route: leastUsedTool.route,
        color: leastUsedTool.color,
        priority: 6,
        reason: `Level up your ${leastUsedTool.name} game - you've only scratched the surface`,
        quickWins: [
          'Ask more complex strategic questions',
          'Get advanced implementation guidance',
          'Review best practices for your industry'
        ],
        estimatedValue: leastUsedTool.value,
        timeToValue: leastUsedTool.time,
        usageCount: usageData[leastUsedTool.id]
      });
    }

    setRecommendations(recs.slice(0, 3)); // Top 3 recommendations

    // Build learning path
    const paths: LearningPath[] = [
      {
        stage: 1,
        title: 'Foundation',
        description: 'Get your financial house in order',
        tools: ['finance'],
        completed: usageData.finance > 0
      },
      {
        stage: 2,
        title: 'Team Building',
        description: 'Build and manage your team effectively',
        tools: ['hr'],
        completed: usageData.hr > 0
      },
      {
        stage: 3,
        title: 'Revenue Generation',
        description: 'Drive sales and revenue growth',
        tools: ['sales'],
        completed: usageData.sales > 0
      },
      {
        stage: 4,
        title: 'Market Presence',
        description: 'Build your brand and reach customers',
        tools: ['marketing'],
        completed: usageData.marketing > 0
      },
      {
        stage: 5,
        title: 'Product Excellence',
        description: 'Optimize and scale your offerings',
        tools: ['product'],
        completed: usageData.product > 0
      }
    ];

    setLearningPath(paths);

    // Calculate current stage
    const completedStages = paths.filter(p => p.completed).length;
    setCurrentStage(completedStages);
  }, [selectedBusiness?.id]);

  const pathProgress = (currentStage / 5) * 100;

  if (recommendations.length === 0 && currentStage === 5) {
    return null; // User has completed everything
  }

  return (
    <Card 
      style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <div 
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '250px',
          height: '250px',
          borderRadius: 'var(--radius-full)',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <CardHeader style={{ padding: 'var(--spacing-5)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lightbulb className="w-6 h-6" style={{ color: 'white' }} />
            </div>
            <div>
              <CardTitle>Recommended For You</CardTitle>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                Personalized suggestions to maximize your value
              </p>
            </div>
          </div>
          {currentStage < 5 && (
            <Badge 
              style={{ 
                padding: 'var(--spacing-2) var(--spacing-3)',
                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none'
              }}
            >
              Stage {currentStage + 1} of 5
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent style={{ padding: '0 var(--spacing-5) var(--spacing-5)', position: 'relative', zIndex: 1 }}>
        {/* Learning Path Progress */}
        {currentStage < 5 && (
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              marginBottom: 'var(--spacing-4)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <Target className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <h4 style={{ color: 'var(--foreground)' }}>Your Learning Path</h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>
                {currentStage}/5 Complete
              </p>
            </div>
            <Progress value={pathProgress} style={{ marginBottom: 'var(--spacing-3)', height: '8px' }} />
            
            {/* Current Stage Info */}
            {learningPath[currentStage] && (
              <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-start' }}>
                <div 
                  style={{ 
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-soft)',
                    flexShrink: 0
                  }}
                >
                  <Star className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                    <strong>Next: {learningPath[currentStage].title}</strong>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                    {learningPath[currentStage].description}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Recommendations */}
        {recommendations.length > 0 ? (
          <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <div 
                  key={index}
                  style={{ 
                    padding: 'var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--card)',
                    border: `2px solid ${index === 0 ? rec.color : 'var(--border)'}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Priority badge */}
                  {index === 0 && (
                    <div 
                      style={{ 
                        position: 'absolute',
                        top: 'var(--spacing-3)',
                        right: 'var(--spacing-3)',
                      }}
                    >
                      <Badge 
                        style={{ 
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          fontSize: '0.625rem',
                          backgroundColor: `${rec.color}20`,
                          color: rec.color,
                          border: 'none'
                        }}
                      >
                        Top Pick
                      </Badge>
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                    <div 
                      style={{ 
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: `${rec.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: rec.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 'var(--spacing-8)' }}>
                      <h4 style={{ color: 'var(--foreground)', marginBottom: 'var(--spacing-1)' }}>
                        {rec.name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {rec.reason}
                      </p>
                    </div>
                  </div>

                  {/* Quick Wins */}
                  <div style={{ marginBottom: 'var(--spacing-3)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-2)' }}>
                      Quick wins to try:
                    </p>
                    <div style={{ display: 'grid', gap: 'var(--spacing-1)' }}>
                      {rec.quickWins.map((win, i) => (
                        <div key={i} style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-start' }}>
                          <CheckCircle2 className="w-3 h-3" style={{ color: rec.color, marginTop: '2px', flexShrink: 0 }} />
                          <p style={{ fontSize: '0.75rem', color: 'var(--foreground)' }}>
                            {win}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Value & CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                        <TrendingUp className="w-3 h-3" style={{ color: 'var(--success)' }} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--foreground)' }}>
                          <strong>{rec.estimatedValue}</strong> value
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                        <Clock className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {rec.timeToValue} to value
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <Button
                        onClick={() => {
                          setSelectedToolId(rec.toolId);
                          setQuickStartOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                        style={{
                          border: `1px solid ${rec.color}`,
                          color: rec.color,
                          backgroundColor: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-1)'
                        }}
                      >
                        <BookOpen className="w-3 h-3" />
                        Guide
                      </Button>
                      <Button
                        onClick={() => navigate(rec.route)}
                        size="sm"
                        style={{
                          backgroundColor: rec.color,
                          color: 'white',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-2)'
                        }}
                      >
                        Try Now
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : currentStage === 5 ? (
          // Mastery achieved
          <div 
            style={{ 
              padding: 'var(--spacing-5)',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '2px solid var(--success)',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div 
                style={{ 
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--success) 0%, var(--primary) 100%)',
                }}
              >
                <Award className="w-8 h-8" style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{ color: 'var(--foreground)', marginBottom: 'var(--spacing-2)' }}>
                  🎉 Mastery Achieved!
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  You've activated all 5 Cofounder tools and completed your learning path.
                  Keep using the tools to maintain your competitive edge!
                </p>
              </div>
              <Badge 
                style={{ 
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  background: 'linear-gradient(135deg, var(--success) 0%, var(--primary) 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.875rem'
                }}
              >
                Saving $3,830/month
              </Badge>
            </div>
          </div>
        ) : null}

        {/* All Stages Overview */}
        {currentStage < 5 && currentStage > 0 && (
          <div style={{ marginTop: 'var(--spacing-4)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-2)' }}>
              Your Progress:
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              {learningPath.map((path, index) => (
                <div 
                  key={index}
                  style={{ 
                    flex: 1,
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: path.completed ? 'var(--success-soft)' : 'rgba(255, 255, 255, 0.5)',
                    border: `1px solid ${path.completed ? 'var(--success)' : 'var(--border)'}`,
                    textAlign: 'center'
                  }}
                >
                  {path.completed ? (
                    <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color: 'var(--success)' }} />
                  ) : (
                    <div 
                      style={{ 
                        width: '16px',
                        height: '16px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: index === currentStage ? 'var(--primary)' : 'var(--muted)',
                        margin: '0 auto'
                      }}
                    />
                  )}
                  <p style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                    {path.stage}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Quick Start Dialog */}
      <CofounderQuickStart 
        isOpen={quickStartOpen}
        onClose={() => setQuickStartOpen(false)}
        toolId={selectedToolId}
      />
    </Card>
  );
}