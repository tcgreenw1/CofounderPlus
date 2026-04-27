/**
 * Credits Management Endpoints
 * Handles AI credit balance and deduction
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { prewarmUserCache } from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const app = new Hono();

const PLAN_CREDITS = {
  free: 500,
  creator: 5000,
  builder: 20000,
  studio: 150000
};

// Helper to get user's plan from KV store (same source as CloudSubscriptionContext)
async function getUserPlan(userId: string): Promise<'free' | 'creator' | 'builder'> {
  try {
    // Get user's subscription IDs from KV store
    const subscriptionIds = await kv.get(`user:${userId}:subscriptions`) || [];
    
    // Get detailed subscription data (same as CloudSubscriptionContext)
    for (const subId of subscriptionIds) {
      try {
        const subscriptionData = await kv.get(`subscription:${subId}`);
        if (subscriptionData) {
          const sub = typeof subscriptionData === 'string' ? JSON.parse(subscriptionData) : subscriptionData;
          
          // Only consider active or trialing subscriptions
          if (sub.status === 'active' || sub.status === 'trialing') {
            const planStr = (sub.plan || '').toLowerCase();
            
            console.log(`💳 Credits: Found active subscription for user ${userId}:`, {
              id: subId,
              plan: sub.plan,
              status: sub.status,
              type: sub.type
            });
            
            // Map plan to credit tier
            // Builder tier (20000 credits): builder, grow, scale
            if (planStr === 'builder' || planStr === 'grow' || planStr === 'scale') {
              console.log(`✅ Credits: User ${userId} on BUILDER tier (20000 credits)`);
              return 'builder';
            }
            
            // Creator tier (500 credits): creator, launch
            if (planStr === 'creator' || planStr === 'launch') {
              console.log(`✅ Credits: User ${userId} on CREATOR tier (500 credits)`);
              return 'creator';
            }
          }
        }
      } catch (subError) {
        console.error(`⚠️ Credits: Error fetching subscription ${subId}, continuing...`, subError);
        // Continue to next subscription instead of failing completely
        continue;
      }
    }
    
    // Also check legacy Apple IAP subscription location
    try {
      const legacySub = await kv.get(`subscription:${userId}`);
      if (legacySub) {
        const sub = typeof legacySub === 'string' ? JSON.parse(legacySub) : legacySub;
        if (sub.status === 'active' || sub.status === 'trialing') {
          const planStr = (sub.plan || '').toLowerCase();
          
          console.log(`💳 Credits: Found legacy subscription for user ${userId}:`, {
            plan: sub.plan,
            status: sub.status
          });
          
          if (planStr === 'builder' || planStr === 'grow' || planStr === 'scale') {
            return 'builder';
          }
          if (planStr === 'creator' || planStr === 'launch') {
            return 'creator';
          }
        }
      }
    } catch (legacyError) {
      console.error(`⚠️ Credits: Error fetching legacy subscription, continuing...`, legacyError);
    }

    console.log(`ℹ️ Credits: No active subscription found for user ${userId}, defaulting to FREE tier (50 credits)`);
    return 'free';
  } catch (error) {
    console.error('❌ Credits: Error fetching user plan:', error);
    // Return free plan as fallback instead of throwing
    console.log(`⚠️ Credits: Defaulting to FREE tier due to error`);
    return 'free';
  }
}

// Helper to initialize credits for new user
async function initializeCredits(userId: string, plan: 'free' | 'creator' | 'builder'): Promise<number> {
  const initialCredits = PLAN_CREDITS[plan];
  // Store as number, not string - KV store uses JSONB which handles numbers natively
  await kv.set(`credits:${userId}`, initialCredits);
  // IMPORTANT: Also store the plan to prevent auto-reset
  await kv.set(`credits:${userId}:plan`, plan);
  console.log(`💳 INIT: Stored ${initialCredits} credits for user ${userId} (${plan} plan)`);
  return initialCredits;
}

// Helper function to get credit limits based on subscription
const getCreditLimits = (subscriptionPlan: string) => {
  const limits = {
    free: {
      monthlyCredits: 1000,
      dailyCredits: 100,
      overageCostPerCredit: 0.02,
    },
    creator: {
      monthlyCredits: 10000,
      dailyCredits: 1000,
      overageCostPerCredit: 0.015,
    },
    builder: {
      monthlyCredits: 50000,
      dailyCredits: 5000,
      overageCostPerCredit: 0.01,
    },
    studio: {
      monthlyCredits: 200000,
      dailyCredits: 20000,
      overageCostPerCredit: 0.005,
    },
  };

  return limits[subscriptionPlan as keyof typeof limits] || limits.free;
};

// GET /credits/summary - Get comprehensive credit usage summary
app.get('/make-server-373d8b09/credits/summary', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Pre-warm cache for this user to prevent future timeouts
    prewarmUserCache(user.id);

    const businessId = c.req.query('businessId');

    // Get user's plan
    const plan = await getUserPlan(user.id);
    const limits = getCreditLimits(plan);

    // Get current credits
    const creditsValue = await kv.get(`credits:${user.id}`);
    const remainingCredits = creditsValue ? (typeof creditsValue === 'number' ? creditsValue : parseInt(creditsValue)) : limits.monthlyCredits;

    // Calculate usage (simplified - actual implementation would track real usage)
    const monthlyUsage = limits.monthlyCredits - remainingCredits;
    const dailyUsage = 0; // Would need to implement daily tracking

    const summary = {
      totalCreditsUsed: monthlyUsage,
      totalTokensUsed: monthlyUsage * 100, // Rough estimate
      totalRequests: monthlyUsage,
      estimatedCostCents: 0,
      monthlyUsage,
      dailyUsage,
      remainingCredits,
      subscriptionPlan: plan,
      overageCostPerCredit: limits.overageCostPerCredit,
      subscriptionLimits: {
        monthlyCredits: limits.monthlyCredits,
        dailyCredits: limits.dailyCredits,
        overage: remainingCredits < 0,
      },
    };

    return c.json({ success: true, summary });
  } catch (error: any) {
    console.error('❌ Error fetching credits summary:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// POST /credits/track - Track AI usage (for analytics)
app.post('/make-server-373d8b09/credits/track', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { 
      businessId, 
      feature, 
      tokensUsed, 
      requestCount = 1, 
      estimatedCost = 0,
      model = 'gpt-4o',
      metadata = {}
    } = body;

    const usageId = crypto.randomUUID();
    const usage = {
      id: usageId,
      userId: user.id,
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

    // Store the usage record
    const storageKey = businessId 
      ? `credit_usage:${user.id}:${businessId}:${usageId}`
      : `credit_usage:${user.id}:global:${usageId}`;
    
    await kv.set(storageKey, usage);

    console.log(`📊 Tracked usage for user ${user.id}: ${tokensUsed} tokens, ${usage.credits} credits`);

    return c.json({ success: true, usage });
  } catch (error: any) {
    console.error('❌ Error tracking usage:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// GET /credits/history - Get usage history
app.get('/make-server-373d8b09/credits/history', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const businessId = c.req.query('businessId');
    const days = parseInt(c.req.query('days') || '30');

    // Get usage records from KV store
    const prefix = businessId 
      ? `credit_usage:${user.id}:${businessId}:`
      : `credit_usage:${user.id}:`;
    
    const records = await kv.getByPrefix(prefix);
    
    // Filter by date and parse
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const history = records
      .map(record => typeof record === 'string' ? JSON.parse(record) : record)
      .filter(record => new Date(record.timestamp) >= cutoffDate)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ success: true, history });
  } catch (error: any) {
    console.error('❌ Error fetching usage history:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// GET /credits/balance - Get credit balance
app.get('/make-server-373d8b09/credits/balance', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Pre-warm cache for this user to prevent future timeouts
    prewarmUserCache(user.id);

    // Get user's plan (from same KV store as CloudSubscriptionContext)
    const plan = await getUserPlan(user.id);

    // Get current credits with error handling for database issues
    let creditsValue;
    try {
      creditsValue = await kv.get(`credits:${user.id}`);
    } catch (kvError: any) {
      console.error(`❌ KV GET ERROR for user ${user.id}:`, kvError.message);
      // Return default credits on database error to allow app to function
      const defaultCredits = PLAN_CREDITS[plan];
      return c.json({ 
        credits: defaultCredits,
        plan,
        maxCredits: defaultCredits,
        warning: 'Database temporarily unavailable, using default credits'
      });
    }
    
    let credits = 0;

    console.log(`💳 GET BALANCE: Reading credits for user ${user.id} - Raw value from DB:`, creditsValue, `(type: ${typeof creditsValue})`);

    // Check if plan has changed (for debugging and auto-reset)
    let lastKnownPlanStr;
    try {
      lastKnownPlanStr = await kv.get(`credits:${user.id}:plan`);
    } catch (error) {
      console.error(`⚠️ Could not read plan from KV:`, error);
      lastKnownPlanStr = null;
    }
    const lastKnownPlan = lastKnownPlanStr || 'free';
    const planChanged = lastKnownPlan !== plan;

    if (creditsValue === null || creditsValue === undefined) {
      // Initialize credits for new user
      try {
        credits = await initializeCredits(user.id, plan);
        await kv.set(`credits:${user.id}:plan`, plan);
        console.log(`✅ Initialized ${credits} credits for user ${user.id} on ${plan} plan`);
      } catch (initError: any) {
        console.error(`❌ Failed to initialize credits:`, initError.message);
        // Return default credits on initialization error
        credits = PLAN_CREDITS[plan];
      }
    } else {
      // Handle both number and string formats (for backwards compatibility)
      credits = typeof creditsValue === 'number' ? creditsValue : parseInt(creditsValue);
      console.log(`💳 GET BALANCE: Parsed credits: ${credits}, Plan: ${plan}, Last known plan: ${lastKnownPlan}`);
      
      // If plan changed, reset credits to new plan limit
      if (planChanged) {
        const maxCredits = PLAN_CREDITS[plan];
        credits = maxCredits;
        try {
          await kv.set(`credits:${user.id}`, credits);
          await kv.set(`credits:${user.id}:plan`, plan);
          console.log(`🔄 Plan changed from ${lastKnownPlan} to ${plan}! Reset credits to ${credits} for user ${user.id}`);
        } catch (setError: any) {
          console.error(`⚠️ Could not save updated credits:`, setError.message);
          // Continue with the reset credits value even if save failed
        }
      }
      // REMOVED: Don't auto-reset credits if 0 - this was causing issues
      // Just return the actual balance
    }

    return c.json({
      success: true,
      credits,
      plan,
      maxCredits: PLAN_CREDITS[plan]
    });
  } catch (error: any) {
    console.error('❌ Error fetching credit balance:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// POST /credits/deduct - Deduct credits for AI action
app.post('/make-server-373d8b09/credits/deduct', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { amount = 1, action = 'AI Action' } = body;

    // Get current credits
    const creditsValue = await kv.get(`credits:${user.id}`);
    
    if (creditsValue === null || creditsValue === undefined) {
      // Initialize credits if not exists
      const plan = await getUserPlan(user.id);
      const initialCredits = await initializeCredits(user.id, plan);
      
      if (initialCredits < amount) {
        return c.json({ 
          error: 'Insufficient credits',
          credits: initialCredits,
          required: amount
        }, 402);
      }
      
      const newBalance = initialCredits - amount;
      await kv.set(`credits:${user.id}`, newBalance);
      
      // Log the deduction
      await logCreditUsage(user.id, amount, action, newBalance);
      
      return c.json({
        success: true,
        deducted: amount,
        remainingCredits: newBalance,
        action
      });
    }

    // Handle both number and string formats (for backwards compatibility)
    const currentCredits = typeof creditsValue === 'number' ? creditsValue : parseInt(creditsValue);

    // Check if user has enough credits
    if (currentCredits < amount) {
      return c.json({ 
        error: 'Insufficient credits',
        credits: currentCredits,
        required: amount
      }, 402);
    }

    // Deduct credits
    const newBalance = currentCredits - amount;
    await kv.set(`credits:${user.id}`, newBalance);
    
    // IMPORTANT: Save current plan to prevent auto-reset on next fetch
    const currentPlan = await getUserPlan(user.id);
    await kv.set(`credits:${user.id}:plan`, currentPlan);

    // Log the deduction
    await logCreditUsage(user.id, amount, action, newBalance);

    console.log(`💳 Deducted ${amount} credit(s) from user ${user.id} for "${action}". New balance: ${newBalance}`);

    return c.json({
      success: true,
      deducted: amount,
      remainingCredits: newBalance,
      action
    });
  } catch (error: any) {
    console.error('❌ Error deducting credits:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// POST /credits/add - Add credits (for admin/purchase)
app.post('/make-server-373d8b09/credits/add', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { amount, reason = 'Credit purchase' } = body;

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Get current credits
    const creditsValue = await kv.get(`credits:${user.id}`);
    const currentCredits = creditsValue ? (typeof creditsValue === 'number' ? creditsValue : parseInt(creditsValue)) : 0;

    // Add credits
    const newBalance = currentCredits + amount;
    await kv.set(`credits:${user.id}`, newBalance);

    console.log(`💳 Added ${amount} credit(s) to user ${user.id}. New balance: ${newBalance}. Reason: ${reason}`);

    return c.json({
      success: true,
      added: amount,
      newBalance,
      reason
    });
  } catch (error: any) {
    console.error('❌ Error adding credits:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// POST /credits/reset - Reset credits to plan limit (for plan upgrades)
app.post('/make-server-373d8b09/credits/reset', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's plan (from same KV store as CloudSubscriptionContext)
    const plan = await getUserPlan(user.id);
    const credits = PLAN_CREDITS[plan];

    // Set credits to plan limit
    await kv.set(`credits:${user.id}`, credits);

    console.log(`💳 Reset credits for user ${user.id} to ${credits} (${plan} plan)`);

    return c.json({
      success: true,
      credits,
      plan
    });
  } catch (error: any) {
    console.error('❌ Error resetting credits:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// Helper to log credit usage (for analytics)
async function logCreditUsage(userId: string, amount: number, action: string, remainingBalance: number) {
  try {
    const timestamp = new Date().toISOString();
    const logKey = `credit_log:${userId}:${timestamp}`;
    const logData = {
      userId,
      amount,
      action,
      remainingBalance,
      timestamp
    };
    await kv.set(logKey, JSON.stringify(logData));
  } catch (error) {
    console.error('Error logging credit usage:', error);
    // Don't throw - logging failure shouldn't block the transaction
  }
}

// Exported helper for other endpoints to deduct credits directly
export async function deductUserCredits(userId: string, amount: number = 1, action: string = 'AI Action'): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
  try {
    // Get current credits
    const creditsValue = await kv.get(`credits:${userId}`);
    
    if (creditsValue === null || creditsValue === undefined) {
      // Initialize credits if not exists
      const plan = await getUserPlan(userId);
      const initialCredits = await initializeCredits(userId, plan);
      
      if (initialCredits < amount) {
        return { 
          success: false,
          error: 'Insufficient credits',
          remainingCredits: initialCredits
        };
      }
      
      const newBalance = initialCredits - amount;
      await kv.set(`credits:${userId}`, newBalance);
      await logCreditUsage(userId, amount, action, newBalance);
      
      console.log(`💳 Deducted ${amount} credit(s) from user ${userId} for "${action}". New balance: ${newBalance}`);
      
      return {
        success: true,
        remainingCredits: newBalance
      };
    }

    // Handle both number and string formats (for backwards compatibility)
    const currentCredits = typeof creditsValue === 'number' ? creditsValue : parseInt(creditsValue);

    // Check if user has enough credits
    if (currentCredits < amount) {
      return { 
        success: false,
        error: 'Insufficient credits',
        remainingCredits: currentCredits
      };
    }

    // Deduct credits
    const newBalance = currentCredits - amount;
    await kv.set(`credits:${userId}`, newBalance);
    
    // IMPORTANT: Save current plan to prevent auto-reset on next fetch
    const currentPlan = await getUserPlan(userId);
    await kv.set(`credits:${userId}:plan`, currentPlan);
    
    // Verify the write was successful
    const verifyCredits = await kv.get(`credits:${userId}`);
    console.log(`💳 Credits after deduction - Expected: ${newBalance}, Actual in DB: ${verifyCredits}`);
    
    await logCreditUsage(userId, amount, action, newBalance);

    console.log(`💳 Deducted ${amount} credit(s) from user ${userId} for "${action}". New balance: ${newBalance}`);

    return {
      success: true,
      remainingCredits: newBalance
    };
  } catch (error: any) {
    console.error('❌ Error deducting credits:', error);
    return {
      success: false,
      error: error.message || 'Failed to deduct credits'
    };
  }
}

export default app;