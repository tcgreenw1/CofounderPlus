import React, { useState } from 'react';
import {
  NodePanelRoot,
  NodePanelHeader,
  NodePanelProgress,
  NodePanelTaskList,
  NodePanelAGIInsightCard,
  NodePanelFooterActions,
  NodePanelDependenciesBlock,
  NodePanelKillRuleCard,
} from './PanelComponents';

/**
 * Node Detail Panel Showcase
 * Demonstrates the complete assembled NodePanel with all 7 components
 * 
 * COMPLETE PANEL STRUCTURE (Auto Layout - 24px spacing):
 * 
 * 1. NodePanel / Header - Title, category badge, XP, state indicator, close button
 * 2. NodePanel / Progress - Progress bar, estimated time, action button, optional kill rule warning
 * 3. NodePanel / TaskList - Expandable task items with checkboxes, duration, XP, and definition of done
 * 4. NodePanel / AGIInsightCard - AI-generated insights with color-coded tags (Why now?, Efficiency, Risk)
 * 5. NodePanel / DependenciesBlock - Prerequisites with status indicators (completed, in-progress, blocked, available)
 * 6. NodePanel / KillRuleCard - Conditionally visible warning/danger card for kill conditions
 * 7. NodePanel / FooterActions - Primary, Danger, Secondary, Tertiary, and Menu buttons
 * 
 * All components use:
 * - Apple Liquid Glass styling (blur effects, gradient borders)
 * - Toy Box Pop color palette (vibrant, no gradients)
 * - Bouncy Angular animations (scale transforms on hover/press)
 * - Consistent spacing tokens (24px vertical auto layout)
 */

