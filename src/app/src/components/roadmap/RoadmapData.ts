// Universal Roadmap Template System
// Comprehensive business roadmaps with gamification and pro gating

import { DROPSHIPPING_ECOMMERCE_ROADMAP, BEAUTY_WELLNESS_ROADMAP, JEWELRY_LUXURY_ROADMAP, SUBSCRIPTION_BOX_ROADMAP, FOOD_TRUCK_ROADMAP, REAL_ESTATE_ROADMAP, AUTOMOTIVE_MOBILE_ROADMAP, IT_MSP_ROADMAP, PET_GROOMING_ROADMAP, COURIER_LOGISTICS_ROADMAP, SMMA_LITE_ROADMAP, AIRBNB_COHOST_ROADMAP, ONLINE_TUTORING_ROADMAP, BOOKKEEPING_TAX_ROADMAP, LEGAL_DOCUMENT_ROADMAP, IMPORT_EXPORT_ROADMAP, FASHION_WHOLESALE_ROADMAP, SUBSCRIPTION_COMMERCE_ROADMAP, MOBILE_APP_DEV_ROADMAP, CONSTRUCTION_REMODELING_ROADMAP, GOVERNMENT_B2G_ROADMAP, EQUIPMENT_RENTAL_ROADMAP, SECURITY_PATROL_ROADMAP, SOLAR_SALES_ROADMAP, FRACTIONAL_OPERATOR_ROADMAP, INSURANCE_AGENCY_ROADMAP, SAAS_VAR_ROADMAP, ART_COLLECTIBLES_ROADMAP, ENVIRONMENTAL_SUSTAINABILITY_ROADMAP, SCIENTIFIC_EQUIPMENT_ROADMAP, PET_PRODUCTS_WHOLESALE_ROADMAP, HOME_IMPROVEMENT_WHOLESALE_ROADMAP, SPORTING_GOODS_WHOLESALE_ROADMAP, MICRO_TRAVEL_AGENCY_ROADMAP, PACKAGING_MANUFACTURING_ROADMAP, REAL_ESTATE_SOLO_AGENT_ROADMAP, AUTOMOTIVE_PARTS_WHOLESALE_ROADMAP, FOOD_BEVERAGE_MANUFACTURING_ROADMAP, ONLINE_COURSE_CREATOR_ROADMAP, MSP_SOLO_ROADMAP, LEGAL_PARALEGAL_SERVICES_ROADMAP, MOBILE_MECHANIC_ROADMAP, BEAUTY_WELLNESS_SERVICES_ROADMAP, HOME_SERVICES_HANDYMAN_ROADMAP, SUBSCRIPTION_COMMERCE_RECURRING_ROADMAP, COMMUNICATION_MEDIA_SERVICES_ROADMAP, CREATIVE_DESIGN_SERVICES_ROADMAP, ENTERTAINMENT_EVENT_SERVICES_ROADMAP, JEWELRY_LUXURY_RETAIL_ROADMAP, DROPSHIPPING_FULFILLMENT_ROADMAP, VETERINARY_ANIMAL_CARE_ROADMAP, HEALTH_BEAUTY_WHOLESALE_ROADMAP, TRANSPORTATION_LOGISTICS_ROADMAP, EDUCATIONAL_MATERIALS_DEALER_ROADMAP, PROFESSIONAL_EQUIPMENT_DEALER_ROADMAP, TECHNICAL_ENGINEERING_SERVICES_ROADMAP, ELECTRONICS_MANUFACTURING_ROADMAP, DIGITAL_CONTENT_WHOLESALE_ROADMAP, RETAIL_CONSUMER_SALES_ROADMAP, RAW_MATERIALS_WHOLESALE_ROADMAP, MAINTENANCE_FACILITY_SERVICES_ROADMAP, PERSONAL_LIFESTYLE_SERVICES_ROADMAP, MEDICAL_DEVICE_MANUFACTURING_ROADMAP, SMART_HOME_MANUFACTURING_ROADMAP, PHARMACEUTICAL_HEALTHCARE_WHOLESALE_ROADMAP, HEALTHCARE_MEDICAL_SERVICES_ROADMAP, TEXTILES_APPAREL_MANUFACTURING_ROADMAP, ROBOTICS_AUTOMATION_MANUFACTURING_ROADMAP, ECOMMERCE_WHOLESALE_PLATFORMS_ROADMAP, DRONE_UNMANNED_SYSTEMS_ROADMAP, FURNITURE_FIXTURES_MANUFACTURING_ROADMAP, SPORTS_RECREATION_MANUFACTURING_ROADMAP, TOY_GAME_MANUFACTURING_ROADMAP, MODULAR_PREFAB_HOUSING_ROADMAP, RENEWABLE_ENERGY_MANUFACTURING_ROADMAP, CHEMICAL_MATERIALS_MANUFACTURING_ROADMAP, AEROSPACE_AVIATION_MANUFACTURING_ROADMAP, AGRICULTURAL_EQUIPMENT_MANUFACTURING_ROADMAP, AUTOMOTIVE_PARTS_SYSTEMS_MANUFACTURING_ROADMAP, ENTERTAINMENT_GAMING_HARDWARE_ROADMAP, CONSTRUCTION_EQUIPMENT_MANUFACTURING_ROADMAP, BIOTECHNOLOGY_LIFE_SCIENCES_ROADMAP, ENVIRONMENTAL_TECHNOLOGY_MANUFACTURING_ROADMAP, MARINE_BOAT_MANUFACTURING_ROADMAP, JEWELRY_LUXURY_GOODS_MANUFACTURING_ROADMAP, FOOD_BEVERAGE_WHOLESALE_ROADMAP, INDUSTRIAL_COMMERCIAL_WHOLESALE_ROADMAP, TECHNOLOGY_HARDWARE_WHOLESALE_ROADMAP, PUBLISHING_MEDIA_WHOLESALE_ROADMAP, TOYS_GAMES_WHOLESALE_ROADMAP, RETAIL_PRODUCT_WHOLESALE_ROADMAP, AGRICULTURAL_PRODUCTS_WHOLESALE_ROADMAP, ENERGY_PRODUCTS_WHOLESALE_ROADMAP, JEWELRY_ACCESSORIES_WHOLESALE_ROADMAP, MARINE_RV_WHOLESALE_ROADMAP, MARINE_RV_DEALER_ROADMAP, PET_STORE_ANIMAL_SERVICES_ROADMAP, FINANCIAL_SERVICES_DEALER_ROADMAP, ENTERTAINMENT_MEDIA_DEALER_ROADMAP, PRINT_ON_DEMAND_MANUFACTURING_ROADMAP, AUTOMOTIVE_DEALERSHIP_ROADMAP, SPORTING_GOODS_FITNESS_RETAIL_ROADMAP, HOME_IMPROVEMENT_HARDWARE_RETAIL_ROADMAP, GAMING_ENTERTAINMENT_RETAIL_ROADMAP, AGRICULTURAL_EQUIPMENT_DEALER_ROADMAP } from './NewRoadmaps';
import { VA_REMOTE_SUPPORT_ROADMAP } from './AdditionalRoadmaps';

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  isCompleted?: boolean;
}

