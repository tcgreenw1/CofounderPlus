/**
 * User Data Context System
 * Gathers comprehensive user data to provide AI with complete context
 */

export interface UserDataContext {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  currentBusiness?: {
    id: string;
    name: string;
    industry: string;
    description: string;
    stage: string;
  };
  businesses: Array<{
    id: string;
    name: string;
    industry: string;
    description: string;
    stage: string;
  }>;
  financialData: FinancialDataSummary;
  roadmapProgress: RoadmapProgressSummary;
  universityProgress: UniversityProgressSummary;
  dreamBoard: DreamBoardSummary;
  notes: NoteSummary[];
  lastActivityDate: string;
}

export interface FinancialDataSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  budgets: Array<{
    category: string;
    limit: number;
    spent: number;
    remaining: number;
  }>;
  recentTransactions: Array<{
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
  }>;
  monthlyTrends: {
    income: number[];
    expenses: number[];
    months: string[];
  };
}

export interface RoadmapProgressSummary {
  currentRoadmap?: {
    id: string;
    name: string;
    industry: string;
    totalTasks: number;
    completedTasks: number;
    progressPercent: number;
  };
  recentlyCompleted: Array<{
    taskName: string;
    milestoneName: string;
    completedDate: string;
  }>;
  upcomingTasks: Array<{
    taskName: string;
    milestoneName: string;
    priority: string;
    estimatedTime: string;
  }>;
  milestoneProgress: Array<{
    name: string;
    completed: boolean;
    tasksCompleted: number;
    totalTasks: number;
  }>;
}

export interface UniversityProgressSummary {
  completedTutorials: Array<{
    title: string;
    track: string;
    completedDate: string;
    difficulty: string;
  }>;
  inProgressTutorials: Array<{
    title: string;
    track: string;
    progressPercent: number;
    stepsCompleted: number;
    totalSteps: number;
  }>;
  bookmarkedTutorials: Array<{
    title: string;
    track: string;
    category: string;
  }>;
  trackProgress: Array<{
    name: string;
    completedTutorials: number;
    totalTutorials: number;
    progressPercent: number;
  }>;
}

export interface DreamBoardSummary {
  totalGoals: number;
  completedGoals: number;
  goals: Array<{
    title: string;
    category: string;
    status: 'not-started' | 'in-progress' | 'completed';
    targetDate?: string;
    progress?: number;
  }>;
  recentAchievements: Array<{
    title: string;
    completedDate: string;
    category: string;
  }>;
}

export interface NoteSummary {
  id: string;
  content: string;
  category?: string;
  businessId: string;
  createdAt: string;
  tags?: string[];
}

/**
 * Fetches comprehensive user data context for AI
 */
