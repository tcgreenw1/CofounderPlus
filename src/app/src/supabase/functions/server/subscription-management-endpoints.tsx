import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Configure CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client for auth verification
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to verify user authentication
async function verifyUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'No authorization header', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { error: 'Invalid token', status: 401 };
    }
    return { user, error: null };
  } catch (error) {
    return { error: 'Auth verification failed', status: 401 };
  }
}

// Get all subscriptions for a user
app.get('/user-subscriptions', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const userId = verification.user.id;
    console.log(`📊 SUBSCRIPTION MGMT: Getting subscriptions for user ${userId}`);

    // Get user's subscription IDs
    const subscriptionIds = await kv.get(`user:${userId}:subscriptions`) || [];
    console.log(`📊 SUBSCRIPTION MGMT: Found ${subscriptionIds.length} subscription IDs:`, subscriptionIds);

    // Get detailed subscription data
    const subscriptions = [];
    for (const subId of subscriptionIds) {
      const subscriptionData = await kv.get(`subscription:${subId}`);
      if (subscriptionData) {
        subscriptions.push(subscriptionData);
      }
    }

    console.log(`📊 SUBSCRIPTION MGMT: Returning ${subscriptions.length} detailed subscriptions`);

    return c.json({
      success: true,
      subscriptions,
      count: subscriptions.length
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error getting user subscriptions:', error);
    return c.json({ 
      error: 'Failed to get user subscriptions',
      details: error.message 
    }, 500);
  }
});