export interface PivotLink {
  id: string;
  title: string;
  roadmapId: string;
  type: 'cheaper' | 'faster';
  description: string;
  timeSaving?: string;
  costSaving?: string;
  difficulty: 'easier' | 'similar' | 'harder';
}

export interface Task {
  id: string;
  title: string;
  description?: string; // Added for enhanced components
  whyThisMatters: string;
  steps: TaskStep[];
  definitionOfDone: string;
  killRule?: string; // Optional kill rule for when to stop/pivot
  timeEstimate: string; // e.g., "2-4 hours", "1 day", "30 minutes"
  tutorialLink?: string;
  xpReward: number; // 15, 25, or 40 XP
  difficulty: 'easy' | 'standard' | 'hard';
  isProLocked: boolean;
  isProTier?: boolean; // Added for enhanced components
  category: 'free' | 'pro';
  tags: string[];
  pivotLinks?: PivotLink[]; // Spider links for alternative paths
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  xpReward: number; // Always 200 XP (renamed from xpReward)
  totalXP?: number; // Alias for xpReward to support enhanced components
  tasks: Task[];
  isUnlocked: boolean;
  isProTier?: boolean; // Added for enhanced components
  completedTasks: number;
  totalTasks: number;
}

export interface SprintDay {
  day: number;
  title: string;
  description: string;
  tasks: string[]; // Task IDs
}

export interface Tutorial {
  id: string;
  title: string;
  type: 'video' | 'document' | 'template';
  duration: string; // e.g., "60-90 sec", "5 min read"
  url?: string;
  description: string;
}

export interface Roadmap {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string[];
  estimatedTimeToRevenue: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  milestones: Milestone[];
  sevenDaySprint: SprintDay[];
  tutorials: Tutorial[];
  proUnlockPoint: number; // Which milestone requires pro
  tags: string[];
  icon: string;
  color: string;
}

// Universal milestone template
export const UNIVERSAL_MILESTONES = {
  MAP: {
    id: 'map',
    title: 'Map',
    description: 'Define your market, audience, and opportunity',
    icon: '🗺️',
    order: 1
  },
  SETUP: {
    id: 'setup',
    title: 'Setup',
    description: 'Build foundation, tools, and initial assets',
    icon: '⚙️',
    order: 2
  },
  LAUNCH: {
    id: 'launch',
    title: 'Launch',
    description: 'Go live with your first offerings and start selling',
    icon: '🚀',
    order: 3
  },
  MONETIZE: {
    id: 'monetize',
    title: 'Monetize',
    description: 'Optimize pricing, increase conversions, add revenue streams',
    icon: '💰',
    order: 4
  },
  SCALE: {
    id: 'scale',
    title: 'Scale',
    description: 'Expand reach, hire help, multiply revenue channels',
    icon: '📈',
    order: 5
  },
  AUTOMATE: {
    id: 'automate',
    title: 'Automate',
    description: 'Systematize operations, delegate, build passive income',
    icon: '🤖',
    order: 6
  }
};

// XP Configuration
export const XP_CONFIG = {
  TASK_EASY: 15,
  TASK_STANDARD: 25,
  TASK_HARD: 40,
  MILESTONE_COMPLETE: 200,
  STREAK_BONUS_START: 3, // Start bonus after day 3
  STREAK_BONUS_DAILY: 10
};

// User progress tracking interface - compatible with RoadmapRail
export interface UserProgress {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  completedTasks: string[];
  completedMilestones: string[];
  currentRoadmap: string;
  lastActiveDate: string;
  achievements: string[];
}

// Event tracking constants for analytics
export const ROADMAP_EVENTS = {
  TASK_COMPLETED: 'task_completed',
  MILESTONE_REACHED: 'milestone_reached',
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  TUTORIAL_OPENED: 'tutorial_opened',
  STEP_COMPLETED: 'step_completed'
} as const;