export const getUserDataContext = async (
  userId: string,
  businessId?: string,
  accessToken?: string
): Promise<UserDataContext | null> => {
  try {
    const { projectId, publicAnonKey } = await import('./supabase/info');
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${publicAnonKey}`;

    // Fetch user data context from our server
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/user-data-context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        userId,
        businessId
      })
    });

    if (!response.ok) {
      console.error('Failed to fetch user data context:', response.status);
      return null;
    }

    const data = await response.json();
    return data.context;
  } catch (error) {
    console.error('Error fetching user data context:', error);
    return null;
  }
};

/**
 * Formats user data context for AI consumption
 */
export const formatUserDataForAI = (context: UserDataContext): string => {
  const { 
    user, 
    currentBusiness, 
    businesses, 
    financialData, 
    roadmapProgress, 
    universityProgress, 
    dreamBoard, 
    notes 
  } = context;

  let formatted = `# User Business Context\n\n`;

  // User Info
  formatted += `## User: ${user.name || user.email}\n`;
  if (businesses.length > 1) {
    formatted += `**Managing ${businesses.length} businesses:**\n`;
    businesses.forEach(biz => {
      formatted += `• ${biz.name} (${biz.industry}) - ${biz.stage}\n`;
    });
  }

  // Current Business Context
  if (currentBusiness) {
    formatted += `\n## Current Business: ${currentBusiness.name}\n`;
    formatted += `**Industry:** ${currentBusiness.industry}\n`;
    formatted += `**Stage:** ${currentBusiness.stage}\n`;
    formatted += `**Description:** ${currentBusiness.description}\n\n`;
  }

  // Financial Summary
  formatted += `## Financial Overview\n`;
  formatted += `**Net Income:** $${financialData.netIncome.toLocaleString()} (Income: $${financialData.totalIncome.toLocaleString()}, Expenses: $${financialData.totalExpenses.toLocaleString()})\n\n`;
  
  if (financialData.budgets.length > 0) {
    formatted += `**Budget Status:**\n`;
    financialData.budgets.forEach(budget => {
      const status = budget.remaining >= 0 ? '✅' : '⚠️';
      formatted += `${status} ${budget.category}: $${budget.spent}/$${budget.limit} (${budget.remaining >= 0 ? 'under' : 'over'} by $${Math.abs(budget.remaining)})\n`;
    });
    formatted += `\n`;
  }

  if (financialData.recentTransactions.length > 0) {
    formatted += `**Recent Financial Activity:**\n`;
    financialData.recentTransactions.slice(0, 5).forEach(tx => {
      const symbol = tx.type === 'income' ? '+' : '-';
      formatted += `${symbol}$${tx.amount} - ${tx.category}: ${tx.description}\n`;
    });
    formatted += `\n`;
  }

  // Roadmap Progress
  if (roadmapProgress.currentRoadmap) {
    const roadmap = roadmapProgress.currentRoadmap;
    formatted += `## Business Roadmap Progress\n`;
    formatted += `**Current Roadmap:** ${roadmap.name} (${roadmap.industry})\n`;
    formatted += `**Progress:** ${roadmap.completedTasks}/${roadmap.totalTasks} tasks (${roadmap.progressPercent}%)\n\n`;

    if (roadmapProgress.recentlyCompleted.length > 0) {
      formatted += `**Recently Completed:**\n`;
      roadmapProgress.recentlyCompleted.slice(0, 3).forEach(task => {
        formatted += `✅ ${task.taskName} (${task.milestoneName})\n`;
      });
      formatted += `\n`;
    }

    if (roadmapProgress.upcomingTasks.length > 0) {
      formatted += `**Upcoming Tasks:**\n`;
      roadmapProgress.upcomingTasks.slice(0, 3).forEach(task => {
        formatted += `📝 ${task.taskName} (${task.milestoneName}) - ${task.estimatedTime}\n`;
      });
      formatted += `\n`;
    }
  }

  // University Progress
  if (universityProgress.completedTutorials.length > 0 || universityProgress.inProgressTutorials.length > 0) {
    formatted += `## Learning Progress (University)\n`;
    
    if (universityProgress.completedTutorials.length > 0) {
      formatted += `**Completed Tutorials:** ${universityProgress.completedTutorials.length}\n`;
      universityProgress.completedTutorials.slice(0, 3).forEach(tutorial => {
        formatted += `✅ ${tutorial.title} (${tutorial.track})\n`;
      });
      formatted += `\n`;
    }

    if (universityProgress.inProgressTutorials.length > 0) {
      formatted += `**Currently Learning:**\n`;
      universityProgress.inProgressTutorials.forEach(tutorial => {
        formatted += `📚 ${tutorial.title} (${tutorial.progressPercent}% complete)\n`;
      });
      formatted += `\n`;
    }
  }

  // Dream Board Goals
  if (dreamBoard.totalGoals > 0) {
    formatted += `## Goals & Vision (Dream Board)\n`;
    formatted += `**Goals:** ${dreamBoard.completedGoals}/${dreamBoard.totalGoals} completed\n\n`;

    const activeGoals = dreamBoard.goals.filter(g => g.status !== 'completed').slice(0, 3);
    if (activeGoals.length > 0) {
      formatted += `**Active Goals:**\n`;
      activeGoals.forEach(goal => {
        const statusIcon = goal.status === 'in-progress' ? '🔄' : '⭐';
        formatted += `${statusIcon} ${goal.title} (${goal.category})\n`;
      });
      formatted += `\n`;
    }
  }

  // Recent Notes
  if (notes.length > 0) {
    formatted += `## Recent Notes & Ideas\n`;
    notes.slice(0, 3).forEach(note => {
      const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
      formatted += `• ${preview}\n`;
    });
    formatted += `\n`;
  }

  formatted += `## AI Guidance Notes\n`;
  formatted += `When providing advice:\n`;
  formatted += `1. Reference this actual data rather than giving generic advice\n`;
  formatted += `2. Suggest specific next steps based on current progress\n`;
  formatted += `3. Point to relevant features in our app for implementation\n`;
  formatted += `4. Consider the business stage and industry context\n`;
  formatted += `5. Build upon existing goals, progress, and financial situation\n`;

  return formatted;
};

/**
 * Helper to get quick financial insights for AI
 */
export const getFinancialInsights = (financialData: FinancialDataSummary): string[] => {
  const insights: string[] = [];

  if (financialData.netIncome < 0) {
    insights.push("Currently operating at a loss - focus on revenue growth or expense reduction");
  } else if (financialData.netIncome > 0) {
    insights.push("Profitable operations - consider reinvestment strategies");
  }

  const overBudgetCategories = financialData.budgets.filter(b => b.remaining < 0);
  if (overBudgetCategories.length > 0) {
    insights.push(`Over budget in: ${overBudgetCategories.map(b => b.category).join(', ')}`);
  }

  return insights;
};

/**
 * Helper to get roadmap recommendations
 */
export const getRoadmapRecommendations = (roadmapProgress: RoadmapProgressSummary): string[] => {
  const recommendations: string[] = [];

  if (roadmapProgress.currentRoadmap) {
    const progress = roadmapProgress.currentRoadmap.progressPercent;
    
    if (progress < 25) {
      recommendations.push("Early stage - focus on foundational tasks and planning");
    } else if (progress < 50) {
      recommendations.push("Building momentum - maintain consistent progress");
    } else if (progress < 75) {
      recommendations.push("Good progress - prepare for scaling challenges");
    } else {
      recommendations.push("Nearing completion - plan for next phase");
    }
  }

  return recommendations;
};