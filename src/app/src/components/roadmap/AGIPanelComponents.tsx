import React from 'react';
import {
  Sparkles,
  X,
  Plus,
  ArrowUpDown,
  Trash2,
  Edit,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Lock,
  Unlock,
} from 'lucide-react';

/**
 * ============================================================================
 * AGI PANEL COMPONENTS
 * Right-side panel for AGI reasoning, insights, and changelog
 * ============================================================================
 */

/**
 * 1. AGIPanel / Root
 * Slide-out panel for AGI reasoning and insights
 * Width 380-420px, full viewport height, liquid glass styling (40px blur, 14% white overlay)
 * Slide-in from right-to-left
 */

interface AGIPanelRootProps {
  width?: number;
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function AGIPanelRoot({
  width = 400,
  isOpen = true,
  onClose,
  children,
  className = '',
}: AGIPanelRootProps) {
  return (
    <div
      className={`roadmap-panel flex flex-col gap-6 p-6 transition-transform duration-300 ${className}`}
      style={{
        width: `${width}px`,
        minHeight: '100vh',
        maxHeight: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.10) 100%)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderLeft: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.08), -4px 0 16px rgba(0, 0, 0, 0.04), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        zIndex: 40,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 2. AGIPanel / Header
 * Header with title "Cofounder AGI", subtitle "Reasoning & Insights", sparkline icon, and close button
 * Horizontal Auto Layout with 16px spacing
 */

interface AGIPanelHeaderProps {
  onClose?: () => void;
  className?: string;
}

export function AGIPanelHeader({
  onClose,
  className = '',
}: AGIPanelHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      {/* Left: Icon and Titles */}
      <div className="flex items-start gap-3">
        {/* Toy Box Pop Sparkline Icon */}
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.25) 0%, rgba(180, 170, 240, 0.2) 100%)',
            border: '1.5px solid rgba(108, 92, 231, 0.3)',
            boxShadow: '0 0 16px rgba(108, 92, 231, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          }}
        >
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>

        {/* Titles */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-900">
            Cofounder AGI
          </h2>
          <p className="text-sm text-slate-600 font-semibold">
            Reasoning & Insights
          </p>
        </div>
      </div>

      {/* Right: Glass Close Button */}
      <button
        onClick={onClose}
        className="roadmap-control-btn flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
        style={{
          background: 'rgba(148, 163, 184, 0.12)',
          border: '1.5px solid rgba(148, 163, 184, 0.25)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 6px rgba(148, 163, 184, 0.1)',
        }}
      >
        <X className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  );
}

/**
 * 3. AGIPanel / SummaryCard
 * Glass card with large reasoning text, small tag (cause), and soft glow underline
 * Vertical Auto Layout
 */

interface AGIPanelSummaryCardProps {
  reasoningText: string;
  causeTag: {
    label: string;
    type: 'conversion' | 'skipped-nodes' | 'mrr-milestone' | 'efficiency' | 'risk' | 'opportunity';
  };
  className?: string;
}

