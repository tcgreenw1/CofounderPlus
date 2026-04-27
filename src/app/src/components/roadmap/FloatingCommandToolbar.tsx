/**
 * Floating Command Toolbar
 * VisionOS-inspired glass command tray with icon-only buttons
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles,
  Settings,
  Trophy
} from 'lucide-react';

interface ToolbarButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'energy';
}

interface FloatingCommandToolbarProps {
  onAGI?: () => void;
  onMastery?: () => void;
  onCofounderSettings?: () => void;
  customButtons?: ToolbarButton[];
}

export function FloatingCommandToolbar({
  onAGI,
  onMastery,
  onCofounderSettings,
  customButtons = [],
}: FloatingCommandToolbarProps) {
  const defaultButtons: ToolbarButton[] = [
    {
      id: 'mastery',
      icon: <Trophy className="size-5" />,
      label: 'Mastery Level',
      onClick: onMastery || (() => {}),
      variant: 'energy' as const,
    },
    {
      id: 'agi',
      icon: <Sparkles className="size-5" />,
      label: 'Cofounder',
      onClick: onAGI || (() => {}),
      variant: 'primary' as const,
    },
    {
      id: 'cofounder',
      icon: <Settings className="size-5" />,
      label: 'Cofounder Settings',
      onClick: () => {
        console.log('🔧 Cofounder Settings button clicked');
        if (onCofounderSettings) {
          console.log('🔧 Calling onCofounderSettings handler');
          onCofounderSettings();
        } else {
          console.warn('⚠️ onCofounderSettings handler not provided');
        }
      },
    },
  ];

  const buttons = [...defaultButtons, ...customButtons];

  const getButtonStyle = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(43, 127, 255, 0.1))',
          color: '#2b7fff',
          hoverBg: 'linear-gradient(135deg, rgba(43, 127, 255, 0.25), rgba(43, 127, 255, 0.2))',
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, rgba(0, 167, 61, 0.15), rgba(0, 167, 61, 0.1))',
          color: '#00a73d',
          hoverBg: 'linear-gradient(135deg, rgba(0, 167, 61, 0.25), rgba(0, 167, 61, 0.2))',
        };
      case 'energy':
        return {
          background: 'linear-gradient(135deg, rgba(255, 224, 32, 0.15), rgba(255, 224, 32, 0.1))',
          color: '#ffe020',
          hoverBg: 'linear-gradient(135deg, rgba(255, 224, 32, 0.25), rgba(255, 224, 32, 0.2))',
        };
      default:
        return {
          background: 'rgba(248, 250, 252, 0.6)',
          color: 'var(--foreground)',
          hoverBg: 'rgba(248, 250, 252, 0.9)',
        };
    }
  };

  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 z-50 hidden sm:block"
      style={{
        top: 'max(env(safe-area-inset-top) + 24px, 24px)',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div
        className="flex items-center gap-1 p-2 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(40px)',
          border: '1px solid var(--sidebar-border)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.12),
            inset 0 1px 2px rgba(255, 255, 255, 0.5)
          `,
        }}
      >
        {buttons.map((button, index) => (
          <React.Fragment key={button.id}>
            {index > 0 && index % 3 === 0 && (
              <div
                className="w-px h-8 mx-1"
                style={{
                  background: 'linear-gradient(180deg, transparent, var(--sidebar-border), transparent)',
                }}
              />
            )}
            
            <ToolbarIconButton
              icon={button.icon}
              label={button.label}
              onClick={button.onClick}
              variant={button.variant}
            />
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

interface ToolbarIconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'energy';
}

function ToolbarIconButton({ 
  icon, 
  label, 
  onClick, 
  variant = 'default' 
}: ToolbarIconButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const style = getButtonStyle(variant);

  return (
    <motion.button
      className="relative group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className="size-10 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{
          background: isHovered ? style.hoverBg : style.background,
          color: style.color,
        }}
      >
        {icon}
      </div>

      {/* Tooltip */}
      {isHovered && (
        <motion.div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span className="text-xs font-medium text-white">{label}</span>
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '5px solid rgba(0, 0, 0, 0.9)',
            }}
          />
        </motion.div>
      )}
    </motion.button>
  );
}

function getButtonStyle(variant?: string) {
  switch (variant) {
    case 'primary':
      return {
        background: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(43, 127, 255, 0.1))',
        color: '#2b7fff',
        hoverBg: 'linear-gradient(135deg, rgba(43, 127, 255, 0.25), rgba(43, 127, 255, 0.2))',
      };
    case 'success':
      return {
        background: 'linear-gradient(135deg, rgba(0, 167, 61, 0.15), rgba(0, 167, 61, 0.1))',
        color: '#00a73d',
        hoverBg: 'linear-gradient(135deg, rgba(0, 167, 61, 0.25), rgba(0, 167, 61, 0.2))',
      };
    case 'energy':
      return {
        background: 'linear-gradient(135deg, rgba(255, 224, 32, 0.15), rgba(255, 224, 32, 0.1))',
        color: '#ffe020',
        hoverBg: 'linear-gradient(135deg, rgba(255, 224, 32, 0.25), rgba(255, 224, 32, 0.2))',
      };
    default:
      return {
        background: 'rgba(248, 250, 252, 0.6)',
        color: 'var(--foreground)',
        hoverBg: 'rgba(248, 250, 252, 0.9)',
      };
  }
}