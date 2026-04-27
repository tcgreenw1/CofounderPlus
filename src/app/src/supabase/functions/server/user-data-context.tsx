/**
 * User Data Context Endpoint
 * Gathers comprehensive user data for AI context
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';

export async function handleUserDataContext(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { userId, businessId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user info from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      console.error('Error fetching user:', userError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = userData.user;

    // Gather all user data in parallel
    const [
      businesses,
      financialData,
      roadmapData,
      universityData,
      dreamBoardData,
      notesData
    ] = await Promise.all([
      getUserBusinesses(userId),
      getFinancialData(userId, businessId),
      getRoadmapProgress(userId, businessId),
      getUniversityProgress(userId),
      getDreamBoardData(userId, businessId),
      getNotesData(userId, businessId)
    ]);

    // Find current business
    const currentBusiness = businessId ? businesses.find(b => b.id === businessId) : businesses[0];

    const context = {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name
      },
      currentBusiness,
      businesses,
      financialData,
      roadmapProgress: roadmapData,
      universityProgress: universityData,
      dreamBoard: dreamBoardData,
      notes: notesData,
      lastActivityDate: new Date().toISOString()
    };

    return new Response(JSON.stringify({ success: true, context }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error gathering user data context:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to gather user data context',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get user's businesses
 */
async function getUserBusinesses(userId: string) {
  try {
    const businesses = await kv.getByPrefix(`business_${userId}_`);
    return businesses.map(business => ({
      id: business.id,
      name: business.name,
      industry: business.industry,
      description: business.description,
      stage: business.stage || 'startup'
    }));
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return [];
  }
}

/**
 * Get financial data summary
 */
async function getFinancialData(userId: string, businessId?: string) {
  try {
    const businessKey = businessId || 'default';
    
    // Get transactions
    const transactions = await kv.getByPrefix(`transaction_${userId}_${businessKey}_`);
    
    // Get budgets
    const budgets = await kv.getByPrefix(`budget_${userId}_${businessKey}_`);

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    const recentTransactions = [];

    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }

      // Add to recent transactions (limit to last 10)
      if (recentTransactions.length < 10) {
        recentTransactions.push({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date
        });
      }
    }

    // Sort recent transactions by date
    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Process budgets
    const budgetSummary = [];
    for (const budget of budgets) {
      // Calculate spent amount for this budget category
      const categoryTransactions = transactions.filter(t => 
        t.type === 'expense' && t.category === budget.category
      );
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      budgetSummary.push({
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining: budget.limit - spent
      });
    }

    // Create monthly trends (simplified - last 6 months)
    const monthlyTrends = {
      income: [],
      expenses: [],
      months: []
    };

    // This could be enhanced to calculate actual monthly data
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      monthlyTrends.months.push(date.toLocaleString('default', { month: 'short' }));
      
      // Simplified calculation - could be enhanced with actual monthly data
      monthlyTrends.income.push(totalIncome / 6);
      monthlyTrends.expenses.push(totalExpenses / 6);
    }

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      budgets: budgetSummary,
      recentTransactions: recentTransactions.slice(0, 5),
      monthlyTrends
    };
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      budgets: [],
      recentTransactions: [],
      monthlyTrends: { income: [], expenses: [], months: [] }
    };
  }
}

/**
 * Get roadmap progress
 */
async function getRoadmapProgress(userId: string, businessId?: string) {
  try {
    const businessKey = businessId || 'default';
    
    // Get current roadmap
    const currentRoadmapData = await kv.get(`roadmap_current_${userId}_${businessKey}`);
    if (!currentRoadmapData) {
      return {
        currentRoadmap: null,
        recentlyCompleted: [],
        upcomingTasks: [],
        milestoneProgress: []
      };
    }

    // Get roadmap progress
    const progressData = await kv.getByPrefix(`roadmap_progress_${userId}_${businessKey}_`);
    
    let completedTasks = 0;
    let totalTasks = 0;
    const recentlyCompleted = [];
    const upcomingTasks = [];

    for (const progress of progressData) {
      totalTasks++;
      if (progress.completed) {
        completedTasks++;
        if (progress.completedAt) {
          recentlyCompleted.push({
            taskName: progress.taskName,
            milestoneName: progress.milestoneName,
            completedDate: progress.completedAt
          });
        }
      } else {
        upcomingTasks.push({
          taskName: progress.taskName,
          milestoneName: progress.milestoneName,
          priority: progress.priority || 'medium',
          estimatedTime: progress.estimatedTime || '30 minutes'
        });
      }
    }

    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      currentRoadmap: {
        id: currentRoadmapData.id,
        name: currentRoadmapData.name,
        industry: currentRoadmapData.industry,
        totalTasks,
        completedTasks,
        progressPercent
      },
      recentlyCompleted: recentlyCompleted.slice(0, 5),
      upcomingTasks: upcomingTasks.slice(0, 5),
      milestoneProgress: [] // Could be enhanced to calculate milestone progress
    };
  } catch (error) {
    console.error('Error fetching roadmap progress:', error);
    return {
      currentRoadmap: null,
      recentlyCompleted: [],
      upcomingTasks: [],
      milestoneProgress: []
    };
  }
}

