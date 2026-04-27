import React from 'react';
import {
  NodeAvailable,
  NodeActive,
  NodeRecommended,
  NodeAIInserted,
  NodeAIModified,
  NodeBlocked,
  NodeLocked,
  NodeFailed,
  NodeCompleted,
} from './NodeStateVariants';
import { 
  Rocket, 
  Target, 
  Sparkles, 
  Zap, 
  Lock, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Code
} from 'lucide-react';

/**
 * Comprehensive showcase of all 9 node state variants
 */
export function NodeStatesShowcase() {
  // Reusable icon component
  const iconWrapper = (Icon: any, color: string) => (
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center`}
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
  );

  // Reusable XP badge
  const xpBadge = (amount: string, color: string) => (
    <div 
      className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
      style={{
        background: `${color}20`,
        border: `1px solid ${color}35`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Zap className="w-3 h-3" style={{ color }} />
      <span style={{ color, fontSize: '13px', fontWeight: 600 }}>
        {amount}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen p-8 md:p-12 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold text-slate-900">
            Roadmap Node States Library
          </h1>
          <p className="text-slate-600 text-xl">
            9 comprehensive state variants with animations and metadata
          </p>
        </div>

        {/* Grid of All States */}
        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* 1. Available */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">1. Available</h3>
              <p className="text-sm text-slate-600">Subtle blue edge • Low glow</p>
            </div>
            <NodeAvailable
              icon={iconWrapper(Rocket, '#2F80FF')}
              title="Launch MVP"
              xpBadge={xpBadge('+25', '#2F80FF')}
            />
          </div>

          {/* 2. Active */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">2. Active</h3>
              <p className="text-sm text-slate-600">Strong blue glow • Breathing pulse • Scale-up</p>
            </div>
            <NodeActive
              icon={iconWrapper(Target, '#2F80FF')}
              title="In Progress"
              xpBadge={xpBadge('+40', '#2F80FF')}
            />
          </div>

          {/* 3. Recommended */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">3. Recommended</h3>
              <p className="text-sm text-slate-600">Yellow halo • Ripple animation • Z-lift</p>
            </div>
            <NodeRecommended
              icon={iconWrapper(TrendingUp, '#F2C94C')}
              title="Next Best Action"
              xpBadge={xpBadge('+50', '#F2C94C')}
            />
          </div>

          {/* 4. AI Inserted */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">4. AI Inserted</h3>
              <p className="text-sm text-slate-600">Purple tint • Glitter particles • Bounce-drop</p>
            </div>
            <NodeAIInserted
              icon={iconWrapper(Sparkles, '#6C5CE7')}
              title="AI Generated Task"
              xpBadge={xpBadge('+30', '#6C5CE7')}
            />
          </div>

          {/* 5. AI Modified */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">5. AI Modified</h3>
              <p className="text-sm text-slate-600">Blue update badge • Glow pulse</p>
            </div>
            <NodeAIModified
              icon={iconWrapper(Code, '#2F80FF')}
              title="AI Updated"
              xpBadge={xpBadge('+20', '#2F80FF')}
            />
          </div>

          {/* 6. Blocked */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">6. Blocked</h3>
              <p className="text-sm text-slate-600">Desaturated • Lock icon • Dashed texture</p>
            </div>
            <NodeBlocked
              icon={iconWrapper(Lock, '#64748b')}
              title="Waiting on Dependencies"
              xpBadge={xpBadge('--', '#64748b')}
            />
          </div>

          {/* 7. Locked */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">7. Locked</h3>
              <p className="text-sm text-slate-600">Gray-blue border • Lock badge</p>
            </div>
            <NodeLocked
              icon={iconWrapper(Lock, '#64748b')}
              title="Premium Feature"
              xpBadge={xpBadge('--', '#64748b')}
            />
          </div>

          {/* 8. Failed */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">8. Failed</h3>
              <p className="text-sm text-slate-600">Matte red glass • Crack texture • Shake</p>
            </div>
            <NodeFailed
              icon={iconWrapper(AlertCircle, '#EB5757')}
              title="Task Failed"
              xpBadge={xpBadge('-10', '#EB5757')}
            />
          </div>

          {/* 9. Completed */}
          <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">9. Completed</h3>
              <p className="text-sm text-slate-600">Bright green • Checkmark • XP burst</p>
            </div>
            <NodeCompleted
              icon={iconWrapper(CheckCircle2, '#27D17C')}
              title="Successfully Done"
              xpBadge={xpBadge('+100', '#27D17C')}
            />
          </div>
        </section>

        {/* Animation Details */}
        <section className="space-y-6 p-8 bg-white rounded-3xl border-2 border-slate-200">
          <h2 className="text-3xl font-semibold text-slate-800">
            Animation & Interaction Metadata
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">Available</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Subtle 8px blur glow</li>
                <li>• 40% opacity ring</li>
                <li>• 1.5px blue border</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">Active</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 3s breathing animation</li>
                <li>• Scale: 1.02 → 1.03</li>
                <li>• Strong 16px glow blur</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-yellow-700">Recommended</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 2s ripple animation</li>
                <li>• Scale: 1.05 → 1.15</li>
                <li>• translateZ(10px) lift</li>
                <li>• Sparkle indicator</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-purple-700">AI Inserted</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 0.8s bounce-drop entry</li>
                <li>• 8 glitter particles</li>
                <li>• Cubic-bezier easing</li>
                <li>• AI badge indicator</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">AI Modified</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 2s glow pulse</li>
                <li>• Opacity: 0.5 ↔ 1.0</li>
                <li>• "Updated" badge pulse</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-red-700">Blocked</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Dashed border (8-4 pattern)</li>
                <li>• 1s dash flow animation</li>
                <li>• 30% saturation filter</li>
                <li>• Cursor: not-allowed</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Locked</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 50% saturation</li>
                <li>• Static gray-blue border</li>
                <li>• 40% opacity content</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-red-700">Failed</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 0.5s shake animation</li>
                <li>• ±2px horizontal shake</li>
                <li>• Crack texture overlay</li>
                <li>• 80% saturation</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">Completed</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• 12 XP burst particles</li>
                <li>• 1s burst animation</li>
                <li>• Radial particle spread</li>
                <li>• Checkmark badge</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Color Reference */}
        <section className="space-y-6 p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl text-white">
          <h2 className="text-3xl font-semibold">
            Design Token Reference
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 rounded-xl" style={{ background: '#2F80FF' }} />
              <p className="text-sm font-mono">Primary Blue</p>
              <p className="text-xs text-slate-400">#2F80FF</p>
            </div>

            <div className="space-y-2">
              <div className="w-full h-16 rounded-xl" style={{ background: '#27D17C' }} />
              <p className="text-sm font-mono">Secondary Green</p>
              <p className="text-xs text-slate-400">#27D17C</p>
            </div>

            <div className="space-y-2">
              <div className="w-full h-16 rounded-xl" style={{ background: '#F2C94C' }} />
              <p className="text-sm font-mono">Warning Yellow</p>
              <p className="text-xs text-slate-400">#F2C94C</p>
            </div>

            <div className="space-y-2">
              <div className="w-full h-16 rounded-xl" style={{ background: '#EB5757' }} />
              <p className="text-sm font-mono">Danger Red</p>
              <p className="text-xs text-slate-400">#EB5757</p>
            </div>

            <div className="space-y-2">
              <div className="w-full h-16 rounded-xl" style={{ background: '#6C5CE7' }} />
              <p className="text-sm font-mono">AI Purple</p>
              <p className="text-xs text-slate-400">#6C5CE7</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
