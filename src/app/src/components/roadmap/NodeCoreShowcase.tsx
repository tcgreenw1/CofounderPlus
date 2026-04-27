import React from 'react';
import { NodeCore, NodeCoreDark } from './NodeCore';
import { Sparkles, Rocket, Target, Zap } from 'lucide-react';

/**
 * Showcase component demonstrating the Node / Core master component
 * Shows the base structure without specific states or colors
 */
export function NodeCoreShowcase() {
  return (
    <div className="min-h-screen p-12 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-semibold text-slate-900">
            Node / Core - Master Component
          </h1>
          <p className="text-slate-600 text-lg">
            Base roadmap node with Auto Layout, glass blur, gradient stroke, and glow ring
          </p>
        </div>

        {/* Light Mode Nodes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-800">Light Mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-white/50 rounded-3xl backdrop-blur-sm">
            {/* Default Node */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Default Node
              </h3>
              <NodeCore />
            </div>

            {/* With Custom Icon */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                With Custom Icon
              </h3>
              <NodeCore 
                icon={
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Rocket className="w-5 h-5 text-blue-600" />
                  </div>
                }
                title="Launch Product"
              />
            </div>

            {/* With Different Icon */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Strategy Node
              </h3>
              <NodeCore 
                icon={
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                }
                title="Define Strategy"
              />
            </div>

            {/* With AI Icon */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                AI Enhanced Node
              </h3>
              <NodeCore 
                icon={
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                }
                title="AI-Generated Task"
              />
            </div>

            {/* With Custom XP Badge */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Custom XP Badge
              </h3>
              <NodeCore 
                icon={
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                }
                title="Complete Milestone"
                xpBadge={
                  <div 
                    className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.2), rgba(255, 220, 120, 0.15))',
                      border: '1px solid rgba(242, 201, 76, 0.4)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Zap className="w-3 h-3 text-yellow-600" />
                    <span className="text-yellow-700 text-sm font-semibold">
                      +50
                    </span>
                  </div>
                }
              />
            </div>

            {/* Long Title Test */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Long Title (Truncate Test)
              </h3>
              <NodeCore 
                title="This is a very long node title that should truncate gracefully"
              />
            </div>
          </div>
        </section>

        {/* Dark Mode Nodes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-800">Dark Mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-900 rounded-3xl">
            {/* Default Dark Node */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Default Node
              </h3>
              <NodeCoreDark />
            </div>

            {/* With Custom Icon - Dark */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                With Custom Icon
              </h3>
              <NodeCoreDark 
                icon={
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                    <Rocket className="w-5 h-5 text-blue-400" />
                  </div>
                }
                title="Launch Product"
              />
            </div>

            {/* Strategy Dark */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Strategy Node
              </h3>
              <NodeCoreDark 
                icon={
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-400/30">
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                }
                title="Define Strategy"
              />
            </div>

            {/* AI Enhanced Dark */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                AI Enhanced Node
              </h3>
              <NodeCoreDark 
                icon={
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-400/30">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                }
                title="AI-Generated Task"
              />
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="space-y-4 p-8 bg-white rounded-3xl border-2 border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800">
            Technical Specifications
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Structure</h3>
              <ul className="space-y-1 text-slate-600">
                <li>✓ Auto Layout (flexbox)</li>
                <li>✓ Border Radius: 28px (radius-node)</li>
                <li>✓ Padding: 24px horizontal, 16px vertical</li>
                <li>✓ Gap: 12px between elements</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Glass Effects</h3>
              <ul className="space-y-1 text-slate-600">
                <li>✓ Background: rgba(255, 255, 255, 0.14)</li>
                <li>✓ Backdrop Blur: 28px (glass-blur-default)</li>
                <li>✓ Border: 1.5px gradient stroke</li>
                <li>✓ Inner Glow: Radial gradient overlay</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Shadows</h3>
              <ul className="space-y-1 text-slate-600">
                <li>✓ Drop Shadow: 0px 4px 12px rgba(0,0,0,0.25)</li>
                <li>✓ Inner Shadow: inset 0 1px 2px rgba(255,255,255,0.3)</li>
                <li>✓ Glow Ring: Separate layer behind node</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700">Content Areas</h3>
              <ul className="space-y-1 text-slate-600">
                <li>✓ Icon: 40px circle (left, flex-shrink-0)</li>
                <li>✓ Title: Center-left, truncates overflow</li>
                <li>✓ XP Badge: Right, flex-shrink-0</li>
                <li>✓ All elements: z-index 10 above effects</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
