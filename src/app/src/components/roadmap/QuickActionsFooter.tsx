/**
 * Quick Actions Footer
 * Floating bottom bar with quick access buttons
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Trophy, 
  Download, 
  Plus,
  TrendingUp,
  Target
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'energy';
}

interface QuickActionsFooterProps {
  actions?: QuickAction[];
  onQuickWins?: () => void;
  onMastery?: () => void;
  onExport?: () => void;
  onAddNode?: () => void;
}

export function QuickActionsFooter({
  actions,
  onQuickWins,
  onMastery,
  onExport,
  onAddNode,
}: QuickActionsFooterProps) {
  const defaultActions: QuickAction[] = [
    {
      id: 'quick-wins',
      label: 'Quick Wins',
      icon: <Zap className="size-4" />,
      onClick: onQuickWins || (() => {}),
      variant: 'energy',
    },
    {
      id: 'mastery',
      label: 'Mastery',
      icon: <Trophy className="size-4" />,
      onClick: onMastery || (() => {}),
      variant: 'success',
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="size-4" />,
      onClick: onExport || (() => {}),
    },
    {
      id: 'add-node',
      label: 'Add Node',
      icon: <Plus className="size-4" />,
      onClick: onAddNode || (() => {}),
      variant: 'primary',
    },
  ];

  const displayActions = actions || defaultActions;

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div
        className="flex items-center gap-3 px-6 py-3 rounded-2xl"
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
        {displayActions.map((action, index) => (
          <React.Fragment key={action.id}>
            {index > 0 && (
              <div
                className="w-px h-8"
                style={{
                  background: 'linear-gradient(180deg, transparent, var(--sidebar-border), transparent)',
                }}
              />
            )}
            <QuickActionButton
              label={action.label}
              icon={action.icon}
              onClick={action.onClick}
              variant={action.variant}
            />
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'energy';
}

function QuickActionButton({ 
  label, 
  icon, 
  onClick, 
  variant = 'default' 
}: QuickActionButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'linear-gradient(135deg, rgba(0, 224, 255, 0.15), rgba(75, 0, 255, 0.1))',
          hoverBg: 'linear-gradient(135deg, rgba(0, 224, 255, 0.25), rgba(75, 0, 255, 0.2))',
          color: 'var(--primary)',
          icon: 'var(--primary)',
        };
      case 'success':
        return {
          bg: 'linear-gradient(135deg, rgba(108, 255, 108, 0.15), rgba(108, 255, 108, 0.1))',
          hoverBg: 'linear-gradient(135deg, rgba(108, 255, 108, 0.25), rgba(108, 255, 108, 0.2))',
          color: 'var(--success)',
          icon: 'var(--success)',
        };
      case 'energy':
        return {
          bg: 'linear-gradient(135deg, rgba(255, 207, 0, 0.15), rgba(255, 207, 0, 0.1))',
          hoverBg: 'linear-gradient(135deg, rgba(255, 207, 0, 0.25), rgba(255, 207, 0, 0.2))',
          color: 'var(--energy-foreground)',
          icon: 'var(--energy)',
        };
      default:
        return {
          bg: 'rgba(248, 250, 252, 0.6)',
          hoverBg: 'rgba(248, 250, 252, 0.9)',
          color: 'var(--foreground)',
          icon: 'var(--muted-foreground)',
        };
    }
  };

  const style = getVariantStyle();

  return (
    <motion.button
      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200"
      onClick={onClick}
      style={{
        background: style.bg,
        color: style.color,
      }}
      whileHover={{ 
        scale: 1.05,
        background: style.hoverBg,
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div style={{ color: style.icon }}>
        {icon}
      </div>
      <span className="text-sm font-semibold whitespace-nowrap">
        {label}
      </span>
    </motion.button>
  );
}