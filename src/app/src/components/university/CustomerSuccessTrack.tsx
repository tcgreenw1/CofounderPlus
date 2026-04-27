import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Heart,
  BookOpen,
  Award,
  ChevronRight,
  ChevronDown,
  Download,
  Play,
  Zap,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface CustomerSuccessTrackProps {
  onBack: () => void;
}

export default function CustomerSuccessTrack({ onBack }: CustomerSuccessTrackProps) {
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [expandedTutorials, setExpandedTutorials] = useState<Set<string>>(new Set());
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());

  // Track data
  const trackInfo = {
    title: 'Customer Success',
    description: 'Onboarding, retention, and long-term customer value',
    totalTutorials: 3,
    estimatedHours: '6-8 hours',
    difficulty: 'Intermediate',
    category: 'Growth',
    badge: '❤️'
  };

  // Progress calculation
  const progressPercent = (completedTutorials.size / trackInfo.totalTutorials) * 100;

  // Sections with tutorials
  const sections = [
    {
      id: 1,
      title: 'Customer Lifecycle',
      description: 'Build systems to onboard, retain, and grow customer relationships',
      icon: Heart,
      color: '#FF4F4F',
      tutorials: [
        {
          id: 'seven-day-onboarding',
          title: '7-Day Onboarding that Hits Time-to-Value',
          description: 'Customers churn when they don\'t feel progress in week one. Orchestrate wins fast.',
          time: '90 minutes',
          difficulty: 'Intermediate',
          tags: ['onboarding', 'retention', 'customer-success', 'activation'],
          icon: Zap,
          prerequisites: [
            'A clear first outcome your product/service can deliver',
            'Access to welcome email or kickoff call'
          ],
          steps: [
            { title: 'Define Activation Moment', desc: '(the first undeniable win).' },
            { title: 'Break it into 3 micro-wins', desc: 'users can hit within 72 hours.' },
            { title: 'Day 0: send Welcome', desc: 'with 3-step quick start + 10-minute task.' },
            { title: 'Day 1: Guided setup', desc: '(checklist + short video/audio later).' },
            { title: 'Day 2: Proof of progress email/SMS', desc: '("You completed X; next Y").' },
            { title: 'Day 3: Office hours/kickoff call slot', desc: 'offer calendar link.' },
            { title: 'Day 4: Usage nudge', desc: 'with a screenshot of what "good" looks like.' },
            { title: 'Day 5: Win share ask', desc: '(screenshot, quick quote) → fuels social proof.' },
            { title: 'Day 6: FAQ + unblocker email', desc: '(top 5 issues + fixes).' },
            { title: 'Day 7: Milestone recap', desc: '+ invite to next milestone (week 2 plan).' },
            { title: 'Instrument time-to-activation metric', desc: 'target ≤ 7 days.' },
            { title: 'Iterate weekly based on blockers', desc: 'and user feedback.' }
          ],
          resources: [
            '7-Day Email/SMS script pack',
            'Onboarding Checklist (customer-facing)',
            'Activation Metric tracker (sheet)'
          ]
        },
        {
          id: 'retention-engine',
          title: 'Retention Engine: 30/60/90-Day Lifecycle Plan',
          description: 'Revenue compounds when customers stay. Map touchpoints that prevent regret and expand value.',
          time: '2 hours',
          difficulty: 'Intermediate',
          tags: ['retention', 'lifecycle', 'customer-success', 'expansion'],
          icon: RefreshCw,
          prerequisites: [
            'Onboarding in place',
            'Ability to send emails/messages at checkpoints'
          ],
          steps: [
            { title: 'Define Success Milestones', desc: 'at 30/60/90 days.' },
            { title: '30-Day: Value recap', desc: '+ usage suggestions + small upsell.' },
            { title: '45-Day: NPS pulse (0–10)', desc: 'Tag detractors for outreach.' },
            { title: '60-Day: Case study invite', desc: 'or community spotlight.' },
            { title: '75-Day: Education bump', desc: '(advanced tutorial relevant to usage).' },
            { title: '90-Day: Plan review', desc: '+ tailored upgrade/expansion offer.' },
            { title: 'Add at-risk triggers', desc: '(usage drops, failed payments) → create save offers.' },
            { title: 'Build winback (if churned)', desc: '2 emails + 1 SMS with comeback bonus.' },
            { title: 'Review retention monthly', desc: 'fix the biggest milestone leak.' },
            { title: 'Document changes', desc: 'keep a living Retention Playbook.' }
          ],
          resources: [
            '30/60/90 Email pack',
            'NPS Script + Tagging Guide',
            'Winback Messaging (3 variants)'
          ]
        },
        {
          id: 'dual-track-growth',
          title: 'Dual-Track Growth: Referrals & Affiliates in One Week',
          description: 'Two channels, same assets. Customers refer; partners promote. Build both without complexity.',
          time: '2 hours',
          difficulty: 'Intermediate',
          tags: ['referrals', 'affiliates', 'growth', 'partnerships'],
          icon: UserPlus,
          prerequisites: [
            'Clear offer and margin room',
            'Ability to generate tracking links/codes (tool-agnostic)'
          ],
          steps: [
            { title: 'Decide reward', desc: 'customers = credit or cash; partners = rev share % or bounty.' },
            { title: 'Write a 2-line ask for customers', desc: 'at peak moments (onboarding day 7, success email).' },
            { title: 'Build referral landing', desc: 'explains reward, shows examples, gives link/code.' },
            { title: 'Draft Partner One-Pager', desc: 'audience match, proof, rates, next step.' },
            { title: 'Make UTM/link scheme', desc: 'and a simple payout cadence (monthly).' },
            { title: 'Seed 10 customers with the referral link', desc: 'and 10 partners with the one-pager.' },
            { title: 'Run a pilot promo with one partner', desc: 'within 7 days.' },
            { title: 'Track referred revenue %', desc: 'and partner EPC; keep best, prune the rest.' },
            { title: 'Rotate angles monthly', desc: 'webinar, bundle, bonus templates.' },
            { title: 'Publish a public Partners page', desc: 'to collect inbound promoters.' }
          ],
          resources: [
            'Referral Page copy',
            'Partner One-Pager',
            'Payout Tracker sheet'
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
          <Card className="p-6 md:p-8 border-2 shadow-lg" style={{ borderColor: '#FF4F4F' }}>
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: '#FF4F4F' }}
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
                  <Badge variant="outline" className="border-2" style={{ borderColor: '#FF4F4F' }}>
                    <Clock className="w-3 h-3 mr-1" />
                    {trackInfo.estimatedHours}
                  </Badge>
                  <Badge variant="outline" className="border-2" style={{ borderColor: '#FF4F4F' }}>
                    <BookOpen className="w-3 h-3 mr-1" />
                    {trackInfo.totalTutorials} tutorials
                  </Badge>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Your Progress</span>
                    <span style={{ color: '#FF4F4F' }} className="font-bold">
                      {completedTutorials.size} / {trackInfo.totalTutorials} completed
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: '#FF4F4F' }}
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
                <p className="text-sm text-gray-600">You've mastered Customer Success</p>
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
                        <SectionIcon className="w-6 h-6 text-white" />
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
                                      <TutorialIcon className="w-5 h-5 text-white" />
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
                                          className="bouncy-button text-white"
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
                                                  style={{ backgroundColor: 'rgba(255, 79, 79, 0.05)' }}
                                                >
                                                  <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                                    style={{ backgroundColor: section.color }}
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
