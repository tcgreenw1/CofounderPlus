import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  Filter,
  Grid,
  List,
  Sparkles,
  Check,
  X,
  Lock,
  Unlock,
  GitBranch,
  Eye,
  EyeOff,
  Play,
  AlertTriangle,
  Trophy,
  Clock,
  ChevronRight,
  Zap,
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  Trash2,
  Edit,
} from 'lucide-react';

/**
 * 1. Panel / SidebarLeft
 * Width 280-320px with liquid glass
 * Contains: Roadmap dropdown, Branch filter pills, Mode toggles, Search bar
 */

interface SidebarLeftProps {
  width?: number;
  className?: string;
  onRoadmapChange?: (roadmap: string) => void;
  onBranchFilterChange?: (branches: string[]) => void;
  onModeChange?: (mode: 'grid' | 'list') => void;
  onSearchChange?: (query: string) => void;
}

export function PanelSidebarLeft({
  width = 300,
  className = '',
  onRoadmapChange,
  onBranchFilterChange,
  onModeChange,
  onSearchChange,
}: SidebarLeftProps) {
  const [selectedRoadmap, setSelectedRoadmap] = useState('Product Launch');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['Development', 'Marketing']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  const roadmaps = [
    'Product Launch',
    'MVP Development',
    'Scale to 10K Users',
    'Enterprise Expansion',
  ];

  const branches = [
    { id: 'dev', label: 'Development', color: '#2F80FF' },
    { id: 'marketing', label: 'Marketing', color: '#27D17C' },
    { id: 'design', label: 'Design', color: '#F2C94C' },
    { id: 'ai', label: 'AI & Automation', color: '#6C5CE7' },
    { id: 'ops', label: 'Operations', color: '#EB5757' },
  ];

  const toggleBranch = (branchId: string) => {
    const updated = selectedBranches.includes(branchId)
      ? selectedBranches.filter((b) => b !== branchId)
      : [...selectedBranches, branchId];
    setSelectedBranches(updated);
    onBranchFilterChange?.(updated);
  };

  const handleModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    onModeChange?.(mode);
  };

  return (
    <div
      className={`roadmap-panel flex flex-col gap-6 p-6 ${className}`}
      style={{
        width: `${width}px`,
        minHeight: '100vh',
        position: 'relative',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 252, 255, 0.92) 100%)',
        border: 'none',
        borderRight: '2px solid rgba(47, 128, 255, 0.15)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
      }}
    >
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Roadmap</h2>
        <p className="text-sm text-slate-600">Plan your journey</p>
      </div>

      {/* Roadmap Dropdown */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Active Roadmap
        </label>
        <div className="relative">
          <button
            onClick={() => setRoadmapOpen(!roadmapOpen)}
            className="w-full liquid-glass-input rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-200 hover:border-blue-400"
            style={{
              border: '1.5px solid rgba(47, 128, 255, 0.25)',
            }}
          >
            <span className="font-semibold text-slate-800">{selectedRoadmap}</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                roadmapOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {roadmapOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-2 roadmap-panel rounded-xl overflow-hidden z-50"
              style={{
                backdropFilter: 'blur(32px)',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid rgba(47, 128, 255, 0.2)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              }}
            >
              {roadmaps.map((roadmap) => (
                <button
                  key={roadmap}
                  onClick={() => {
                    setSelectedRoadmap(roadmap);
                    setRoadmapOpen(false);
                    onRoadmapChange?.(roadmap);
                  }}
                  className="w-full px-4 py-3 text-left transition-all duration-150 hover:bg-blue-50/50"
                  style={{
                    borderBottom: '1px solid rgba(47, 128, 255, 0.1)',
                  }}
                >
                  <span className="text-sm font-medium text-slate-800">{roadmap}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            className="w-full liquid-glass-input rounded-xl pl-10 pr-4 py-3 text-sm"
            style={{
              border: '1.5px solid rgba(47, 128, 255, 0.2)',
            }}
          />
        </div>
      </div>

      {/* Branch Filter Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Branches
          </label>
          <Filter className="w-3.5 h-3.5 text-slate-500" />
        </div>

        <div className="flex flex-wrap gap-2">
          {branches.map((branch) => {
            const isSelected = selectedBranches.includes(branch.id);
            return (
              <button
                key={branch.id}
                onClick={() => toggleBranch(branch.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${branch.color}25, ${branch.color}15)`
                    : 'rgba(148, 163, 184, 0.08)',
                  border: `1.5px solid ${isSelected ? branch.color + '50' : 'rgba(148, 163, 184, 0.2)'}`,
                  color: isSelected ? branch.color : '#64748b',
                  backdropFilter: 'blur(8px)',
                  boxShadow: isSelected ? `0 2px 8px ${branch.color}20` : 'none',
                }}
              >
                {branch.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Toggles */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          View Mode
        </label>

        <div
          className="flex rounded-xl p-1"
          style={{
            background: 'rgba(148, 163, 184, 0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <button
            onClick={() => handleModeChange('grid')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200"
            style={{
              background: viewMode === 'grid' ? 'rgba(47, 128, 255, 0.15)' : 'transparent',
              border: viewMode === 'grid' ? '1.5px solid rgba(47, 128, 255, 0.3)' : '1.5px solid transparent',
              boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(47, 128, 255, 0.15)' : 'none',
            }}
          >
            <Grid className="w-4 h-4" style={{ color: viewMode === 'grid' ? '#2F80FF' : '#64748b' }} />
            <span
              className="text-sm font-semibold"
              style={{ color: viewMode === 'grid' ? '#2F80FF' : '#64748b' }}
            >
              Grid
            </span>
          </button>

          <button
            onClick={() => handleModeChange('list')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200"
            style={{
              background: viewMode === 'list' ? 'rgba(47, 128, 255, 0.15)' : 'transparent',
              border: viewMode === 'list' ? '1.5px solid rgba(47, 128, 255, 0.3)' : '1.5px solid transparent',
              boxShadow: viewMode === 'list' ? '0 2px 8px rgba(47, 128, 255, 0.15)' : 'none',
            }}
          >
            <List className="w-4 h-4" style={{ color: viewMode === 'list' ? '#2F80FF' : '#64748b' }} />
            <span
              className="text-sm font-semibold"
              style={{ color: viewMode === 'list' ? '#2F80FF' : '#64748b' }}
            >
              List
            </span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        className="mt-auto p-4 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.08) 0%, rgba(108, 92, 231, 0.08) 100%)',
          border: '1px solid rgba(47, 128, 255, 0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Total Nodes</span>
            <span className="text-sm font-bold text-blue-600">42</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">Completed</span>
            <span className="text-sm font-bold text-green-600">18</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-600">In Progress</span>
            <span className="text-sm font-bold text-yellow-600">6</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Panel / SidebarRightAGI
 * Width 380-420px, overlays content
 * Contains: Reasoning cards, Change log, Accept/Reject buttons, Branch lock toggles
 */

interface AGIChange {
  id: string;
  type: 'added' | 'modified' | 'removed';
  nodeTitle: string;
  branch: string;
  reasoning: string;
  timestamp: string;
}

interface SidebarRightAGIProps {
  width?: number;
  isOpen?: boolean;
  onClose?: () => void;
  changes?: AGIChange[];
  onAccept?: (changeId: string) => void;
  onReject?: (changeId: string) => void;
  onToggleBranchLock?: (branch: string, locked: boolean) => void;
  className?: string;
}

export function PanelSidebarRightAGI({
  width = 400,
  isOpen = true,
  onClose,
  changes = [],
  onAccept,
  onReject,
  onToggleBranchLock,
  className = '',
}: SidebarRightAGIProps) {
  const [branchLocks, setBranchLocks] = useState<Record<string, boolean>>({
    development: false,
    marketing: false,
    design: true,
  });

  const toggleBranchLock = (branch: string) => {
    const newLocked = !branchLocks[branch];
    setBranchLocks({ ...branchLocks, [branch]: newLocked });
    onToggleBranchLock?.(branch, newLocked);
  };

  const defaultChanges: AGIChange[] = [
    {
      id: '1',
      type: 'added',
      nodeTitle: 'Setup Analytics Dashboard',
      branch: 'Development',
      reasoning: 'Based on your goal to track user behavior, I added this node to implement comprehensive analytics.',
      timestamp: '2 min ago',
    },
    {
      id: '2',
      type: 'modified',
      nodeTitle: 'Launch Marketing Campaign',
      branch: 'Marketing',
      reasoning: 'Updated timeline to align with product release. Moved from Q2 to Q3 for better market readiness.',
      timestamp: '5 min ago',
    },
    {
      id: '3',
      type: 'added',
      nodeTitle: 'User Onboarding Flow',
      branch: 'Design',
      reasoning: 'Critical for reducing churn. Best practices suggest implementing this before scaling efforts.',
      timestamp: '8 min ago',
    },
  ];

  const displayChanges = changes.length > 0 ? changes : defaultChanges;

  return (
    <div
      className={`roadmap-panel flex flex-col gap-6 p-6 transition-transform duration-300 ${className}`}
      style={{
        width: `${width}px`,
        minHeight: '100vh',
        position: 'fixed',
        right: 0,
        top: 0,
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08) 0%, rgba(47, 128, 255, 0.08) 100%)',
        borderLeft: '2px solid rgba(108, 92, 231, 0.2)',
        boxShadow: '-8px 0 24px rgba(108, 92, 231, 0.15), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2) 0%, rgba(180, 170, 240, 0.15) 100%)',
              border: '1px solid rgba(108, 92, 231, 0.3)',
            }}
          >
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">AGI Assistant</h2>
            <p className="text-xs text-slate-600">Smart roadmap suggestions</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-purple-100/50 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Branch Lock Toggles */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Branch Protection
        </label>

        <div className="space-y-2">
          {Object.entries(branchLocks).map(([branch, locked]) => (
            <button
              key={branch}
              onClick={() => toggleBranchLock(branch)}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white/30"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(108, 92, 231, 0.15)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-800 capitalize">
                  {branch}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {locked ? (
                  <>
                    <Lock className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold text-red-600">Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-600">Open</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Change Log */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Recent Changes ({displayChanges.length})
          </label>
        </div>

        <div className="space-y-3">
          {displayChanges.map((change) => (
            <PanelCard
              key={change.id}
              variant={
                change.type === 'added'
                  ? 'success'
                  : change.type === 'modified'
                  ? 'info'
                  : 'error'
              }
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                        style={{
                          background:
                            change.type === 'added'
                              ? 'rgba(39, 209, 124, 0.15)'
                              : change.type === 'modified'
                              ? 'rgba(47, 128, 255, 0.15)'
                              : 'rgba(235, 87, 87, 0.15)',
                          color:
                            change.type === 'added'
                              ? '#1a8a52'
                              : change.type === 'modified'
                              ? '#1e5bb8'
                              : '#c93636',
                        }}
                      >
                        {change.type}
                      </span>
                      <span className="text-xs text-slate-500">{change.timestamp}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900">{change.nodeTitle}</h4>
                    <p className="text-xs text-slate-600">{change.branch}</p>
                  </div>
                </div>

                {/* Reasoning */}
                <div
                  className="p-3 rounded-lg text-sm text-slate-700"
                  style={{
                    background: 'rgba(108, 92, 231, 0.05)',
                    border: '1px solid rgba(108, 92, 231, 0.1)',
                  }}
                >
                  {change.reasoning}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept?.(change.id)}
                    className="flex-1 roadmap-control-btn flex items-center justify-center gap-2 py-2.5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.15), rgba(100, 230, 150, 0.12))',
                      border: '2px solid rgba(39, 209, 124, 0.3)',
                    }}
                  >
                    <Check className="w-4 h-4 text-green-700" />
                    <span className="text-sm font-semibold text-green-700">Accept</span>
                  </button>

                  <button
                    onClick={() => onReject?.(change.id)}
                    className="flex-1 roadmap-control-btn flex items-center justify-center gap-2 py-2.5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.15), rgba(255, 140, 140, 0.12))',
                      border: '2px solid rgba(235, 87, 87, 0.3)',
                    }}
                  >
                    <X className="w-4 h-4 text-red-700" />
                    <span className="text-sm font-semibold text-red-700">Reject</span>
                  </button>
                </div>
              </div>
            </PanelCard>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Panel / Card
 * Reusable glass card for AGI messages
 */

interface PanelCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'info' | 'warning' | 'error';
  className?: string;
  onClick?: () => void;
}

export function PanelCard({
  children,
  variant = 'default',
  className = '',
  onClick,
}: PanelCardProps) {
  const variantStyles = {
    default: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 252, 255, 0.9) 100%)',
      border: '1.5px solid rgba(47, 128, 255, 0.15)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
    },
    success: {
      background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.12) 0%, rgba(200, 255, 200, 0.1) 100%)',
      border: '1.5px solid rgba(39, 209, 124, 0.25)',
      boxShadow: '0 4px 12px rgba(39, 209, 124, 0.1), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
    },
    info: {
      background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.12) 0%, rgba(180, 220, 255, 0.1) 100%)',
      border: '1.5px solid rgba(47, 128, 255, 0.25)',
      boxShadow: '0 4px 12px rgba(47, 128, 255, 0.1), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
    },
    warning: {
      background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.12) 0%, rgba(255, 235, 150, 0.1) 100%)',
      border: '1.5px solid rgba(242, 201, 76, 0.25)',
      boxShadow: '0 4px 12px rgba(242, 201, 76, 0.1), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
    },
    error: {
      background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.12) 0%, rgba(255, 150, 150, 0.1) 100%)',
      border: '1.5px solid rgba(235, 87, 87, 0.25)',
      boxShadow: '0 4px 12px rgba(235, 87, 87, 0.1), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
    },
  };

  return (
    <div
      className={`p-4 rounded-xl transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      } ${className}`}
      style={{
        ...variantStyles[variant],
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * 4. NodePanel / Root
 * Slide-out panel for node details
 * Width 380-420px with liquid glass styling
 */

interface NodePanelRootProps {
  width?: number;
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function NodePanelRoot({
  width = 400,
  isOpen = true,
  onClose,
  children,
  className = '',
}: NodePanelRootProps) {
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
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(248, 252, 255, 0.14) 100%)',
        border: 'none',
        borderLeft: '2px solid rgba(47, 128, 255, 0.15)',
        boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
}

/**
 * 5. NodePanel / Header
 * Header component for node detail panel
 * Contains: title, category pill, XP badge, state tag, close button
 */

type NodeState = 'active' | 'recommended' | 'blocked' | 'failed' | 'completed';

interface NodePanelHeaderProps {
  nodeName: string;
  category: {
    label: string;
    color: string;
  };
  xpValue: number;
  state: NodeState;
  onClose?: () => void;
  className?: string;
}

export function NodePanelHeader({
  nodeName,
  category,
  xpValue,
  state,
  onClose,
  className = '',
}: NodePanelHeaderProps) {
  const stateConfig = {
    active: {
      label: 'Active',
      color: '#2F80FF',
      background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.2) 0%, rgba(180, 220, 255, 0.15) 100%)',
      border: '1.5px solid rgba(47, 128, 255, 0.5)',
    },
    recommended: {
      label: 'Recommended',
      color: '#F2C94C',
      background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.2) 0%, rgba(255, 235, 150, 0.15) 100%)',
      border: '1.5px solid rgba(242, 201, 76, 0.5)',
    },
    blocked: {
      label: 'Blocked',
      color: '#EB5757',
      background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.2) 0%, rgba(255, 140, 140, 0.15) 100%)',
      border: '1.5px solid rgba(235, 87, 87, 0.5)',
    },
    failed: {
      label: 'Failed',
      color: '#EB5757',
      background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.2) 0%, rgba(255, 140, 140, 0.15) 100%)',
      border: '1.5px solid rgba(235, 87, 87, 0.5)',
    },
    completed: {
      label: 'Completed',
      color: '#27D17C',
      background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.2) 0%, rgba(100, 230, 150, 0.15) 100%)',
      border: '1.5px solid rgba(39, 209, 124, 0.5)',
    },
  };

  const currentState = stateConfig[state];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top row: Category pill and Close button */}
      <div className="flex items-center justify-between gap-3">
        {/* Category Pill */}
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: `linear-gradient(135deg, ${category.color}25, ${category.color}15)`,
            border: `1.5px solid ${category.color}50`,
            color: category.color,
            boxShadow: `0 2px 8px ${category.color}20`,
          }}
        >
          {category.label}
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-100/50"
            style={{
              backdropFilter: 'blur(8px)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Node Title */}
      <h2 className="text-2xl font-bold text-slate-900">{nodeName}</h2>

      {/* State Tag and XP Badge */}
      <div className="flex items-center gap-3">
        {/* State Tag */}
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2"
          style={{
            background: currentState.background,
            border: currentState.border,
            color: currentState.color,
          }}
        >
          {state === 'active' && <Zap className="w-4 h-4" />}
          {state === 'recommended' && <Sparkles className="w-4 h-4" />}
          {state === 'blocked' && <Lock className="w-4 h-4" />}
          {state === 'failed' && <AlertTriangle className="w-4 h-4" />}
          {state === 'completed' && <Check className="w-4 h-4" />}
          {currentState.label}
        </div>

        {/* XP Badge */}
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.15) 0%, rgba(255, 235, 150, 0.1) 100%)',
            border: '1.5px solid rgba(242, 201, 76, 0.3)',
            color: '#b8860b',
          }}
        >
          <Trophy className="w-4 h-4" />
          {xpValue} XP
        </div>
      </div>
    </div>
  );
}

