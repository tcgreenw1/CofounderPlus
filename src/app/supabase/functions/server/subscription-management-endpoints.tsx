import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_cache.tsx';

const app = new Hono();

// Configure CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// REMOVED: Module-level Supabase client creation (causes JSON contamination)
// Now creating clients inside route handlers

// Helper function to verify user authentication
async function verifyUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'No authorization header', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  
  // Check if token looks valid (basic JWT format check)
  if (!token || token.length < 50 || !token.startsWith('eyJ')) {
    console.error('🔴 VERIFY USER: Invalid token format:', { 
      hasToken: !!token, 
      length: token?.length,
      prefix: token?.substring(0, 10)
    });
    return { error: 'Invalid token format', status: 401 };
  }
  
  try {
    // Create Supabase client inside function to avoid module-level initialization
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    console.log('🔍 VERIFY USER: Attempting to verify token...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('🔴 VERIFY USER: Supabase auth error:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return { error: `Invalid token: ${error.message}`, status: 401 };
    }
    
    if (!user) {
      console.error('🔴 VERIFY USER: No user returned from Supabase');
      return { error: 'Invalid token: No user found', status: 401 };
    }
    
    console.log('✅ VERIFY USER: Token verified for user:', user.id);
    return { user, error: null };
  } catch (error: any) {
    console.error('🔴 VERIFY USER: Exception during auth verification:', {
      message: error.message,
      stack: error.stack
    });
    return { error: `Auth verification failed: ${error.message}`, status: 401 };
  }
}

// Helper function to get current organization ID for a user
async function getCurrentOrganizationId(userId: string): Promise<string> {
  try {
    const contextKey = `user_current_org:${userId}`;
    const context = await kv.get(contextKey);
    
    if (!context) {
      // No org context set, user is in their own organization
      return userId;
    }
    
    const parsedContext = typeof context === 'string' ? JSON.parse(context) : context;
    return parsedContext.organizationId || userId;
  } catch (error) {
    console.error('❌ Error getting current organization:', error);
    // Fallback to user's own organization on error
    return userId;
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

    // CRITICAL: Get the organization ID - subscriptions belong to the organization owner
    const organizationId = await getCurrentOrganizationId(userId);
    console.log(`📊 SUBSCRIPTION: User ${userId} is in organization ${organizationId}`);

    // Fetch subscriptions for the ORGANIZATION OWNER, not the current user
    // This ensures members see the organization's subscription, not their own
    const subscriptionIds = await kv.get(`user:${organizationId}:subscriptions`) || [];

    // Get detailed subscription data
    const subscriptions = [];
    for (const subId of subscriptionIds) {
      const subscriptionData = await kv.get(`subscription:${subId}`);
      if (subscriptionData) {
        // Parse if it's a JSON string (for backwards compatibility)
        const parsed = typeof subscriptionData === 'string' ? JSON.parse(subscriptionData) : subscriptionData;
        subscriptions.push(parsed);
      }
    }

    // CRITICAL FIX: Also check for Apple IAP subscription stored at legacy location
    // This handles subscriptions created via the old receipt validation endpoint
    // Check for the ORGANIZATION owner's legacy subscription, not the current user
    const legacyAppleIAPSub = await kv.get(`subscription:${organizationId}`);
    if (legacyAppleIAPSub) {
      console.log('📱 Found legacy Apple IAP subscription for organization:', organizationId);
      // Parse if it's a JSON string
      const parsed = typeof legacyAppleIAPSub === 'string' ? JSON.parse(legacyAppleIAPSub) : legacyAppleIAPSub;
      
      // Only add if not already in the list (avoid duplicates)
      const alreadyExists = subscriptions.some(sub => 
        sub.platform === 'apple_iap' || 
        (sub.metadata && sub.metadata.source === 'apple_iap')
      );
      
      if (!alreadyExists) {
        subscriptions.push(parsed);
      }
    }

    // Also check cloud_subscription location (another legacy location)
    const cloudAppleIAPSub = await kv.get(`cloud_subscription:${organizationId}`);
    if (cloudAppleIAPSub && !legacyAppleIAPSub) {
      console.log('📱 Found cloud Apple IAP subscription for organization:', organizationId);
      const parsed = typeof cloudAppleIAPSub === 'string' ? JSON.parse(cloudAppleIAPSub) : cloudAppleIAPSub;
      
      // Only add if not already in the list
      const alreadyExists = subscriptions.some(sub => 
        sub.platform === 'apple_iap' || 
        (sub.metadata && sub.metadata.source === 'apple_iap')
      );
      
      if (!alreadyExists) {
        subscriptions.push(parsed);
      }
    }

    console.log(`📋 Returning ${subscriptions.length} subscription(s) for organization ${organizationId} (requested by user ${userId})`);
    
    return c.json({
      success: true,
      subscriptions,
      count: subscriptions.length
    });

  } catch (error) {
    console.error('❌ Error fetching user subscriptions:', error);
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
    }

    // If this subscription has a customer ID, create mapping
    if (subscription.customer) {
      await kv.set(`stripe:customer:${subscription.customer}:user`, userId);
      await kv.set(`user:${userId}:stripe:customer`, subscription.customer);
    }

    return c.json({
      success: true,
      message: 'Subscription saved successfully',
      subscriptionId: subscription.id
    });

  } catch (error) {
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

    return c.json({
      success: true,
      message: 'Subscription removed successfully'
    });

  } catch (error) {
    return c.json({ 
      error: 'Failed to remove subscription',
      details: error.message 
    }, 500);
  }
});

export default app;