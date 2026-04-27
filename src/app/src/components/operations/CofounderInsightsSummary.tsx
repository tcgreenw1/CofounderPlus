import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Sparkles,
  TrendingUp,
  MessageSquare,
  Clock,
  Zap
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

interface ToolStat {
  name: string;
  questions: number;
  lastActive: string;
  color: string;
}

export function CofounderInsightsSummary() {
  const { selectedBusiness } = useBusiness();
  const [stats, setStats] = useState<ToolStat[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!selectedBusiness?.id) return;

    const tools = [
      { key: 'cpa-chat', name: 'Finance', color: 'var(--success)' },
      { key: 'hr-chat', name: 'HR', color: 'var(--primary)' },
      { key: 'marketing-chat', name: 'Marketing', color: '#ec4899' },
      { key: 'product-chat', name: 'Product', color: '#f59e0b' },
      { key: 'sales-chat', name: 'Sales', color: '#8b5cf6' }
    ];

    const toolStats: ToolStat[] = [];
    let total = 0;

    tools.forEach(tool => {
      const chatData = sessionStorage.getItem(`${tool.key}-${selectedBusiness.id}`);
      if (chatData) {
        try {
          const messages = JSON.parse(chatData);
          const userMessages = messages.filter((m: any) => m.role === 'user');
          
          if (userMessages.length > 0) {
            const lastMsg = new Date(userMessages[userMessages.length - 1].timestamp);
            const now = new Date();
            const diffHours = Math.floor((now.getTime() - lastMsg.getTime()) / 3600000);
            
            let lastActive = '';
            if (diffHours < 1) lastActive = 'Just now';
            else if (diffHours < 24) lastActive = `${diffHours}h ago`;
            else lastActive = `${Math.floor(diffHours / 24)}d ago`;

            toolStats.push({
              name: tool.name,
              questions: userMessages.length,
              lastActive,
              color: tool.color
            });
            
            total += userMessages.length;
          }
        } catch (error) {
          console.error(`Failed to load ${tool.name} stats:`, error);
        }
      }
    });

    // Sort by usage
    toolStats.sort((a, b) => b.questions - a.questions);
    
    setStats(toolStats);
    setTotalQuestions(total);
  }, [selectedBusiness?.id]);

  if (stats.length === 0) {
    return null; // Don't show if no activity
  }

  return (
    <Card 
      style={{ 
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        marginBottom: 'var(--spacing-4)',
        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
      }}
    >
      <CardContent style={{ padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
          {/* Left: Icon + Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div 
              style={{ 
                padding: 'var(--spacing-2)',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'white' }} />
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <h4 style={{ color: 'var(--foreground)' }}>Cofounder Activity</h4>
                <Badge 
                  variant="outline"
                  style={{ 
                    fontSize: '0.625rem',
                    padding: '2px 6px',
                    backgroundColor: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    border: 'none'
                  }}
                >
                  {stats.length} active
                </Badge>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                {totalQuestions} total interactions across all tools
              </p>
            </div>
          </div>

          {/* Right: Tool breakdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            {stats.slice(0, 3).map((stat, index) => (
              <div 
                key={index}
                style={{ 
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)'
                }}
              >
                <div 
                  style={{ 
                    width: '8px',
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: stat.color,
                    flexShrink: 0
                  }}
                />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--foreground)' }}>
                    {stat.name}
                  </p>
                  <p style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)' }}>
                    {stat.questions} • {stat.lastActive}
                  </p>
                </div>
              </div>
            ))}
            
            {stats.length > 3 && (
              <Badge 
                variant="outline"
                style={{ 
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid var(--border)',
                  color: 'var(--muted-foreground)'
                }}
              >
                +{stats.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
