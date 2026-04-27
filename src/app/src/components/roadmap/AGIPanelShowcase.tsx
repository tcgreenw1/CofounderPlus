import React, { useState } from 'react';
import {
  AGIPanelRoot,
  AGIPanelHeader,
  AGIPanelSummaryCard,
  AGIPanelChangeLogItem,
  AGIPanelRecommendationItem,
  AGIPanelRiskItem,
  AGIPanelBranchLockList,
  AGIPanelSectionHeader,
} from './AGIPanelComponents';

/**
 * AGI Panel Showcase
 * Demonstrates the AGI Panel components for reasoning and insights
 * 
 * COMPLETE AGI PANEL STRUCTURE:
 * 
 * 1. AGIPanel / Root - Container (380-420px width, 40px blur, 14% white overlay, right-to-left slide)
 * 2. AGIPanel / Header - "Cofounder AGI" title with sparkline icon and close button
 * 3. AGIPanel / SummaryCard - Large reasoning text with cause tag and glow underline
 * 4. AGIPanel / ChangeLogItem - Individual changelog entries (insert, reorder, delete, modify)
 * 5. AGIPanel / RecommendationItem - Recommendations for next steps
 * 6. AGIPanel / RiskItem - High-risk actions with warnings
 * 7. AGIPanel / BranchLockList - List of locked branches
 * 8. AGIPanel / SectionHeader - Headers for different sections
 * 
 * All components use:
 * - Apple Liquid Glass styling (40px blur, soft gradient borders)
 * - Toy Box Pop color palette
 * - Bouncy Angular animations
 * - Auto Layout spacing (24px vertical, 16px horizontal)
 */

