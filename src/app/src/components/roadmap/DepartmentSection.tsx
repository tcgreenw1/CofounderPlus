import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DepartmentSectionProps {
  id: string;
  title: string;
  color: string;
  icon?: React.ReactNode;
  taskCount: number;
  completedCount: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export function DepartmentSection({
  id,
  title,
  color,
  icon,
  taskCount,
  completedCount,
  isCollapsed = true,
  onToggle,
  children,
}: DepartmentSectionProps) {
  const [localCollapsed, setLocalCollapsed] = useState(isCollapsed);
  
  const collapsed = onToggle ? isCollapsed : localCollapsed;
  const handleToggle = onToggle || (() => setLocalCollapsed(!localCollapsed));

  return (
    <div
      className="w-full overflow-hidden transition-all duration-300"
      style={{
        borderRadius: 'var(--radius-xl, 16px)',
        background: 'var(--card, rgba(255, 255, 255, 0.95))',
        backdropFilter: 'blur(var(--blur-xl, 40px))',
        WebkitBackdropFilter: 'blur(var(--blur-xl, 40px))',
        border: '2px solid var(--border, rgba(226, 232, 240, 0.8))',
        boxShadow: collapsed 
          ? '0 2px 8px rgba(0, 0, 0, 0.06)' 
          : '0 8px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Department Header - Always Visible */}
      <button
        onClick={handleToggle}
        className="w-full px-4 py-4 flex items-center gap-3 transition-all duration-200 active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          borderBottom: collapsed ? 'none' : `2px solid ${color}30`,
        }}
      >
        {/* Expand/Collapse Icon */}
        <motion.div
          animate={{ rotate: collapsed ? 0 : 90 }}
          transition={{ duration: 0.12, ease: 'easeInOut' }}
          style={{
            width: 'var(--size-6, 24px)',
            height: 'var(--size-6, 24px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md, 8px)',
            background: collapsed ? 'var(--muted, rgba(148, 163, 184, 0.1))' : `${color}20`,
          }}
        >
          <ChevronRight
            className="size-4"
            style={{ color: collapsed ? 'var(--muted-foreground, #94a3b8)' : color }}
          />
        </motion.div>

        {/* Department Icon */}
        {icon && (
          <div
            className="flex items-center justify-center"
            style={{
              width: 'var(--size-10, 40px)',
              height: 'var(--size-10, 40px)',
              borderRadius: 'var(--radius-lg, 12px)',
              background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
              border: `2px solid ${color}30`,
            }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        )}

        {/* Department Title */}
        <div className="flex-1 text-left">
          <h3
            style={{
              fontSize: 'var(--text-lg, 18px)',
              fontWeight: 'var(--font-bold, 700)',
              color: 'var(--foreground, #1e293b)',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h3>
        </div>

        {/* Task Counter Badge */}
        <div
          className="px-3 py-1 flex items-center gap-1.5"
          style={{
            borderRadius: 'var(--radius-full, 9999px)',
            background: `linear-gradient(135deg, ${color}20 0%, ${color}12 100%)`,
            border: `1.5px solid ${color}40`,
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-sm, 14px)',
              fontWeight: 'var(--font-bold, 700)',
              color,
            }}
          >
            {completedCount}
          </span>
          <span
            style={{
              fontSize: 'var(--text-sm, 14px)',
              fontWeight: 'var(--font-semibold, 600)',
              color: 'var(--muted-foreground, #94a3b8)',
            }}
          >
            / {taskCount}
          </span>
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-3 py-3 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