/**
 * 6. NodePanel / Progress
 * Progress section with progress bar, time estimate, kill rule warning, and action button
 */

interface NodePanelProgressProps {
  progress: number; // 0-100
  estimatedTime: string;
  killRuleWarning?: string | null;
  buttonLabel: 'Start Milestone' | 'Continue';
  onButtonClick?: () => void;
  className?: string;
}

export function NodePanelProgress({
  progress = 0,
  estimatedTime,
  killRuleWarning,
  buttonLabel,
  onButtonClick,
  className = '',
}: NodePanelProgressProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Progress
          </span>
          <span className="text-sm font-bold text-blue-600">{progress}%</span>
        </div>

        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: 'rgba(148, 163, 184, 0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(47, 128, 255, 0.8) 0%, rgba(108, 92, 231, 0.7) 100%)',
              boxShadow: '0 0 12px rgba(47, 128, 255, 0.6)',
            }}
          />
        </div>
      </div>

      {/* Estimated Time */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: 'rgba(148, 163, 184, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
        }}
      >
        <Clock className="w-4 h-4 text-slate-600" />
        <span className="text-sm text-slate-700">
          <span className="font-semibold">Estimated Time:</span> {estimatedTime}
        </span>
      </div>

      {/* Kill Rule Warning (if present) */}
      {killRuleWarning && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.12) 0%, rgba(255, 140, 140, 0.1) 100%)',
            border: '1.5px solid rgba(235, 87, 87, 0.3)',
          }}
        >
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Kill Rule Warning
            </p>
            <p className="text-sm text-red-800">{killRuleWarning}</p>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={onButtonClick}
        className="w-full roadmap-control-btn flex items-center justify-center gap-3 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.25) 0%, rgba(180, 220, 255, 0.2) 100%)',
          border: '2px solid rgba(47, 128, 255, 0.5)',
          boxShadow: '0 4px 16px rgba(47, 128, 255, 0.3)',
        }}
      >
        <Play className="w-5 h-5 text-blue-700" />
        <span className="font-bold text-blue-700">{buttonLabel}</span>
      </button>
    </div>
  );
}

