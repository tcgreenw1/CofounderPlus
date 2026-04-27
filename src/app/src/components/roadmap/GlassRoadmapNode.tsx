import React from 'react';
import { Lock, Sparkles, Check, AlertCircle } from 'lucide-react';

/**
 * Apple Liquid Glass Roadmap Node
 * 
 * Unified, premium node design with frosted glass aesthetics
 * Uses only Toy Box Pop colors (blue, green, yellow, red)
 * All styling uses CSS variables from design system
 */

export type NodeState = 'default' | 'active' | 'recommended' | 'completed' | 'locked' | 'blocked';
export type BranchColor = 'blue' | 'green' | 'yellow' | 'red';

interface GlassRoadmapNodeProps {
  title: string;
  description?: string;
  xp?: number;
  timeEstimate?: string;
  state?: NodeState;
  branchColor?: BranchColor;
  aiRecommended?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  icon?: React.ReactNode;
}

// Color mappings for Toy Box Pop palette (using CSS variables)
const branchColorMap: Record<BranchColor, { border: string; iconBg: string; iconColor: string; badge: string }> = {
  blue: {
    border: 'rgba(43, 127, 255, 0.3)',
    iconBg: 'rgba(43, 127, 255, 0.1)',
    iconColor: '#2b7fff',
    badge: 'rgba(43, 127, 255, 0.15)',
  },
  green: {
    border: 'rgba(39, 209, 124, 0.3)',
    iconBg: 'rgba(39, 209, 124, 0.1)',
    iconColor: '#27D17C',
    badge: 'rgba(39, 209, 124, 0.15)',
  },
  yellow: {
    border: 'rgba(255, 224, 32, 0.3)',
    iconBg: 'rgba(255, 224, 32, 0.1)',
    iconColor: '#ffe020',
    badge: 'rgba(255, 224, 32, 0.15)',
  },
  red: {
    border: 'rgba(255, 79, 80, 0.3)',
    iconBg: 'rgba(255, 79, 80, 0.1)',
    iconColor: '#ff4f50',
    badge: 'rgba(255, 79, 80, 0.15)',
  },
};

export function GlassRoadmapNode({
  title,
  description,
  xp,
  timeEstimate,
  state = 'default',
  branchColor = 'blue',
  aiRecommended = false,
  onClick,
  onDoubleClick,
  icon,
}: GlassRoadmapNodeProps) {
  const colors = branchColorMap[branchColor];
  const isInteractive = state !== 'locked' && state !== 'blocked';
  const isMobile = window.innerWidth < 768;

  // Get state-specific icon
  const getStateIcon = () => {
    if (state === 'completed') return <Check className="w-4 h-4" />;
    if (state === 'locked') return <Lock className="w-4 h-4" />;
    if (state === 'blocked') return <AlertCircle className="w-4 h-4" />;
    if (state === 'recommended' || aiRecommended) return <Sparkles className="w-4 h-4" />;
    return icon;
  };

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      onDoubleClick={isInteractive ? onDoubleClick : undefined}
      className={`
        group relative
        ${isInteractive ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
      style={{
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        // 16px horizontal margins on mobile for breathing room
        marginLeft: isMobile ? 'var(--spacing-4)' : '0',
        marginRight: isMobile ? 'var(--spacing-4)' : '0',
        opacity: state === 'locked' ? 0.55 : 1,
      }}
    >
      {/* Glass Card Container - Professional, Balanced Design */}
      <div
        className="relative dark:bg-[rgba(0,0,0,0.4)] dark:border-[rgba(255,255,255,0.1)]"
        style={{
          backgroundColor: state === 'completed' 
            ? 'rgba(255, 255, 255, 0.85)' 
            : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: isMobile ? '14px' : '16px',
          boxShadow: `
            0 4px 20px rgba(0, 0, 0, 0.06),
            0 1px 4px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 0 0 1px ${colors.border}
          `,
          border: `1px solid ${colors.border}`,
          borderLeft: `3px solid ${colors.iconColor}`,
          // Professional padding using 8-point grid
          padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)', // 16px mobile, 24px desktop
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (isInteractive) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = `
              0 8px 28px rgba(0, 0, 0, 0.08),
              0 2px 8px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.6),
              inset 0 0 0 1px ${colors.border}
            `;
          }
        }}
        onMouseLeave={(e) => {
          if (isInteractive) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `
              0 4px 20px rgba(0, 0, 0, 0.06),
              0 1px 4px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 0 0 1px ${colors.border}
            `;
          }
        }}
      >
        {/* Subtle top highlight for glass effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
            pointerEvents: 'none',
            borderRadius: isMobile ? '14px 14px 0 0' : '16px 16px 0 0',
          }}
        />

        {/* Content Layout - Clear Hierarchy */}
        <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
          {/* Icon - Consistent Sizing */}
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: 'var(--radius)',
              backgroundColor: colors.iconBg,
              color: colors.iconColor,
              position: 'relative',
            }}
          >
            {getStateIcon()}
          </div>

          {/* Text Content - Strong Hierarchy */}
          <div className="flex-1 min-w-0" style={{ position: 'relative' }}>
            {/* Title Row with Badges */}
            <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
              <h4
                style={{
                  fontWeight: 'var(--font-weight-semibold)', // Stronger for fast scanning
                  color: 'var(--foreground)',
                  fontSize: isMobile ? '16px' : '17px', // 16-17px card titles
                  lineHeight: '1.3',
                }}
              >
                {title}
              </h4>
              
              {/* AI Badge */}
              {(aiRecommended || state === 'recommended') && (
                <div
                  className="flex items-center"
                  style={{
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: colors.badge,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: colors.iconColor,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AGI</span>
                </div>
              )}

              {/* Locked Badge - Subtle */}
              {state === 'locked' && (
                <div
                  className="flex items-center"
                  style={{
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: 'var(--muted)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <Lock className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Description - Clear Readability */}
            {description && (
              <p
                style={{
                  fontSize: isMobile ? '13px' : '14px', // 13-14px descriptions
                  color: 'var(--muted-foreground)',
                  fontWeight: 'var(--font-weight-normal)',
                  lineHeight: '1.5',
                  marginBottom: 'var(--spacing-2)', // 8px spacing
                }}
              >
                {description}
              </p>
            )}

            {/* Metadata Row - Consistent Spacing */}
            <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
              {xp && (
                <span
                  style={{
                    fontSize: isMobile ? '12px' : '13px', // 12-13px labels
                    fontWeight: 'var(--font-weight-semibold)',
                    color: colors.iconColor,
                  }}
                >
                  +{xp} XP
                </span>
              )}
              {timeEstimate && (
                <span
                  style={{
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {timeEstimate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completed Overlay */}
        {state === 'completed' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${colors.iconBg} 0%, transparent 100%)`,
              borderRadius: isMobile ? '14px' : '16px',
              opacity: 0.25,
            }}
          />
        )}
      </div>
    </div>
  );
}