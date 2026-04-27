import { Hono } from 'npm:hono';
import Stripe from 'npm:stripe@17.3.1';
import { createClient } from 'npm:@supabase/supabase-js@2.47.10';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export const seatPurchaseRouter = new Hono();

// Purchase seats endpoint
seatPurchaseRouter.post('/purchase-seats', async (c) => {
  try {
    console.log('🪑 SEAT PURCHASE: Starting seat purchase request');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('🪑 SEAT PURCHASE: No authorization header');
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    // Extract token and verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('🪑 SEAT PURCHASE: Auth failed:', authError);
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    console.log('🪑 SEAT PURCHASE: Authenticated user:', user.email);

    // Parse request body
    const body = await c.req.json();
    const { additionalSeats, seatPriceMonthly, totalCost, userId, userEmail } = body;

    console.log('🪑 SEAT PURCHASE: Request body:', {
      additionalSeats,
      seatPriceMonthly,
      totalCost,
      userId,
      userEmail
    });

    // Validate input
    if (!additionalSeats || additionalSeats < 1 || additionalSeats > 50) {
      return c.json({ 
        success: false, 
        error: 'Invalid seat count. Must be between 1 and 50.' 
      }, 400);
    }

    if (!seatPriceMonthly || seatPriceMonthly !== 12) {
      return c.json({ 
        success: false, 
        error: 'Invalid seat price. Expected $12/month per seat.' 
      }, 400);
    }

    if (totalCost !== additionalSeats * seatPriceMonthly) {
      return c.json({ 
        success: false, 
        error: 'Total cost calculation mismatch.' 
      }, 400);
    }

    // Create or find Stripe customer
    let stripeCustomerId: string;
    
    // First try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
      console.log('🪑 SEAT PURCHASE: Found existing customer:', stripeCustomerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
          source: 'seat_purchase'
        }
      });
      stripeCustomerId = customer.id;
      console.log('🪑 SEAT PURCHASE: Created new customer:', stripeCustomerId);
    }

    // Create checkout session for seat subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Additional Team Seats (${additionalSeats} seats)`,
              description: `Add ${additionalSeats} team member${additionalSeats > 1 ? 's' : ''} to your Cofounder account`,
              metadata: {
                type: 'additional_seats',
                seat_count: additionalSeats.toString()
              }
            },
            unit_amount: seatPriceMonthly * 100, // Convert to cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: additionalSeats
        }
      ],
      success_url: `${(c.req.header('Referer') || 'https://cofounderplus.com').replace(/\/$/, '')}/dashboard?seat_purchase=success&seats=${additionalSeats}`,
      cancel_url: `${(c.req.header('Referer') || 'https://cofounderplus.com').replace(/\/$/, '')}/dashboard?seat_purchase=cancelled`,
      metadata: {
        type: 'seat_purchase',
        user_id: userId,
        additional_seats: additionalSeats.toString(),
        seat_price_monthly: seatPriceMonthly.toString(),
        total_monthly_cost: totalCost.toString()
      },
      subscription_data: {
        metadata: {
          type: 'additional_seats',
          user_id: userId,
          seat_count: additionalSeats.toString()
        }
      }
    });

    console.log('🪑 SEAT PURCHASE: Created checkout session:', checkoutSession.id);
    console.log('🪑 SEAT PURCHASE: Checkout URL:', checkoutSession.url);

    // Store purchase attempt in KV store for tracking
    const purchaseRecord = {
      sessionId: checkoutSession.id,
      userId,
      userEmail,
      additionalSeats,
      totalCost,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Note: We'll implement KV storage after confirming the checkout flow works
    console.log('🪑 SEAT PURCHASE: Purchase record to store:', purchaseRecord);

    return c.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      additionalSeats,
      totalCost
    });

  } catch (error: any) {
    console.error('🪑 SEAT PURCHASE: Error creating checkout session:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to create checkout session',
      details: error.stack
    }, 500);
  }
});

// Get current seat count for a user
seatPurchaseRouter.get('/seat-count/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    console.log('🪑 SEAT COUNT: Getting seat count for user:', userId);

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

    // For now, return default seat count (1)
    // Later we'll implement proper seat tracking in the database
    const currentSeats = 1; // Default seat count
    
    return c.json({
      success: true,
      currentSeats,
      userId
    });

  } catch (error: any) {
    console.error('🪑 SEAT COUNT: Error getting seat count:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to get seat count'
    }, 500);
  }
});

// Webhook handler for seat purchase completion (to be called by Stripe webhook)
seatPurchaseRouter.post('/seat-purchase-webhook', async (c) => {
  try {
    console.log('🪑 SEAT WEBHOOK: Processing seat purchase webhook');
    
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');
    
    if (!signature) {
      console.log('🪑 SEAT WEBHOOK: No Stripe signature');
      return c.json({ success: false, error: 'No Stripe signature' }, 400);
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.log('🪑 SEAT WEBHOOK: No webhook secret configured');
      return c.json({ success: false, error: 'Webhook secret not configured' }, 500);
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.log('🪑 SEAT WEBHOOK: Webhook signature verification failed:', err.message);
      return c.json({ success: false, error: 'Webhook signature verification failed' }, 400);
    }

    console.log('🪑 SEAT WEBHOOK: Event type:', event.type);

    // Handle successful seat purchase
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.type === 'seat_purchase') {
        console.log('🪑 SEAT WEBHOOK: Processing completed seat purchase');
        
        const userId = session.metadata.user_id;
        const additionalSeats = parseInt(session.metadata.additional_seats || '0');
        
        console.log('🪑 SEAT WEBHOOK: User:', userId, 'Additional seats:', additionalSeats);
        
        // Here we would update the user's seat count in the database
        // For now, just log the successful purchase
        console.log('🪑 SEAT WEBHOOK: Seat purchase completed successfully');
        
        return c.json({ success: true, message: 'Seat purchase processed' });
      }
    }

    // Handle subscription events
    if (event.type === 'invoice.payment_succeeded' || 
        event.type === 'invoice.payment_failed' ||
        event.type === 'customer.subscription.deleted') {
      
      const eventData = event.data.object as Stripe.Invoice | Stripe.Subscription;
      console.log('🪑 SEAT WEBHOOK: Subscription event:', event.type);
      
      // Process subscription events related to seats
      // Implementation will be added in the next phase
    }

    return c.json({ success: true, message: 'Webhook processed' });

  } catch (error: any) {
    console.error('🪑 SEAT WEBHOOK: Error processing webhook:', error);
    
    return c.json({
      success: false,
      error: error.message || 'Failed to process webhook'
    }, 500);
  }
});

export default seatPurchaseRouter;