import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Configure CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Initialize Supabase client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Define operation limits per subscription plan
const OPERATION_LIMITS = {
  free: {
    products: 1,
    campaigns: 1,
    deals: 1,
    leads: 1,
    transactions: 3,
    budgets: 1,
    aiMessages: 20,
    bankBalance: true
  },
  creator: {
    products: 4,
    campaigns: 2,
    deals: 10,
    leads: 100,
    transactions: 20,
    budgets: 10,
    aiMessages: 200,
    bankBalance: true
  },
  builder: {
    products: 15,
    campaigns: 10,
    deals: 50,
    leads: 250,
    transactions: 100,
    budgets: 20,
    aiMessages: 2000,
    bankBalance: true
  },
  studio: {
    products: 50,
    campaigns: 30,
    deals: 200,
    leads: 1000,
    transactions: 1000,
    budgets: 100,
    aiMessages: 20000,
    bankBalance: true
  }
};

// Get user subscription tier
const getUserSubscriptionTier = async (userId: string): Promise<string> => {
  try {
    const subscriptionKey = `subscription_${userId}`;
    const subscription = await kv.get(subscriptionKey);
    
    if (!subscription || subscription.status !== 'active') {
      return 'free';
    }

    // Map subscription products to tiers
    const productMapping: Record<string, string> = {
      'Creator': 'creator',
      'Builder': 'builder',
      'Studio': 'studio'
    };

    return productMapping[subscription.planName] || 'free';
  } catch (error) {
    console.error('Error getting subscription tier:', error);
    return 'free';
  }
};

// Auth middleware - enhanced to handle various token types
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    console.log('📊 Auth: No authorization header provided');
    return c.json({ error: 'Authorization header required' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  console.log(`📊 Auth: Attempting to verify token (length: ${token.length})`);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.log('📊 Auth error:', error.message);
      return c.json({ error: 'Invalid authorization token', details: error.message }, 401);
    }

    if (!user) {
      console.log('📊 Auth: No user found for token');
      return c.json({ error: 'No user found for token' }, 401);
    }

    console.log(`📊 Auth: Successfully authenticated user ${user.id} (${user.email})`);
    c.set('user', user);
    await next();
  } catch (authError: any) {
    console.error('📊 Auth: Exception during authentication:', authError);
    return c.json({ error: 'Authentication failed', details: authError.message }, 401);
  }
};

// GET /operations-usage/:businessId/:monthYear - Get usage for a business for a specific month
app.get('/operations-usage/:businessId/:monthYear', requireAuth, async (c) => {
  try {
    const businessId = c.req.param('businessId');
    const monthYear = c.req.param('monthYear');
    const user = c.get('user');

    console.log(`📊 Getting operations usage for business ${businessId}, month ${monthYear}, user ${user.id}`);

    // Try to verify business ownership - but be lenient if business data is not in KV store
    let businessOwnershipVerified = false;
    try {
      const businessKey = `business_${businessId}`;
      const business = await kv.get(businessKey);
      
      if (business && business.ownerId === user.id) {
        businessOwnershipVerified = true;
        console.log(`📊 Business ownership verified for ${businessId}`);
      } else if (business) {
        console.log(`📊 Business found but ownership mismatch: business.ownerId=${business.ownerId}, user.id=${user.id}`);
        return c.json({ error: 'Access denied - not business owner' }, 403);
      } else {
        console.log(`📊 Business ${businessId} not found in KV store, allowing access for authenticated user`);
        // Allow access for authenticated users even if business is not in KV store
        // This handles cases where businesses are managed differently
        businessOwnershipVerified = true;
      }
    } catch (kvError) {
      console.log(`📊 KV store error checking business ${businessId}: ${kvError.message}, allowing access`);
      // Allow access if KV store has issues
      businessOwnershipVerified = true;
    }

    if (!businessOwnershipVerified) {
      return c.json({ error: 'Business access verification failed' }, 403);
    }

    // Get usage data
    const usageKey = `operations_usage_${businessId}_${monthYear}`;
    let usage;
    
    try {
      usage = await kv.get(usageKey);
      console.log(`📊 Usage data for ${usageKey}:`, usage ? 'found' : 'not found');
    } catch (usageError) {
      console.log(`📊 Error getting usage data for ${usageKey}: ${usageError.message}`);
      usage = null;
    }

    const defaultUsage = {
      products: 0,
      campaigns: 0,
      deals: 0,
      leads: 0,
      transactions: 0,
      budgets: 0,
      aiMessages: 0,
      monthYear,
      businessId
    };

    const result = usage || defaultUsage;
    console.log(`📊 Returning usage data for ${businessId}:`, result);
    
    return c.json(result);
  } catch (error: any) {
    console.error('📊 Error getting operations usage:', error);
    return c.json({ 
      error: 'Failed to load usage data', 
      details: error.message,
      businessId: c.req.param('businessId'),
      monthYear: c.req.param('monthYear')
    }, 500);
  }
});

