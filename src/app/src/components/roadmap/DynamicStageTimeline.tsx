/**
 * Dynamic Stage Timeline
 * Interactive glass timeline with floating orbs and smooth animations
 * Uses design system colors (blues, greens, yellows, reds only)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Check, Lock, Sparkles } from 'lucide-react';

interface Stage {
  id: string;
  number: number;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'locked';
  progress?: number;
}

interface DynamicStageTimelineProps {
  stages: Stage[];
  onStageClick?: (stageId: string) => void;
  agiPullEnabled?: boolean;
}

export function DynamicStageTimeline({ 
  stages, 
  onStageClick,
  agiPullEnabled = false 
}: DynamicStageTimelineProps) {
  const totalStages = stages.length;
  const currentStageIndex = stages.findIndex(s => s.status === 'current');

  return (
    <div className="relative w-full" style={{ padding: 'var(--spacing-8) 0' }}>
      {/* Background Line */}
      <div
        className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2"
        style={{
          background: 'linear-gradient(90deg, rgba(43, 127, 255, 0.1), rgba(43, 127, 255, 0.05))',
          backdropFilter: 'blur(10px)',
          borderRadius: '999px',
        }}
      />

      {/* Progress Line */}
      <motion.div
        className="absolute top-1/2 left-0 h-1 -translate-y-1/2"
        style={{
          background: 'linear-gradient(90deg, #00a73d, #2b7fff)',
          borderRadius: '999px',
          boxShadow: '0 0 16px rgba(43, 127, 255, 0.5)',
        }}
        initial={{ width: 0 }}
        animate={{
          width: `${(currentStageIndex / (totalStages - 1)) * 100}%`,
        }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Stage Orbs */}
      <div className="relative flex justify-between items-center">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed';
          const isCurrent = stage.status === 'current';
          const isUpcoming = stage.status === 'upcoming';
          const isLocked = stage.status === 'locked';

          const orbConfig = {
            completed: {
              size: 48,
              bg: 'linear-gradient(135deg, #00a73d, rgba(0, 167, 61, 0.9))',
              border: '3px solid rgba(0, 167, 61, 0.5)',
              icon: <Check className="size-5 text-white" strokeWidth={3} />,
              glow: 'rgba(0, 167, 61, 0.4)',
            },
            current: {
              size: 56,
              bg: 'linear-gradient(135deg, #2b7fff, rgba(43, 127, 255, 0.9))',
              border: '3px solid rgba(43, 127, 255, 0.6)',
              icon: <Sparkles className="size-6 text-white" strokeWidth={2.5} />,
              glow: 'rgba(43, 127, 255, 0.6)',
            },
            upcoming: {
              size: 40,
              bg: 'linear-gradient(135deg, var(--card), var(--card))',
              border: '2px solid rgba(43, 127, 255, 0.3)',
              icon: <span className="text-sm font-semibold text-muted-foreground">{stage.number}</span>,
              glow: 'rgba(43, 127, 255, 0.2)',
            },
            locked: {
              size: 40,
              bg: 'linear-gradient(135deg, var(--muted), var(--muted))',
              border: '2px solid var(--border)',
              icon: <Lock className="size-4 text-muted-foreground" />,
              glow: 'rgba(0, 0, 0, 0.1)',
            },
          };

          const config = orbConfig[stage.status];

          return (
            <motion.div
              key={stage.id}
              className="relative flex flex-col items-center cursor-pointer"
              onClick={() => !isLocked && onStageClick?.(stage.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!isLocked ? { scale: 1.1 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
            >
              {/* Glow Effect */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: config.size + 20,
                  height: config.size + 20,
                  background: `radial-gradient(circle, ${config.glow}, transparent 70%)`,
                  filter: 'blur(12px)',
                }}
                animate={isCurrent ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Orb */}
              <motion.div
                className="relative rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  width: config.size,
                  height: config.size,
                  background: config.bg,
                  backdropFilter: 'blur(20px)',
                  border: config.border,
                  boxShadow: `0 8px 24px ${config.glow}`,
                }}
                animate={isCurrent ? {
                  rotate: [0, 360],
                } : {}}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {/* Glass Highlight */}
                <div
                  className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%)',
                    borderRadius: '50% 50% 0 0',
                  }}
                />

                {/* Icon/Number */}
                <div className="relative z-10">
                  {config.icon}
                </div>

                {/* Progress Ring (for current stage) */}
                {isCurrent && stage.progress !== undefined && (
                  <svg
                    className="absolute inset-0"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx={config.size / 2}
                      cy={config.size / 2}
                      r={(config.size - 8) / 2}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx={config.size / 2}
                      cy={config.size / 2}
                      r={(config.size - 8) / 2}
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: `0 ${2 * Math.PI * ((config.size - 8) / 2)}` }}
                      animate={{
                        strokeDasharray: `${(stage.progress / 100) * 2 * Math.PI * ((config.size - 8) / 2)} ${2 * Math.PI * ((config.size - 8) / 2)}`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                )}
              </motion.div>

              {/* Label */}
              <motion.div
                style={{ marginTop: 'var(--spacing-4)' }}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <p
                  className="text-sm whitespace-nowrap"
                  style={{
                    color: isCurrent ? '#2b7fff' : isCompleted ? '#00a73d' : 'var(--muted-foreground)',
                    fontWeight: 'var(--font-weight-semibold)',
                  }}
                >
                  {stage.label}
                </p>
                {isCurrent && stage.progress !== undefined && (
                  <p className="text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-1)' }}>
                    {stage.progress}% complete
                  </p>
                )}
              </motion.div>

              {/* AGI Pull Indicator */}
              {agiPullEnabled && isCurrent && (
                <motion.div
                  className="absolute -top-8 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div
                    className="px-2 py-1 rounded-full text-xs whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(135deg, #ffe020, #2b7fff)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(255, 224, 32, 0.4)',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    AGI Pulling Forward
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}