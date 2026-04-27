import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Helper function to get user's current organization
const getCurrentOrganization = async (userId: string) => {
  try {
    const currentOrgKey = `current_organization:${userId}`;
    const currentOrgId = await kv.get(currentOrgKey);
    
    // If no current org set, default to user's own organization
    return currentOrgId || userId;
  } catch (error) {
    console.error('Error getting current organization:', error);
    return userId; // Fallback to user's own org
  }
};

// Helper function to get organization owner (who pays for the subscription)
const getOrganizationOwner = async (organizationId: string) => {
  try {
    const orgDataKey = `organization_data:${organizationId}`;
    const orgData = await kv.get(orgDataKey);
    
    if (orgData) {
      let parsedData = orgData;
      if (typeof orgData === 'string') {
        parsedData = JSON.parse(orgData);
      }
      // Return the organization's owner ID (who pays for subscription)
      return parsedData.ownerId || organizationId;
    }
    
    // If no org data, the organizationId is the owner
    return organizationId;
  } catch (error) {
    console.error('Error getting organization owner:', error);
    return organizationId;
  }
};

// Helper function to get credit limits based on subscription
const getCreditLimits = (subscriptionPlan: string) => {
  const limits = {
    free: {
      monthlyCredits: 100,
      dailyCredits: 10,
      overageCostPerCredit: 0.02,
    },
    launch: {
      monthlyCredits: 5000,
      dailyCredits: 500,
      overageCostPerCredit: 0.015,
    },
    creator: {
      monthlyCredits: 5000,
      dailyCredits: 500,
      overageCostPerCredit: 0.015,
    },
    grow: {
      monthlyCredits: 20000,
      dailyCredits: 2000,
      overageCostPerCredit: 0.01,
    },
    builder: {
      monthlyCredits: 20000,
      dailyCredits: 2000,
      overageCostPerCredit: 0.01,
    },
    scale: {
      monthlyCredits: 150000,
      dailyCredits: 15000,
      overageCostPerCredit: 0.005,
    },
    studio: {
      monthlyCredits: 150000,
      dailyCredits: 15000,
      overageCostPerCredit: 0.005,
    },
  };

  return limits[subscriptionPlan as keyof typeof limits] || limits.free;
};

// Helper function to get date ranges
const getDateRanges = () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return {
    today: startOfDay.toISOString(),
    thisMonth: startOfMonth.toISOString(),
    now: now.toISOString(),
  };
};

