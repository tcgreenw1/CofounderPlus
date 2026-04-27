import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Helper function to get Stripe customer data
async function getStripeCustomer(customerId: string) {
  if (!STRIPE_SECRET_KEY) return null;

  try {
    const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
    });
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Error fetching Stripe customer:', error);
    return null;
  }
}

// Helper function to get Stripe subscriptions for a customer
async function getStripeSubscriptions(customerId: string) {
  if (!STRIPE_SECRET_KEY) return [];

  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=all&expand[]=data.items.data.price.product`, {
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching Stripe subscriptions:', error);
    return [];
  }
}

// Helper function to detect plan from subscription
function detectPlanFromSubscription(subscription: any): string {
  if (!subscription?.items?.data?.length) return 'free';

  for (const item of subscription.items.data) {
    const priceId = item.price.id;
    const productName = item.price.product?.name?.toLowerCase() || '';
    const unitAmount = item.price.unit_amount;
    const interval = item.price.recurring?.interval;

    // Try environment variable matching first
    const creatorPriceId = Deno.env.get('STRIPE_CREATOR_PRICE_ID');
    const creatorAnnualPriceId = Deno.env.get('STRIPE_CREATOR_ANNUAL_PRICE_ID');
    const builderPriceId = Deno.env.get('STRIPE_BUILDER_PRICE_ID');
    const builderAnnualPriceId = Deno.env.get('STRIPE_BUILDER_ANNUAL_PRICE_ID');
    const studioPriceId = Deno.env.get('STRIPE_STUDIO_PRICE_ID');
    const studioAnnualPriceId = Deno.env.get('STRIPE_STUDIO_ANNUAL_PRICE_ID');

    if ((creatorPriceId && priceId === creatorPriceId) || 
        (creatorAnnualPriceId && priceId === creatorAnnualPriceId)) {
      return 'creator';
    }
    if ((builderPriceId && priceId === builderPriceId) || 
        (builderAnnualPriceId && priceId === builderAnnualPriceId)) {
      return 'builder';
    }
    if ((studioPriceId && priceId === studioPriceId) || 
        (studioAnnualPriceId && priceId === studioAnnualPriceId)) {
      return 'studio';
    }

    // Fallback: Try price amount detection
    if (unitAmount) {
      if (interval === 'year') {
        if (unitAmount === 16800) return 'creator'; // $168/year ($14/mo)
        if (unitAmount === 46800) return 'builder'; // $468/year ($39/mo)
        if (unitAmount === 190800) return 'studio'; // $1908/year ($159/mo)
      } else if (interval === 'month') {
        if (unitAmount === 1900) return 'creator'; // $19/month
        if (unitAmount === 4900) return 'builder'; // $49/month
        if (unitAmount === 19900) return 'studio'; // $199/month
      }
    }

    // Fallback: Try name detection
    if (productName.includes('creator')) return 'creator';
    if (productName.includes('builder')) return 'builder';
    if (productName.includes('studio')) return 'studio';
  }

  return 'free';
}

// Helper function to get user limits based on subscription
function getUserLimitsFromStripe(subscriptions: any[]) {
  let plan = 'free';
  let maxUsers = 1;
  let subscription = null;

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  
  if (activeSubscriptions.length === 0) {
    return { plan, maxUsers, subscription: null };
  }

  // Find the highest tier active subscription
  let highestTierLevel = 0;
  const tierLevels = { 'free': 0, 'creator': 1, 'builder': 2, 'studio': 3 };

  for (const sub of activeSubscriptions) {
    const detectedPlan = detectPlanFromSubscription(sub);
    const tierLevel = tierLevels[detectedPlan] || 0;
    
    if (tierLevel > highestTierLevel) {
      highestTierLevel = tierLevel;
      plan = detectedPlan;
      subscription = sub;
    }
  }

  // Set user limits based on plan
  switch (plan) {
    case 'creator':
      maxUsers = 1;
      break;
    case 'builder':
      maxUsers = 2;
      break;
    case 'studio':
      maxUsers = 3;
      break;
    default:
      maxUsers = 1;
      plan = 'free';
  }

  return { plan, maxUsers, subscription };
}

// Helper function to search customers by email
async function searchCustomersByEmail(email: string) {
  if (!STRIPE_SECRET_KEY || !email) return [];

  try {
    const response = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=10`, {
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
    });

    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error searching customers by email:', error);
    return [];
  }
}

// ===== CORE STRIPE ENDPOINTS =====

