/**
 * Credit Info Card Component
 * Shows credit information and cost for AI features
 */

import React from 'react';
import { Sparkles, Info, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useCredits } from '../hooks/useCredits';
import { useNavigate } from 'react-router-dom';

interface CreditInfoCardProps {
  featureName: string;
  creditCost: number;
  description?: string;
  variant?: 'default' | 'compact';
}

export function CreditInfoCard({ 
  featureName, 
  creditCost, 
  description,
  variant = 'default' 
}: CreditInfoCardProps) {
  const { credits, plan } = useCredits();
  const navigate = useNavigate();
  const hasEnoughCredits = credits >= creditCost;
  
  // Map internal plan names to user-facing names
  const planDisplayName = plan === 'creator' ? 'Launch' : plan === 'builder' ? 'Grow' : 'Free';

  if (variant === 'compact') {
    return (
      <div 
        className="flex items-center justify-between border"
        style={{
          padding: 'var(--spacing-3)',
          borderRadius: 'var(--radius-lg)',
          background: hasEnoughCredits 
            ? 'var(--muted)' 
            : 'color-mix(in srgb, var(--destructive) 10%, transparent)',
          borderColor: hasEnoughCredits ? 'var(--border)' : 'var(--destructive)',
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
          <Sparkles 
            className="size-4" 
            style={{ 
              color: hasEnoughCredits ? 'var(--primary)' : 'var(--destructive)' 
            }} 
          />
          <span style={{ fontSize: '0.875rem' }}>
            <strong>{creditCost}</strong> {creditCost === 1 ? 'credit' : 'credits'}
          </span>
        </div>
        
        {!hasEnoughCredits && (
          <button
            onClick={() => navigate('/settings?tab=plan')}
            style={{
              fontSize: '0.75rem',
              padding: 'var(--spacing-1) var(--spacing-2)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Get Credits
          </button>
        )}
      </div>
    );
  }

  return (
    <Card 
      className="border"
      style={{
        borderColor: hasEnoughCredits ? 'var(--border)' : 'var(--destructive)',
        background: hasEnoughCredits 
          ? 'var(--card)' 
          : 'color-mix(in srgb, var(--destructive) 5%, var(--card))',
      }}
    >
      <CardHeader style={{ paddingBottom: 'var(--spacing-2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-lg)',
                background: hasEnoughCredits 
                  ? 'var(--primary-soft)' 
                  : 'color-mix(in srgb, var(--destructive) 20%, transparent)',
              }}
            >
              <Sparkles 
                className="size-4" 
                style={{ 
                  color: hasEnoughCredits ? 'var(--primary)' : 'var(--destructive)' 
                }} 
              />
            </div>
            <CardTitle style={{ fontSize: '1rem', margin: 0 }}>
              AI Feature Cost
            </CardTitle>
          </div>
          
          <Badge
            style={{
              background: hasEnoughCredits 
                ? 'var(--primary)' 
                : 'var(--destructive)',
              color: hasEnoughCredits 
                ? 'var(--primary-foreground)' 
                : 'var(--destructive-foreground)',
              fontWeight: 'var(--font-weight-bold)',
            }}
          >
            {creditCost} {creditCost === 1 ? 'Credit' : 'Credits'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ marginBottom: 'var(--spacing-3)' }}>
          <div className="text-sm" style={{ marginBottom: 'var(--spacing-2)' }}>
            <strong>{featureName}</strong>
            {description && (
              <p className="text-muted-foreground" style={{ marginTop: 'var(--spacing-1)' }}>
                {description}
              </p>
            )}
          </div>
          
          <div 
            className="flex items-center text-xs"
            style={{ gap: 'var(--spacing-2)' }}
          >
            <Info className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              You have <strong style={{ color: hasEnoughCredits ? 'var(--foreground)' : 'var(--destructive)' }}>
                {credits}
              </strong> credits remaining on the {planDisplayName} plan
            </span>
          </div>
        </div>

        {!hasEnoughCredits && (
          <div
            style={{
              padding: 'var(--spacing-3)',
              borderRadius: 'var(--radius-md)',
              background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
              border: '1px solid var(--destructive)',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--destructive)', marginBottom: 'var(--spacing-2)' }}>
              ⚠️ Insufficient credits to use this feature
            </p>
            <button
              onClick={() => navigate('/settings?tab=plan')}
              className="w-full text-center transition-all"
              style={{
                padding: 'var(--spacing-2)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              <DollarSign className="size-4 inline-block" style={{ marginRight: 'var(--spacing-1)' }} />
              Upgrade to Continue
            </button>
          </div>
        )}

        {hasEnoughCredits && (
          <div className="text-xs text-muted-foreground">
            💡 After this action, you'll have {credits - creditCost} credits remaining
          </div>
        )}
      </CardContent>
    </Card>
  );
}