// Track AI usage endpoint
app.post('/track', async (c) => {
  console.log('💳 Credits: Track usage endpoint called');
  
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // For now, we'll skip auth verification for credits tracking to avoid circular dependencies
    // In production, you'd want to verify the token here
    
    const requestBody = await c.req.json();
    console.log('💳 Credits: Usage data:', requestBody);
    
    const { 
      userId, 
      businessId, 
      feature, 
      tokensUsed, 
      requestCount = 1, 
      estimatedCost, 
      model,
      metadata = {}
    } = requestBody;
    
    if (!userId || !feature || !tokensUsed || !model) {
      console.error('💳 Credits: Missing required fields');
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    // Get user's current organization
    const organizationId = await getCurrentOrganization(userId);
    console.log(`💳 Credits: User ${userId} is in organization ${organizationId}`);

    // Create usage record
    const usageId = `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const usage = {
      id: usageId,
      userId,
      organizationId,
      businessId: businessId || null,
      feature,
      tokensUsed: parseInt(tokensUsed),
      requestCount: parseInt(requestCount),
      estimatedCost: parseInt(estimatedCost || 0),
      model,
      metadata,
      timestamp: new Date().toISOString(),
      credits: Math.ceil(tokensUsed / 100), // Convert tokens to credits
    };

    // Store the usage record under organization (not user)
    const storageKey = businessId 
      ? `credit_usage:${organizationId}:${businessId}:${usageId}`
      : `credit_usage:${organizationId}:global:${usageId}`;
    
    await kv.set(storageKey, usage);
    
    // Update organization's total usage counters
    const orgStatsKey = `credit_stats:${organizationId}`;
    const existingStats = await kv.get(orgStatsKey) || {
      totalCreditsUsed: 0,
      totalTokensUsed: 0,
      totalRequests: 0,
      totalCostCents: 0,
      lastUpdated: new Date().toISOString(),
    };
    
    const updatedStats = {
      ...existingStats,
      totalCreditsUsed: existingStats.totalCreditsUsed + usage.credits,
      totalTokensUsed: existingStats.totalTokensUsed + usage.tokensUsed,
      totalRequests: existingStats.totalRequests + usage.requestCount,
      totalCostCents: existingStats.totalCostCents + usage.estimatedCost,
      lastUpdated: new Date().toISOString(),
    };
    
    await kv.set(orgStatsKey, updatedStats);
    
    console.log('💳 Credits: Usage tracked successfully', { 
      credits: usage.credits, 
      tokens: usage.tokensUsed,
      totalCredits: updatedStats.totalCreditsUsed,
      organizationId 
    });
    
    return c.json({
      success: true,
      usage: {
        id: usage.id,
        credits: usage.credits,
        tokensUsed: usage.tokensUsed,
        estimatedCost: usage.estimatedCost,
      },
      totalStats: updatedStats,
    });

  } catch (error) {
    console.error('💳 Credits: Error tracking usage:', error);
    return c.json({ 
      success: false, 
      error: `Error tracking usage: ${error.message}` 
    }, 500);
  }
});

// Get credits summary endpoint
app.get('/summary', async (c) => {
  console.log('💳 Credits: Summary endpoint called');
  
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Extract user ID from JWT token (simplified)
    // In production, you'd want proper JWT verification
    let userId: string;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || payload.user_id;
    } catch {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    
    const businessId = c.req.query('businessId');
    
    // Get user's current organization
    const organizationId = await getCurrentOrganization(userId);
    console.log(`💳 Credits: Fetching summary for organization ${organizationId}`);
    
    // Get organization owner (who pays for the subscription)
    const ownerId = await getOrganizationOwner(organizationId);
    console.log(`💳 Credits: Organization owner is ${ownerId}`);
    
    // Get owner's subscription info (credits come from the owner's plan)
    const subscriptionData = await kv.get(`subscription:${ownerId}`) || { plan: 'free', status: 'free' };
    const creditLimits = getCreditLimits(subscriptionData.plan);
    
    // Get organization's total stats (all members' usage combined)
    const orgStats = await kv.get(`credit_stats:${organizationId}`) || {
      totalCreditsUsed: 0,
      totalTokensUsed: 0,
      totalRequests: 0,
      totalCostCents: 0,
    };
    
    // Get usage for current month and day
    const { today, thisMonth } = getDateRanges();
    
    // Get all usage records for the organization (not just this user)
    const prefix = businessId 
      ? `credit_usage:${organizationId}:${businessId}:`
      : `credit_usage:${organizationId}:`;
    
    const allUsage = await kv.getByPrefix(prefix) || [];
    
    // Filter for current month and day
    const monthlyUsage = allUsage
      .filter(usage => usage.timestamp >= thisMonth)
      .reduce((sum, usage) => sum + (usage.credits || 0), 0);
    
    const dailyUsage = allUsage
      .filter(usage => usage.timestamp >= today)
      .reduce((sum, usage) => sum + (usage.credits || 0), 0);
    
    // Calculate remaining credits
    const remainingMonthly = Math.max(0, creditLimits.monthlyCredits - monthlyUsage);
    const remainingDaily = Math.max(0, creditLimits.dailyCredits - dailyUsage);
    const remainingCredits = Math.min(remainingMonthly, remainingDaily);
    
    const summary = {
      totalCreditsUsed: orgStats.totalCreditsUsed,
      totalTokensUsed: orgStats.totalTokensUsed,
      totalRequests: orgStats.totalRequests,
      estimatedCostCents: orgStats.totalCostCents,
      monthlyUsage,
      dailyUsage,
      remainingCredits,
      subscriptionLimits: {
        monthlyCredits: creditLimits.monthlyCredits,
        dailyCredits: creditLimits.dailyCredits,
        overage: monthlyUsage > creditLimits.monthlyCredits || dailyUsage > creditLimits.dailyCredits,
      },
      subscriptionPlan: subscriptionData.plan,
      overageCostPerCredit: creditLimits.overageCostPerCredit,
      organizationId,
      ownerId,
      isOwner: userId === ownerId,
    };
    
    console.log('💳 Credits: Summary calculated', { 
      plan: subscriptionData.plan,
      monthlyUsage,
      dailyUsage,
      remainingCredits,
      organizationId,
      ownerId,
    });
    
    return c.json({
      success: true,
      summary,
    });

  } catch (error) {
    console.error('💳 Credits: Error getting summary:', error);
    return c.json({ 
      success: false, 
      error: `Error getting summary: ${error.message}` 
    }, 500);
  }
});

// Get usage history endpoint
app.get('/history', async (c) => {
  console.log('💳 Credits: History endpoint called');
  
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Extract user ID from JWT token (simplified)
    let userId: string;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || payload.user_id;
    } catch {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    
    const businessId = c.req.query('businessId');
    const days = parseInt(c.req.query('days') || '30');
    
    // Get user's current organization
    const organizationId = await getCurrentOrganization(userId);
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get usage records for the organization (not just the user)
    const prefix = businessId 
      ? `credit_usage:${organizationId}:${businessId}:`
      : `credit_usage:${organizationId}:`;
    
    const allUsage = await kv.getByPrefix(prefix) || [];
    
    // Filter by date range and sort by timestamp
    const filteredUsage = allUsage
      .filter(usage => new Date(usage.timestamp) >= startDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100); // Limit to 100 most recent records
    
    console.log('💳 Credits: History retrieved', { 
      recordCount: filteredUsage.length,
      days,
      businessId: businessId || 'all',
      organizationId,
    });
    
    return c.json({
      success: true,
      history: filteredUsage,
      totalRecords: filteredUsage.length,
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
      },
      organizationId,
    });

  } catch (error) {
    console.error('💳 Credits: Error getting history:', error);
    return c.json({ 
      success: false, 
      error: `Error getting history: ${error.message}` 
    }, 500);
  }
});

// Reset credits endpoint (admin only)
app.post('/reset', async (c) => {
  console.log('💳 Credits: Reset endpoint called');
  
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    // Extract user ID and check admin status
    let userId: string;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub || payload.user_id;
      const email = payload.email;
      
      // Check if admin user
      const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
      if (!adminEmails.includes(email)) {
        return c.json({ success: false, error: 'Admin access required' }, 403);
      }
    } catch {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    
    const { targetUserId } = await c.req.json();
    if (!targetUserId) {
      return c.json({ success: false, error: 'Target user ID required' }, 400);
    }
    
    // Reset user's credit stats
    const resetStats = {
      totalCreditsUsed: 0,
      totalTokensUsed: 0,
      totalRequests: 0,
      totalCostCents: 0,
      lastUpdated: new Date().toISOString(),
      resetBy: userId,
      resetAt: new Date().toISOString(),
    };
    
    await kv.set(`credit_stats:${targetUserId}`, resetStats);
    
    console.log('💳 Credits: User credits reset', { 
      targetUserId,
      resetBy: userId,
    });
    
    return c.json({
      success: true,
      message: 'Credits reset successfully',
      resetStats,
    });

  } catch (error) {
    console.error('💳 Credits: Error resetting credits:', error);
    return c.json({ 
      success: false, 
      error: `Error resetting credits: ${error.message}` 
    }, 500);
  }
});

export default app;