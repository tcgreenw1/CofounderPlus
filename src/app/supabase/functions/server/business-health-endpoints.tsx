/**
 * Business Health Score Endpoints
 * AI-powered analysis of business health metrics
 */

import { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

/**
 * GET /business-health/:businessId
 * Get AI-powered business health score
 */
export async function getBusinessHealthScore(c: Context) {
  try {
    const businessId = c.req.param('businessId');
    
    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('🏥 Fetching business health score for:', businessId);

    // Get the user from the access token
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    // Extract the token and get user
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    // Fetch business data from KV store using correct key format
    const businessKey = `business:${user.id}:${businessId}`;
    console.log('🔍 Looking for business with key:', businessKey);
    
    const businessData = await kv.get(businessKey);

    if (!businessData) {
      console.log('❌ Business not found with ID:', businessId, 'for user:', user.id);
      console.log('📝 Returning default health data for new business');
      
      // Return default health data for new businesses
      return c.json({
        overallScore: 50,
        trend: 'stable' as const,
        metrics: {
          financial: {
            score: 50,
            status: 'Fair'
          },
          operational: {
            score: 50,
            status: 'Fair'
          },
          growth: {
            score: 50,
            status: 'Fair'
          },
          team: {
            score: 60,
            status: 'Good'
          }
        },
        insights: [
          'Welcome to your new business! Add transactions to start tracking financial health.',
          'Create roadmap items to improve operational metrics.',
          'Document your business progress with notes and planning.'
        ],
        recommendations: [
          'Start by adding your first transaction or income.',
          'Create a roadmap to track your business goals.',
          'Add team members as your business grows.'
        ],
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log('✅ Business data found:', { id: businessId, name: businessData?.name });

    // Gather business metrics from various sources
    const [
      financialData,
      transactionsData,
      teamData,
      roadmapData,
      notesData
    ] = await Promise.all([
      kv.get(`finance:${user.id}:${businessId}`),
      kv.getByPrefix(`transaction:${user.id}:${businessId}:`),
      kv.getByPrefix(`team_member:${user.id}:${businessId}:`),
      kv.getByPrefix(`roadmap_item:${user.id}:${businessId}:`),
      kv.getByPrefix(`note:${user.id}:${businessId}:`)
    ]);

    console.log('📊 Gathered business data:', {
      hasFinancial: !!financialData,
      transactionsCount: transactionsData?.length || 0,
      teamCount: teamData?.length || 0,
      roadmapCount: roadmapData?.length || 0,
      notesCount: notesData?.length || 0
    });

    // Calculate financial health (0-100)
    const financialScore = calculateFinancialHealth(financialData, transactionsData);
    
    // Calculate operational health (0-100)
    const operationalScore = calculateOperationalHealth(roadmapData, notesData);
    
    // Calculate growth health (0-100)
    const growthScore = calculateGrowthHealth(transactionsData, financialData);
    
    // Calculate team health (0-100)
    const teamScore = calculateTeamHealth(teamData);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (financialScore * 0.35) +
      (operationalScore * 0.25) +
      (growthScore * 0.25) +
      (teamScore * 0.15)
    );

    // Determine trend
    const trend = determineTrend(overallScore, transactionsData);

    // Generate AI insights
    const insights = generateInsights({
      financialScore,
      operationalScore,
      growthScore,
      teamScore,
      overallScore,
      businessData,
      transactionsData
    });

    // Generate recommendations
    const recommendations = generateRecommendations({
      financialScore,
      operationalScore,
      growthScore,
      teamScore,
      overallScore
    });

    const healthData = {
      overallScore,
      trend,
      metrics: {
        financial: {
          score: financialScore,
          status: getStatusLabel(financialScore)
        },
        operational: {
          score: operationalScore,
          status: getStatusLabel(operationalScore)
        },
        growth: {
          score: growthScore,
          status: getStatusLabel(growthScore)
        },
        team: {
          score: teamScore,
          status: getStatusLabel(teamScore)
        }
      },
      insights,
      recommendations,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Business health score calculated:', healthData);
    return c.json(healthData);

  } catch (error: any) {
    console.error('❌ Error calculating business health score:', error);
    return c.json({ 
      error: 'Failed to calculate health score',
      details: error.message 
    }, 500);
  }
}

// Helper function to calculate financial health
function calculateFinancialHealth(financialData: any, transactionsData: any[]): number {
  let score = 50; // Base score

  if (!financialData && (!transactionsData || transactionsData.length === 0)) {
    return 40; // Low score if no financial data
  }

  // Check if there are recent transactions
  if (transactionsData && transactionsData.length > 0) {
    score += 15;

    // Calculate revenue vs expenses
    const revenue = transactionsData
      .filter(t => t.type === 'income' || t.category === 'revenue')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const expenses = transactionsData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    if (revenue > expenses) {
      score += 20;
    } else if (revenue > expenses * 0.8) {
      score += 10;
    }

    // Recent transaction activity (last 30 days)
    const now = new Date();
    const recentTransactions = transactionsData.filter(t => {
      const transDate = new Date(t.date || t.created_at);
      const daysDiff = (now.getTime() - transDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    if (recentTransactions.length > 5) {
      score += 15;
    } else if (recentTransactions.length > 0) {
      score += 5;
    }
  }

  return Math.min(100, Math.max(0, score));
}

// Helper function to calculate operational health
function calculateOperationalHealth(roadmapData: any[], notesData: any[]): number {
  let score = 50; // Base score

  // Check roadmap progress
  if (roadmapData && roadmapData.length > 0) {
    score += 15;

    const completedItems = roadmapData.filter(item => item.status === 'completed' || item.completed);
    const completionRate = (completedItems.length / roadmapData.length) * 100;

    if (completionRate >= 75) {
      score += 20;
    } else if (completionRate >= 50) {
      score += 15;
    } else if (completionRate >= 25) {
      score += 10;
    } else {
      score += 5;
    }
  }

  // Check notes activity (organization/planning)
  if (notesData && notesData.length > 0) {
    score += 10;

    const recentNotes = notesData.filter(note => {
      const noteDate = new Date(note.updated_at || note.created_at);
      const daysDiff = (new Date().getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    if (recentNotes.length > 5) {
      score += 5;
    }
  }

  return Math.min(100, Math.max(0, score));
}

// Helper function to calculate growth health
function calculateGrowthHealth(transactionsData: any[], financialData: any): number {
  let score = 50; // Base score

  if (!transactionsData || transactionsData.length === 0) {
    return 40;
  }

  // Calculate revenue trend (last 60 days vs previous 60 days)
  const now = new Date();
  const last60DaysRevenue = transactionsData.filter(t => {
    const transDate = new Date(t.date || t.created_at);
    const daysDiff = (now.getTime() - transDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 60 && (t.type === 'income' || t.category === 'revenue');
  }).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const previous60DaysRevenue = transactionsData.filter(t => {
    const transDate = new Date(t.date || t.created_at);
    const daysDiff = (now.getTime() - transDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 60 && daysDiff <= 120 && (t.type === 'income' || t.category === 'revenue');
  }).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  if (previous60DaysRevenue > 0) {
    const growthRate = ((last60DaysRevenue - previous60DaysRevenue) / previous60DaysRevenue) * 100;
    
    if (growthRate >= 20) {
      score += 30;
    } else if (growthRate >= 10) {
      score += 20;
    } else if (growthRate >= 0) {
      score += 10;
    } else if (growthRate >= -10) {
      score += 5;
    }
  } else if (last60DaysRevenue > 0) {
    score += 20; // New revenue is positive
  }

  return Math.min(100, Math.max(0, score));
}

// Helper function to calculate team health
function calculateTeamHealth(teamData: any[]): number {
  let score = 50; // Base score

  if (!teamData || teamData.length === 0) {
    return 60; // Solo operation is okay
  }

  // Team size bonus
  if (teamData.length >= 5) {
    score += 25;
  } else if (teamData.length >= 3) {
    score += 20;
  } else if (teamData.length >= 2) {
    score += 15;
  }

  // Active team members
  const activeMembers = teamData.filter(member => member.status === 'active');
  const activeRate = (activeMembers.length / teamData.length) * 100;

  if (activeRate >= 90) {
    score += 25;
  } else if (activeRate >= 75) {
    score += 15;
  } else if (activeRate >= 50) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

// Helper function to determine trend
function determineTrend(currentScore: number, transactionsData: any[]): 'up' | 'down' | 'stable' {
  if (!transactionsData || transactionsData.length < 10) {
    return 'stable';
  }

  // Simple trend based on recent revenue
  const now = new Date();
  const last30DaysRevenue = transactionsData.filter(t => {
    const transDate = new Date(t.date || t.created_at);
    const daysDiff = (now.getTime() - transDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30 && (t.type === 'income' || t.category === 'revenue');
  }).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const previous30DaysRevenue = transactionsData.filter(t => {
    const transDate = new Date(t.date || t.created_at);
    const daysDiff = (now.getTime() - transDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 30 && daysDiff <= 60 && (t.type === 'income' || t.category === 'revenue');
  }).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  if (previous30DaysRevenue === 0) {
    return last30DaysRevenue > 0 ? 'up' : 'stable';
  }

  const changePercent = ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100;

  if (changePercent > 5) return 'up';
  if (changePercent < -5) return 'down';
  return 'stable';
}

// Helper function to generate insights
function generateInsights(data: any): string[] {
  const insights: string[] = [];
  const { financialScore, operationalScore, growthScore, teamScore, overallScore, transactionsData } = data;

  // Financial insights
  if (financialScore >= 80) {
    insights.push('Strong financial position with healthy revenue streams');
  } else if (financialScore < 60) {
    insights.push('Financial metrics need attention - focus on increasing revenue or reducing costs');
  }

  // Operational insights
  if (operationalScore >= 75) {
    insights.push('Excellent operational execution with good project completion rate');
  } else if (operationalScore < 60) {
    insights.push('Consider improving operational efficiency and task completion');
  }

  // Growth insights
  if (growthScore >= 75) {
    insights.push('Business is experiencing positive growth momentum');
  } else if (growthScore < 60) {
    insights.push('Growth has slowed - explore new opportunities or markets');
  }

  // Team insights
  if (teamScore >= 80) {
    insights.push('Well-structured team with high engagement');
  } else if (teamScore < 60 && data.teamData?.length > 0) {
    insights.push('Team performance could be optimized');
  }

  // Overall insights
  if (overallScore >= 80) {
    insights.push('Your business is performing exceptionally well across all metrics');
  } else if (overallScore < 50) {
    insights.push('Multiple areas need immediate attention to improve business health');
  }

  return insights.slice(0, 4); // Return top 4 insights
}

// Helper function to generate recommendations
function generateRecommendations(data: any): string[] {
  const recommendations: string[] = [];
  const { financialScore, operationalScore, growthScore, teamScore } = data;

  // Financial recommendations
  if (financialScore < 70) {
    recommendations.push('Review and optimize your pricing strategy');
    recommendations.push('Reduce unnecessary operational expenses');
  }

  // Operational recommendations
  if (operationalScore < 70) {
    recommendations.push('Complete pending roadmap items to improve operational health');
    recommendations.push('Establish clear processes and documentation');
  }

  // Growth recommendations
  if (growthScore < 70) {
    recommendations.push('Develop new customer acquisition channels');
    recommendations.push('Consider expanding your product or service offerings');
  }

  // Team recommendations
  if (teamScore < 70) {
    recommendations.push('Invest in team development and training');
    recommendations.push('Improve team communication and collaboration');
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring key metrics regularly');
    recommendations.push('Maintain current momentum and seek optimization opportunities');
  }

  return recommendations.slice(0, 4); // Return top 4 recommendations
}

// Helper function to get status label
function getStatusLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}