// Pivot mappings for spider links - defines alternative paths for tasks
export const TASK_PIVOT_MAPPINGS: Record<string, PivotLink[]> = {
  // SMMA monetization task example
  'smma-monetize': [
    {
      id: 'smma-to-subscription',
      title: 'Subscription Commerce',
      roadmapId: 'subscription-commerce',
      type: 'cheaper',
      description: 'Recurring revenue model with lower customer acquisition costs',
      costSaving: '60% lower CAC',
      difficulty: 'easier'
    },
    {
      id: 'smma-to-brand-studio',
      title: 'Brand Studio Starter',
      roadmapId: 'brand-studio-starter',
      type: 'faster',
      description: 'Quick brand design services with faster time to revenue',
      timeSaving: '2 weeks faster',
      difficulty: 'similar'
    }
  ],
  
  // Course checkout task example
  'course-checkout': [
    {
      id: 'course-to-jewelry',
      title: 'Jewelry Retail Drop Calendar',
      roadmapId: 'jewelry-luxury-retail',
      type: 'faster',
      description: 'Physical product drops create urgency and faster sales cycles',
      timeSaving: '1 week faster',
      difficulty: 'similar'
    },
    {
      id: 'course-to-subscription',
      title: 'Subscription Commerce',
      roadmapId: 'subscription-commerce',
      type: 'cheaper',
      description: 'Lower upfront pricing with recurring revenue',
      costSaving: '70% lower startup cost',
      difficulty: 'easier'
    }
  ],
  
  // PCBA pilot runs example
  'pcba-pilot': [
    {
      id: 'pcba-to-environmental',
      title: 'Environmental Tech Dashboard',
      roadmapId: 'environmental-technology-manufacturing',
      type: 'faster',
      description: 'Software-first approach reduces physical prototyping time',
      timeSaving: '3 weeks faster',
      difficulty: 'similar'
    },
    {
      id: 'pcba-to-test-jig',
      title: 'Test Jig Service',
      roadmapId: 'electronics-manufacturing',
      type: 'cheaper',
      description: 'Service-based model with lower equipment investment',
      costSaving: '80% lower equipment cost',
      difficulty: 'easier'
    }
  ],
  
  // Content Creation monetization pivots
  'cc-monetize-1': [
    {
      id: 'content-to-subscription',
      title: 'Subscription Commerce',
      roadmapId: 'subscription-commerce',
      type: 'cheaper',
      description: 'Recurring revenue with predictable income streams',
      costSaving: '50% lower ad spend',
      difficulty: 'easier'
    },
    {
      id: 'content-to-ecommerce',
      title: 'E-commerce Microbrand',
      roadmapId: 'ecommerce-pod',
      type: 'faster',
      description: 'Physical products leverage existing audience faster',
      timeSaving: '1-2 weeks faster',
      difficulty: 'similar'
    }
  ],
  
  // E-commerce POD monetization pivots
  'pod-monetize-1': [
    {
      id: 'pod-to-dropshipping',
      title: 'Dropshipping Ecommerce',
      roadmapId: 'dropshipping-ecommerce',
      type: 'faster',
      description: 'No inventory risk with faster product testing',
      timeSaving: '1 week faster',
      difficulty: 'easier'
    },
    {
      id: 'pod-to-subscription',
      title: 'Subscription Box',
      roadmapId: 'subscription-box',
      type: 'cheaper',
      description: 'Recurring revenue reduces marketing costs',
      costSaving: '40% lower marketing spend',
      difficulty: 'similar'
    }
  ],
  
  // Additional example task pivots
  'cc-launch-3': [
    {
      id: 'offer-to-jewelry',
      title: 'Jewelry Luxury Retail',
      roadmapId: 'jewelry-luxury-retail',
      type: 'faster',
      description: 'Physical luxury products with immediate premium pricing',
      timeSaving: '1 week faster launch',
      difficulty: 'similar'
    },
    {
      id: 'offer-to-subscription',
      title: 'Subscription Commerce',
      roadmapId: 'subscription-commerce-recurring',
      type: 'cheaper',
      description: 'Lower barrier to entry with recurring revenue model',
      costSaving: '60% lower initial investment',
      difficulty: 'easier'
    }
  ]
};

