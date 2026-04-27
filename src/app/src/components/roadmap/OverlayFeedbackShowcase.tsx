import React, { useState } from 'react';
import {
  OverlayTooltip,
  OverlayTooltipRich,
  OverlayToast,
  OverlayToastContainer,
} from './OverlayComponents';
import {
  FeedbackXPBurst,
  FeedbackPathHighlight,
  FeedbackPathHighlightStraight,
  FeedbackMultiPathHighlight,
} from './FeedbackComponents';
import {
  HelpCircle,
  Info,
  Zap,
  Star,
  Target,
  TrendingUp,
  Award,
  Rocket,
} from 'lucide-react';

/**
 * Comprehensive showcase for Overlay and Feedback components
 */
export function OverlayFeedbackShowcase() {
  const [toasts, setToasts] = useState<Array<any>>([]);
  const [xpBurstTrigger, setXpBurstTrigger] = useState(false);
  const [pathAnimating, setPathAnimating] = useState(false);

  const addToast = (variant: 'success' | 'info' | 'warning' | 'danger' | 'aiUpdate', title: string, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts([
      ...toasts,
      {
        id,
        variant,
        title,
        message,
        isVisible: true,
        onClose: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      },
    ]);
  };

  const triggerXPBurst = () => {
    setXpBurstTrigger(false);
    setTimeout(() => setXpBurstTrigger(true), 50);
  };

  const triggerPathAnimation = () => {
    setPathAnimating(false);
    setTimeout(() => setPathAnimating(true), 50);
    setTimeout(() => setPathAnimating(false), 3000);
  };

  return (
    <div className="min-h-screen p-8 md:p-12 bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Toast Container */}
      <OverlayToastContainer toasts={toasts} position="top-right" />

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold text-slate-900">
            Overlay & Feedback Components
          </h1>
          <p className="text-slate-600 text-xl">
            Tooltips, toasts, XP bursts, and path highlights
          </p>
        </div>

        {/* 1. Tooltips */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              1. Overlay / Tooltip
            </h2>
            <p className="text-slate-600">
              Small glass micro-cards with minimal borders and light shadows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            {/* Simple Tooltip - Top */}
            <div className="flex flex-col items-center gap-4">
              <OverlayTooltip content="Tooltip on top" position="top">
                <button className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                  Hover (Top)
                </button>
              </OverlayTooltip>
              <p className="text-xs text-slate-500 text-center">Simple tooltip</p>
            </div>

            {/* Simple Tooltip - Bottom */}
            <div className="flex flex-col items-center gap-4">
              <OverlayTooltip content="Tooltip on bottom" position="bottom">
                <button className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors">
                  Hover (Bottom)
                </button>
              </OverlayTooltip>
              <p className="text-xs text-slate-500 text-center">Position: bottom</p>
            </div>

            {/* Simple Tooltip - Left */}
            <div className="flex flex-col items-center gap-4">
              <OverlayTooltip content="Tooltip on left" position="left">
                <button className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors">
                  Hover (Left)
                </button>
              </OverlayTooltip>
              <p className="text-xs text-slate-500 text-center">Position: left</p>
            </div>

            {/* Simple Tooltip - Right */}
            <div className="flex flex-col items-center gap-4">
              <OverlayTooltip content="Tooltip on right" position="right">
                <button className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
                  Hover (Right)
                </button>
              </OverlayTooltip>
              <p className="text-xs text-slate-500 text-center">Position: right</p>
            </div>
          </div>

          {/* Rich Tooltips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl border border-slate-200">
            <div className="flex flex-col items-center gap-4">
              <OverlayTooltipRich
                icon={<Info className="w-5 h-5 text-blue-600" />}
                title="Information"
                description="This is a rich tooltip with an icon, title, and detailed description."
                position="top"
              >
                <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Info className="w-5 h-5 inline mr-2" />
                  Info Tooltip
                </button>
              </OverlayTooltipRich>
              <p className="text-xs text-slate-500 text-center">With icon + title</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <OverlayTooltipRich
                icon={<Zap className="w-5 h-5 text-yellow-600" />}
                title="Quick Action"
                description="Execute this action to boost your roadmap progress instantly."
                position="top"
              >
                <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Zap className="w-5 h-5 inline mr-2" />
                  Power Move
                </button>
              </OverlayTooltipRich>
              <p className="text-xs text-slate-500 text-center">Rich content</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <OverlayTooltipRich
                icon={<Star className="w-5 h-5 text-purple-600" />}
                title="Premium Feature"
                description="Unlock advanced roadmap AI capabilities with this premium upgrade."
                position="top"
              >
                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Star className="w-5 h-5 inline mr-2" />
                  Upgrade
                </button>
              </OverlayTooltipRich>
              <p className="text-xs text-slate-500 text-center">Detailed info</p>
            </div>
          </div>
        </section>

        {/* 2. Toasts */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              2. Overlay / Toast
            </h2>
            <p className="text-slate-600">
              Five variants: success, info, warning, danger, aiUpdate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            <button
              onClick={() => addToast('success', 'Node Completed!', 'You earned 50 XP for completing "Setup Analytics"')}
              className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <Award className="w-5 h-5 inline mr-2" />
              Success Toast
            </button>

            <button
              onClick={() => addToast('info', 'Roadmap Updated', 'Your timeline has been adjusted based on dependencies')}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <Info className="w-5 h-5 inline mr-2" />
              Info Toast
            </button>

            <button
              onClick={() => addToast('warning', 'Dependency Issue', 'This node requires "Security Audit" to be completed first')}
              className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Warning Toast
            </button>

            <button
              onClick={() => addToast('danger', 'Action Failed', 'Unable to update roadmap. Please try again later.')}
              className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <Target className="w-5 h-5 inline mr-2" />
              Danger Toast
            </button>

            <button
              onClick={() => addToast('aiUpdate', 'AGI Suggestion', 'I recommend adding "User Analytics" before your marketing push')}
              className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <Zap className="w-5 h-5 inline mr-2" />
              AI Update Toast
            </button>

            <button
              onClick={() => {
                addToast('success', 'Milestone Reached!', 'Chapter 2 completed successfully');
                addToast('info', 'Next Up', 'Chapter 3: Boss Challenge awaits');
              }}
              className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <Rocket className="w-5 h-5 inline mr-2" />
              Multiple Toasts
            </button>
          </div>

          {/* Static Toast Examples */}
          <div className="space-y-4 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl">
            <h3 className="text-xl font-semibold text-white mb-6">
              Toast Variants Preview
            </h3>
            <div className="space-y-3">
              <OverlayToast
                variant="success"
                title="Task Completed"
                message="Successfully marked 'Build MVP' as complete"
                isVisible={true}
                duration={999999}
              />
              <OverlayToast
                variant="info"
                title="System Update"
                message="New roadmap features are now available"
                isVisible={true}
                duration={999999}
              />
              <OverlayToast
                variant="warning"
                title="Attention Required"
                message="3 nodes are blocked by pending dependencies"
                isVisible={true}
                duration={999999}
              />
              <OverlayToast
                variant="danger"
                title="Error Occurred"
                message="Failed to sync with backend. Retrying..."
                isVisible={true}
                duration={999999}
              />
              <OverlayToast
                variant="aiUpdate"
                title="AGI Recommendation"
                message="Based on your velocity, consider moving deadline by 1 week"
                isVisible={true}
                duration={999999}
              />
            </div>
          </div>
        </section>

        {/* 3. XP Burst */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              3. Feedback / XPBurst
            </h2>
            <p className="text-slate-600">
              10-14 particle shapes with fade + drift animation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* XP Burst Demo 1 */}
            <div className="relative h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-2 border-blue-200 flex items-center justify-center overflow-hidden">
              <button
                onClick={triggerXPBurst}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Click for +100 XP
              </button>
              <FeedbackXPBurst
                xpAmount={100}
                particleCount={12}
                trigger={xpBurstTrigger}
                colors={['#2F80FF', '#27D17C', '#F2C94C', '#EB5757']}
              />
            </div>

            {/* XP Burst Demo 2 */}
            <div className="relative h-64 bg-gradient-to-br from-green-50 to-yellow-50 rounded-3xl border-2 border-green-200 flex items-center justify-center overflow-hidden">
              <button
                onClick={() => {
                  setXpBurstTrigger(false);
                  setTimeout(() => setXpBurstTrigger(true), 50);
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-yellow-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Mega XP Burst
              </button>
              <FeedbackXPBurst
                xpAmount={500}
                particleCount={14}
                trigger={xpBurstTrigger}
                colors={['#27D17C', '#F2C94C', '#2F80FF']}
              />
            </div>

            {/* XP Burst Demo 3 */}
            <div className="relative h-64 bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl border-2 border-red-200 flex items-center justify-center overflow-hidden">
              <button
                onClick={() => {
                  setXpBurstTrigger(false);
                  setTimeout(() => setXpBurstTrigger(true), 50);
                }}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Boss XP!
              </button>
              <FeedbackXPBurst
                xpAmount={1000}
                particleCount={10}
                trigger={xpBurstTrigger}
                colors={['#EB5757', '#F2C94C', '#2F80FF', '#27D17C']}
              />
            </div>
          </div>

          {/* Particle Shapes Info */}
          <div className="p-6 bg-white rounded-2xl border-2 border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">
              Available Particle Shapes
            </h3>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-600">Circle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500" />
                <span className="text-sm text-slate-600">Square</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rotate-45" />
                <span className="text-sm text-slate-600">Diamond</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="text-sm text-slate-600">Star</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-4 h-4">
                  <div className="absolute w-full h-1 top-1.5 bg-purple-500" />
                  <div className="absolute w-1 h-full left-1.5 bg-purple-500" />
                </div>
                <span className="text-sm text-slate-600">Plus</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Path Highlight */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              4. Feedback / PathHighlight
            </h2>
            <p className="text-slate-600">
              Neon lines with animated pulse effects
            </p>
          </div>

          {/* Curved Paths */}
          <div className="relative h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border-2 border-slate-700 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-between px-12">
              <div className="w-16 h-16 bg-blue-500 rounded-full shadow-lg" />
              <div className="w-16 h-16 bg-green-500 rounded-full shadow-lg" />
            </div>
            <FeedbackPathHighlight
              startX={80}
              startY={192}
              endX={720}
              endY={192}
              color="#2F80FF"
              thickness={4}
              pulseSpeed={2000}
              glowIntensity={24}
              animated={true}
            />

            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="font-semibold mb-1">Curved Path with Pulse</h3>
              <p className="text-sm text-slate-300">Animated glow + traveling dot</p>
            </div>
          </div>

          {/* Straight Paths */}
          <div className="relative h-96 bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl border-2 border-blue-700 overflow-hidden">
            <div className="absolute top-12 left-12 w-12 h-12 bg-yellow-500 rounded-lg shadow-lg" />
            <div className="absolute bottom-12 right-12 w-12 h-12 bg-red-500 rounded-lg shadow-lg" />
            
            <FeedbackPathHighlightStraight
              startX={80}
              startY={80}
              endX={720}
              endY={320}
              color="#F2C94C"
              thickness={4}
              pulseSpeed={1500}
              glowIntensity={28}
              animated={true}
            />

            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="font-semibold mb-1">Straight Path Variant</h3>
              <p className="text-sm text-blue-200">Direct line with glow</p>
            </div>
          </div>

          {/* Multi-Path */}
          <div className="relative h-96 bg-gradient-to-br from-green-900 to-teal-900 rounded-3xl border-2 border-green-700 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center">
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="absolute top-12 left-12 w-10 h-10 bg-blue-400 rounded-full" />
            <div className="absolute top-12 right-12 w-10 h-10 bg-green-400 rounded-full" />
            <div className="absolute bottom-12 left-12 w-10 h-10 bg-red-400 rounded-full" />
            <div className="absolute bottom-12 right-12 w-10 h-10 bg-purple-400 rounded-full" />

            <FeedbackMultiPathHighlight
              paths={[
                { startX: 80, startY: 80, endX: 400, endY: 192, color: '#2F80FF' },
                { startX: 720, startY: 80, endX: 400, endY: 192, color: '#27D17C' },
                { startX: 80, startY: 320, endX: 400, endY: 192, color: '#EB5757' },
                { startX: 720, startY: 320, endX: 400, endY: 192, color: '#6C5CE7' },
              ]}
              thickness={3}
              pulseSpeed={2500}
              glowIntensity={20}
              staggerDelay={300}
            />

            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="font-semibold mb-1">Multi-Path Highlight</h3>
              <p className="text-sm text-green-200">Multiple connections with stagger</p>
            </div>
          </div>

          {/* Path Controls */}
          <div className="p-6 bg-white rounded-2xl border-2 border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4">
              Path Highlight Properties
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Thickness</p>
                <p className="font-semibold text-slate-800">3-5px</p>
              </div>
              <div>
                <p className="text-slate-500">Pulse Speed</p>
                <p className="font-semibold text-slate-800">1500-2500ms</p>
              </div>
              <div>
                <p className="text-slate-500">Glow Intensity</p>
                <p className="font-semibold text-slate-800">20-28px</p>
              </div>
              <div>
                <p className="text-slate-500">Animation</p>
                <p className="font-semibold text-slate-800">Gradient + Dot</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="space-y-6 p-8 bg-white rounded-3xl border-2 border-slate-200">
          <h2 className="text-3xl font-semibold text-slate-800">
            Technical Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">Overlay / Tooltip</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ radius-tooltip (8px border radius)</li>
                <li>✓ 20-24px backdrop blur</li>
                <li>✓ 1px minimal border</li>
                <li>✓ Light shadow (2-4px)</li>
                <li>✓ 150ms fade-in animation</li>
                <li>✓ 4 positions: top, bottom, left, right</li>
                <li>✓ Rich variant with icon + description</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">Overlay / Toast</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ 5 variants with unique colors</li>
                <li>✓ 24px backdrop blur</li>
                <li>✓ Animated progress bar</li>
                <li>✓ Auto-dismiss (default 5s)</li>
                <li>✓ Slide-in animation (300ms)</li>
                <li>✓ Close button optional</li>
                <li>✓ Toast container manages stack</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">Feedback / XPBurst</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ 10-14 configurable particles</li>
                <li>✓ 5 shape types (circle, square, star, diamond, plus)</li>
                <li>✓ Radial drift animation (800-1200ms)</li>
                <li>✓ Fade out with rotation (360deg)</li>
                <li>✓ Central XP label with bounce</li>
                <li>✓ Random delays for stagger effect</li>
                <li>✓ Custom color palette support</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">Feedback / PathHighlight</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ SVG-based curved/straight paths</li>
                <li>✓ Gaussian blur glow filter</li>
                <li>✓ Animated gradient pulse (2-2.5s)</li>
                <li>✓ Traveling dot animation</li>
                <li>✓ Configurable thickness (3-5px)</li>
                <li>✓ Multi-path with stagger support</li>
                <li>✓ Dashed line option</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
