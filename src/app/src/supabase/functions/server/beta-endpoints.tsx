import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.47.10';
import * as kv from './kv_store.tsx';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export const betaRouter = new Hono();

// Ping endpoint to test if beta router is accessible
betaRouter.get('/beta/ping', async (c) => {
  return c.json({ 
    status: 'success',
    message: 'BETA router is working',
    timestamp: new Date().toISOString()
  });
});

// Change user's subscription plan (BETA testing only)
betaRouter.post('/beta/change-plan', async (c) => {
  try {
    console.log('🧪 BETA: Change plan request received');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Parse request body
    const body = await c.req.json();
    const { userId, plan } = body;

    if (!userId || !plan) {
      return c.json({ success: false, error: 'userId and plan are required' }, 400);
    }

    // Verify the user is changing their own plan
    if (userId !== user.id) {
      return c.json({ success: false, error: 'You can only change your own plan' }, 403);
    }

    // Validate plan
    const validPlans = ['free', 'creator', 'builder', 'studio'];
    if (!validPlans.includes(plan)) {
      return c.json({ success: false, error: 'Invalid plan' }, 400);
    }

    console.log(`🧪 BETA: Changing user ${userId} to plan: ${plan}`);

    // Create a unique subscription ID for beta testing
    const subscriptionId = `beta_sub_${userId}_${plan}`;
    const now = Date.now();
    
    // Create subscription object in the format expected by the system
    const subscription = {
      id: subscriptionId,
      userId: userId,
      status: plan === 'free' ? 'canceled' : 'active',
      plan: plan,
      customer: `beta_cus_${userId}`,
      current_period_start: Math.floor(now / 1000),
      current_period_end: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000),
      items: [
        {
          id: `item_${plan}`,
          plan: {
            id: plan,
            product: plan,
            interval: 'month',
            amount: 0
          }
        }
      ],
      metadata: {
        source: 'beta_testing',
        plan_name: plan
      },
      savedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'main' as const
    };

    // Save the subscription
    await kv.set(`subscription:${subscriptionId}`, subscription);
    
    // Update user's subscription list
    const userSubscriptions = [subscriptionId]; // Replace with just this subscription
    await kv.set(`user:${userId}:subscriptions`, userSubscriptions);
    
    // Create legacy format for backward compatibility
    const legacyData = {
      status: plan === 'free' ? 'free' : 'subscribed',
      plan: plan,
      trial: null,
      subscription: {
        id: subscriptionId,
        status: plan === 'free' ? 'canceled' : 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: plan,
        source: 'beta_testing',
        created_at: new Date().toISOString()
      },
      stripeCustomerId: `beta_cus_${userId}`,
      lastUpdated: new Date().toISOString()
    };
    
    // Also store legacy keys for compatibility
    await kv.set(`subscription:${userId}`, legacyData);
    await kv.set(`cloud_subscription:${userId}`, legacyData);

    console.log(`🧪 BETA: ✅ Successfully changed plan to ${plan} for user ${userId}`);

    return c.json({
      success: true,
      message: `Plan changed to ${plan}`,
      subscriptionData: {
        status: legacyData.status,
        plan: legacyData.plan,
        source: 'beta_testing'
      }
    });

  } catch (error: any) {
    console.error('🧪 BETA: Error changing plan:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to change plan'
    }, 500);
  }
});

// Get current BETA status
betaRouter.get('/beta/status/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🧪 BETA: Getting status for user:', userId);

    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Get subscription data
    const subscriptionKey = `subscription:${userId}`;
    const subscriptionData = await kv.get(subscriptionKey);

    return c.json({
      success: true,
      subscriptionData: subscriptionData || { status: 'free', plan: 'free' },
      isBeta: subscriptionData?.subscription?.source === 'beta_testing'
    });

  } catch (error: any) {
    console.error('🧪 BETA: Error getting status:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to get status'
    }, 500);
  }
});

// Reset to free plan
betaRouter.post('/beta/reset/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🧪 BETA: Resetting user to free plan:', userId);

    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Get all user subscriptions and delete them
    const userSubscriptions = await kv.get(`user:${userId}:subscriptions`) || [];
    
    // Delete each subscription
    for (const subId of userSubscriptions) {
      await kv.del(`subscription:${subId}`);
    }
    
    // Clear the subscription list
    await kv.del(`user:${userId}:subscriptions`);
    
    // Also clear legacy keys
    await kv.del(`subscription:${userId}`);
    await kv.del(`cloud_subscription:${userId}`);

    console.log(`🧪 BETA: ✅ Reset user ${userId} to free plan (deleted ${userSubscriptions.length} subscriptions)`);

    return c.json({
      success: true,
      message: 'Reset to free plan'
    });

  } catch (error: any) {
    console.error('🧪 BETA: Error resetting plan:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to reset plan'
    }, 500);
  }
});

export default betaRouter;