/**
 * 7. NodePanel / TaskItem
 * Individual task item with checkbox, title, duration tag, XP pill, and expand chevron
 */

interface NodePanelTaskItemProps {
  taskId: string;
  title: string;
  duration: string;
  xpValue: number;
  isCompleted?: boolean;
  isExpanded?: boolean;
  definitionOfDone?: string[];
  onToggleComplete?: (taskId: string) => void;
  onToggleExpand?: (taskId: string) => void;
  className?: string;
}

export function NodePanelTaskItem({
  taskId,
  title,
  duration,
  xpValue,
  isCompleted = false,
  isExpanded = false,
  definitionOfDone,
  onToggleComplete,
  onToggleExpand,
  className = '',
}: NodePanelTaskItemProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Task Row */}
      <div
        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 252, 255, 0.85) 100%)',
          border: '1.5px solid rgba(47, 128, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Glass Toggle Checkbox */}
        <button
          onClick={() => onToggleComplete?.(taskId)}
          className="flex-shrink-0 w-5 h-5 rounded-md transition-all duration-200 flex items-center justify-center"
          style={{
            background: isCompleted
              ? 'linear-gradient(135deg, rgba(39, 209, 124, 0.25) 0%, rgba(100, 230, 150, 0.2) 100%)'
              : 'rgba(148, 163, 184, 0.12)',
            border: isCompleted
              ? '2px solid rgba(39, 209, 124, 0.6)'
              : '2px solid rgba(148, 163, 184, 0.3)',
            boxShadow: isCompleted ? '0 0 8px rgba(39, 209, 124, 0.3)' : 'none',
          }}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 text-green-700" />}
        </button>

        {/* Task Title */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium transition-all duration-200 ${
              isCompleted ? 'line-through text-slate-500' : 'text-slate-800'
            }`}
          >
            {title}
          </p>
        </div>

        {/* Duration Tag */}
        <div
          className="px-2 py-1 rounded-md text-xs font-semibold"
          style={{
            background: 'rgba(148, 163, 184, 0.12)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#64748b',
          }}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          {duration}
        </div>

        {/* XP Pill */}
        <div
          className="px-2 py-1 rounded-md text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.15) 0%, rgba(255, 235, 150, 0.1) 100%)',
            border: '1px solid rgba(242, 201, 76, 0.3)',
            color: '#b8860b',
          }}
        >
          +{xpValue}
        </div>

        {/* Expand Chevron */}
        {definitionOfDone && definitionOfDone.length > 0 && (
          <button
            onClick={() => onToggleExpand?.(taskId)}
            className="flex-shrink-0 p-1 rounded-lg transition-all duration-200 hover:bg-slate-100/50"
          >
            <ChevronRight
              className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Definition of Done (expanded) */}
      {isExpanded && definitionOfDone && definitionOfDone.length > 0 && (
        <NodePanelDefinitionOfDone items={definitionOfDone} />
      )}
    </div>
  );
}

/**
 * 8. NodePanel / DefinitionOfDone
 * Expansion area showing definition of done checklist
 */

interface NodePanelDefinitionOfDoneProps {
  items: string[];
  className?: string;
}

export function NodePanelDefinitionOfDone({
  items,
  className = '',
}: NodePanelDefinitionOfDoneProps) {
  return (
    <div
      className={`ml-8 p-3 rounded-xl space-y-2 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08) 0%, rgba(180, 170, 240, 0.06) 100%)',
        border: '1.5px solid rgba(108, 92, 231, 0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 2px 6px rgba(108, 92, 231, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.15)',
      }}
    >
      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
        Definition of Done
      </p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="flex-shrink-0 w-1 h-1 rounded-full bg-purple-500 mt-2" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 9. NodePanel / TaskList
 * Container for multiple task items with vertical layout
 */

