/**
 * Enhanced Roadmap Node Card
 * Interactive node with AGI integration, hover effects, and expansion
 * Uses design system CSS variables and colors (blues, greens, yellows, reds only)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Lock,
  Sparkles,
  Clock,
  Zap,
  ChevronRight,
  Play,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from '../ui/button';

export type NodeState = 
  | 'completed'
  | 'active'
  | 'available'
  | 'recommended'
  | 'blocked'
  | 'locked'
  | 'agi-suggested';

interface EnhancedNodeCardProps {
  id: string;
  title: string;
  description?: string;
  state: NodeState;
  xp: number;
  timeEstimate?: string;
  icon?: React.ReactNode;
  color?: string;
  aiGenerated?: boolean;
  aiHalo?: boolean;
  progress?: number;
  onClick?: () => void;
  onAskAGI?: () => void;
  onStart?: () => void;
}

export function EnhancedNodeCard({
  id,
  title,
  description,
  state,
  xp,
  timeEstimate,
  icon,
  color = '#2b7fff',
  aiGenerated = false,
  aiHalo = false,
  progress,
  onClick,
  onAskAGI,
  onStart,
}: EnhancedNodeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const getStateConfig = () => {
    switch (state) {
      case 'completed':
        return {
          bgGradient: 'linear-gradient(135deg, rgba(0, 167, 61, 0.15), rgba(0, 167, 61, 0.08))',
          borderColor: '#00a73d',
          icon: <CheckCircle2 className="size-5" />,
          iconColor: '#00a73d',
          textColor: 'var(--foreground)',
          glowColor: 'rgba(0, 167, 61, 0.3)',
        };
      case 'active':
        return {
          bgGradient: 'linear-gradient(135deg, rgba(43, 127, 255, 0.15), rgba(43, 127, 255, 0.08))',
          borderColor: '#2b7fff',
          icon: <Play className="size-5" />,
          iconColor: '#2b7fff',
          textColor: 'var(--foreground)',
          glowColor: 'rgba(43, 127, 255, 0.3)',
        };
      case 'recommended':
      case 'agi-suggested':
        return {
          bgGradient: 'linear-gradient(135deg, rgba(255, 224, 32, 0.15), rgba(255, 224, 32, 0.08))',
          borderColor: '#ffe020',
          icon: <Sparkles className="size-5" />,
          iconColor: '#ffe020',
          textColor: 'var(--foreground)',
          glowColor: 'rgba(255, 224, 32, 0.3)',
        };
      case 'blocked':
        return {
          bgGradient: 'linear-gradient(135deg, rgba(255, 79, 80, 0.1), rgba(255, 79, 80, 0.05))',
          borderColor: '#ff4f50',
          icon: <AlertCircle className="size-5" />,
          iconColor: '#ff4f50',
          textColor: 'var(--muted-foreground)',
          glowColor: 'rgba(255, 79, 80, 0.2)',
        };
      case 'locked':
        return {
          bgGradient: 'linear-gradient(135deg, var(--muted) 0%, var(--muted) 100%)',
          borderColor: 'var(--border)',
          icon: <Lock className="size-5" />,
          iconColor: 'var(--muted-foreground)',
          textColor: 'var(--muted-foreground)',
          glowColor: 'rgba(0, 0, 0, 0.1)',
        };
      default: // available
        return {
          bgGradient: 'linear-gradient(135deg, var(--card) 0%, var(--card) 100%)',
          borderColor: 'rgba(43, 127, 255, 0.3)',
          icon: <Circle className="size-5" />,
          iconColor: 'var(--muted-foreground)',
          textColor: 'var(--foreground)',
          glowColor: 'rgba(43, 127, 255, 0.15)',
        };
    }
  };

  const config = getStateConfig();

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* AGI Halo Effect */}
      <AnimatePresence>
        {(aiHalo || state === 'agi-suggested' || state === 'recommended') && (
          <motion.div
            className="absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`,
              filter: 'blur(16px)',
              borderRadius: 'var(--radius-xl)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.6, 1, 0.6],
              scale: [0.95, 1.05, 0.95],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Card */}
      <motion.div
        className="relative cursor-pointer overflow-hidden"
        style={{
          background: config.bgGradient,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${config.borderColor}`,
          boxShadow: isHovered
            ? `0 12px 32px ${config.glowColor}, inset 0 1px 2px rgba(255, 255, 255, 0.5)`
            : `0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
          minWidth: '200px',
          maxWidth: '240px',
          borderRadius: 'var(--radius-xl)',
        }}
        onClick={onClick}
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Liquid Glass Highlight */}
        <div
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          }}
        />

        {/* Content */}
        <div className="relative z-10" style={{ padding: 'var(--spacing-4)' }}>
          {/* Header */}
          <div className="flex items-start justify-between" style={{ marginBottom: 'var(--spacing-3)' }}>
            <div
              className="size-10 flex items-center justify-center flex-shrink-0"
              style={{
                background: `${config.iconColor}20`,
                border: `1px solid ${config.iconColor}40`,
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {React.cloneElement(config.icon, { style: { color: config.iconColor } })}
            </div>

            {/* XP Badge */}
            <div
              className="px-2 py-1 rounded-full flex items-center"
              style={{
                background: 'rgba(255, 224, 32, 0.2)',
                border: '1px solid rgba(255, 224, 32, 0.4)',
                gap: 'var(--spacing-1)',
              }}
            >
              <Zap className="size-3" style={{ color: '#ffe020' }} />
              <span className="text-xs font-semibold" style={{ color: '#ffe020' }}>
                +{xp}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 
            className="text-sm leading-tight"
            style={{ 
              color: config.textColor,
              marginBottom: 'var(--spacing-2)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p 
              className="text-xs leading-relaxed text-muted-foreground"
              style={{ marginBottom: 'var(--spacing-3)' }}
            >
              {description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center text-xs text-muted-foreground" style={{ gap: 'var(--spacing-3)' }}>
            {timeEstimate && (
              <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
                <Clock className="size-3" />
                <span>{timeEstimate}</span>
              </div>
            )}
            {aiGenerated && (
              <div className="flex items-center" style={{ gap: 'var(--spacing-1)', color: '#ffe020' }}>
                <Sparkles className="size-3" />
                <span>AI</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {progress !== undefined && progress > 0 && (
            <div style={{ marginTop: 'var(--spacing-3)' }}>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${config.borderColor}, ${config.iconColor})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs mt-1 text-right text-muted-foreground">
                {progress}%
              </p>
            </div>
          )}

          {/* Hover Actions */}
          <AnimatePresence>
            {isHovered && state !== 'locked' && state !== 'blocked' && (
              <motion.div
                style={{ marginTop: 'var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {state === 'active' && onStart && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart();
                    }}
                    style={{
                      background: `linear-gradient(135deg, ${config.borderColor}, ${config.iconColor})`,
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <Play className="size-3 mr-1" />
                    Continue
                  </Button>
                )}
                
                {onAskAGI && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAGI();
                    }}
                    style={{
                      borderColor: '#ffe020',
                      color: '#ffe020',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <Sparkles className="size-3 mr-1" />
                    Ask AGI
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shimmer Animation for AGI-working state */}
        {state === 'agi-suggested' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}