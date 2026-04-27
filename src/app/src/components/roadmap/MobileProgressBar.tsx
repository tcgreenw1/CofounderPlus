import React from 'react';
import { Zap } from 'lucide-react';

interface MobileProgressBarProps {
  progress: number; // 0-100
  totalXP: number;
  completedNodes: number;
  totalNodes: number;
  currentStageLabel?: string;
}

export function MobileProgressBar({
  progress,
  totalXP,
  completedNodes,
  totalNodes,
  currentStageLabel = 'Foundation',
}: MobileProgressBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        marginLeft: '60px', // Account for vertical stage timeline
      }}
    >
      {/* Compact Progress Bar */}
      <div
        className="w-full px-3 py-2"
        style={{
          background: 'linear-gradient(135deg, var(--card, rgba(255, 255, 255, 0.95)) 0%, var(--muted, rgba(248, 252, 255, 0.9)) 100%)',
          backdropFilter: 'blur(var(--blur-xl, 40px))',
          WebkitBackdropFilter: 'blur(var(--blur-xl, 40px))',
          borderTop: '2px solid var(--border, rgba(226, 232, 240, 0.6))',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Top Row: XP and Stage */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center"
              style={{
                width: 'var(--size-8, 32px)',
                height: 'var(--size-8, 32px)',
                borderRadius: 'var(--radius-lg, 10px)',
                background: 'linear-gradient(135deg, var(--warning-glass, rgba(242, 201, 76, 0.3)) 0%, var(--warning-glass-alt, rgba(255, 220, 120, 0.25)) 100%)',
                border: '2px solid var(--warning, #F2C94C)',
                boxShadow: '0 2px 8px var(--warning-shadow, rgba(242, 201, 76, 0.3))',
              }}
            >
              <Zap
                className="size-4"
                style={{ color: 'var(--warning-foreground, #b8860b)' }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--text-xs, 10px)',
                  fontWeight: 'var(--font-semibold, 600)',
                  color: 'var(--warning-foreground, #b8860b)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Total XP
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm, 14px)',
                  fontWeight: 'var(--font-bold, 700)',
                  color: 'var(--warning-foreground, #b8860b)',
                }}
              >
                {totalXP.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stage Label */}
          <div
            className="px-3 py-1"
            style={{
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'var(--primary-glass, rgba(47, 128, 255, 0.15))',
              border: '1.5px solid var(--primary, #2F80FF)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs, 12px)',
                fontWeight: 'var(--font-semibold, 600)',
                color: 'var(--primary, #2F80FF)',
              }}
            >
              {currentStageLabel}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="w-full overflow-hidden mb-1"
          style={{
            height: 'var(--size-3, 12px)',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'var(--warning-glass, rgba(242, 201, 76, 0.15))',
            border: '1px solid var(--warning-border, rgba(242, 201, 76, 0.3))',
          }}
        >
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--warning, #F2C94C) 0%, var(--success, #27D17C) 100%)',
              boxShadow: '0 0 12px var(--warning-shadow, rgba(242, 201, 76, 0.5))',
            }}
          />
        </div>

        {/* Bottom Row: Task Count and Progress % */}
        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: 'var(--text-xs, 11px)',
              fontWeight: 'var(--font-medium, 500)',
              color: 'var(--muted-foreground, #64748b)',
            }}
          >
            {completedNodes} of {totalNodes} tasks complete
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs, 11px)',
              fontWeight: 'var(--font-bold, 700)',
              color: 'var(--warning-foreground, #b8860b)',
            }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}