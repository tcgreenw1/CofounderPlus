import React from 'react';
import { Sparkles, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ComingSoonOverlayProps {
  children: React.ReactNode;
}

export function ComingSoonOverlay({ children }: ComingSoonOverlayProps) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Content (clickable and visible but slightly dimmed) */}
      <div style={{ opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Coming Soon Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-4)',
          padding: 'var(--spacing-6)',
          background: 'var(--card)',
          border: '2px solid var(--primary)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(16px)',
          maxWidth: '90%',
          width: '400px'
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Sparkles
            style={{
              width: '32px',
              height: '32px',
              color: 'var(--primary)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
          {/* Glow effect */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              background: 'var(--primary)',
              opacity: 0.2,
              borderRadius: 'var(--radius-full)',
              filter: 'blur(16px)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Badge */}
        <Badge
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-bold)',
            padding: 'var(--spacing-1) var(--spacing-3)',
            borderRadius: 'var(--radius-full)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Coming Soon
        </Badge>

        {/* Title */}
        <h3
          style={{
            fontSize: '24px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            textAlign: 'center',
            margin: 0
          }}
        >
          Preview Mode
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: 'var(--font-weight-normal)',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
            lineHeight: '1.6',
            margin: 0,
            maxWidth: '300px'
          }}
        >
          This feature is currently in development. Explore the preview to see what we're building!
        </p>

        {/* Preview Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2) var(--spacing-3)',
            background: 'var(--muted)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--muted-foreground)'
          }}
        >
          <Eye style={{ width: '14px', height: '14px' }} />
          <span>Mock data for demonstration</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
