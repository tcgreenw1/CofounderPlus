import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Brain,
  Sparkles,
  Eye,
  Search,
  Lightbulb,
  GitBranch,
  Activity,
  Award,
  TrendingUp,
  ArrowRight,
  Zap,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  Users,
  TrendingDown,
  AlertCircle,
  Plus,
  Shuffle,
  Scissors,
  Merge,
  Trash2,
  Lock,
  Ban,
  Star,
  PlayCircle,
  CheckCircle,
  Edit,
  XCircle,
  Circle,
  Flame,
  ListChecks,
} from 'lucide-react';

/**
 * AGI Logic Engine Blueprint
 * Uses CSS variables from design system throughout
 */

interface GlassCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function GlassCard({ title, subtitle, icon, children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`p-6 backdrop-blur-xl border-2 border-primary/25 bg-card shadow-lg ${className}`}
      style={{ borderRadius: '32px' }}
    >
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div
            className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-primary/10 border-2 border-primary/40 shadow-md"
            style={{ borderRadius: '12px' }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  colorClass?: string;
}

function SectionHeader({ title, icon, subtitle, colorClass = 'bg-primary/10 border-primary/40' }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-2">
        <div
          className={`w-14 h-14 flex items-center justify-center border-2 shadow-md ${colorClass}`}
          style={{ borderRadius: '16px' }}
        >
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        <div className="flex-1 h-1 rounded-full bg-gradient-to-r from-primary/50 to-transparent" />
      </div>
      {subtitle && (
        <p className="text-muted-foreground ml-[72px]">{subtitle}</p>
      )}
    </div>
  );
}

interface FlowNodeProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  showArrow?: boolean;
  colorClass?: string;
}

function FlowNode({ title, icon, items, showArrow = true, colorClass = 'border-primary/25' }: FlowNodeProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`p-5 backdrop-blur-xl min-w-[200px] bg-card border-2 shadow-lg ${colorClass}`}
        style={{ borderRadius: '28px' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 flex items-center justify-center bg-primary/10 border-2 border-primary/40"
            style={{ borderRadius: '10px' }}
          >
            {icon}
          </div>
          <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">{title}</h4>
        </div>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      {showArrow && (
        <ArrowRight className="w-6 h-6 flex-shrink-0 text-primary" />
      )}
    </div>
  );
}

