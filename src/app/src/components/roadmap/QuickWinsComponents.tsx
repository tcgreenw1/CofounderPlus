import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  Circle,
  Zap,
  TrendingUp,
  Target,
  DollarSign,
  Settings,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useRoadmap } from '../../contexts/RoadmapContext';

/**
 * QUICK WINS MODE COMPONENTS - NOW WITH LIVE DATA
 * Uses RoadmapContext for real quick wins sessions
 */

// ============================================================================
// QUICK WINS / HEADER
// Title, subtitle, time badge, exit button
// ============================================================================

interface QuickWinsHeaderProps {
  totalTime?: string;
  onExit: () => void;
}

export function QuickWinsHeader({ 
  totalTime = '10–30 minutes total',
  onExit 
}: QuickWinsHeaderProps) {
  return (
    <div className="quick-wins-header flex items-start justify-between">
      <div className="flex items-center gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Quick Wins Mode
          </h1>
          <p className="text-lg text-slate-600">
            Do a few small things to rebuild momentum.
          </p>
        </div>

        {/* Time Badge */}
        <div
          className="px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '2px solid rgba(242, 201, 76, 0.4)',
            boxShadow: '0 4px 12px rgba(242, 201, 76, 0.2)',
          }}
        >
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-semibold text-yellow-800">
            {totalTime}
          </span>
        </div>
      </div>

      {/* Exit Button */}
      <button
        onClick={onExit}
        className="text-slate-600 hover:text-slate-900 font-semibold transition-colors duration-200 flex items-center gap-2"
      >
        <span>Exit to roadmap</span>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================================================================
// QUICK WINS / EXPLANATION STRIP
// Info bar with AI icon and dynamic context
// ============================================================================

interface QuickWinsExplanationStripProps {
  message: string;
}

export function QuickWinsExplanationStrip({ message }: QuickWinsExplanationStripProps) {
  return (
    <div
      className="quick-wins-explanation flex items-center gap-3 p-4 rounded-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '2px solid rgba(47, 128, 255, 0.3)',
        boxShadow: '0 4px 16px rgba(47, 128, 255, 0.15), 0 0 24px rgba(47, 128, 255, 0.1)',
      }}
    >
      {/* AI Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(47, 128, 255, 0.15)',
          border: '2px solid rgba(47, 128, 255, 0.3)',
        }}
      >
        <Sparkles className="w-5 h-5 text-blue-600" />
      </div>

      {/* Message */}
      <p className="text-slate-800 font-medium flex-1">
        {message}
      </p>
    </div>
  );
}

// ============================================================================
// QUICK WINS / FILTER ROW
// Time and category filter chips
// ============================================================================

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  icon?: React.ReactNode;
}

function FilterChip({ label, active, onClick, color = '#2F80FF', icon }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        background: active 
          ? `${color}` 
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: active 
          ? `2px solid ${color}` 
          : '2px solid rgba(148, 163, 184, 0.3)',
        color: active ? 'white' : '#64748b',
        boxShadow: active 
          ? `0 4px 12px ${color}40` 
          : '0 2px 8px rgba(148, 163, 184, 0.1)',
      }}
    >
      <div className="flex items-center gap-2">
        {icon}
        {label}
      </div>
    </button>
  );
}

interface QuickWinsFilterRowProps {
  activeFilters: {
    time: string | null;
    category: string | null;
  };
  onFilterChange: (type: 'time' | 'category', value: string | null) => void;
}

const categoryConfig = {
  Product: { icon: Sparkles, color: '#6C5CE7' },
  Marketing: { icon: TrendingUp, color: '#27D17C' },
  Sales: { icon: Target, color: '#F2C94C' },
  Finance: { icon: DollarSign, color: '#2F80FF' },
  Ops: { icon: Settings, color: '#FF6B35' },
  HR: { icon: Users, color: '#EB5757' },
};

