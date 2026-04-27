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
 * AGI Panel Showcase - Complete Assembly
 * Demonstrates the complete assembled AGI Panel with all components in order
 * 
 * COMPLETE AGI PANEL STRUCTURE (Auto Layout 24px spacing):
 * 
 * 1. AGIPanel / Header
 * 2. AGIPanel / SummaryCard
 * 3. SectionHeader ("Changes")
 * 4. Multiple AGIPanel / ChangeLogItem
 * 5. SectionHeader ("Recommendations")
 * 6. Multiple AGIPanel / RecommendationItem
 * 7. SectionHeader ("Risks & Bottlenecks")
 * 8. Multiple AGIPanel / RiskItem
 * 9. SectionHeader ("Controls")
 * 10. Vertical list of BranchLockToggle components
 */

export function AGIPanelShowcaseComplete() {
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

  const handleToggleBranch = (branch: keyof typeof branchLocks, locked: boolean) => {
    setBranchLocks((prev) => ({ ...prev, [branch]: locked }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Complete AGI Panel Assembly</h1>
          <p className="text-slate-600">All 10 components in correct Auto Layout order</p>
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
      </div>

      {/* Complete AGI Panel Assembly */}
      <AGIPanelRoot
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        width={420}
      >
        {/* 1. Header */}
        <AGIPanelHeader
          onClose={() => setIsOpen(false)}
        />

        {/* 2. Summary Card */}
        <AGIPanelSummaryCard
          reasoningText="I added a user onboarding flow because 68% of new signups are churning within the first week. Based on your industry benchmarks, implementing this now will increase activation by 35% and reduce time-to-value significantly."
          causeTag={{
            label: 'Conversion',
            type: 'conversion',
          }}
        />

        {/* 3. Section Header - Changes */}
        <AGIPanelSectionHeader label="Changes" />

        {/* 4. Multiple ChangeLogItem */}
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
        </div>

        {/* 5. Section Header - Recommendations */}
        <AGIPanelSectionHeader label="Recommendations" />

        {/* 6. Multiple RecommendationItem */}
        <div className="space-y-3">
          <AGIPanelRecommendationItem
            priority="high"
            nodeName="Implement User Feedback Loop"
            category="Product"
            explanation="Unlocks next phase of product development. Critical for understanding user needs and iterating quickly."
            onJumpTo={() => console.log('Jump to User Feedback Loop')}
          />

          <AGIPanelRecommendationItem
            priority="medium"
            nodeName="Setup A/B Testing Framework"
            category="Marketing"
            explanation="Boosts conversion by enabling data-driven optimization of landing pages and onboarding flows."
            onJumpTo={() => console.log('Jump to A/B Testing')}
          />

          <AGIPanelRecommendationItem
            priority="low"
            nodeName="Add Social Proof Widgets"
            category="Marketing"
            explanation="Increases trust and credibility. Low effort, high impact for converting skeptical visitors."
            onJumpTo={() => console.log('Jump to Social Proof')}
          />
        </div>

        {/* 7. Section Header - Risks & Bottlenecks */}
        <AGIPanelSectionHeader label="Risks & Bottlenecks" />

        {/* 8. Multiple RiskItem */}
        <div className="space-y-3">
          <AGIPanelRiskItem
            title="Kill Rule approaching: MRR stalled for 3 weeks"
            severity={3}
            onFix={() => console.log('Fix MRR stall')}
          />

          <AGIPanelRiskItem
            title="Development velocity dropped by 40%"
            severity={2}
            onFix={() => console.log('Fix development velocity')}
          />

          <AGIPanelRiskItem
            title="User churn rate above target (8% vs 5%)"
            severity={2}
            onFix={() => console.log('Fix churn rate')}
          />
        </div>

        {/* 9. Section Header - Controls */}
        <AGIPanelSectionHeader label="Controls" />

        {/* 10. Branch Lock List */}
        <AGIPanelBranchLockList
          locks={branchLocks}
          onToggleBranch={handleToggleBranch}
          masterToggle={masterToggle}
          onToggleMaster={setMasterToggle}
        />
      </AGIPanelRoot>
    </div>
  );
}

export default AGIPanelShowcaseComplete;
