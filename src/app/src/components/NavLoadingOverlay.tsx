import React from 'react';

interface NavLoadingOverlayProps {
  isMobile?: boolean;
}

export function NavLoadingOverlay({ isMobile = false }: NavLoadingOverlayProps) {
  if (isMobile) {
    // Mobile: Loading overlay for bottom navigation
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'var(--background)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: `1px solid var(--border)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
          {/* 5 skeleton items for bottom nav */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-1)',
                width: '60px',
              }}
            >
              {/* Icon skeleton */}
              <div
                className="nav-skeleton-pulse"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--muted)',
                  animation: `navPulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
              {/* Label skeleton */}
              <div
                className="nav-skeleton-pulse"
                style={{
                  width: '48px',
                  height: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--muted)',
                  animation: `navPulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.1 + 0.05}s`,
                }}
              />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes navPulse {
            0%, 100% {
              opacity: 0.4;
            }
            50% {
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    );
  }

  // Desktop: Loading overlay for sidebar navigation
  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--sidebar)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--spacing-4)',
        gap: 'var(--spacing-2)',
        zIndex: 10,
      }}
    >
      {/* Logo skeleton */}
      <div 
        style={{
          marginBottom: 'var(--spacing-4)',
          padding: 'var(--spacing-2)',
        }}
      >
        <div
          className="nav-skeleton-pulse"
          style={{
            width: '120px',
            height: '32px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--muted)',
            animation: 'navPulse 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Navigation items skeleton */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div 
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            padding: 'var(--spacing-3)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {/* Icon skeleton */}
          <div
            className="nav-skeleton-pulse"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--muted)',
              animation: `navPulse 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.08}s`,
              flexShrink: 0,
            }}
          />
          {/* Label skeleton */}
          <div
            className="nav-skeleton-pulse"
            style={{
              height: '16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--muted)',
              animation: `navPulse 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.08 + 0.04}s`,
              flex: 1,
              maxWidth: `${Math.random() * 40 + 60}%`, // Random widths for variety
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes navPulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
