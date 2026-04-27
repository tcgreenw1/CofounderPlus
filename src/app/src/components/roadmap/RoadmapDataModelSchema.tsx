import React from 'react';
import { Database, GitBranch, Box, CheckSquare, AlertTriangle, Trophy, Settings, Zap, Brain, ArrowRight } from 'lucide-react';

/**
 * Dynamic Roadmap Data Model Schema
 * Visual representation of the complete Cofounder+ AI-Reactive Roadmap data structure
 */

interface SchemaCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  fields: { name: string; type: string; description?: string }[];
  children?: React.ReactNode;
}

function SchemaCard({ title, icon, color, fields, children }: SchemaCardProps) {
  return (
    <div
      className="rounded-2xl p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.14)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `2px solid ${color}40`,
        boxShadow: `0 8px 24px ${color}20, inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b-2" style={{ borderColor: `${color}30` }}>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}20`,
            border: `2px solid ${color}40`,
          }}
        >
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={index}
            className="p-3 rounded-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.4)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-slate-800">{field.name}</span>
              <span className="font-mono text-xs text-slate-500 italic">{field.type}</span>
            </div>
            {field.description && (
              <p className="text-xs text-slate-600 mt-1">{field.description}</p>
            )}
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}

function ConnectionLine({ color, direction = 'horizontal' }: { color: string; direction?: 'horizontal' | 'vertical' }) {
  if (direction === 'vertical') {
    return (
      <div className="flex justify-center my-4">
        <div
          className="w-0.5 h-12 rounded-full"
          style={{
            background: `linear-gradient(180deg, ${color}60, ${color}30)`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center my-6">
      <div
        className="h-0.5 w-24 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}60, ${color}30)`,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
      <ArrowRight className="w-5 h-5 mx-2" style={{ color }} />
      <div
        className="h-0.5 w-24 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}30, ${color}60)`,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-slate-900 mb-2">{label}</h2>
      <div
        className="h-1 w-24 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #2F80FF, #6C5CE7)',
          boxShadow: '0 2px 8px rgba(47, 128, 255, 0.3)',
        }}
      />
    </div>
  );
}

export function RoadmapDataModelSchema() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-12">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Dynamic Roadmap Data Model
          </h1>
          <p className="text-xl text-slate-600">
            Complete schema for AI-Reactive Roadmap in Cofounder+
          </p>
        </div>

        {/* ============================================================================ */}
        {/* ROADMAP ROOT */}
        {/* ============================================================================ */}
        <SectionHeader label="Roadmap Root" />
        <SchemaCard
          title="Roadmap"
          icon={<Database className="w-6 h-6 text-blue-600" />}
          color="#2F80FF"
          fields={[
            { name: 'id', type: 'string (UUID)' },
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'created_at', type: 'timestamp' },
            { name: 'updated_at', type: 'timestamp' },
            { name: 'version', type: 'integer' },
            { name: 'chapters', type: 'Chapter[]', description: 'Array of chapter objects' },
            { name: 'branches', type: 'Branch[]', description: 'Array of branch objects' },
            { name: 'nodes', type: 'Node[]', description: 'Array of node objects' },
            { name: 'mastery', type: 'Mastery', description: 'User mastery data' },
            { name: 'settings', type: 'Settings', description: 'Roadmap settings' },
          ]}
        />

        <ConnectionLine color="#2F80FF" direction="vertical" />

        {/* ============================================================================ */}
        {/* CHAPTERS */}
        {/* ============================================================================ */}
        <SectionHeader label="Chapters" />
        <div className="grid grid-cols-2 gap-6">
          <SchemaCard
            title="Chapter"
            icon={<Box className="w-6 h-6 text-purple-600" />}
            color="#6C5CE7"
            fields={[
              { name: 'id', type: 'string (UUID)' },
              { name: 'name', type: 'string', description: 'e.g. "Foundation", "Build MVP"' },
              { name: 'order', type: 'integer', description: 'Sequential order in timeline' },
              { name: 'boss_node_id', type: 'string', description: 'Final milestone node ID' },
              { name: 'description', type: 'string' },
              { name: 'icon', type: 'string', description: 'Icon identifier' },
              { name: 'is_locked', type: 'boolean' },
              { name: 'progress', type: 'float (0–1)', description: 'Completion percentage' },
            ]}
          />
        </div>

        <ConnectionLine color="#6C5CE7" direction="vertical" />

        {/* ============================================================================ */}
        {/* BRANCHES */}
        {/* ============================================================================ */}
        <SectionHeader label="Branches" />
        <SchemaCard
          title="Branch"
          icon={<GitBranch className="w-6 h-6 text-green-600" />}
          color="#27D17C"
          fields={[
            { name: 'id', type: 'string (UUID)' },
            { name: 'name', type: 'enum', description: 'Product | Marketing | Sales | Finance | HR | Operations' },
            { name: 'color', type: 'string (hex)', description: 'Visual brand color' },
            { name: 'order', type: 'integer', description: 'Display order in UI' },
            { name: 'icon', type: 'string', description: 'Icon identifier' },
            { name: 'is_locked_by_user', type: 'boolean', description: 'User disabled this branch' },
            { name: 'is_locked_by_agi', type: 'boolean', description: 'AGI temporarily disabled' },
            { name: 'mastery_weight', type: 'float', description: 'Contribution to mastery score' },
            { name: 'nodes', type: 'string[]', description: 'Array of node IDs in this branch' },
          ]}
        />

        <ConnectionLine color="#27D17C" direction="vertical" />

        {/* ============================================================================ */}
        {/* NODES */}
        {/* ============================================================================ */}
        <SectionHeader label="Nodes" />
        <div className="grid grid-cols-1 gap-6">
          <SchemaCard
            title="Node (Core)"
            icon={<Box className="w-6 h-6 text-blue-500" />}
            color="#2F80FF"
            fields={[
              { name: 'id', type: 'string (UUID)' },
              { name: 'title', type: 'string' },
              { name: 'description', type: 'string' },
              { name: 'branch_id', type: 'string', description: 'Parent branch ID' },
              { name: 'chapter_id', type: 'string', description: 'Parent chapter ID' },
              { name: 'order_in_branch', type: 'integer', description: 'Position in branch lane' },
              { name: 'xp', type: 'integer', description: 'Experience points reward' },
              { name: 'time_estimate_minutes', type: 'integer' },
              { name: 'created_by', type: 'enum', description: 'system | user | agi' },
              { name: 'updated_by', type: 'enum', description: 'system | user | agi' },
            ]}
          />

          <SchemaCard
            title="Node (State Fields)"
            icon={<CheckSquare className="w-6 h-6 text-yellow-600" />}
            color="#F2C94C"
            fields={[
              { name: 'state', type: 'enum', description: 'available | active | recommended | aiInserted | aiModified | blocked | locked | failed | completed' },
              { name: 'is_recommended', type: 'boolean', description: 'AGI suggests this node' },
              { name: 'is_blocked', type: 'boolean', description: 'Dependencies not met' },
              { name: 'is_critical_path', type: 'boolean', description: 'Required for chapter completion' },
              { name: 'kill_rule_id', type: 'string | null', description: 'Active kill rule if applicable' },
            ]}
          />

          <SchemaCard
            title="Node (Dependencies)"
            icon={<GitBranch className="w-6 h-6 text-orange-600" />}
            color="#FF6B35"
            fields={[
              { name: 'required_node_ids', type: 'string[]', description: 'Must complete before unlocking' },
              { name: 'optional_node_ids', type: 'string[]', description: 'Suggested prerequisites' },
              { name: 'unlocks_node_ids', type: 'string[]', description: 'Nodes this unlocks' },
            ]}
          />

          <SchemaCard
            title="Node (AGI Metadata)"
            icon={<Brain className="w-6 h-6 text-purple-600" />}
            color="#6C5CE7"
            fields={[
              { name: 'ai.priority_score', type: 'float (0–1)', description: 'AGI computed priority' },
              { name: 'ai.reason', type: 'string', description: 'Why AGI recommends this' },
              { name: 'ai.last_change_type', type: 'enum', description: 'inserted | reordered | removed | modified | none' },
              { name: 'ai.last_change_at', type: 'timestamp' },
              { name: 'ai.recommendation_strength', type: 'float (0–1)', description: 'Confidence score' },
              { name: 'ai.path_score', type: 'float', description: 'Optimal path ranking' },
            ]}
          />

          <SchemaCard
            title="Node (Mastery Impacts)"
            icon={<Trophy className="w-6 h-6 text-yellow-600" />}
            color="#F2C94C"
            fields={[
              { name: 'mastery_impacts', type: 'object', description: 'XP gains per domain on completion' },
              { name: 'mastery_impacts.product', type: 'integer', description: '+4' },
              { name: 'mastery_impacts.marketing', type: 'integer', description: '+2' },
              { name: 'mastery_impacts.sales', type: 'integer', description: '0' },
              { name: 'mastery_impacts.finance', type: 'integer', description: '+1' },
              { name: 'mastery_impacts.operations', type: 'integer', description: '0' },
              { name: 'mastery_impacts.hr', type: 'integer', description: '0' },
            ]}
          />

          <SchemaCard
            title="Node (Tasks)"
            icon={<CheckSquare className="w-6 h-6 text-green-600" />}
            color="#27D17C"
            fields={[
              { name: 'tasks', type: 'Task[]', description: 'Array of task objects' },
            ]}
          />
        </div>

        <ConnectionLine color="#27D17C" direction="vertical" />

        {/* ============================================================================ */}
        {/* TASKS */}
        {/* ============================================================================ */}
        <SectionHeader label="Tasks" />
        <SchemaCard
          title="Task"
          icon={<CheckSquare className="w-6 h-6 text-green-600" />}
          color="#27D17C"
          fields={[
            { name: 'id', type: 'string (UUID)' },
            { name: 'title', type: 'string', description: 'Actionable task description' },
            { name: 'is_complete', type: 'boolean' },
            { name: 'xp', type: 'integer', description: 'XP reward for completion' },
            { name: 'time_estimate_minutes', type: 'integer' },
            { name: 'definition_of_done', type: 'string', description: 'Completion criteria' },
            { name: 'created_by_agi', type: 'boolean', description: 'AGI-generated task' },
          ]}
        />

        <div className="my-12" />

        {/* ============================================================================ */}
        {/* KILL RULES */}
        {/* ============================================================================ */}
        <SectionHeader label="Kill Rules" />
        <SchemaCard
          title="KillRule"
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="#EB5757"
          fields={[
            { name: 'id', type: 'string (UUID)' },
            { name: 'name', type: 'string', description: 'Rule identifier' },
            { name: 'condition', type: 'string', description: 'e.g. "Task overdue by 7 days"' },
            { name: 'severity', type: 'enum', description: 'low | medium | high' },
            { name: 'triggers_failure_state', type: 'boolean', description: 'Moves node to failed state' },
            { name: 'recovery_plan', type: 'string', description: 'How to recover from failure' },
          ]}
        />

        <div className="my-12" />

        {/* ============================================================================ */}
        {/* MASTERY */}
        {/* ============================================================================ */}
        <SectionHeader label="Mastery System" />
        <div className="grid grid-cols-2 gap-6">
          <SchemaCard
            title="Mastery"
            icon={<Trophy className="w-6 h-6 text-yellow-600" />}
            color="#F2C94C"
            fields={[
              { name: 'product', type: 'float (0–100)', description: 'Product mastery level' },
              { name: 'marketing', type: 'float (0–100)' },
              { name: 'sales', type: 'float (0–100)' },
              { name: 'finance', type: 'float (0–100)' },
              { name: 'operations', type: 'float (0–100)' },
              { name: 'hr', type: 'float (0–100)' },
              { name: 'level', type: 'integer', description: 'Overall mastery level' },
              { name: 'total_xp', type: 'integer', description: 'Cumulative XP earned' },
              { name: 'xp_to_next_level', type: 'integer' },
              { name: 'recent_gains', type: 'MasteryGain[]', description: 'Recent XP history' },
            ]}
          />

          <SchemaCard
            title="MasteryGain"
            icon={<Zap className="w-6 h-6 text-yellow-600" />}
            color="#F2C94C"
            fields={[
              { name: 'domain', type: 'string', description: 'product | marketing | sales | finance | operations | hr' },
              { name: 'amount', type: 'integer', description: 'XP gained' },
              { name: 'timestamp', type: 'timestamp', description: 'When gained' },
            ]}
          />
        </div>

        <div className="my-12" />

        {/* ============================================================================ */}
        {/* QUICK WINS */}
        {/* ============================================================================ */}
        <SectionHeader label="Quick Wins Mode" />
        <div className="grid grid-cols-2 gap-6">
          <SchemaCard
            title="QuickWins"
            icon={<Zap className="w-6 h-6 text-orange-600" />}
            color="#FF9500"
            fields={[
              { name: 'generated_at', type: 'timestamp', description: 'When list was generated' },
              { name: 'tasks', type: 'QuickWin[]', description: 'Array of quick win tasks' },
              { name: 'required_to_exit', type: 'integer', description: 'Minimum tasks to complete' },
            ]}
          />

          <SchemaCard
            title="QuickWin"
            icon={<Zap className="w-6 h-6 text-orange-600" />}
            color="#FF9500"
            fields={[
              { name: 'node_id', type: 'string', description: 'Parent node ID' },
              { name: 'task_id', type: 'string | null', description: 'Specific task ID if applicable' },
              { name: 'title', type: 'string', description: 'Quick win action' },
              { name: 'category', type: 'string', description: 'Branch category' },
              { name: 'reason', type: 'string', description: 'Why this is a quick win' },
              { name: 'time_estimate_minutes', type: 'integer' },
              { name: 'xp', type: 'integer', description: 'XP reward' },
            ]}
          />
        </div>

        <div className="my-12" />

        {/* ============================================================================ */}
        {/* SETTINGS */}
        {/* ============================================================================ */}
        <SectionHeader label="Settings" />
        <SchemaCard
          title="Settings"
          icon={<Settings className="w-6 h-6 text-slate-600" />}
          color="#94A3B8"
          fields={[
            { name: 'ai_auto_optimize', type: 'boolean', description: 'Enable AGI auto-reordering' },
            { name: 'branch_lock_overrides', type: 'string[]', description: 'User-disabled branch IDs' },
            { name: 'quick_wins_mode_enabled', type: 'boolean' },
            { name: 'notifications_enabled', type: 'boolean' },
          ]}
        />

        <div className="my-12" />

        {/* ============================================================================ */}
        {/* DATABASE NOTES */}
        {/* ============================================================================ */}
        <SectionHeader label="Database Implementation Notes" />
        <div
          className="p-8 rounded-2xl"
          style={{
            background: 'rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '2px solid rgba(148, 163, 184, 0.3)',
            boxShadow: '0 8px 24px rgba(148, 163, 184, 0.2)',
          }}
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Supabase Implementation</h3>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong>Field naming:</strong> Use snake_case for all database fields</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong>IDs:</strong> All IDs are UUIDs (string format)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong>JSONB columns:</strong> Store Tasks, KillRules, Mastery, QuickWins, and AI metadata as JSONB</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong>Arrays:</strong> Store node dependencies (required_node_ids, optional_node_ids, unlocks_node_ids) as array columns</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong>Roadmap table:</strong> Maps to a single business roadmap instance per business_id</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong>Normalization:</strong> Chapters, Branches, and Nodes can be stored as separate tables with foreign keys, or as JSONB arrays within Roadmap table for simpler queries</span>
            </li>
          </ul>
        </div>

        <div className="h-12" />
      </div>
    </div>
  );
}
