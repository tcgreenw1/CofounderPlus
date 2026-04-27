/**
 * Credit Display Component
 * Shows AI credit balance with plan indicator
 * Optimized to show immediately with cached data
 */

import React from 'react';
import { Sparkles, DollarSign } from 'lucide-react';
import { useCredits } from '../hooks/useCredits';
import { useNavigate } from 'react-router-dom';

interface CreditDisplayProps {
  variant?: 'full' | 'compact' | 'inline';
  showUpgrade?: boolean;
}

export function CreditDisplay({ variant = 'full', showUpgrade = true }: CreditDisplayProps) {
  const { credits, plan, maxCredits, isLoading } = useCredits();
  const navigate = useNavigate();

  // Show immediately even while loading (uses cached data)
  // Only hide if truly no data yet
  if (isLoading && credits === 0 && plan === 'free' && maxCredits === 50) {
    // This is the initial state with no cached data
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-2) var(--spacing-3)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-muted)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        <Sparkles className="size-4 animate-pulse" />
        {variant !== 'inline' && <span>...</span>}
      </div>
    );
  }

  // Map internal plan names to user-facing names
  const planDisplayName = plan === 'creator' ? 'Launch' : plan === 'builder' ? 'Grow' : 'Free';

  const percentage = (credits / maxCredits) * 100;
  const isLow = credits <= 10;
  const isEmpty = credits === 0;

  if (variant === 'inline') {
    return (
      <button
        onClick={() => navigate('/settings?tab=plan')}
        className="flex items-center transition-all"
        style={{
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-2) var(--spacing-3)',
          borderRadius: 'var(--radius-full)',
          background: isEmpty 
            ? 'var(--color-destructive-soft)'
            : isLow 
            ? 'color-mix(in srgb, var(--color-destructive) 10%, transparent)'
            : 'var(--color-muted)',
          color: isEmpty 
            ? 'var(--color-destructive-foreground)'
            : isLow
            ? 'var(--color-destructive)'
            : 'var(--color-foreground)',
          border: isEmpty || isLow ? '1px solid var(--color-destructive)' : '1px solid var(--color-border)',
        }}
        title="Click to manage credits"
      >
        <Sparkles className="size-4" />
        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
          {credits}
        </span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate('/settings?tab=plan')}
        className="flex items-center transition-all w-full"
        style={{
          gap: 'var(--spacing-2)',
          padding: '6px 8px',
          borderRadius: 'var(--radius-lg)',
          background: isEmpty 
            ? 'var(--color-destructive-soft)'
            : isLow 
            ? 'color-mix(in srgb, var(--color-destructive) 10%, transparent)'
            : 'var(--color-card)',
          border: isEmpty || isLow ? '1px solid var(--color-destructive)' : '1px solid var(--color-border)',
        }}
        title="Click to manage credits"
      >
        <div
          className="size-6 flex items-center justify-center flex-shrink-0"
          style={{
            borderRadius: 'var(--radius-md)',
            background: isEmpty 
              ? 'var(--color-destructive)'
              : isLow 
              ? 'color-mix(in srgb, var(--color-destructive) 30%, transparent)'
              : 'var(--color-primary-soft)',
          }}
        >
          <Sparkles 
            className="size-3" 
            style={{ 
              color: isEmpty 
                ? 'var(--color-destructive-foreground)'
                : isLow
                ? 'var(--color-destructive)'
                : 'var(--color-primary)' 
            }} 
          />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-foreground)', fontSize: '0.75rem' }}>
              {credits}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-muted-foreground)' }}>{planDisplayName}</span>
          </div>
          <div 
            style={{
              width: '100%',
              height: '3px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-muted)',
              overflow: 'hidden',
              marginTop: '2px'
            }}
          >
            <div
              style={{
                width: `${percentage}%`,
                height: '100%',
                background: isEmpty 
                  ? 'var(--color-destructive)'
                  : isLow 
                  ? 'var(--color-destructive)'
                  : 'var(--color-primary)',
                transition: 'width 0.3s ease',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
        </div>
      </button>
    );
  }

  // Full variant
  return (
    <div
      className="border"
      style={{
        padding: 'var(--spacing-4)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-card)',
        borderColor: isEmpty || isLow ? 'var(--color-destructive)' : 'var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-3)' }}>
        <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
          <div
            className="size-8 flex items-center justify-center"
            style={{
              borderRadius: 'var(--radius-lg)',
              background: isEmpty 
                ? 'var(--color-destructive)'
                : isLow 
                ? 'color-mix(in srgb, var(--color-destructive) 30%, transparent)'
                : 'var(--color-primary-soft)',
            }}
          >
            <Sparkles 
              className="size-4" 
              style={{ 
                color: isEmpty 
                  ? 'var(--color-destructive-foreground)'
                  : isLow
                  ? 'var(--color-destructive)'
                  : 'var(--color-primary)' 
              }} 
            />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground)' }}>
              AI Credits
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{planDisplayName} Plan</div>
          </div>
        </div>
        
        <div className="text-right">
          <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-foreground)' }}>
            {credits}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>of {maxCredits}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div 
        style={{
          width: '100%',
          height: '6px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-muted)',
          marginBottom: 'var(--spacing-3)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: isEmpty 
              ? 'var(--color-destructive)'
              : isLow 
              ? 'var(--color-destructive)'
              : 'var(--color-primary)',
            transition: 'width 0.3s ease',
            borderRadius: 'var(--radius-full)',
          }}
        />
      </div>

      {/* Warning or info text */}
      {isEmpty && (
        <div 
          style={{ 
            fontSize: '0.75rem',
            color: 'var(--color-destructive)',
            marginBottom: showUpgrade ? 'var(--spacing-2)' : 0
          }}
        >
          ⚠️ Out of credits. Upgrade to continue using AI features.
        </div>
      )}
      {!isEmpty && isLow && (
        <div 
          style={{ 
            fontSize: '0.75rem',
            color: 'var(--color-muted-foreground)',
            marginBottom: showUpgrade ? 'var(--spacing-2)' : 0 
          }}
        >
          Running low on credits
        </div>
      )}
      {/* Removed: 1 credit = 1 AI action */}

      {/* Upgrade button */}
      {showUpgrade && (isEmpty || isLow) && (
        <button
          onClick={() => navigate('/settings?tab=plan')}
          className="w-full transition-all text-center"
          style={{
            padding: 'var(--spacing-2)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
            fontWeight: 'var(--font-weight-medium)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <DollarSign className="size-4 inline-block" style={{ marginRight: 'var(--spacing-1)' }} />
          Upgrade Plan
        </button>
      )}
    </div>
  );
}