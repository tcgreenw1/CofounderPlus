/**
 * Subscription Webhook Handler
 * Handles Stripe webhooks for subscription lifecycle events
 * Integrates with notification system and credit management
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import Stripe from 'npm:stripe@14.14.0';
import * as kv from './kv_store.tsx';
import {
  processSubscriptionRenewal,
  sendPaymentFailedNotification,
  sendSubscriptionCancelledNotification,
  sendRenewalReminder
} from './subscription-lifecycle-notifications.tsx';

const webhookRouter = new Hono();

// Configure CORS
webhookRouter.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Stripe-Signature'],
}));

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not configured');
}

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not configured - webhook signature verification disabled');
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

/**
 * Get user ID from Stripe customer ID
 */
async function getUserIdFromCustomerId(customerId: string): Promise<string | null> {
  try {
    // Try to find user by customer ID
    const allUsers = await kv.getByPrefix('user:');
    
    for (const userData of allUsers) {
      try {
        const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
        if (user.stripeCustomerId === customerId || user.stripe_customer_id === customerId) {
          return user.id || user.userId;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: Check subscription data
    const allSubs = await kv.getByPrefix('subscription:');
    for (const subData of allSubs) {
      try {
        const sub = typeof subData === 'string' ? JSON.parse(subData) : subData;
        if (sub.customer === customerId) {
          return sub.userId || sub.user_id;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error finding user by customer ID:', error);
    return null;
  }
}

/**
 * POST /subscription-webhook
 * Handle Stripe webhook events for subscriptions
 */
webhookRouter.post('/subscription-webhook', async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');

    if (!stripe) {
      console.error('❌ Stripe not initialized');
      return c.json({ error: 'Stripe not configured' }, 500);
    }

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          STRIPE_WEBHOOK_SECRET
        );
        console.log('✅ Webhook signature verified');
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return c.json({ error: `Webhook Error: ${err.message}` }, 400);
      }
    } else {
      // Parse without verification (not recommended for production)
      event = JSON.parse(body);
      console.warn('⚠️ Webhook processed without signature verification');
    }

    console.log(`📬 Received webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💰 Payment succeeded for invoice:', invoice.id);

        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          // This is a subscription renewal
          const customerId = invoice.customer as string;
          const userId = await getUserIdFromCustomerId(customerId);

          if (userId) {
            // Fetch full subscription details
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            // Save updated subscription data
            const subscriptionData = {
              id: subscription.id,
              userId,
              customer: customerId,
              status: subscription.status,
              plan: subscription.items.data[0]?.price?.product,
              priceId: subscription.items.data[0]?.price?.id,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              cancel_at_period_end: subscription.cancel_at_period_end,
              amount: subscription.items.data[0]?.price?.unit_amount,
              interval: subscription.items.data[0]?.price?.recurring?.interval,
              lastUpdated: new Date().toISOString()
            };

            await kv.set(`subscription:${subscription.id}`, subscriptionData);
            await kv.set(`subscription:${userId}`, subscriptionData);

            // Process renewal and send notifications
            await processSubscriptionRenewal(userId, subscriptionData);

            console.log(`✅ Processed subscription renewal for user ${userId}`);
          } else {
            console.warn(`⚠️ Could not find user for customer ${customerId}`);
          }
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('❌ Payment failed for invoice:', invoice.id);

        if (invoice.subscription) {
          const customerId = invoice.customer as string;
          const userId = await getUserIdFromCustomerId(customerId);

          if (userId) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const plan = subscription.items.data[0]?.price?.product;
            const amount = invoice.amount_due;

            // Send payment failed notification
            const nextPaymentAttempt = invoice.next_payment_attempt 
              ? new Date(invoice.next_payment_attempt * 1000)
              : undefined;

            await sendPaymentFailedNotification(userId, plan as string, amount / 100, nextPaymentAttempt);

            console.log(`✅ Sent payment failed notification to user ${userId}`);
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription updated:', subscription.id);

        const customerId = subscription.customer as string;
        const userId = await getUserIdFromCustomerId(customerId);

        if (userId) {
          // Save updated subscription data
          const subscriptionData = {
            id: subscription.id,
            userId,
            customer: customerId,
            status: subscription.status,
            plan: subscription.items.data[0]?.price?.product,
            priceId: subscription.items.data[0]?.price?.id,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            amount: subscription.items.data[0]?.price?.unit_amount,
            interval: subscription.items.data[0]?.price?.recurring?.interval,
            lastUpdated: new Date().toISOString()
          };

          await kv.set(`subscription:${subscription.id}`, subscriptionData);
          await kv.set(`subscription:${userId}`, subscriptionData);

          // Update credit renewal date
          const renewalDate = new Date(subscription.current_period_end * 1000);
          await kv.set(`credits:${userId}:renewal_date`, renewalDate.toISOString());

          console.log(`✅ Updated subscription data for user ${userId}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription deleted:', subscription.id);

        const customerId = subscription.customer as string;
        const userId = await getUserIdFromCustomerId(customerId);

        if (userId) {
          const plan = subscription.items.data[0]?.price?.product as string;
          const accessUntil = new Date(subscription.current_period_end * 1000);

          // Determine cancellation reason
          let reason: 'voluntary' | 'non_payment' | 'other' = 'voluntary';
          if (subscription.status === 'unpaid' || subscription.status === 'past_due') {
            reason = 'non_payment';
          }

          // Send cancellation notification
          await sendSubscriptionCancelledNotification(userId, plan, reason, accessUntil);

          // Update subscription status
          const subscriptionData = await kv.get(`subscription:${userId}`);
          if (subscriptionData) {
            const sub = typeof subscriptionData === 'string' ? JSON.parse(subscriptionData) : subscriptionData;
            sub.status = 'cancelled';
            sub.cancelledAt = new Date().toISOString();
            await kv.set(`subscription:${userId}`, sub);
          }

          console.log(`✅ Processed subscription cancellation for user ${userId}`);
        }

        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('⏰ Trial ending soon:', subscription.id);

        const customerId = subscription.customer as string;
        const userId = await getUserIdFromCustomerId(customerId);

        if (userId) {
          const plan = subscription.items.data[0]?.price?.product as string;
          const trialEnd = new Date(subscription.trial_end! * 1000);
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;

          // This is essentially a renewal reminder for trial users
          const daysUntilEnd = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          // We can reuse the renewal reminder system
          await sendRenewalReminder(userId, daysUntilEnd, plan, trialEnd, amount / 100);

          console.log(`✅ Sent trial ending notification to user ${userId}`);
        }

        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true, type: event.type });

  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default webhookRouter;
