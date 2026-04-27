import React, { useState } from 'react';
import { 
  NodeSpawnAnimation, 
  AGIInsertAnimation, 
  AGIReorderAnimation, 
  AGIRemovalAnimation,
  TimelineRibbonSweep,
  ANIMATION_METADATA 
} from './AnimationComponents';
import { NodeAvailable, NodeRecommended } from './NodeStateVariants';
import { FeedbackXPBurst, FeedbackPathHighlight } from './FeedbackComponents';
import { ControlButtonPrimary } from './ControlComponents';
import { Play, RotateCcw, Zap } from 'lucide-react';

/**
 * Animation Showcase - Demonstration of All Prototype Animations
 */
export function AnimationShowcase() {
  // Animation triggers
  const [nodeSpawnTrigger, setNodeSpawnTrigger] = useState(false);
  const [agiInsertTrigger, setAGIInsertTrigger] = useState(false);
  const [agiReorderTrigger, setAGIReorderTrigger] = useState(false);
  const [agiRemovalTrigger, setAGIRemovalTrigger] = useState(false);
  const [nodeCompleteTrigger, setNodeCompleteTrigger] = useState(false);
  const [pathHighlightTrigger, setPathHighlightTrigger] = useState(false);
  const [ribbonSweepTrigger, setRibbonSweepTrigger] = useState(false);

  const resetAll = () => {
    setNodeSpawnTrigger(false);
    setAGIInsertTrigger(false);
    setAGIReorderTrigger(false);
    setAGIRemovalTrigger(false);
    setNodeCompleteTrigger(false);
    setPathHighlightTrigger(false);
    setRibbonSweepTrigger(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8 pb-20 sm:pb-24">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Animation Prototype Library</h1>
            <p className="text-lg text-slate-600">Complete set of roadmap animations with metadata</p>
          </div>
          <ControlButtonPrimary
            variant="blue"
            icon={<RotateCcw />}
            onClick={resetAll}
          >
            Reset All
          </ControlButtonPrimary>
        </div>

        {/* Animation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. Node Spawn - Bounce */}
          <AnimationCard
            title="1. Node Spawn - Bounce"
            metadata={ANIMATION_METADATA.nodeSpawn}
            onTrigger={() => {
              setNodeSpawnTrigger(false);
              setTimeout(() => setNodeSpawnTrigger(true), 50);
            }}
          >
            <div className="flex items-center justify-center h-48">
              <NodeSpawnAnimation trigger={nodeSpawnTrigger}>
                <NodeAvailable
                  title="New Feature Node"
                  xpBadge={<XPBadge amount={150} />}
                />
              </NodeSpawnAnimation>
            </div>
          </AnimationCard>

          {/* 2. AGI Insert - Drop-in */}
          <AnimationCard
            title="2. AGI Insert - Drop-in"
            metadata={ANIMATION_METADATA.agiInsert}
            onTrigger={() => {
              setAGIInsertTrigger(false);
              setTimeout(() => setAGIInsertTrigger(true), 50);
            }}
          >
            <div className="flex items-center justify-center h-48">
              <AGIInsertAnimation trigger={agiInsertTrigger}>
                <NodeRecommended
                  title="AGI Suggested Task"
                  xpBadge={<XPBadge amount={200} />}
                />
              </AGIInsertAnimation>
            </div>
          </AnimationCard>

          {/* 3. AGI Reorder - Slide Path */}
          <AnimationCard
            title="3. AGI Reorder - Slide Path"
            metadata={ANIMATION_METADATA.agiReorder}
            onTrigger={() => {
              setAGIReorderTrigger(false);
              setTimeout(() => setAGIReorderTrigger(true), 50);
            }}
          >
            <div className="relative h-48 flex items-center justify-center">
              <div className="absolute left-12 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                Position A
              </div>
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                Position B
              </div>
              
              <AGIReorderAnimation
                trigger={agiReorderTrigger}
                fromX={-150}
                toX={150}
              >
                <NodeRecommended
                  title="Reordered Node"
                  xpBadge={<XPBadge amount={100} />}
                />
              </AGIReorderAnimation>
            </div>
          </AnimationCard>

          {/* 4. AGI Removal - Fade/Dissolve */}
          <AnimationCard
            title="4. AGI Removal - Fade/Dissolve"
            metadata={ANIMATION_METADATA.agiRemoval}
            onTrigger={() => {
              setAGIRemovalTrigger(false);
              setTimeout(() => setAGIRemovalTrigger(true), 50);
            }}
          >
            <div className="flex items-center justify-center h-48">
              <AGIRemovalAnimation trigger={agiRemovalTrigger}>
                <NodeAvailable
                  title="Removed Node"
                  xpBadge={<XPBadge amount={100} />}
                />
              </AGIRemovalAnimation>
            </div>
          </AnimationCard>

          {/* 5. Node Complete - Burst + Particles */}
          <AnimationCard
            title="5. Node Complete - Burst + Particles"
            metadata={ANIMATION_METADATA.nodeComplete}
            onTrigger={() => {
              setNodeCompleteTrigger(false);
              setTimeout(() => setNodeCompleteTrigger(true), 50);
            }}
          >
            <div className="relative flex items-center justify-center h-48">
              <NodeAvailable
                title="Click to Complete"
                xpBadge={<XPBadge amount={250} />}
              />
              <FeedbackXPBurst
                xpAmount={250}
                trigger={nodeCompleteTrigger}
                onComplete={() => setNodeCompleteTrigger(false)}
              />
            </div>
          </AnimationCard>

          {/* 6. Path Highlight - Neon Pulse */}
          <AnimationCard
            title="6. Path Highlight - Neon Pulse"
            metadata={ANIMATION_METADATA.pathHighlight}
            onTrigger={() => {
              setPathHighlightTrigger(false);
              setTimeout(() => setPathHighlightTrigger(true), 50);
            }}
          >
            <div className="relative flex items-center justify-center h-48">
              {/* Start Node */}
              <div className="absolute left-12">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  A
                </div>
              </div>

              {/* End Node */}
              <div className="absolute right-12">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                  B
                </div>
              </div>

              {/* Path */}
              <FeedbackPathHighlight
                startX={80}
                startY={96}
                endX={280}
                endY={96}
                color="#2F80FF"
                animated={pathHighlightTrigger}
              />
            </div>
          </AnimationCard>

          {/* 7. Timeline Progress - Ribbon Sweep */}
          <AnimationCard
            title="7. Timeline Progress - Ribbon Sweep"
            metadata={ANIMATION_METADATA.timelineProgress}
            onTrigger={() => {
              setRibbonSweepTrigger(false);
              setTimeout(() => setRibbonSweepTrigger(true), 50);
            }}
            fullWidth
          >
            <div className="h-32 flex items-center justify-center px-12">
              <div
                className="w-full h-16 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 252, 255, 0.7) 100%)',
                  backdropFilter: 'blur(16px)',
                  border: '2px solid rgba(47, 128, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                }}
              >
                <TimelineRibbonSweep
                  progress={65}
                  color="#2F80FF"
                  trigger={ribbonSweepTrigger}
                />

                {/* Progress Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-700">65% Complete</span>
                </div>
              </div>
            </div>
          </AnimationCard>
        </div>
      </div>

      {/* Metadata Reference Table */}
      <div className="max-w-7xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Animation Metadata Reference</h2>
        
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 252, 255, 0.95) 100%)',
            backdropFilter: 'blur(16px)',
            border: '2px solid rgba(47, 128, 255, 0.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-blue-200">
                <th className="px-6 py-4 text-left font-bold text-slate-900">Animation</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900">Duration</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900">Easing</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900">Effect</th>
                <th className="px-6 py-4 text-left font-bold text-slate-900">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ANIMATION_METADATA).map(([key, data]) => (
                <tr key={key} className="border-b border-blue-100 hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{data.name}</td>
                  <td className="px-6 py-4 text-slate-700">{data.duration}ms</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{data.easing}</td>
                  <td className="px-6 py-4 text-slate-700">{data.effect}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{data.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface AnimationCardProps {
  title: string;
  metadata: any;
  onTrigger: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}

function AnimationCard({ title, metadata, onTrigger, children, fullWidth }: AnimationCardProps) {
  return (
    <div
      className={fullWidth ? 'md:col-span-2' : ''}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 252, 255, 0.95) 100%)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '2px solid rgba(47, 128, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <button
          onClick={onTrigger}
          className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.9), rgba(80, 150, 255, 0.95))',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 12px rgba(47, 128, 255, 0.3)',
          }}
        >
          <Play className="w-4 h-4" />
          Play
        </button>
      </div>

      {/* Animation Area */}
      <div className="mb-4 bg-white/50 rounded-xl border border-slate-200">
        {children}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-slate-500">Duration:</span>
          <span className="ml-2 font-semibold text-slate-900">{metadata.duration}ms</span>
        </div>
        <div>
          <span className="text-slate-500">Easing:</span>
          <span className="ml-2 font-mono text-xs text-slate-700">{metadata.easing.substring(0, 20)}...</span>
        </div>
      </div>
    </div>
  );
}

function XPBadge({ amount }: { amount: number }) {
  return (
    <div
      className="px-2 py-1 rounded-full flex items-center gap-1"
      style={{
        background: 'linear-gradient(135deg, rgba(242, 201, 76, 0.2), rgba(255, 220, 120, 0.15))',
        border: '1px solid rgba(242, 201, 76, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Zap className="w-3 h-3 text-yellow-600" />
      <span className="text-xs font-bold text-yellow-700">+{amount}</span>
    </div>
  );
}

export default AnimationShowcase;