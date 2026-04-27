import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Activity,
  TrendingUp,
  MessageSquare,
  Zap,
  Clock
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

export function CPAServicesUsageTracker() {
  const { selectedBusiness } = useBusiness();
  const [usageStats, setUsageStats] = useState({
    totalQuestions: 0,
    quickActionsUsed: 0,
    lastUsed: null as Date | null,
    topCategories: [] as { category: string; count: number }[]
  });

  useEffect(() => {
    if (!selectedBusiness?.id) return;

    // Load usage data from sessionStorage
    const chatHistory = sessionStorage.getItem(`cpa-chat-${selectedBusiness.id}`);
    
    if (chatHistory) {
      try {
        const messages = JSON.parse(chatHistory);
        const userMessages = messages.filter((m: any) => m.role === 'user');
        
        // Count total questions
        const totalQuestions = userMessages.length;
        
        // Estimate quick actions (messages that match quick action patterns)
        const quickActionKeywords = [
          'tax', 'quarterly', 'deduction', 'profit', 'expense', 
          'pricing', 'cash flow', 'reconciliation', 'categorization',
          'audit', 'compliance', 'payroll', '1099', 'health check',
          'growth', 'kpi', 'investor', 'break-even'
        ];
        
        const quickActionsUsed = userMessages.filter((m: any) => {
          const content = typeof m.content === 'string' ? m.content.toLowerCase() : '';
          return quickActionKeywords.some(keyword => content.includes(keyword));
        }).length;
        
        // Get last used timestamp
        const lastUsed = userMessages.length > 0 
          ? new Date(userMessages[userMessages.length - 1].timestamp)
          : null;
        
        // Categorize by topic
        const categories = {
          'Tax Services': ['tax', 'deduction', 'quarterly', '1099', 'filing'],
          'Financial Analysis': ['profit', 'margin', 'ratio', 'analysis', 'forecast'],
          'Bookkeeping': ['categorization', 'reconciliation', 'transaction', 'expense'],
          'Compliance': ['audit', 'compliance', 'regulatory'],
          'Advisory': ['strategy', 'growth', 'kpi', 'investor', 'valuation']
        };
        
        const topCategories = Object.entries(categories)
          .map(([category, keywords]) => ({
            category,
            count: userMessages.filter((m: any) => {
              const content = typeof m.content === 'string' ? m.content.toLowerCase() : '';
              return keywords.some(keyword => content.includes(keyword));
            }).length
          }))
          .filter(c => c.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        
        setUsageStats({
          totalQuestions,
          quickActionsUsed,
          lastUsed,
          topCategories
        });
      } catch (error) {
        console.error('Failed to load usage stats:', error);
      }
    }
  }, [selectedBusiness?.id]);

  const getRelativeTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (usageStats.totalQuestions === 0) {
    return null; // Don't show if no usage yet
  }

  return (
    <Card 
      style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
      }}
    >
      <CardHeader style={{ padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
          <div 
            style={{ 
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <CardTitle>Your CPA Chat Activity</CardTitle>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              Track your Cofounder Finance usage
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent style={{ padding: '0 var(--spacing-4) var(--spacing-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-3)' }}>
          {/* Total Questions */}
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Total Questions
              </p>
            </div>
            <h3 style={{ color: 'var(--primary)' }}>
              {usageStats.totalQuestions}
            </h3>
          </div>
          
          {/* Quick Actions */}
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Quick Actions
              </p>
            </div>
            <h3 style={{ color: 'var(--primary)' }}>
              {usageStats.quickActionsUsed}
            </h3>
          </div>
          
          {/* Last Used */}
          <div 
            style={{ 
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                Last Used
              </p>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
              {getRelativeTime(usageStats.lastUsed)}
            </p>
          </div>
        </div>
        
        {/* Top Categories */}
        {usageStats.topCategories.length > 0 && (
          <div 
            style={{ 
              marginTop: 'var(--spacing-4)',
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                Most Used Services
              </p>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
              {usageStats.topCategories.map((category, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  style={{ 
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    backgroundColor: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)'
                  }}
                >
                  {category.category}
                  <span 
                    style={{ 
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      fontSize: '0.625rem'
                    }}
                  >
                    {category.count}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
