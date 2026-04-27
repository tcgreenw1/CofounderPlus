import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

/**
 * Apple In-App Purchase Endpoints
 * Direct integration with Apple StoreKit - NO RevenueCat
 * 
 * Uses Apple's native receipt validation
 */

// Apple API Keys (provided by client)
const APPLE_IAP_KEY = `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQggK5UzJxRNoHwVV6h
vAE/kzH+d16nmpDJlrpdESQxOkCgCgYIKoZIzj0DAQehRANCAATwOc6Ye0M05Puw
Uf9p2XbYbf5SJGkGQO7JXCjvRnmjSBLg+mAJ1n/K/uiQluDRNaUw0X2AJs1u7KaP
aHx2O1/5`;

const APP_STORE_CONNECT_KEY = `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg89CbZn/UHx8j4FRP
OU2luZFGRf1wg5xI2SnPUzR1HQ+gCgYIKoZIzj0DAQehRANCAATov/fYtOod3kcx
a4PXTzNCJioIYcp4PieVcIaKbiHkdUuOHoIzshLviEMJpyJGj+7fTnVRxWhniTgJ
If4PBXXe`;

// Product ID to plan mapping
const PLAN_MAPPING: Record<string, string> = {
  '6754335103': 'creator',
  '6754335103_yearly': 'creator',
  '6754335075': 'builder',
  '6754335075_yearly': 'builder',
  '6754334935': 'studio',
  '6754334935_yearly': 'studio'
};

/**
 * Validate receipt with Apple
 */