export function AGILogicEngineBlueprint() {
  const navigate = useNavigate();

  const nodeStates = [
    { state: 'available', description: 'Ready to start', icon: <Circle className="w-4 h-4 text-muted-foreground" /> },
    { state: 'active', description: 'In progress now', icon: <PlayCircle className="w-4 h-4 text-primary" /> },
    { state: 'recommended', description: 'AGI suggests this', icon: <Star className="w-4 h-4 text-energy" /> },
    { state: 'aiInserted', description: 'AGI added this', icon: <Sparkles className="w-4 h-4 text-success" /> },
    { state: 'aiModified', description: 'AGI edited this', icon: <Edit className="w-4 h-4 text-primary" /> },
    { state: 'blocked', description: 'Dependencies not met', icon: <Ban className="w-4 h-4 text-energy" /> },
    { state: 'locked', description: 'User locked', icon: <Lock className="w-4 h-4 text-muted-foreground" /> },
    { state: 'failed', description: 'Kill rule triggered', icon: <XCircle className="w-4 h-4 text-action" /> },
    { state: 'completed', description: 'All tasks done', icon: <CheckCircle className="w-4 h-4 text-success" /> },
  ];

  return (
    <div className="min-h-screen bg-background p-8 pb-20 sm:pb-24">
      {/* Floating Legend */}
      <div
        className="fixed top-24 right-8 z-50 p-4 backdrop-blur-xl max-w-[200px] bg-card border-2 border-primary/20 shadow-lg"
        style={{ borderRadius: '28px' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-primary" />
          <h4 className="font-bold text-sm text-foreground">AGI Thinking System</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Real-time intelligence that observes, analyzes, and reshapes your roadmap
        </p>
      </div>

      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/roadmap')}
            className="w-10 h-10 flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-card border-2 border-primary/20 shadow-md"
            style={{ borderRadius: '12px' }}
          >
            <ChevronLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Cofounder+ — AGI Logic Engine</h1>
            </div>
            <p className="text-lg text-muted-foreground ml-11">
              How the Roadmap Thinks, Adapts, Reorders, Inserts, Recommends, and Guides the User
            </p>
          </div>
        </div>

        <div
          className="p-6 backdrop-blur-xl bg-card border-2 border-primary/15 shadow-lg"
          style={{ borderRadius: '32px' }}
        >
          <div className="flex items-start gap-4">
            <Brain className="w-7 h-7 flex-shrink-0 mt-1 text-primary" />
            <div>
              <h3 className="font-bold text-foreground mb-3 text-lg">Intelligent Roadmap Architecture</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The AGI Logic Engine is a multi-stage system that continuously observes user behavior, business metrics, 
                and roadmap state to dynamically optimize the user's path to success. It scores nodes, detects risks, 
                inserts missing steps, reorders priorities, and triggers Quick Wins mode when momentum stalls.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '112px' }}>
        {/* SECTION 2 — Core AGI Loop */}
        <section>
          <SectionHeader
            title="Core AGI Loop"
            icon={<Activity className="w-8 h-8 text-primary" />}
            subtitle="The continuous cycle that powers intelligent roadmap adaptation"
          />

          <div className="overflow-x-auto pb-6">
            <div className="flex items-center gap-4 min-w-max">
              <FlowNode
                title="OBSERVE"
                icon={<Eye className="w-5 h-5 text-primary" />}
                colorClass="border-primary/25"
                items={[
                  'Node states',
                  'Mastery levels',
                  'Completed/failed/skipped nodes',
                  'Business KPIs',
                ]}
              />
              
              <FlowNode
                title="ANALYZE"
                icon={<Search className="w-5 h-5 text-success" />}
                colorClass="border-success/25"
                items={[
                  'Score nodes',
                  'Detect risks',
                  'Identify bottlenecks',
                  'Evaluate metric problems',
                ]}
              />
              
              <FlowNode
                title="THINK"
                icon={<Lightbulb className="w-5 h-5 text-energy" />}
                colorClass="border-energy/25"
                items={[
                  'Predict highest-leverage action',
                  'Determine roadmap shape',
                  'Compare alternate paths',
                  'Decide where user should go next',
                ]}
              />
              
              <FlowNode
                title="STRUCTURAL OPS"
                icon={<GitBranch className="w-5 h-5 text-energy" />}
                colorClass="border-energy/25"
                items={[
                  'Reorder nodes',
                  'Insert nodes',
                  'Split / Merge nodes',
                  'Remove irrelevant nodes',
                ]}
              />
              
              <FlowNode
                title="STATE ENGINE"
                icon={<Activity className="w-5 h-5 text-primary" />}
                colorClass="border-primary/25"
                items={[
                  'Lock / Block',
                  'Recommended',
                  'Active',
                  'Completed',
                  'Failed (Kill Rule)',
                ]}
              />
              
              <FlowNode
                title="MASTERY ENGINE"
                icon={<Award className="w-5 h-5 text-energy" />}
                colorClass="border-energy/25"
                items={[
                  'XP updates',
                  'Mastery rebalancing',
                  'Identity shaping',
                  'Weak mastery boosting',
                ]}
              />
              
              <FlowNode
                title="OUTPUT"
                icon={<TrendingUp className="w-5 h-5 text-success" />}
                colorClass="border-success/25"
                items={[
                  'Updated roadmap JSON',
                  'AGI Change Log',
                  'Quick Wins Mode (optional)',
                ]}
                showArrow={false}
              />
            </div>
          </div>
        </section>

        {/* SECTION 3 — Node Scoring System */}
        <section>
          <SectionHeader
            title="Node Scoring System"
            icon={<Target className="w-8 h-8 text-primary" />}
            subtitle="The Backbone: How AGI ranks and prioritizes every node"
          />

          <GlassCard
            title="Scoring Factors"
            subtitle="8 weighted components that determine node priority"
            icon={<BarChart3 className="w-6 h-6 text-primary" />}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Priority Base', color: 'primary' },
                { label: 'Dependency Urgency', color: 'action' },
                { label: 'Metric Impact', color: 'success' },
                { label: 'Phase Alignment', color: 'energy' },
                { label: 'Time Efficiency', color: 'primary' },
                { label: 'Mastery Balance', color: 'energy' },
                { label: 'User Behavior', color: 'muted' },
                { label: 'Risk Impact', color: 'action' },
              ].map((chip, idx) => (
                <div
                  key={idx}
                  className={`px-4 py-3 backdrop-blur-xl text-center border-2 border-${chip.color}/25 bg-${chip.color}/10 shadow-sm`}
                  style={{ borderRadius: '28px' }}
                >
                  <p className="text-sm font-bold text-foreground">{chip.label}</p>
                </div>
              ))}
            </div>

            <div
              className="p-6 backdrop-blur-xl bg-secondary border-4 border-primary/30 shadow-2xl"
              style={{ borderRadius: '28px' }}
            >
              <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Scoring Formula
              </h4>
              <pre className="text-sm font-mono text-foreground leading-relaxed bg-background/50 p-4 rounded-xl border border-primary/20">
{`nodeScore = 
  (priorityBase * 1.0) +
  (dependencyUrgency * 2.0) +
  (metricImpact * 3.0) +
  (phaseAlignment * 1.5) +
  (timeEfficiency * 1.0) +
  (masteryBalance * 1.2) –
  (skipPenalty * 2.0)`}
              </pre>
              <p className="text-xs text-muted-foreground mt-4">
                Higher scores = higher priority. AGI uses this to determine which nodes to recommend and where to reorder.
              </p>
            </div>
          </GlassCard>
        </section>

        {/* SECTION 4 — Structural Ops */}
        <section>
          <SectionHeader
            title="AGI Structural Operations"
            icon={<GitBranch className="w-8 h-8 text-energy" />}
            colorClass="bg-energy/10 border-energy/40"
            subtitle="How the AGI edits and reshapes the roadmap structure"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'REORDER', desc: 'Sort nodes based on score while respecting dependencies. Highest priority nodes move up.', icon: <Shuffle className="w-6 h-6 text-primary" />, color: 'primary' },
              { title: 'INSERT', desc: 'Add missing best practices or model-specific milestones that the user hasn\'t considered.', icon: <Plus className="w-6 h-6 text-success" />, color: 'success' },
              { title: 'SPLIT', desc: 'Break overwhelming milestones into manageable steps to reduce friction and increase momentum.', icon: <Scissors className="w-6 h-6 text-energy" />, color: 'energy' },
              { title: 'MERGE', desc: 'Combine tiny or redundant milestones for clarity and reduce roadmap clutter.', icon: <Merge className="w-6 h-6 text-energy" />, color: 'energy' },
              { title: 'REMOVE', desc: 'Hide irrelevant or no-longer-applicable steps based on business model or metrics.', icon: <Trash2 className="w-6 h-6 text-action" />, color: 'action' },
            ].map((op, idx) => (
              <div
                key={idx}
                className={`p-5 backdrop-blur-xl bg-card border-2 border-${op.color}/25 shadow-lg`}
                style={{ borderRadius: '28px' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center bg-${op.color}/10 border-2 border-${op.color}/40`}
                    style={{ borderRadius: '12px' }}
                  >
                    {op.icon}
                  </div>
                  <h4 className="font-bold text-foreground">{op.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{op.desc}</p>
              </div>
            ))}

            <div
              className="p-6 backdrop-blur-xl flex items-center justify-center bg-card border-2 border-dashed border-energy/25"
              style={{ borderRadius: '28px' }}
            >
              <div className="text-center">
                <GitBranch className="w-12 h-12 mx-auto mb-3 text-energy" />
                <p className="text-sm font-bold text-foreground">Roadmap Reshaping</p>
                <p className="text-xs text-muted-foreground mt-1">Dynamic structure adaptation</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 — Node State Machine */}
        <section>
          <SectionHeader
            title="Node State Machine"
            icon={<Activity className="w-8 h-8 text-muted-foreground" />}
            colorClass="bg-muted/20 border-muted-foreground/40"
            subtitle="All possible node states managed by the AGI State Engine"
          />

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {nodeStates.map((state, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div
                    className="w-full px-4 py-3 backdrop-blur-xl flex items-center justify-center gap-2 bg-primary/10 border-2 border-primary/30 shadow-sm"
                    style={{ borderRadius: '28px' }}
                  >
                    {state.icon}
                    <span className="font-bold text-sm text-foreground">{state.state}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center px-2">{state.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="h-1 rounded-full mt-6"
            style={{
              background: 'linear-gradient(90deg, var(--primary), var(--success), var(--energy), var(--action))',
            }}
          />
        </section>

        {/* SECTION 6 — Mastery Engine */}
        <section>
          <SectionHeader
            title="Mastery Engine"
            icon={<Award className="w-8 h-8 text-energy" />}
            colorClass="bg-energy/10 border-energy/40"
            subtitle="XP → Level → Identity: How completing nodes shapes the user"
          />

          <GlassCard
            title="Mastery Pipeline"
            subtitle="From task completion to identity transformation"
            icon={<Award className="w-6 h-6 text-energy" />}
          >
            <div className="space-y-6">
              <div
                className="p-5 backdrop-blur-xl bg-secondary border-2 border-energy/25"
                style={{ borderRadius: '28px' }}
              >
                <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-energy" />
                  XP Gain Pipeline
                </h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-2 rounded-lg font-semibold text-sm bg-energy/10 text-foreground border border-energy/20">
                    Node Completion
                  </span>
                  <ArrowRight className="w-4 h-4 text-energy" />
                  <span className="px-3 py-2 rounded-lg font-semibold text-sm bg-energy/10 text-foreground border border-energy/20">
                    Mastery Update
                  </span>
                  <ArrowRight className="w-4 h-4 text-energy" />
                  <span className="px-3 py-2 rounded-lg font-semibold text-sm bg-energy/10 text-foreground border border-energy/20">
                    Level Up
                  </span>
                  <ArrowRight className="w-4 h-4 text-energy" />
                  <span className="px-3 py-2 rounded-lg font-semibold text-sm bg-energy/10 text-foreground border border-energy/20">
                    Affects Node Scoring
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-3">Mastery Domains</h4>
                <div className="flex flex-wrap gap-3">
                  {['Product', 'Marketing', 'Sales', 'Finance', 'Operations', 'HR'].map((domain, idx) => {
                    const colors = ['primary', 'success', 'action', 'energy', 'primary', 'success'];
                    return (
                      <div
                        key={idx}
                        className={`px-4 py-2 rounded-xl font-semibold bg-${colors[idx]}/10 border-2 border-${colors[idx]}/30 text-foreground`}
                      >
                        {domain}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 backdrop-blur-xl bg-success/10 border-2 border-success/20"
                  style={{ borderRadius: '20px' }}
                >
                  <h5 className="font-bold text-foreground mb-2 text-sm">Rebalancing Logic</h5>
                  <p className="text-xs text-muted-foreground">
                    AGI detects lopsided mastery and inserts nodes to balance weak areas
                  </p>
                </div>

                <div
                  className="p-4 backdrop-blur-xl bg-action/10 border-2 border-action/20"
                  style={{ borderRadius: '20px' }}
                >
                  <h5 className="font-bold text-foreground mb-2 text-sm">Weak Mastery Boost</h5>
                  <p className="text-xs text-muted-foreground">
                    Nodes in weak domains get higher priority scores to encourage growth
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-3">Level Progression</h4>
                <div className="relative h-8 rounded-full overflow-hidden bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: '67%',
                      background: 'linear-gradient(90deg, var(--energy), var(--success))',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">Level 8 → 9 (2,340 / 3,500 XP)</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* SECTION 7 — Metrics Engine */}
        <section>
          <SectionHeader
            title="Metrics-Aware Behavior"
            icon={<BarChart3 className="w-8 h-8 text-primary" />}
            subtitle="How business KPIs influence AGI decisions"
          />

          <GlassCard
            title="Tracked Metrics"
            subtitle="Business health indicators that drive roadmap optimization"
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Landing Conversion', icon: <Target className="w-6 h-6 text-success" />, color: 'success' },
                { label: 'MRR', icon: <DollarSign className="w-6 h-6 text-primary" />, color: 'primary' },
                { label: 'Churn Rate', icon: <TrendingDown className="w-6 h-6 text-action" />, color: 'action' },
                { label: 'Activation Rate', icon: <Users className="w-6 h-6 text-energy" />, color: 'energy' },
                { label: 'CAC → LTV', icon: <TrendingUp className="w-6 h-6 text-energy" />, color: 'energy' },
                { label: 'Retention Signals', icon: <Activity className="w-6 h-6 text-muted-foreground" />, color: 'muted' },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className={`p-4 backdrop-blur-xl text-center bg-${metric.color}/10 border-2 border-${metric.color}/20`}
                  style={{ borderRadius: '20px' }}
                >
                  <div className="mx-auto mb-2 flex items-center justify-center">{metric.icon}</div>
                  <p className="font-bold text-sm text-foreground">{metric.label}</p>
                </div>
              ))}
            </div>

            <div
              className="p-5 backdrop-blur-xl bg-secondary border-2 border-primary/20"
              style={{ borderRadius: '28px' }}
            >
              <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Metric-Driven Rules
              </h4>
              <div className="space-y-3">
                {[
                  { rule: 'Low Conversion', action: 'boost landing & messaging nodes', color: 'success' },
                  { rule: 'Low MRR', action: 'boost sales & acquisition nodes', color: 'primary' },
                  { rule: 'High Churn', action: 'boost onboarding & retention nodes', color: 'action' },
                  { rule: 'Low Activation', action: 'boost user experience & feature adoption nodes', color: 'energy' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <ArrowRight className={`w-4 h-4 flex-shrink-0 mt-1 text-${item.color}`} />
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">{item.rule}</strong> → {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        {/* SECTION 8 — Quick Wins Mode Logic */}
        <section>
          <SectionHeader
            title="Quick Wins Mode Logic"
            icon={<Zap className="w-8 h-8 text-energy" />}
            colorClass="bg-energy/10 border-energy/40"
            subtitle="Emergency momentum recovery system"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard
              title="Quick Wins Triggered When"
              subtitle="Conditions that activate emergency mode"
              icon={<Flame className="w-6 h-6 text-energy" />}
            >
              <div className="space-y-3">
                {[
                  { text: 'No completion in 3+ days', detail: 'user is stuck or overwhelmed', icon: <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-energy" /> },
                  { text: 'Multiple failures/skips', detail: 'current nodes are too hard', icon: <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-energy" /> },
                  { text: 'App opened with no progress', detail: 'user needs quick wins', icon: <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-energy" /> },
                  { text: 'Just finished massive milestone', detail: 'celebrate with easy wins', icon: <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-success" /> },
                ].map((trigger, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-energy/10 border border-energy/20">
                    {trigger.icon}
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">{trigger.text}</strong> — {trigger.detail}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard
              title="Quick Wins Selection"
              subtitle="How AGI chooses which tasks to show"
              icon={<ListChecks className="w-6 h-6 text-energy" />}
            >
              <div className="space-y-3">
                {[
                  { text: 'Tasks < 15 minutes', detail: 'must be completable quickly', icon: <Clock className="w-5 h-5 flex-shrink-0 mt-0.5 text-energy" /> },
                  { text: 'High XP per minute', detail: 'maximum dopamine reward', icon: <Zap className="w-5 h-5 flex-shrink-0 mt-0.5 text-energy" /> },
                  { text: 'Unblocks something', detail: 'removes dependencies for other nodes', icon: <Target className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" /> },
                  { text: 'Strengthens weak mastery', detail: 'balances skill development', icon: <Award className="w-5 h-5 flex-shrink-0 mt-0.5 text-success" /> },
                ].map((criterion, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-energy/10 border border-energy/20">
                    {criterion.icon}
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">{criterion.text}</strong> — {criterion.detail}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        {/* SECTION 9 — AGI Change Log */}
        <section>
          <SectionHeader
            title="AGI Change Log"
            icon={<ListChecks className="w-8 h-8 text-primary" />}
            subtitle="What the UI shows users when AGI modifies the roadmap"
          />

          <GlassCard
            title="Change Types"
            subtitle="All possible AGI modifications that users can see and approve/reject"
            icon={<Edit className="w-6 h-6 text-primary" />}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'inserted', desc: 'New node added by AGI', icon: <Plus className="w-4 h-4 text-white" />, color: 'success', bgColor: 'bg-success' },
                { label: 'reordered', desc: 'Priority changed', icon: <Shuffle className="w-4 h-4 text-white" />, color: 'primary', bgColor: 'bg-primary' },
                { label: 'removed', desc: 'Hidden as irrelevant', icon: <Trash2 className="w-4 h-4 text-white" />, color: 'action', bgColor: 'bg-action' },
                { label: 'split', desc: 'Broken into steps', icon: <Scissors className="w-4 h-4 text-white" />, color: 'energy', bgColor: 'bg-energy' },
                { label: 'merged', desc: 'Combined for clarity', icon: <Merge className="w-4 h-4 text-white" />, color: 'energy', bgColor: 'bg-energy' },
                { label: 'recommended', desc: 'Flagged as priority', icon: <Star className="w-4 h-4 text-white" />, color: 'primary', bgColor: 'bg-primary' },
              ].map((change, idx) => (
                <div
                  key={idx}
                  className={`p-4 backdrop-blur-xl bg-${change.color}/10 border-2 border-${change.color}/20`}
                  style={{ borderRadius: '20px' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${change.bgColor}`}>
                      {change.icon}
                    </div>
                    <p className="font-bold text-sm text-foreground">{change.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{change.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </div>

      {/* Footer */}
      <div className="max-w-[1600px] mx-auto mt-20 mb-8">
        <div
          className="p-8 backdrop-blur-xl text-center bg-card border-2 border-primary/15 shadow-lg"
          style={{ borderRadius: '32px' }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Intelligent Roadmap System</h3>
          </div>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The AGI Logic Engine continuously observes, analyzes, and optimizes your roadmap to keep you moving 
            toward success. It scores every node, detects risks, inserts missing steps, reorders priorities, 
            balances mastery development, and triggers Quick Wins mode when momentum stalls. This is not a static 
            plan — it's a living, adaptive system that thinks alongside you.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AGILogicEngineBlueprint;