// Subscription status endpoint
app.get('/subscription-status/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const email = c.req.query('email');
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }

    // Check KV store first
    let subscriptionData = await kv.get(`subscription:${userId}`);
    let stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    // If no customer ID stored and email provided, try to find it
    if (!stripeCustomerId && email) {
      const customers = await searchCustomersByEmail(email);
      if (customers.length > 0) {
        stripeCustomerId = customers[0].id;
        await kv.set(`stripe_customer:${userId}`, stripeCustomerId);
      }
    }
    
    // Get fresh data from Stripe if we have a customer ID
    if (stripeCustomerId) {
      const subscriptions = await getStripeSubscriptions(stripeCustomerId);
      const { plan, maxUsers, subscription } = getUserLimitsFromStripe(subscriptions);
      
      // Update KV store with fresh data if we have an active subscription
      if (subscription && subscription.status === 'active') {
        subscriptionData = {
          userId,
          stripeCustomerId,
          subscriptionId: subscription.id,
          status: 'subscribed',
          plan,
          billingPeriod: subscription.items.data[0]?.price?.recurring?.interval || 'monthly',
          maxUsers,
          created_at: subscriptionData?.created_at || new Date().toISOString(),
          current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
          source: 'subscription_status_refresh'
        };
        
        await kv.set(`subscription:${userId}`, subscriptionData);
        
        return c.json({
          status: 'subscribed' as const,
          plan,
          trial: null,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            billing_period: subscription.items.data[0]?.price?.recurring?.interval || 'monthly'
          },
          stripeCustomerId,
          userLimits: {
            currentUserCount: 1,
            maxUsers,
            addOnSeats: 0,
            addOnMonthlyCost: 0,
            canAddUsers: maxUsers > 1,
            subscriptionPlan: plan
          }
        });
      }
    }
    
    // Return free plan if no active subscription found
    return c.json({
      status: 'free' as const,
      plan: 'free',
      trial: null,
      subscription: null,
      stripeCustomerId: stripeCustomerId || null,
      userLimits: {
        currentUserCount: 1,
        maxUsers: 1,
        addOnSeats: 0,
        addOnMonthlyCost: 0,
        canAddUsers: false,
        subscriptionPlan: 'free'
      }
    });
    
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return c.json({
      status: 'free' as const,
      plan: 'free',
      trial: null,
      subscription: null,
      stripeCustomerId: null,
      userLimits: {
        currentUserCount: 1,
        maxUsers: 1,
        addOnSeats: 0,
        addOnMonthlyCost: 0,
        canAddUsers: false,
        subscriptionPlan: 'free'
      }
    });
  }
});

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (c) => {
  console.error('🛒 Stripe Checkout: Endpoint called');
  try {
    if (!STRIPE_SECRET_KEY) {
      console.error('🛒 Stripe Checkout: No Stripe secret key configured');
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const { userId, userEmail, userName, plan, billingPeriod = 'monthly', successUrl, cancelUrl } = await c.req.json();
    
    console.error('🛒 Stripe Checkout: Request received:', { userId, userEmail, plan, billingPeriod });
    console.error(`🛒 Stripe Checkout: Billing period is: ${billingPeriod} (${billingPeriod === 'annual' ? 'ANNUAL' : 'MONTHLY'})`);
    
    if (!userId || !plan) {
      console.error('🛒 Stripe Checkout: Missing userId or plan');
      return c.json({ success: false, error: 'User ID and plan are required' }, 400);
    }

    // Clean up any debug subscription data
    const debugSubscriptionData = await kv.get(`subscription:${userId}`);
    if (debugSubscriptionData && debugSubscriptionData.source === 'debug_force_override') {
      await kv.del(`subscription:${userId}`);
    }

    // Get or create Stripe customer
    let stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!stripeCustomerId || stripeCustomerId.startsWith('debug_customer_')) {
      const customerData = new URLSearchParams({
        email: userEmail,
        'metadata[userId]': userId
      });
      
      if (userName) {
        customerData.append('name', userName);
      }

      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: customerData
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        return c.json({ success: false, error: 'Failed to create Stripe customer', details: errorText }, 500);
      }

      const customer = await customerResponse.json();
      stripeCustomerId = customer.id;
      await kv.set(`stripe_customer:${userId}`, stripeCustomerId);
    }

    // Get price ID for the plan
    const priceEnvVars = {
      creator: billingPeriod === 'annual' ? 'STRIPE_CREATOR_ANNUAL_PRICE_ID' : 'STRIPE_CREATOR_PRICE_ID',
      builder: billingPeriod === 'annual' ? 'STRIPE_BUILDER_ANNUAL_PRICE_ID' : 'STRIPE_BUILDER_PRICE_ID',
      studio: billingPeriod === 'annual' ? 'STRIPE_STUDIO_ANNUAL_PRICE_ID' : 'STRIPE_STUDIO_PRICE_ID'
    };

    const selectedEnvVar = priceEnvVars[plan as keyof typeof priceEnvVars];
    console.error(`🛒 Stripe Checkout: Looking for env var: ${selectedEnvVar}`);
    
    let priceId = Deno.env.get(selectedEnvVar);
    console.error(`🛒 Stripe Checkout: Price ID from env: ${priceId || 'NOT FOUND - will create test price'}`);

    // If no price ID in env vars, create a test price
    if (!priceId) {
      console.error(`🛒 Stripe Checkout: Creating dynamic price for ${plan} (${billingPeriod})`);
      
      const priceAmounts = {
        creator: billingPeriod === 'annual' ? 16800 : 1900,
        builder: billingPeriod === 'annual' ? 46800 : 4900,
        studio: billingPeriod === 'annual' ? 190800 : 19900
      };

      const amount = priceAmounts[plan as keyof typeof priceAmounts];
      const interval = billingPeriod === 'annual' ? 'year' : 'month';
      console.error(`🛒 Stripe Checkout: Amount: $${amount/100}, Interval: ${interval}`);
      
      // Create product
      const productResponse = await fetch('https://api.stripe.com/v1/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: `Cofounder ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} subscription plan`
        })
      });

      if (!productResponse.ok) {
        return c.json({ success: false, error: 'Failed to create Stripe product' }, 500);
      }

      const product = await productResponse.json();

      // Create price
      const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          product: product.id,
          unit_amount: amount.toString(),
          currency: 'usd',
          'recurring[interval]': interval,
          'recurring[usage_type]': 'licensed'
        })
      });

      if (!priceResponse.ok) {
        return c.json({ success: false, error: 'Failed to create Stripe price' }, 500);
      }

      const price = await priceResponse.json();
      priceId = price.id;
      console.error(`🛒 Stripe Checkout: Created dynamic price: ${priceId}`);
    }

    console.error(`🛒 Stripe Checkout: Final price ID to use: ${priceId}`);
    console.error(`🛒 Stripe Checkout: Creating checkout session with 3-day trial for ${plan} (${billingPeriod})`);
    
    // Create checkout session
    const checkoutData = new URLSearchParams({
      'success_url': successUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': cancelUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/pricing`,
      'payment_method_types[0]': 'card',
      'mode': 'subscription',
      'customer': stripeCustomerId,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '3',
      'client_reference_id': userId,
      'metadata[userId]': userId,
      'metadata[plan]': plan,
      'metadata[billingPeriod]': billingPeriod
    });

    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: checkoutData
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error('🛒 Stripe Checkout: Stripe API error:', errorText);
      return c.json({ success: false, error: 'Failed to create checkout session', details: errorText }, 500);
    }

    const session = await checkoutResponse.json();
    console.error('🛒 Stripe Checkout: Session created successfully:', session.id);

    return c.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,  // Frontend expects sessionUrl, not checkoutUrl
      checkoutUrl: session.url  // Keep for backward compatibility
    });

  } catch (error) {
    console.error('🛒 Stripe Checkout: Error creating checkout session:', error);
    return c.json({ success: false, error: error?.message || 'Unknown error' }, 500);
  }
});

