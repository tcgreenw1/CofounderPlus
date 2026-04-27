import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Building2,
  FileText,
  Shield,
  Users,
  DollarSign,
  MapPin,
  Briefcase,
  BookOpen,
  Award,
  ChevronRight,
  Star,
  ArrowLeft,
  X,
  Lightbulb,
  AlertCircle,
  Zap,
  Link as LinkIcon,
  Calculator,
  Scale,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { universityApi } from '../../utils/universityApi';
import TutorialCompletionCelebration from './TutorialCompletionCelebration';
import TutorialTransitionAnimation from './TutorialTransitionAnimation';
import { useStreak } from '../StreakContext';

interface LessonStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  tutorial?: TutorialContent;
}

interface ReferenceLink {
  title: string;
  url: string;
  description?: string;
}

interface TutorialContent {
  title: string;
  duration: string;
  sections: {
    type: 'text' | 'tips' | 'warning' | 'steps' | 'resources';
    content: string | string[];
    title?: string;
  }[];
  references?: ReferenceLink[];
}

interface Section {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'intro' | 'steps' | 'resources' | 'quiz';
  content?: any;
}

export default function RegisteringBusinessTrack({ onBack }: { onBack: () => void }) {
  const { recordActivity } = useStreak();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<TutorialContent | null>(null);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [showFullPageTutorial, setShowFullPageTutorial] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ title: '', xp: 0 });
  const [transitionData, setTransitionData] = useState({ title: '', xp: 0 });
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [trackProgress, setTrackProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [isCompletingTutorial, setIsCompletingTutorial] = useState(false);

  // Business structure comparison data
  const businessStructures = [
    {
      name: 'LLC',
      icon: <Shield className="w-6 h-6" />,
      color: '#00E0FF',
      pros: ['Protects personal assets', 'Flexible taxation', 'Simple structure'],
      cons: ['Setup costs', 'Annual fees vary by state'],
      bestFor: 'Small startups & solo founders',
      recommended: true
    },
    {
      name: 'S-Corp',
      icon: <Building2 className="w-6 h-6" />,
      color: '#6CFF6C',
      pros: ['Pass-through taxation', 'Tax savings on profits', 'Professional credibility'],
      cons: ['Stricter regulations', 'More paperwork', 'State-specific'],
      bestFor: 'High-profit early-stage startups'
    },
    {
      name: 'C-Corp',
      icon: <Star className="w-6 h-6" />,
      color: '#4B00FF',
      pros: ['Unlimited growth potential', 'Required for VC funding', 'Stock options'],
      cons: ['Double taxation', 'Complex compliance', 'Higher costs'],
      bestFor: 'Venture-backed scale-ups'
    },
    {
      name: 'Sole Proprietorship',
      icon: <Users className="w-6 h-6" />,
      color: '#FF4F4F',
      pros: ['Easiest to start', 'Full control', 'Minimal costs'],
      cons: ['Full personal liability', 'Hard to raise capital', 'Not startup-friendly'],
      bestFor: 'Freelancers & side hustles'
    },
    {
      name: 'Partnership',
      icon: <Users className="w-6 h-6" />,
      color: '#FFCF00',
      pros: ['Shared responsibility', 'Combined resources', 'Simple setup'],
      cons: ['Shared liability', 'Potential conflicts', 'Joint obligations'],
      bestFor: 'Multi-founder businesses'
    }
  ];

  // Detailed tutorial content for each step
  const tutorialData: { [key: string]: TutorialContent } = {
    'step-1': {
      title: 'Choosing the Right State for Your LLC',
      duration: '3 min read',
      sections: [
        {
          type: 'text',
          content: 'Where you incorporate matters! While you can register in any state, most founders choose between their home state and Delaware.'
        },
        {
          type: 'tips',
          title: 'Home State Benefits',
          content: [
            'Lower annual fees and simpler compliance',
            'No need to register as a "foreign entity" in your operating state',
            'Easier to work with local accountants and lawyers',
            'Best choice for 90% of startups'
          ]
        },
        {
          type: 'tips',
          title: 'Delaware Benefits',
          content: [
            'Business-friendly court system (Chancery Court)',
            'Preferred by VCs for investor protection',
            'Strong legal precedents for corporate law',
            'Consider if raising $1M+ in venture capital'
          ]
        },
        {
          type: 'warning',
          content: 'If you incorporate in Delaware but operate in California, you\'ll need to register in both states and pay fees to both. This doubles your compliance work!'
        },
        {
          type: 'text',
          title: '💡 Pro Tip',
          content: 'Start in your home state as an LLC. When you raise serious VC money, your lawyers will help you convert to a Delaware C-Corp. Don\'t overcomplicate it early on!'
        }
      ],
      references: [
        {
          title: 'Delaware Division of Corporations',
          url: 'https://corp.delaware.gov/',
          description: 'Official Delaware business registration portal'
        },
        {
          title: 'SBA State Business Licenses Guide',
          url: 'https://www.sba.gov/business-guide/launch-your-business/register-your-business',
          description: 'Federal guide to state-by-state registration'
        },
        {
          title: 'NASS Directory - Find Your State',
          url: 'https://www.nass.org/business-services/corporations',
          description: 'National Association of Secretaries of State directory'
        }
      ]
    },
    'step-2': {
      title: 'Picking the Perfect Business Name',
      duration: '4 min read',
      sections: [
        {
          type: 'text',
          content: 'Your business name is your first brand decision! It needs to be unique, memorable, and available for registration.'
        },
        {
          type: 'steps',
          title: 'Name Selection Process',
          content: [
            'Brainstorm 5-10 name ideas that reflect your brand',
            'Check availability on your state\'s business registry website',
            'Verify the .com domain is available (GoDaddy, Namecheap)',
            'Search USPTO.gov to ensure no trademark conflicts',
            'Check social media handles (@yourcompany on Instagram, Twitter)'
          ]
        },
        {
          type: 'tips',
          title: 'Naming Best Practices',
          content: [
            'Keep it short and memorable (2-3 syllables ideal)',
            'Avoid numbers and hyphens if possible',
            'Make sure it\'s easy to spell when spoken',
            'Consider future expansion (don\'t be too niche)',
            'Add "LLC" at the end for your legal name'
          ]
        },
        {
          type: 'warning',
          content: 'Reserved words like "Bank", "Insurance", and "University" may require special licensing. Stick to general business terms!'
        }
      ],
      references: [
        {
          title: 'USPTO Trademark Search',
          url: 'https://www.uspto.gov/trademarks/search',
          description: 'Check if your name is already trademarked'
        },
        {
          title: 'Namecheap Domain Search',
          url: 'https://www.namecheap.com/',
          description: 'Check domain availability and purchase'
        },
        {
          title: 'SBA Business Name Guide',
          url: 'https://www.sba.gov/business-guide/launch-your-business/choose-business-name',
          description: 'Official guidance on choosing business names'
        }
      ]
    },
    'step-3': {
      title: 'Understanding Registered Agents',
      duration: '3 min read',
      sections: [
        {
          type: 'text',
          content: 'A Registered Agent is your LLC\'s official point of contact for legal documents, tax forms, and government notices. Every LLC must have one!'
        },
        {
          type: 'text',
          title: 'Who Can Be Your Registered Agent?',
          content: 'Any person or business entity that: (1) Has a physical street address in your state, (2) Is available during business hours (9-5), and (3) Is over 18 years old.'
        },
        {
          type: 'tips',
          title: 'Option 1: Be Your Own Agent (Free)',
          content: [
            '✅ Costs nothing',
            '✅ Simple if you have a physical office',
            '❌ Your address becomes public record',
            '❌ Must be available 9-5 at that address',
            '❌ Not ideal if working from home'
          ]
        },
        {
          type: 'tips',
          title: 'Option 2: Professional Service ($100-300/yr)',
          content: [
            '✅ Keeps your home address private',
            '✅ Digital document delivery & alerts',
            '✅ No need to be available during business hours',
            '✅ Multi-state coverage if you expand',
            'Popular: Northwest ($125/yr), Incfile ($119/yr)'
          ]
        },
        {
          type: 'warning',
          content: 'Never miss important documents! If you miss a lawsuit notice because your agent wasn\'t available, you could lose by default. Take this role seriously!'
        }
      ],
      references: [
        {
          title: 'Northwest Registered Agent Service',
          url: 'https://www.northwestregisteredagent.com/',
          description: 'Professional registered agent service ($125/year)'
        },
        {
          title: 'SBA Registered Agent Requirements',
          url: 'https://www.sba.gov/business-guide/launch-your-business/register-your-business#section-header-4',
          description: 'Official guidance on registered agent requirements'
        }
      ]
    },
    'step-4': {
      title: 'Filing Your Articles of Organization',
      duration: '5 min read',
      sections: [
        {
          type: 'text',
          content: 'The Articles of Organization (or Certificate of Formation) is the official document that creates your LLC. Once filed and approved, your business legally exists!'
        },
        {
          type: 'steps',
          title: 'How to File',
          content: [
            'Visit your state\'s Secretary of State website',
            'Find the LLC formation section (usually under "Business Services")',
            'Fill out the online form or download the PDF',
            'Provide: LLC name, registered agent info, business address, and member names',
            'Pay the filing fee ($50-$500 depending on state)',
            'Submit and wait 1-2 weeks for approval (or pay for expedited processing)'
          ]
        },
        {
          type: 'tips',
          title: 'What You\'ll Need',
          content: [
            'Your LLC\'s legal name (must include "LLC")',
            'Registered agent\'s name and physical address',
            'Principal business address',
            'Member or manager information',
            'Payment method (credit card or check)'
          ]
        },
        {
          type: 'text',
          title: '💰 State Filing Fees (2024)',
          content: 'California: $70 • Delaware: $90 • Florida: $125 • New York: $200 • Texas: $300 • Wyoming: $100. Most states are $100-150.'
        },
        {
          type: 'tips',
          title: 'Pro Tips',
          content: [
            'Keep a copy of your filed Articles — you\'ll need it for bank accounts',
            'Expedited processing costs extra but gets approval in 1-3 days',
            'Some states issue a Certificate of Formation as proof',
            'Set a reminder for annual report deadlines (vary by state)'
          ]
        }
      ],
      references: [
        {
          title: 'NASS State Business Portal Directory',
          url: 'https://www.nass.org/business-services/corporations',
          description: 'Find your state\'s Secretary of State office'
        },
        {
          title: 'SBA LLC Formation Guide',
          url: 'https://www.sba.gov/business-guide/launch-your-business/choose-business-structure#section-header-2',
          description: 'Complete guide to forming an LLC'
        }
      ]
    },
    'step-5': {
      title: 'Getting Your EIN (Employer Identification Number)',
      duration: '3 min read',
      sections: [
        {
          type: 'text',
          content: 'An EIN is like a Social Security Number for your business. You need it to open a bank account, hire employees, and file taxes. Good news: it\'s completely free and takes 10 minutes!'
        },
        {
          type: 'steps',
          title: 'How to Get Your EIN',
          content: [
            'Go to IRS.gov and search "Apply for EIN online"',
            'Click "Apply Online Now"',
            'Select "Limited Liability Company" as entity type',
            'Answer questions about your business structure',
            'Provide your personal info (SSN required for principal owner)',
            'Submit and receive your EIN instantly!',
            'Download and save your EIN confirmation letter'
          ]
        },
        {
          type: 'warning',
          content: 'The IRS online system is only available Mon-Fri, 7am-10pm ET. If it\'s offline, you can also apply by fax (4-5 days) or mail (4-6 weeks).'
        },
        {
          type: 'tips',
          title: 'When You Need an EIN',
          content: [
            'Opening a business bank account (required)',
            'Hiring employees or contractors',
            'Filing business tax returns',
            'Applying for business licenses',
            'Building business credit'
          ]
        },
        {
          type: 'text',
          title: '🎯 Common Mistake',
          content: 'Don\'t use your personal SSN for business purposes! Always use your EIN to keep business and personal finances separate and protect your identity.'
        }
      ],
      references: [
        {
          title: 'IRS EIN Online Application',
          url: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
          description: 'Official IRS portal - FREE and instant approval'
        },
        {
          title: 'IRS EIN Assistant (Help Tool)',
          url: 'https://www.irs.gov/businesses/small-businesses-self-employed/do-you-need-an-ein',
          description: 'Check if you need an EIN for your business type'
        },
        {
          title: 'IRS Publication 1635',
          url: 'https://www.irs.gov/pub/irs-pdf/p1635.pdf',
          description: 'Understanding Your EIN - Official IRS guide (PDF)'
        }
      ]
    },
    'step-6': {
      title: 'Opening a Business Bank Account',
      duration: '4 min read',
      sections: [
        {
          type: 'text',
          content: 'A dedicated business bank account is crucial for protecting your limited liability status, tracking expenses, and looking professional to clients and investors.'
        },
        {
          type: 'warning',
          content: '⚠️ Critical: Never mix personal and business funds! Doing so can "pierce the corporate veil" and make you personally liable for business debts.'
        },
        {
          type: 'steps',
          title: 'Opening Your Account',
          content: [
            'Choose a bank (traditional like Chase/BoA or online like Mercury/Novo)',
            'Gather required documents (see below)',
            'Schedule an appointment or apply online',
            'Deposit your initial capital ($100-1000 minimum)',
            'Order business debit card and checks',
            'Set up online banking and accounting integrations'
          ]
        },
        {
          type: 'tips',
          title: 'Documents You\'ll Need',
          content: [
            '✅ EIN confirmation letter from IRS',
            '✅ Articles of Organization (certified copy)',
            '✅ Operating Agreement',
            '✅ Government-issued ID (driver\'s license)',
            '✅ Business license (if applicable to your state)'
          ]
        },
        {
          type: 'tips',
          title: 'Startup-Friendly Banks',
          content: [
            '🏦 Mercury: No fees, built for startups, virtual cards',
            '🏦 Novo: Free checking, integrates with accounting tools',
            '🏦 Chase Business: Physical branches, $0 if you keep $1,500',
            '🏦 Bank of America: Widely available, $16/mo or $3K minimum'
          ]
        },
        {
          type: 'text',
          title: '💡 Bonus Tips',
          content: 'Get a business credit card early to build credit history! Recommended: Chase Ink, Amex Blue Business. Use it for all business expenses and pay it off monthly.'
        }
      ],
      references: [
        {
          title: 'Mercury Banking for Startups',
          url: 'https://mercury.com/',
          description: 'Free online business banking (no fees, no minimums)'
        },
        {
          title: 'FDIC Bank Search Tool',
          url: 'https://banks.data.fdic.gov/bankfind-suite/bankfind',
          description: 'Find FDIC-insured banks in your area'
        },
        {
          title: 'SBA Business Banking Guide',
          url: 'https://www.sba.gov/business-guide/manage-your-business/manage-business-finances',
          description: 'Guide to choosing and opening business accounts'
        }
      ]
    },
    'step-7': {
      title: 'Creating an Operating Agreement',
      duration: '4 min read',
      sections: [
        {
          type: 'text',
          content: 'An Operating Agreement is your LLC\'s "rulebook" — it defines ownership percentages, member roles, profit distribution, and what happens if someone leaves or the business dissolves.'
        },
        {
          type: 'warning',
          content: 'Even if you\'re a single-member LLC, create an Operating Agreement! It strengthens your liability protection and is often required by banks.'
        },
        {
          type: 'tips',
          title: 'What to Include',
          content: [
            'Member names and ownership percentages',
            'Capital contributions (who invested what)',
            'Profit and loss distribution rules',
            'Voting rights and decision-making process',
            'Management structure (member-managed vs. manager-managed)',
            'Rules for adding/removing members',
            'Buyout and dissolution procedures'
          ]
        },
        {
          type: 'steps',
          title: 'Creating Your Agreement',
          content: [
            'Use a template from your state\'s SOS website or LegalZoom',
            'Customize it to your specific situation',
            'Define ownership splits clearly (50/50, 60/40, etc.)',
            'Specify who can sign contracts and make decisions',
            'Add vesting schedules if you have co-founders',
            'Have all members sign and date it',
            'Store safely — you\'ll need it for banking and taxes'
          ]
        },
        {
          type: 'tips',
          title: 'For Multi-Member LLCs (Critical!)',
          content: [
            '🎯 Vesting schedule: Members earn equity over 3-4 years',
            '🎯 Buyback clause: What happens if someone leaves',
            '🎯 Deadlock resolution: How to handle 50/50 disagreements',
            '🎯 Transfer restrictions: Can\'t sell ownership without approval',
            '🎯 Capital calls: How to handle future investment needs'
          ]
        },
        {
          type: 'text',
          title: '⚖️ Legal or DIY?',
          content: 'For simple single-member LLCs, templates work fine ($50-100 from LegalZoom). For complex multi-member structures or if raising capital, invest in a lawyer ($500-1500) to avoid costly mistakes later!'
        }
      ],
      references: [
        {
          title: 'Rocket Lawyer Operating Agreement Templates',
          url: 'https://www.rocketlawyer.com/business-and-contracts/business-operations/operating-agreements',
          description: 'Free and paid LLC operating agreement templates'
        },
        {
          title: 'Nolo Legal Encyclopedia - Operating Agreements',
          url: 'https://www.nolo.com/legal-encyclopedia/llc-operating-agreements',
          description: 'Comprehensive guide to operating agreements'
        },
        {
          title: 'SBA Operating Agreement Guide',
          url: 'https://www.sba.gov/business-guide/launch-your-business/choose-business-structure',
          description: 'Why you need an operating agreement and what to include'
        }
      ]
    }
  };

  // LLC Registration Steps with tutorial references
  const llcSteps: LessonStep[] = [
    {
      id: 'step-1',
      title: 'Choose your state',
      description: 'Decide where to register (often your home state or Delaware for scaling)',
      completed: completedSteps.has('step-1'),
      tutorial: tutorialData['step-1']
    },
    {
      id: 'step-2',
      title: 'Pick business name',
      description: 'Check name availability via your state\'s business registry',
      completed: completedSteps.has('step-2'),
      tutorial: tutorialData['step-2']
    },
    {
      id: 'step-3',
      title: 'Designate Registered Agent',
      description: 'Appoint someone to receive legal documents on behalf of your LLC',
      completed: completedSteps.has('step-3'),
      tutorial: tutorialData['step-3']
    },
    {
      id: 'step-4',
      title: 'File Articles of Organization',
      description: 'Submit formation documents to your state (usually $50-$500)',
      completed: completedSteps.has('step-4'),
      tutorial: tutorialData['step-4']
    },
    {
      id: 'step-5',
      title: 'Get your EIN',
      description: 'Apply for free Employer Identification Number via IRS.gov',
      completed: completedSteps.has('step-5'),
      tutorial: tutorialData['step-5']
    },
    {
      id: 'step-6',
      title: 'Open business bank account',
      description: 'Separate business and personal finances for liability protection',
      completed: completedSteps.has('step-6'),
      tutorial: tutorialData['step-6']
    },
    {
      id: 'step-7',
      title: 'Create Operating Agreement',
      description: 'Define ownership structure, roles, and decision-making process',
      completed: completedSteps.has('step-7'),
      tutorial: tutorialData['step-7']
    }
  ];

  // Additional Resources & Tutorials
  const additionalTutorials: { [key: string]: TutorialContent } = {
    'business-licenses': {
      title: 'Getting Business Licenses & Permits',
      duration: '5 min read',
      sections: [
        {
          type: 'text',
          content: 'Beyond your LLC registration, you may need licenses and permits to operate legally. Requirements vary by location and industry!'
        },
        {
          type: 'steps',
          title: 'License Checklist',
          content: [
            'General business license from your city/county',
            'Professional licenses (if you\'re in law, medicine, real estate, etc.)',
            'Sales tax permit (if selling physical products)',
            'Health department permits (for food, beauty, childcare)',
            'Zoning permits (if operating from home)',
            'Sign permits (if you have outdoor signage)'
          ]
        },
        {
          type: 'tips',
          title: 'How to Find Requirements',
          content: [
            '🔍 Visit SBA.gov license wizard',
            '🏛️ Check your city\'s business portal',
            '📞 Call your county clerk\'s office',
            '💼 Ask your industry association',
            '🤝 Talk to other business owners in your area'
          ]
        },
        {
          type: 'warning',
          content: 'Operating without required licenses can result in fines, shutdowns, and inability to deduct business expenses. Do your research early!'
        },
        {
          type: 'text',
          title: '💰 Typical Costs',
          content: 'General business license: $50-500/year. Professional licenses: $200-1000. Sales tax permit: Usually free. Budget $500-1500 total for most businesses.'
        }
      ],
      references: [
        {
          title: 'SBA License & Permit Tool',
          url: 'https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits',
          description: 'Find federal, state, and local business license requirements'
        },
        {
          title: 'USA.gov Business Licenses Search',
          url: 'https://www.usa.gov/business-licenses',
          description: 'Official government portal for license information'
        },
        {
          title: 'State & Local Government Directory',
          url: 'https://www.usa.gov/state-government',
          description: 'Find your state and local government offices'
        }
      ]
    },
    'understanding-taxes': {
      title: 'Understanding Business Taxes',
      duration: '6 min read',
      sections: [
        {
          type: 'text',
          content: 'LLCs have flexible tax treatment! By default, you\'re a "pass-through" entity, meaning profits flow to your personal tax return. But you have options...'
        },
        {
          type: 'tips',
          title: 'Default: Disregarded Entity (Single-Member)',
          content: [
            'Report business income on Schedule C of your 1040',
            'Pay self-employment tax (15.3%) on profits',
            'Make quarterly estimated tax payments',
            'Deduct business expenses to reduce taxable income',
            'Simplest option for most solo founders'
          ]
        },
        {
          type: 'tips',
          title: 'Default: Partnership (Multi-Member)',
          content: [
            'File Form 1065 partnership return',
            'Each member gets K-1 showing their share',
            'Members report income on personal returns',
            'Still pay self-employment tax',
            'Need good bookkeeping to track ownership %'
          ]
        },
        {
          type: 'tips',
          title: 'Election: S-Corp Tax Treatment',
          content: [
            'File Form 2553 with IRS to elect S-Corp status',
            'Pay yourself a "reasonable salary" (subject to payroll tax)',
            'Take remaining profits as distributions (no self-employment tax!)',
            'Can save $5-15K/year if you\'re profitable',
            'Requires payroll setup and quarterly filings',
            'Worth it when profit exceeds $60-80K/year'
          ]
        },
        {
          type: 'warning',
          content: 'S-Corp election has a deadline! File Form 2553 within 75 days of formation or by March 15 for current-year election. Miss it and you wait until next year!'
        },
        {
          type: 'steps',
          title: 'Tax To-Do List',
          content: [
            'Get accounting software (QuickBooks, Wave, Xero)',
            'Track ALL business expenses (everything is deductible!)',
            'Set aside 25-30% of profit for taxes',
            'Make quarterly estimated payments (April, June, Sept, Jan)',
            'Consider hiring a CPA ($500-2000/year)',
            'File annual return by March 15 (or Oct 15 with extension)'
          ]
        },
        {
          type: 'text',
          title: '🎯 Common Deductions',
          content: 'Home office, phone/internet, software subscriptions, equipment, advertising, travel, meals (50%), education, professional services. Track everything!'
        }
      ],
      references: [
        {
          title: 'IRS Small Business Tax Center',
          url: 'https://www.irs.gov/businesses/small-businesses-self-employed',
          description: 'Official IRS guidance for small business taxes'
        },
        {
          title: 'IRS Form 2553 (S-Corp Election)',
          url: 'https://www.irs.gov/forms-pubs/about-form-2553',
          description: 'Elect S-Corporation tax treatment for your LLC'
        },
        {
          title: 'IRS Publication 535 - Business Expenses',
          url: 'https://www.irs.gov/publications/p535',
          description: 'Complete guide to deductible business expenses'
        }
      ]
    },
    'trademark-basics': {
      title: 'Protecting Your Brand: Trademark Basics',
      duration: '4 min read',
      sections: [
        {
          type: 'text',
          content: 'Your business name is valuable! While registering your LLC gives you some protection, a federal trademark provides nationwide exclusive rights to your brand.'
        },
        {
          type: 'tips',
          title: 'What is a Trademark?',
          content: [
            'Legal protection for your business name, logo, and slogan',
            'Prevents competitors from using confusingly similar names',
            'Nationwide protection (vs. state-level LLC name)',
            'Use ® symbol once registered',
            'Lasts 10 years, renewable forever',
            'Costs $250-750 to file with USPTO'
          ]
        },
        {
          type: 'steps',
          title: 'Trademark Process',
          content: [
            'Search USPTO database at uspto.gov/trademarks',
            'Make sure your name isn\'t already taken in your industry',
            'File application online (TEAS Standard: $350)',
            'Wait 3-4 months for examination',
            'Respond to any office actions (objections)',
            'Wait for publication period (30 days)',
            'Receive registration certificate (12-18 months total)'
          ]
        },
        {
          type: 'warning',
          content: 'Don\'t use ™ and ® interchangeably! Use ™ for unregistered marks, ® only after federal registration is complete.'
        },
        {
          type: 'text',
          title: '🎯 When to Trademark',
          content: 'Early: If you have funding and brand is crucial (e.g., consumer products). Later: If bootstrapping and need to watch costs. Most startups wait until post-launch or first funding round.'
        },
        {
          type: 'tips',
          title: 'DIY vs. Lawyer',
          content: [
            'DIY filing: $350 + your time (risky if rejected)',
            'Trademark attorney: $1000-2000 (higher success rate)',
            'LegalZoom/services: $200-400 + USPTO fees (middle ground)',
            'Recommendation: Use attorney for valuable brands'
          ]
        }
      ],
      references: [
        {
          title: 'USPTO Trademark Electronic Application System (TEAS)',
          url: 'https://www.uspto.gov/trademarks/apply',
          description: 'Official portal to apply for federal trademarks'
        },
        {
          title: 'USPTO Trademark Search',
          url: 'https://www.uspto.gov/trademarks/search',
          description: 'Search existing trademarks before filing'
        },
        {
          title: 'USPTO Trademark Basics',
          url: 'https://www.uspto.gov/trademarks/basics',
          description: 'Complete guide to understanding trademarks'
        }
      ]
    },
    'annual-compliance': {
      title: 'Staying Compliant: Annual Requirements',
      duration: '3 min read',
      sections: [
        {
          type: 'text',
          content: 'Forming your LLC is just the start! Every state requires ongoing filings and fees to keep your business in good standing.'
        },
        {
          type: 'steps',
          title: 'Annual To-Do List',
          content: [
            'File annual report with your state (due dates vary)',
            'Pay annual franchise tax or LLC fee',
            'Renew business licenses and permits',
            'Update registered agent if changed',
            'File federal and state tax returns',
            'Maintain bookkeeping and records',
            'Review and update operating agreement if needed'
          ]
        },
        {
          type: 'tips',
          title: 'State Filing Requirements',
          content: [
            'Most states: Annual report due on LLC anniversary',
            'California: $800 annual franchise tax (ouch!)',
            'Delaware: $300 annual fee',
            'Texas: Franchise tax based on revenue',
            'Wyoming: $60 annual fee (cheapest!)',
            'Fees range from $0 (Missouri) to $800 (California)'
          ]
        },
        {
          type: 'warning',
          content: '⚠️ Missing deadlines = BIG problems! Late fees, penalties, and your LLC can be dissolved. Set calendar reminders 30 days before deadlines!'
        },
        {
          type: 'tips',
          title: 'Record Keeping Best Practices',
          content: [
            'Keep corporate records for 7 years (IRS requirement)',
            'Maintain separate business bank account',
            'Document all major decisions in meeting minutes',
            'Store important docs digitally AND physically',
            'Update ownership records when members change',
            'Keep insurance policies current'
          ]
        },
        {
          type: 'text',
          title: '💡 Pro Tip',
          content: 'Use a service like Corpnet or Northwest to track deadlines and file reports automatically. $100-200/year but prevents costly mistakes!'
        }
      ],
      references: [
        {
          title: 'NASS Annual Report Requirements by State',
          url: 'https://www.nass.org/business-services/annual-reports',
          description: 'State-by-state annual filing requirements'
        },
        {
          title: 'IRS Recordkeeping for Small Business',
          url: 'https://www.irs.gov/businesses/small-businesses-self-employed/recordkeeping',
          description: 'Official IRS guidance on business record retention'
        }
      ]
    },
    'raising-capital': {
      title: 'Preparing to Raise Capital',
      duration: '5 min read',
      sections: [
        {
          type: 'text',
          content: 'Planning to raise money from investors? Your business structure and legal foundation matter! Here\'s what you need to know.'
        },
        {
          type: 'tips',
          title: 'LLC vs. C-Corp for Funding',
          content: [
            'VCs almost always require C-Corps (for stock options)',
            'Angels and friends/family can invest in LLCs',
            'You can convert LLC → C-Corp later',
            'Conversion costs $1000-3000 in legal fees',
            'Do it before raising $500K+ from VCs'
          ]
        },
        {
          type: 'steps',
          title: 'Pre-Fundraising Checklist',
          content: [
            'Clean cap table with clear ownership percentages',
            'Operating agreement with vesting schedules',
            'Proper accounting and financial statements',
            'Formation documents filed correctly',
            'No outstanding legal or tax issues',
            'Intellectual property assigned to company',
            'Founders have vesting (typically 4 years)'
          ]
        },
        {
          type: 'warning',
          content: 'Investors will do legal due diligence! Messy formation docs, missing agreements, or founder disputes can kill deals. Get clean early!'
        },
        {
          type: 'tips',
          title: 'Investment Structures',
          content: [
            'SAFE notes: Simplest for pre-seed ($50K-500K)',
            'Convertible notes: Debt that converts to equity',
            'Priced rounds: Selling actual shares (Series A+)',
            'Revenue sharing: Alternative to equity',
            'Grants: Non-dilutive (government, accelerators)'
          ]
        },
        {
          type: 'text',
          title: '💰 Fundraising Timeline',
          content: 'Pre-seed: $50-500K (3 months). Seed: $500K-2M (6 months). Series A: $2M-15M (9+ months). Plan your runway accordingly!'
        }
      ],
      references: [
        {
          title: 'Y Combinator SAFE Agreement',
          url: 'https://www.ycombinator.com/documents',
          description: 'Standard SAFE (Simple Agreement for Future Equity) templates'
        },
        {
          title: 'SBA Startup Financing Guide',
          url: 'https://www.sba.gov/business-guide/plan-your-business/fund-your-business',
          description: 'Comprehensive guide to funding options'
        },
        {
          title: 'SEC Regulation D Filing',
          url: 'https://www.sec.gov/education/smallbusiness/exemptofferings/rule506b',
          description: 'Understanding securities law for private fundraising'
        }
      ]
    },
    'state-comparison': {
      title: 'State-by-State Cost Comparison',
      duration: '4 min read',
      sections: [
        {
          type: 'text',
          content: 'Costs vary WILDLY by state! Here\'s what you\'ll pay in filing fees, annual fees, and taxes in popular startup states.'
        },
        {
          type: 'tips',
          title: '🏆 Cheapest States',
          content: [
            'Wyoming: $100 filing, $60/year (no state tax!)',
            'New Mexico: $50 filing, $0/year',
            'Missouri: $50 filing, $0/year',
            'Mississippi: $50 filing, $0/year',
            'Kentucky: $40 filing, $15/year'
          ]
        },
        {
          type: 'tips',
          title: '💼 Startup Hubs',
          content: [
            'Delaware: $90 filing, $300/year (VC favorite)',
            'Nevada: $75 filing, $350/year (privacy, no state tax)',
            'Texas: $300 filing, franchise tax based on revenue',
            'Florida: $125 filing, $138.75/year',
            'Colorado: $50 filing, $10/year'
          ]
        },
        {
          type: 'warning',
          content: 'California: $70 filing BUT $800/year minimum franchise tax regardless of revenue! One of the most expensive states for LLCs.'
        },
        {
          type: 'tips',
          title: '🗽 Major Markets',
          content: [
            'California: $70 filing, $800/year + 8.84% tax',
            'New York: $200 filing, $9/year (+ publication requirement)',
            'Illinois: $150 filing, $75/year',
            'Massachusetts: $500 filing, $500/year',
            'Washington: $200 filing, varies by revenue'
          ]
        },
        {
          type: 'text',
          title: '🎯 The Smart Move',
          content: 'Unless you\'re raising VC money immediately, form in your home state. The savings on compliance and avoiding "foreign entity" registration outweigh any theoretical benefits of Delaware for most startups.'
        }
      ],
      references: [
        {
          title: 'SBA State-by-State Business Guide',
          url: 'https://www.sba.gov/local-assistance',
          description: 'Find SBA resources and information for your state'
        },
        {
          title: 'Tax Foundation State Business Tax Climate Index',
          url: 'https://taxfoundation.org/rankings/state-business-tax-climate-index/',
          description: 'Compare state tax burdens for businesses'
        }
      ]
    }
  };

  const resources = [
    {
      id: 'business-licenses',
      title: 'Business Licenses & Permits Guide',
      description: 'What licenses you need and how to get them',
      icon: <Scale className="w-5 h-5" />,
      color: '#00E0FF',
      tutorial: additionalTutorials['business-licenses']
    },
    {
      id: 'understanding-taxes',
      title: 'Understanding Business Taxes',
      description: 'LLC tax options, deductions, and quarterly payments',
      icon: <Calculator className="w-5 h-5" />,
      color: '#6CFF6C',
      tutorial: additionalTutorials['understanding-taxes']
    },
    {
      id: 'trademark-basics',
      title: 'Trademark Protection Basics',
      description: 'How to protect your business name and brand',
      icon: <Shield className="w-5 h-5" />,
      color: '#4B00FF',
      tutorial: additionalTutorials['trademark-basics']
    },
    {
      id: 'annual-compliance',
      title: 'Annual Compliance Checklist',
      description: 'Stay in good standing with ongoing requirements',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: '#FFCF00',
      tutorial: additionalTutorials['annual-compliance']
    },
    {
      id: 'raising-capital',
      title: 'Preparing to Raise Capital',
      description: 'Legal foundation for fundraising from investors',
      icon: <DollarSign className="w-5 h-5" />,
      color: '#FF4F4F',
      tutorial: additionalTutorials['raising-capital']
    },
    {
      id: 'state-comparison',
      title: 'State Cost Comparison Tool',
      description: 'Compare filing fees and annual costs across states',
      icon: <MapPin className="w-5 h-5" />,
      color: '#00E0FF',
      tutorial: additionalTutorials['state-comparison']
    }
  ];

  // Quiz questions
  const quizQuestions = [
    {
      id: 'q1',
      question: 'What is the main advantage of forming an LLC?',
      options: [
        { id: 'a', text: 'Lower taxes than sole proprietorship' },
        { id: 'b', text: 'Protection of personal assets from business liabilities' },
        { id: 'c', text: 'Easier to get venture capital funding' },
        { id: 'd', text: 'No need for business licenses' }
      ],
      correct: 'b'
    },
    {
      id: 'q2',
      question: 'Which business structure is typically required for raising venture capital?',
      options: [
        { id: 'a', text: 'LLC' },
        { id: 'b', text: 'Sole Proprietorship' },
        { id: 'c', text: 'C-Corp' },
        { id: 'd', text: 'Partnership' }
      ],
      correct: 'c'
    },
    {
      id: 'q3',
      question: 'What is an EIN and why do you need it?',
      options: [
        { id: 'a', text: 'A business license required to operate' },
        { id: 'b', text: 'A tax identification number for your business, like a Social Security number' },
        { id: 'c', text: 'A certificate of incorporation' },
        { id: 'd', text: 'An employee insurance number' }
      ],
      correct: 'b'
    }
  ];

  const totalSteps = 13; // 7 LLC steps + 6 resources
  const completedCount = trackProgress.completed;
  const progressPercentage = trackProgress.percentage;
  const estimatedMinutes = 45; // Updated to reflect all the new tutorial content

  const toggleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
      toast.success('Step completed! 🎉');
    }
    setCompletedSteps(newCompleted);
  };

  const handleQuizAnswer = (questionId: string, answerId: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const submitQuiz = async () => {
    let correct = 0;
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correct) correct++;
    });

    const percentage = (correct / quizQuestions.length) * 100;
    const score = Math.round(percentage);
    
    if (percentage >= 66) {
      setQuizCompleted(true);
      toast.success(`🏅 Badge Earned! You got ${correct}/${quizQuestions.length} correct!`);
      
      // Award badge in backend
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session?.access_token) {
          await universityApi.awardBadge(
            'registering-business',
            'quiz_master',
            score,
            session.user,
            session.access_token
          );
        }
      } catch (error) {
        console.error('Failed to award badge:', error);
        // Don't fail the quiz if badge award fails
      }
    } else {
      toast.error(`You got ${correct}/${quizQuestions.length}. Try again to earn your badge!`);
    }
  };

  // Load user progress on mount and initialize track
  useEffect(() => {
    loadUserProgress();
    initializeTrackProgress();
  }, []);

  const initializeTrackProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !session?.access_token) return;

      // Initialize track progress with total tutorial count (7 steps + 6 resources = 13)
      const totalTutorials = 13;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university/track-completion`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tutorialId: 'init',
            trackId: 'registering-business'
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.progress) {
          // Update total tutorials count if needed
          if (result.progress.totalTutorials !== totalTutorials) {
            result.progress.totalTutorials = totalTutorials;
            // Save updated count
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/university/track-completion`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  tutorialId: 'init',
                  trackId: 'registering-business'
                })
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize track progress:', error);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !session?.access_token) return;

      const stats = await universityApi.getUserStats(session.user, session.access_token);
      
      setUserXP(stats.totalXP || 0);
      setUserLevel(stats.level || 1);
      
      // Set completed tutorials
      if (stats.completedTutorials) {
        setCompletedTutorials(new Set(stats.completedTutorials));
      }

      // Find track progress for "registering-business"
      const trackId = 'registering-business';
      
      // Safely handle trackProgress which might be null or undefined
      if (stats.trackProgress && Array.isArray(stats.trackProgress)) {
        const trackProgressData = stats.trackProgress.find((tp: any) => tp && tp.trackId === trackId);
        
        if (trackProgressData) {
          // Count all possible tutorials (7 steps + 6 resources = 13 total)
          const totalTutorials = 13;
          const completedCount = trackProgressData.completedTutorials?.length || 0;
          
          setTrackProgress({
            completed: completedCount,
            total: totalTutorials,
            percentage: Math.round((completedCount / totalTutorials) * 100)
          });
        } else {
          // No progress for this track yet
          setTrackProgress({
            completed: 0,
            total: 13,
            percentage: 0
          });
        }
      } else {
        // No track progress data at all yet
        setTrackProgress({
          completed: 0,
          total: 13,
          percentage: 0
        });
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
      // Set default values on error
      setTrackProgress({
        completed: 0,
        total: 13,
        percentage: 0
      });
    }
  };

  // Get all tutorials in order
  const getAllTutorials = () => {
    const allTutorials: Array<{ id: string; tutorial: TutorialContent }> = [
      ...llcSteps.map(step => ({ id: step.id, tutorial: step.tutorial! })),
      ...resources.map(resource => ({ id: resource.id, tutorial: resource.tutorial }))
    ];
    return allTutorials;
  };

  const openTutorial = (tutorial: TutorialContent, tutorialId: string) => {
    setActiveTutorial(tutorial);
    setActiveTutorialId(tutorialId);
    setShowFullPageTutorial(true);
    
    // Scroll to top with smooth animation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const goToNextTutorial = () => {
    if (!activeTutorialId) return;
    
    const allTutorials = getAllTutorials();
    const currentIndex = allTutorials.findIndex(t => t.id === activeTutorialId);
    
    if (currentIndex < allTutorials.length - 1) {
      const nextTutorial = allTutorials[currentIndex + 1];
      setActiveTutorial(nextTutorial.tutorial);
      setActiveTutorialId(nextTutorial.id);
      
      // Scroll to top with smooth animation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    } else {
      // Last tutorial - close and show completion message
      setShowFullPageTutorial(false);
      toast.success('🎉 You\'ve completed all tutorials! Take the quiz to earn your badge!');
    }
  };

  const completeTutorialAndNext = async () => {
    if (!activeTutorialId || !activeTutorial) return;

    setIsCompletingTutorial(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !session?.access_token) {
        toast.error('Please sign in to save your progress');
        setIsCompletingTutorial(false);
        return;
      }

      // Check if already completed
      if (completedTutorials.has(activeTutorialId)) {
        // Already completed, just go to next
        goToNextTutorial();
        setIsCompletingTutorial(false);
        return;
      }

      // Call backend to complete tutorial
      const result = await universityApi.completeTutorial(
        activeTutorialId,
        'registering-business',
        session.user,
        session.access_token
      );

      if (result.alreadyCompleted) {
        // Already completed, just go to next
        goToNextTutorial();
        setIsCompletingTutorial(false);
        return;
      }

      // Update local state
      setCompletedTutorials(prev => new Set([...prev, activeTutorialId]));
      setUserXP(result.totalXP);
      setUserLevel(result.level);
      setTrackProgress({
        completed: result.trackProgress.completed,
        total: result.trackProgress.total,
        percentage: result.trackProgress.percentage
      });

      // Track completion for progress tracking
      try {
        await universityApi.trackTutorialCompletion(
          activeTutorialId,
          'registering-business',
          session.user,
          session.access_token
        );
      } catch (trackError) {
        console.error('Failed to track completion:', trackError);
        // Don't fail the whole operation if tracking fails
      }

      // Record streak activity
      await recordActivity('tutorial_completed');

      // Show transition animation with XP (more prominent)
      setTransitionData({
        title: activeTutorial.title,
        xp: result.xpEarned
      });
      setShowTransition(true);

      // Wait for transition animation then go to next tutorial
      setTimeout(() => {
        setShowTransition(false);
        goToNextTutorial();
      }, 2000);

      // Special celebration if track completed
      if (result.trackProgress.trackCompleted) {
        setTimeout(() => {
          toast.success('🎉 Track Complete! You\'ve mastered business registration!', {
            duration: 5000
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Failed to complete tutorial:', error);
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setIsCompletingTutorial(false);
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    },
    tap: { 
      scale: 0.95,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }
    }
  };

  const renderTutorialSection = (section: TutorialContent['sections'][0], index: number) => {
    switch (section.type) {
      case 'text':
        return (
          <div key={index} className="space-y-2">
            {section.title && (
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#FFCF00]" fill="#FFCF00" />
                {section.title}
              </h4>
            )}
            <p className="text-gray-700 leading-relaxed text-base">{section.content}</p>
          </div>
        );
      
      case 'tips':
        return (
          <div key={index} className="bg-[#6CFF6C]/5 border-2 border-[#6CFF6C]/30 rounded-xl p-5 space-y-3">
            {section.title && (
              <h4 className="font-semibold text-base flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#6CFF6C]" fill="#6CFF6C" />
                {section.title}
              </h4>
            )}
            <ul className="space-y-2.5 text-base">
              {Array.isArray(section.content) && section.content.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6CFF6C] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'warning':
        return (
          <div key={index} className="bg-[#FF4F4F]/5 border-2 border-[#FF4F4F]/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-[#FF4F4F] mt-0.5 flex-shrink-0" />
              <p className="text-base text-gray-700 leading-relaxed">{section.content}</p>
            </div>
          </div>
        );
      
      case 'steps':
        return (
          <div key={index} className="bg-[#00E0FF]/5 border-2 border-[#00E0FF]/30 rounded-xl p-5 space-y-4">
            {section.title && (
              <h4 className="font-semibold text-base text-[#00E0FF]">{section.title}</h4>
            )}
            <ol className="space-y-3">
              {Array.isArray(section.content) && section.content.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-base">
                  <div className="w-7 h-7 rounded-full bg-[#00E0FF] text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    {i + 1}
                  </div>
                  <span className="text-gray-700 pt-0.5 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      
      case 'resources':
        return (
          <div key={index} className="bg-[#4B00FF]/5 border-2 border-[#4B00FF]/20 rounded-xl p-4 space-y-2">
            {section.title && (
              <h4 className="font-semibold text-sm text-[#4B00FF]">{section.title}</h4>
            )}
            <ul className="space-y-2 text-sm">
              {Array.isArray(section.content) && section.content.map((resource, i) => (
                <li key={i} className="flex items-start gap-2">
                  <LinkIcon className="w-4 h-4 text-[#4B00FF] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{resource}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Full-page tutorial view
  if (showFullPageTutorial && activeTutorial) {
    const allTutorials = getAllTutorials();
    const currentIndex = allTutorials.findIndex(t => t.id === activeTutorialId);
    const isLastTutorial = currentIndex === allTutorials.length - 1;
    const isCompleted = activeTutorialId ? completedTutorials.has(activeTutorialId) : false;

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Fixed Header */}
          <div className="sticky top-0 bg-white border-b-2 border-gray-100 z-10">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFullPageTutorial(false)}
                    className="gap-2 border-2 border-gray-200 hover:border-[#00E0FF] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Track
                  </Button>
                </motion.div>

                {/* Progress indicator */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} / {allTutorials.length}
                  </span>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-[#FFCF00]/10 to-[#FF4F4F]/10 border-2 border-[#FFCF00]/30 rounded-xl px-3 py-1.5">
                    <Zap className="w-4 h-4 text-[#FFCF00]" fill="#FFCF00" />
                    <span className="text-sm font-semibold">{userXP} XP</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="mb-3">
                <h1 className="text-2xl md:text-3xl mb-2">{activeTutorial.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {activeTutorial.duration}
                  </span>
                  {isCompleted && (
                    <Badge className="bg-[#6CFF6C] text-white border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00E0FF] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / allTutorials.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {activeTutorial.sections.map((section, index) => renderTutorialSection(section, index))}

            {/* Reference Links Section */}
            {activeTutorial.references && activeTutorial.references.length > 0 && (
              <div className="mt-8 pt-8 border-t-2 border-gray-100">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-[#4B00FF]" />
                  Official Resources & References
                </h3>
                <div className="space-y-3">
                  {activeTutorial.references.map((ref, index) => (
                    <motion.a
                      key={index}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.01, x: 4 }}
                      className="block p-4 bg-gradient-to-r from-[#4B00FF]/5 to-transparent border-2 border-[#4B00FF]/20 hover:border-[#4B00FF]/40 rounded-xl transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-[#4B00FF] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#4B00FF] mb-1">{ref.title}</h4>
                          {ref.description && (
                            <p className="text-sm text-gray-600">{ref.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1 break-all">{ref.url}</p>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer - Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {isCompleted ? (
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    className="w-full h-14 bg-[#00E0FF] hover:bg-[#00E0FF]/90 text-white text-lg rounded-xl"
                    onClick={goToNextTutorial}
                  >
                    {isLastTutorial ? (
                      <>
                        <Award className="w-5 h-5 mr-2" />
                        Finish Track → Take Quiz
                      </>
                    ) : (
                      <>
                        Next Tutorial
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button 
                    className="w-full h-14 bg-[#6CFF6C] hover:bg-[#6CFF6C]/90 text-white text-lg rounded-xl"
                    onClick={completeTutorialAndNext}
                    disabled={isCompletingTutorial}
                  >
                    {isCompletingTutorial ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Complete & {isLastTutorial ? 'Finish' : 'Next'}
                        {!isLastTutorial && <ChevronRight className="w-5 h-5 ml-2" />}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Transition Animation - Shows between tutorials */}
        <AnimatePresence>
          {showTransition && (
            <TutorialTransitionAnimation
              tutorialTitle={transitionData.title}
              xpEarned={transitionData.xp}
              onComplete={() => setShowTransition(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
            <Button 
              variant="outline" 
              onClick={onBack}
              className="gap-2 border-2 hover:border-[#00E0FF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tracks
            </Button>
          </motion.div>

          {/* XP and Level Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#FFCF00]/10 to-[#FF4F4F]/10 border-2 border-[#FFCF00]/30 rounded-xl px-4 py-2">
              <Zap className="w-5 h-5 text-[#FFCF00]" fill="#FFCF00" />
              <span className="font-bold text-lg">{userXP} XP</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#4B00FF]/10 to-[#00E0FF]/10 border-2 border-[#4B00FF]/30 rounded-xl px-4 py-2">
              <Star className="w-5 h-5 text-[#4B00FF]" fill="#4B00FF" />
              <span className="font-bold text-lg">Level {userLevel}</span>
            </div>
          </div>
        </div>

        {/* Track Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 border-[#00E0FF]/20 shadow-lg rounded-2xl overflow-hidden">
            <div 
              className="h-2 w-full"
              style={{
                background: `linear-gradient(90deg, #00E0FF ${progressPercentage}%, #E5E7EB ${progressPercentage}%)`
              }}
            />
            <CardHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-xl bg-[#00E0FF]/10">
                      <Building2 className="w-8 h-8 text-[#00E0FF]" />
                    </div>
                    <CardTitle className="text-3xl">Registering Your Business</CardTitle>
                  </div>
                  <CardDescription className="text-base mt-3">
                    Learn how to choose the right business structure and complete your LLC registration — the foundation of every successful startup.
                  </CardDescription>
                </div>
                {quizCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Badge className="bg-[#FFCF00] text-black border-0 px-4 py-2 text-sm">
                      <Award className="w-4 h-4 mr-2" />
                      Badge Earned
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-[#4B00FF]" />
                  <span>{estimatedMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-[#6CFF6C]" />
                  <span>13 Tutorials</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4F4F]" />
                  <span>{completedCount} / {totalSteps} Steps</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-[#4B00FF]">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-3 bg-gray-200"
                  style={{
                    // @ts-ignore
                    '--progress-background': '#00E0FF'
                  }}
                />
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Section 1: Business Structures Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="rounded-2xl shadow-md border-2 border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#4B00FF]/10">
                  <Shield className="w-6 h-6 text-[#4B00FF]" />
                </div>
                <div>
                  <CardTitle className="text-xl">Choosing the Right Business Type</CardTitle>
                  <CardDescription className="mt-1">
                    LLC, S-Corp, C-Corp, or Sole Proprietorship? Learn what fits your startup best.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommendation Banner */}
              <div className="bg-[#6CFF6C]/10 border-2 border-[#6CFF6C]/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#6CFF6C] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Recommendation</p>
                    <p className="text-sm text-gray-700 mt-1">
                      ✅ Most startups begin as LLCs, then convert to C-Corps later when raising venture capital.
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Structure Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessStructures.map((structure, index) => (
                  <motion.div
                    key={structure.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="relative"
                  >
                    <Card 
                      className={`rounded-xl border-2 h-full transition-all ${
                        structure.recommended 
                          ? 'border-[#00E0FF] bg-[#00E0FF]/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {structure.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-[#00E0FF] text-white border-0 px-3 shadow-md">
                            <Star className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        </div>
                      )}
                      <CardContent className="pt-6 pb-4 px-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${structure.color}20` }}
                          >
                            <div style={{ color: structure.color }}>
                              {structure.icon}
                            </div>
                          </div>
                          <h3 className="font-bold">{structure.name}</h3>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="font-semibold text-xs text-gray-500 uppercase mb-1">Best For</p>
                            <p className="text-gray-700">{structure.bestFor}</p>
                          </div>
                          
                          <div>
                            <p className="font-semibold text-xs text-[#6CFF6C] mb-1">PROS</p>
                            <ul className="space-y-1">
                              {structure.pros.map((pro, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs">
                                  <CheckCircle2 className="w-3 h-3 text-[#6CFF6C] mt-0.5 flex-shrink-0" />
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="font-semibold text-xs text-[#FF4F4F] mb-1">CONS</p>
                            <ul className="space-y-1">
                              {structure.cons.map((con, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs">
                                  <Circle className="w-3 h-3 text-[#FF4F4F] mt-0.5 flex-shrink-0" />
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2: LLC Registration Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="rounded-2xl shadow-md border-2 border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#6CFF6C]/10">
                  <FileText className="w-6 h-6 text-[#6CFF6C]" />
                </div>
                <div>
                  <CardTitle className="text-xl">Step-by-Step: Registering an LLC</CardTitle>
                  <CardDescription className="mt-1">
                    Complete these 7 steps to officially launch your business
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {llcSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  >
                    <Card 
                      className={`rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                        completedTutorials.has(step.id)
                          ? 'border-[#6CFF6C] bg-[#6CFF6C]/10' 
                          : 'border-gray-200 hover:border-[#00E0FF]/30'
                      }`}
                      onClick={() => toggleStepComplete(step.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Step Number/Checkbox */}
                          <motion.div 
                            className="flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {completedTutorials.has(step.id) ? (
                              <div className="w-8 h-8 rounded-full bg-[#6CFF6C] flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-400">
                                {index + 1}
                              </div>
                            )}
                          </motion.div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1">{step.title}</h4>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>

                          {/* View Tutorial Button */}
                          <motion.div 
                            whileHover="hover" 
                            whileTap="tap" 
                            variants={buttonVariants}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (step.tutorial) openTutorial(step.tutorial, step.id);
                            }}
                          >
                            <Button 
                              size="sm" 
                              variant="outline"
                              className={`transition-all ${
                                completedTutorials.has(step.id)
                                  ? 'border-[#6CFF6C] text-[#6CFF6C] bg-[#6CFF6C]/10'
                                  : 'border-[#4B00FF] text-[#4B00FF] hover:bg-[#4B00FF] hover:text-white'
                              }`}
                            >
                              {completedTutorials.has(step.id) ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  View Tutorial
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3: Tutorials & Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="rounded-2xl shadow-md border-2 border-gray-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FFCF00]/10">
                  <BookOpen className="w-6 h-6 text-[#FFCF00]" />
                </div>
                <div>
                  <CardTitle className="text-xl">Tutorials & Resources</CardTitle>
                  <CardDescription className="mt-1">
                    {resources.length} Lessons • {estimatedMinutes} min total
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource, index) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                    onClick={() => resource.tutorial && openTutorial(resource.tutorial, resource.id)}
                  >
                    <Card className={`rounded-xl border-2 cursor-pointer transition-all h-full ${
                      completedTutorials.has(resource.id)
                        ? 'border-[#6CFF6C] bg-[#6CFF6C]/5'
                        : 'border-gray-200 hover:border-[#00E0FF]/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${resource.color}20` }}
                          >
                            <div style={{ color: resource.color }}>
                              {resource.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{resource.title}</h4>
                              {completedTutorials.has(resource.id) && (
                                <CheckCircle2 className="w-4 h-4 text-[#6CFF6C]" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{resource.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 4: Quiz / Certification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="rounded-2xl shadow-md border-2 border-[#FF4F4F]/20 bg-gradient-to-br from-white to-[#FF4F4F]/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#FF4F4F]/10">
                    <Award className="w-6 h-6 text-[#FF4F4F]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Earn Your Business Formation Badge 🏅</CardTitle>
                    <CardDescription className="mt-1">
                      Test your knowledge and earn your certification
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {quizQuestions.map((question, qIndex) => (
                <div key={question.id} className="space-y-3">
                  <p className="font-semibold">
                    {qIndex + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left h-auto py-3 px-4 border-2 transition-all ${
                            quizAnswers[question.id] === option.id
                              ? 'border-[#4B00FF] bg-[#4B00FF]/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleQuizAnswer(question.id, option.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              quizAnswers[question.id] === option.id
                                ? 'border-[#4B00FF] bg-[#4B00FF]'
                                : 'border-gray-300'
                            }`}>
                              {quizAnswers[question.id] === option.id && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span>{option.text}</span>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                <Button
                  className="w-full bg-[#FF4F4F] hover:bg-[#FF4F4F]/90 text-white border-0 py-6 text-lg"
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                >
                  <Award className="w-5 h-5 mr-2" />
                  Finish Track → Get Your Badge
                </Button>
              </motion.div>

              {quizCompleted && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="bg-[#6CFF6C]/10 border-2 border-[#6CFF6C] rounded-xl p-6 text-center"
                >
                  <Award className="w-16 h-16 text-[#6CFF6C] mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Congratulations! 🎉</h3>
                  <p className="text-gray-700">
                    You've earned your Business Formation Badge! You now understand the fundamentals of registering your startup.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Celebration Animation Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <TutorialCompletionCelebration
            tutorialTitle={celebrationData.title}
            xpEarned={celebrationData.xp}
            onComplete={() => setShowCelebration(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
