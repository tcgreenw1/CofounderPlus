import React, { useState, useEffect } from 'react';
import { useBusiness } from './BusinessContext';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign,
  Users,
  Package,
  Megaphone,
  BarChart3,
  ChevronRight,
  Sparkles,
  Trophy
} from 'lucide-react';

interface ToolProgress {
  id: string;
  name: string;
  icon: React.ElementType;
  route: string;
  color: string;
  active: boolean;
  count: number;
}

export function CofounderProgressTracker() {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const [tools, setTools] = useState<ToolProgress[]>([]);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    if (!selectedBusiness?.id) return;

    const toolList = [
      { 
        id: 'finance', 
        name: 'Finance', 
        icon: DollarSign, 
        route: '/operations?tab=finance',
        color: 'var(--success)',
        storageKey: 'cpa-chat'
      },
      { 
        id: 'hr', 
        name: 'HR', 
        icon: Users, 
        route: '/operations?tab=hr',
        color: 'var(--primary)',
        storageKey: 'hr-chat'
      },
      { 
        id: 'marketing', 
        name: 'Marketing', 
        icon: Megaphone, 
        route: '/operations?tab=marketing',
        color: '#ec4899',
        storageKey: 'marketing-chat'
      },
      { 
        id: 'product', 
        name: 'Product', 
        icon: Package, 
        route: '/operations?tab=product',
        color: '#f59e0b',
        storageKey: 'product-chat'
      },
      { 
        id: 'sales', 
        name: 'Sales', 
        icon: BarChart3, 
        route: '/operations?tab=sales',
        color: '#8b5cf6',
        storageKey: 'sales-chat'
      }
    ];

    const progress: ToolProgress[] = [];
    let activeCount = 0;

    toolList.forEach(tool => {
      const chatData = sessionStorage.getItem(`${tool.storageKey}-${selectedBusiness.id}`);
      let count = 0;
      let isActive = false;
      
      if (chatData) {
        try {
          const messages = JSON.parse(chatData);
          const userMessages = messages.filter((m: any) => m.role === 'user');
          count = userMessages.length;
          isActive = count > 0;
          if (isActive) activeCount++;
        } catch (error) {
          console.error(`Failed to load ${tool.name} progress:`, error);
        }
      }
      
      progress.push({
        id: tool.id,
        name: tool.name,
        icon: tool.icon,
        route: tool.route,
        color: tool.color,
        active: isActive,
        count
      });
    });

    setTools(progress);
    setCompletionRate((activeCount / 5) * 100);
  }, [selectedBusiness?.id]);

  const activeToolsCount = tools.filter(t => t.active).length;

  return (
    <div 
      style={{ 
        padding: 'var(--spacing-3)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--foreground)' }}>
              <strong>Your Progress</strong>
            </p>
          </div>
          {activeToolsCount === 5 && (
            <Trophy className="w-4 h-4" style={{ color: '#fbbf24' }} />
          )}
        </div>
        
        {/* Progress Bar */}
        <div 
          style={{ 
            width: '100%',
            height: '4px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              width: `${completionRate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        
        <p style={{ fontSize: '0.625rem', color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
          {activeToolsCount} of 5 tools active • {Math.round(completionRate)}%
        </p>
      </div>

      {/* Tool List */}
      <div style={{ display: 'grid', gap: 'var(--spacing-1)' }}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => navigate(tool.route)}
              style={{
                padding: 'var(--spacing-2)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: tool.active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border: `1px solid ${tool.active ? tool.color + '40' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = tool.active ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, minWidth: 0 }}>
                <div 
                  style={{ 
                    width: '6px',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: tool.active ? tool.color : 'var(--muted)',
                    flexShrink: 0
                  }}
                />
                <Icon className="w-3 h-3" style={{ color: tool.active ? tool.color : 'var(--muted-foreground)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.75rem', color: tool.active ? 'var(--foreground)' : 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tool.name}
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                {tool.active && (
                  <div 
                    style={{ 
                      padding: '2px var(--spacing-1)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: `${tool.color}20`,
                      minWidth: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{ fontSize: '0.625rem', color: tool.color }}>
                      {tool.count}
                    </p>
                  </div>
                )}
                <ChevronRight className="w-3 h-3" style={{ color: 'var(--muted-foreground)', opacity: 0.5, flexShrink: 0 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
