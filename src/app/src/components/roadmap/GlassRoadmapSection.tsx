import React from 'react';
import { Target, TrendingUp, Zap } from 'lucide-react';

/**
 * Glass Roadmap Section
 * 
 * Branch grouping component for Product, Marketing, Sales
 * Faint tinted left border, glass pill header
 * Uses CSS variables from design system
 */

export type SectionType = 'product' | 'marketing' | 'sales';

interface GlassRoadmapSectionProps {
  type: SectionType;
  label: string;
  children: React.ReactNode;
  nodeCount?: number;
}

// Branch color mapping (Toy Box Pop colors only)
const sectionConfig: Record<SectionType, { color: string; bgColor: string; icon: React.ReactNode }> = {
  product: {
    color: '#2b7fff', // Blue
    bgColor: 'rgba(43, 127, 255, 0.08)',
    icon: <Target className="w-4 h-4" />,
  },
  marketing: {
    color: '#ffe020', // Yellow
    bgColor: 'rgba(255, 224, 32, 0.08)',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  sales: {
    color: '#27D17C', // Green
    bgColor: 'rgba(39, 209, 124, 0.08)',
    icon: <Zap className="w-4 h-4" />,
  },
};

export function GlassRoadmapSection({ type, label, children, nodeCount }: GlassRoadmapSectionProps) {
  const config = sectionConfig[type];
  const isMobile = window.innerWidth < 768;

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: isMobile ? 'var(--spacing-6)' : 'var(--spacing-8)', // 20px mobile section spacing
      }}
    >
      {/* Section Header - Bold Pill Style with Glass Effect */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          padding: isMobile ? '12px 16px' : '12px 20px', // 12-16px vertical padding
          marginBottom: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)', // 12-16px spacing
          marginLeft: isMobile ? '0' : '0',
          marginRight: isMobile ? '0' : '0',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: isMobile ? '12px' : '14px',
          boxShadow: `
            0 2px 12px rgba(0, 0, 0, 0.06),
            0 8px 24px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 0 0 1px ${config.color}20
          `,
          border: `1.5px solid ${config.color}40`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient overlay for depth */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Icon Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            borderRadius: '8px',
            backgroundColor: config.bgColor,
            color: config.color,
            position: 'relative',
          }}
        >
          {config.icon}
        </div>

        {/* Label - Bold and Clear */}
        <span
          style={{
            fontWeight: 'var(--font-weight-semibold)', // Stronger hierarchy
            color: 'var(--foreground)',
            fontSize: isMobile ? '16px' : '18px', // 16-18px for section titles
            lineHeight: '1.3',
            position: 'relative',
          }}
        >
          {label}
        </span>

        {/* Node Count Badge - More Prominent */}
        {nodeCount !== undefined && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 'var(--font-weight-semibold)',
              color: config.color,
              backgroundColor: config.bgColor,
              padding: '4px 10px',
              borderRadius: 'var(--radius)',
              marginLeft: 'auto', // Push to right
              position: 'relative',
            }}
          >
            {nodeCount}
          </span>
        )}
      </div>

      {/* Nodes Container - Consistent 8-point grid spacing */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '12px' : 'var(--spacing-4)', // 12px mobile, 16px desktop
        }}
      >
        {children}
      </div>
    </div>
  );
}