export function NodePanelShowcase() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedState, setSelectedState] = useState<'active' | 'recommended' | 'blocked' | 'failed' | 'completed'>('active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Node Detail Panel</h1>
          <p className="text-slate-600">Slide-out panel for viewing and interacting with roadmap nodes</p>
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
            {isOpen ? 'Close Panel' : 'Open Panel'}
          </button>

          {/* State Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value as any)}
              className="px-3 py-2 rounded-lg border-2 border-blue-300 bg-white/80 text-slate-800 font-semibold"
            >
              <option value="active">Active</option>
              <option value="recommended">Recommended</option>
              <option value="blocked">Blocked</option>
              <option value="failed">Failed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Component Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NodePanelHeader Examples */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">NodePanel / Header</h2>
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Active State</h3>
              <NodePanelHeader
                nodeName="Setup Analytics Dashboard"
                category={{ label: 'Development', color: '#2F80FF' }}
                xpValue={250}
                state="active"
                onClose={() => console.log('Close clicked')}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Recommended State</h3>
              <NodePanelHeader
                nodeName="User Onboarding Flow"
                category={{ label: 'Design', color: '#F2C94C' }}
                xpValue={180}
                state="recommended"
                onClose={() => console.log('Close clicked')}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Completed State</h3>
              <NodePanelHeader
                nodeName="Database Schema Design"
                category={{ label: 'Development', color: '#2F80FF' }}
                xpValue={300}
                state="completed"
                onClose={() => console.log('Close clicked')}
              />
            </div>
          </div>

          {/* NodePanelProgress Examples */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">NodePanel / Progress</h2>
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">In Progress (45%)</h3>
              <NodePanelProgress
                progress={45}
                estimatedTime="3-5 days"
                buttonLabel="Continue"
                onButtonClick={() => console.log('Continue clicked')}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Not Started (0%)</h3>
              <NodePanelProgress
                progress={0}
                estimatedTime="1 week"
                buttonLabel="Start Milestone"
                onButtonClick={() => console.log('Start clicked')}
              />
            </div>

            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">With Kill Rule Warning</h3>
              <NodePanelProgress
                progress={15}
                estimatedTime="2-3 days"
                killRuleWarning="If user engagement doesn't increase by 20% within 2 weeks, consider pivoting to a different approach."
                buttonLabel="Continue"
                onButtonClick={() => console.log('Continue clicked')}
              />
            </div>
          </div>
        </div>

        {/* NodePanel Task List & AGI Insight Examples */}
        <div className="grid grid-cols-1 gap-8">
          {/* Task List Example */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">NodePanel / TaskList</h2>
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Interactive Task List</h3>
              <NodePanelTaskList
                tasks={[
                  {
                    taskId: 'demo-task-1',
                    title: 'Research competitor features',
                    duration: '3 hours',
                    xpValue: 40,
                    isCompleted: true,
                  },
                  {
                    taskId: 'demo-task-2',
                    title: 'Design wireframes and mockups',
                    duration: '1 day',
                    xpValue: 100,
                    isCompleted: false,
                    definitionOfDone: [
                      'All screens designed in Figma',
                      'User flows documented',
                      'Design review completed',
                    ],
                  },
                  {
                    taskId: 'demo-task-3',
                    title: 'Implement frontend components',
                    duration: '2 days',
                    xpValue: 150,
                    isCompleted: false,
                    definitionOfDone: [
                      'Components built with React',
                      'Responsive design tested',
                      'Unit tests written',
                      'Accessibility standards met',
                    ],
                  },
                ]}
                onToggleComplete={(taskId) => console.log('Toggled:', taskId)}
              />
            </div>
          </div>

          {/* AGI Insight Card Examples */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">NodePanel / AGIInsightCard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Strategic Insight</h3>
                <NodePanelAGIInsightCard
                  insightText="This milestone is on the critical path to launch. Completing it now will unblock 3 other high-value tasks and accelerate your timeline by approximately 2 weeks."
                  tags={[
                    { label: 'Critical Path', type: 'why-now' },
                    { label: 'Unblocks 3 Tasks', type: 'efficiency' },
                  ]}
                />
              </div>

              <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">Risk Warning</h3>
                <NodePanelAGIInsightCard
                  insightText="Based on similar projects, this task often takes 40% longer than estimated. Consider breaking it into smaller milestones or allocating additional resources."
                  tags={[
                    { label: 'High Complexity', type: 'risk' },
                    { label: 'Time Sensitive', type: 'why-now' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions Examples */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">NodePanel / FooterActions</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Unlocked State</h3>
              <NodePanelFooterActions
                onComplete={() => console.log('Complete')}
                onMarkFailed={() => console.log('Mark Failed')}
                onAskAGI={() => console.log('Ask AGI')}
                onToggleLock={(locked) => console.log('Lock:', locked)}
                onMenuClick={() => console.log('Menu')}
                isLocked={false}
              />
            </div>
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Locked State</h3>
              <NodePanelFooterActions
                onComplete={() => console.log('Complete')}
                onMarkFailed={() => console.log('Mark Failed')}
                onAskAGI={() => console.log('Ask AGI')}
                onToggleLock={(locked) => console.log('Lock:', locked)}
                onMenuClick={() => console.log('Menu')}
                isLocked={true}
              />
            </div>
          </div>
        </div>

        {/* Dependencies Block Examples */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">NodePanel / DependenciesBlock</h2>
          <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">Mixed Status Dependencies</h3>
            <NodePanelDependenciesBlock
              dependencies={[
                { id: 'dep-1', title: 'Database Schema Design', status: 'completed' },
                { id: 'dep-2', title: 'User Authentication', status: 'in-progress' },
                { id: 'dep-3', title: 'API Endpoints', status: 'available' },
                { id: 'dep-4', title: 'Payment Gateway Integration', status: 'blocked' },
              ]}
            />
          </div>
        </div>

        {/* Kill Rule Card Examples */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">NodePanel / KillRuleCard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Warning Severity</h3>
              <NodePanelKillRuleCard
                visible={true}
                killRule={{
                  condition: 'If user engagement doesn\'t increase by 20% within 2 weeks',
                  consequence: 'Consider pivoting to a simpler onboarding flow',
                  severity: 'warning',
                }}
              />
            </div>
            <div className="space-y-4 p-6 bg-white/50 rounded-xl border-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-700">Danger Severity</h3>
              <NodePanelKillRuleCard
                visible={true}
                killRule={{
                  condition: 'If implementation cost exceeds $10,000',
                  consequence: 'Immediately halt development and reassess ROI',
                  severity: 'danger',
                }}
              />
            </div>
          </div>
        </div>

        {/* Full Panel Example */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center">Complete Assembled Panel</h2>
          <p className="text-center text-slate-600">
            Click "Open Panel" above to see all 7 components in the correct Auto Layout order
          </p>
        </div>
      </div>

      {/* Live Panel Example */}
      <NodePanelRoot
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        width={420}
      >
        <NodePanelHeader
          nodeName="Setup Analytics Dashboard"
          category={{ label: 'Development', color: '#2F80FF' }}
          xpValue={250}
          state={selectedState}
          onClose={() => setIsOpen(false)}
        />

        <NodePanelProgress
          progress={35}
          estimatedTime="3-5 days"
          killRuleWarning="If analytics integration doesn't show user insights within 1 week, consider using a simpler tool first."
          buttonLabel="Continue"
          onButtonClick={() => console.log('Continue clicked')}
        />

        {/* Additional Content */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Description</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            Build a comprehensive analytics dashboard to track user behavior, engagement metrics, 
            and key performance indicators. This will help inform data-driven decisions for product development.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Key Tasks</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Integrate Google Analytics
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Set up custom event tracking
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Create data visualization dashboard
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Configure automated reports
            </li>
          </ul>
        </div>

        {/* Dependencies Block */}
        <NodePanelDependenciesBlock
          dependencies={[
            {
              id: 'dep-1',
              title: 'Database Schema Design',
              status: 'completed',
            },
            {
              id: 'dep-2',
              title: 'User Authentication System',
              status: 'in-progress',
            },
            {
              id: 'dep-3',
              title: 'API Endpoints Setup',
              status: 'available',
            },
          ]}
        />

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Resources</h3>
          <div className="space-y-2">
            <a
              href="#"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'rgba(148, 163, 184, 0.08)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#475569',
              }}
            >
              <span>📄</span>
              Analytics Integration Guide
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'rgba(148, 163, 184, 0.08)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#475569',
              }}
            >
              <span>🎥</span>
              Dashboard Design Tutorial
            </a>
          </div>
        </div>

        {/* Task List */}
        <NodePanelTaskList
          tasks={[
            {
              taskId: 'task-1',
              title: 'Integrate Google Analytics SDK',
              duration: '2 hours',
              xpValue: 50,
              isCompleted: true,
              definitionOfDone: [
                'SDK installed and configured',
                'Basic page tracking working',
                'Test events firing correctly',
              ],
            },
            {
              taskId: 'task-2',
              title: 'Set up custom event tracking',
              duration: '4 hours',
              xpValue: 80,
              isCompleted: false,
              definitionOfDone: [
                'Event taxonomy defined',
                'All critical user actions tracked',
                'Events visible in GA dashboard',
                'Documentation updated',
              ],
            },
            {
              taskId: 'task-3',
              title: 'Create data visualization dashboard',
              duration: '1 day',
              xpValue: 120,
              isCompleted: false,
              definitionOfDone: [
                'Dashboard mockups approved',
                'Key metrics identified',
                'Real-time data displayed',
                'Charts and graphs interactive',
                'Mobile responsive design',
              ],
            },
          ]}
          onToggleComplete={(taskId) => console.log('Toggle task:', taskId)}
        />

        {/* AGI Insight Card */}
        <NodePanelAGIInsightCard
          insightText="Analytics dashboards are most effective when implemented early in the product lifecycle. This allows you to establish baseline metrics and track improvements over time. Consider focusing on 3-5 key metrics initially rather than trying to track everything."
          tags={[
            { label: 'Why Now?', type: 'why-now' },
            { label: 'High Impact', type: 'efficiency' },
            { label: 'Low Risk', type: 'efficiency' },
          ]}
        />

        {/* Dependencies Block */}
        <NodePanelDependenciesBlock
          dependencies={[
            { id: 'dep-1', title: 'Database Schema Design', status: 'completed' },
            { id: 'dep-2', title: 'User Authentication System', status: 'in-progress' },
            { id: 'dep-3', title: 'API Endpoints Setup', status: 'available' },
          ]}
        />

        {/* Kill Rule Card */}
        <NodePanelKillRuleCard
          visible={selectedState !== 'completed'}
          killRule={{
            condition: 'If analytics integration doesn\'t show user insights within 1 week',
            consequence: 'Consider using a simpler tool like Plausible or Simple Analytics first',
            severity: 'warning',
          }}
        />

        {/* Footer Actions */}
        <NodePanelFooterActions
          onComplete={() => console.log('Complete clicked')}
          onMarkFailed={() => console.log('Mark Failed clicked')}
          onAskAGI={() => console.log('Ask AGI clicked')}
          onToggleLock={(locked) => console.log('Lock toggled:', locked)}
          onMenuClick={() => console.log('Menu clicked')}
          isLocked={false}
        />
      </NodePanelRoot>
    </div>
  );
}

export default NodePanelShowcase;