// Save/update a subscription for a user
app.post('/save-subscription', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const userId = verification.user.id;
    const body = await c.req.json();
    const { subscription } = body;

    if (!subscription || !subscription.id) {
      return c.json({ error: 'Invalid subscription data' }, 400);
    }

    console.log(`📊 SUBSCRIPTION MGMT: Saving subscription for user ${userId}:`, subscription.id);

    // Enhance subscription with metadata
    const enhancedSubscription = {
      ...subscription,
      userId,
      savedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Save detailed subscription data
    await kv.set(`subscription:${subscription.id}`, enhancedSubscription);

    // Update user's subscription list
    const existingSubscriptions = await kv.get(`user:${userId}:subscriptions`) || [];
    if (!existingSubscriptions.includes(subscription.id)) {
      existingSubscriptions.push(subscription.id);
      await kv.set(`user:${userId}:subscriptions`, existingSubscriptions);
      console.log(`📊 SUBSCRIPTION MGMT: Added subscription ${subscription.id} to user ${userId}'s list`);
    } else {
      console.log(`📊 SUBSCRIPTION MGMT: Updated existing subscription ${subscription.id} for user ${userId}`);
    }

    // If this subscription has a customer ID, create mapping
    if (subscription.customer) {
      await kv.set(`stripe:customer:${subscription.customer}:user`, userId);
      await kv.set(`user:${userId}:stripe:customer`, subscription.customer);
      console.log(`📊 SUBSCRIPTION MGMT: Created customer mapping for ${subscription.customer} -> ${userId}`);
    }

    return c.json({
      success: true,
      message: 'Subscription saved successfully',
      subscriptionId: subscription.id
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error saving subscription:', error);
    return c.json({ 
      error: 'Failed to save subscription',
      details: error.message 
    }, 500);
  }
});

// Remove a subscription for a user
app.delete('/remove-subscription/:subscriptionId', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const userId = verification.user.id;
    const subscriptionId = c.req.param('subscriptionId');

    console.log(`📊 SUBSCRIPTION MGMT: Removing subscription ${subscriptionId} for user ${userId}`);

    // Remove from user's subscription list
    const existingSubscriptions = await kv.get(`user:${userId}:subscriptions`) || [];
    const updatedSubscriptions = existingSubscriptions.filter(id => id !== subscriptionId);
    await kv.set(`user:${userId}:subscriptions`, updatedSubscriptions);

    // Mark subscription as deleted (but keep data for audit trail)
    const subscriptionData = await kv.get(`subscription:${subscriptionId}`);
    if (subscriptionData) {
      const deletedSubscription = {
        ...subscriptionData,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      await kv.set(`subscription:${subscriptionId}`, deletedSubscription);
    }

    console.log(`📊 SUBSCRIPTION MGMT: Removed subscription ${subscriptionId} from user ${userId}`);

    return c.json({
      success: true,
      message: 'Subscription removed successfully'
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error removing subscription:', error);
    return c.json({ 
      error: 'Failed to remove subscription',
      details: error.message 
    }, 500);
  }
});

// Sync subscription data from Stripe webhook
app.post('/sync-stripe-subscription', async (c) => {
  try {
    const body = await c.req.json();
    const { subscriptionData, customerId, eventType } = body;

    console.log(`📊 SUBSCRIPTION MGMT: Syncing Stripe subscription webhook - Event: ${eventType}`);

    if (!subscriptionData || !customerId) {
      return c.json({ error: 'Missing subscription or customer data' }, 400);
    }

    // Find user by customer ID
    const userId = await kv.get(`stripe:customer:${customerId}:user`);
    if (!userId) {
      console.log(`⚠️ SUBSCRIPTION MGMT: No user found for customer ${customerId}`);
      return c.json({
        success: true,
        message: 'No user mapping found for customer',
        customerId
      });
    }

    console.log(`📊 SUBSCRIPTION MGMT: Found user ${userId} for customer ${customerId}`);

    // Enhance subscription with sync metadata
    const enhancedSubscription = {
      ...subscriptionData,
      userId,
      customerId,
      syncedAt: new Date().toISOString(),
      syncEventType: eventType,
      lastUpdated: new Date().toISOString()
    };

    // Save detailed subscription data
    await kv.set(`subscription:${subscriptionData.id}`, enhancedSubscription);

    // Update user's subscription list if not already present
    const existingSubscriptions = await kv.get(`user:${userId}:subscriptions`) || [];
    if (!existingSubscriptions.includes(subscriptionData.id)) {
      existingSubscriptions.push(subscriptionData.id);
      await kv.set(`user:${userId}:subscriptions`, existingSubscriptions);
      console.log(`📊 SUBSCRIPTION MGMT: Added synced subscription ${subscriptionData.id} to user ${userId}`);
    }

    // Emit sync event for frontend
    const syncEvent = {
      type: 'subscription-synced',
      userId,
      subscriptionId: subscriptionData.id,
      eventType,
      timestamp: new Date().toISOString()
    };

    // Store sync event for debugging
    await kv.set(`sync:event:${Date.now()}:${subscriptionData.id}`, syncEvent);

    console.log(`✅ SUBSCRIPTION MGMT: Successfully synced subscription ${subscriptionData.id} for user ${userId}`);

    return c.json({
      success: true,
      message: 'Subscription synced successfully',
      userId,
      subscriptionId: subscriptionData.id
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error syncing Stripe subscription:', error);
    return c.json({ 
      error: 'Failed to sync subscription',
      details: error.message 
    }, 500);
  }
});

// Force sync user's subscription from Stripe
app.post('/force-sync-from-stripe', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const userId = verification.user.id;
    const userEmail = verification.user.email;

    console.log(`🔄 FORCE SYNC: Starting Stripe sync for user ${userId} (${userEmail})`);

    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }

    // Step 1: Search for customer by email
    console.log(`🔄 FORCE SYNC: Searching for customer with email ${userEmail}`);
    const customersResponse = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(userEmail)}&limit=10`,
      {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
      }
    );

    if (!customersResponse.ok) {
      const errorText = await customersResponse.text();
      console.error(`❌ FORCE SYNC: Failed to search customers:`, errorText);
      return c.json({ 
        success: false, 
        error: 'Failed to search for customer',
        details: errorText 
      }, 500);
    }

    const customersData = await customersResponse.json();
    const customers = customersData.data || [];
    
    console.log(`🔄 FORCE SYNC: Found ${customers.length} customers`);

    if (customers.length === 0) {
      return c.json({
        success: false,
        error: 'No Stripe customer found for this email',
        userEmail
      }, 404);
    }

    const customer = customers[0];
    const customerId = customer.id;

    console.log(`🔄 FORCE SYNC: Using customer ${customerId}`);

    // Step 2: Fetch all subscriptions for this customer
    const subscriptionsResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=all&expand[]=data.items.data.price.product`,
      {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
      }
    );

    if (!subscriptionsResponse.ok) {
      const errorText = await subscriptionsResponse.text();
      console.error(`❌ FORCE SYNC: Failed to fetch subscriptions:`, errorText);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch subscriptions',
        details: errorText 
      }, 500);
    }

    const subscriptionsData = await subscriptionsResponse.json();
    const allSubscriptions = subscriptionsData.data || [];

    console.log(`🔄 FORCE SYNC: Found ${allSubscriptions.length} subscriptions`);

    // Step 3: Save customer mapping
    await kv.set(`stripe:customer:${customerId}:user`, userId);
    await kv.set(`user:${userId}:stripe:customer`, customerId);

    // Step 4: Save all subscriptions
    const subscriptionIds = [];
    let highestPlan = 'free';
    const planLevels = { 'free': 0, 'creator': 1, 'builder': 2, 'studio': 3 };

    for (const subscription of allSubscriptions) {
      // Detect plan
      let plan = 'free';
      if (subscription.items?.data?.length > 0) {
        const item = subscription.items.data[0];
        const unitAmount = item.price?.unit_amount;
        const interval = item.price?.recurring?.interval;
        const productName = item.price?.product?.name?.toLowerCase() || '';

        // Detect by price amount
        if (unitAmount && interval) {
          if (interval === 'year') {
            if (unitAmount === 10800) plan = 'creator';
            if (unitAmount === 46800) plan = 'builder';
            if (unitAmount === 178800) plan = 'studio';
          } else if (interval === 'month') {
            if (unitAmount === 1500) plan = 'creator';
            if (unitAmount === 4900) plan = 'builder';
            if (unitAmount === 19900) plan = 'studio';
          }
        }

        // Fallback to product name
        if (plan === 'free') {
          if (productName.includes('creator')) plan = 'creator';
          if (productName.includes('builder')) plan = 'builder';
          if (productName.includes('studio')) plan = 'studio';
        }
      }

      // Track highest plan
      if (planLevels[plan] > planLevels[highestPlan]) {
        highestPlan = plan;
      }

      // Save subscription
      const enhancedSubscription = {
        ...subscription,
        userId,
        plan,
        type: 'main',
        savedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        syncSource: 'force_sync'
      };

      await kv.set(`subscription:${subscription.id}`, enhancedSubscription);
      subscriptionIds.push(subscription.id);

      console.log(`🔄 FORCE SYNC: Saved subscription ${subscription.id} with plan ${plan}, status: ${subscription.status}`);
    }

    // Step 5: Update user's subscription list
    await kv.set(`user:${userId}:subscriptions`, subscriptionIds);

    // Step 6: Find active subscription and save user subscription data
    const activeSubscription = allSubscriptions.find(sub => sub.status === 'active');
    if (activeSubscription) {
      const subscriptionData = {
        userId,
        status: 'subscribed',
        plan: highestPlan,
        stripeCustomerId: customerId,
        subscriptionId: activeSubscription.id,
        currentPeriodStart: activeSubscription.current_period_start ? 
          new Date(activeSubscription.current_period_start * 1000).toISOString() : null,
        currentPeriodEnd: activeSubscription.current_period_end ? 
          new Date(activeSubscription.current_period_end * 1000).toISOString() : null,
        lastSynced: new Date().toISOString(),
        syncSource: 'force_sync'
      };

      await kv.set(`subscription:${userId}`, subscriptionData);
      console.log(`🔄 FORCE SYNC: Saved user subscription data with plan ${highestPlan}`);
    }

    console.log(`✅ FORCE SYNC: Successfully synced ${subscriptionIds.length} subscriptions for user ${userId}`);

    return c.json({
      success: true,
      message: 'Successfully synced subscriptions from Stripe',
      customerId,
      subscriptionCount: subscriptionIds.length,
      activeSubscription: activeSubscription ? {
        id: activeSubscription.id,
        status: activeSubscription.status,
        plan: highestPlan
      } : null,
      allSubscriptions: allSubscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_end: sub.current_period_end
      }))
    });

  } catch (error) {
    console.error('❌ FORCE SYNC: Error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to sync from Stripe',
      details: error.message 
    }, 500);
  }
});

