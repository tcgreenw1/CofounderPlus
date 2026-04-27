import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target,
  BookOpen,
  Award,
  ChevronRight,
  ChevronDown,
  Download,
  Play,
  Users,
  MessageSquare,
  FileText,
  ThumbsUp,
  Handshake,
  TrendingUp,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface MarketingFoundationTrackProps {
  onBack: () => void;
}

export default function MarketingFoundationTrack({ onBack }: MarketingFoundationTrackProps) {
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [expandedTutorials, setExpandedTutorials] = useState<Set<string>>(new Set());
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());

  // Track data
  const trackInfo = {
    title: 'Marketing Foundation',
    description: 'Core marketing skills for customer acquisition and conversion',
    totalTutorials: 7,
    estimatedHours: '8-10 hours',
    difficulty: 'Beginner',
    category: 'Growth',
    badge: '🎯'
  };

  // Progress calculation
  const progressPercent = (completedTutorials.size / trackInfo.totalTutorials) * 100;

  // Sections with tutorials
  const sections = [
    {
      id: 1,
      title: 'Foundation',
      description: 'Build the core elements of your marketing strategy',
      icon: Target,
      color: '#00E0FF',
      tutorials: [
        {
          id: 'irresistible-offer',
          title: 'Craft an Irresistible Offer (That Sells Without a Fight)',
          description: 'Features don\'t sell. Offers do. A clear promise, specific outcome, risk reversal, and bonuses turn a "maybe" into "take my money."',
          time: '90 minutes',
          difficulty: 'Beginner',
          tags: ['offers', 'sales', 'positioning', 'guarantees'],
          icon: Sparkles,
          prerequisites: [
            'Defined audience and problem',
            'A basic product/service you can deliver'
          ],
          steps: [
            { title: 'Write the Outcome Statement', desc: '"Go from X to Y in Z days/weeks without [hated thing]."' },
            { title: 'Define the Mechanism', desc: 'the unique way you deliver results (framework, tech, process).' },
            { title: 'List 3 Core Deliverables only', desc: 'Kill the rest. Clarity > buffet.' },
            { title: 'Add Speed Layer', desc: 'what result can they see in the first 7 days? Make it explicit.' },
            { title: 'Add Proof Layer', desc: 'mini-case, before/after, metric or reputable stat (borrowed credibility ok).' },
            { title: 'Set Pricing Anchor', desc: 'reference the real cost of the problem vs your price.' },
            { title: 'Add a Guarantee', desc: 'that reduces risk (action-based, time-based, or value-back credit).' },
            { title: 'Package 2 Bonuses', desc: 'that remove friction (templates, quickstart call, setup checklist).' },
            { title: 'Define Scarcity honestly', desc: 'seats/month, cohort start date, bonus expires.' },
            { title: 'Write a one-screen Offer Sheet', desc: 'headline, outcome, deliverables, timeline, price, guarantee, CTA.' },
            { title: 'Sanity test with 3 target buyers', desc: 'If two can repeat the offer back clearly, it\'s ready.' },
            { title: 'Publish and use', desc: 'the same phrasing across page, emails, and DMs.' }
          ],
          resources: [
            'Offer Sheet template',
            'Bonus Brainstorm list',
            'Guarantee Patterns (10 examples)'
          ]
        },
        {
          id: 'customer-interviews',
          title: 'Customer Interviews That Actually Change Your Product',
          description: 'Good interviews surface language you can steal, outcomes you can promise, and roadblocks you must remove. Bad interviews produce fluff.',
          time: '2 hours',
          difficulty: 'Beginner',
          tags: ['interviews', 'validation', 'customer-research', 'messaging'],
          icon: MessageSquare,
          prerequisites: [
            'Access to 10–15 prospects or recent customers'
          ],
          steps: [
            { title: 'Define Who', desc: 'one ICP segment only.' },
            { title: 'Send short invite', desc: '20 minutes, clear topic, optional $10 thank-you.' },
            { title: 'Use a 5-question script (no pitching)', desc: 'Tell me about the last time you tried to [solve X].' },
            { title: 'Record permission, then shut up', desc: 'aim for 80/20 listening.' },
            { title: 'Probe for numbers', desc: '(time wasted, money lost, frequency).' },
            { title: 'Capture exact phrases', desc: 'don\'t paraphrase. This is copy gold.' },
            { title: 'Tag themes', desc: 'triggers, desired outcomes, blockers, words/phrases.' },
            { title: 'Update your Offer Sheet', desc: 'swap in their language.' },
            { title: 'Create a Top 10 Objections list', desc: '+ rebuttals.' },
            { title: 'Pull 3 short quotes', desc: '(with consent) for social proof.' },
            { title: 'Decide one product change', desc: 'and one messaging change you\'ll ship this week.' }
          ],
          resources: [
            'Interview Invite script',
            '5-Question Interview guide',
            'Theme Tagging sheet'
          ]
        }
      ]
    },
    {
      id: 2,
      title: 'Conversion',
      description: 'Turn visitors into customers with proven conversion tactics',
      icon: TrendingUp,
      color: '#6CFF6C',
      tutorials: [
        {
          id: 'landing-page-copy',
          title: 'Landing Page Copy That Converts (One Page, One Job)',
          description: 'Your page is a sales conversation in text. The right structure makes strangers understand, believe, and act—fast.',
          time: '60-90 minutes',
          difficulty: 'Beginner',
          tags: ['copywriting', 'landing-pages', 'conversion', 'sales-copy'],
          icon: FileText,
          prerequisites: [
            'Offer Sheet from Tutorial #1',
            'At least one proof element'
          ],
          steps: [
            { title: 'Hero', desc: 'Outcome headline + subhead that names the audience and mechanism.' },
            { title: 'Credibility bar', desc: 'logos, quick metrics, or "as seen in" if available.' },
            { title: 'Problem → Stakes', desc: 'a short paragraph naming the pain and what it costs to ignore.' },
            { title: 'Mechanism', desc: '3 bullets explaining your unique way (no tech jargon).' },
            { title: 'Deliverables', desc: '3 items with outcomes, not features.' },
            { title: 'Fast win', desc: 'what they see in the first 7 days.' },
            { title: 'Proof', desc: '1–3 quotes or mini-cases with a specific result.' },
            { title: 'Offer recap', desc: 'price, timeline, what\'s included, bonuses.' },
            { title: 'Risk reversal', desc: 'your guarantee in one bold line.' },
            { title: 'FAQ', desc: 'answer the top 5 objections you heard in interviews.' },
            { title: 'CTA', desc: 'one action only (book call, buy, join waitlist). Repeat every screen-length.' },
            { title: 'Final nudge', desc: 'restate outcome + deadline or seat cap.' }
          ],
          resources: [
            'Landing Page Outline (fill-in-the-blanks)',
            '50 High-impact Headlines swipe file',
            'Objection→Answer map'
          ]
        },
        {
          id: 'social-proof-engine',
          title: 'The Social Proof Engine (20 Testimonials in 14 Days)',
          description: 'Proof shrinks the decision gap. You don\'t need years of history—you need a deliberate system to collect and display outcomes.',
          time: '60 minutes',
          difficulty: 'Beginner',
          tags: ['testimonials', 'social-proof', 'conversion', 'credibility'],
          icon: ThumbsUp,
          prerequisites: [
            'At least 5 users/customers (beta users count)',
            'One measurable outcome to ask about'
          ],
          steps: [
            { title: 'Define what proof looks like', desc: 'metric, before/after, or vivid story.' },
            { title: 'Create a 2-step ask', desc: 'quick form → optional 60-second video.' },
            { title: 'Trigger the ask at peak moments', desc: 'post-purchase + day 7 + day 30.' },
            { title: 'Write three prompts', desc: 'customers can answer fast.' },
            { title: 'Offer a small thank-you', desc: '(credit, upgrade, gift card).' },
            { title: 'Get permission', desc: 'for name/photo/logo; offer anonymized option.' },
            { title: 'Edit into tight blocks', desc: 'headline result line + 2 sentences.' },
            { title: 'Build a Proof Wall', desc: 'sorted by industry/role/outcome.' },
            { title: 'Sprinkle one proof block', desc: 'in every major objection spot on your page.' },
            { title: 'Refresh monthly', desc: 'remove weak, add stronger, keep recency.' }
          ],
          resources: [
            'Testimonial Request emails (3 variations)',
            'Proof Wall layout guide',
            'Release & Consent blurb'
          ]
        }
      ]
    },
    {
      id: 3,
      title: 'Growth Channels',
      description: 'Scale your reach through partnerships, content, and local presence',
      icon: Handshake,
      color: '#4B00FF',
      tutorials: [
        {
          id: 'partnership-pipeline',
          title: 'Partnership Pipeline (Co-Marketing & Affiliates in 7 Days)',
          description: 'Borrowed distribution beats shouting into the void. Partners already have your buyers—make it win-win to reach them fast.',
          time: '2 hours',
          difficulty: 'Intermediate',
          tags: ['partnerships', 'affiliates', 'distribution', 'co-marketing'],
          icon: Handshake,
          prerequisites: [
            'Clear audience and outcome',
            'Basic offer with pricing'
          ],
          steps: [
            { title: 'Define partner types', desc: 'creators, newsletters, tools, agencies, communities.' },
            { title: 'Build a Partner One-Pager', desc: 'audience fit, your outcome, proof, what they get.' },
            { title: 'Choose one irresistible angle', desc: 'free workshop, exclusive discount, or done-for-them setup.' },
            { title: 'Make a hit list of 50', desc: 'rank by audience overlap and responsiveness.' },
            { title: 'Draft 3 outreach scripts', desc: 'warm intro, cold short email, DM.' },
            { title: 'Offer simple terms', desc: '20–40% rev share for 60–90 days or fixed bounty per sale/lead.' },
            { title: 'Create a tracking sheet', desc: 'outreach date, status, terms, results.' },
            { title: 'Run the first partner promo', desc: 'within 7 days (live session, newsletter slot, or bundle).' },
            { title: 'After action, debrief', desc: 'conversions, cost, list growth, feedback.' },
            { title: 'Keep only the top 20% performers', desc: 'deepen with new angles.' }
          ],
          resources: [
            'Partner One-Pager template',
            'Outreach Scripts (email + DM)',
            'Promo Debrief sheet'
          ]
        },
        {
          id: 'content-flywheel',
          title: 'The 30-Day Content Flywheel (Creators & Founders)',
          description: 'Content compounds authority and lowers CAC. Consistency beats virality.',
          time: '60 minutes',
          difficulty: 'Beginner',
          tags: ['content', 'marketing', 'authority', 'lead-generation'],
          icon: BookOpen,
          prerequisites: [
            'Audience definition + offer',
            'Willingness to post daily for 30 days'
          ],
          steps: [
            { title: 'Pick one core promise', desc: 'and 3 sub-topics.' },
            { title: 'Draft 30 hooks', desc: '(10 pains, 10 myths, 10 quick wins).' },
            { title: 'Choose one format to start', desc: '(short video, carousel, or text).' },
            { title: 'Create Week 1 content in a batch', desc: '(7 posts in 60 minutes).' },
            { title: 'Post daily at the same time', desc: 'reply to every comment.' },
            { title: 'Day 7 & 14: call-to-action', desc: 'to your offer/waitlist.' },
            { title: 'Track views, saves, replies', desc: 'double down on top 20% hooks.' },
            { title: 'Repurpose winners', desc: 'across 2 other platforms.' },
            { title: 'Build a lead magnet from best posts', desc: 'and start list growth.' },
            { title: 'Systemize: weekly batching', desc: '+ monthly topic refresh.' }
          ],
          resources: [
            '30-Hook Sheet',
            'Post Outline templates (video/carousel/text)',
            'Content to Lead Magnet guide'
          ]
        },
        {
          id: 'local-service-leadgen',
          title: 'Local Service Lead-Gen Sprint (7 Days to Inbound)',
          description: 'For service businesses, local demand is won on trust and presence—not fancy funnels.',
          time: '2-3 hours',
          difficulty: 'Beginner',
          tags: ['local-seo', 'service-business', 'lead-generation', 'reviews'],
          icon: MapPin,
          prerequisites: [
            'Service area and offer with pricing',
            'Basic photos/logos'
          ],
          steps: [
            { title: 'Claim/complete Google Business Profile', desc: 'add 10 photos, hours, service list.' },
            { title: 'Collect 10 quick reviews', desc: 'from past clients/friends who\'ve seen your work.' },
            { title: 'Set up local landing page', desc: 'with service + neighborhood names.' },
            { title: 'Publish 3 before/after posts', desc: 'in GBP.' },
            { title: 'Enable call tracking', desc: 'and add a "Call now" CTA.' },
            { title: 'Join 2 neighborhood groups', desc: 'post one value tip + offer.' },
            { title: 'Run $10/day local ads', desc: '(radius targeting) to your landing page.' },
            { title: 'Create referral deal', desc: 'with 2 nearby businesses (mutual 10% lead credit).' },
            { title: 'Offer a new-customer special', desc: 'for this month only.' },
            { title: 'Log calls/leads daily', desc: 'refine messaging and photos.' }
          ],
          resources: [
            'Local Landing Copy',
            'Review Ask messages',
            'Neighborhood Post swipe'
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
          <Card className="p-4 md:p-6 lg:p-8 border-2 shadow-lg" style={{ borderColor: '#00E0FF' }}>
            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
              <div 
                className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl flex-shrink-0"
                style={{ backgroundColor: '#00E0FF' }}
              >
                {trackInfo.badge}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{trackInfo.title}</h1>
                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{trackInfo.description}</p>
                
                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                  <Badge className="text-xs" style={{ backgroundColor: '#6CFF6C', color: '#000' }}>
                    {trackInfo.category}
                  </Badge>
                  <Badge className="text-xs" style={{ backgroundColor: '#FFCF00', color: '#000' }}>
                    {trackInfo.difficulty}
                  </Badge>
                  <Badge variant="outline" className="border-2 text-xs" style={{ borderColor: '#00E0FF' }}>
                    <Clock className="w-3 h-3 mr-1" />
                    {trackInfo.estimatedHours}
                  </Badge>
                  <Badge variant="outline" className="border-2 text-xs" style={{ borderColor: '#00E0FF' }}>
                    <BookOpen className="w-3 h-3 mr-1" />
                    {trackInfo.totalTutorials} tutorials
                  </Badge>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="font-semibold">Your Progress</span>
                    <span style={{ color: '#00E0FF' }} className="font-bold">
                      {completedTutorials.size} / {trackInfo.totalTutorials} completed
                    </span>
                  </div>
                  <div className="h-2 md:h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: '#00E0FF' }}
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
                <p className="text-sm text-gray-600">You've mastered Marketing Foundation</p>
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
                    className="w-full p-4 md:p-6 text-left transition-colors hover:bg-gray-50 bouncy-button"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div 
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: section.color }}
                      >
                        <SectionIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                          <h2 className="text-lg md:text-xl font-bold">{section.title}</h2>
                          {sectionCompleted && (
                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: '#6CFF6C' }} />
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-gray-600 mb-2">{section.description}</p>
                        
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
                                          style={{ backgroundColor: '#FFCF00', color: '#000' }}
                                        >
                                          {tutorial.difficulty}
                                        </Badge>
                                        {tutorial.tags.slice(0, 2).map(tag => (
                                          <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                      
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => toggleTutorial(tutorial.id)}
                                          className="bouncy-button text-xs sm:text-sm whitespace-nowrap"
                                          style={{ backgroundColor: section.color }}
                                        >
                                          {isExpanded ? (
                                            <>
                                              <ChevronDown className="w-4 h-4 mr-1 flex-shrink-0" />
                                              <span className="truncate">Hide Details</span>
                                            </>
                                          ) : (
                                            <>
                                              <Play className="w-4 h-4 mr-1 flex-shrink-0" />
                                              <span className="truncate">Start Tutorial</span>
                                            </>
                                          )}
                                        </Button>
                                        
                                        <Button
                                          size="sm"
                                          variant={isCompleted ? "default" : "outline"}
                                          onClick={() => toggleComplete(tutorial.id)}
                                          className="bouncy-button text-xs sm:text-sm whitespace-nowrap"
                                          style={isCompleted ? { backgroundColor: '#6CFF6C', color: '#000' } : {}}
                                        >
                                          {isCompleted ? (
                                            <>
                                              <CheckCircle2 className="w-4 h-4 mr-1 flex-shrink-0" />
                                              <span className="truncate">Completed</span>
                                            </>
                                          ) : (
                                            <>
                                              <Circle className="w-4 h-4 mr-1 flex-shrink-0" />
                                              <span className="truncate">Mark Complete</span>
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
                                                  style={{ backgroundColor: 'rgba(0, 224, 255, 0.05)' }}
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