// Roadmap 1: Content Creation and Digital Media Services
export const CONTENT_CREATION_ROADMAP: Roadmap = {
  id: 'content-creation',
  title: 'Content Creation & Digital Media',
  subtitle: 'Build an audience and monetize your creativity',
  description: 'Turn your creativity into profit through content creation, social media, and digital products',
  targetAudience: ['Gen Z', 'Creators', 'Side hustlers'],
  estimatedTimeToRevenue: '2-4 weeks',
  difficulty: 'beginner',
  icon: '🎨',
  color: 'from-purple-500 to-pink-500',
  proUnlockPoint: 4, // Pro required from Monetize milestone
  tags: ['content', 'social-media', 'digital-products', 'creative'],
  milestones: [
    {
      id: 'cc-map',
      title: 'Map',
      description: 'Define your niche and content strategy',
      icon: '🗺️',
      order: 1,
      xpReward: 200,
      isUnlocked: true,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'cc-map-1',
          title: 'Pick a niche and audience',
          whyThisMatters: 'A focused niche helps you create content that resonates deeply with a specific audience, leading to higher engagement and easier monetization.',
          steps: [
            { id: 'cc-map-1-step-1', title: 'Research 5 potential niches you\'re passionate about', description: 'List topics you genuinely enjoy and have knowledge in' },
            { id: 'cc-map-1-step-2', title: 'Analyze audience size and engagement for each niche', description: 'Check hashtag volumes, community sizes, and competitor engagement rates' },
            { id: 'cc-map-1-step-3', title: 'Select your primary niche and define your ideal follower', description: 'Choose the niche with best passion-profit overlap and create an audience persona' }
          ],
          definitionOfDone: 'One clear niche selected with a detailed ideal audience persona documented (demographics, interests, pain points, goals)',
          timeEstimate: '2-3 hours',
          tutorialLink: 'niche-picker-worksheet',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['research', 'strategy', 'audience']
        },
        {
          id: 'cc-map-2',
          title: 'Define 3 content pillars',
          whyThisMatters: 'Content pillars ensure variety while maintaining focus, helping you consistently create valuable content that builds authority in your niche.',
          steps: [
            { id: 'cc-map-2-step-1', title: 'Identify 3 main topics within your niche', description: 'Choose topics that showcase different aspects of your expertise' },
            { id: 'cc-map-2-step-2', title: 'Define content types for each pillar', description: 'Plan educational, entertaining, and behind-the-scenes content for each topic' },
            { id: 'cc-map-2-step-3', title: 'Create a content calendar template', description: 'Build a rotation system ensuring balanced coverage of all pillars' }
          ],
          definitionOfDone: '3 distinct content pillars documented with 10 specific content ideas for each pillar (30 total ideas)',
          timeEstimate: '1-2 hours',
          tutorialLink: 'content-pillars-cheat-sheet',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['content-strategy', 'planning', 'pillars']
        }
      ]
    },
    {
      id: 'cc-setup',
      title: 'Setup',
      description: 'Build your creator brand and production system',
      icon: '⚙️',
      order: 2,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'cc-setup-1',
          title: 'Set up creator stack: accounts, brand kit, templates',
          whyThisMatters: 'Professional branding and efficient tools are essential for creating consistent, high-quality content that builds trust and saves time.',
          steps: [
            { id: 'cc-setup-1-step-1', title: 'Create optimized profiles on 2-3 main platforms', description: 'Set up Instagram, TikTok, YouTube, or LinkedIn with consistent branding' },
            { id: 'cc-setup-1-step-2', title: 'Design brand kit (logo, colors, fonts, templates)', description: 'Create visual identity assets using Canva or similar tools' },
            { id: 'cc-setup-1-step-3', title: 'Set up content creation tools and templates', description: 'Install editing apps, create post templates, and organize asset library' }
          ],
          definitionOfDone: 'Live profiles on chosen platforms with complete branding, content creation workflow documented, and template library created',
          timeEstimate: '3-4 hours',
          tutorialLink: 'creator-stack-setup',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: false,
          category: 'free',
          tags: ['branding', 'tools', 'setup', 'social-media']
        },
        {
          id: 'cc-setup-2',
          title: 'Record 10 pieces in one batch',
          whyThisMatters: 'Batch content creation maximizes efficiency, ensures consistency, and gives you a content buffer that reduces daily pressure to create.',
          steps: [
            { id: 'cc-setup-2-step-1', title: 'Plan 10 content pieces across your 3 pillars', description: 'Create detailed outlines ensuring variety and value in each piece' },
            { id: 'cc-setup-2-step-2', title: 'Set up recording environment and equipment', description: 'Prepare lighting, background, props, and test audio/video quality' },
            { id: 'cc-setup-2-step-3', title: 'Record all 10 pieces in one session', description: 'Film/record everything while you\'re in the creative zone' }
          ],
          definitionOfDone: '10 pieces of content recorded and saved in organized folders with preliminary captions drafted',
          timeEstimate: '4-6 hours',
          tutorialLink: 'batch-recording-setup',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: false,
          category: 'free',
          tags: ['content-creation', 'batch-production', 'efficiency']
        }
      ]
    },
    {
      id: 'cc-launch',
      title: 'Launch',
      description: 'Go live and start building your audience',
      icon: '🚀',
      order: 3,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 3,
      tasks: [
        {
          id: 'cc-launch-1',
          title: 'Post daily for 7 days',
          whyThisMatters: 'Consistent daily posting for a week establishes your presence, helps you understand the algorithm, and starts building audience habits.',
          steps: [
            { id: 'cc-launch-1-step-1', title: 'Schedule 7 posts across your platforms', description: 'Use scheduling tools to maintain consistent posting times' },
            { id: 'cc-launch-1-step-2', title: 'Engage actively with your audience and similar creators', description: 'Respond to comments, join conversations, and network with peers' },
            { id: 'cc-launch-1-step-3', title: 'Track engagement metrics daily', description: 'Monitor likes, comments, shares, and follower growth patterns' }
          ],
          definitionOfDone: '7 posts published with engagement data tracked, and 50+ meaningful interactions completed with other creators/followers',
          killRule: 'If you get zero engagement (likes, comments, shares) after posting for 7 days, consider pivoting to a different niche or content format',
          timeEstimate: '1 hour daily for 7 days',
          tutorialLink: 'daily-posting-strategy',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['posting', 'engagement', 'consistency']
        },
        {
          id: 'cc-launch-2',
          title: 'Collect signals and pick 2 winners',
          whyThisMatters: 'Analyzing early performance data helps you identify what content resonates most, allowing you to focus on high-performing content types.',
          steps: [
            { id: 'cc-launch-2-step-1', title: 'Analyze performance metrics for all 7 posts', description: 'Compare engagement rates, reach, and audience retention across content types' },
            { id: 'cc-launch-2-step-2', title: 'Identify common elements in top-performing content', description: 'Look for patterns in format, timing, topics, or style' },
            { id: 'cc-launch-2-step-3', title: 'Select 2 content formats to focus on going forward', description: 'Choose formats that perform well AND align with your strengths' }
          ],
          definitionOfDone: '2 winning content formats identified with documented reasoning and 5 new content ideas for each format planned',
          timeEstimate: '2-3 hours',
          tutorialLink: 'content-performance-analysis',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['analytics', 'optimization', 'strategy']
        },
        {
          id: 'cc-launch-3',
          title: 'Create first offer: digital product or UGC service',
          whyThisMatters: 'Having a monetization offer ready allows you to capitalize on audience interest immediately and start generating revenue.',
          steps: [
            { id: 'cc-launch-3-step-1', title: 'Choose between digital product or UGC service based on your content', description: 'Select the option that best matches your skills and audience needs' },
            { id: 'cc-launch-3-step-2', title: 'Create the offer (template, course, or service package)', description: 'Develop the actual deliverable with clear value proposition' },
            { id: 'cc-launch-3-step-3', title: 'Set pricing and create sales materials', description: 'Research competitor pricing and create compelling offer descriptions' }
          ],
          definitionOfDone: 'Complete offer created with clear deliverables, pricing, and sales copy ready to promote',
          timeEstimate: '3-5 hours',
          tutorialLink: 'first-offer-creation',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: false,
          category: 'free',
          tags: ['monetization', 'product-creation', 'offers']
        }
      ]
    },
    {
      id: 'cc-monetize',
      title: 'Monetize',
      description: 'Build sales systems and close your first deals',
      icon: '💰',
      order: 4,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'cc-monetize-1',
          title: 'Build a simple funnel: link in bio + email capture',
          whyThisMatters: 'A conversion funnel captures interested followers and nurtures them into customers, dramatically increasing your revenue potential.',
          steps: [
            { id: 'cc-monetize-1-step-1', title: 'Create landing page with email capture', description: 'Build a simple page showcasing your offer with email signup form' },
            { id: 'cc-monetize-1-step-2', title: 'Set up email automation sequence', description: 'Create 3-5 email sequence that nurtures subscribers toward purchase' },
            { id: 'cc-monetize-1-step-3', title: 'Optimize link in bio strategy', description: 'Use link tools and create compelling call-to-actions in your content' }
          ],
          definitionOfDone: 'Live landing page with working email capture, automated email sequence active, and link in bio optimized for conversions',
          killRule: 'If your email capture rate is below 2% after 100 visitors, or if building the funnel takes more than 10 hours, consider using simpler tools or templates',
          timeEstimate: '4-6 hours',
          tutorialLink: 'simple-funnel-setup',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['funnel', 'email-marketing', 'automation'],
          pivotLinks: [
            {
              id: 'content-to-subscription',
              title: 'Subscription Commerce',
              roadmapId: 'subscription-commerce',
              type: 'cheaper',
              description: 'Recurring revenue with predictable income streams',
              costSaving: '50% lower ad spend',
              difficulty: 'easier'
            },
            {
              id: 'content-to-ecommerce',
              title: 'E-commerce Microbrand',
              roadmapId: 'ecommerce-pod',
              type: 'faster',
              description: 'Physical products leverage existing audience faster',
              timeSaving: '1-2 weeks faster',
              difficulty: 'similar'
            }
          ]
        },
        {
          id: 'cc-monetize-2',
          title: 'Close 3 paid deals or 25 sales',
          whyThisMatters: 'Achieving your first sales validates your business model and provides social proof, testimonials, and revenue to reinvest in growth.',
          steps: [
            { id: 'cc-monetize-2-step-1', title: 'Promote your offer across all content channels', description: 'Create promotional content without being overly salesy' },
            { id: 'cc-monetize-2-step-2', title: 'Follow up with email subscribers and engaged followers', description: 'Personal outreach to warm leads who have shown interest' },
            { id: 'cc-monetize-2-step-3', title: 'Collect testimonials and case studies from customers', description: 'Document success stories to use in future marketing' }
          ],
          definitionOfDone: 'Either 3 service deals closed OR 25 digital product sales completed, with payment receipts and testimonials collected',
          killRule: 'If you spend more than $500 on ads or 4 weeks promoting without a single sale, reassess your offer pricing, messaging, or target audience',
          timeEstimate: '2-3 weeks of consistent promotion',
          tutorialLink: 'first-sales-strategy',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['sales', 'promotion', 'testimonials']
        }
      ]
    },
    {
      id: 'cc-scale',
      title: 'Scale',
      description: 'Systematize content creation and expand reach',
      icon: '📈',
      order: 5,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'cc-scale-1',
          title: 'Systematize batching and scheduling',
          whyThisMatters: 'Efficient content systems free up time for high-value activities like relationship building and business development.',
          steps: [
            { id: 'cc-scale-1-step-1', title: 'Create monthly content batching schedule', description: 'Plan dedicated days for ideation, creation, editing, and scheduling' },
            { id: 'cc-scale-1-step-2', title: 'Develop content templates and SOPs', description: 'Document your process so you can maintain quality and delegate later' },
            { id: 'cc-scale-1-step-3', title: 'Set up advanced scheduling and analytics tools', description: 'Invest in better tools that provide insights and save time' }
          ],
          definitionOfDone: 'Complete content production system documented with 30 days of content planned and scheduled in advance',
          timeEstimate: '6-8 hours',
          tutorialLink: 'content-systematization',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['systems', 'automation', 'efficiency']
        },
        {
          id: 'cc-scale-2',
          title: 'Expand to new platforms and revenue streams',
          whyThisMatters: 'Diversifying platforms and income sources reduces risk and multiplies your earning potential across different audience segments.',
          steps: [
            { id: 'cc-scale-2-step-1', title: 'Research and launch on 1-2 new platforms', description: 'Adapt your content strategy for platforms like YouTube, Pinterest, or LinkedIn' },
            { id: 'cc-scale-2-step-2', title: 'Add complementary revenue streams', description: 'Consider affiliate marketing, sponsored content, or coaching services' },
            { id: 'cc-scale-2-step-3', title: 'Cross-promote between all platforms', description: 'Create platform-specific content that drives traffic to your primary channels' }
          ],
          definitionOfDone: 'Active presence on 2 new platforms with cross-promotion strategy, plus 1 new revenue stream generating income',
          timeEstimate: '3-4 weeks',
          tutorialLink: 'platform-expansion',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['expansion', 'diversification', 'revenue-streams']
        }
      ]
    },
    {
      id: 'cc-automate',
      title: 'Automate',
      description: 'Build passive income and scale with team',
      icon: '🤖',
      order: 6,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'cc-automate-1',
          title: 'Launch evergreen course or membership',
          whyThisMatters: 'Evergreen products generate passive income while you sleep, allowing you to scale beyond trading time for money.',
          steps: [
            { id: 'cc-automate-1-step-1', title: 'Develop comprehensive course or membership content', description: 'Create valuable, structured learning experience based on your expertise' },
            { id: 'cc-automate-1-step-2', title: 'Build automated sales funnel with webinars or challenges', description: 'Create systems that sell your course without manual intervention' },
            { id: 'cc-automate-1-step-3', title: 'Set up customer support and community systems', description: 'Ensure great experience with minimal ongoing time investment' }
          ],
          definitionOfDone: 'Live evergreen course/membership with automated enrollment, community platform, and support systems generating recurring revenue',
          timeEstimate: '4-6 weeks',
          tutorialLink: 'evergreen-course-creation',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['passive-income', 'courses', 'automation']
        },
        {
          id: 'cc-automate-2',
          title: 'Hire virtual assistant and build team',
          whyThisMatters: 'Delegating routine tasks allows you to focus on strategy and high-value activities, multiplying your impact and income potential.',
          steps: [
            { id: 'cc-automate-2-step-1', title: 'Document all recurring tasks and create SOPs', description: 'Create detailed processes for content creation, editing, and community management' },
            { id: 'cc-automate-2-step-2', title: 'Hire and train virtual assistant or editor', description: 'Find reliable team member and provide comprehensive training' },
            { id: 'cc-automate-2-step-3', title: 'Implement project management and quality control systems', description: 'Set up workflows that maintain quality while increasing output' }
          ],
          definitionOfDone: 'Virtual assistant successfully handling 50%+ of routine tasks with quality standards maintained and documented workflows',
          timeEstimate: '3-4 weeks',
          tutorialLink: 'team-building-guide',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['delegation', 'team-building', 'systems']
        }
      ]
    }
  ],
  sevenDaySprint: [
    { day: 1, title: 'Niche + Pillars', description: 'Define your niche and content pillars', tasks: ['cc-map-1', 'cc-map-2'] },
    { day: 2, title: 'Brand Kit + Profile Setup', description: 'Create brand identity and optimize profiles', tasks: ['cc-setup-1'] },
    { day: 3, title: 'Record 10', description: 'Batch record 10 pieces of content', tasks: ['cc-setup-2'] },
    { day: 4, title: 'Edit 10', description: 'Edit and prepare all content for publishing', tasks: [] },
    { day: 5, title: 'Publish 5', description: 'Start daily posting - publish first 5 pieces', tasks: ['cc-launch-1'] },
    { day: 6, title: 'Publish 5', description: 'Continue posting - publish remaining pieces', tasks: ['cc-launch-1'] },
    { day: 7, title: 'Build Offer Page', description: 'Create first offer and capture form', tasks: ['cc-launch-3'] }
  ],
  tutorials: [
    { id: 'niche-picker-worksheet', title: 'Niche Picker Worksheet', type: 'template', duration: '15 min', description: 'Interactive worksheet to find your profitable niche' },
    { id: 'content-pillars-cheat-sheet', title: 'Content Pillars Cheat Sheet', type: 'document', duration: '5 min read', description: 'Framework for creating balanced content strategy' },
    { id: 'batch-recording-setup', title: 'Batch Recording Setup', type: 'video', duration: '60-90 sec', description: 'Quick setup guide for efficient content creation' },
    { id: 'simple-funnel-setup', title: 'Simple Funnel in 30 Minutes', type: 'video', duration: '30 min', description: 'Step-by-step funnel creation tutorial' },
    { id: 'first-sales-strategy', title: 'First Sales CTA Scripts', type: 'template', duration: '10 min', description: 'Proven scripts for promoting your offers' }
  ]
};

