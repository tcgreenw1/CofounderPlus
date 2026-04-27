import React, { useState } from 'react';
import {
  PanelSidebarLeft,
  PanelSidebarRightAGI,
  PanelCard,
} from './PanelComponents';
import { Sparkles, Rocket, Target, Code, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * Comprehensive showcase for Panel components
 */
export function PanelShowcase() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Demo Controls */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex gap-3">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm border-2 border-blue-200 shadow-lg font-semibold text-sm text-blue-700 hover:bg-blue-50 transition-colors"
        >
          Toggle Left Sidebar
        </button>
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-lg font-semibold text-sm text-purple-700 hover:bg-purple-50 transition-colors"
        >
          Toggle Right Sidebar
        </button>
      </div>

      {/* Left Sidebar */}
      {leftSidebarOpen && (
        <PanelSidebarLeft
          width={300}
          onRoadmapChange={(roadmap) => console.log('Roadmap changed:', roadmap)}
          onBranchFilterChange={(branches) => console.log('Branches:', branches)}
          onModeChange={(mode) => console.log('View mode:', mode)}
          onSearchChange={(query) => console.log('Search:', query)}
        />
      )}

      {/* Right Sidebar AGI */}
      {rightSidebarOpen && (
        <PanelSidebarRightAGI
          width={400}
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          onAccept={(id) => console.log('Accepted:', id)}
          onReject={(id) => console.log('Rejected:', id)}
          onToggleBranchLock={(branch, locked) =>
            console.log(`Branch ${branch} ${locked ? 'locked' : 'unlocked'}`)
          }
        />
      )}

      {/* Main Content Area */}
      <div
        className="p-12 transition-all duration-300"
        style={{
          marginLeft: leftSidebarOpen ? '300px' : '0',
          marginRight: rightSidebarOpen ? '400px' : '0',
        }}
      >
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center space-y-4 pt-16">
            <h1 className="text-5xl font-semibold text-slate-900">
              Panel Components Library
            </h1>
            <p className="text-slate-600 text-xl">
              Sidebars and reusable glass cards
            </p>
          </div>

          {/* Panel Card Variants */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-slate-800">
                3. Panel / Card Variants
              </h2>
              <p className="text-slate-600">
                Reusable glass cards with different states and variants
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Card */}
              <PanelCard variant="default">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Rocket className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Default Card</h3>
                      <p className="text-xs text-slate-600">Standard styling</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    This is a default glass card with standard blue accent colors and
                    subtle backdrop blur.
                  </p>
                </div>
              </PanelCard>

              {/* Success Card */}
              <PanelCard variant="success">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Success Card</h3>
                      <p className="text-xs text-slate-600">Positive feedback</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    Use this variant for successful operations, completed tasks, or
                    positive confirmations.
                  </p>
                </div>
              </PanelCard>

              {/* Info Card */}
              <PanelCard variant="info">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Code className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Info Card</h3>
                      <p className="text-xs text-slate-600">Informational content</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    Perfect for displaying informational messages, updates, or neutral
                    notifications.
                  </p>
                </div>
              </PanelCard>

              {/* Warning Card */}
              <PanelCard variant="warning">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100">
                      <TrendingUp className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Warning Card</h3>
                      <p className="text-xs text-slate-600">Caution required</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    Use for warnings, important notices that need attention, or
                    cautionary messages.
                  </p>
                </div>
              </PanelCard>

              {/* Error Card */}
              <PanelCard variant="error">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Error Card</h3>
                      <p className="text-xs text-slate-600">Critical issues</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    For errors, failures, or critical issues that require immediate
                    attention.
                  </p>
                </div>
              </PanelCard>

              {/* Interactive Card */}
              <PanelCard
                variant="default"
                onClick={() => alert('Card clicked!')}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Interactive Card</h3>
                      <p className="text-xs text-slate-600">Click me!</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    Cards can be clickable with hover effects and scale animations.
                  </p>
                </div>
              </PanelCard>
            </div>
          </section>

          {/* AGI Message Examples */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-slate-800">
                AGI Message Examples
              </h2>
              <p className="text-slate-600">
                Real-world examples of AGI reasoning cards
              </p>
            </div>

            <div className="space-y-4">
              <PanelCard variant="info">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 mt-1">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          AGI Recommendation
                        </h3>
                        <p className="text-xs text-slate-600">2 minutes ago</p>
                      </div>
                      <p className="text-sm text-slate-700">
                        Based on your current roadmap progress, I've identified that
                        implementing user analytics before your marketing push would
                        increase conversion tracking accuracy by 40%. This will help
                        optimize your ad spend.
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-lg text-xs"
                    style={{
                      background: 'rgba(108, 92, 231, 0.08)',
                      border: '1px solid rgba(108, 92, 231, 0.15)',
                    }}
                  >
                    <strong className="text-purple-700">Reasoning:</strong>{' '}
                    <span className="text-slate-700">
                      Industry data shows 78% of successful SaaS launches prioritize
                      analytics infrastructure. Your competitor analysis reveals similar
                      patterns.
                    </span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.15), rgba(100, 230, 150, 0.12))',
                        border: '2px solid rgba(39, 209, 124, 0.3)',
                        color: '#1a8a52',
                      }}
                    >
                      Add to Roadmap
                    </button>
                    <button
                      className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        background: 'rgba(148, 163, 184, 0.1)',
                        border: '2px solid rgba(148, 163, 184, 0.2)',
                        color: '#64748b',
                      }}
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </PanelCard>

              <PanelCard variant="warning">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 mt-1">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        Dependency Conflict Detected
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">Just now</p>
                      <p className="text-sm text-slate-700 mt-2">
                        The "Launch Beta Program" node has a dependency on "Complete
                        Security Audit" which is currently blocked. Recommend resolving
                        this before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </PanelCard>

              <PanelCard variant="success">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-100 mt-1">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        Milestone Achievement Predicted
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">5 minutes ago</p>
                      <p className="text-sm text-slate-700 mt-2">
                        At your current velocity, you're on track to complete the MVP by
                        Q2 2024, 2 weeks ahead of schedule. Great progress!
                      </p>
                    </div>
                  </div>
                </div>
              </PanelCard>
            </div>
          </section>

          {/* Sidebar Documentation */}
          <section className="space-y-6 p-8 bg-white rounded-3xl border-2 border-slate-200">
            <h2 className="text-3xl font-semibold text-slate-800">
              Sidebar Components Documentation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 text-lg">
                  1. Panel / SidebarLeft
                </h3>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>✓ Width: 280-320px (default 300px)</li>
                  <li>✓ Fixed position on left</li>
                  <li>✓ 40px backdrop blur</li>
                  <li>✓ Roadmap dropdown selector</li>
                  <li>✓ Search bar with icon</li>
                  <li>✓ Branch filter pills (multi-select)</li>
                  <li>✓ Grid/List view mode toggle</li>
                  <li>✓ Quick stats summary</li>
                  <li>✓ Auto-scrollable content</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-700 text-lg">
                  2. Panel / SidebarRightAGI
                </h3>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>✓ Width: 380-420px (default 400px)</li>
                  <li>✓ Fixed position on right</li>
                  <li>✓ Overlays main content (z-index 50)</li>
                  <li>✓ Slide-in/out animation</li>
                  <li>✓ Branch lock toggles</li>
                  <li>✓ AGI reasoning cards</li>
                  <li>✓ Change log with timestamps</li>
                  <li>✓ Accept/Reject action buttons</li>
                  <li>✓ Purple accent theme</li>
                </ul>
              </div>

              <div className="space-y-3 md:col-span-2">
                <h3 className="font-semibold text-slate-700 text-lg">
                  3. Panel / Card
                </h3>
                <ul className="text-sm text-slate-600 space-y-1.5">
                  <li>✓ 5 variants: default, success, info, warning, error</li>
                  <li>✓ 16px backdrop blur</li>
                  <li>✓ Gradient backgrounds per variant</li>
                  <li>✓ Optional click handler</li>
                  <li>✓ Hover scale animation (1.01)</li>
                  <li>✓ Fully customizable content</li>
                  <li>✓ Used in AGI sidebar for messages</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