/**
 * Get university progress
 */
async function getUniversityProgress(userId: string) {
  try {
    // Get tutorial progress
    const tutorialProgress = await kv.getByPrefix(`university_progress_${userId}_`);
    const bookmarks = await kv.getByPrefix(`university_bookmark_${userId}_`);

    const completedTutorials = [];
    const inProgressTutorials = [];
    const bookmarkedTutorials = [];

    for (const progress of tutorialProgress) {
      if (progress.completed) {
        completedTutorials.push({
          title: progress.tutorialTitle,
          track: progress.track || 'general',
          completedDate: progress.completedAt,
          difficulty: progress.difficulty || 'intermediate'
        });
      } else if (progress.percent > 0) {
        inProgressTutorials.push({
          title: progress.tutorialTitle,
          track: progress.track || 'general',
          progressPercent: progress.percent,
          stepsCompleted: progress.stepsCompleted || 0,
          totalSteps: progress.totalSteps || 1
        });
      }
    }

    for (const bookmark of bookmarks) {
      bookmarkedTutorials.push({
        title: bookmark.tutorialTitle,
        track: bookmark.track || 'general',
        category: bookmark.category || 'general'
      });
    }

    return {
      completedTutorials,
      inProgressTutorials,
      bookmarkedTutorials,
      trackProgress: [] // Could be enhanced to calculate track progress
    };
  } catch (error) {
    console.error('Error fetching university progress:', error);
    return {
      completedTutorials: [],
      inProgressTutorials: [],
      bookmarkedTutorials: [],
      trackProgress: []
    };
  }
}

/**
 * Get dream board data
 */
async function getDreamBoardData(userId: string, businessId?: string) {
  try {
    const businessKey = businessId || 'default';
    const dreamBoardItems = await kv.getByPrefix(`dreamboard_${userId}_${businessKey}_`);

    let totalGoals = 0;
    let completedGoals = 0;
    const goals = [];
    const recentAchievements = [];

    for (const item of dreamBoardItems) {
      totalGoals++;
      
      const status = item.completed ? 'completed' : 
                    item.progress > 0 ? 'in-progress' : 'not-started';
      
      if (status === 'completed') {
        completedGoals++;
        if (item.completedAt) {
          recentAchievements.push({
            title: item.title,
            completedDate: item.completedAt,
            category: item.category || 'general'
          });
        }
      }

      goals.push({
        title: item.title,
        category: item.category || 'general',
        status,
        targetDate: item.targetDate,
        progress: item.progress || 0
      });
    }

    return {
      totalGoals,
      completedGoals,
      goals,
      recentAchievements: recentAchievements.slice(0, 3)
    };
  } catch (error) {
    console.error('Error fetching dream board data:', error);
    return {
      totalGoals: 0,
      completedGoals: 0,
      goals: [],
      recentAchievements: []
    };
  }
}

/**
 * Get notes data
 */
async function getNotesData(userId: string, businessId?: string) {
  try {
    const businessKey = businessId || 'default';
    const notes = await kv.getByPrefix(`note_${userId}_${businessKey}_`);

    return notes.map(note => ({
      id: note.id,
      content: note.content,
      category: note.category,
      businessId: businessKey,
      createdAt: note.createdAt,
      tags: note.tags
    })).slice(0, 10); // Limit to 10 most recent notes
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
}