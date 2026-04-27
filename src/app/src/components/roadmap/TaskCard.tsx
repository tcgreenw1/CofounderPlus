import React from 'react';
import { Check, Sparkles, GripVertical } from 'lucide-react';
import { motion } from 'motion/react';

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  timeEstimate?: string;
  status: 'unlocked' | 'completed'; // Removed 'locked' - tasks are never locked
  departmentColor: string;
  isAIGenerated?: boolean;
  isDragging?: boolean;
  onCheck?: () => void;
  onClick?: () => void;
  autoCompleted?: boolean;
  autoCompletedReason?: string;
}

export function TaskCard({
  id,
  title,
  description,
  xpReward,
  timeEstimate,
  status,
  departmentColor,
  isAIGenerated = false,
  isDragging = false,
  onCheck,
  onClick,
  autoCompleted = false,
  autoCompletedReason = '',
}: TaskCardProps) {
  const isCompleted = status === 'completed';

  return (
    <div
      className="relative w-full transition-all duration-200"
      style={{
        opacity: isCompleted ? 0.7 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div
        className="w-full px-3 py-3 flex items-start gap-3 transition-all duration-200 active:scale-[0.99]"
        style={{
          borderRadius: 'var(--radius-lg, 12px)',
          background: isCompleted
            ? `linear-gradient(135deg, ${departmentColor}08 0%, ${departmentColor}05 100%)`
            : 'var(--card, rgba(255, 255, 255, 0.98))',
          backdropFilter: 'blur(var(--blur-md, 16px))',
          WebkitBackdropFilter: 'blur(var(--blur-md, 16px))',
          border: isCompleted
            ? `2px solid ${departmentColor}30`
            : `2px solid ${departmentColor}20`,
          boxShadow: isDragging
            ? `0 8px 24px ${departmentColor}40`
            : '0 2px 8px rgba(0, 0, 0, 0.06)',
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        {/* Check Circle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onCheck) onCheck();
          }}
          className="flex-shrink-0 transition-all duration-200 active:scale-90"
          style={{
            width: 'var(--size-6, 24px)',
            height: 'var(--size-6, 24px)',
            borderRadius: 'var(--radius-full, 9999px)',
            background: isCompleted
              ? `linear-gradient(135deg, ${departmentColor} 0%, ${departmentColor}dd 100%)`
              : 'transparent',
            border: isCompleted
              ? 'none'
              : `2px solid ${departmentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isCompleted ? `0 2px 8px ${departmentColor}40` : 'none',
          }}
        >
          {isCompleted && (
            <Check
              className="size-3.5"
              style={{ color: 'var(--primary-foreground, #ffffff)' }}
            />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <div className="flex items-start gap-2 mb-1">
            <h4
              style={{
                fontSize: 'var(--text-base, 16px)',
                fontWeight: 'var(--font-semibold, 600)',
                color: isCompleted
                  ? 'var(--muted-foreground, #94a3b8)'
                  : 'var(--foreground, #1e293b)',
                textDecoration: isCompleted ? 'line-through' : 'none',
                textDecorationThickness: '1.5px',
                lineHeight: '1.4',
              }}
            >
              {title}
            </h4>
            
            {/* AI Generated Badge */}
            {isAIGenerated && (
              <div
                className="flex-shrink-0 px-1.5 py-0.5 flex items-center gap-1"
                style={{
                  borderRadius: 'var(--radius-md, 8px)',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.12) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Sparkles
                  className="size-2.5"
                  style={{ color: 'var(--purple, #8b5cf6)' }}
                />
                <span
                  style={{
                    fontSize: 'var(--text-xs, 11px)',
                    fontWeight: 'var(--font-bold, 700)',
                    color: 'var(--purple, #8b5cf6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Tool
                </span>
              </div>
            )}
          </div>

          {/* Task Description */}
          {description && (
            <p
              className="mb-2"
              style={{
                fontSize: 'var(--text-sm, 14px)',
                fontWeight: 'var(--font-normal, 400)',
                color: 'var(--muted-foreground, #64748b)',
                lineHeight: '1.5',
              }}
            >
              {description}
            </p>
          )}

          {/* Auto-Completed Badge - Show when task was auto-completed by Cofounder */}
          {autoCompleted && autoCompletedReason && (
            <div
              className="mb-2 px-2 py-1.5 flex items-start gap-2"
              style={{
                borderRadius: 'var(--radius-md, 8px)',
                background: 'linear-gradient(135deg, var(--success-soft, rgba(39, 209, 124, 0.1)) 0%, var(--success-soft, rgba(39, 209, 124, 0.05)) 100%)',
                border: '1px solid var(--success, rgba(39, 209, 124, 0.3))',
              }}
            >
              <Sparkles
                className="size-3.5 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--success, #27D17C)' }}
              />
              <span
                style={{
                  fontSize: 'var(--text-xs, 12px)',
                  fontWeight: 'var(--font-medium, 500)',
                  color: 'var(--success, #27D17C)',
                  lineHeight: '1.4',
                }}
              >
                Cofounder completed: {autoCompletedReason}
              </span>
            </div>
          )}

          {/* Task Metadata */}
          <div className="flex items-center gap-3">
            {/* XP Badge */}
            <div
              className="px-2 py-0.5 flex items-center gap-1"
              style={{
                borderRadius: 'var(--radius-md, 8px)',
                background: 'linear-gradient(135deg, var(--warning-glass, rgba(242, 201, 76, 0.15)) 0%, var(--warning-glass-alt, rgba(255, 220, 120, 0.12)) 100%)',
                border: '1px solid var(--warning, rgba(242, 201, 76, 0.4))',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xs, 11px)',
                  fontWeight: 'var(--font-bold, 700)',
                  color: 'var(--warning, #F2C94C)',
                }}
              >
                +{xpReward} XP
              </span>
            </div>

            {/* Time Estimate */}
            {timeEstimate && (
              <span
                style={{
                  fontSize: 'var(--text-xs, 11px)',
                  fontWeight: 'var(--font-medium, 500)',
                  color: 'var(--muted-foreground, #94a3b8)',
                }}
              >
                {timeEstimate}
              </span>
            )}
          </div>
        </div>

        {/* Drag Handle - Only for unlocked/completed tasks */}
        {status === 'unlocked' && (
          <div
            className="flex-shrink-0 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
            style={{
              width: 'var(--size-8, 32px)',
              height: 'var(--size-8, 32px)',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--muted-foreground, #94a3b8)',
            }}
          >
            <GripVertical className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}