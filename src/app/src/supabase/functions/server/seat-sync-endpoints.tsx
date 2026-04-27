import { Hono } from 'npm:hono';
import Stripe from 'npm:stripe@17.3.1';
import { createClient } from 'npm:@supabase/supabase-js@2.47.10';
import * as kv from './kv_store.tsx';

// Global safe date utility
function createSafeDate(input?: any): Date {
  try {
    if (!input) return new Date();
    
    // If it's already a Date object
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? new Date() : input;
    }
    
    // If it's a timestamp (number)
    if (typeof input === 'number') {
      if (isNaN(input) || input <= 0) return new Date();
      // Handle both seconds and milliseconds timestamps
      const date = input > 1e10 ? new Date(input) : new Date(input * 1000);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // If it's a string
    if (typeof input === 'string') {
      const date = new Date(input);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Fallback for any other input
    return new Date();
  } catch {
    return new Date();
  }
}

// Safe ISO string conversion
function safeToISOString(input?: any, fallbackDescription?: string): string {
  try {
    const date = createSafeDate(input);
    return date.toISOString();
  } catch (error) {
    console.warn(`Safe date conversion failed for ${fallbackDescription}:`, error);
    return new Date().toISOString();
  }
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export const seatSyncRouter = new Hono();

// Dedicated seat subscription sync endpoint - only looks for seat subscriptions for a specific user
seatSyncRouter.post('/sync-seat-subscription', async (c) => {
  try {
    console.log('🪑 SEAT SYNC: Starting dedicated seat subscription sync');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('🪑 SEAT SYNC: No authorization header');
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    // Extract token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('🪑 SEAT SYNC: Auth failed:', authError);
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    console.log('🪑 SEAT SYNC: Authenticated user:', user.email);

    // Parse request body
    const body = await c.req.json();
    const { userId, userEmail } = body;

    // CRITICAL SECURITY CHECK: Ensure the requesting user can only sync their own data
    if (userId !== user.id) {
      console.error('🪑 SEAT SYNC: ❌ SECURITY VIOLATION: User trying to sync different user data!');
      console.error(`🪑 SEAT SYNC: Authenticated user: ${user.id}, Requested user: ${userId}`);
      return c.json({ 
        success: false, 
        error: 'Security violation: Cannot sync data for different user' 
      }, 403);
    }

    console.log(`🪑 SEAT SYNC: 🔒 SECURITY VERIFIED: User ${userId} syncing their own data`);

    // Find the user's Stripe customer ID
    let customerId = await kv.get(`stripe_customer:${userId}`);
    
    // If no mapping found, try to find customer by email
    if (!customerId && userEmail) {
      console.log('🪑 SEAT SYNC: No customer mapping found, searching by email:', userEmail);
      
      const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(userEmail)}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        }
      });

      if (response.ok) {
        const customers = await response.json();
        if (customers.data?.length > 0) {
          customerId = customers.data[0].id;
          console.log('🪑 SEAT SYNC: Found customer by email:', customerId);
          
          // Store the mapping for future use
          await kv.set(`stripe_customer:${userId}`, customerId);
        }
      }
    }

    if (!customerId) {
      console.log('🪑 SEAT SYNC: No Stripe customer found for user');
      return c.json({ 
        success: true, 
        message: 'No Stripe customer found for this user',
        seatSubscription: null
      });
    }

    console.log(`🪑 SEAT SYNC: Found customer ID: ${customerId} for user ${userId}`);

    // Get customer's active subscriptions
    const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=20`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
      }
    });

    if (!subResponse.ok) {
      console.error('🪑 SEAT SYNC: Failed to fetch subscriptions from Stripe');
      return c.json({ 
        success: false, 
        error: 'Failed to fetch subscriptions from Stripe' 
      });
    }

    const subscriptions = await subResponse.json();
    console.log(`🪑 SEAT SYNC: Found ${subscriptions.data.length} active subscriptions for customer ${customerId}`);

    // Look specifically for seat subscriptions
    let seatSubscription = null;
    
    for (const subscription of subscriptions.data) {
      console.log(`🪑 SEAT SYNC: Checking subscription ${subscription.id}`);
      
      // CRITICAL SECURITY CHECK: Verify subscription belongs to this customer
      if (subscription.customer !== customerId) {
        console.error('🪑 SEAT SYNC: ❌ SECURITY VIOLATION: Subscription customer mismatch!');
        continue;
      }
      
      // Check subscription metadata
      if (subscription.metadata?.type === 'additional_seats') {
        console.log('🪑 SEAT SYNC: ✅ Found seat subscription via metadata');
        seatSubscription = subscription;
        break;
      }
      
      // Check subscription items for seat indicators
      if (subscription.items?.data?.length > 0) {
        for (const item of subscription.items.data) {
          const productName = item.price?.product?.name || '';
          const productMetadata = item.price?.product?.metadata || {};
          
          if (productMetadata.type === 'additional_seats' || 
              productName.toLowerCase().includes('additional team seats')) {
            console.log('🪑 SEAT SYNC: ✅ Found seat subscription via product name/metadata');
            seatSubscription = subscription;
            break;
          }
        }
        if (seatSubscription) break;
      }
    }

    if (!seatSubscription) {
      console.log('🪑 SEAT SYNC: No seat subscription found');
      
      // Clear any existing seat data
      await kv.del(`seat_subscription:${userId}`);
      
      return c.json({ 
        success: true, 
        message: 'No seat subscription found',
        seatSubscription: null
      });
    }

    console.log(`🪑 SEAT SYNC: Processing seat subscription ${seatSubscription.id}`);

    // Extract seat information
    const seatCount = parseInt(seatSubscription.metadata?.seat_count || '1');
    const pricePerSeat = 12; // $12/month per seat
    
    // Determine billing period
    let billingPeriod = 'monthly';
    if (seatSubscription.items?.data?.length > 0) {
      const interval = seatSubscription.items.data[0].price?.recurring?.interval;
      if (interval === 'year') {
        billingPeriod = 'annual';
      }
    }

    // Create seat subscription data with safe date handling
    const seatData = {
      userId,
      stripeCustomerId: customerId,
      subscriptionId: seatSubscription.id,
      status: seatSubscription.status === 'active' ? 'active' : seatSubscription.status,
      type: 'seat_subscription',
      seatCount,
      pricePerSeat,
      totalSeats: seatCount,
      billingPeriod,
      created_at: safeToISOString(seatSubscription.created, 'created_at'),
      current_period_start: safeToISOString(seatSubscription.current_period_start, 'current_period_start'),
      current_period_end: safeToISOString(seatSubscription.current_period_end, 'current_period_end'),
      source: 'seat_sync_manual',
      last_updated: safeToISOString(null, 'last_updated'),
      security_verified: true,
      customer_verification_timestamp: safeToISOString(null, 'customer_verification_timestamp')
    };

    console.log(`🪑 SEAT SYNC: 🔐 FINAL SECURITY LOG: Storing seat data for USER ${userId} ONLY`);
    console.log('🪑 SEAT SYNC: Seat data to store:', seatData);

    // Store seat subscription data
    const seatKey = `seat_subscription:${userId}`;
    await kv.set(seatKey, seatData);
    
    console.log(`🪑 SEAT SYNC: ✅ Stored seat subscription data at key: ${seatKey}`);

    return c.json({
      success: true,
      message: `Seat subscription synced: ${seatCount} seats`,
      seatSubscription: seatData,
      securityCheck: {
        userId,
        customerId,
        verified: true
      }
    });

  } catch (error: any) {
    console.error('🪑 SEAT SYNC: Error during seat sync:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to sync seat subscription',
      details: error.stack
    }, 500);
  }
});

// Get current seat data for a user
seatSyncRouter.get('/seat-data/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🪑 SEAT DATA: Getting seat data for user:', userId);

    // Get authorization header and verify user
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.id !== userId) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    // Get seat data from KV store
    const seatData = await kv.get(`seat_subscription:${userId}`);
    
    if (!seatData) {
      return c.json({
        success: true,
        seatData: null,
        message: 'No seat subscription data found'
      });
    }
    
    return c.json({
      success: true,
      seatData,
      userId
    });

  } catch (error: any) {
    console.error('🪑 SEAT DATA: Error getting seat data:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to get seat data'
    }, 500);
  }
});

export default seatSyncRouter;