// Roadmap 2: E-commerce Microbrand (Print-on-Demand) - COMPLETE
export const ECOMMERCE_POD_ROADMAP: Roadmap = {
  id: 'ecommerce-pod',
  title: 'E-commerce Microbrand',
  subtitle: 'Print-on-demand business for creative entrepreneurs',
  description: 'Build a profitable print-on-demand brand targeting specific micro-niches with creative designs',
  targetAudience: ['Millennials', 'Women', 'Minority founders'],
  estimatedTimeToRevenue: '1-3 weeks',
  difficulty: 'beginner',
  icon: '🛍️',
  color: 'from-green-500 to-blue-500',
  proUnlockPoint: 4,
  tags: ['ecommerce', 'print-on-demand', 'design', 'dropshipping'],
  milestones: [
    {
      id: 'pod-map',
      title: 'Map',
      description: 'Research profitable micro-niches and validate demand',
      icon: '🗺️',
      order: 1,
      xpReward: 200,
      isUnlocked: true,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'pod-map-1',
          title: 'Find 3 micro-niches',
          whyThisMatters: 'Micro-niches have less competition and more passionate customers willing to pay premium prices for targeted designs.',
          steps: [
            { id: 'pod-map-1-step-1', title: 'Research trending topics and passionate communities', description: 'Use Google Trends, Reddit, Facebook groups to find engaged niches' },
            { id: 'pod-map-1-step-2', title: 'Analyze competitor products and pricing', description: 'Study successful POD stores in potential niches' },
            { id: 'pod-map-1-step-3', title: 'Select 3 niches with good demand and low saturation', description: 'Choose niches you can create authentic designs for' }
          ],
          definitionOfDone: '3 validated micro-niches documented with target audience research, competitor analysis, and estimated market size',
          timeEstimate: '3-4 hours',
          tutorialLink: 'niche-validation-checklist',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['research', 'niches', 'validation']
        },
        {
          id: 'pod-map-2',
          title: 'Validate with trend and keyword checks',
          whyThisMatters: 'Data-driven validation reduces risk and helps you focus on niches with real profit potential.',
          steps: [
            { id: 'pod-map-2-step-1', title: 'Check search volume for niche keywords', description: 'Use keyword tools to verify people are searching for niche topics' },
            { id: 'pod-map-2-step-2', title: 'Analyze social media engagement in niche communities', description: 'Look for active, engaged communities that buy products' },
            { id: 'pod-map-2-step-3', title: 'Validate design ideas with target audience', description: 'Survey or test concepts with potential customers' }
          ],
          definitionOfDone: 'Validation report showing search volumes, engagement data, and feedback from 10+ potential customers for each niche',
          timeEstimate: '2-3 hours',
          tutorialLink: 'market-validation-toolkit',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['validation', 'keywords', 'market-research']
        }
      ]
    },
    {
      id: 'pod-setup',
      title: 'Setup',
      description: 'Create designs and build your online store',
      icon: '⚙️',
      order: 2,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'pod-setup-1',
          title: 'Create 10 designs per niche',
          whyThisMatters: 'Multiple designs give customers choice and help you test what resonates, while variety increases average order value.',
          steps: [
            { id: 'pod-setup-1-step-1', title: 'Develop design concepts for each niche', description: 'Create mood boards and sketch initial design ideas' },
            { id: 'pod-setup-1-step-2', title: 'Design 10 variations per niche using design tools', description: 'Use Canva, Photoshop, or Procreate to create print-ready designs' },
            { id: 'pod-setup-1-step-3', title: 'Optimize designs for print specifications', description: 'Ensure correct dimensions, resolution, and color modes' }
          ],
          definitionOfDone: '30 print-ready designs (10 per niche) optimized for t-shirts, hoodies, and accessories with proper file formats',
          timeEstimate: '8-12 hours',
          tutorialLink: 'design-creation-guide',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: false,
          category: 'free',
          tags: ['design', 'creativity', 'product-creation']
        },
        {
          id: 'pod-setup-2',
          title: 'Spin up storefront with 10 products',
          whyThisMatters: 'A professional storefront builds trust and provides the foundation for processing orders and payments.',
          steps: [
            { id: 'pod-setup-2-step-1', title: 'Choose and set up e-commerce platform', description: 'Select Shopify, Etsy, or Amazon to host your store' },
            { id: 'pod-setup-2-step-2', title: 'Connect print-on-demand fulfillment service', description: 'Integrate with Printful, Printify, or similar service' },
            { id: 'pod-setup-2-step-3', title: 'Upload 10 best designs as test products', description: 'Create product listings with compelling descriptions and mockups' }
          ],
          definitionOfDone: 'Live storefront with 10 products, working payment processing, and automated fulfillment ready for orders',
          timeEstimate: '4-6 hours',
          tutorialLink: 'store-setup-checklist',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: false,
          category: 'free',
          tags: ['ecommerce', 'setup', 'fulfillment']
        }
      ]
    },
    {
      id: 'pod-launch',
      title: 'Launch',
      description: 'Create marketing content and drive first sales',
      icon: '🚀',
      order: 3,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 3,
      tasks: [
        {
          id: 'pod-launch-1',
          title: 'Shoot 20 pieces of creative',
          whyThisMatters: 'High-quality marketing content showcases your products in lifestyle contexts and drives purchase decisions.',
          steps: [
            { id: 'pod-launch-1-step-1', title: 'Plan creative shoots for each niche', description: 'Develop concepts that show products in use by target customers' },
            { id: 'pod-launch-1-step-2', title: 'Photograph and film product content', description: 'Create lifestyle photos, unboxing videos, and product demos' },
            { id: 'pod-launch-1-step-3', title: 'Edit content for different social platforms', description: 'Adapt content for Instagram, TikTok, Facebook, and Pinterest formats' }
          ],
          definitionOfDone: '20 pieces of marketing content created and optimized for social media platforms',
          timeEstimate: '6-8 hours',
          tutorialLink: 'creative-storyboard-guide',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['content-creation', 'photography', 'marketing']
        },
        {
          id: 'pod-launch-2',
          title: 'Post daily content for 1 week',
          whyThisMatters: 'Consistent posting builds awareness and engagement while the algorithm learns your audience preferences.',
          steps: [
            { id: 'pod-launch-2-step-1', title: 'Create posting schedule across platforms', description: 'Plan strategic posting times for maximum reach' },
            { id: 'pod-launch-2-step-2', title: 'Engage with niche communities and hashtags', description: 'Participate in conversations and build relationships with potential customers' },
            { id: 'pod-launch-2-step-3', title: 'Track engagement and adjust content strategy', description: 'Monitor which content performs best and optimize accordingly' }
          ],
          definitionOfDone: '7 days of consistent posting completed with engagement data tracked and strategy optimizations identified',
          timeEstimate: '1 hour daily for 7 days',
          tutorialLink: 'social-media-launch-plan',
          xpReward: 25,
          difficulty: 'standard',
          isProLocked: false,
          category: 'free',
          tags: ['social-media', 'engagement', 'consistency']
        },
        {
          id: 'pod-launch-3',
          title: 'Turn on $10/day ads to best content',
          whyThisMatters: 'Small ad budget tests help you identify winning content and scale successful campaigns cost-effectively.',
          steps: [
            { id: 'pod-launch-3-step-1', title: 'Identify top 3 performing organic posts', description: 'Select content with highest engagement rates for ad promotion' },
            { id: 'pod-launch-3-step-2', title: 'Set up targeted ad campaigns', description: 'Create Facebook/Instagram ads targeting niche interests and lookalike audiences' },
            { id: 'pod-launch-3-step-3', title: 'Monitor ad performance and optimize', description: 'Track cost per click, conversion rates, and adjust targeting/creative' }
          ],
          definitionOfDone: 'Ad campaigns running with $10/day budget, performance tracking setup, and optimization plan documented',
          timeEstimate: '3-4 hours',
          tutorialLink: 'ten-dollar-ad-strategy',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: false,
          category: 'free',
          tags: ['advertising', 'paid-social', 'optimization']
        }
      ]
    },
    {
      id: 'pod-monetize',
      title: 'Monetize',
      description: 'Optimize pricing and conversion systems',
      icon: '💰',
      order: 4,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'pod-monetize-1',
          title: 'A/B test pricing and urgency',
          whyThisMatters: 'Optimized pricing and urgency tactics can significantly increase conversion rates and average order value.',
          steps: [
            { id: 'pod-monetize-1-step-1', title: 'Test different price points for top products', description: 'Compare conversion rates at various price levels' },
            { id: 'pod-monetize-1-step-2', title: 'Add urgency elements to product pages', description: 'Test limited-time offers, countdown timers, and stock scarcity' },
            { id: 'pod-monetize-1-step-3', title: 'Implement bundle offers and upsells', description: 'Create product bundles and suggest related items at checkout' }
          ],
          definitionOfDone: 'Pricing optimization completed with 10%+ increase in conversion rate and average order value documented',
          timeEstimate: '4-6 hours',
          tutorialLink: 'conversion-optimization-guide',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['pricing', 'conversion-optimization', 'testing']
        },
        {
          id: 'pod-monetize-2',
          title: 'Scale winning ads to $50/day',
          whyThisMatters: 'Scaling successful ad campaigns multiplies your reach and revenue while maintaining profitable unit economics.',
          steps: [
            { id: 'pod-monetize-2-step-1', title: 'Identify ads with positive ROI', description: 'Calculate return on ad spend and select profitable campaigns' },
            { id: 'pod-monetize-2-step-2', title: 'Gradually increase budgets on winning campaigns', description: 'Scale successful ads incrementally to maintain performance' },
            { id: 'pod-monetize-2-step-3', title: 'Create similar audiences and expand targeting', description: 'Use successful campaigns to find new customer segments' }
          ],
          definitionOfDone: 'Successful ads scaled to $50/day spend with maintained or improved ROAS and documented scaling strategy',
          timeEstimate: '2-3 weeks of optimization',
          tutorialLink: 'kill-scale-framework',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['scaling', 'advertising', 'roi-optimization']
        }
      ]
    },
    {
      id: 'pod-scale',
      title: 'Scale',
      description: 'Expand product lines and marketing channels',
      icon: '📈',
      order: 5,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'pod-scale-1',
          title: 'Expand to new product categories',
          whyThisMatters: 'Diversifying product offerings reduces risk and provides more opportunities to serve existing customers.',
          steps: [
            { id: 'pod-scale-1-step-1', title: 'Research complementary product categories', description: 'Identify new product types that appeal to your existing customers' },
            { id: 'pod-scale-1-step-2', title: 'Test new products with existing audience', description: 'Launch 5-10 new products in complementary categories' },
            { id: 'pod-scale-1-step-3', title: 'Scale successful new product lines', description: 'Expand winning categories and discontinue unsuccessful tests' }
          ],
          definitionOfDone: 'Successfully launched 2+ new product categories with positive ROI and customer feedback',
          timeEstimate: '2-3 weeks',
          tutorialLink: 'product-expansion-guide',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['expansion', 'diversification', 'product-development']
        },
        {
          id: 'pod-scale-2',
          title: 'Build email marketing automation',
          whyThisMatters: 'Email marketing provides the highest ROI of any marketing channel and creates a owned audience you can market to repeatedly.',
          steps: [
            { id: 'pod-scale-2-step-1', title: 'Set up email capture and welcome series', description: 'Create lead magnets and automated welcome email sequences' },
            { id: 'pod-scale-2-step-2', title: 'Implement abandoned cart recovery', description: 'Set up automated emails to recover lost sales' },
            { id: 'pod-scale-2-step-3', title: 'Create regular promotional email campaigns', description: 'Send weekly newsletters with new products and special offers' }
          ],
          definitionOfDone: 'Email list growing by 100+ subscribers weekly, automated sequences achieving 25%+ open rates and driving 15%+ of revenue',
          timeEstimate: '6-8 hours setup + ongoing management',
          tutorialLink: 'email-automation-setup',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['email-marketing', 'automation', 'customer-retention']
        }
      ]
    },
    {
      id: 'pod-automate',
      title: 'Automate',
      description: 'Systematize operations and build passive income',
      icon: '🤖',
      order: 6,
      xpReward: 200,
      isUnlocked: false,
      completedTasks: 0,
      totalTasks: 2,
      tasks: [
        {
          id: 'pod-automate-1',
          title: 'Automate fulfillment and support',
          whyThisMatters: 'Automated systems reduce manual work and errors while providing consistent customer experience that scales.',
          steps: [
            { id: 'pod-automate-1-step-1', title: 'Set up automated order processing', description: 'Connect store to fulfillment partners with automatic order routing' },
            { id: 'pod-automate-1-step-2', title: 'Create customer service chatbot and FAQ', description: 'Automate common customer inquiries and support requests' },
            { id: 'pod-automate-1-step-3', title: 'Implement inventory and quality monitoring', description: 'Set up alerts for out-of-stock items and quality issues' }
          ],
          definitionOfDone: '80%+ of orders processed automatically, customer service response time under 2 hours, inventory alerts functioning',
          timeEstimate: '8-10 hours',
          tutorialLink: 'fulfillment-automation',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['automation', 'fulfillment', 'customer-service']
        },
        {
          id: 'pod-automate-2',
          title: 'Build design team and scale creation',
          whyThisMatters: 'A team of designers allows you to test more designs, enter new niches faster, and scale beyond your personal capacity.',
          steps: [
            { id: 'pod-automate-2-step-1', title: 'Hire 2-3 freelance designers', description: 'Find designers who understand your style and can create in your profitable niches' },
            { id: 'pod-automate-2-step-2', title: 'Create design brief templates and workflows', description: 'Systematize the design creation process with clear guidelines and approval workflows' },
            { id: 'pod-automate-2-step-3', title: 'Implement design testing and launch pipeline', description: 'Create systematic approach to test new designs and scale winners' }
          ],
          definitionOfDone: 'Team producing 20+ new designs weekly, 50%+ design approval rate, new product launch pipeline operational',
          timeEstimate: '2-3 weeks',
          tutorialLink: 'design-team-management',
          xpReward: 40,
          difficulty: 'hard',
          isProLocked: true,
          category: 'pro',
          tags: ['team-building', 'delegation', 'scaling']
        }
      ]
    }
  ],
  sevenDaySprint: [
    { day: 1, title: 'Niches + Validate', description: 'Research and validate 3 micro-niches', tasks: ['pod-map-1', 'pod-map-2'] },
    { day: 2, title: '10 Designs', description: 'Create initial design concepts and variations', tasks: ['pod-setup-1'] },
    { day: 3, title: 'Store Shell', description: 'Set up store platform and basic configuration', tasks: ['pod-setup-2'] },
    { day: 4, title: 'Products Live', description: 'Upload products and test checkout process', tasks: [] },
    { day: 5, title: 'Creative Pack', description: 'Create product mockups and marketing materials', tasks: ['pod-launch-1'] },
    { day: 6, title: 'Post + Ads On', description: 'Launch social media and start test ads', tasks: ['pod-launch-2', 'pod-launch-3'] },
    { day: 7, title: 'Review and Prune', description: 'Analyze performance and optimize', tasks: [] }
  ],
  tutorials: [
    { id: 'niche-validation-checklist', title: 'Niche Validation Quick Checks', type: 'document', duration: '10 min read', description: 'Fast validation framework for POD niches' },
    { id: 'store-setup-checklist', title: 'Store Setup Checklist', type: 'template', duration: '15 min', description: 'Step-by-step store configuration guide' },
    { id: 'creative-storyboard-guide', title: 'Creative Storyboard for 6-sec Hooks', type: 'video', duration: '8 min', description: 'Create engaging short-form video content' },
    { id: 'ten-dollar-ad-strategy', title: '$10 Per Day Test Plan', type: 'template', duration: '12 min', description: 'Low-budget ad testing framework' },
    { id: 'kill-scale-framework', title: 'Kill or Scale Rules', type: 'document', duration: '6 min read', description: 'Data-driven decision framework for scaling' }
  ]
};

// Import additional roadmaps
import { 
  VA_REMOTE_SUPPORT_ROADMAP
} from './AdditionalRoadmaps';

// Import new roadmaps
import {
  DROPSHIPPING_ECOMMERCE_ROADMAP,
  BEAUTY_WELLNESS_ROADMAP,
  FOOD_TRUCK_ROADMAP,
  JEWELRY_LUXURY_ROADMAP,
  SUBSCRIPTION_BOX_ROADMAP
} from './NewRoadmaps';

// Export all roadmaps
export const ALL_ROADMAPS: Roadmap[] = [
  CONTENT_CREATION_ROADMAP,
  ECOMMERCE_POD_ROADMAP,
  VA_REMOTE_SUPPORT_ROADMAP,
  DROPSHIPPING_ECOMMERCE_ROADMAP,
  BEAUTY_WELLNESS_ROADMAP,
  FOOD_TRUCK_ROADMAP,
  JEWELRY_LUXURY_ROADMAP,
  SUBSCRIPTION_BOX_ROADMAP
];