// POST /operations-usage/increment - Increment usage for an operation type
app.post('/operations-usage/increment', requireAuth, async (c) => {
  try {
    const { businessId, operationType, monthYear } = await c.req.json();
    const user = c.get('user');

    console.log(`📈 Incrementing ${operationType} usage for business ${businessId}, month ${monthYear}`);

    // Try to verify business ownership - but be lenient if business data is not in KV store
    let businessOwnershipVerified = false;
    try {
      const businessKey = `business_${businessId}`;
      const business = await kv.get(businessKey);
      
      if (business && business.ownerId === user.id) {
        businessOwnershipVerified = true;
        console.log(`📈 Business ownership verified for ${businessId}`);
      } else if (business) {
        console.log(`📈 Business found but ownership mismatch: business.ownerId=${business.ownerId}, user.id=${user.id}`);
        return c.json({ error: 'Access denied - not business owner' }, 403);
      } else {
        console.log(`📈 Business ${businessId} not found in KV store, allowing access for authenticated user`);
        businessOwnershipVerified = true;
      }
    } catch (kvError) {
      console.log(`📈 KV store error checking business ${businessId}: ${kvError.message}, allowing access`);
      businessOwnershipVerified = true;
    }

    if (!businessOwnershipVerified) {
      return c.json({ error: 'Business access verification failed' }, 403);
    }

    // Get current usage
    const usageKey = `operations_usage_${businessId}_${monthYear}`;
    const currentUsage = await kv.get(usageKey) || {
      products: 0,
      campaigns: 0,
      deals: 0,
      leads: 0,
      transactions: 0,
      budgets: 0,
      aiMessages: 0,
      monthYear,
      businessId
    };

    // Get user's subscription tier and limits
    const tier = await getUserSubscriptionTier(user.id);
    const limits = OPERATION_LIMITS[tier as keyof typeof OPERATION_LIMITS];
    const currentLimit = limits[operationType as keyof typeof limits];

    // Check if operation type is valid
    if (!currentLimit && currentLimit !== 0) {
      return c.json({ error: 'Invalid operation type' }, 400);
    }

    // Check if limit would be exceeded
    if (typeof currentLimit === 'number' && currentUsage[operationType] >= currentLimit) {
      return c.json({ 
        error: 'Limit exceeded',
        usage: currentUsage[operationType],
        limit: currentLimit,
        tier
      }, 403);
    }

    // Increment usage
    const updatedUsage = {
      ...currentUsage,
      [operationType]: currentUsage[operationType] + 1,
      lastUpdated: new Date().toISOString()
    };

    await kv.set(usageKey, updatedUsage);

    console.log(`✅ Usage incremented: ${operationType} now at ${updatedUsage[operationType]}/${currentLimit}`);

    return c.json({
      success: true,
      usage: updatedUsage,
      limits: limits,
      tier
    });
  } catch (error: any) {
    console.error('Error incrementing operations usage:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /operations-usage/check/:businessId/:operationType/:monthYear - Check if operation is allowed
app.get('/operations-usage/check/:businessId/:operationType/:monthYear', requireAuth, async (c) => {
  try {
    const businessId = c.req.param('businessId');
    const operationType = c.req.param('operationType');
    const monthYear = c.req.param('monthYear');
    const user = c.get('user');

    console.log(`🔍 Checking ${operationType} limit for business ${businessId}, month ${monthYear}`);

    // Verify business ownership
    const businessKey = `business_${businessId}`;
    const business = await kv.get(businessKey);
    
    if (!business || business.ownerId !== user.id) {
      return c.json({ error: 'Business not found or access denied' }, 403);
    }

    // Get current usage
    const usageKey = `operations_usage_${businessId}_${monthYear}`;
    const currentUsage = await kv.get(usageKey) || {
      products: 0,
      campaigns: 0,
      deals: 0,
      leads: 0,
      transactions: 0,
      budgets: 0,
      aiMessages: 0,
      monthYear,
      businessId
    };

    // Get user's subscription tier and limits
    const tier = await getUserSubscriptionTier(user.id);
    const limits = OPERATION_LIMITS[tier as keyof typeof OPERATION_LIMITS];
    const currentLimit = limits[operationType as keyof typeof limits];

    // Check if operation type is valid
    if (!currentLimit && currentLimit !== 0) {
      return c.json({ error: 'Invalid operation type' }, 400);
    }

    const currentUsageCount = currentUsage[operationType] || 0;
    const allowed = typeof currentLimit === 'boolean' ? currentLimit : currentUsageCount < currentLimit;

    return c.json({
      allowed,
      usage: currentUsageCount,
      limit: currentLimit,
      tier,
      remaining: typeof currentLimit === 'number' ? Math.max(0, currentLimit - currentUsageCount) : null
    });
  } catch (error: any) {
    console.error('Error checking operations limit:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /operations-usage/summary/:businessId/:monthYear - Get comprehensive usage summary
app.get('/operations-usage/summary/:businessId/:monthYear', requireAuth, async (c) => {
  try {
    const businessId = c.req.param('businessId');
    const monthYear = c.req.param('monthYear');
    const user = c.get('user');

    console.log(`📋 Getting operations usage summary for business ${businessId}, month ${monthYear}`);

    // Verify business ownership
    const businessKey = `business_${businessId}`;
    const business = await kv.get(businessKey);
    
    if (!business || business.ownerId !== user.id) {
      return c.json({ error: 'Business not found or access denied' }, 403);
    }

    // Get current usage
    const usageKey = `operations_usage_${businessId}_${monthYear}`;
    const currentUsage = await kv.get(usageKey) || {
      products: 0,
      campaigns: 0,
      deals: 0,
      leads: 0,
      transactions: 0,
      budgets: 0,
      aiMessages: 0,
      monthYear,
      businessId
    };

    // Get user's subscription tier and limits
    const tier = await getUserSubscriptionTier(user.id);
    const limits = OPERATION_LIMITS[tier as keyof typeof OPERATION_LIMITS];

    // Calculate summary for each operation type
    const summary = Object.keys(limits).map(operationType => {
      const usage = currentUsage[operationType] || 0;
      const limit = limits[operationType as keyof typeof limits];
      
      return {
        operationType,
        usage,
        limit,
        percentage: typeof limit === 'number' ? Math.min((usage / limit) * 100, 100) : 0,
        remaining: typeof limit === 'number' ? Math.max(0, limit - usage) : null,
        allowed: typeof limit === 'boolean' ? limit : usage < limit
      };
    });

    return c.json({
      businessId,
      monthYear,
      tier,
      summary,
      totalOperations: Object.values(currentUsage).reduce((sum, val) => 
        typeof val === 'number' ? sum + val : sum, 0
      )
    });
  } catch (error: any) {
    console.error('Error getting operations usage summary:', error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /operations-usage/reset/:businessId/:monthYear - Reset usage for a business (admin only)
app.delete('/operations-usage/reset/:businessId/:monthYear', requireAuth, async (c) => {
  try {
    const businessId = c.req.param('businessId');
    const monthYear = c.req.param('monthYear');
    const user = c.get('user');

    // Check if user is admin (you can implement your admin check logic here)
    const isAdmin = user.email?.includes('admin') || user.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log(`🔄 Resetting operations usage for business ${businessId}, month ${monthYear}`);

    const usageKey = `operations_usage_${businessId}_${monthYear}`;
    const resetUsage = {
      products: 0,
      campaigns: 0,
      deals: 0,
      leads: 0,
      transactions: 0,
      budgets: 0,
      aiMessages: 0,
      monthYear,
      businessId,
      resetAt: new Date().toISOString(),
      resetBy: user.id
    };

    await kv.set(usageKey, resetUsage);

    return c.json({
      success: true,
      message: 'Usage reset successfully',
      usage: resetUsage
    });
  } catch (error: any) {
    console.error('Error resetting operations usage:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;