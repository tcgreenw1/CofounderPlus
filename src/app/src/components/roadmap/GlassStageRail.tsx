import React from 'react';

/**
 * Glass Stage Progress Rail
 * 
 * Thin translucent glass bar showing Foundation → MVP → Launch → Scale → Exit
 * Minimal stage markers with soft glowing indicators
 * Uses CSS variables from design system
 */

interface GlassStageRailProps {
  currentStage: number; // 0-4
  stages?: string[];
}

const defaultStages = ['Foundation', 'MVP', 'Launch', 'Scale', 'Exit'];

export function GlassStageRail({ currentStage, stages = defaultStages }: GlassStageRailProps) {
  return (
    <div
      className="px-4 sm:px-10"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Glass Bar */}
      <div
        style={{
          position: 'relative',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '2px',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${(currentStage / (stages.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, #2b7fff 0%, #27D17C 100%)',
            borderRadius: '2px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Stage Markers */}
      <div
        className="absolute -top-2 left-4 right-4 sm:left-10 sm:right-10"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {stages.map((stage, index) => {
          const isActive = index === currentStage;
          const isCompleted = index < currentStage;
          const isPending = index > currentStage;

          return (
            <div
              key={stage}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* Marker Dot */}
              <div
                style={{
                  position: 'relative',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted
                    ? '#27D17C'
                    : isActive
                    ? '#2b7fff'
                    : 'rgba(255, 255, 255, 0.6)',
                  border: `2px solid ${
                    isCompleted
                      ? '#27D17C'
                      : isActive
                      ? '#2b7fff'
                      : 'rgba(0, 0, 0, 0.1)'
                  }`,
                  boxShadow: isActive
                    ? '0 0 0 4px rgba(43, 127, 255, 0.2), 0 2px 8px rgba(43, 127, 255, 0.3)'
                    : isCompleted
                    ? '0 0 0 4px rgba(39, 209, 124, 0.2)'
                    : 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Glow effect for active */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '-6px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(43, 127, 255, 0.3) 0%, transparent 70%)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}
              </div>

              {/* Stage Label */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: isActive
                    ? 'var(--font-weight-medium)'
                    : 'var(--font-weight-normal)',
                  color: isActive
                    ? '#2b7fff'
                    : isCompleted
                    ? '#27D17C'
                    : 'var(--muted-foreground)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                }}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}