/**
 * App Knowledge System
 * Provides comprehensive information about our app's features, routes, and capabilities
 * This context helps the AI understand what we have available and direct users appropriately
 */

export interface AppFeature {
  id: string;
  name: string;
  path: string;
  description: string;
  category: string;
  userType: 'all' | 'free' | 'pro';
  status: 'active' | 'beta' | 'coming-soon';
}

export interface AppKnowledgeContext {
  features: AppFeature[];
  routes: RouteInfo[];
  capabilities: AppCapability[];
  integrations: IntegrationInfo[];
  lastUpdated: string;
}

export interface RouteInfo {
  path: string;
  name: string;
  description: string;
  requiresAuth: boolean;
  requiresPro: boolean;
}

export interface AppCapability {
  name: string;
  description: string;
  examples: string[];
}

export interface IntegrationInfo {
  name: string;
  status: 'active' | 'planned';
  description: string;
}

/**
 * Core App Features and Capabilities
 */
export const getAppKnowledgeContext = (): AppKnowledgeContext => {
  const features: AppFeature[] = [
    // Core Business Management
    {
      id: 'dashboard',
      name: 'Main Dashboard',
      path: '/dashboard',
      description: 'Central hub showing business overview, key metrics, recent activity, and quick actions',
      category: 'core',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'business-management',
      name: 'Business Management',
      path: '/dashboard',
      description: 'Create, switch between, and manage multiple businesses. Each business has separate data and context.',
      category: 'core',
      userType: 'all',
      status: 'active'
    },

    // Financial Management
    {
      id: 'finance-operations',
      name: 'Finance Operations',
      path: '/operations/finance',
      description: 'Comprehensive financial management including income tracking, expense management, budgets, invoices, financial projections, and P&L statements',
      category: 'operations',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'budget-management',
      name: 'Budget Management',
      path: '/operations/finance',
      description: 'Create and track budgets by category, monitor spending, set budget limits and get alerts',
      category: 'finance',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'transaction-tracking',
      name: 'Transaction Tracking',
      path: '/operations/finance',
      description: 'Track income and expenses, categorize transactions, add notes and attachments',
      category: 'finance',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'financial-projections',
      name: 'Financial Projections',
      path: '/operations/finance',
      description: 'Create financial forecasts, project future revenue and expenses, scenario planning',
      category: 'finance',
      userType: 'pro',
      status: 'active'
    },

    // Roadmap & Planning
    {
      id: 'roadmap',
      name: 'Roadmap System',
      path: '/roadmap-test',
      description: 'Industry-specific roadmaps with tasks, milestones, tutorials, and progress tracking. Includes pre-built roadmaps for various industries.',
      category: 'planning',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'dream-board',
      name: 'Dream Board',
      path: '/dream-board',
      description: 'Visual goal setting and aspiration tracking. Create vision boards with images, goals, and progress tracking.',
      category: 'planning',
      userType: 'all',
      status: 'active'
    },

    // Learning & Education
    {
      id: 'university',
      name: 'Cofounder University',
      path: '/university',
      description: 'Comprehensive learning platform with tutorials, tracks, progress tracking, bookmarks, and step-by-step guides across Marketing, Sales, Customer Success, and Operations.',
      category: 'education',
      userType: 'all',
      status: 'active'
    },

    // Operations Management
    {
      id: 'operations',
      name: 'Operations Hub',
      path: '/operations',
      description: 'Central operations management including product, marketing, sales, finance, and HR operations',
      category: 'operations',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'product-operations',
      name: 'Product Operations',
      path: '/operations/product',
      description: 'Product management, feature tracking, user feedback, and product analytics',
      category: 'operations',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'marketing-operations',
      name: 'Marketing Operations',
      path: '/operations/marketing',
      description: 'Marketing campaign management, content planning, and marketing analytics',
      category: 'operations',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'sales-operations',
      name: 'Sales Operations',
      path: '/operations/sales',
      description: 'Sales pipeline management, lead tracking, and sales analytics',
      category: 'operations',
      userType: 'all',
      status: 'active'
    },
    {
      id: 'hr-operations',
      name: 'HR Operations',
      path: '/operations/hr',
      description: 'Human resources management, team member tracking, and organizational tools',
      category: 'operations',
      userType: 'pro',
      status: 'active'
    },

    // AI & Assistance
    {
      id: 'cofounder-ai',
      name: 'Cofounder AI Assistant',
      path: '/cofounder',
      description: 'AI-powered business assistant that provides personalized guidance, answers questions, and helps with strategic decisions. Context-aware of your business data.',
      category: 'ai',
      userType: 'all',
      status: 'active'
    },

    // Assessment & Analysis
    {
      id: 'industry-quiz',
      name: 'Industry Match Quiz',
      path: '/quiz',
      description: 'Intelligent quiz system that analyzes your situation and recommends the best industry/business model fit',
      category: 'assessment',
      userType: 'all',
      status: 'active'
    },

    // Data & Notes
    {
      id: 'notes-system',
      name: 'Business Notes',
      path: '/dashboard',
      description: 'Note-taking system integrated throughout the app for capturing ideas, meeting notes, and important information',
      category: 'productivity',
      userType: 'all',
      status: 'active'
    },

    // Community & Support
    {
      id: 'community',
      name: 'Community Hub',
      path: '/operations/community',
      description: 'Connect with other entrepreneurs, share experiences, and get peer support',
      category: 'community',
      userType: 'all',
      status: 'beta'
    },

    // Team Management
    {
      id: 'team-management',
      name: 'Team Management',
      path: '/dashboard',
      description: 'Invite team members, manage permissions, and collaborate on business activities',
      category: 'collaboration',
      userType: 'pro',
      status: 'active'
    }
  ];

  const routes: RouteInfo[] = [
    { path: '/dashboard', name: 'Dashboard', description: 'Main business dashboard', requiresAuth: true, requiresPro: false },
    { path: '/cofounder', name: 'AI Assistant', description: 'Chat with your AI cofounder', requiresAuth: true, requiresPro: false },
    { path: '/university', name: 'University', description: 'Learning platform', requiresAuth: true, requiresPro: false },
    { path: '/operations/finance', name: 'Finance', description: 'Financial management', requiresAuth: true, requiresPro: false },
    { path: '/operations/product', name: 'Product', description: 'Product management', requiresAuth: true, requiresPro: false },
    { path: '/operations/marketing', name: 'Marketing', description: 'Marketing operations', requiresAuth: true, requiresPro: false },
    { path: '/operations/sales', name: 'Sales', description: 'Sales operations', requiresAuth: true, requiresPro: false },
    { path: '/operations/hr', name: 'HR', description: 'Human resources', requiresAuth: true, requiresPro: true },
    { path: '/roadmap-test', name: 'Roadmap', description: 'Business roadmap planning', requiresAuth: true, requiresPro: false },
    { path: '/dream-board', name: 'Dream Board', description: 'Vision and goal setting', requiresAuth: true, requiresPro: false },
    { path: '/quiz', name: 'Industry Quiz', description: 'Find your best business fit', requiresAuth: true, requiresPro: false }
  ];

  const capabilities: AppCapability[] = [
    {
      name: 'Financial Tracking',
      description: 'Track income, expenses, budgets, and financial projections',
      examples: ['Add a new income entry', 'Create a marketing budget', 'Track monthly expenses', 'Generate P&L report']
    },
    {
      name: 'Roadmap Planning',
      description: 'Create and follow industry-specific business roadmaps',
      examples: ['Follow SaaS roadmap', 'Complete marketing milestones', 'Track business progress', 'Get task recommendations']
    },
    {
      name: 'Learning & Education',
      description: 'Access comprehensive business education through University',
      examples: ['Learn pricing strategies', 'Master sales techniques', 'Customer success tutorials', 'Marketing foundations']
    },
    {
      name: 'AI-Powered Guidance',
      description: 'Get personalized business advice and strategic recommendations',
      examples: ['Strategic planning advice', 'Problem-solving assistance', 'Industry-specific guidance', 'Data-driven insights']
    },
    {
      name: 'Multi-Business Management',
      description: 'Manage multiple businesses with separate contexts and data',
      examples: ['Switch between businesses', 'Compare business performance', 'Separate financial tracking', 'Independent roadmaps']
    },
    {
      name: 'Operations Management',
      description: 'Comprehensive business operations across all departments',
      examples: ['Product feature tracking', 'Marketing campaign management', 'Sales pipeline', 'HR team management']
    },
    {
      name: 'Goal Setting & Vision',
      description: 'Visual goal setting and aspiration tracking through Dream Board',
      examples: ['Create vision boards', 'Set business goals', 'Track aspirations', 'Visualize success']
    },
    {
      name: 'Progress Tracking',
      description: 'Monitor progress across all business activities and learning',
      examples: ['Roadmap completion', 'Tutorial progress', 'Financial goals', 'Milestone achievements']
    }
  ];

  const integrations: IntegrationInfo[] = [
    {
      name: 'Stripe',
      status: 'active',
      description: 'Payment processing and subscription management'
    },
    {
      name: 'OpenAI',
      status: 'active',
      description: 'AI assistant powered by GPT-4o for business guidance'
    },
    {
      name: 'Supabase',
      status: 'active',
      description: 'Database and authentication backend'
    },
    {
      name: 'File Uploads',
      status: 'active',
      description: 'Document and image upload capabilities'
    }
  ];

  return {
    features,
    routes,
    capabilities,
    integrations,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Generate a concise summary for AI context
 */
export const getAppSummaryForAI = (): string => {
  const context = getAppKnowledgeContext();
  
  return `# Cofounder App Features & Capabilities

## Core Features Available:
${context.features.map(f => `• **${f.name}** (${f.path}): ${f.description}`).join('\n')}

## Key Capabilities:
${context.capabilities.map(c => `• **${c.name}**: ${c.description}`).join('\n')}

## Navigation Paths:
${context.routes.map(r => `• ${r.path} - ${r.name}: ${r.description}${r.requiresPro ? ' (Pro required)' : ''}`).join('\n')}

## When helping users, always:
1. Direct them to existing features within our app rather than external tools
2. Mention specific paths they can navigate to
3. Reference their actual data when giving advice
4. Suggest relevant tutorials from University when applicable
5. Recommend appropriate operations sections for their needs

## App Context Notes:
- Users can manage multiple businesses with separate data contexts
- All financial data, roadmaps, and progress are tracked per business
- University provides comprehensive learning with progress tracking
- AI assistant (you) has access to user's actual business data for personalized advice
- Operations hub covers Product, Marketing, Sales, Finance, and HR management

## Notes System (Boards, Lists, Cards):
- Users have a Notes page with boards, lists, and cards for organization
- **CRITICAL: When users ask about their notes, boards, lists, or cards, you MUST call get_boards FIRST**
- After get_boards, call get_board_details to see what's inside each board
- Boards contain lists, lists contain cards
- You can create, read, update, and delete all of these
- Always check what exists before creating duplicates
- Reference their actual boards/lists when giving suggestions

## Roadmap System:
- Users have industry-specific roadmaps with milestones and tasks
- **CRITICAL: When giving strategic advice or discussing progress, call get_roadmap_progress to see their actual progress**
- Roadmaps have 6 milestones: Map, Setup, Launch, Monetize, Scale, Automate
- Each milestone has tasks worth different XP (15, 25, or 40 points)
- Users earn 200 XP for completing milestones
- You can see which tasks/milestones they've completed and where they are in their journey
- Call get_all_roadmaps to learn about different industries and recommend alternatives if needed
- Reference their specific progress when giving advice (e.g., "You've completed the Map milestone, now focus on Setup")
- Provide context-aware recommendations based on what they've accomplished
`;
};