// Get subscription by ID
app.get('/subscription/:subscriptionId', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const subscriptionId = c.req.param('subscriptionId');
    const subscriptionData = await kv.get(`subscription:${subscriptionId}`);

    if (!subscriptionData) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    // Verify user owns this subscription
    if (subscriptionData.userId !== verification.user.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    return c.json({
      success: true,
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error getting subscription:', error);
    return c.json({ 
      error: 'Failed to get subscription',
      details: error.message 
    }, 500);
  }
});

// Update subscription status
app.put('/subscription/:subscriptionId/status', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const subscriptionId = c.req.param('subscriptionId');
    const body = await c.req.json();
    const { status, reason } = body;

    const subscriptionData = await kv.get(`subscription:${subscriptionId}`);
    if (!subscriptionData) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    // Verify user owns this subscription
    if (subscriptionData.userId !== verification.user.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Update subscription status
    const updatedSubscription = {
      ...subscriptionData,
      status,
      statusReason: reason,
      statusUpdatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await kv.set(`subscription:${subscriptionId}`, updatedSubscription);

    console.log(`📊 SUBSCRIPTION MGMT: Updated subscription ${subscriptionId} status to ${status}`);

    return c.json({
      success: true,
      message: 'Subscription status updated',
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error updating subscription status:', error);
    return c.json({ 
      error: 'Failed to update subscription status',
      details: error.message 
    }, 500);
  }
});

// Get user's Stripe customer information
app.get('/user-stripe-customer', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const userId = verification.user.id;
    const customerId = await kv.get(`user:${userId}:stripe:customer`);

    return c.json({
      success: true,
      customerId: customerId || null,
      hasCustomer: !!customerId
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error getting customer info:', error);
    return c.json({ 
      error: 'Failed to get customer info',
      details: error.message 
    }, 500);
  }
});

// Clear all subscription data for a user (for testing/debugging)
app.delete('/clear-user-subscriptions', async (c) => {
  try {
    const verification = await verifyUser(c.req.raw);
    if (verification.error) {
      return c.json({ error: verification.error }, verification.status);
    }

    const userId = verification.user.id;
    console.log(`🧹 SUBSCRIPTION MGMT: Clearing all subscriptions for user ${userId}`);

    // Get user's subscriptions
    const subscriptionIds = await kv.get(`user:${userId}:subscriptions`) || [];

    // Mark all subscriptions as deleted
    for (const subId of subscriptionIds) {
      const subscriptionData = await kv.get(`subscription:${subId}`);
      if (subscriptionData) {
        const deletedSubscription = {
          ...subscriptionData,
          status: 'cleared',
          clearedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        await kv.set(`subscription:${subId}`, deletedSubscription);
      }
    }

    // Clear user's subscription list
    await kv.del(`user:${userId}:subscriptions`);

    console.log(`🧹 SUBSCRIPTION MGMT: Cleared ${subscriptionIds.length} subscriptions for user ${userId}`);

    return c.json({
      success: true,
      message: `Cleared ${subscriptionIds.length} subscriptions`,
      clearedCount: subscriptionIds.length
    });

  } catch (error) {
    console.error('❌ SUBSCRIPTION MGMT: Error clearing subscriptions:', error);
    return c.json({ 
      error: 'Failed to clear subscriptions',
      details: error.message 
    }, 500);
  }
});

export default app;