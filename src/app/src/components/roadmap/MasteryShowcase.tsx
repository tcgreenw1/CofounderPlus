import React from 'react';
import {
  MasteryLevelRing,
  MasterySkillBar,
  MasteryHexChart,
  MasteryWeaknessItem,
  MasterySuggestionCard,
  MasteryGainsItem,
  MasteryBadgeItem,
  MasterySectionHeader,
} from './MasteryComponents';
import { Trophy, Star, Target, Award, Crown } from 'lucide-react';

/**
 * Mastery Components Showcase
 * Displays all mastery components for development and testing
 */
export function MasteryShowcase() {
  const masteryData = {
    Product: 75,
    Marketing: 62,
    Sales: 45,
    Finance: 88,
    Ops: 58,
    HR: 34,
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-12">
      <div className="max-w-7xl mx-auto space-y-16">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Mastery Components Showcase
          </h1>
          <p className="text-lg text-slate-600">
            All mastery dashboard components in one place
          </p>
        </div>

        {/* ============================================================================ */}
        {/* 1. LEVEL RING */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">1. Level Ring</h2>
          <div className="flex gap-12 items-center justify-center">
            <div className="text-center">
              <MasteryLevelRing
                currentLevel={5}
                currentXP={2340}
                maxXP={5000}
                size={180}
              />
              <p className="mt-4 text-sm text-slate-600">Small (180px)</p>
            </div>
            <div className="text-center">
              <MasteryLevelRing
                currentLevel={12}
                currentXP={7850}
                maxXP={10000}
                size={220}
              />
              <p className="mt-4 text-sm text-slate-600">Medium (220px)</p>
            </div>
            <div className="text-center">
              <MasteryLevelRing
                currentLevel={25}
                currentXP={18500}
                maxXP={20000}
                size={260}
              />
              <p className="mt-4 text-sm text-slate-600">Large (260px)</p>
            </div>
          </div>
        </section>

        {/* ============================================================================ */}
        {/* 2. SKILL BARS */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">2. Skill Bars (All Variants)</h2>
          <div className="space-y-4">
            <MasterySkillBar category="Product" progress={75} level={8} />
            <MasterySkillBar category="Marketing" progress={62} level={6} />
            <MasterySkillBar category="Sales" progress={45} level={4} />
            <MasterySkillBar category="Finance" progress={88} level={10} />
            <MasterySkillBar category="Ops" progress={58} level={5} />
            <MasterySkillBar category="HR" progress={34} level={3} />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* 3. HEX CHART */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">3. Hex Chart (Radar)</h2>
          <div className="flex justify-center">
            <MasteryHexChart data={masteryData} size={450} />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* 4. WEAKNESS ITEMS */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">4. Weakness Items (All Severities)</h2>
          <div className="space-y-4">
            <MasteryWeaknessItem
              title="HR skills are lagging behind other domains by 40%"
              severity="high"
              onFix={() => console.log('Fix high severity')}
            />
            <MasteryWeaknessItem
              title="Sales mastery needs attention to unlock next chapter"
              severity="medium"
              onFix={() => console.log('Fix medium severity')}
            />
            <MasteryWeaknessItem
              title="Marketing could use a boost for optimal balance"
              severity="low"
              onFix={() => console.log('Fix low severity')}
            />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* 5. SUGGESTION CARDS */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">5. Suggestion Cards</h2>
          <div className="grid grid-cols-2 gap-6">
            <MasterySuggestionCard
              nodeTitle="Build Recruitment Pipeline"
              category="HR"
              categoryColor="#EB5757"
              reasoning="This node will significantly boost your HR mastery and unlock critical team-building capabilities."
              onShowTasks={() => console.log('Show HR tasks')}
            />
            <MasterySuggestionCard
              nodeTitle="Create Sales Playbook"
              category="Sales"
              categoryColor="#F2C94C"
              reasoning="Mastering sales fundamentals here will accelerate your progress and prepare you for advanced strategies."
              onShowTasks={() => console.log('Show Sales tasks')}
            />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* 6. GAINS ITEMS */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">6. Gains Items (Recent Activity)</h2>
          <div
            className="p-6 rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '2px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 4px 16px rgba(148, 163, 184, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
            }}
          >
            <MasteryGainsItem
              category="Finance"
              categoryColor="#2F80FF"
              amount={12}
              timestamp="2 hours ago"
            />
            <MasteryGainsItem
              category="Product"
              categoryColor="#6C5CE7"
              amount={8}
              timestamp="5 hours ago"
            />
            <MasteryGainsItem
              category="Ops"
              categoryColor="#FF6B35"
              amount={15}
              timestamp="1 day ago"
            />
            <MasteryGainsItem
              category="Marketing"
              categoryColor="#27D17C"
              amount={6}
              timestamp="2 days ago"
            />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* 7. BADGE ITEMS */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">7. Badge Items (Unlocked & Locked)</h2>
          <div className="flex items-center justify-center gap-8">
            <MasteryBadgeItem
              title="First Steps"
              icon={<Star className="w-6 h-6" />}
              unlocked={true}
              glowColor="#F2C94C"
            />
            <MasteryBadgeItem
              title="Product Pro"
              icon={<Target className="w-6 h-6" />}
              unlocked={true}
              glowColor="#6C5CE7"
            />
            <MasteryBadgeItem
              title="Finance Guru"
              icon={<Trophy className="w-6 h-6" />}
              unlocked={true}
              glowColor="#2F80FF"
            />
            <MasteryBadgeItem
              title="Marketing Maven"
              icon={<Award className="w-6 h-6" />}
              unlocked={false}
              glowColor="#27D17C"
            />
            <MasteryBadgeItem
              title="Master Builder"
              icon={<Crown className="w-6 h-6" />}
              unlocked={false}
              glowColor="#EB5757"
            />
          </div>
        </section>

        {/* ============================================================================ */}
        {/* 8. SECTION HEADERS */}
        {/* ============================================================================ */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">8. Section Headers</h2>
          <MasterySectionHeader label="Skill Tracks" />
          <MasterySectionHeader label="Strength Profile" />
          <MasterySectionHeader label="Weakness Alerts" />
          <MasterySectionHeader label="AGI Suggestions" />
        </section>

        <div className="h-12" />
      </div>
    </div>
  );
}
