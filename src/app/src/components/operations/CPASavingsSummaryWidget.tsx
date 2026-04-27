import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { 
  PiggyBank,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CPASavingsSummaryWidgetProps {
  onViewDetails?: () => void;
}

export function CPASavingsSummaryWidget({ onViewDetails }: CPASavingsSummaryWidgetProps) {
  // Based on 32 automated services
  const monthlySavings = 1830;
  const annualSavings = monthlySavings * 12;
  const automationRate = 73;

  return (
    <Card 
      style={{ 
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Background decoration */}
      <div 
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '200px',
          height: '200px',
          borderRadius: 'var(--radius-full)',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      
      <CardContent style={{ padding: 'var(--spacing-5)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-4)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
              <div 
                style={{ 
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PiggyBank className="w-5 h-5" style={{ color: 'white' }} />
              </div>
              <h3 style={{ color: 'var(--foreground)' }}>CPA Cost Savings</h3>
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                <h1 style={{ color: 'var(--success)', lineHeight: 1 }}>
                  ${monthlySavings.toLocaleString()}
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                  / month
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                <strong style={{ color: 'var(--success)' }}>${annualSavings.toLocaleString()}</strong> saved annually vs. traditional CPA
              </p>
            </div>
            
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 'var(--spacing-4)'
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  Automation Rate
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  <strong style={{ color: 'var(--primary)' }}>{automationRate}%</strong> of CPA services automated
                </p>
              </div>
            </div>
            
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                style={{ 
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                View Full Breakdown
                <ArrowRight className="w-4 h-4" style={{ marginLeft: 'var(--spacing-2)' }} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