export function AGIPanelSummaryCard({
  reasoningText,
  causeTag,
  className = '',
}: AGIPanelSummaryCardProps) {
  const tagStyles = {
    conversion: {
      background: 'rgba(39, 209, 124, 0.12)',
      border: '1px solid rgba(39, 209, 124, 0.3)',
      color: '#1a8a52',
    },
    'skipped-nodes': {
      background: 'rgba(251, 191, 36, 0.12)',
      border: '1px solid rgba(251, 191, 36, 0.3)',
      color: '#d97706',
    },
    'mrr-milestone': {
      background: 'rgba(47, 128, 255, 0.12)',
      border: '1px solid rgba(47, 128, 255, 0.3)',
      color: '#1e5bb8',
    },
    efficiency: {
      background: 'rgba(39, 209, 124, 0.12)',
      border: '1px solid rgba(39, 209, 124, 0.3)',
      color: '#1a8a52',
    },
    risk: {
      background: 'rgba(235, 87, 87, 0.12)',
      border: '1px solid rgba(235, 87, 87, 0.3)',
      color: '#c93636',
    },
    opportunity: {
      background: 'rgba(108, 92, 231, 0.12)',
      border: '1px solid rgba(108, 92, 231, 0.3)',
      color: '#5b21b6',
    },
  };

  const tagStyle = tagStyles[causeTag.type];

  return (
    <div
      className={`p-5 rounded-xl space-y-4 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08) 0%, rgba(180, 170, 240, 0.06) 100%)',
        border: '1.5px solid rgba(108, 92, 231, 0.2)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 24px rgba(108, 92, 231, 0.12), 0 0 32px rgba(108, 92, 231, 0.06), inset 0 1px 3px rgba(255, 255, 255, 0.25)',
      }}
    >
      {/* Small Tag */}
      <div className="flex items-center gap-2">
        <div
          className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"
          style={tagStyle}
        >
          {causeTag.label}
        </div>
      </div>

      {/* Large Reasoning Text with Soft Glow Underline */}
      <div className="relative">
        <p
          className="text-base leading-relaxed font-semibold text-slate-800"
          style={{
            textShadow: '0 2px 8px rgba(108, 92, 231, 0.15)',
          }}
        >
          {reasoningText}
        </p>
        {/* Soft Glow Underline */}
        <div
          className="mt-3 h-0.5 rounded-full"
          style={{
            background: 'linear-gradient(90deg, rgba(108, 92, 231, 0.6) 0%, rgba(180, 170, 240, 0.4) 50%, rgba(108, 92, 231, 0.6) 100%)',
            boxShadow: '0 2px 12px rgba(108, 92, 231, 0.4), 0 0 24px rgba(108, 92, 231, 0.25)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * 4. AGIPanel / ChangeLogItem
 * Individual changelog entry with icon (type), node name, timestamp, and reason tag
 * Horizontal layout: left icon, right content
 */

interface AGIPanelChangeLogItemProps {
  type: 'insert' | 'reorder' | 'delete' | 'modify';
  nodeName: string;
  timestamp: string;
  reasonTag: {
    label: string;
    type: 'efficiency' | 'risk' | 'opportunity';
  };
  className?: string;
}

export function AGIPanelChangeLogItem({
  type,
  nodeName,
  timestamp,
  reasonTag,
  className = '',
}: AGIPanelChangeLogItemProps) {
  const typeConfig = {
    insert: {
      icon: <Plus className="w-4 h-4" />,
      background: 'rgba(39, 209, 124, 0.12)',
      border: 'rgba(39, 209, 124, 0.3)',
      iconColor: '#1a8a52',
    },
    reorder: {
      icon: <ArrowUpDown className="w-4 h-4" />,
      background: 'rgba(47, 128, 255, 0.12)',
      border: 'rgba(47, 128, 255, 0.3)',
      iconColor: '#1e5bb8',
    },
    delete: {
      icon: <Trash2 className="w-4 h-4" />,
      background: 'rgba(235, 87, 87, 0.12)',
      border: 'rgba(235, 87, 87, 0.3)',
      iconColor: '#c93636',
    },
    modify: {
      icon: <Edit className="w-4 h-4" />,
      background: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.3)',
      iconColor: '#d97706',
    },
  };

  const reasonStyles = {
    efficiency: {
      background: 'rgba(39, 209, 124, 0.1)',
      border: '1px solid rgba(39, 209, 124, 0.25)',
      color: '#1a8a52',
    },
    risk: {
      background: 'rgba(235, 87, 87, 0.1)',
      border: '1px solid rgba(235, 87, 87, 0.25)',
      color: '#c93636',
    },
    opportunity: {
      background: 'rgba(108, 92, 231, 0.1)',
      border: '1px solid rgba(108, 92, 231, 0.25)',
      color: '#5b21b6',
    },
  };

  const config = typeConfig[type];
  const reasonStyle = reasonStyles[reasonTag.type];

  return (
    <div
      className={`roadmap-control-btn flex items-start gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.01] ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.4)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Left: Icon */}
      <div
        className="flex-shrink-0 p-2 rounded-lg"
        style={{
          background: config.background,
          border: `1px solid ${config.border}`,
          color: config.iconColor,
        }}
      >
        {config.icon}
      </div>

      {/* Right: Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Node Name */}
        <div className="font-semibold text-sm text-slate-800 truncate">
          {nodeName}
        </div>

        {/* Timestamp and Reason Tag */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">
            {timestamp}
          </span>
          <span className="text-slate-400">•</span>
          <div
            className="px-2 py-0.5 rounded text-xs font-semibold"
            style={reasonStyle}
          >
            {reasonTag.label}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. AGIPanel / RecommendationItem
 * Glass card with priority badge, node name, category, explanation, and "Jump to" button
 * Vertical Auto Layout
 */

interface AGIPanelRecommendationItemProps {
  priority: 'high' | 'medium' | 'low';
  nodeName: string;
  category: string;
  explanation: string;
  onJumpTo?: () => void;
  className?: string;
}

export function AGIPanelRecommendationItem({
  priority,
  nodeName,
  category,
  explanation,
  onJumpTo,
  className = '',
}: AGIPanelRecommendationItemProps) {
  const priorityStyles = {
    high: {
      background: 'rgba(235, 87, 87, 0.12)',
      border: '1px solid rgba(235, 87, 87, 0.3)',
      color: '#c93636',
      label: 'High Priority',
    },
    medium: {
      background: 'rgba(251, 191, 36, 0.12)',
      border: '1px solid rgba(251, 191, 36, 0.3)',
      color: '#d97706',
      label: 'Medium',
    },
    low: {
      background: 'rgba(47, 128, 255, 0.12)',
      border: '1px solid rgba(47, 128, 255, 0.3)',
      color: '#1e5bb8',
      label: 'Low Priority',
    },
  };

  const priorityStyle = priorityStyles[priority];

  return (
    <div
      className={`p-4 rounded-xl space-y-3 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.5)',
        border: '1.5px solid rgba(148, 163, 184, 0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
      }}
    >
      {/* Priority Badge and Category */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide"
          style={priorityStyle}
        >
          {priorityStyle.label}
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {category}
        </span>
      </div>

      {/* Node Name */}
      <h4 className="font-bold text-slate-900">{nodeName}</h4>

      {/* Explanation */}
      <p className="text-sm text-slate-600 leading-relaxed">{explanation}</p>

      {/* Jump To Button */}
      <button
        onClick={onJumpTo}
        className="roadmap-control-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(108, 92, 231, 0.12)',
          border: '1.5px solid rgba(108, 92, 231, 0.3)',
          boxShadow: '0 2px 8px rgba(108, 92, 231, 0.15)',
        }}
      >
        <span className="font-semibold text-purple-700">Jump to</span>
        <ChevronRight className="w-4 h-4 text-purple-700" />
      </button>
    </div>
  );
}

/**
 * 6. AGIPanel / RiskItem
 * Danger-glass card with warning icon, title, severity meter, and "Fix this" button
 * Horizontal Auto Layout
 */

interface AGIPanelRiskItemProps {
  title: string;
  severity: 1 | 2 | 3; // 1 = low, 2 = medium, 3 = high
  onFix?: () => void;
  className?: string;
}

export function AGIPanelRiskItem({
  title,
  severity,
  onFix,
  className = '',
}: AGIPanelRiskItemProps) {
  const severityLabels = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
  };

  return (
    <div
      className={`p-4 rounded-xl space-y-3 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.12) 0%, rgba(255, 140, 140, 0.08) 100%)',
        border: '1.5px solid rgba(235, 87, 87, 0.35)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 16px rgba(235, 87, 87, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Header: Icon and Title */}
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 p-2 rounded-lg"
          style={{
            background: 'rgba(235, 87, 87, 0.2)',
            border: '1px solid rgba(235, 87, 87, 0.4)',
          }}
        >
          <AlertTriangle className="w-5 h-5 text-red-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-red-900">{title}</h4>
        </div>
      </div>

      {/* Severity Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-red-800 uppercase tracking-wide">
            Severity
          </span>
          <span className="text-xs font-bold text-red-900">
            {severityLabels[severity]}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className="flex-1 h-2 rounded-full"
              style={{
                background: level <= severity
                  ? 'rgba(235, 87, 87, 0.8)'
                  : 'rgba(148, 163, 184, 0.15)',
                boxShadow: level <= severity
                  ? '0 0 8px rgba(235, 87, 87, 0.4)'
                  : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Fix This Button */}
      <button
        onClick={onFix}
        className="roadmap-control-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(235, 87, 87, 0.2)',
          border: '1.5px solid rgba(235, 87, 87, 0.5)',
          boxShadow: '0 2px 8px rgba(235, 87, 87, 0.25)',
        }}
      >
        <span className="font-bold text-red-800">Fix this</span>
      </button>
    </div>
  );
}