export function QuickWinsFilterRow({ activeFilters, onFilterChange }: QuickWinsFilterRowProps) {
  return (
    <div className="quick-wins-filter-row space-y-3">
      {/* Time Filters */}
      <div>
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
          Time Available
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="5 min"
            active={activeFilters.time === '5'}
            onClick={() => onFilterChange('time', activeFilters.time === '5' ? null : '5')}
            icon={<Clock className="w-4 h-4" />}
          />
          <FilterChip
            label="10 min"
            active={activeFilters.time === '10'}
            onClick={() => onFilterChange('time', activeFilters.time === '10' ? null : '10')}
            icon={<Clock className="w-4 h-4" />}
          />
          <FilterChip
            label="15+ min"
            active={activeFilters.time === '15'}
            onClick={() => onFilterChange('time', activeFilters.time === '15' ? null : '15')}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
          Focus Area
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryConfig).map(([category, config]) => {
            const Icon = config.icon;
            return (
              <FilterChip
                key={category}
                label={category}
                active={activeFilters.category === category}
                onClick={() => onFilterChange('category', activeFilters.category === category ? null : category)}
                color={config.color}
                icon={<Icon className="w-4 h-4" />}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK WINS / CARD
// Individual task card
// ============================================================================

interface QuickWinsCardProps {
  title: string;
  category: keyof typeof categoryConfig;
  whyMatters: string;
  timeEstimate: string;
  xpReward: number;
  completed: boolean;
  onDoNow: () => void;
  onToggleComplete: () => void;
}

export function QuickWinsCard({
  title,
  category,
  whyMatters,
  timeEstimate,
  xpReward,
  completed,
  onDoNow,
  onToggleComplete,
}: QuickWinsCardProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <div
      className="quick-wins-card p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: completed 
          ? 'rgba(148, 163, 184, 0.4)' 
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `2px solid ${config.color}30`,
        boxShadow: `0 4px 16px ${config.color}20, inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
        opacity: completed ? 0.7 : 1,
      }}
    >
      {/* Top Row: Title + Category */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-slate-900 flex-1">
          {title}
        </h3>
        
        {/* Category Pill */}
        <div
          className="px-3 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0"
          style={{
            background: `${config.color}20`,
            border: `1px solid ${config.color}40`,
          }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
          <span className="text-xs font-bold" style={{ color: config.color }}>
            {category}
          </span>
        </div>
      </div>

      {/* Middle: Why it matters */}
      <p className="text-sm text-slate-700 mb-4 leading-relaxed">
        {whyMatters}
      </p>

      {/* Badges Row */}
      <div className="flex items-center gap-2 mb-4">
        {/* Time Badge */}
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(242, 201, 76, 0.2)',
            color: '#F2A900',
            border: '1px solid rgba(242, 201, 76, 0.4)',
          }}
        >
          <Clock className="w-3 h-3 inline-block mr-1" />
          {timeEstimate}
        </div>

        {/* XP Badge */}
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(47, 128, 255, 0.2)',
            color: '#2F80FF',
            border: '1px solid rgba(47, 128, 255, 0.4)',
          }}
        >
          <Zap className="w-3 h-3 inline-block mr-1" />
          +{xpReward} XP
        </div>
      </div>

      {/* Bottom: Actions */}
      <div className="flex items-center gap-3">
        {/* Do It Now Button */}
        {!completed && (
          <button
            onClick={onDoNow}
            className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: config.color,
              color: 'white',
              boxShadow: `0 4px 12px ${config.color}40`,
            }}
          >
            Do it now
          </button>
        )}

        {/* Mark Complete Toggle */}
        <button
          onClick={onToggleComplete}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 ${
            completed ? 'flex-1' : ''
          }`}
          style={{
            background: completed 
              ? 'rgba(39, 209, 124, 0.2)' 
              : 'rgba(255, 255, 255, 0.8)',
            border: completed 
              ? '2px solid rgba(39, 209, 124, 0.4)' 
              : '2px solid rgba(148, 163, 184, 0.3)',
            color: completed ? '#27D17C' : '#64748b',
          }}
        >
          {completed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </>
          ) : (
            <>
              <Circle className="w-4 h-4" />
              Mark complete
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK WINS / PROGRESS BAR
// Shows completion progress
// ============================================================================

interface QuickWinsProgressBarProps {
  completed: number;
  total: number;
}

export function QuickWinsProgressBar({ completed, total }: QuickWinsProgressBarProps) {
  const progress = (completed / total) * 100;

  return (
    <div
      className="quick-wins-progress p-5 rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '2px solid rgba(39, 209, 124, 0.3)',
        boxShadow: '0 4px 16px rgba(39, 209, 124, 0.15)',
      }}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-slate-900">Quick Wins completed</div>
        <div className="text-sm font-semibold text-slate-600">
          {completed} of {total} completed
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="h-3 rounded-full overflow-hidden relative"
        style={{
          background: 'rgba(39, 209, 124, 0.15)',
          border: '1px solid rgba(39, 209, 124, 0.3)',
        }}
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: '#27D17C',
            boxShadow: '0 0 12px rgba(39, 209, 124, 0.6)',
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// QUICK WINS / FOOTER ACTIONS
// Footer with guidance and actions
// ============================================================================

interface QuickWinsFooterActionsProps {
  onNewQuickWins: () => void;
  onExplainMode: () => void;
}

export function QuickWinsFooterActions({ 
  onNewQuickWins, 
  onExplainMode 
}: QuickWinsFooterActionsProps) {
  return (
    <div
      className="quick-wins-footer flex items-center justify-between p-5 rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '2px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 4px 16px rgba(148, 163, 184, 0.1)',
      }}
    >
      {/* Left: Guidance */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <AlertCircle className="w-4 h-4" />
        <span>Complete at least 1 Quick Win to return with momentum.</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Explain Button */}
        <button
          onClick={onExplainMode}
          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'transparent',
            color: '#64748b',
            border: '2px solid transparent',
          }}
        >
          Explain why I'm in this mode
        </button>

        {/* New Quick Wins Button */}
        <button
          onClick={onNewQuickWins}
          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '2px solid rgba(47, 128, 255, 0.3)',
            color: '#2F80FF',
          }}
        >
          Give me new Quick Wins
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// QUICK WINS / ROOT OVERLAY
// Main container with full-screen overlay - CONNECTED TO REAL DATA
// ============================================================================

interface QuickWinsRootOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickWinsRootOverlay({ isOpen, onClose }: QuickWinsRootOverlayProps) {
  const { quickWinsSession, completeQuickWin, updateQuickWins, loading } = useRoadmap();
  
  const [filters, setFilters] = useState<{
    time: string | null;
    category: string | null;
  }>({
    time: null,
    category: null,
  });

  const handleFilterChange = (type: 'time' | 'category', value: string | null) => {
    setFilters(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleToggleComplete = async (quickWinId: string) => {
    if (!quickWinsSession) return;
    
    const quickWin = quickWinsSession.quickWins.find(qw => qw.id === quickWinId);
    if (!quickWin) return;

    if (quickWin.completed) {
      // Undo completion - update local state
      const updatedQuickWins = quickWinsSession.quickWins.map(qw =>
        qw.id === quickWinId ? { ...qw, completed: false, completedAt: undefined } : qw
      );
      await updateQuickWins({
        quickWins: updatedQuickWins,
        completedWins: updatedQuickWins.filter(qw => qw.completed).length
      });
    } else {
      // Complete the quick win
      await completeQuickWin(quickWinId, quickWin.xpReward);
    }
  };

  // Filter quick wins
  const filteredQuickWins = quickWinsSession?.quickWins.filter(qw => {
    if (filters.time) {
      const timeValue = parseInt(filters.time);
      if (qw.timeMinutes > timeValue) return false;
    }
    if (filters.category && qw.category !== filters.category) {
      return false;
    }
    return true;
  }) || [];

  const completedCount = quickWinsSession?.completedWins || 0;
  const totalCount = filteredQuickWins.length || 0;

  if (!isOpen) return null;

  // Loading state
  if (loading) {
    return (
      <div
        className="quick-wins-root-overlay fixed inset-0 z-50 flex items-center justify-center p-8"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="text-center">
          <Sparkles className="size-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-white">Loading Quick Wins...</p>
        </div>
      </div>
    );
  }

  // No active session
  if (!quickWinsSession) {
    return (
      <div
        className="quick-wins-root-overlay fixed inset-0 z-50 flex items-center justify-center p-8"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      >
        <div
          className="text-center p-8 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(40px)',
            maxWidth: '500px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <AlertCircle className="size-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Quick Wins</h2>
          <p className="text-slate-600 mb-6">
            Quick Wins mode will activate automatically when the AGI detects momentum stalls, or you can manually trigger it from your roadmap settings.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Roadmap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="quick-wins-root-overlay fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      {/* Main Panel */}
      <div
        className="quick-wins-panel size-full max-w-4xl overflow-y-auto"
        style={{
          maxHeight: '85vh',
          background: 'rgba(255, 255, 255, 0.14)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 'var(--radius-2xl, 24px)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
          padding: 'var(--spacing-8, 32px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content with vertical spacing */}
        <div className="space-y-8">
          {/* 1. Header */}
          <QuickWinsHeader 
            totalTime={`${filteredQuickWins.reduce((sum, qw) => sum + qw.timeMinutes, 0)} minutes total`}
            onExit={onClose}
          />

          {/* 2. Explanation Strip */}
          <QuickWinsExplanationStrip 
            message={quickWinsSession.triggerReason || "Here are easy wins to rebuild momentum."}
          />

          {/* 3. Filter Row */}
          <QuickWinsFilterRow 
            activeFilters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* 4. Task Cards */}
          <div className="space-y-4">
            {filteredQuickWins.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">No quick wins match your filters. Try adjusting the filters above.</p>
              </div>
            ) : (
              filteredQuickWins.map(task => (
                <QuickWinsCard
                  key={task.id}
                  title={task.title}
                  category={task.category}
                  whyMatters={task.whyMatters}
                  timeEstimate={task.timeEstimate}
                  xpReward={task.xpReward}
                  completed={task.completed}
                  onDoNow={() => {
                    // Navigate to related node if exists
                    if (task.nodeId) {
                      console.log('Navigate to node:', task.nodeId);
                    } else {
                      console.log('Do now:', task.id);
                    }
                  }}
                  onToggleComplete={() => handleToggleComplete(task.id)}
                />
              ))
            )}
          </div>

          {/* 5. Progress Bar */}
          <QuickWinsProgressBar 
            completed={completedCount}
            total={totalCount}
          />

          {/* 6. Footer Actions */}
          <QuickWinsFooterActions
            onNewQuickWins={() => {
              console.log('Generate new quick wins - AGI will handle this');
              // In real implementation, call AGI endpoint to regenerate quick wins
            }}
            onExplainMode={() => {
              alert(
                `Quick Wins Mode Explanation:\n\n` +
                `Trigger: ${quickWinsSession.trigger}\n` +
                `Reason: ${quickWinsSession.triggerReason || 'Momentum building'}\n\n` +
                `The AGI detected that you could benefit from some small, achievable wins to rebuild momentum and keep making progress.`
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}