// Create Customer Portal Session
app.post('/create-customer-portal/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { returnUrl } = await c.req.json();
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }

    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!stripeCustomerId || stripeCustomerId.startsWith('debug_customer_')) {
      return c.json({ 
        success: false, 
        error: 'No billing account found. Please subscribe to a plan first to access billing management.' 
      }, 404);
    }

    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: stripeCustomerId,
        return_url: returnUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/billing`
      })
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      return c.json({ success: false, error: 'Failed to create billing portal session', details: errorText }, 500);
    }

    const portalSession = await portalResponse.json();

    return c.json({
      success: true,
      portalUrl: portalSession.url,
      sessionId: portalSession.id
    });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===== STRIPE PAYMENT SYSTEM TEST ENDPOINTS =====

// Health check endpoint
app.get('/health', async (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'stripe-handler'
  });
});

// Stripe configuration check
app.get('/stripe/config-check', async (c) => {
  const configStatus = {
    stripeSecretKey: !!STRIPE_SECRET_KEY,
    supabaseUrl: !!SUPABASE_URL,
    supabaseServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
    environmentVariables: {
      stripeCreatorPriceId: !!Deno.env.get('STRIPE_CREATOR_PRICE_ID'),
      stripeBuilderPriceId: !!Deno.env.get('STRIPE_BUILDER_PRICE_ID'),
      stripeStudioPriceId: !!Deno.env.get('STRIPE_STUDIO_PRICE_ID'),
      stripePublishableKey: !!Deno.env.get('STRIPE_PUBLISHABLE_KEY')
    }
  };

  const allConfigured = configStatus.stripeSecretKey && configStatus.supabaseUrl && configStatus.supabaseServiceKey;
  
  if (allConfigured) {
    return c.json({
      success: true,
      message: 'Stripe configuration is properly set up',
      config: configStatus
    });
  } else {
    return c.json({
      success: false,
      error: 'Stripe configuration is incomplete',
      config: configStatus
    }, 400);
  }
});

// Test customer portal access (dry run)
app.post('/stripe/test-customer-portal/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { dryRun } = await c.req.json();
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }

    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!stripeCustomerId) {
      return c.json({
        success: false,
        error: 'No Stripe customer found - user needs to create a subscription first',
        canAccessPortal: false
      });
    }

    if (stripeCustomerId.startsWith('debug_customer_')) {
      return c.json({
        success: false,
        error: 'Debug customer detected - cannot access real billing portal',
        canAccessPortal: false,
        isDebugCustomer: true
      });
    }

    if (dryRun) {
      const customer = await getStripeCustomer(stripeCustomerId);
      
      if (customer) {
        return c.json({
          success: true,
          message: 'Customer portal access confirmed',
          canAccessPortal: true,
          customerId: stripeCustomerId,
          customerEmail: customer.email
        });
      } else {
        return c.json({
          success: false,
          error: 'Stripe customer not found',
          canAccessPortal: false
        });
      }
    }

    return c.json({
      success: true,
      message: 'Portal test completed'
    });

  } catch (error) {
    console.error('Error testing customer portal:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Subscription status endpoint (compatibility route)
app.get('/subscription/status/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }

    const subscriptionData = await kv.get(`subscription:${userId}`);
    const stripeCustomerId = await kv.get(`stripe_customer:${userId}`);

    if (subscriptionData && subscriptionData.status === 'subscribed') {
      return c.json({
        success: true,
        plan: subscriptionData.plan,
        status: subscriptionData.status,
        subscriptionId: subscriptionData.subscriptionId,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        billingPeriod: subscriptionData.billingPeriod,
        maxUsers: subscriptionData.maxUsers || 1,
        isActive: true
      });
    }

    return c.json({
      success: true,
      plan: 'free',
      status: 'free',
      subscriptionId: null,
      stripeCustomerId: stripeCustomerId || null,
      billingPeriod: null,
      maxUsers: 1,
      isActive: false
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Payment methods check endpoint
app.get('/stripe/payment-methods-check/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }

    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!stripeCustomerId) {
      return c.json({
        success: false,
        error: 'No Stripe customer found',
        hasPaymentMethods: false
      });
    }

    if (stripeCustomerId.startsWith('debug_customer_')) {
      return c.json({
        success: true,
        message: 'Debug customer detected - payment processing simulated',
        hasPaymentMethods: true,
        isDebugCustomer: true,
        paymentMethodsCount: 1
      });
    }

    const customer = await getStripeCustomer(stripeCustomerId);
    
    if (!customer) {
      return c.json({
        success: false,
        error: 'Customer not found in Stripe',
        hasPaymentMethods: false
      });
    }

    const paymentMethodsResponse = await fetch(`https://api.stripe.com/v1/payment_methods?customer=${stripeCustomerId}&type=card`, {
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
    });

    if (paymentMethodsResponse.ok) {
      const paymentMethodsData = await paymentMethodsResponse.json();
      const paymentMethodsCount = paymentMethodsData.data?.length || 0;

      return c.json({
        success: true,
        message: 'Payment methods check completed',
        hasPaymentMethods: paymentMethodsCount > 0,
        paymentMethodsCount,
        customerEmail: customer.email
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to fetch payment methods from Stripe',
        hasPaymentMethods: false
      });
    }

  } catch (error) {
    console.error('Error checking payment methods:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Add compatibility route for customer portal with /stripe prefix
app.post('/stripe/create-customer-portal/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const { returnUrl } = await c.req.json();
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }

    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!stripeCustomerId || stripeCustomerId.startsWith('debug_customer_')) {
      return c.json({ 
        success: false, 
        error: 'No billing account found. Please subscribe to a plan first to access billing management.' 
      }, 404);
    }

    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: stripeCustomerId,
        return_url: returnUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/billing`
      })
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      return c.json({ success: false, error: 'Failed to create billing portal session', details: errorText }, 500);
    }

    const portalSession = await portalResponse.json();

    return c.json({
      success: true,
      portalUrl: portalSession.url,
      sessionId: portalSession.id
    });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;