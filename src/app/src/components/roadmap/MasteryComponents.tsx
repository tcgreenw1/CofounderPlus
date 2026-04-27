import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Target,
  Settings,
  Users,
  AlertTriangle,
  ArrowRight,
  Star,
  Trophy,
  Zap,
  X,
} from 'lucide-react';

/**
 * MASTERY DASHBOARD COMPONENTS
 * Apple Liquid Glass Design System
 * Toy Box Pop Color Palette
 * No background gradients - clean glass aesthetic
 */

// ============================================================================
// 1. MASTERY / LEVEL RING
// Circular glass container with level and XP progress
// ============================================================================

interface LevelRingProps {
  currentLevel: number;
  currentXP: number;
  maxXP: number;
  size?: number;
}

export function MasteryLevelRing({ 
  currentLevel, 
  currentXP, 
  maxXP,
  size = 200 
}: LevelRingProps) {
  const progress = (currentXP / maxXP) * 100;
  const circumference = 2 * Math.PI * (size / 2 - 20);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="mastery-level-ring relative flex items-center justify-center"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Background Glass Circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '2px solid rgba(47, 128, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(47, 128, 255, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
        }}
      />

      {/* Progress Ring */}
      <svg
        className="absolute inset-0 transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 20}
          fill="none"
          stroke="rgba(47, 128, 255, 0.15)"
          strokeWidth="12"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 20}
          fill="none"
          stroke="#2F80FF"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: 'drop-shadow(0 0 12px rgba(47, 128, 255, 0.6))',
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>

      {/* Center Content */}
      <div className="relative z-10 text-center">
        <div className="text-5xl font-bold text-slate-900 mb-1">
          {currentLevel}
        </div>
        <div className="text-sm font-semibold text-slate-600">
          {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
        </div>
      </div>

      {/* Glow Effect */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: '0 0 40px rgba(47, 128, 255, 0.3)',
          opacity: 0.6,
        }}
      />
    </div>
  );
}

// ============================================================================
// 2. MASTERY / SKILL BAR
// Progress bar with category icon, title, percentage, animated shimmer
// ============================================================================

interface SkillBarProps {
  category: 'Product' | 'Marketing' | 'Sales' | 'Finance' | 'Ops' | 'HR';
  progress: number;
  level?: number;
}

const skillConfig = {
  Product: { icon: Sparkles, color: '#6C5CE7', label: 'Product Mastery' },
  Marketing: { icon: TrendingUp, color: '#27D17C', label: 'Marketing Mastery' },
  Sales: { icon: Target, color: '#F2C94C', label: 'Sales Mastery' },
  Finance: { icon: DollarSign, color: '#2F80FF', label: 'Finance Mastery' },
  Ops: { icon: Settings, color: '#FF6B35', label: 'Operations Mastery' },
  HR: { icon: Users, color: '#EB5757', label: 'HR Mastery' },
};

export function MasterySkillBar({ category, progress, level }: SkillBarProps) {
  const config = skillConfig[category];
  const Icon = config.icon;

  return (
    <div
      className="mastery-skill-bar p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `2px solid ${config.color}30`,
        boxShadow: `0 4px 16px ${config.color}20, inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `${config.color}20`,
              border: `2px solid ${config.color}40`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: config.color }} />
          </div>
          
          {/* Title */}
          <div>
            <div className="font-bold text-slate-900">{config.label}</div>
            {level && (
              <div className="text-xs text-slate-600">Level {level}</div>
            )}
          </div>
        </div>

        {/* Percentage */}
        <div className="text-2xl font-bold" style={{ color: config.color }}>
          {progress}%
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="h-3 rounded-full overflow-hidden relative"
        style={{
          background: `${config.color}15`,
          border: `1px solid ${config.color}30`,
        }}
      >
        {/* Fill */}
        <div
          className="h-full transition-all duration-1000 ease-out relative"
          style={{
            width: `${progress}%`,
            background: config.color,
            boxShadow: `0 0 12px ${config.color}60`,
          }}
        >
          {/* Shimmer Animation */}
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. MASTERY / HEX CHART
// 6-axis radar chart with glass hexagon
// ============================================================================

interface HexChartProps {
  data: {
    Product: number;
    Marketing: number;
    Sales: number;
    Finance: number;
    Ops: number;
    HR: number;
  };
  size?: number;
}

export function MasteryHexChart({ data, size = 400 }: HexChartProps) {
  const skills = ['Product', 'Marketing', 'Sales', 'Finance', 'Ops', 'HR'];
  const center = size / 2;
  const radius = size / 2 - 60;
  
  // Calculate hexagon points
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = (radius * value) / 100;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Background hexagon points
  const bgPoints = skills.map((_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  // Data polygon points
  const dataPoints = skills.map((skill, i) => getPoint(i, data[skill as keyof typeof data]));

  const bgPathData = `M ${bgPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
  const dataPathData = `M ${dataPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

  return (
    <div
      className="mastery-hex-chart relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg width={size} height={size}>
        {/* Grid Lines */}
        {[20, 40, 60, 80, 100].map((percent) => {
          const pts = skills.map((_, i) => getPoint(i, percent));
          const path = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
          return (
            <path
              key={percent}
              d={path}
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis Lines */}
        {bgPoints.map((point, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Background Hexagon */}
        <path
          d={bgPathData}
          fill="rgba(47, 128, 255, 0.05)"
          stroke="rgba(47, 128, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Data Polygon */}
        <path
          d={dataPathData}
          fill="rgba(47, 128, 255, 0.25)"
          stroke="#2F80FF"
          strokeWidth="3"
          style={{
            filter: 'drop-shadow(0 0 16px rgba(47, 128, 255, 0.5))',
          }}
        />

        {/* Vertex Glows */}
        {dataPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="6"
            fill="#2F80FF"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(47, 128, 255, 0.8))',
            }}
          />
        ))}
      </svg>

      {/* Labels */}
      {skills.map((skill, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const labelRadius = radius + 35;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        
        return (
          <div
            key={skill}
            className="absolute text-sm font-bold text-slate-700"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {skill}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 4. MASTERY / WEAKNESS ITEM
// Glass warning card for skill imbalances
// ============================================================================

interface WeaknessItemProps {
  title: string;
  severity: 'low' | 'medium' | 'high';
  onFix?: () => void;
}

export function MasteryWeaknessItem({ title, severity, onFix }: WeaknessItemProps) {
  const severityConfig = {
    low: { color: '#F2C94C', label: 'Low' },
    medium: { color: '#FF6B35', label: 'Medium' },
    high: { color: '#EB5757', label: 'High' },
  };

  const config = severityConfig[severity];

  return (
    <div
      className="mastery-weakness-item flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: `2px solid ${config.color}30`,
        boxShadow: `0 4px 12px ${config.color}20, inset 0 1px 2px rgba(255, 255, 255, 0.5)`,
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Warning Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${config.color}20`,
            border: `2px solid ${config.color}40`,
          }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="font-semibold text-slate-900 mb-1">{title}</div>
          <div
            className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              background: `${config.color}20`,
              color: config.color,
              border: `1px solid ${config.color}40`,
            }}
          >
            {config.label} Priority
          </div>
        </div>
      </div>

      {/* Fix Button */}
      {onFix && (
        <button
          onClick={onFix}
          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: config.color,
            color: 'white',
            boxShadow: `0 4px 12px ${config.color}40`,
          }}
        >
          Fix this
        </button>
      )}
    </div>
  );
}

