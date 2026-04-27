import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Sparkles,
  DollarSign,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Calendar,
  BarChart3,
  Users,
  Package,
  Megaphone,
  Target,
  Activity,
  Zap,
  Award
} from 'lucide-react';
import { useBusiness } from './BusinessContext';
import { useNavigate } from 'react-router-dom';

interface CofounderActivity {
  tool: string;
  icon: React.ElementType;
  usage: number;
  lastUsed: Date | null;
  status: 'active' | 'moderate' | 'low' | 'unused';
  route: string;
  color: string;
}

export function CofounderValueDashboard() {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<CofounderActivity[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [activeTools, setActiveTools] = useState(0);

  useEffect(() => {
    if (!selectedBusiness?.id) return;

    // Analyze all Cofounder tool usage from session storage
    const tools: CofounderActivity[] = [
      {
        tool: 'Finance',
        icon: DollarSign,
        usage: 0,
        lastUsed: null,
        status: 'unused',
        route: '/operations?tab=finance',
        color: 'var(--success)'
      },
      {
        tool: 'HR',
        icon: Users,
        usage: 0,
        lastUsed: null,
        status: 'unused',
        route: '/operations?tab=hr',
        color: 'var(--primary)'
      },
      {
        tool: 'Marketing',
        icon: Megaphone,
        usage: 0,
        lastUsed: null,
        status: 'unused',
        route: '/operations?tab=marketing',
        color: '#ec4899'
      },
      {
        tool: 'Product',
        icon: Package,
        usage: 0,
        lastUsed: null,
        status: 'unused',
        route: '/operations?tab=product',
        color: '#f59e0b'
      },
      {
        tool: 'Sales',
        icon: BarChart3,
        usage: 0,
        lastUsed: null,
        status: 'unused',
        route: '/operations?tab=sales',
        color: '#8b5cf6'
      }
    ];

    let totalQuestions = 0;
    let activeCount = 0;

    // Check Finance (CPA Chat)
    const financeChat = sessionStorage.getItem(`cpa-chat-${selectedBusiness.id}`);
    if (financeChat) {
      try {
        const messages = JSON.parse(financeChat);
        const userMessages = messages.filter((m: any) => m.role === 'user');
        tools[0].usage = userMessages.length;
        tools[0].lastUsed = userMessages.length > 0 
          ? new Date(userMessages[userMessages.length - 1].timestamp)
          : null;
        tools[0].status = userMessages.length > 20 ? 'active' 
          : userMessages.length > 5 ? 'moderate' 
          : userMessages.length > 0 ? 'low' : 'unused';
        totalQuestions += userMessages.length;
        if (userMessages.length > 0) activeCount++;
      } catch (error) {
        console.error('Failed to load Finance chat:', error);
      }
    }

    // Check HR
    const hrChat = sessionStorage.getItem(`hr-chat-${selectedBusiness.id}`);
    if (hrChat) {
      try {
        const messages = JSON.parse(hrChat);
        const userMessages = messages.filter((m: any) => m.role === 'user');
        tools[1].usage = userMessages.length;
        tools[1].lastUsed = userMessages.length > 0 
          ? new Date(userMessages[userMessages.length - 1].timestamp)
          : null;
        tools[1].status = userMessages.length > 20 ? 'active' 
          : userMessages.length > 5 ? 'moderate' 
          : userMessages.length > 0 ? 'low' : 'unused';
        totalQuestions += userMessages.length;
        if (userMessages.length > 0) activeCount++;
      } catch (error) {
        console.error('Failed to load HR chat:', error);
      }
    }

    // Check Marketing
    const marketingChat = sessionStorage.getItem(`marketing-chat-${selectedBusiness.id}`);
    if (marketingChat) {
      try {
        const messages = JSON.parse(marketingChat);
        const userMessages = messages.filter((m: any) => m.role === 'user');
        tools[2].usage = userMessages.length;
        tools[2].lastUsed = userMessages.length > 0 
          ? new Date(userMessages[userMessages.length - 1].timestamp)
          : null;
        tools[2].status = userMessages.length > 20 ? 'active' 
          : userMessages.length > 5 ? 'moderate' 
          : userMessages.length > 0 ? 'low' : 'unused';
        totalQuestions += userMessages.length;
        if (userMessages.length > 0) activeCount++;
      } catch (error) {
        console.error('Failed to load Marketing chat:', error);
      }
    }

    // Check Product
    const productChat = sessionStorage.getItem(`product-chat-${selectedBusiness.id}`);
    if (productChat) {
      try {
        const messages = JSON.parse(productChat);
        const userMessages = messages.filter((m: any) => m.role === 'user');
        tools[3].usage = userMessages.length;
        tools[3].lastUsed = userMessages.length > 0 
          ? new Date(userMessages[userMessages.length - 1].timestamp)
          : null;
        tools[3].status = userMessages.length > 20 ? 'active' 
          : userMessages.length > 5 ? 'moderate' 
          : userMessages.length > 0 ? 'low' : 'unused';
        totalQuestions += userMessages.length;
        if (userMessages.length > 0) activeCount++;
      } catch (error) {
        console.error('Failed to load Product chat:', error);
      }
    }

    // Check Sales
    const salesChat = sessionStorage.getItem(`sales-chat-${selectedBusiness.id}`);
    if (salesChat) {
      try {
        const messages = JSON.parse(salesChat);
        const userMessages = messages.filter((m: any) => m.role === 'user');
        tools[4].usage = userMessages.length;
        tools[4].lastUsed = userMessages.length > 0 
          ? new Date(userMessages[userMessages.length - 1].timestamp)
          : null;
        tools[4].status = userMessages.length > 20 ? 'active' 
          : userMessages.length > 5 ? 'moderate' 
          : userMessages.length > 0 ? 'low' : 'unused';
        totalQuestions += userMessages.length;
        if (userMessages.length > 0) activeCount++;
      } catch (error) {
        console.error('Failed to load Sales chat:', error);
      }
    }

    setActivities(tools);
    setTotalQuestions(totalQuestions);
    setActiveTools(activeCount);
    
    // Calculate total savings (CPA Finance = $1,830/mo, each additional tool = $500/mo)
    const baseFinanceSavings = tools[0].usage > 0 ? 1830 : 0;
    const otherToolsSavings = (activeCount - (tools[0].usage > 0 ? 1 : 0)) * 500;
    setTotalSavings(baseFinanceSavings + otherToolsSavings);
  }, [selectedBusiness?.id]);

  const getRelativeTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'moderate': return 'var(--primary)';
      case 'low': return '#f59e0b';
      case 'unused': return 'var(--muted-foreground)';
      default: return 'var(--muted-foreground)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'moderate': return 'Moderate';
      case 'low': return 'Low Usage';
      case 'unused': return 'Unused';
      default: return 'Unused';
    }
  };

  const usagePercentage = Math.min((totalQuestions / 100) * 100, 100);

  return (
    <Card 
      style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <div 
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: 'var(--radius-full)',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <CardHeader style={{ padding: 'var(--spacing-5)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color: 'white' }} />
            </div>
            <div>
              <CardTitle>Cofounder Activity</CardTitle>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                Your tool usage and value insights
              </p>
            </div>
          </div>
          <Badge 
            style={{ 
              padding: 'var(--spacing-2) var(--spacing-3)',
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
              border: 'none'
            }}
          >
            {activeTools} of 5 active
          </Badge>
        </div>
      </CardHeader>

      <CardContent style={{ padding: '0 var(--spacing-5) var(--spacing-5)', position: 'relative', zIndex: 1 }}>
        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
          {/* Total Questions */}
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Total Interactions
              </p>
            </div>
            <h2 style={{ color: 'var(--primary)' }}>
              {totalQuestions}
            </h2>
            <Progress 
              value={usagePercentage} 
              style={{ marginTop: 'var(--spacing-2)', height: '4px' }}
            />
          </div>

          {/* Monthly Savings */}
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--success)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Est. Monthly Savings
              </p>
            </div>
            <h2 style={{ color: 'var(--success)' }}>
              ${totalSavings.toLocaleString()}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              vs. hiring consultants
            </p>
          </div>

          {/* Active Tools */}
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Tools Activated
              </p>
            </div>
            <h2 style={{ color: 'var(--primary)' }}>
              {activeTools}/5
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              {Math.round((activeTools / 5) * 100)}% suite usage
            </p>
          </div>
        </div>

        {/* Tool Activity Grid */}
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <Target className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <h3>Tool Activity Breakdown</h3>
          </div>

          <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={index}
                  onClick={() => navigate(activity.route)}
                  style={{ 
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: activity.status !== 'unused' ? 'var(--card)' : 'var(--muted)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = activity.status !== 'unused' ? 'var(--card)' : 'var(--muted)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flex: 1, minWidth: 0 }}>
                    <div 
                      style={{ 
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: `${activity.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: activity.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                          Cofounder {activity.tool}
                        </p>
                        <Badge 
                          variant="outline"
                          style={{ 
                            fontSize: '0.625rem',
                            padding: '2px 6px',
                            backgroundColor: `${getStatusColor(activity.status)}15`,
                            color: getStatusColor(activity.status),
                            border: 'none'
                          }}
                        >
                          {getStatusLabel(activity.status)}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-1)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {activity.usage} interaction{activity.usage !== 1 ? 's' : ''}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>•</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {getRelativeTime(activity.lastUsed)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        {activeTools < 5 && (
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--primary)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'flex-start' }}>
              <Zap className="w-5 h-5" style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', marginBottom: 'var(--spacing-2)' }}>
                  <strong>Unlock More Value:</strong> You have {5 - activeTools} unused Cofounder tool{5 - activeTools !== 1 ? 's' : ''}!
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  Each tool you activate adds an estimated $500/month in consulting value. Try them from the Operations tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Perfect Score Message */}
        {activeTools === 5 && totalQuestions > 50 && (
          <div 
            style={{ 
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid var(--success)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
              <Award className="w-6 h-6" style={{ color: 'var(--success)' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  <strong>🎉 Power User!</strong> You're using all Cofounder tools and maximizing your ROI!
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                  You're saving an estimated ${totalSavings.toLocaleString()}/month compared to traditional consultants.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}