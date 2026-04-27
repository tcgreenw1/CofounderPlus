import React from 'react';
import { LayoutDashboard, Map, Zap, Target, TrendingUp, Users, Settings, X } from 'lucide-react';

/**
 * Glass Sidebar Navigation
 * 
 * Floating glass slab with Apple Liquid Glass aesthetics
 * Clean, minimal, with consistent spacing
 * Uses CSS variables from design system
 */

interface GlassSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  count?: number;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Map className="w-5 h-5" />, label: 'Roadmap', path: '/roadmap' },
  { icon: <Zap className="w-5 h-5" />, label: 'Quick Wins', path: '/quick-wins' },
  { icon: <Target className="w-5 h-5" />, label: 'Goals', path: '/goals' },
  { icon: <TrendingUp className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
  { icon: <Users className="w-5 h-5" />, label: 'Team', path: '/team' },
  { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
];

export function GlassSidebar({ isOpen, onClose, currentPath = '/roadmap' }: GlassSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 40,
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      {/* Glass Sidebar */}
      <div
        style={{
          position: 'fixed',
          left: isOpen ? '20px' : '-300px',
          top: '20px',
          bottom: '20px',
          width: '260px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '24px 16px',
          boxShadow: `
            0 16px 48px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(0, 0, 0, 0.08),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1)
          `,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 50,
          transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="dark:bg-[rgba(0,0,0,0.7)] dark:border-[rgba(255,255,255,0.1)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <h2
            style={{
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              fontSize: '18px',
            }}
          >
            Cofounder+
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--foreground)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            
            return (
              <a
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'rgba(43, 127, 255, 0.1)' : 'transparent',
                  color: isActive ? '#2b7fff' : 'var(--foreground)',
                  fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                  fontSize: '15px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ display: 'flex', opacity: isActive ? 1 : 0.7 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.count && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--muted-foreground)',
                      backgroundColor: 'var(--muted)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="px-2">
            <p
              style={{
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                fontWeight: 'var(--font-weight-normal)',
              }}
            >
              Cofounder+ v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}