// ============================================================================
// 5. MASTERY / SUGGESTION CARD
// Node recommendations for skill improvement
// ============================================================================

interface SuggestionCardProps {
  nodeTitle: string;
  category: string;
  categoryColor: string;
  reasoning: string;
  onShowTasks?: () => void;
}

export function MasterySuggestionCard({ 
  nodeTitle, 
  category,
  categoryColor,
  reasoning, 
  onShowTasks 
}: SuggestionCardProps) {
  return (
    <div
      className="mastery-suggestion-card p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '2px solid rgba(47, 128, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(47, 128, 255, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${categoryColor}20`,
            border: `2px solid ${categoryColor}40`,
          }}
        >
          <Sparkles className="w-6 h-6" style={{ color: categoryColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div>
            <div className="font-bold text-slate-900 mb-1">{nodeTitle}</div>
            <div
              className="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: `${categoryColor}20`,
                color: categoryColor,
                border: `1px solid ${categoryColor}40`,
              }}
            >
              {category}
            </div>
          </div>

          {/* Reasoning */}
          <p className="text-sm text-slate-700 leading-relaxed">{reasoning}</p>

          {/* Button */}
          {onShowTasks && (
            <button
              onClick={onShowTasks}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '2px solid rgba(47, 128, 255, 0.3)',
                color: '#2F80FF',
              }}
            >
              Show tasks for this mastery
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. MASTERY / GAINS ITEM
// Recent mastery gains list item
// ============================================================================

interface GainsItemProps {
  category: string;
  categoryColor: string;
  amount: number;
  timestamp: string;
}

export function MasteryGainsItem({ category, categoryColor, amount, timestamp }: GainsItemProps) {
  return (
    <div className="mastery-gains-item flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
      <div className="flex items-center gap-3">
        {/* Colored Dot */}
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: categoryColor,
            boxShadow: `0 0 8px ${categoryColor}60`,
          }}
        />

        {/* Gain Text */}
        <div className="font-semibold text-slate-900">
          +{amount} {category} Mastery
        </div>
      </div>

      {/* Time */}
      <div className="text-sm text-slate-600">{timestamp}</div>
    </div>
  );
}

// ============================================================================
// 7. MASTERY / BADGE ITEM
// Achievement badge coin
// ============================================================================

interface BadgeItemProps {
  title: string;
  icon?: React.ReactNode;
  unlocked: boolean;
  glowColor?: string;
}

export function MasteryBadgeItem({ 
  title, 
  icon = <Trophy className="w-6 h-6" />,
  unlocked,
  glowColor = '#F2C94C'
}: BadgeItemProps) {
  return (
    <div className="mastery-badge-item flex flex-col items-center gap-3">
      {/* Badge Coin */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: unlocked 
            ? `rgba(255, 255, 255, 0.9)` 
            : 'rgba(148, 163, 184, 0.3)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: unlocked 
            ? `3px solid ${glowColor}` 
            : '3px solid rgba(148, 163, 184, 0.4)',
          boxShadow: unlocked
            ? `0 8px 24px ${glowColor}40, 0 0 40px ${glowColor}30`
            : 'none',
          color: unlocked ? glowColor : 'rgba(148, 163, 184, 0.6)',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <div 
        className="text-sm font-bold text-center max-w-[100px]"
        style={{
          color: unlocked ? '#1e293b' : '#94a3b8',
        }}
      >
        {title}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION HEADER (reuse from roadmap or create simple version)
// ============================================================================

interface SectionHeaderProps {
  label: string;
}

export function MasterySectionHeader({ label }: SectionHeaderProps) {
  return (
    <div className="mastery-section-header flex items-center gap-3 mb-6">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wide">
        {label}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
    </div>
  );
}

// Add shimmer animation to global styles
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

// Inject styles (you might want to add this to your global CSS instead)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}