/**
 * 7. AGIPanel / BranchLockToggle
 * Glass toggle with branch name, lock icon, and locked/unlocked states
 */

interface AGIPanelBranchLockToggleProps {
  branchName: 'Product' | 'Marketing' | 'Finance' | 'Sales' | 'HR' | 'Ops';
  isLocked: boolean;
  onToggle?: (locked: boolean) => void;
  className?: string;
}

export function AGIPanelBranchLockToggle({
  branchName,
  isLocked,
  onToggle,
  className = '',
}: AGIPanelBranchLockToggleProps) {
  return (
    <button
      onClick={() => onToggle?.(!isLocked)}
      className={`roadmap-control-btn w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${className}`}
      style={{
        background: isLocked
          ? 'rgba(148, 163, 184, 0.08)'
          : 'rgba(39, 209, 124, 0.12)',
        border: isLocked
          ? '1.5px solid rgba(148, 163, 184, 0.2)'
          : '1.5px solid rgba(39, 209, 124, 0.3)',
        backdropFilter: 'blur(16px)',
        boxShadow: isLocked
          ? '0 2px 6px rgba(148, 163, 184, 0.1)'
          : '0 2px 6px rgba(39, 209, 124, 0.15), 0 0 16px rgba(39, 209, 124, 0.1)',
        filter: isLocked ? 'saturate(0.6)' : 'saturate(1)',
      }}
    >
      {/* Branch Name */}
      <span
        className="font-semibold"
        style={{
          color: isLocked ? '#64748b' : '#1a8a52',
        }}
      >
        {branchName}
      </span>

      {/* Lock Icon */}
      {isLocked ? (
        <Lock className="w-5 h-5 text-slate-500" />
      ) : (
        <Unlock className="w-5 h-5 text-green-600" />
      )}
    </button>
  );
}

