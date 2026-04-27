import React from 'react';
import { Navigation, Share2, Sparkles, Save, Menu } from 'lucide-react';

/**
 * Glass Toolbar
 * 
 * Unified floating glass bar with icon-only buttons
 * Clean, minimal, Apple Liquid Glass design
 * Uses CSS variables from design system
 */

interface GlassToolbarProps {
  onRecenter?: () => void;
  onShare?: () => void;
  onAGI?: () => void;
  onSave?: () => void;
  onMenuToggle?: () => void;
  showMenu?: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}

export function GlassToolbar({
  onRecenter,
  onShare,
  onAGI,
  onSave,
  onMenuToggle,
  showMenu = true,
}: GlassToolbarProps) {
  const buttons: ToolbarButton[] = [
    { icon: <Navigation className="w-5 h-5" />, label: 'Recenter', onClick: onRecenter },
    { icon: <Share2 className="w-5 h-5" />, label: 'Share', onClick: onShare },
    { icon: <Sparkles className="w-5 h-5" />, label: 'AGI', onClick: onAGI, primary: true },
    { icon: <Save className="w-5 h-5" />, label: 'Save', onClick: onSave },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Menu Button (mobile) */}
      {showMenu && (
        <button
          onClick={onMenuToggle}
          className="dark:bg-[rgba(0,0,0,0.6)] dark:border-[rgba(255,255,255,0.1)]"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `
              0 8px 24px rgba(0, 0, 0, 0.1),
              0 2px 8px rgba(0, 0, 0, 0.06),
              inset 0 0 0 1px rgba(255, 255, 255, 0.08)
            `,
            cursor: 'pointer',
            color: 'var(--foreground)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `
              0 12px 32px rgba(0, 0, 0, 0.14),
              0 4px 12px rgba(0, 0, 0, 0.08),
              inset 0 0 0 1px rgba(255, 255, 255, 0.12)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `
              0 8px 24px rgba(0, 0, 0, 0.1),
              0 2px 8px rgba(0, 0, 0, 0.06),
              inset 0 0 0 1px rgba(255, 255, 255, 0.08)
            `;
          }}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Main Toolbar Glass Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px',
          boxShadow: `
            0 8px 24px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.06),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08)
          `,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {buttons.map((button, index) => (
          <React.Fragment key={button.label}>
            <button
              onClick={button.onClick}
              title={button.label}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: button.primary ? 'rgba(43, 127, 255, 0.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: button.primary ? '#2b7fff' : 'var(--foreground)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = button.primary 
                  ? 'rgba(43, 127, 255, 0.2)' 
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = button.primary 
                  ? 'rgba(43, 127, 255, 0.1)' 
                  : 'transparent';
              }}
            >
              {button.icon}
            </button>

            {/* Separator */}
            {index < buttons.length - 1 && (
              <div
                style={{
                  width: '1px',
                  height: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  margin: '0 4px',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}