import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Folder,
  FolderOpen,
  FileCode,
  Box,
  Layout,
  Clock,
  GitBranch,
  Target,
  PanelRight,
  Brain,
  Zap,
  Award,
  Sidebar,
  Sliders,
  TrendingUp,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Lock,
  CheckCircle,
  Circle,
  PlayCircle,
  Star,
  Edit,
  Ban,
  XCircle,
  Layers,
  Database,
  Activity,
  Workflow,
  Code,
  Settings,
} from 'lucide-react';

/**
 * ReactScaffoldingRoadmap - Developer Architecture Board
 * 
 * Complete visual documentation of the Roadmap system architecture,
 * component structure, data flow, and AGI integration
 */

interface GlassCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  children?: React.ReactNode;
  width?: string;
  className?: string;
}

function GlassCard({ title, subtitle, icon, color = '#2F80FF', children, width, className = '' }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl p-6 backdrop-blur-xl ${className}`}
      style={{
        width,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
        border: `2px solid ${color}40`,
        boxShadow: `0 8px 32px ${color}20, inset 0 1px 3px rgba(255, 255, 255, 0.5)`,
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${color}25, ${color}15)`,
              border: `2px solid ${color}50`,
              boxShadow: `0 4px 12px ${color}30`,
            }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function SectionHeader({ title, icon, color, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-2">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}20)`,
            border: `2px solid ${color}60`,
            boxShadow: `0 6px 20px ${color}30`,
          }}
        >
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <div
          className="flex-1 h-0.5"
          style={{
            background: `linear-gradient(90deg, ${color}40, transparent)`,
          }}
        />
      </div>
      {subtitle && (
        <p className="text-slate-600 ml-16">{subtitle}</p>
      )}
    </div>
  );
}

interface FileTreeItemProps {
  name: string;
  type: 'folder' | 'file';
  level: number;
  isOpen?: boolean;
}

function FileTreeItem({ name, type, level, isOpen = true }: FileTreeItemProps) {
  const Icon = type === 'folder' ? (isOpen ? FolderOpen : Folder) : FileCode;
  const color = type === 'folder' ? '#F2C94C' : '#2F80FF';

  return (
    <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: `${level * 24}px` }}>
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <span className={`text-sm ${type === 'folder' ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
        {name}
      </span>
    </div>
  );
}

interface ComponentCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  props?: string[];
  output: string;
  consumes?: string[];
  provides?: string[];
}

function ComponentCard({ name, description, icon, color, props, output, consumes, provides }: ComponentCardProps) {
  return (
    <div
      className="rounded-xl p-5 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
        border: `2px solid ${color}40`,
        boxShadow: `0 6px 24px ${color}20, inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${color}30, ${color}20)`,
            border: `2px solid ${color}50`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900">{name}</h4>
          <p className="text-xs text-slate-600 mt-1">{description}</p>
        </div>
      </div>

      {props && props.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Props:</p>
          <div className="flex flex-wrap gap-1.5">
            {props.map((prop, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-md text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200"
              >
                {prop}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs font-semibold text-slate-700 mb-1">Output:</p>
        <p className="text-xs text-slate-600">{output}</p>
      </div>

      {consumes && consumes.length > 0 && (
        <div className="mb-3 pb-3 border-b border-slate-200">
          <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Consumes:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {consumes.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {provides && provides.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Provides:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {provides.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TypeCardProps {
  name: string;
  description: string;
  fields: string[];
  color: string;
}

function TypeCard({ name, description, fields, color }: TypeCardProps) {
  return (
    <div
      className="rounded-xl p-4 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
        border: `2px solid ${color}40`,
        boxShadow: `0 6px 20px ${color}20`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-5 h-5" style={{ color }} />
        <h4 className="font-bold text-slate-900">{name}</h4>
      </div>
      <p className="text-xs text-slate-600 mb-3">{description}</p>
      <div className="space-y-1">
        {fields.map((field, idx) => (
          <div key={idx} className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            {field}
          </div>
        ))}
      </div>
    </div>
  );
}

interface StateCardProps {
  state: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

function StateCard({ state, description, color, icon }: StateCardProps) {
  return (
    <div
      className="rounded-xl p-4 text-center backdrop-blur-xl min-w-[140px]"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
        border: `2px solid ${color}40`,
        boxShadow: `0 6px 20px ${color}20`,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${color}30, ${color}20)`,
          border: `2px solid ${color}50`,
          boxShadow: `0 4px 12px ${color}30`,
        }}
      >
        {icon}
      </div>
      <h4 className="font-bold text-sm text-slate-900 mb-1">{state}</h4>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}