/**
 * 8. AGIPanel / BranchLockList
 * Vertical list of all 6 branch lock toggles with master toggle
 */

interface AGIPanelBranchLockListProps {
  locks: {
    Product: boolean;
    Marketing: boolean;
    Finance: boolean;
    Sales: boolean;
    HR: boolean;
    Ops: boolean;
  };
  onToggleBranch?: (branch: keyof typeof locks, locked: boolean) => void;
  masterToggle?: boolean;
  onToggleMaster?: (enabled: boolean) => void;
  className?: string;
}

export function AGIPanelBranchLockList({
  locks,
  onToggleBranch,
  masterToggle = false,
  onToggleMaster,
  className = '',
}: AGIPanelBranchLockListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Master Toggle */}
      <button
        onClick={() => onToggleMaster?.(!masterToggle)}
        className="roadmap-control-btn w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: masterToggle
            ? 'linear-gradient(135deg, rgba(108, 92, 231, 0.2) 0%, rgba(180, 170, 240, 0.15) 100%)'
            : 'rgba(148, 163, 184, 0.1)',
          border: masterToggle
            ? '2px solid rgba(108, 92, 231, 0.4)'
            : '2px solid rgba(148, 163, 184, 0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: masterToggle
            ? '0 4px 12px rgba(108, 92, 231, 0.25), 0 0 24px rgba(108, 92, 231, 0.15)'
            : '0 2px 6px rgba(148, 163, 184, 0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <Sparkles
            className="w-5 h-5"
            style={{ color: masterToggle ? '#6C5CE7' : '#94a3b8' }}
          />
          <span
            className="font-bold"
            style={{ color: masterToggle ? '#5b21b6' : '#64748b' }}
          >
            Allow AGI to fully auto-optimize
          </span>
        </div>
        <div
          className="w-12 h-6 rounded-full transition-all duration-200"
          style={{
            background: masterToggle
              ? 'rgba(108, 92, 231, 0.3)'
              : 'rgba(148, 163, 184, 0.2)',
            border: masterToggle
              ? '2px solid rgba(108, 92, 231, 0.5)'
              : '2px solid rgba(148, 163, 184, 0.3)',
          }}
        >
          <div
            className="w-4 h-4 rounded-full transition-all duration-200"
            style={{
              background: masterToggle ? '#6C5CE7' : '#94a3b8',
              transform: masterToggle ? 'translateX(24px)' : 'translateX(2px)',
              marginTop: '2px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
        </div>
      </button>

      {/* Branch Toggles */}
      <div className="space-y-2">
        {(Object.keys(locks) as Array<keyof typeof locks>).map((branch) => (
          <AGIPanelBranchLockToggle
            key={branch}
            branchName={branch}
            isLocked={locks[branch]}
            onToggle={(locked) => onToggleBranch?.(branch, locked)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 9. AGIPanel / SectionHeader
 * Bold label with thin glowing underline
 * Vertical Auto Layout with 8px spacing
 */

interface AGIPanelSectionHeaderProps {
  label: string;
  className?: string;
}

export function AGIPanelSectionHeader({
  label,
  className = '',
}: AGIPanelSectionHeaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="font-bold text-slate-900">{label}</h3>
      <div
        className="h-0.5 rounded-full"
        style={{
          background: 'linear-gradient(90deg, rgba(108, 92, 231, 0.4) 0%, rgba(180, 170, 240, 0.2) 50%, rgba(108, 92, 231, 0.4) 100%)',
          boxShadow: '0 1px 6px rgba(108, 92, 231, 0.3), 0 0 12px rgba(108, 92, 231, 0.15)',
        }}
      />
    </div>
  );
}