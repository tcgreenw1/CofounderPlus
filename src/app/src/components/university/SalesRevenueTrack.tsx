import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  DollarSign,
  BookOpen,
  Award,
  ChevronRight,
  ChevronDown,
  Download,
  Play,
  Package,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface SalesRevenueTrackProps {
  onBack: () => void;
}

export default function SalesRevenueTrack({ onBack }: SalesRevenueTrackProps) {
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [expandedTutorials, setExpandedTutorials] = useState<Set<string>>(new Set());
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());

  // Track data
  const trackInfo = {
    title: 'Sales & Revenue',
    description: 'Pricing, sales processes, and revenue optimization strategies',
    totalTutorials: 3,
    estimatedHours: '6-8 hours',
    difficulty: 'Intermediate',
    category: 'Growth',
    badge: '💰'
  };

  // Progress calculation
  const progressPercent = (completedTutorials.size / trackInfo.totalTutorials) * 100;

  // Sections with tutorials
  const sections = [
    {
      id: 1,
      title: 'Revenue Optimization',
      description: 'Master pricing, sales processes, and monetization strategies',
      icon: DollarSign,
      color: '#FFCF00',
      tutorials: [
        {
          id: 'pricing-packaging',
          title: 'Pricing & Packaging: Good–Better–Best in 60 Minutes',
          description: 'Pricing is leverage. A clear three-tier package raises average order value and reduces decision friction.',
          time: '60 minutes',
          difficulty: 'Intermediate',
          tags: ['pricing', 'packaging', 'revenue', 'conversion'],
          icon: Package,
          prerequisites: [
            'Defined offer and cost assumptions',
            'Basic understanding of customer segments'
          ],
          steps: [
            { title: 'Define the North Star outcome', desc: 'customers buy (not features).' },
            { title: 'List all deliverables', desc: 'group into 3 levels of transformation.' },
            { title: 'Set Good (entry)', desc: 'delivers core outcome, no extras.' },
            { title: 'Set Better (most popular)', desc: 'adds speed, support, or done-for-you elements.' },
            { title: 'Set Best (premium)', desc: 'adds priority, personalization, or guarantees.' },
            { title: 'Anchor price by value', desc: '(what problem costs monthly), not your time.' },
            { title: 'Pick price ratios', desc: '1 : 1.5 : 2.5 as a starting point.' },
            { title: 'Write one-line promise for each tier', desc: 'keep names obvious.' },
            { title: 'Add risk reversal', desc: '(action-based or milestone-based guarantee).' },
            { title: 'Add scarcity to premium', desc: '(limited seats, SLA limits).' },
            { title: 'Publish a comparison table', desc: 'with outcomes, not features.' },
            { title: 'Run 5 calls', desc: 'adjust mid tier to maximize take-rate.' }
          ],
          resources: [
            '3-Tier Pricing Table (fill-in)',
            'Value-to-Price Anchor worksheet',
            'Guarantee Patterns (quick reference)'
          ]
        },
        {
          id: 'sales-pipeline',
          title: 'Sales Pipeline & Power-Hour Cadence (B2B)',
          description: 'You can\'t manage what you don\'t track. Pipeline discipline creates predictable revenue.',
          time: '90 minutes',
          difficulty: 'Intermediate',
          tags: ['sales-pipeline', 'b2b', 'crm', 'prospecting'],
          icon: TrendingUp,
          prerequisites: [
            'A CRM (any) or a structured spreadsheet',
            'Offer and ICP list'
          ],
          steps: [
            { title: 'Define stages', desc: 'New → Qualified → Discovery → Proposal → Verbal → Won/Lost.' },
            { title: 'Add exit criteria for each stage', desc: '(what must be true to move forward).' },
            { title: 'Import/enter active leads', desc: 'fill missing data.' },
            { title: 'Block a daily Power Hour', desc: '20m prospecting, 20m follow-ups, 20m advancing deals.' },
            { title: 'Create tasks for every lead', desc: '(next step + due date). Zero taskless leads.' },
            { title: 'Use a one-line update style in notes', desc: '(date + action + result).' },
            { title: 'Weekly review: pipeline health', desc: '(coverage ≥ 3× quota).' },
            { title: 'Audit stalled deals (30+ days)', desc: 'send a clean "close or continue?" email.' },
            { title: 'Track win rate, sales cycle, ACV', desc: 'fix the leakiest stage.' },
            { title: 'Celebrate wins, autopsy losses', desc: 'update objection bank.' }
          ],
          resources: [
            'Pipeline Stage Criteria sheet',
            'Power-Hour Checklist',
            'Close/Continue email script'
          ]
        },
        {
          id: 'monetization-ladder',
          title: 'Monetization Ladder: Upsells, Bundles & Order Bumps',
          description: 'You already paid to get the customer. Increase LTV with structured add-ons that feel helpful, not pushy.',
          time: '90 minutes',
          difficulty: 'Intermediate',
          tags: ['upsells', 'monetization', 'ltv', 'order-bumps'],
          icon: Zap,
          prerequisites: [
            'Core product/service live',
            'Knowledge of common add-ons customers ask for'
          ],
          steps: [
            { title: 'Map a 3-step ladder', desc: 'Entry → Core → Premium/Continuity.' },
            { title: 'Define order bump at checkout', desc: '(under $30; low-friction).' },
            { title: 'Create post-purchase upsell', desc: '(one-click) that accelerates results.' },
            { title: 'Bundle complementary items', desc: 'into a "Starter Kit" at 10–20% discount.' },
            { title: 'Add a continuity offer', desc: '(membership, support, supplies) within 14 days.' },
            { title: 'Set rules: only one upsell screen', desc: 'no clutter; clear value.' },
            { title: 'Write benefit-first copy for each add-on', desc: 'avoid jargon.' },
            { title: 'A/B test price & placement', desc: 'keep winners, kill losers.' },
            { title: 'Review AOV & LTV monthly', desc: 'tune ladder accordingly.' },
            { title: 'Train support/sales to offer the next step', desc: 'on every success moment.' }
          ],
          resources: [
            'Monetization Ladder canvas',
            'Order Bump copy pack',
            'Bundle Builder worksheet'
          ]
        }
      ]
    }
  ];

  const toggleTutorial = (tutorialId: string) => {
    const newExpanded = new Set(expandedTutorials);
    if (newExpanded.has(tutorialId)) {
      newExpanded.delete(tutorialId);
    } else {
      newExpanded.add(tutorialId);
    }
    setExpandedTutorials(newExpanded);
  };

  const toggleComplete = (tutorialId: string) => {
    const newCompleted = new Set(completedTutorials);
    if (newCompleted.has(tutorialId)) {
      newCompleted.delete(tutorialId);
    } else {
      newCompleted.add(tutorialId);
    }
    setCompletedTutorials(newCompleted);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 bouncy-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to University
          </Button>

          {/* Track Overview Card */}
          <Card className="p-6 md:p-8 border-2 shadow-lg" style={{ borderColor: '#FFCF00' }}>
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: '#FFCF00' }}
              >
                {trackInfo.badge}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{trackInfo.title}</h1>
                <p className="text-gray-600 mb-4">{trackInfo.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge style={{ backgroundColor: '#6CFF6C', color: '#000' }}>
                    {trackInfo.category}
                  </Badge>
                  <Badge style={{ backgroundColor: '#FF4F4F', color: '#fff' }}>
                    {trackInfo.difficulty}
                  </Badge>
                  <Badge variant="outline" className="border-2" style={{ borderColor: '#FFCF00' }}>
                    <Clock className="w-3 h-3 mr-1" />
                    {trackInfo.estimatedHours}
                  </Badge>
                  <Badge variant="outline" className="border-2" style={{ borderColor: '#FFCF00' }}>
                    <BookOpen className="w-3 h-3 mr-1" />
                    {trackInfo.totalTutorials} tutorials
                  </Badge>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Your Progress</span>
                    <span style={{ color: '#FFCF00' }} className="font-bold">
                      {completedTutorials.size} / {trackInfo.totalTutorials} completed
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: '#FFCF00' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {progressPercent === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 rounded-xl text-center"
                style={{ backgroundColor: 'rgba(108, 255, 108, 0.1)', border: '2px solid #6CFF6C' }}
              >
                <Award className="w-12 h-12 mx-auto mb-2" style={{ color: '#6CFF6C' }} />
                <p className="font-bold text-lg">Track Complete! 🎉</p>
                <p className="text-sm text-gray-600">You've mastered Sales & Revenue</p>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;
            const sectionCompleted = section.tutorials.every(t => completedTutorials.has(t.id));
            const sectionProgress = (section.tutorials.filter(t => completedTutorials.has(t.id)).length / section.tutorials.length) * 100;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <Card className="overflow-hidden border-2" style={{ borderColor: section.color }}>
                  {/* Section Header */}
                  <button
                    onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    className="w-full p-6 text-left transition-colors hover:bg-gray-50 bouncy-button"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: section.color }}
                      >
                        <SectionIcon className="w-6 h-6 text-black" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-bold">{section.title}</h2>
                          {sectionCompleted && (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#6CFF6C' }} />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                        
                        {/* Mini progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${sectionProgress}%`,
                                backgroundColor: section.color
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: section.color }}>
                            {section.tutorials.filter(t => completedTutorials.has(t.id)).length}/{section.tutorials.length}
                          </span>
                        </div>
                      </div>

                      <ChevronRight 
                        className={`w-6 h-6 flex-shrink-0 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`}
                        style={{ color: section.color }}
                      />
                    </div>
                  </button>

                  {/* Tutorials */}
                  <AnimatePresence>
                    {activeSection === section.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 space-y-4">
                          {section.tutorials.map((tutorial, tutIdx) => {
                            const TutorialIcon = tutorial.icon;
                            const isCompleted = completedTutorials.has(tutorial.id);
                            const isExpanded = expandedTutorials.has(tutorial.id);

                            return (
                              <Card 
                                key={tutorial.id}
                                className="border-2 overflow-hidden"
                                style={{ borderColor: isCompleted ? '#6CFF6C' : '#E5E7EB' }}
                              >
                                {/* Tutorial Header */}
                                <div className="p-4">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div 
                                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ backgroundColor: isCompleted ? '#6CFF6C' : section.color }}
                                    >
                                      <TutorialIcon className="w-5 h-5" style={{ color: isCompleted ? '#fff' : '#000' }} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-bold mb-1">{tutorial.title}</h3>
                                      <p className="text-sm text-gray-600 mb-2">{tutorial.description}</p>
                                      
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        <Badge variant="outline" className="text-xs">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {tutorial.time}
                                        </Badge>
                                        <Badge 
                                          className="text-xs"
                                          style={{ backgroundColor: '#FF4F4F', color: '#fff' }}
                                        >
                                          {tutorial.difficulty}
                                        </Badge>
                                        {tutorial.tags.slice(0, 2).map(tag => (
                                          <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => toggleTutorial(tutorial.id)}
                                          className="bouncy-button text-black"
                                          style={{ backgroundColor: section.color }}
                                        >
                                          {isExpanded ? (
                                            <>
                                              <ChevronDown className="w-4 h-4 mr-1" />
                                              Hide Details
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-4 h-4 mr-1" />
                                              Start Tutorial
                                            </>
                                          )}
                                        </Button>
                                        
                                        <Button
                                          size="sm"
                                          variant={isCompleted ? "default" : "outline"}
                                          onClick={() => toggleComplete(tutorial.id)}
                                          className="bouncy-button"
                                          style={isCompleted ? { backgroundColor: '#6CFF6C', color: '#000' } : {}}
                                        >
                                          {isCompleted ? (
                                            <>
                                              <CheckCircle2 className="w-4 h-4 mr-1" />
                                              Completed
                                            </>
                                          ) : (
                                            <>
                                              <Circle className="w-4 h-4 mr-1" />
                                              Mark Complete
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expanded Content */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-4 pt-4 border-t space-y-4">
                                          {/* Prerequisites */}
                                          {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
                                            <div>
                                              <h4 className="font-semibold mb-2 text-sm">Prerequisites:</h4>
                                              <ul className="space-y-1">
                                                {tutorial.prerequisites.map((prereq, i) => (
                                                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span style={{ color: section.color }}>•</span>
                                                    {prereq}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Steps */}
                                          <div>
                                            <h4 className="font-semibold mb-2 text-sm">Steps:</h4>
                                            <div className="space-y-2">
                                              {tutorial.steps.map((step, i) => (
                                                <div 
                                                  key={i}
                                                  className="flex gap-3 p-3 rounded-lg"
                                                  style={{ backgroundColor: 'rgba(255, 207, 0, 0.05)' }}
                                                >
                                                  <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                                    style={{ backgroundColor: section.color, color: '#000' }}
                                                  >
                                                    {i + 1}
                                                  </div>
                                                  <div className="flex-1">
                                                    <p className="font-semibold text-sm">{step.title}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{step.desc}</p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Resources */}
                                          {tutorial.resources && tutorial.resources.length > 0 && (
                                            <div>
                                              <h4 className="font-semibold mb-2 text-sm">Resources:</h4>
                                              <div className="space-y-2">
                                                {tutorial.resources.map((resource, i) => (
                                                  <button
                                                    key={i}
                                                    className="w-full p-2 rounded-lg border-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50 transition-colors bouncy-button"
                                                    style={{ borderColor: section.color }}
                                                  >
                                                    <Download className="w-4 h-4" style={{ color: section.color }} />
                                                    {resource}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