interface FlowStepProps {
  text: string;
  color: string;
  isLast?: boolean;
}

function FlowStep({ text, color, isLast = false }: FlowStepProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="px-4 py-3 rounded-xl backdrop-blur-xl whitespace-nowrap"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
          border: `2px solid ${color}40`,
          boxShadow: `0 6px 20px ${color}20`,
        }}
      >
        <p className="text-sm font-semibold text-slate-800">{text}</p>
      </div>
      {!isLast && (
        <ArrowRight
          className="w-6 h-6 flex-shrink-0"
          style={{
            color,
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />
      )}
    </div>
  );
}

export function ReactScaffoldingRoadmap() {
  const navigate = useNavigate();

  const nodeStates = [
    { state: 'available', description: 'Ready to start', color: '#64748B', icon: <Circle className="w-6 h-6 text-slate-600" /> },
    { state: 'active', description: 'In progress', color: '#2F80FF', icon: <PlayCircle className="w-6 h-6 text-blue-600" /> },
    { state: 'recommended', description: 'AGI suggests', color: '#6C5CE7', icon: <Star className="w-6 h-6 text-purple-600" /> },
    { state: 'aiInserted', description: 'AGI added', color: '#A855F7', icon: <Sparkles className="w-6 h-6 text-purple-500" /> },
    { state: 'aiModified', description: 'AGI edited', color: '#8B5CF6', icon: <Edit className="w-6 h-6 text-purple-600" /> },
    { state: 'blocked', description: 'Dependencies', color: '#F59E0B', icon: <Ban className="w-6 h-6 text-amber-600" /> },
    { state: 'locked', description: 'User locked', color: '#64748B', icon: <Lock className="w-6 h-6 text-slate-600" /> },
    { state: 'failed', description: 'Kill rule hit', color: '#EB5757', icon: <XCircle className="w-6 h-6 text-red-600" /> },
    { state: 'completed', description: 'Done ✓', color: '#27D17C', icon: <CheckCircle className="w-6 h-6 text-green-600" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/roadmap')}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 252, 255, 0.98))',
              border: '2px solid rgba(47, 128, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(47, 128, 255, 0.2)',
            }}
          >
            <ChevronLeft className="w-5 h-5 text-blue-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">React Scaffolding (Roadmap)</h1>
            <p className="text-slate-600 mt-1">Developer Architecture Board • Component Structure & Data Flow</p>
          </div>
        </div>

        <div
          className="p-5 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(100, 150, 255, 0.12), rgba(150, 100, 255, 0.08))',
            border: '2px solid rgba(100, 150, 255, 0.25)',
            boxShadow: '0 8px 24px rgba(100, 150, 255, 0.15)',
          }}
        >
          <div className="flex items-start gap-3">
            <Code className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Complete React Architecture</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                This page documents the complete React component architecture for the AI-Reactive Roadmap system, 
                including folder structure, component relationships, TypeScript types, context providers, data flow, 
                and AGI integration patterns.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-12">
        {/* SECTION 1 — Folder Structure */}
        <section>
          <SectionHeader
            title="Folder Structure"
            icon={<Folder className="w-7 h-7 text-yellow-600" />}
            color="#F2C94C"
            subtitle="Complete file tree for the Roadmap system"
          />

          <GlassCard
            title="Project Structure"
            subtitle="All Roadmap components organized in /src/components/roadmap/"
            icon={<FolderOpen className="w-6 h-6 text-yellow-600" />}
            color="#F2C94C"
          >
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <FileTreeItem name="src/" type="folder" level={0} />
              <FileTreeItem name="components/" type="folder" level={1} />
              <FileTreeItem name="roadmap/" type="folder" level={2} />
              
              {/* Components */}
              <FileTreeItem name="RoadmapPage.tsx" type="file" level={3} />
              <FileTreeItem name="RoadmapCanvas.tsx" type="file" level={3} />
              <FileTreeItem name="RoadmapTimeline.tsx" type="file" level={3} />
              <FileTreeItem name="RoadmapBranch.tsx" type="file" level={3} />
              <FileTreeItem name="RoadmapNode.tsx" type="file" level={3} />
              <FileTreeItem name="NodeDetailPanel.tsx" type="file" level={3} />
              <FileTreeItem name="AGIPanel.tsx" type="file" level={3} />
              <FileTreeItem name="MasteryDashboard.tsx" type="file" level={3} />
              <FileTreeItem name="QuickWinsOverlay.tsx" type="file" level={3} />
              <FileTreeItem name="SidebarLeft.tsx" type="file" level={3} />
              <FileTreeItem name="XPStrip.tsx" type="file" level={3} />
              <FileTreeItem name="ControlsBar.tsx" type="file" level={3} />
              
              {/* Configuration */}
              <FileTreeItem name="types.ts" type="file" level={3} />
              <FileTreeItem name="context.tsx" type="file" level={3} />
              <FileTreeItem name="hooks.ts" type="file" level={3} />
            </div>
          </GlassCard>
        </section>

        {/* SECTION 2 — Key Components */}
        <section>
          <SectionHeader
            title="Key Components"
            icon={<Layers className="w-7 h-7 text-blue-600" />}
            color="#2F80FF"
            subtitle="Core React components with responsibilities and relationships"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ComponentCard
              name="RoadmapPage.tsx"
              description="Root page component that manages layout and state"
              icon={<Layout className="w-5 h-5 text-blue-600" />}
              color="#2F80FF"
              props={['user']}
              output="Complete roadmap page with all panels and controls"
              provides={['RoadmapProvider', 'Layout structure']}
            />

            <ComponentCard
              name="RoadmapCanvas.tsx"
              description="Main visual canvas rendering branches and nodes"
              icon={<Box className="w-5 h-5 text-purple-600" />}
              color="#6C5CE7"
              props={['zoom', 'centerNode', 'onNodeClick']}
              output="Interactive node graph with pan/zoom"
              consumes={['roadmap', 'selectedNode']}
              provides={['Node interactions', 'Visual layout']}
            />

            <ComponentCard
              name="RoadmapTimeline.tsx"
              description="Horizontal timeline with chapter markers"
              icon={<Clock className="w-5 h-5 text-green-600" />}
              color="#27D17C"
              props={['chapters', 'currentChapter']}
              output="Timeline with progress indicators"
              consumes={['roadmap.chapters']}
            />

            <ComponentCard
              name="RoadmapBranch.tsx"
              description="Individual branch (Product, Marketing, etc.)"
              icon={<GitBranch className="w-5 h-5 text-orange-600" />}
              color="#FF8C42"
              props={['branch', 'nodes', 'isLocked']}
              output="Vertical branch with nodes"
              consumes={['branch', 'nodes[]']}
              provides={['Branch layout', 'Lock state']}
            />

            <ComponentCard
              name="RoadmapNode.tsx"
              description="Individual node with state visualization"
              icon={<Target className="w-5 h-5 text-blue-600" />}
              color="#2F80FF"
              props={['node', 'isSelected', 'onClick']}
              output="Node card with state styling"
              consumes={['node', 'selectedNode']}
              provides={['Click handler', 'Visual state']}
            />

            <ComponentCard
              name="NodeDetailPanel.tsx"
              description="Right panel showing selected node details"
              icon={<PanelRight className="w-5 h-5 text-purple-600" />}
              color="#6C5CE7"
              props={['node', 'onClose', 'onTaskComplete']}
              output="Detailed node view with tasks"
              consumes={['selectedNode', 'context methods']}
              provides={['Task management', 'Node actions']}
            />

            <ComponentCard
              name="AGIPanel.tsx"
              description="AGI recommendations and optimizations"
              icon={<Brain className="w-5 h-5 text-purple-600" />}
              color="#A855F7"
              props={['isOpen', 'onClose', 'onAccept', 'onReject']}
              output="AGI suggestions with accept/reject"
              consumes={['roadmap', 'ai metadata']}
              provides={['AGI actions', 'Recommendations']}
            />

            <ComponentCard
              name="QuickWinsOverlay.tsx"
              description="Fullscreen overlay for Quick Wins mode"
              icon={<Zap className="w-5 h-5 text-orange-600" />}
              color="#FF8C42"
              props={['isOpen', 'tasks', 'onComplete', 'onExit']}
              output="Quick wins task board"
              consumes={['quickWinsState']}
              provides={['Task completion', 'Exit handler']}
            />

            <ComponentCard
              name="MasteryDashboard.tsx"
              description="Mastery stats and skill breakdown"
              icon={<Award className="w-5 h-5 text-yellow-600" />}
              color="#F2C94C"
              props={['mastery', 'recentGains']}
              output="Mastery radar + recent XP"
              consumes={['roadmap.mastery']}
              provides={['Skill visualization']}
            />

            <ComponentCard
              name="SidebarLeft.tsx"
              description="Left sidebar with filters and controls"
              icon={<Sidebar className="w-5 h-5 text-slate-600" />}
              color="#64748B"
              props={['onFilterChange', 'onModeChange']}
              output="Sidebar with branch filters"
              provides={['Filter controls', 'View toggles']}
            />

            <ComponentCard
              name="ControlsBar.tsx"
              description="Top command bar with actions"
              icon={<Sliders className="w-5 h-5 text-blue-600" />}
              color="#2F80FF"
              props={['onSave', 'onShare', 'onAGI']}
              output="Command bar with buttons"
              provides={['Global actions', 'Filter chips']}
            />

            <ComponentCard
              name="XPStrip.tsx"
              description="Bottom XP bar with stats and actions"
              icon={<TrendingUp className="w-5 h-5 text-yellow-600" />}
              color="#F2C94C"
              props={['totalXP', 'progress', 'onQuickWins']}
              output="XP strip with progress bar"
              consumes={['roadmap.mastery.totalXp']}
              provides={['Quick Wins trigger', 'Export']}
            />
          </div>
        </section>

        {/* SECTION 3 — TypeScript Types */}
        <section>
          <SectionHeader
            title="TypeScript Types (Data Model Mapping)"
            icon={<Database className="w-7 h-7 text-purple-600" />}
            color="#6C5CE7"
            subtitle="Core type definitions matching the Dynamic Data Model"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <TypeCard
              name="Roadmap"
              description="Top-level roadmap object"
              color="#2F80FF"
              fields={[
                'id: string',
                'title: string',
                'chapters: Chapter[]',
                'branches: Branch[]',
                'nodes: Node[]',
                'mastery: Mastery',
                'settings: Settings',
              ]}
            />

            <TypeCard
              name="Chapter"
              description="Sequential milestone group"
              color="#6C5CE7"
              fields={[
                'id: string',
                'name: string',
                'order: number',
                'bossNodeId: string',
                'isLocked: boolean',
                'progress: number',
              ]}
            />

            <TypeCard
              name="Branch"
              description="Domain branch (Product, etc.)"
              color="#27D17C"
              fields={[
                'id: string',
                'name: BranchType',
                'color: string',
                'order: number',
                'isLockedByUser: boolean',
                'nodes: string[]',
              ]}
            />

            <TypeCard
              name="Node"
              description="Individual roadmap node"
              color="#FF8C42"
              fields={[
                'id: string',
                'title: string',
                'branchId: string',
                'state: NodeState',
                'xp: number',
                'tasks: Task[]',
                'ai: NodeAI',
              ]}
            />

            <TypeCard
              name="Task"
              description="Individual task within node"
              color="#27D17C"
              fields={[
                'id: string',
                'title: string',
                'isComplete: boolean',
                'xp: number',
                'timeEstimateMinutes: number',
              ]}
            />

            <TypeCard
              name="Mastery"
              description="Skill tracking system"
              color="#F2C94C"
              fields={[
                'product: number',
                'marketing: number',
                'sales: number',
                'finance: number',
                'totalXp: number',
                'level: number',
              ]}
            />

            <TypeCard
              name="QuickWinsState"
              description="Quick Wins mode state"
              color="#FF8C42"
              fields={[
                'isActive: boolean',
                'generatedAt: Date',
                'tasks: QuickWin[]',
                'requiredToExit: number',
              ]}
            />

            <TypeCard
              name="RoadmapSettings"
              description="User preferences"
              color="#64748B"
              fields={[
                'aiAutoOptimize: boolean',
                'branchLockOverrides: string[]',
                'quickWinsModeEnabled: boolean',
              ]}
            />

            <TypeCard
              name="NodeAI"
              description="AGI metadata for node"
              color="#A855F7"
              fields={[
                'priorityScore: number',
                'reason: string',
                'lastChangeType: string',
                'recommendationStrength: number',
              ]}
            />

            <TypeCard
              name="MasteryImpacts"
              description="XP gains by domain"
              color="#F2C94C"
              fields={[
                'product: number',
                'marketing: number',
                'sales: number',
                'finance: number',
              ]}
            />
          </div>

          {/* Type Relationships */}
          <div className="mt-8">
            <div
              className="p-6 rounded-2xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.12), rgba(168, 85, 247, 0.08))',
                border: '2px solid rgba(108, 92, 231, 0.25)',
                boxShadow: '0 8px 24px rgba(108, 92, 231, 0.15)',
              }}
            >
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-purple-600" />
                Type Relationships
              </h3>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span className="px-4 py-2 rounded-lg bg-purple-100 border-2 border-purple-300 font-bold text-purple-800">
                  Roadmap
                </span>
                <ArrowRight className="w-5 h-5 text-purple-600" />
                <span className="px-4 py-2 rounded-lg bg-purple-100 border-2 border-purple-300 font-bold text-purple-800">
                  Chapter[]
                </span>
                <ArrowRight className="w-5 h-5 text-purple-600" />
                <span className="px-4 py-2 rounded-lg bg-green-100 border-2 border-green-300 font-bold text-green-800">
                  Branch[]
                </span>
                <ArrowRight className="w-5 h-5 text-green-600" />
                <span className="px-4 py-2 rounded-lg bg-orange-100 border-2 border-orange-300 font-bold text-orange-800">
                  Node[]
                </span>
                <ArrowRight className="w-5 h-5 text-orange-600" />
                <span className="px-4 py-2 rounded-lg bg-green-100 border-2 border-green-300 font-bold text-green-800">
                  Task[]
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — Context Provider */}
        <section>
          <SectionHeader
            title="Context Provider Diagram"
            icon={<Activity className="w-7 h-7 text-blue-600" />}
            color="#2F80FF"
            subtitle="Global state management with React Context"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Context Definition */}
            <div className="lg:col-span-1">
              <GlassCard
                title="RoadmapContext"
                subtitle="context.tsx"
                icon={<Settings className="w-6 h-6 text-blue-600" />}
                color="#2F80FF"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">State:</p>
                    <div className="space-y-1.5">
                      <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs font-mono text-blue-800">selectedNode</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs font-mono text-blue-800">roadmap</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs font-mono text-blue-800">quickWinsState</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-2">Functions:</p>
                    <div className="space-y-1.5">
                      <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs font-mono text-green-800">selectNode(id)</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs font-mono text-green-800">setRoadmap()</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs font-mono text-green-800">toggleQuickWins()</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs font-mono text-green-800">getNodeById(id)</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs font-mono text-green-800">getBranchById(id)</p>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs font-mono text-green-800">getChapterById(id)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Consumers */}
            <div className="lg:col-span-2">
              <GlassCard
                title="Context Consumers"
                subtitle="Components that use RoadmapContext"
                icon={<Workflow className="w-6 h-6 text-purple-600" />}
                color="#6C5CE7"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="px-4 py-3 rounded-xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.12), rgba(100, 150, 255, 0.08))',
                      border: '2px solid rgba(47, 128, 255, 0.3)',
                    }}
                  >
                    <Box className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-semibold text-slate-800">RoadmapCanvas</p>
                    <p className="text-xs text-slate-600 mt-1">Uses: roadmap, selectedNode</p>
                  </div>

                  <div
                    className="px-4 py-3 rounded-xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.12), rgba(100, 150, 255, 0.08))',
                      border: '2px solid rgba(47, 128, 255, 0.3)',
                    }}
                  >
                    <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-semibold text-slate-800">RoadmapNode</p>
                    <p className="text-xs text-slate-600 mt-1">Calls: selectNode()</p>
                  </div>

                  <div
                    className="px-4 py-3 rounded-xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.12), rgba(150, 100, 255, 0.08))',
                      border: '2px solid rgba(108, 92, 231, 0.3)',
                    }}
                  >
                    <PanelRight className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-semibold text-slate-800">NodeDetailPanel</p>
                    <p className="text-xs text-slate-600 mt-1">Uses: selectedNode, methods</p>
                  </div>

                  <div
                    className="px-4 py-3 rounded-xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(147, 51, 234, 0.08))',
                      border: '2px solid rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    <Brain className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-semibold text-slate-800">AGIPanel</p>
                    <p className="text-xs text-slate-600 mt-1">Calls: setRoadmap()</p>
                  </div>

                  <div
                    className="px-4 py-3 rounded-xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 140, 66, 0.12), rgba(255, 160, 100, 0.08))',
                      border: '2px solid rgba(255, 140, 66, 0.3)',
                    }}
                  >
                    <Zap className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm font-semibold text-slate-800">QuickWinsOverlay</p>
                    <p className="text-xs text-slate-600 mt-1">Uses: quickWinsState</p>
                  </div>

                  <div
                    className="px-4 py-3 rounded-xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.12), rgba(255, 220, 120, 0.08))',
                      border: '2px solid rgba(242, 201, 76, 0.3)',
                    }}
                  >
                    <Award className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                    <p className="text-sm font-semibold text-slate-800">MasteryDashboard</p>
                    <p className="text-xs text-slate-600 mt-1">Uses: roadmap.mastery</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* SECTION 5 — Data Flow */}
        <section>
          <SectionHeader
            title="Data Flow (Render → Interaction → Update)"
            icon={<Workflow className="w-7 h-7 text-green-600" />}
            color="#27D17C"
            subtitle="Complete user interaction flow through the system"
          />

          <div
            className="p-8 rounded-2xl backdrop-blur-xl overflow-x-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
              border: '2px solid rgba(39, 209, 124, 0.4)',
              boxShadow: '0 8px 32px rgba(39, 209, 124, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 min-w-max">
              <FlowStep text="User clicks node" color="#2F80FF" />
              <FlowStep text="RoadmapNode calls selectNode()" color="#6C5CE7" />
              <FlowStep text="NodeDetailPanel opens" color="#A855F7" />
              <FlowStep text="User completes task" color="#27D17C" />
              <FlowStep text="Context updates Roadmap" color="#FF8C42" />
              <FlowStep text="Mastery updates" color="#F2C94C" />
              <FlowStep text="AGI recalculates" color="#A855F7" />
              <FlowStep text="AGIPanel updates" color="#6C5CE7" />
              <FlowStep text="Canvas re-renders" color="#2F80FF" isLast />
            </div>
          </div>
        </section>

        {/* SECTION 6 — AGI Interaction Layer */}
        <section>
          <SectionHeader
            title="AGI Interaction Layer"
            icon={<Brain className="w-7 h-7 text-purple-600" />}
            color="#A855F7"
            subtitle="How AGI modifies the roadmap and triggers UI updates"
          />

          <GlassCard
            title="AGI System Integration"
            subtitle="Real-time AI-driven roadmap optimization"
            icon={<Sparkles className="w-6 h-6 text-purple-600" />}
            color="#A855F7"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Insert Node</p>
                  <p className="text-xs text-purple-700 mt-1">
                    AGI → Inserts Node → Roadmap.nodes[] updates → Canvas animates new node
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Reorder Nodes</p>
                  <p className="text-xs text-purple-700 mt-1">
                    AGI → Reorders Nodes → Branch.order updates → Canvas repositions with transition
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Flag Recommendation</p>
                  <p className="text-xs text-purple-700 mt-1">
                    AGI → Flags Recommendation → Node.state = "recommended" → Node displays glow ring
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">Detect Risk</p>
                  <p className="text-xs text-purple-700 mt-1">
                    AGI → Detects Risk → AGIPanel lists warning → NodeDetailPanel displays Kill Rule
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">Trigger Quick Wins</p>
                  <p className="text-xs text-orange-700 mt-1">
                    AGI → Generates Quick Wins → QuickWinsState updates → QuickWinsOverlay displays
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* SECTION 7 — Component State Machine */}
        <section>
          <SectionHeader
            title="Component State Machine (Node States)"
            icon={<Activity className="w-7 h-7 text-slate-600" />}
            color="#64748B"
            subtitle="All possible node states with visual indicators"
          />

          <div className="flex gap-4 overflow-x-auto pb-4">
            {nodeStates.map((state, idx) => (
              <StateCard key={idx} {...state} />
            ))}
          </div>

          {/* State Transitions */}
          <div className="mt-6">
            <div
              className="p-6 rounded-2xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.12), rgba(148, 163, 184, 0.08))',
                border: '2px solid rgba(100, 116, 139, 0.25)',
                boxShadow: '0 8px 24px rgba(100, 116, 139, 0.15)',
              }}
            >
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-slate-600" />
                Common State Transitions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono">available</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <span className="px-3 py-1 rounded-lg bg-blue-100 border border-blue-300 font-mono">active</span>
                  <span className="text-xs text-slate-600 ml-2">User starts node</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-lg bg-blue-100 border border-blue-300 font-mono">active</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <span className="px-3 py-1 rounded-lg bg-green-100 border border-green-300 font-mono">completed</span>
                  <span className="text-xs text-slate-600 ml-2">All tasks done</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono">available</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <span className="px-3 py-1 rounded-lg bg-purple-100 border border-purple-300 font-mono">recommended</span>
                  <span className="text-xs text-slate-600 ml-2">AGI suggests</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-lg bg-blue-100 border border-blue-300 font-mono">active</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <span className="px-3 py-1 rounded-lg bg-red-100 border border-red-300 font-mono">failed</span>
                  <span className="text-xs text-slate-600 ml-2">Kill rule triggered</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono">available</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <span className="px-3 py-1 rounded-lg bg-amber-100 border border-amber-300 font-mono">blocked</span>
                  <span className="text-xs text-slate-600 ml-2">Dependencies not met</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Notes */}
        <section>
          <SectionHeader
            title="Implementation Notes"
            icon={<Code className="w-7 h-7 text-blue-600" />}
            color="#2F80FF"
            subtitle="Key technical considerations"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard
              title="Performance Optimizations"
              icon={<Activity className="w-6 h-6 text-green-600" />}
              color="#27D17C"
            >
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">React.memo() for RoadmapNode to prevent unnecessary re-renders</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">useMemo() for expensive node calculations</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">useCallback() for event handlers in loops</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Virtual scrolling for 100+ nodes</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              title="State Management"
              icon={<Database className="w-6 h-6 text-blue-600" />}
              color="#2F80FF"
            >
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Context for global roadmap state</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Local state for UI-only (zoom, pan)</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Supabase real-time subscriptions</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Optimistic updates with rollback</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              title="Animation & Transitions"
              icon={<Sparkles className="w-6 h-6 text-purple-600" />}
              color="#6C5CE7"
            >
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Motion/Framer for node animations</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">CSS transitions for state changes</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Glow effects for AGI recommendations</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Pulse animations for active nodes</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              title="Error Handling"
              icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
              color="#EB5757"
            >
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Try/catch for async operations</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Toast notifications for user feedback</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Fallback UI for failed loads</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Error boundaries for component crashes</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="max-w-[1600px] mx-auto mt-12 mb-8">
        <div
          className="p-6 rounded-2xl backdrop-blur-xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.12), rgba(108, 92, 231, 0.08))',
            border: '2px solid rgba(47, 128, 255, 0.25)',
            boxShadow: '0 8px 24px rgba(47, 128, 255, 0.15)',
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Code className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-slate-900">Ready to Build</h3>
          </div>
          <p className="text-sm text-slate-700">
            This architecture provides a complete blueprint for implementing the AI-Reactive Roadmap system
            with proper separation of concerns, performance optimization, and scalable data flow.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReactScaffoldingRoadmap;
