import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DollarSign,
  Users,
  Package,
  Megaphone,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  Lightbulb,
  TrendingUp,
  Clock,
  PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickStartGuide {
  tool: string;
  icon: React.ElementType;
  color: string;
  route: string;
  tagline: string;
  valueProposition: string;
  estimatedValue: string;
  timeToValue: string;
  starterQuestions: string[];
  proTips: string[];
  commonUseCases: {
    title: string;
    description: string;
  }[];
}

const QUICK_START_GUIDES: { [key: string]: QuickStartGuide } = {
  finance: {
    tool: 'Cofounder Finance',
    icon: DollarSign,
    color: 'var(--success)',
    route: '/operations?tab=finance',
    tagline: 'Your expert CPA in your pocket',
    valueProposition: 'Get professional accounting and tax guidance worth $1,830/month',
    estimatedValue: '$1,830/mo',
    timeToValue: '5 minutes',
    starterQuestions: [
      'What tax deductions am I eligible for as a small business?',
      'How should I categorize this business expense?',
      'What are the quarterly tax deadlines I need to know?',
      'How can I optimize my business structure for taxes?',
      'What financial records do I need to keep for the IRS?'
    ],
    proTips: [
      'Ask about tax planning before quarter-end to maximize deductions',
      'Upload receipts and ask for proper categorization',
      'Get guidance on estimated tax payments to avoid penalties',
      'Review your P&L monthly with the CPA tool for insights'
    ],
    commonUseCases: [
      {
        title: 'Tax Planning',
        description: 'Get quarterly tax estimates and optimization strategies'
      },
      {
        title: 'Expense Management',
        description: 'Learn which expenses are deductible and how to track them'
      },
      {
        title: 'Financial Reporting',
        description: 'Understand your P&L, balance sheet, and cash flow'
      }
    ]
  },
  hr: {
    tool: 'Cofounder HR',
    icon: Users,
    color: 'var(--primary)',
    route: '/operations?tab=hr',
    tagline: 'Build and manage your dream team',
    valueProposition: 'Get HR consulting worth $500/month for hiring, policies, and team management',
    estimatedValue: '$500/mo',
    timeToValue: '10 minutes',
    starterQuestions: [
      'What should I include in an employee handbook?',
      'How do I create a fair compensation structure?',
      'What are the legal requirements for hiring in my state?',
      'How do I handle employee performance reviews?',
      'What benefits should I offer to stay competitive?'
    ],
    proTips: [
      'Start with the handbook generator for comprehensive policies',
      'Ask about compliance requirements specific to your state',
      'Get interview question templates to find the right candidates',
      'Review compensation benchmarks before making offers'
    ],
    commonUseCases: [
      {
        title: 'Employee Onboarding',
        description: 'Create comprehensive onboarding processes and documentation'
      },
      {
        title: 'Policy Development',
        description: 'Build employee handbooks, PTO policies, and HR guidelines'
      },
      {
        title: 'Performance Management',
        description: 'Design review processes and career development frameworks'
      }
    ]
  },
  marketing: {
    tool: 'Cofounder Marketing',
    icon: Megaphone,
    color: '#ec4899',
    route: '/operations?tab=marketing',
    tagline: 'Amplify your brand and reach',
    valueProposition: 'Get marketing strategy guidance worth $500/month for campaigns and growth',
    estimatedValue: '$500/mo',
    timeToValue: '10 minutes',
    starterQuestions: [
      'What marketing channels should I focus on for my business?',
      'How do I create a content marketing strategy?',
      'What should my social media posting schedule look like?',
      'How can I improve my email marketing conversion rates?',
      'What are effective ways to generate leads on a budget?'
    ],
    proTips: [
      'Define your target audience clearly for better recommendations',
      'Ask for content calendar templates to stay organized',
      'Get A/B testing ideas for email and landing pages',
      'Request competitor analysis for your industry'
    ],
    commonUseCases: [
      {
        title: 'Content Strategy',
        description: 'Plan blog posts, social media, and email campaigns'
      },
      {
        title: 'Campaign Planning',
        description: 'Design multi-channel marketing campaigns that convert'
      },
      {
        title: 'Brand Development',
        description: 'Refine messaging, positioning, and brand identity'
      }
    ]
  },
  product: {
    tool: 'Cofounder Product',
    icon: Package,
    color: '#f59e0b',
    route: '/operations?tab=product',
    tagline: 'Build products customers love',
    valueProposition: 'Get product management expertise worth $500/month for strategy and roadmaps',
    estimatedValue: '$500/mo',
    timeToValue: '10 minutes',
    starterQuestions: [
      'How should I prioritize features on my product roadmap?',
      'What pricing strategy should I use for my product?',
      'How do I gather and analyze customer feedback?',
      'What metrics should I track to measure product success?',
      'How can I differentiate my product from competitors?'
    ],
    proTips: [
      'Share your product vision to get strategic alignment advice',
      'Ask about frameworks like RICE or MoSCoW for prioritization',
      'Get help designing user research surveys',
      'Request competitive analysis for positioning'
    ],
    commonUseCases: [
      {
        title: 'Roadmap Planning',
        description: 'Prioritize features and plan quarterly releases'
      },
      {
        title: 'Pricing Strategy',
        description: 'Design pricing tiers and packaging that maximize revenue'
      },
      {
        title: 'User Research',
        description: 'Conduct effective customer interviews and surveys'
      }
    ]
  },
  sales: {
    tool: 'Cofounder Sales',
    icon: BarChart3,
    color: '#8b5cf6',
    route: '/operations?tab=sales',
    tagline: 'Close more deals, grow revenue',
    valueProposition: 'Get sales consulting worth $500/month for pipeline and customer management',
    estimatedValue: '$500/mo',
    timeToValue: '10 minutes',
    starterQuestions: [
      'How do I build an effective sales funnel?',
      'What objections should I prepare for and how do I handle them?',
      'How can I shorten my sales cycle?',
      'What metrics should I track to optimize sales performance?',
      'How do I create a sales process that scales?'
    ],
    proTips: [
      'Ask for sales script templates for different stages',
      'Get objection handling strategies for your industry',
      'Request funnel optimization based on your conversion rates',
      'Learn how to qualify leads effectively'
    ],
    commonUseCases: [
      {
        title: 'Pipeline Management',
        description: 'Build and optimize your sales funnel for conversions'
      },
      {
        title: 'Sales Enablement',
        description: 'Create scripts, templates, and sales materials'
      },
      {
        title: 'Closing Strategies',
        description: 'Learn negotiation tactics and deal-closing techniques'
      }
    ]
  }
};

interface CofounderQuickStartProps {
  isOpen: boolean;
  onClose: () => void;
  toolId: string;
}

export function CofounderQuickStart({ isOpen, onClose, toolId }: CofounderQuickStartProps) {
  const navigate = useNavigate();
  const guide = QUICK_START_GUIDES[toolId];

  if (!guide) return null;

  const Icon = guide.icon;

  const handleGetStarted = () => {
    onClose();
    navigate(guide.route);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        style={{ 
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 'var(--spacing-6)',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${guide.color}`
        }}
      >
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-2)' }}>
            <div 
              style={{ 
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: `${guide.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon className="w-6 h-6" style={{ color: guide.color }} />
            </div>
            <div style={{ flex: 1 }}>
              <DialogTitle>{guide.tool}</DialogTitle>
              <p style={{ fontSize: '0.875rem', color: guide.color, marginTop: 'var(--spacing-1)' }}>
                {guide.tagline}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Value Prop */}
        <div 
          style={{ 
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            background: `linear-gradient(135deg, ${guide.color}15 0%, ${guide.color}05 100%)`,
            border: `1px solid ${guide.color}40`,
            marginBottom: 'var(--spacing-4)'
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-start', marginBottom: 'var(--spacing-3)' }}>
            <Sparkles className="w-5 h-5" style={{ color: guide.color, flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
              {guide.valueProposition}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <Badge 
              style={{ 
                padding: 'var(--spacing-2) var(--spacing-3)',
                backgroundColor: `${guide.color}30`,
                color: guide.color,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-1)'
              }}
            >
              <TrendingUp className="w-3 h-3" />
              {guide.estimatedValue} value
            </Badge>
            <Badge 
              variant="outline"
              style={{ 
                padding: 'var(--spacing-2) var(--spacing-3)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                border: `1px solid ${guide.color}40`,
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-1)'
              }}
            >
              <Clock className="w-3 h-3" />
              {guide.timeToValue} to value
            </Badge>
          </div>
        </div>

        {/* Starter Questions */}
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <Target className="w-4 h-4" style={{ color: guide.color }} />
            <h4 style={{ color: 'var(--foreground)' }}>Try These First</h4>
          </div>
          <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
            {guide.starterQuestions.map((question, index) => (
              <div 
                key={index}
                style={{ 
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  gap: 'var(--spacing-2)',
                  alignItems: 'flex-start'
                }}
              >
                <PlayCircle className="w-4 h-4" style={{ color: guide.color, flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  {question}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <Lightbulb className="w-4 h-4" style={{ color: guide.color }} />
            <h4 style={{ color: 'var(--foreground)' }}>Pro Tips</h4>
          </div>
          <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
            {guide.proTips.map((tip, index) => (
              <div key={index} style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'flex-start' }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: guide.color, flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Common Use Cases */}
        <div style={{ marginBottom: 'var(--spacing-5)' }}>
          <h4 style={{ color: 'var(--foreground)', marginBottom: 'var(--spacing-3)' }}>Common Use Cases</h4>
          <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
            {guide.commonUseCases.map((useCase, index) => (
              <div 
                key={index}
                style={{ 
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid var(--border)'
                }}
              >
                <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                  <strong>{useCase.title}:</strong> {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleGetStarted}
          style={{
            width: '100%',
            backgroundColor: guide.color,
            color: 'white',
            border: 'none',
            padding: 'var(--spacing-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-2)'
          }}
        >
          Get Started with {guide.tool}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
