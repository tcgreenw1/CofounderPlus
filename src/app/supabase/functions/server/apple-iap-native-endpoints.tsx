/**
 * Native Apple IAP Endpoints
 * Handles receipt validation and subscription management
 * Direct integration with Apple's App Store APIs
 * NO RevenueCat dependency
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Apple App Store API endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// Shared secret from App Store Connect (for subscription verification)
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET') || '';

/**
 * Validate receipt with Apple servers
 * Tries production first, then sandbox if needed
 */
async function verifyReceiptWithApple(receiptData: string): Promise<any> {
  const body = JSON.stringify({
    'receipt-data': receiptData,
    'password': APPLE_SHARED_SECRET,
    'exclude-old-transactions': true,
  });

  // Try production first
  let response = await fetch(APPLE_PRODUCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  let data = await response.json();

  // If status is 21007, receipt is from sandbox - retry with sandbox URL
  if (data.status === 21007) {
    console.log('🔄 Receipt is from sandbox, retrying...');
    response = await fetch(APPLE_SANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    data = await response.json();
  }

  return data;
}

/**
 * Extract active subscriptions from Apple receipt response
 */
function extractActiveSubscriptions(appleResponse: any): string[] {
  if (!appleResponse.latest_receipt_info) {
    return [];
  }

  const now = Date.now();
  const activeProducts: string[] = [];

  for (const transaction of appleResponse.latest_receipt_info) {
    const expiresMs = parseInt(transaction.expires_date_ms || '0');
    
    // Check if subscription is still active
    if (expiresMs > now) {
      const productId = transaction.product_id;
      if (!activeProducts.includes(productId)) {
        activeProducts.push(productId);
      }
    }
  }

  return activeProducts;
}

/**
 * Map Apple product ID to internal plan
 */
function mapProductToPlan(productId: string): { planId: string; billingPeriod: string } | null {
  const mapping: Record<string, { planId: string; billingPeriod: string }> = {
    'com.cofounderplus.launch.monthly': { planId: 'creator', billingPeriod: 'monthly' },
    'com.cofounderplus.launch.annual': { planId: 'creator', billingPeriod: 'annual' },
    'com.cofounderplus.grow.monthly': { planId: 'builder', billingPeriod: 'monthly' },
    'com.cofounderplus.grow.annual': { planId: 'builder', billingPeriod: 'annual' },
    'com.cofounderplus.scale.monthly': { planId: 'studio', billingPeriod: 'monthly' },
    'com.cofounderplus.scale.annual': { planId: 'studio', billingPeriod: 'annual' },
  };

  return mapping[productId] || null;
}

/**
 * POST /make-server-373d8b09/iap/validate-receipt
 * Validate an Apple receipt and return subscription info
 */
app.post('/validate-receipt', async (c) => {
  try {
    const { receipt, userId } = await c.req.json();

    if (!receipt) {
      return c.json({ error: 'Receipt is required' }, 400);
    }

    console.log('🔐 Validating Apple receipt...');

    // Verify with Apple
    const appleResponse = await verifyReceiptWithApple(receipt);

    // Check validation status
    if (appleResponse.status !== 0) {
      console.error('❌ Apple receipt validation failed:', appleResponse.status);
      return c.json({
        valid: false,
        error: `Apple validation failed with status ${appleResponse.status}`,
      }, 400);
    }

    console.log('✅ Receipt validated by Apple');

    // Extract active subscriptions
    const activeProducts = extractActiveSubscriptions(appleResponse);

    // If user ID provided, sync to database
    if (userId && activeProducts.length > 0) {
      const highestTierProduct = activeProducts[0]; // Take first active (most recent)
      const planInfo = mapProductToPlan(highestTierProduct);

      if (planInfo) {
        console.log(`💾 Syncing IAP subscription for user ${userId}:`, planInfo);

        // Create subscription ID
        const subscriptionId = `iap_sub_${userId}_${planInfo.planId}_${Date.now()}`;
        const now = Date.now();
        
        // Create subscription object in the format expected by the system
        const subscription = {
          id: subscriptionId,
          userId: userId,
          status: 'active',
          plan: planInfo.planId,
          customer: `iap_cus_${userId}`,
          current_period_start: Math.floor(now / 1000),
          current_period_end: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000), // 30 days from now
          items: [
            {
              id: `item_${planInfo.planId}`,
              plan: {
                id: planInfo.planId,
                product: planInfo.planId,
                interval: planInfo.billingPeriod === 'annual' ? 'year' : 'month',
                amount: 0
              }
            }
          ],
          metadata: {
            source: 'apple_iap',
            productId: highestTierProduct,
            billingPeriod: planInfo.billingPeriod,
          },
          savedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          type: 'main'
        };

        // Save the subscription
        await kv.set(`subscription:${subscriptionId}`, JSON.stringify(subscription));
        
        // Update user's subscription list
        const userSubscriptions = [subscriptionId]; // Replace with just this subscription
        await kv.set(`user:${userId}:subscriptions`, JSON.stringify(userSubscriptions));
        
        // Create legacy format for backward compatibility
        const legacyData = {
          status: 'subscribed',
          plan: planInfo.planId,
          trial: null,
          subscription: {
            id: subscriptionId,
            status: 'active',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan_id: planInfo.planId,
            source: 'apple_iap',
            created_at: new Date().toISOString()
          },
          stripeCustomerId: `iap_cus_${userId}`,
          lastUpdated: new Date().toISOString()
        };
        
        // Also store legacy keys for compatibility
        await kv.set(`subscription:${userId}`, JSON.stringify(legacyData));
        await kv.set(`cloud_subscription:${userId}`, JSON.stringify(legacyData));
        
        console.log(`✅ IAP: Successfully saved subscription data for ${planInfo.planId} plan`);
      }
    }

    return c.json({
      success: true,
      valid: true,
      data: {
        activeProducts,
        environment: appleResponse.environment || 'production',
        receipt: appleResponse.receipt,
      },
    });

  } catch (error: any) {
    console.error('❌ Receipt validation error:', error);
    return c.json({ error: error.message || 'Validation failed' }, 500);
  }
});

/**
 * POST /make-server-373d8b09/iap/sync-purchase
 * Sync a completed purchase to the backend
 */
app.post('/sync-purchase', async (c) => {
  try {
    const { userId, productId, transactionId, receipt } = await c.req.json();

    if (!userId || !productId || !receipt) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    console.log(`🔄 Syncing purchase for user ${userId}:`, productId);

    // Validate receipt first
    const appleResponse = await verifyReceiptWithApple(receipt);

    if (appleResponse.status !== 0) {
      return c.json({ error: 'Invalid receipt' }, 400);
    }

    // Get plan info
    const planInfo = mapProductToPlan(productId);
    if (!planInfo) {
      return c.json({ error: 'Unknown product ID' }, 400);
    }

    // Store subscription
    await kv.set(`user:${userId}:subscription`, {
      source: 'apple_iap',
      planId: planInfo.planId,
      billingPeriod: planInfo.billingPeriod,
      productId,
      transactionId,
      purchasedAt: new Date().toISOString(),
      receipt: receipt.substring(0, 50) + '...',
    });

    // Set active plan
    await kv.set(`user:${userId}:active_plan`, planInfo.planId);

    console.log(`✅ Purchase synced successfully`);

    return c.json({
      success: true,
      planId: planInfo.planId,
      billingPeriod: planInfo.billingPeriod,
    });

  } catch (error: any) {
    console.error('❌ Purchase sync error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /make-server-373d8b09/iap/restore-purchases
 * Restore and sync previous purchases
 */
app.post('/restore-purchases', async (c) => {
  try {
    const { userId, transactions } = await c.req.json();

    if (!userId || !transactions || !Array.isArray(transactions)) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    console.log(`♻️ Restoring ${transactions.length} purchases for user ${userId}`);

    let restoredCount = 0;
    let highestPlan: any = null;

    for (const transaction of transactions) {
      // Validate each receipt
      const appleResponse = await verifyReceiptWithApple(transaction.receipt);
      
      if (appleResponse.status === 0) {
        const activeProducts = extractActiveSubscriptions(appleResponse);
        
        if (activeProducts.length > 0) {
          const planInfo = mapProductToPlan(activeProducts[0]);
          
          if (planInfo) {
            // Keep track of highest tier plan
            if (!highestPlan || planInfo.planId > highestPlan.planId) {
              highestPlan = {
                ...planInfo,
                productId: activeProducts[0],
                transactionId: transaction.transactionId,
              };
            }
            restoredCount++;
          }
        }
      }
    }

    // Set the highest tier plan as active
    if (highestPlan) {
      await kv.set(`user:${userId}:subscription`, {
        source: 'apple_iap',
        planId: highestPlan.planId,
        billingPeriod: highestPlan.billingPeriod,
        productId: highestPlan.productId,
        restoredAt: new Date().toISOString(),
      });

      await kv.set(`user:${userId}:active_plan`, highestPlan.planId);
    }

    console.log(`✅ Restored ${restoredCount} purchases`);

    return c.json({
      success: true,
      restoredCount,
      activePlan: highestPlan?.planId || null,
    });

  } catch (error: any) {
    console.error('❌ Restore purchases error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /make-server-373d8b09/iap/subscription-status
 * Get current subscription status for a user
 */
app.get('/subscription-status', async (c) => {
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const subscription = await kv.get(`user:${userId}:subscription`);

    if (!subscription) {
      return c.json({
        hasSubscription: false,
        planId: null,
      });
    }

    return c.json({
      hasSubscription: true,
      planId: subscription.planId,
      billingPeriod: subscription.billingPeriod,
      source: subscription.source,
    });

  } catch (error: any) {
    console.error('❌ Subscription status error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;