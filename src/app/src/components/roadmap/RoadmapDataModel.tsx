import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Workflow,
  GitBranch,
  Target,
  CheckSquare,
  AlertTriangle,
  Award,
  Settings as SettingsIcon,
  Zap,
  ArrowRight,
  ChevronLeft,
  Box,
  Network,
  Brain,
  TrendingUp,
  Code,
  Users,
  DollarSign,
  Megaphone,
  Building,
  Wrench,
} from 'lucide-react';

/**
 * RoadmapDataModel - Visual Schema Diagram
 * 
 * Complete data model for AI-Reactive Roadmap System
 * Uses liquid glass cards with connected relationships
 */

interface SchemaFieldProps {
  name: string;
  type: string;
  description?: string;
  isKey?: boolean;
}

function SchemaField({ name, type, description, isKey }: SchemaFieldProps) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-200/30 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono ${isKey ? 'font-bold text-blue-700' : 'text-slate-700'}`}>
            {name}
          </span>
          {isKey && (
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
              KEY
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <span className="text-xs font-mono text-slate-500 whitespace-nowrap">{type}</span>
    </div>
  );
}

interface SchemaCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  fields: SchemaFieldProps[];
  children?: React.ReactNode;
  width?: string;
}

function SchemaCard({ title, icon, color, fields, children, width = "320px" }: SchemaCardProps) {
  return (
    <div
      className="relative rounded-2xl p-5 backdrop-blur-xl"
      style={{
        width,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 255, 0.98) 100%)',
        border: `2px solid ${color}40`,
        boxShadow: `0 8px 32px ${color}20, inset 0 1px 3px rgba(255, 255, 255, 0.5)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b-2" style={{ borderColor: `${color}30` }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${color}25, ${color}15)`,
            border: `2px solid ${color}50`,
            boxShadow: `0 4px 12px ${color}30`,
          }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>

      {/* Fields */}
      <div className="space-y-0.5">
        {fields.map((field, idx) => (
          <SchemaField key={idx} {...field} />
        ))}
      </div>

      {/* Additional Content */}
      {children}
    </div>
  );
}

interface ConnectionLineProps {
  color: string;
  label?: string;
}

