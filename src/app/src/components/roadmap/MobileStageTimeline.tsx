import React from 'react';
import { Lock, CheckCircle2, Circle } from 'lucide-react';

interface MobileStageTimelineProps {
  currentStage: number; // 1-5 for Foundation, MVP, Launch, Scale, Exit
  stages: Array<{
    number: number;
    label: string;
    status: 'completed' | 'current' | 'locked';
  }>;
  onStageClick?: (stage: number) => void;
}

export function MobileStageTimeline({
  currentStage,
  stages,
  onStageClick,
}: MobileStageTimelineProps) {
  return (
    <div
      className="fixed left-0 top-0 bottom-0 z-20 flex flex-col"
      style={{
        width: '60px',
        background: 'linear-gradient(180deg, var(--background, rgba(255, 255, 255, 0.98)) 0%, var(--muted, rgba(248, 252, 255, 0.95)) 100%)',
        backdropFilter: 'blur(var(--blur-lg, 24px))',
        WebkitBackdropFilter: 'blur(var(--blur-lg, 24px))',
        borderRight: '2px solid var(--border, rgba(226, 232, 240, 0.8))',
        boxShadow: '4px 0 12px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Connecting Line - Thinner and more subtle */}
      <div
        className="absolute left-1/2 z-0"
        style={{
          top: '140px', // Start below header area
          bottom: '80px', // End above bottom
          width: '1.5px', // 50% reduction from 3px
          background: 'linear-gradient(180deg, var(--muted, #e2e8f0) 0%, var(--primary, #2F80FF) 50%, var(--muted, #e2e8f0) 100%)',
          transform: 'translateX(-50%)',
          borderRadius: 'var(--radius-full, 9999px)',
          opacity: 0.35, // Reduced opacity to be subtle
        }}
      />

      {/* Stage Markers - Aligned to center vertically with department cards */}
      <div 
        className="relative flex flex-col justify-start px-2 z-10"
        style={{
          paddingTop: '200px', // Position to align first circle with first department card - moved down from 130px
          gap: 'var(--spacing-20, 80px)', // Large gap to align with card spacing
        }}
      >
        {stages.map((stage) => {
          const isCompleted = stage.status === 'completed';
          const isCurrent = stage.status === 'current';
          const isLocked = stage.status === 'locked';

          return (
            <button
              key={stage.number}
              onClick={() => onStageClick?.(stage.number)}
              disabled={isLocked}
              className="relative flex flex-col items-center gap-1 transition-all duration-300 active:scale-95"
              style={{
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              {/* Glow for current stage */}
              {isCurrent && (
                <div
                  className="absolute -inset-2 rounded-full animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, var(--primary-glass, rgba(47, 128, 255, 0.3)) 0%, transparent 70%)',
                    filter: 'blur(8px)',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Marker Circle */}
              <div
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                  width: 'var(--size-10, 40px)',
                  height: 'var(--size-10, 40px)',
                  borderRadius: 'var(--radius-full, 9999px)',
                  background: isCompleted
                    ? 'linear-gradient(135deg, var(--success, #27D17C) 0%, var(--success-hover, #1ea96a) 100%)'
                    : isCurrent
                    ? 'linear-gradient(135deg, var(--primary, #2F80FF) 0%, var(--primary-hover, #1e6dd8) 100%)'
                    : 'var(--muted, rgba(148, 163, 184, 0.3))',
                  border: isCompleted || isCurrent ? 'none' : '2px solid var(--muted-foreground, #94a3b8)',
                  boxShadow: isCompleted
                    ? '0 4px 12px var(--success-shadow, rgba(39, 209, 124, 0.4))'
                    : isCurrent
                    ? '0 4px 16px var(--primary-shadow, rgba(47, 128, 255, 0.5))'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                {isCompleted ? (
                  <CheckCircle2
                    className="size-5"
                    style={{ color: 'var(--primary-foreground, #ffffff)' }}
                  />
                ) : isLocked ? (
                  <Lock
                    className="size-4"
                    style={{ color: 'var(--muted-foreground, #94a3b8)' }}
                  />
                ) : isCurrent ? (
                  <Circle
                    className="size-5 fill-current"
                    style={{ color: 'var(--primary-foreground, #ffffff)' }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 'var(--text-sm, 14px)',
                      fontWeight: 'var(--font-bold, 700)',
                      color: 'var(--muted-foreground, #94a3b8)',
                    }}
                  >
                    {stage.number}
                  </span>
                )}
              </div>

              {/* Label Below Circle (All Stages) */}
              <div
                className="absolute text-center"
                style={{
                  top: 'calc(100% + 4px)', // Position below circle with 4px gap
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '56px', // Fit within the 60px bar width
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-2xs, 9px)',
                    fontWeight: 'var(--font-bold, 700)',
                    color: isCompleted 
                      ? 'var(--success, #27D17C)'
                      : isCurrent 
                      ? 'var(--primary, #2F80FF)'
                      : 'var(--muted-foreground, #94a3b8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    lineHeight: '1.2',
                    display: 'block',
                    textShadow: isCurrent 
                      ? '0 1px 3px rgba(47, 128, 255, 0.2)' 
                      : isCompleted 
                      ? '0 1px 3px rgba(39, 209, 124, 0.2)' 
                      : 'none',
                    opacity: isLocked ? 0.6 : 1,
                  }}
                >
                  {stage.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}