interface NodePanelTaskListProps {
  tasks: Array<{
    taskId: string;
    title: string;
    duration: string;
    xpValue: number;
    isCompleted?: boolean;
    definitionOfDone?: string[];
  }>;
  onToggleComplete?: (taskId: string) => void;
  className?: string;
}

export function NodePanelTaskList({
  tasks,
  onToggleComplete,
  className = '',
}: NodePanelTaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Tasks ({tasks.filter((t) => t.isCompleted).length}/{tasks.length})
        </label>
      </div>

      {/* Task Items */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <NodePanelTaskItem
            key={task.taskId}
            taskId={task.taskId}
            title={task.title}
            duration={task.duration}
            xpValue={task.xpValue}
            isCompleted={task.isCompleted}
            isExpanded={expandedTasks.has(task.taskId)}
            definitionOfDone={task.definitionOfDone}
            onToggleComplete={onToggleComplete}
            onToggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 10. NodePanel / AGIInsightCard
 * Glass card with AI icon, explanation text, and insight tags
 */

interface NodePanelAGIInsightCardProps {
  insightText: string;
  tags?: Array<{
    label: string;
    type: 'why-now' | 'efficiency' | 'risk';
  }>;
  className?: string;
}

export function NodePanelAGIInsightCard({
  insightText,
  tags = [],
  className = '',
}: NodePanelAGIInsightCardProps) {
  const tagStyles = {
    'why-now': {
      background: 'rgba(47, 128, 255, 0.12)',
      border: '1px solid rgba(47, 128, 255, 0.25)',
      color: '#1e5bb8',
    },
    efficiency: {
      background: 'rgba(39, 209, 124, 0.12)',
      border: '1px solid rgba(39, 209, 124, 0.25)',
      color: '#1a8a52',
    },
    risk: {
      background: 'rgba(235, 87, 87, 0.12)',
      border: '1px solid rgba(235, 87, 87, 0.25)',
      color: '#c93636',
    },
  };

  return (
    <div
      className={`p-4 rounded-xl space-y-3 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.12) 0%, rgba(180, 170, 240, 0.1) 100%)',
        border: '1.5px solid rgba(108, 92, 231, 0.25)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 4px 12px rgba(108, 92, 231, 0.12), 0 0 24px rgba(108, 92, 231, 0.08), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Icon and Label */}
      <div className="flex items-center gap-2">
        <div
          className="p-1.5 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.25) 0%, rgba(180, 170, 240, 0.2) 100%)',
            border: '1px solid rgba(108, 92, 231, 0.3)',
            boxShadow: '0 0 12px rgba(108, 92, 231, 0.2)',
          }}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
          AGI Insight
        </span>
      </div>

      {/* Insight Text */}
      <p className="text-sm text-slate-700 leading-relaxed">{insightText}</p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={tagStyles[tag.type]}
            >
              {tag.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 11. NodePanel / FooterActions
 * Horizontal action bar with primary, danger, secondary, tertiary, and menu buttons
 */

interface NodePanelFooterActionsProps {
  onComplete?: () => void;
  onMarkFailed?: () => void;
  onAskAGI?: () => void;
  onToggleLock?: (locked: boolean) => void;
  onMenuClick?: () => void;
  isLocked?: boolean;
  className?: string;
}

export function NodePanelFooterActions({
  onComplete,
  onMarkFailed,
  onAskAGI,
  onToggleLock,
  onMenuClick,
  isLocked = false,
  className = '',
}: NodePanelFooterActionsProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Primary: Complete */}
      <button
        onClick={onComplete}
        className="flex-1 roadmap-control-btn flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(39, 209, 124, 0.15)',
          border: '2px solid rgba(39, 209, 124, 0.4)',
          boxShadow: '0 4px 12px rgba(39, 209, 124, 0.2)',
        }}
      >
        <Check className="w-5 h-5 text-green-700" />
        <span className="font-bold text-green-700">Complete</span>
      </button>

      {/* Danger: Mark Failed */}
      <button
        onClick={onMarkFailed}
        className="flex-1 roadmap-control-btn flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(235, 87, 87, 0.15)',
          border: '2px solid rgba(235, 87, 87, 0.4)',
          boxShadow: '0 4px 12px rgba(235, 87, 87, 0.2)',
        }}
      >
        <X className="w-5 h-5 text-red-700" />
        <span className="font-bold text-red-700">Mark Failed</span>
      </button>

      {/* Secondary: Ask AGI */}
      <button
        onClick={onAskAGI}
        className="flex-1 roadmap-control-btn flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(108, 92, 231, 0.15)',
          border: '2px solid rgba(108, 92, 231, 0.4)',
          boxShadow: '0 4px 12px rgba(108, 92, 231, 0.2)',
        }}
      >
        <Sparkles className="w-5 h-5 text-purple-700" />
        <span className="font-bold text-purple-700">Ask AGI</span>
      </button>

      {/* Tertiary: Lock Milestone */}
      <button
        onClick={() => onToggleLock?.(!isLocked)}
        className="roadmap-control-btn flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: isLocked
            ? 'rgba(235, 87, 87, 0.12)'
            : 'rgba(148, 163, 184, 0.12)',
          border: isLocked
            ? '2px solid rgba(235, 87, 87, 0.3)'
            : '2px solid rgba(148, 163, 184, 0.25)',
          boxShadow: isLocked
            ? '0 2px 8px rgba(235, 87, 87, 0.15)'
            : '0 2px 8px rgba(148, 163, 184, 0.1)',
        }}
      >
        {isLocked ? (
          <Lock className="w-5 h-5 text-red-700" />
        ) : (
          <Unlock className="w-5 h-5 text-slate-600" />
        )}
        <span
          className="font-bold whitespace-nowrap"
          style={{
            color: isLocked ? '#c93636' : '#64748b',
          }}
        >
          {isLocked ? 'Locked' : 'Lock'}
        </span>
      </button>

      {/* Icon-only: Menu button (...) */}
      <button
        onClick={onMenuClick}
        className="roadmap-control-btn flex items-center justify-center p-3 rounded-xl transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
        style={{
          background: 'rgba(148, 163, 184, 0.12)',
          border: '2px solid rgba(148, 163, 184, 0.25)',
          boxShadow: '0 2px 8px rgba(148, 163, 184, 0.1)',
        }}
      >
        <MoreHorizontal className="w-5 h-5 text-slate-600" />
      </button>
    </div>
  );
}

/**
 * 12. NodePanel / DependenciesBlock
 * Displays prerequisite tasks/milestones with status indicators
 */

interface Dependency {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'blocked' | 'available';
}

interface NodePanelDependenciesBlockProps {
  dependencies: Dependency[];
  className?: string;
}

export function NodePanelDependenciesBlock({
  dependencies,
  className = '',
}: NodePanelDependenciesBlockProps) {
  const statusStyles = {
    completed: {
      icon: <Check className="w-4 h-4 text-green-600" />,
      background: 'rgba(39, 209, 124, 0.1)',
      border: 'rgba(39, 209, 124, 0.3)',
      textColor: '#15803d',
    },
    'in-progress': {
      icon: <Clock className="w-4 h-4 text-blue-600" />,
      background: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      textColor: '#1e40af',
    },
    blocked: {
      icon: <Lock className="w-4 h-4 text-red-600" />,
      background: 'rgba(235, 87, 87, 0.1)',
      border: 'rgba(235, 87, 87, 0.3)',
      textColor: '#991b1b',
    },
    available: {
      icon: <Play className="w-4 h-4 text-purple-600" />,
      background: 'rgba(108, 92, 231, 0.1)',
      border: 'rgba(108, 92, 231, 0.3)',
      textColor: '#5b21b6',
    },
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-slate-600" />
        <h4 className="font-bold text-sm text-slate-700">
          Dependencies ({dependencies.length})
        </h4>
      </div>

      {/* Dependency List */}
      <div className="space-y-2">
        {dependencies.map((dep) => {
          const style = statusStyles[dep.status];
          return (
            <div
              key={dep.id}
              className="roadmap-control-btn flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: style.background,
                border: `1.5px solid ${style.border}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">{style.icon}</div>

              {/* Title */}
              <span
                className="flex-1 text-sm font-semibold"
                style={{ color: style.textColor }}
              >
                {dep.title}
              </span>

              {/* Chevron */}
              <ChevronRight className="w-4 h-4 opacity-40" style={{ color: style.textColor }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 13. NodePanel / KillRuleCard
 * Warning card for tasks with kill conditions
 */

interface KillRule {
  condition: string;
  consequence: string;
  severity: 'warning' | 'danger';
}

interface NodePanelKillRuleCardProps {
  killRule?: KillRule;
  visible?: boolean;
  className?: string;
}

export function NodePanelKillRuleCard({
  killRule,
  visible = true,
  className = '',
}: NodePanelKillRuleCardProps) {
  if (!visible || !killRule) return null;

  const severityStyles = {
    warning: {
      background: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.4)',
      iconColor: '#d97706',
      textColor: '#92400e',
      glowColor: 'rgba(251, 191, 36, 0.25)',
    },
    danger: {
      background: 'rgba(235, 87, 87, 0.15)',
      border: 'rgba(235, 87, 87, 0.4)',
      iconColor: '#dc2626',
      textColor: '#991b1b',
      glowColor: 'rgba(235, 87, 87, 0.25)',
    },
  };

  const style = severityStyles[killRule.severity];

  return (
    <div
      className={`roadmap-control-btn p-4 rounded-xl space-y-3 ${className}`}
      style={{
        background: style.background,
        border: `2px solid ${style.border}`,
        backdropFilter: 'blur(16px)',
        boxShadow: `0 4px 16px ${style.glowColor}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" style={{ color: style.iconColor }} />
        <h4 className="font-bold" style={{ color: style.textColor }}>
          Kill Rule Active
        </h4>
      </div>

      {/* Condition */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-60" style={{ color: style.textColor }}>
          Condition
        </div>
        <div className="text-sm font-semibold" style={{ color: style.textColor }}>
          {killRule.condition}
        </div>
      </div>

      {/* Consequence */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-60" style={{ color: style.textColor }}>
          Consequence
        </div>
        <div className="text-sm font-semibold" style={{ color: style.textColor }}>
          {killRule.consequence}
        </div>
      </div>
    </div>
  );
}