import React from 'react';
import {
  BranchLane,
  BranchLaneDark,
  BranchNodeContainer,
  BranchDependencyLine,
  BranchDependencyLineStraight,
} from './BranchComponents';
import { NodeAvailable, NodeActive, NodeCompleted } from './NodeStateVariants';
import { Rocket, Target, CheckCircle2, Code, Zap, Database } from 'lucide-react';

/**
 * Showcase for Branch Components
 */
export function BranchComponentsShowcase() {
  // Helper for creating icons
  const iconWrapper = (Icon: any, color: string) => (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
  );

  // Helper for XP badges
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
    <div className="min-h-screen p-8 md:p-12 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold text-slate-900">
            Branch Components Library
          </h1>
          <p className="text-slate-600 text-xl">
            Lanes, Node Containers, and Dependency Lines
          </p>
        </div>

        {/* 1. Branch Lanes Demo */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              1. Branch / Lane
            </h2>
            <p className="text-slate-600">
              Vertical layout with color-coded bar, category label, and collapse/expand toggle
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Blue Lane */}
            <BranchLane
              categoryLabel="Development"
              barColor="#2F80FF"
              barWidth={6}
            >
              <BranchNodeContainer spacing={24}>
                <NodeActive
                  icon={iconWrapper(Code, '#2F80FF')}
                  title="Build API"
                  xpBadge={xpBadge('+40', '#2F80FF')}
                />
                <NodeAvailable
                  icon={iconWrapper(Database, '#2F80FF')}
                  title="Setup Database"
                  xpBadge={xpBadge('+30', '#2F80FF')}
                />
              </BranchNodeContainer>
            </BranchLane>

            {/* Green Lane */}
            <BranchLane
              categoryLabel="Marketing"
              barColor="#27D17C"
              barWidth={8}
              defaultExpanded={true}
            >
              <BranchNodeContainer spacing={32}>
                <NodeCompleted
                  icon={iconWrapper(CheckCircle2, '#27D17C')}
                  title="Launch Campaign"
                  xpBadge={xpBadge('+100', '#27D17C')}
                />
                <NodeAvailable
                  icon={iconWrapper(Target, '#27D17C')}
                  title="A/B Testing"
                  xpBadge={xpBadge('+50', '#27D17C')}
                />
              </BranchNodeContainer>
            </BranchLane>

            {/* Yellow Lane */}
            <BranchLane
              categoryLabel="Design"
              barColor="#F2C94C"
              barWidth={6}
            >
              <BranchNodeContainer spacing={28}>
                <NodeAvailable
                  icon={iconWrapper(Rocket, '#F2C94C')}
                  title="Create Wireframes"
                  xpBadge={xpBadge('+25', '#F2C94C')}
                />
                <NodeAvailable
                  icon={iconWrapper(Target, '#F2C94C')}
                  title="User Testing"
                  xpBadge={xpBadge('+35', '#F2C94C')}
                />
              </BranchNodeContainer>
            </BranchLane>

            {/* Purple Lane */}
            <BranchLane
              categoryLabel="AI & Automation"
              barColor="#6C5CE7"
              barWidth={7}
            >
              <BranchNodeContainer spacing={32}>
                <NodeActive
                  icon={iconWrapper(Zap, '#6C5CE7')}
                  title="Train Model"
                  xpBadge={xpBadge('+60', '#6C5CE7')}
                />
              </BranchNodeContainer>
            </BranchLane>
          </div>
        </section>

        {/* 2. Node Container Spacing Demo */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              2. Branch / NodeContainer
            </h2>
            <p className="text-slate-600">
              Vertical auto-layout with configurable spacing (24-40px)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 24px spacing */}
            <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-600 uppercase">
                Spacing: 24px (Compact)
              </h3>
              <BranchNodeContainer spacing={24}>
                <NodeAvailable
                  icon={iconWrapper(Rocket, '#2F80FF')}
                  title="Task 1"
                  xpBadge={xpBadge('+10', '#2F80FF')}
                />
                <NodeAvailable
                  icon={iconWrapper(Target, '#2F80FF')}
                  title="Task 2"
                  xpBadge={xpBadge('+10', '#2F80FF')}
                />
                <NodeAvailable
                  icon={iconWrapper(Code, '#2F80FF')}
                  title="Task 3"
                  xpBadge={xpBadge('+10', '#2F80FF')}
                />
              </BranchNodeContainer>
            </div>

            {/* 32px spacing */}
            <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-600 uppercase">
                Spacing: 32px (Default)
              </h3>
              <BranchNodeContainer spacing={32}>
                <NodeAvailable
                  icon={iconWrapper(Rocket, '#27D17C')}
                  title="Task 1"
                  xpBadge={xpBadge('+10', '#27D17C')}
                />
                <NodeAvailable
                  icon={iconWrapper(Target, '#27D17C')}
                  title="Task 2"
                  xpBadge={xpBadge('+10', '#27D17C')}
                />
                <NodeAvailable
                  icon={iconWrapper(Code, '#27D17C')}
                  title="Task 3"
                  xpBadge={xpBadge('+10', '#27D17C')}
                />
              </BranchNodeContainer>
            </div>

            {/* 40px spacing */}
            <div className="space-y-4 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-600 uppercase">
                Spacing: 40px (Spacious)
              </h3>
              <BranchNodeContainer spacing={40}>
                <NodeAvailable
                  icon={iconWrapper(Rocket, '#F2C94C')}
                  title="Task 1"
                  xpBadge={xpBadge('+10', '#F2C94C')}
                />
                <NodeAvailable
                  icon={iconWrapper(Target, '#F2C94C')}
                  title="Task 2"
                  xpBadge={xpBadge('+10', '#F2C94C')}
                />
                <NodeAvailable
                  icon={iconWrapper(Code, '#F2C94C')}
                  title="Task 3"
                  xpBadge={xpBadge('+10', '#F2C94C')}
                />
              </BranchNodeContainer>
            </div>
          </div>
        </section>

        {/* 3. Dependency Lines Demo */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              3. Branch / DependencyLine
            </h2>
            <p className="text-slate-600">
              Curved SVG paths with glow, animation, and color variations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Curved Lines */}
            <div className="space-y-4 p-8 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200 relative min-h-[400px]">
              <h3 className="text-lg font-semibold text-slate-800 mb-8">
                Curved Dependencies
              </h3>

              {/* Blue curved line */}
              <BranchDependencyLine
                startX={50}
                startY={50}
                endX={300}
                endY={120}
                color="#2F80FF"
                strokeWidth={3}
                animated={true}
                curveIntensity={0.5}
                glowIntensity={0.4}
              />

              {/* Green curved line */}
              <BranchDependencyLine
                startX={50}
                startY={150}
                endX={300}
                endY={220}
                color="#27D17C"
                strokeWidth={4}
                animated={false}
                curveIntensity={0.6}
                glowIntensity={0.5}
              />

              {/* Yellow dashed curved line */}
              <BranchDependencyLine
                startX={50}
                startY={250}
                endX={300}
                endY={320}
                color="#F2C94C"
                strokeWidth={3}
                animated={true}
                dashed={true}
                curveIntensity={0.7}
                glowIntensity={0.6}
              />

              {/* Visual markers */}
              <div className="absolute top-[50px] left-[50px] w-4 h-4 bg-blue-500 rounded-full" />
              <div className="absolute top-[120px] left-[300px] w-4 h-4 bg-blue-500 rounded-full" />
              
              <div className="absolute top-[150px] left-[50px] w-4 h-4 bg-green-500 rounded-full" />
              <div className="absolute top-[220px] left-[300px] w-4 h-4 bg-green-500 rounded-full" />
              
              <div className="absolute top-[250px] left-[50px] w-4 h-4 bg-yellow-500 rounded-full" />
              <div className="absolute top-[320px] left-[300px] w-4 h-4 bg-yellow-500 rounded-full" />

              <div className="absolute bottom-4 left-4 space-y-1 text-xs text-slate-600">
                <p>• Blue: Animated, 50% curve</p>
                <p>• Green: Static, 60% curve</p>
                <p>• Yellow: Animated dashed, 70% curve</p>
              </div>
            </div>

            {/* Straight Lines */}
            <div className="space-y-4 p-8 bg-white/60 rounded-2xl backdrop-blur-sm border border-slate-200 relative min-h-[400px]">
              <h3 className="text-lg font-semibold text-slate-800 mb-8">
                Straight Dependencies
              </h3>

              {/* Blue straight line */}
              <BranchDependencyLineStraight
                startX={50}
                startY={50}
                endX={300}
                endY={120}
                color="#2F80FF"
                strokeWidth={3}
                animated={false}
                glowIntensity={0.4}
              />

              {/* Purple straight line */}
              <BranchDependencyLineStraight
                startX={50}
                startY={150}
                endX={300}
                endY={220}
                color="#6C5CE7"
                strokeWidth={4}
                animated={true}
                glowIntensity={0.5}
              />

              {/* Red dashed straight line */}
              <BranchDependencyLineStraight
                startX={50}
                startY={250}
                endX={300}
                endY={320}
                color="#EB5757"
                strokeWidth={3}
                animated={true}
                dashed={true}
                glowIntensity={0.3}
              />

              {/* Visual markers */}
              <div className="absolute top-[50px] left-[50px] w-4 h-4 bg-blue-500 rounded-full" />
              <div className="absolute top-[120px] left-[300px] w-4 h-4 bg-blue-500 rounded-full" />
              
              <div className="absolute top-[150px] left-[50px] w-4 h-4 bg-purple-500 rounded-full" />
              <div className="absolute top-[220px] left-[300px] w-4 h-4 bg-purple-500 rounded-full" />
              
              <div className="absolute top-[250px] left-[50px] w-4 h-4 bg-red-500 rounded-full" />
              <div className="absolute top-[320px] left-[300px] w-4 h-4 bg-red-500 rounded-full" />

              <div className="absolute bottom-4 left-4 space-y-1 text-xs text-slate-600">
                <p>• Blue: Static straight</p>
                <p>• Purple: Animated straight</p>
                <p>• Red: Animated dashed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dark Mode Examples */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              Dark Mode Variants
            </h2>
            <p className="text-slate-600">
              Branch lanes with dark theme styling
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 bg-slate-900 rounded-3xl">
            <BranchLaneDark
              categoryLabel="Backend Services"
              barColor="#2F80FF"
              barWidth={6}
            >
              <BranchNodeContainer spacing={28}>
                <NodeActive
                  icon={iconWrapper(Database, '#2F80FF')}
                  title="Setup Database"
                  xpBadge={xpBadge('+50', '#2F80FF')}
                />
              </BranchNodeContainer>
            </BranchLaneDark>

            <BranchLaneDark
              categoryLabel="AI Features"
              barColor="#6C5CE7"
              barWidth={7}
            >
              <BranchNodeContainer spacing={32}>
                <NodeAvailable
                  icon={iconWrapper(Zap, '#6C5CE7')}
                  title="ML Pipeline"
                  xpBadge={xpBadge('+80', '#6C5CE7')}
                />
              </BranchNodeContainer>
            </BranchLaneDark>
          </div>
        </section>

        {/* Technical Specs */}
        <section className="space-y-6 p-8 bg-white rounded-3xl border-2 border-slate-200">
          <h2 className="text-3xl font-semibold text-slate-800">
            Technical Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">Branch / Lane</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ Color bar: 6-8px width</li>
                <li>✓ Vertical auto-layout</li>
                <li>✓ Collapse/expand animation</li>
                <li>✓ Category label header</li>
                <li>✓ 16px backdrop blur</li>
                <li>✓ Smooth transitions (300ms)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">NodeContainer</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ Flexbox vertical layout</li>
                <li>✓ Spacing: 24-40px range</li>
                <li>✓ Default: 32px gap</li>
                <li>✓ Auto-adjusts to content</li>
                <li>✓ Fully responsive</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">DependencyLine</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ SVG cubic bezier curves</li>
                <li>✓ Adjustable curve intensity</li>
                <li>✓ Glow filter (4px blur)</li>
                <li>✓ Arrow markers</li>
                <li>✓ Optional dashed pattern</li>
                <li>✓ Animate-able paths</li>
                <li>✓ Semi-transparent (60%)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
