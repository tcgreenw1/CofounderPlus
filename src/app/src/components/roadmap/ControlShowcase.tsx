import React, { useState } from 'react';
import {
  ControlButtonPrimary,
  ControlButtonSecondary,
  ControlZoomControls,
  ControlFilterChip,
  ControlFilterChipGroup,
} from './ControlComponents';
import {
  Plus,
  Save,
  Share2,
  Download,
  Upload,
  Settings,
  Star,
  Zap,
  Target,
  TrendingUp,
  Users,
  Code,
  Rocket,
  Briefcase,
} from 'lucide-react';

/**
 * Comprehensive showcase for Control components
 */
export function ControlShowcase() {
  const [zoom, setZoom] = useState(100);
  const [activeFilters, setActiveFilters] = useState<string[]>(['dev', 'marketing']);
  const [singleFilter, setSingleFilter] = useState<string[]>(['all']);

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));
  const handleZoomReset = () => setZoom(100);

  const multiSelectFilters = [
    { id: 'dev', label: 'Development', icon: <Code className="w-4 h-4" />, count: 12, color: 'blue' as const },
    { id: 'marketing', label: 'Marketing', icon: <TrendingUp className="w-4 h-4" />, count: 8, color: 'green' as const },
    { id: 'design', label: 'Design', icon: <Star className="w-4 h-4" />, count: 5, color: 'yellow' as const },
    { id: 'ops', label: 'Operations', icon: <Briefcase className="w-4 h-4" />, count: 3, color: 'red' as const },
  ];

  const singleSelectFilters = [
    { id: 'all', label: 'All Nodes', count: 42, color: 'blue' as const },
    { id: 'active', label: 'Active', count: 8, color: 'green' as const },
    { id: 'blocked', label: 'Blocked', count: 3, color: 'red' as const },
    { id: 'completed', label: 'Completed', count: 18, color: 'green' as const },
  ];

  return (
    <div className="min-h-screen p-8 md:p-12 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold text-slate-900">
            Control Components Library
          </h1>
          <p className="text-slate-600 text-xl">
            Buttons, zoom controls, and filter chips
          </p>
        </div>

        {/* 1. Button Primary */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              1. Control / ButtonPrimary
            </h2>
            <p className="text-slate-600">
              Glass buttons with bold text and edge lighting
            </p>
          </div>

          {/* Color Variants */}
          <div className="space-y-6 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">
              Color Variants
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-4">
                <ControlButtonPrimary variant="blue" icon={<Plus />}>
                  Add Node
                </ControlButtonPrimary>
                <p className="text-xs text-slate-500 text-center">Blue variant</p>
              </div>

              <div className="space-y-4">
                <ControlButtonPrimary variant="green" icon={<Save />}>
                  Save Changes
                </ControlButtonPrimary>
                <p className="text-xs text-slate-500 text-center">Green variant</p>
              </div>

              <div className="space-y-4">
                <ControlButtonPrimary variant="yellow" icon={<Zap />}>
                  Quick Action
                </ControlButtonPrimary>
                <p className="text-xs text-slate-500 text-center">Yellow variant</p>
              </div>

              <div className="space-y-4">
                <ControlButtonPrimary variant="red" icon={<Target />}>
                  Delete Item
                </ControlButtonPrimary>
                <p className="text-xs text-slate-500 text-center">Red variant</p>
              </div>
            </div>
          </div>

          {/* Size Variants */}
          <div className="space-y-6 p-8 bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">
              Size Variants
            </h3>
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-3">
                <ControlButtonPrimary variant="blue" size="sm" icon={<Star />}>
                  Small
                </ControlButtonPrimary>
                <p className="text-xs text-slate-500 text-center">Small (sm)</p>
              </div>

              <div className="space-y-3">
                <ControlButtonPrimary variant="blue" size="md" icon={<Star />}>
                  Medium
                </ControlButtonPrimary>
                <p className="text-xs text-slate-500 text-center">Medium (md)</p>
              </div>

              <div className="space-y-3">
                <ControlButtonPrimary variant="blue" size="lg" icon={<Star />}>
                  Large
                </ControlButtonPrimary>
                <p className="text-xs text-slate-500 text-center">Large (lg)</p>
              </div>
            </div>
          </div>

          {/* With/Without Icons */}
          <div className="space-y-6 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">
              Icon Options
            </h3>
            <div className="flex flex-wrap gap-4">
              <ControlButtonPrimary variant="blue" icon={<Upload />}>
                With Icon
              </ControlButtonPrimary>

              <ControlButtonPrimary variant="green">
                No Icon
              </ControlButtonPrimary>

              <ControlButtonPrimary variant="yellow" icon={<Rocket />}>
                Launch
              </ControlButtonPrimary>

              <ControlButtonPrimary variant="blue" disabled icon={<Settings />}>
                Disabled
              </ControlButtonPrimary>
            </div>
          </div>

          {/* Real-world Examples */}
          <div className="space-y-6 p-8 bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl">
            <h3 className="text-lg font-semibold text-white">
              Real-world Button Examples
            </h3>
            <div className="flex flex-wrap gap-4">
              <ControlButtonPrimary variant="blue" icon={<Plus />} size="md">
                Add to Roadmap
              </ControlButtonPrimary>

              <ControlButtonPrimary variant="green" icon={<Save />} size="md">
                Save Roadmap
              </ControlButtonPrimary>

              <ControlButtonPrimary variant="yellow" icon={<Share2 />} size="md">
                Share with Team
              </ControlButtonPrimary>

              <ControlButtonPrimary variant="blue" icon={<Download />} size="md">
                Export Data
              </ControlButtonPrimary>
            </div>
          </div>
        </section>

        {/* 2. Button Secondary */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              2. Control / ButtonSecondary
            </h2>
            <p className="text-slate-600">
              Subtle glass variant for less emphasis
            </p>
          </div>

          <div className="space-y-6 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            {/* Size Variants */}
            <div className="flex flex-wrap items-end gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-3">
                <ControlButtonSecondary size="sm" icon={<Settings />}>
                  Settings
                </ControlButtonSecondary>
                <p className="text-xs text-slate-500 text-center">Small</p>
              </div>

              <div className="space-y-3">
                <ControlButtonSecondary size="md" icon={<Settings />}>
                  Settings
                </ControlButtonSecondary>
                <p className="text-xs text-slate-500 text-center">Medium</p>
              </div>

              <div className="space-y-3">
                <ControlButtonSecondary size="lg" icon={<Settings />}>
                  Settings
                </ControlButtonSecondary>
                <p className="text-xs text-slate-500 text-center">Large</p>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="flex flex-wrap gap-4">
              <ControlButtonSecondary icon={<Settings />}>
                Preferences
              </ControlButtonSecondary>

              <ControlButtonSecondary icon={<Users />}>
                Team Members
              </ControlButtonSecondary>

              <ControlButtonSecondary>
                Cancel
              </ControlButtonSecondary>

              <ControlButtonSecondary disabled icon={<Share2 />}>
                Disabled
              </ControlButtonSecondary>
            </div>
          </div>

          {/* Primary vs Secondary Comparison */}
          <div className="space-y-4 p-8 bg-gradient-to-br from-slate-100 to-purple-100 rounded-3xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">
              Primary vs Secondary Comparison
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <ControlButtonPrimary variant="blue" icon={<Save />}>
                Save Changes
              </ControlButtonPrimary>
              <ControlButtonSecondary icon={<X className="w-5 h-5" />}>
                Cancel
              </ControlButtonSecondary>
              <span className="text-sm text-slate-500">← Typical pairing</span>
            </div>
          </div>
        </section>

        {/* 3. Zoom Controls */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              3. Control / ZoomControls
            </h2>
            <p className="text-slate-600">
              +/- buttons with reset functionality
            </p>
          </div>

          <div className="space-y-6 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            {/* Interactive Demo */}
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-3">
                  Interactive Demo
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Current zoom: {zoom}% (Range: 50% - 200%)
                </p>
                <ControlZoomControls
                  currentZoom={zoom}
                  minZoom={50}
                  maxZoom={200}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onReset={handleZoomReset}
                />
              </div>

              {/* Visual Zoom Demo */}
              <div className="relative h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 overflow-hidden flex items-center justify-center">
                <div
                  className="transition-transform duration-300 ease-out"
                  style={{
                    transform: `scale(${zoom / 100})`,
                  }}
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center">
                    <Rocket className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Placement Examples */}
          <div className="space-y-4 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Typical Placements
            </h3>
            
            {/* Bottom Right */}
            <div className="relative h-48 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <div className="absolute bottom-4 right-4">
                <ControlZoomControls
                  currentZoom={125}
                  onZoomIn={() => console.log('zoom in')}
                  onZoomOut={() => console.log('zoom out')}
                  onReset={() => console.log('reset')}
                />
              </div>
              <div className="absolute top-4 left-4 text-white text-sm">
                Bottom Right (Common)
              </div>
            </div>

            {/* Top Right */}
            <div className="relative h-48 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <div className="absolute top-4 right-4">
                <ControlZoomControls
                  currentZoom={75}
                  onZoomIn={() => console.log('zoom in')}
                  onZoomOut={() => console.log('zoom out')}
                  onReset={() => console.log('reset')}
                />
              </div>
              <div className="absolute bottom-4 left-4 text-white text-sm">
                Top Right
              </div>
            </div>
          </div>
        </section>

        {/* 4. Filter Chips */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              4. Control / FilterChip
            </h2>
            <p className="text-slate-600">
              Small glass pills with active/inactive variants
            </p>
          </div>

          {/* Individual Chips */}
          <div className="space-y-6 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">
              Individual Filter Chips
            </h3>

            {/* Active State - All Colors */}
            <div>
              <p className="text-sm text-slate-600 mb-3">Active State (All Colors)</p>
              <div className="flex flex-wrap gap-3">
                <ControlFilterChip label="Blue Filter" active color="blue" />
                <ControlFilterChip label="Green Filter" active color="green" />
                <ControlFilterChip label="Yellow Filter" active color="yellow" />
                <ControlFilterChip label="Red Filter" active color="red" />
              </div>
            </div>

            {/* Inactive State */}
            <div>
              <p className="text-sm text-slate-600 mb-3">Inactive State</p>
              <div className="flex flex-wrap gap-3">
                <ControlFilterChip label="Inactive 1" active={false} />
                <ControlFilterChip label="Inactive 2" active={false} />
                <ControlFilterChip label="Inactive 3" active={false} />
              </div>
            </div>

            {/* With Icons */}
            <div>
              <p className="text-sm text-slate-600 mb-3">With Icons</p>
              <div className="flex flex-wrap gap-3">
                <ControlFilterChip label="Development" active color="blue" icon={<Code className="w-4 h-4" />} />
                <ControlFilterChip label="Marketing" active color="green" icon={<TrendingUp className="w-4 h-4" />} />
                <ControlFilterChip label="Design" active color="yellow" icon={<Star className="w-4 h-4" />} />
                <ControlFilterChip label="Operations" active={false} icon={<Briefcase className="w-4 h-4" />} />
              </div>
            </div>

            {/* With Counts */}
            <div>
              <p className="text-sm text-slate-600 mb-3">With Count Badges</p>
              <div className="flex flex-wrap gap-3">
                <ControlFilterChip label="All" active color="blue" count={42} />
                <ControlFilterChip label="Active" active color="green" count={8} />
                <ControlFilterChip label="Blocked" active={false} count={3} />
                <ControlFilterChip label="Complete" active color="green" count={18} />
              </div>
            </div>

            {/* Size Variants */}
            <div>
              <p className="text-sm text-slate-600 mb-3">Size Variants</p>
              <div className="flex flex-wrap items-end gap-3">
                <ControlFilterChip label="Small" size="sm" active color="blue" />
                <ControlFilterChip label="Medium" size="md" active color="blue" />
              </div>
            </div>
          </div>

          {/* Filter Chip Groups */}
          <div className="space-y-6 p-8 bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">
              Multi-Select Filter Group
            </h3>
            <p className="text-sm text-slate-600">
              Selected: {activeFilters.join(', ') || 'None'}
            </p>
            <ControlFilterChipGroup
              filters={multiSelectFilters}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              multiSelect={true}
            />
          </div>

          <div className="space-y-6 p-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl border border-purple-200">
            <h3 className="text-lg font-semibold text-slate-700">
              Single-Select Filter Group
            </h3>
            <p className="text-sm text-slate-600">
              Selected: {singleFilter[0]}
            </p>
            <ControlFilterChipGroup
              filters={singleSelectFilters}
              activeFilters={singleFilter}
              onFilterChange={setSingleFilter}
              multiSelect={false}
            />
          </div>

          {/* Real-world Example */}
          <div className="space-y-6 p-8 bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl">
            <h3 className="text-lg font-semibold text-white">
              Real-world Roadmap Filters
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-300 mb-3">Filter by Status</p>
                <div className="flex flex-wrap gap-2">
                  <ControlFilterChip label="Available" active color="blue" count={12} size="sm" />
                  <ControlFilterChip label="In Progress" active color="yellow" count={6} size="sm" />
                  <ControlFilterChip label="Completed" active color="green" count={18} size="sm" />
                  <ControlFilterChip label="Blocked" active={false} color="red" count={3} size="sm" />
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-300 mb-3">Filter by Branch</p>
                <div className="flex flex-wrap gap-2">
                  <ControlFilterChip label="Development" active color="blue" icon={<Code className="w-3 h-3" />} size="sm" />
                  <ControlFilterChip label="Marketing" active color="green" icon={<TrendingUp className="w-3 h-3" />} size="sm" />
                  <ControlFilterChip label="Design" active={false} icon={<Star className="w-3 h-3" />} size="sm" />
                  <ControlFilterChip label="AI/AGI" active={false} icon={<Zap className="w-3 h-3" />} size="sm" />
                </div>
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
              <h3 className="font-semibold text-slate-700 text-lg">ButtonPrimary</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ 4 color variants (blue, green, yellow, red)</li>
                <li>✓ 3 sizes (sm, md, lg)</li>
                <li>✓ 16px backdrop blur</li>
                <li>✓ 2px solid border with glow</li>
                <li>✓ Edge lighting gradient (top half)</li>
                <li>✓ Specular highlight overlay</li>
                <li>✓ Hover glow effect (blur-xl)</li>
                <li>✓ Scale animations (1.02 hover, 0.98 active)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">ButtonSecondary</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ Subtle glass (12px blur)</li>
                <li>✓ Gray color palette</li>
                <li>✓ 3 sizes (sm, md, lg)</li>
                <li>✓ 1.5px border</li>
                <li>✓ Lighter shadows than primary</li>
                <li>✓ No edge lighting or glow</li>
                <li>✓ Minimal specular highlight</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">ZoomControls</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ 3-button layout (-/reset/+)</li>
                <li>✓ 40px button height</li>
                <li>✓ Current zoom display in center</li>
                <li>✓ Disabled state when at min/max</li>
                <li>✓ Hover glow on active buttons</li>
                <li>✓ Scale animations (1.05 hover, 0.95 active)</li>
                <li>✓ Blue accent theme</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">FilterChip</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ Active/inactive variants</li>
                <li>✓ 4 color variants when active</li>
                <li>✓ 2 sizes (sm, md)</li>
                <li>✓ Optional icon support</li>
                <li>✓ Optional count badge</li>
                <li>✓ Auto checkmark when active</li>
                <li>✓ Glow effect on active state</li>
                <li>✓ FilterChipGroup for multi/single select</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function X(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