function ConnectionLine({ color, label }: ConnectionLineProps) {
  return (
    <div className="flex items-center gap-3 mx-4">
      <div
        className="h-0.5 flex-1"
        style={{
          background: `linear-gradient(90deg, ${color}60, ${color}30)`,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
      <ArrowRight className="w-5 h-5" style={{ color }} />
      {label && (
        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-white/80" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  color: string;
}

function SectionHeader({ title, icon, color }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
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
  );
}

export function RoadmapDataModel() {
  const navigate = useNavigate();

  const branchIcons: { [key: string]: React.ReactNode } = {
    Product: <Code className="w-5 h-5 text-blue-600" />,
    Marketing: <Megaphone className="w-5 h-5 text-green-600" />,
    Sales: <TrendingUp className="w-5 h-5 text-purple-600" />,
    Finance: <DollarSign className="w-5 h-5 text-yellow-600" />,
    HR: <Users className="w-5 h-5 text-pink-600" />,
    Operations: <Building className="w-5 h-5 text-orange-600" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
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
            <h1 className="text-3xl font-bold text-slate-900">Dynamic Roadmap Data Model</h1>
            <p className="text-slate-600 mt-1">AI-Reactive Roadmap System • Full Schema Specification</p>
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
            <Network className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Supabase-Friendly Schema</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                This model uses <strong>snake_case</strong> naming conventions, <strong>UUIDs</strong> for all IDs, 
                <strong> JSONB</strong> columns for nested objects (Tasks, Mastery, AI metadata), 
                and <strong>array fields</strong> for dependencies. Designed for PostgreSQL with real-time subscriptions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* SECTION: Roadmap (Top Level) */}
        <section>
          <SectionHeader
            title="Roadmap (Top Level)"
            icon={<Database className="w-7 h-7 text-blue-600" />}
            color="#2F80FF"
          />
          <div className="flex justify-center">
            <SchemaCard
              title="Roadmap"
              icon={<Database className="w-6 h-6 text-blue-600" />}
              color="#2F80FF"
              width="400px"
              fields={[
                { name: 'id', type: 'uuid', isKey: true },
                { name: 'title', type: 'string' },
                { name: 'description', type: 'text' },
                { name: 'created_at', type: 'timestamp' },
                { name: 'updated_at', type: 'timestamp' },
                { name: 'version', type: 'integer' },
                { name: 'chapters', type: 'array<Chapter>', description: 'References to Chapter IDs' },
                { name: 'branches', type: 'array<Branch>', description: 'References to Branch IDs' },
                { name: 'nodes', type: 'array<Node>', description: 'References to Node IDs' },
                { name: 'mastery', type: 'jsonb', description: 'Mastery object' },
                { name: 'settings', type: 'jsonb', description: 'Settings object' },
              ]}
            />
          </div>
        </section>

        {/* SECTION: Chapters */}
        <section>
          <SectionHeader
            title="Chapters"
            icon={<Workflow className="w-7 h-7 text-purple-600" />}
            color="#6C5CE7"
          />
          <div className="flex justify-center">
            <SchemaCard
              title="Chapter"
              icon={<Workflow className="w-6 h-6 text-purple-600" />}
              color="#6C5CE7"
              width="400px"
              fields={[
                { name: 'id', type: 'uuid', isKey: true },
                { name: 'name', type: 'string' },
                { name: 'order', type: 'integer', description: 'Sequential chapter number' },
                { name: 'boss_node_id', type: 'uuid', description: 'Final milestone node for chapter' },
                { name: 'description', type: 'text' },
                { name: 'icon', type: 'string', description: 'Icon name or emoji' },
                { name: 'is_locked', type: 'boolean' },
                { name: 'progress', type: 'float', description: '0.0 to 1.0' },
              ]}
            />
          </div>
        </section>

        {/* SECTION: Branches */}
        <section>
          <SectionHeader
            title="Branches"
            icon={<GitBranch className="w-7 h-7 text-green-600" />}
            color="#27D17C"
          />
          <div className="flex justify-center">
            <SchemaCard
              title="Branch"
              icon={<GitBranch className="w-6 h-6 text-green-600" />}
              color="#27D17C"
              width="400px"
              fields={[
                { name: 'id', type: 'uuid', isKey: true },
                { name: 'name', type: 'enum', description: 'Product, Marketing, Sales, Finance, HR, Operations' },
                { name: 'color', type: 'string', description: 'Hex color code' },
                { name: 'order', type: 'integer' },
                { name: 'icon', type: 'string' },
                { name: 'is_locked_by_user', type: 'boolean' },
                { name: 'is_locked_by_agi', type: 'boolean' },
                { name: 'mastery_weight', type: 'float', description: 'Impact multiplier for mastery gains' },
                { name: 'nodes', type: 'array<uuid>', description: 'Node IDs in this branch' },
              ]}
            >
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Branch Types:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(branchIcons).map(([name, icon]) => (
                    <div key={name} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50">
                      {icon}
                      <span className="text-xs text-slate-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SchemaCard>
          </div>
        </section>

        {/* SECTION: Nodes */}
        <section>
          <SectionHeader
            title="Nodes"
            icon={<Target className="w-7 h-7 text-orange-600" />}
            color="#FF8C42"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Node Object */}
            <SchemaCard
              title="Node (Core)"
              icon={<Target className="w-6 h-6 text-orange-600" />}
              color="#FF8C42"
              width="100%"
              fields={[
                { name: 'id', type: 'uuid', isKey: true },
                { name: 'title', type: 'string' },
                { name: 'description', type: 'text' },
                { name: 'branch_id', type: 'uuid' },
                { name: 'chapter_id', type: 'uuid' },
                { name: 'order_in_branch', type: 'integer' },
                { name: 'xp', type: 'integer' },
                { name: 'time_estimate_minutes', type: 'integer' },
                { name: 'created_by', type: 'enum', description: 'system, user, agi' },
                { name: 'updated_by', type: 'enum', description: 'system, user, agi' },
              ]}
            />

            {/* Node State Fields */}
            <SchemaCard
              title="Node (State)"
              icon={<Box className="w-6 h-6 text-orange-600" />}
              color="#FF8C42"
              width="100%"
              fields={[
                { name: 'state', type: 'enum', description: 'available, active, recommended, aiInserted, aiModified, blocked, locked, failed, completed' },
                { name: 'is_recommended', type: 'boolean' },
                { name: 'is_blocked', type: 'boolean' },
                { name: 'is_critical_path', type: 'boolean' },
                { name: 'kill_rule_id', type: 'uuid | null' },
              ]}
            />

            {/* Node Dependencies */}
            <SchemaCard
              title="Node (Dependencies)"
              icon={<Network className="w-6 h-6 text-orange-600" />}
              color="#FF8C42"
              width="100%"
              fields={[
                { name: 'required_node_ids', type: 'array<uuid>', description: 'Must complete these first' },
                { name: 'optional_node_ids', type: 'array<uuid>', description: 'Suggested pre-requisites' },
                { name: 'unlocks_node_ids', type: 'array<uuid>', description: 'Completes these unlock' },
              ]}
            />

            {/* Node AI Metadata */}
            <SchemaCard
              title="Node (AI Metadata)"
              icon={<Brain className="w-6 h-6 text-purple-600" />}
              color="#6C5CE7"
              width="100%"
              fields={[
                { name: 'ai.priority_score', type: 'float', description: 'AGI priority ranking' },
                { name: 'ai.reason', type: 'string', description: 'Why AGI recommends this' },
                { name: 'ai.last_change_type', type: 'enum', description: 'inserted, reordered, removed, modified, none' },
                { name: 'ai.last_change_at', type: 'timestamp' },
                { name: 'ai.recommendation_strength', type: 'float', description: '0.0 to 1.0' },
                { name: 'ai.path_score', type: 'float', description: 'Critical path score' },
              ]}
            />

            {/* Node Tasks */}
            <div className="lg:col-span-2">
              <SchemaCard
                title="Node (Tasks)"
                icon={<CheckSquare className="w-6 h-6 text-green-600" />}
                color="#27D17C"
                width="100%"
                fields={[
                  { name: 'tasks', type: 'jsonb array', description: 'Array of Task objects' },
                ]}
              />
            </div>

            {/* Node Mastery Impacts */}
            <div className="lg:col-span-2">
              <SchemaCard
                title="Node (Mastery Impacts)"
                icon={<Award className="w-6 h-6 text-yellow-600" />}
                color="#F2C94C"
                width="100%"
                fields={[
                  { name: 'mastery_impacts', type: 'jsonb', description: 'Object with domain keys → integer values' },
                ]}
              >
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Example Mastery Impact:</p>
                  <pre className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
{`{
  "product": +4,
  "marketing": +2,
  "sales": 0,
  "finance": +1,
  "operations": 0,
  "hr": 0
}`}
                  </pre>
                </div>
              </SchemaCard>
            </div>
          </div>
        </section>

        {/* SECTION: Tasks */}
        <section>
          <SectionHeader
            title="Tasks"
            icon={<CheckSquare className="w-7 h-7 text-green-600" />}
            color="#27D17C"
          />
          <div className="flex justify-center">
            <SchemaCard
              title="Task"
              icon={<CheckSquare className="w-6 h-6 text-green-600" />}
              color="#27D17C"
              width="400px"
              fields={[
                { name: 'id', type: 'uuid', isKey: true },
                { name: 'title', type: 'string' },
                { name: 'is_complete', type: 'boolean' },
                { name: 'xp', type: 'integer' },
                { name: 'time_estimate_minutes', type: 'integer' },
                { name: 'definition_of_done', type: 'text' },
                { name: 'created_by_agi', type: 'boolean' },
              ]}
            >
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  Tasks are stored as <strong>JSONB array</strong> within the parent Node object.
                </p>
              </div>
            </SchemaCard>
          </div>
        </section>

        {/* SECTION: Kill Rules */}
        <section>
          <SectionHeader
            title="Kill Rules"
            icon={<AlertTriangle className="w-7 h-7 text-red-600" />}
            color="#EB5757"
          />
          <div className="flex justify-center">
            <SchemaCard
              title="KillRule"
              icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
              color="#EB5757"
              width="400px"
              fields={[
                { name: 'id', type: 'uuid', isKey: true },
                { name: 'name', type: 'string' },
                { name: 'condition', type: 'string', description: 'e.g., "Task overdue by 7 days"' },
                { name: 'severity', type: 'enum', description: 'low, medium, high' },
                { name: 'triggers_failure_state', type: 'boolean' },
                { name: 'recovery_plan', type: 'text' },
              ]}
            >
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  Kill Rules define failure conditions that can transition a node to "failed" state.
                </p>
              </div>
            </SchemaCard>
          </div>
        </section>

        {/* SECTION: Mastery */}
        <section>
          <SectionHeader
            title="Mastery System"
            icon={<Award className="w-7 h-7 text-yellow-600" />}
            color="#F2C94C"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SchemaCard
              title="Mastery"
              icon={<Award className="w-6 h-6 text-yellow-600" />}
              color="#F2C94C"
              width="100%"
              fields={[
                { name: 'product', type: 'float', description: '0 to 100' },
                { name: 'marketing', type: 'float', description: '0 to 100' },
                { name: 'sales', type: 'float', description: '0 to 100' },
                { name: 'finance', type: 'float', description: '0 to 100' },
                { name: 'operations', type: 'float', description: '0 to 100' },
                { name: 'hr', type: 'float', description: '0 to 100' },
                { name: 'level', type: 'integer' },
                { name: 'total_xp', type: 'integer' },
                { name: 'xp_to_next_level', type: 'integer' },
                { name: 'recent_gains', type: 'array<MasteryGain>' },
              ]}
            />

            <SchemaCard
              title="MasteryGain"
              icon={<TrendingUp className="w-6 h-6 text-yellow-600" />}
              color="#F2C94C"
              width="100%"
              fields={[
                { name: 'domain', type: 'string', description: 'product, marketing, etc.' },
                { name: 'amount', type: 'integer' },
                { name: 'timestamp', type: 'timestamp' },
              ]}
            >
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  Mastery is stored as <strong>JSONB</strong> in the Roadmap object.
                </p>
              </div>
            </SchemaCard>
          </div>
        </section>

        {/* SECTION: Settings */}
        <section>
          <SectionHeader
            title="Settings"
            icon={<SettingsIcon className="w-7 h-7 text-slate-600" />}
            color="#64748B"
          />
          <div className="flex justify-center">
            <SchemaCard
              title="Settings"
              icon={<SettingsIcon className="w-6 h-6 text-slate-600" />}
              color="#64748B"
              width="400px"
              fields={[
                { name: 'ai_auto_optimize', type: 'boolean' },
                { name: 'branch_lock_overrides', type: 'array<uuid>', description: 'Branch IDs locked by user' },
                { name: 'quick_wins_mode_enabled', type: 'boolean' },
                { name: 'notifications_enabled', type: 'boolean' },
              ]}
            >
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                  Settings stored as <strong>JSONB</strong> in the Roadmap object.
                </p>
              </div>
            </SchemaCard>
          </div>
        </section>

        {/* SECTION: Quick Wins */}
        <section>
          <SectionHeader
            title="Quick Wins Mode"
            icon={<Zap className="w-7 h-7 text-orange-600" />}
            color="#FF8C42"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SchemaCard
              title="QuickWins"
              icon={<Zap className="w-6 h-6 text-orange-600" />}
              color="#FF8C42"
              width="100%"
              fields={[
                { name: 'generated_at', type: 'timestamp' },
                { name: 'tasks', type: 'array<QuickWin>' },
                { name: 'required_to_exit', type: 'integer', description: 'Must complete N to exit mode' },
              ]}
            />

            <SchemaCard
              title="QuickWin"
              icon={<Target className="w-6 h-6 text-orange-600" />}
              color="#FF8C42"
              width="100%"
              fields={[
                { name: 'node_id', type: 'uuid' },
                { name: 'task_id', type: 'uuid | null' },
                { name: 'title', type: 'string' },
                { name: 'category', type: 'string' },
                { name: 'reason', type: 'string', description: 'Why this is a quick win' },
                { name: 'time_estimate_minutes', type: 'integer' },
                { name: 'xp', type: 'integer' },
              ]}
            />
          </div>
        </section>

        {/* SECTION: Relationships Diagram */}
        <section>
          <SectionHeader
            title="Data Relationships"
            icon={<Network className="w-7 h-7 text-blue-600" />}
            color="#2F80FF"
          />
          
          <div
            className="p-8 rounded-2xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 252, 255, 0.98))',
              border: '2px solid rgba(47, 128, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(47, 128, 255, 0.2)',
            }}
          >
            <div className="space-y-6">
              {/* Roadmap → Chapters */}
              <div className="flex items-center">
                <div className="px-4 py-2 rounded-lg bg-blue-100 border-2 border-blue-300 font-bold text-blue-800">
                  Roadmap
                </div>
                <ConnectionLine color="#6C5CE7" label="has many" />
                <div className="px-4 py-2 rounded-lg bg-purple-100 border-2 border-purple-300 font-bold text-purple-800">
                  Chapters
                </div>
              </div>

              {/* Roadmap → Branches */}
              <div className="flex items-center">
                <div className="px-4 py-2 rounded-lg bg-blue-100 border-2 border-blue-300 font-bold text-blue-800">
                  Roadmap
                </div>
                <ConnectionLine color="#27D17C" label="has many" />
                <div className="px-4 py-2 rounded-lg bg-green-100 border-2 border-green-300 font-bold text-green-800">
                  Branches
                </div>
              </div>

              {/* Branches → Nodes */}
              <div className="flex items-center">
                <div className="px-4 py-2 rounded-lg bg-green-100 border-2 border-green-300 font-bold text-green-800">
                  Branch
                </div>
                <ConnectionLine color="#FF8C42" label="contains" />
                <div className="px-4 py-2 rounded-lg bg-orange-100 border-2 border-orange-300 font-bold text-orange-800">
                  Nodes
                </div>
              </div>

              {/* Nodes → Tasks */}
              <div className="flex items-center">
                <div className="px-4 py-2 rounded-lg bg-orange-100 border-2 border-orange-300 font-bold text-orange-800">
                  Node
                </div>
                <ConnectionLine color="#27D17C" label="has many" />
                <div className="px-4 py-2 rounded-lg bg-green-100 border-2 border-green-300 font-bold text-green-800">
                  Tasks
                </div>
              </div>

              {/* Nodes → KillRules */}
              <div className="flex items-center">
                <div className="px-4 py-2 rounded-lg bg-orange-100 border-2 border-orange-300 font-bold text-orange-800">
                  Node
                </div>
                <ConnectionLine color="#EB5757" label="references" />
                <div className="px-4 py-2 rounded-lg bg-red-100 border-2 border-red-300 font-bold text-red-800">
                  KillRule
                </div>
              </div>

              {/* Roadmap → Mastery */}
              <div className="flex items-center">
                <div className="px-4 py-2 rounded-lg bg-blue-100 border-2 border-blue-300 font-bold text-blue-800">
                  Roadmap
                </div>
                <ConnectionLine color="#F2C94C" label="has" />
                <div className="px-4 py-2 rounded-lg bg-yellow-100 border-2 border-yellow-300 font-bold text-yellow-800">
                  Mastery
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Database Implementation Notes */}
        <section>
          <SectionHeader
            title="Database Implementation"
            icon={<Database className="w-7 h-7 text-slate-600" />}
            color="#64748B"
          />
          
          <div
            className="p-6 rounded-2xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.12), rgba(148, 163, 184, 0.08))',
              border: '2px solid rgba(100, 116, 139, 0.25)',
              boxShadow: '0 8px 24px rgba(100, 116, 139, 0.15)',
            }}
          >
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Code className="w-5 h-5 text-slate-600" />
              PostgreSQL / Supabase Schema Guidelines
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Use snake_case for all field names</p>
                  <p className="text-sm text-slate-600">Standard PostgreSQL convention</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">UUID for all primary keys</p>
                  <p className="text-sm text-slate-600">Use gen_random_uuid() as default</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">JSONB columns for nested objects</p>
                  <p className="text-sm text-slate-600">Tasks, AI metadata, Mastery, Settings stored as JSONB</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Array fields for relationships</p>
                  <p className="text-sm text-slate-600">required_node_ids, optional_node_ids as UUID[]</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Real-time subscriptions ready</p>
                  <p className="text-sm text-slate-600">Enable Supabase Realtime for live updates</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Row-level security (RLS) policies</p>
                  <p className="text-sm text-slate-600">User-scoped access with auth.uid() checks</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-12 mb-8">
        <div
          className="p-6 rounded-2xl backdrop-blur-xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.12), rgba(108, 92, 231, 0.08))',
            border: '2px solid rgba(47, 128, 255, 0.25)',
            boxShadow: '0 8px 24px rgba(47, 128, 255, 0.15)',
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-slate-900">AI-Reactive Roadmap System</h3>
          </div>
          <p className="text-sm text-slate-700">
            This data model supports dynamic AI optimization, real-time state updates, dependency management,
            mastery tracking, and progressive unlock mechanics for the Cofounder+ platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RoadmapDataModel;