export function AGIPanelShowcase() {
  const [isOpen, setIsOpen] = useState(true);
  const [branchLocks, setBranchLocks] = useState({
    Product: false,
    Marketing: true,
    Finance: true,
    Sales: false,
    HR: true,
    Ops: false,
  });
  const [masterToggle, setMasterToggle] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-8 pb-20 sm:pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">AGI Panel Components</h1>
          <p className="text-slate-600">Right-side panel for AGI reasoning, insights, and changelog</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 rounded-lg font-semibold transition-all duration-200"
            style={{
              background: isOpen ? 'rgba(235, 87, 87, 0.15)' : 'rgba(39, 209, 124, 0.15)',
              border: `2px solid ${isOpen ? 'rgba(235, 87, 87, 0.5)' : 'rgba(39, 209, 124, 0.5)'}`,
              color: isOpen ? '#c93636' : '#1a8a52',
            }}
          >
            {isOpen ? 'Close AGI Panel' : 'Open AGI Panel'}
          </button>
        </div>

        {/* Component Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AGIPanel / Header Examples */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">AGIPanel / Header</h2>
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Default Header</h3>
              <AGIPanelHeader
                onClose={() => console.log('Close clicked')}
              />
            </div>
          </div>

          {/* AGIPanel / SummaryCard Examples */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">AGIPanel / SummaryCard</h2>
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Conversion Insight</h3>
              <AGIPanelSummaryCard
                reasoningText="I added a user onboarding flow because 68% of new signups churn within the first week. This will increase activation by 35% based on industry benchmarks."
                causeTag={{
                  label: 'Conversion',
                  type: 'conversion',
                }}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">MRR Milestone</h3>
              <AGIPanelSummaryCard
                reasoningText="Moved payment integration earlier because you're approaching $10K MRR threshold. Implementing now prevents revenue loss from manual invoicing."
                causeTag={{
                  label: 'MRR Milestone',
                  type: 'mrr-milestone',
                }}
              />
            </div>
          </div>
        </div>

        {/* More SummaryCard Examples */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">AGIPanel / SummaryCard - All Tag Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Skipped Nodes</h3>
              <AGIPanelSummaryCard
                reasoningText="I noticed you skipped the analytics dashboard. This is critical for understanding user behavior and making data-driven decisions."
                causeTag={{
                  label: 'Skipped Nodes',
                  type: 'skipped-nodes',
                }}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Efficiency</h3>
              <AGIPanelSummaryCard
                reasoningText="Reordered tasks to parallelize development. This reduces your timeline by 2 weeks and unlocks faster time-to-market."
                causeTag={{
                  label: 'Efficiency',
                  type: 'efficiency',
                }}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Risk Warning</h3>
              <AGIPanelSummaryCard
                reasoningText="Building custom authentication is high-risk. I recommend using a third-party provider to save 6 weeks and reduce security vulnerabilities."
                causeTag={{
                  label: 'Risk',
                  type: 'risk',
                }}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Opportunity</h3>
              <AGIPanelSummaryCard
                reasoningText="Your competitor just raised funding. Adding social proof features now will help you capture market share while they're distracted."
                causeTag={{
                  label: 'Opportunity',
                  type: 'opportunity',
                }}
              />
            </div>
          </div>
        </div>

        {/* AGIPanel / ChangeLogItem Examples */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">AGIPanel / ChangeLogItem</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Insert */}
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Insert Action</h3>
              <AGIPanelChangeLogItem
                type="insert"
                nodeName="Setup Analytics Dashboard"
                timestamp="just now"
                reasonTag={{
                  label: 'Efficiency',
                  type: 'efficiency',
                }}
              />
            </div>

            {/* Reorder */}
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Reorder Action</h3>
              <AGIPanelChangeLogItem
                type="reorder"
                nodeName="User Onboarding Flow"
                timestamp="2 minutes ago"
                reasonTag={{
                  label: 'Opportunity',
                  type: 'opportunity',
                }}
              />
            </div>

            {/* Delete */}
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Delete Action</h3>
              <AGIPanelChangeLogItem
                type="delete"
                nodeName="Custom Authentication System"
                timestamp="5 minutes ago"
                reasonTag={{
                  label: 'Risk',
                  type: 'risk',
                }}
              />
            </div>

            {/* Modify */}
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Modify Action</h3>
              <AGIPanelChangeLogItem
                type="modify"
                nodeName="Payment Integration"
                timestamp="10 minutes ago"
                reasonTag={{
                  label: 'Efficiency',
                  type: 'efficiency',
                }}
              />
            </div>
          </div>
        </div>

        {/* Full Panel Example */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center">Complete AGI Panel</h2>
          <p className="text-center text-slate-600">
            Click "Open AGI Panel" above to see the complete slide-out panel
          </p>
        </div>
      </div>

      {/* Live AGI Panel Example */}
      <AGIPanelRoot
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        width={420}
      >
        {/* Header */}
        <AGIPanelHeader
          onClose={() => setIsOpen(false)}
        />

        {/* Summary Card */}
        <AGIPanelSummaryCard
          reasoningText="I added a user onboarding flow because 68% of new signups are churning within the first week. Based on your industry benchmarks, implementing this now will increase activation by 35% and reduce time-to-value significantly."
          causeTag={{
            label: 'Conversion',
            type: 'conversion',
          }}
        />

        {/* Section Header */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">Recent Changes</h3>
          <p className="text-sm text-slate-600">
            Review and approve AGI modifications to your roadmap
          </p>
        </div>

        {/* Changelog Items */}
        <div className="space-y-3">
          <AGIPanelChangeLogItem
            type="insert"
            nodeName="Setup Analytics Dashboard"
            timestamp="just now"
            reasonTag={{
              label: 'Efficiency',
              type: 'efficiency',
            }}
          />

          <AGIPanelChangeLogItem
            type="reorder"
            nodeName="User Onboarding Flow"
            timestamp="2 minutes ago"
            reasonTag={{
              label: 'Opportunity',
              type: 'opportunity',
            }}
          />

          <AGIPanelChangeLogItem
            type="modify"
            nodeName="Payment Integration"
            timestamp="5 minutes ago"
            reasonTag={{
              label: 'Efficiency',
              type: 'efficiency',
            }}
          />

          <AGIPanelChangeLogItem
            type="delete"
            nodeName="Custom Authentication System"
            timestamp="8 minutes ago"
            reasonTag={{
              label: 'Risk',
              type: 'risk',
            }}
          />

          <AGIPanelChangeLogItem
            type="insert"
            nodeName="A/B Testing Framework"
            timestamp="12 minutes ago"
            reasonTag={{
              label: 'Opportunity',
              type: 'opportunity',
            }}
          />

          <AGIPanelChangeLogItem
            type="modify"
            nodeName="Email Notification System"
            timestamp="15 minutes ago"
            reasonTag={{
              label: 'Efficiency',
              type: 'efficiency',
            }}
          />
        </div>

        {/* Additional Summary Card */}
        <AGIPanelSummaryCard
          reasoningText="Your competitor just launched a similar feature. Moving this task earlier in your roadmap will help you maintain competitive advantage and capture market share."
          causeTag={{
            label: 'Opportunity',
            type: 'opportunity',
          }}
        />

        {/* More Changelog Items */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Earlier Today</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          </div>

          <AGIPanelChangeLogItem
            type="insert"
            nodeName="User Feedback Collection"
            timestamp="2 hours ago"
            reasonTag={{
              label: 'Efficiency',
              type: 'efficiency',
            }}
          />

          <AGIPanelChangeLogItem
            type="reorder"
            nodeName="Mobile Responsive Design"
            timestamp="3 hours ago"
            reasonTag={{
              label: 'Opportunity',
              type: 'opportunity',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            className="flex-1 roadmap-control-btn flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(39, 209, 124, 0.15) 0%, rgba(100, 230, 150, 0.12) 100%)',
              border: '2px solid rgba(39, 209, 124, 0.4)',
              boxShadow: '0 4px 12px rgba(39, 209, 124, 0.2)',
            }}
          >
            <span className="font-bold text-green-700">Accept All Changes</span>
          </button>

          <button
            className="flex-1 roadmap-control-btn flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.15) 0%, rgba(255, 140, 140, 0.12) 100%)',
              border: '2px solid rgba(235, 87, 87, 0.4)',
              boxShadow: '0 4px 12px rgba(235, 87, 87, 0.2)',
            }}
          >
            <span className="font-bold text-red-700">Reject All Changes</span>
          </button>
        </div>
      </AGIPanelRoot>
    </div>
  );
}

export default AGIPanelShowcase;