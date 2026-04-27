/**
 * Smart XP Bar
 * Intelligent progress bar with XP tracking and milestone highlights
 */

import React from 'react';
import { motion } from 'motion/react';
import { Zap, Trophy, Target, TrendingUp } from 'lucide-react';

interface Milestone {
  xp: number;
  label: string;
  icon?: React.ReactNode;
}

interface SmartXPBarProps {
  currentXP: number;
  totalXP: number;
  activeTasks: number;
  completedTasks: number;
  remainingTasks: number;
  milestones?: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
}

export function SmartXPBar({
  currentXP,
  totalXP,
  activeTasks,
  completedTasks,
  remainingTasks,
  milestones = [],
  onMilestoneClick,
}: SmartXPBarProps) {
  const progressPercentage = (currentXP / totalXP) * 100;

  const defaultMilestones: Milestone[] = milestones.length > 0 ? milestones : [
    { xp: totalXP * 0.25, label: 'Chapter 1', icon: <Target className="size-3" /> },
    { xp: totalXP * 0.5, label: 'Halfway', icon: <TrendingUp className="size-3" /> },
    { xp: totalXP * 0.75, label: 'Chapter 3', icon: <Target className="size-3" /> },
    { xp: totalXP, label: 'Complete!', icon: <Trophy className="size-3" /> },
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-20 z-50"
      style={{
        background: 'linear-gradient(180deg, rgba(255, 207, 0, 0.05), rgba(255, 207, 0, 0.15))',
        backdropFilter: 'blur(40px)',
        borderTop: '2px solid rgba(255, 207, 0, 0.3)',
        boxShadow: '0 -4px 24px rgba(255, 207, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
      }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="h-full px-8 flex items-center gap-6">
        {/* XP Icon & Stats */}
        <div className="flex items-center gap-4">
          <motion.div
            className="size-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.3), rgba(255, 207, 0, 0.2))',
              border: '2px solid rgba(255, 207, 0, 0.5)',
              boxShadow: '0 4px 16px rgba(255, 207, 0, 0.3)',
            }}
            animate={{
              boxShadow: [
                '0 4px 16px rgba(255, 207, 0, 0.3)',
                '0 4px 24px rgba(255, 207, 0, 0.5)',
                '0 4px 16px rgba(255, 207, 0, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="size-7" style={{ color: 'var(--energy)' }} />
          </motion.div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--energy)' }}>
              Total XP Earned
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--energy)' }}>
              {currentXP.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-px h-10"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(255, 207, 0, 0.4), transparent)',
          }}
        />

        {/* Task Stats */}
        <div className="flex items-center gap-6">
          <TaskStat label="Completed" value={completedTasks} color="var(--success)" />
          <TaskStat label="Active" value={activeTasks} color="var(--primary)" />
          <TaskStat label="Remaining" value={remainingTasks} color="var(--muted-foreground)" />
        </div>

        {/* Progress Bar */}
        <div className="flex-1 mx-8">
          <div className="space-y-2">
            {/* Bar with Milestones */}
            <div className="relative">
              {/* Background Bar */}
              <div
                className="h-3 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(255, 207, 0, 0.15)',
                  border: '1px solid rgba(255, 207, 0, 0.3)',
                }}
              >
                {/* Progress Fill */}
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, var(--energy), var(--success))',
                    boxShadow: '0 0 16px rgba(255, 207, 0, 0.5)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>

              {/* Milestone Markers */}
              <div className="absolute inset-0 flex items-center">
                {defaultMilestones.map((milestone, index) => {
                  const milestonePercentage = (milestone.xp / totalXP) * 100;
                  const isReached = currentXP >= milestone.xp;

                  return (
                    <motion.button
                      key={index}
                      className="absolute -translate-x-1/2 group"
                      style={{ left: `${milestonePercentage}%` }}
                      onClick={() => onMilestoneClick?.(milestone)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div
                        className="size-5 rounded-full flex items-center justify-center"
                        style={{
                          background: isReached
                            ? 'linear-gradient(135deg, var(--success), rgba(108, 255, 108, 0.8))'
                            : 'rgba(255, 255, 255, 0.9)',
                          border: isReached
                            ? '2px solid var(--success)'
                            : '2px solid rgba(255, 207, 0, 0.5)',
                          boxShadow: isReached
                            ? '0 2px 8px rgba(108, 255, 108, 0.4)'
                            : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {isReached ? (
                          <Trophy className="size-3 text-white" />
                        ) : (
                          <div className="size-2 rounded-full" style={{ background: 'var(--energy)' }} />
                        )}
                      </div>

                      {/* Tooltip */}
                      <div
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                          background: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <span className="text-xs font-medium text-white">
                          {milestone.label} • {milestone.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Progress Text */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold" style={{ color: 'var(--energy)' }}>
                Level Progress
              </span>
              <span className="font-bold" style={{ color: 'var(--energy)' }}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Estimated Completion */}
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Est. Completion
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--energy)' }}>
            {remainingTasks > 0 ? `${Math.ceil(remainingTasks / 2)} days` : 'Complete!'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface TaskStatProps {
  label: string;
  value: number;
  color: string;
}

function TaskStat({ label, value, color }: TaskStatProps) {
  return (
    <div className="text-center">
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