async function validateReceiptWithApple(receipt: string, isProduction: boolean = true): Promise<any> {
  // Apple's receipt verification URL
  const verifyURL = isProduction
    ? 'https://buy.itunes.apple.com/verifyReceipt'
    : 'https://sandbox.itunes.apple.com/verifyReceipt';

  console.log('Validating receipt with Apple:', isProduction ? 'Production' : 'Sandbox');

  try {
    const response = await fetch(verifyURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'receipt-data': receipt,
        'password': '', // Shared secret - set this in App Store Connect if using auto-renewable subscriptions
        'exclude-old-transactions': true
      })
    });

    if (!response.ok) {
      throw new Error(`Apple validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // If status is 21007, it means we should try sandbox
    if (data.status === 21007 && isProduction) {
      console.log('Receipt is for sandbox, retrying with sandbox URL');
      return validateReceiptWithApple(receipt, false);
    }

    return data;
  } catch (error) {
    console.error('Apple receipt validation error:', error);
    throw error;
  }
}

/**
 * POST /apple-iap/validate
 * Validate an IAP receipt
 */
app.post('/apple-iap/validate', async (c) => {
  try {
    const { receipt, productId } = await c.req.json();

    if (!receipt) {
      return c.json({ error: 'Receipt is required' }, 400);
    }

    console.log('Validating IAP receipt for product:', productId);

    // Get user from authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    // Create Supabase client to verify user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    const userId = user.id;
    console.log('Validating receipt for user:', userId);

    // Validate with Apple
    const validation = await validateReceiptWithApple(receipt);

    console.log('Apple validation response:', validation);

    if (validation.status !== 0) {
      return c.json({
        error: 'Receipt validation failed',
        appleStatus: validation.status
      }, 400);
    }

    // Extract purchase information
    const latestReceipt = validation.latest_receipt_info?.[0] || validation.receipt?.in_app?.[0];
    
    if (!latestReceipt) {
      return c.json({ error: 'No purchase found in receipt' }, 400);
    }

    const purchaseDate = new Date(parseInt(latestReceipt.purchase_date_ms));
    const expiresDate = latestReceipt.expires_date_ms
      ? new Date(parseInt(latestReceipt.expires_date_ms))
      : null;

    // Determine subscription plan
    const planName = PLAN_MAPPING[latestReceipt.product_id] || 'unknown';

    // Store subscription in KV store with actual user ID
    const subscriptionKey = `subscription:${userId}`;
    await kv.set(subscriptionKey, {
      plan: planName,
      productId: latestReceipt.product_id,
      transactionId: latestReceipt.transaction_id,
      purchaseDate: purchaseDate.toISOString(),
      expiresDate: expiresDate?.toISOString(),
      isActive: expiresDate ? expiresDate > new Date() : true,
      platform: 'apple_iap',
      receipt: receipt
    });

    console.log('Subscription stored for user:', userId);

    return c.json({
      success: true,
      subscription: {
        plan: planName,
        productId: latestReceipt.product_id,
        expiresDate: expiresDate?.toISOString(),
        isActive: true
      }
    });
  } catch (error: any) {
    console.error('IAP validation error:', error);
    return c.json({
      error: 'Failed to validate receipt',
      details: error.message
    }, 500);
  }
});

/**
 * POST /apple-iap/sync
 * Sync subscription status from Apple
 */
app.post('/apple-iap/sync', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    // Create Supabase client to verify user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    const userId = user.id;
    console.log('Syncing subscription for user:', userId);

    // Get stored receipt
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey);

    if (!subscription || !subscription.receipt) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    // Re-validate with Apple
    const validation = await validateReceiptWithApple(subscription.receipt);

    if (validation.status !== 0) {
      return c.json({
        error: 'Receipt validation failed',
        appleStatus: validation.status
      }, 400);
    }

    // Check latest status
    const latestReceipt = validation.latest_receipt_info?.[0];
    const expiresDate = latestReceipt?.expires_date_ms
      ? new Date(parseInt(latestReceipt.expires_date_ms))
      : null;

    const isActive = expiresDate ? expiresDate > new Date() : false;

    // Update subscription
    await kv.set(subscriptionKey, {
      ...subscription,
      expiresDate: expiresDate?.toISOString(),
      isActive
    });

    return c.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        isActive,
        expiresDate: expiresDate?.toISOString()
      }
    });
  } catch (error: any) {
    console.error('IAP sync error:', error);
    return c.json({
      error: 'Failed to sync subscription',
      details: error.message
    }, 500);
  }
});

/**
 * GET /apple-iap/status
 * Get current subscription status
 */
app.get('/apple-iap/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    // Create Supabase client to verify user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    const userId = user.id;
    console.log('Getting subscription status for user:', userId);

    // Get subscription from KV store
    const subscriptionKey = `subscription:${userId}`;
    const subscription = await kv.get(subscriptionKey);

    if (!subscription) {
      return c.json({
        hasSubscription: false,
        plan: 'free'
      });
    }

    // Check if subscription is still active
    let isActive = subscription.isActive;
    if (subscription.expiresDate) {
      const expiresDate = new Date(subscription.expiresDate);
      isActive = expiresDate > new Date();
    }

    return c.json({
      hasSubscription: isActive,
      plan: isActive ? subscription.plan : 'free',
      productId: subscription.productId,
      expiresDate: subscription.expiresDate,
      platform: subscription.platform
    });
  } catch (error: any) {
    console.error('IAP status error:', error);
    return c.json({
      error: 'Failed to get subscription status',
      details: error.message
    }, 500);
  }
});

/**
 * POST /apple-iap/webhook
 * Handle Apple Server Notifications (webhooks)
 */
app.post('/apple-iap/webhook', async (c) => {
  try {
    const body = await c.req.json();
    
    console.log('Apple webhook received:', body);

    // Handle different notification types
    const notificationType = body.notification_type;
    const latestReceipt = body.latest_receipt_info;

    if (!latestReceipt) {
      return c.json({ error: 'Invalid webhook payload' }, 400);
    }

    // Determine which user this is for (from original transaction ID)
    const transactionId = latestReceipt.original_transaction_id;
    
    // Find user by transaction ID
    const userSubscriptions = await kv.getByPrefix('subscription:');
    const userEntry = userSubscriptions.find((entry: any) => 
      entry.value?.transactionId === transactionId
    );

    if (!userEntry) {
      console.warn('No user found for transaction:', transactionId);
      return c.json({ received: true });
    }

    const userId = userEntry.key.replace('subscription:', '');
    const subscriptionKey = `subscription:${userId}`;

    // Update subscription based on notification type
    switch (notificationType) {
      case 'DID_RENEW':
        await kv.set(subscriptionKey, {
          ...userEntry.value,
          expiresDate: new Date(parseInt(latestReceipt.expires_date_ms)).toISOString(),
          isActive: true
        });
        console.log('Subscription renewed for user:', userId);
        break;

      case 'CANCEL':
      case 'DID_FAIL_TO_RENEW':
        await kv.set(subscriptionKey, {
          ...userEntry.value,
          isActive: false
        });
        console.log('Subscription cancelled/failed for user:', userId);
        break;

      case 'INITIAL_BUY':
        await kv.set(subscriptionKey, {
          ...userEntry.value,
          expiresDate: new Date(parseInt(latestReceipt.expires_date_ms)).toISOString(),
          isActive: true
        });
        console.log('Initial purchase for user:', userId);
        break;
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return c.json({
      error: 'Failed to process webhook',
      details: error.message
    }, 500);
  }
});

export default app;