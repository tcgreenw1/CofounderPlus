/**
 * Subscription Lifecycle Notifications
 * Handles notifications for subscription renewals, payments, cancellations, and credit management
 * Integrates with Stripe webhooks to track subscription lifecycle events
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { sendPushNotification } from './push-notification-helper.tsx';

const PLAN_CREDITS = {
  free: 500,
  creator: 5000,
  builder: 20000,
  studio: 150000
};

interface NotificationData {
  userId: string;
  type: 'renewal_reminder' | 'renewal_success' | 'payment_failed' | 'subscription_cancelled' | 'credits_renewed' | 'credits_rollover';
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Send notification to user (both push and in-app)
 */
async function sendNotification(notification: NotificationData): Promise<void> {
  try {
    console.log(`📬 Subscription Notification: Sending ${notification.type} to user ${notification.userId}`);

    // Create in-app notification
    const inAppNotification = {
      id: `${notification.type}_${Date.now()}`,
      type: notification.type,
      title: notification.title,
      message: notification.body,
      timestamp: new Date().toISOString(),
      read: false,
      data: notification.data || {},
      category: 'subscription'
    };

    // Get existing notifications
    const notificationsKey = `user_notifications:${notification.userId}`;
    const existingNotifs = await kv.get(notificationsKey);
    let notifications = [];
    
    if (existingNotifs && typeof existingNotifs === 'string') {
      notifications = JSON.parse(existingNotifs);
    } else if (Array.isArray(existingNotifs)) {
      notifications = existingNotifs;
    }

    // Add new notification at the start
    notifications.unshift(inAppNotification);

    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications = notifications.slice(0, 50);
    }

    // Save to KV
    await kv.set(notificationsKey, JSON.stringify(notifications));

    // Send push notification if device token exists
    const deviceTokenKey = `push_token:${notification.userId}`;
    const deviceToken = await kv.get(deviceTokenKey);

    if (deviceToken) {
      await sendPushNotification({
        to: deviceToken,
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          ...(notification.data || {})
        },
        priority: notification.priority || 'high',
        sound: 'default'
      });
      console.log(`✅ Subscription Notification: Push notification sent to user ${notification.userId}`);
    } else {
      console.log(`ℹ️ Subscription Notification: No device token for user ${notification.userId}, in-app only`);
    }

  } catch (error) {
    console.error(`❌ Subscription Notification: Error sending notification:`, error);
  }
}

/**
 * Send renewal reminder notifications
 * Called by scheduler: 7 days, 3 days, 1 day before renewal
 */
export async function sendRenewalReminder(
  userId: string,
  daysUntilRenewal: number,
  plan: string,
  renewalDate: Date,
  amount: number
): Promise<void> {
  const planDisplay = plan === 'creator' ? 'Launch' : plan === 'builder' ? 'Grow' : plan === 'studio' ? 'Scale' : 'Free';
  
  await sendNotification({
    userId,
    type: 'renewal_reminder',
    title: `Subscription Renewal in ${daysUntilRenewal} ${daysUntilRenewal === 1 ? 'Day' : 'Days'}`,
    body: `Your ${planDisplay} plan will renew on ${renewalDate.toLocaleDateString()} for $${amount}.`,
    data: {
      plan,
      renewalDate: renewalDate.toISOString(),
      amount,
      daysUntilRenewal
    },
    priority: daysUntilRenewal === 1 ? 'high' : 'normal'
  });

  // Log the reminder
  const logKey = `subscription_reminder_log:${userId}:${new Date().toISOString()}`;
  await kv.set(logKey, JSON.stringify({
    userId,
    type: 'renewal_reminder',
    daysUntilRenewal,
    sentAt: new Date().toISOString()
  }));
}

/**
 * Send successful renewal notification
 * Called when payment succeeds and subscription renews
 */
export async function sendRenewalSuccessNotification(
  userId: string,
  plan: string,
  nextRenewalDate: Date,
  creditsAdded: number,
  currentBalance: number
): Promise<void> {
  const planDisplay = plan === 'creator' ? 'Launch' : plan === 'builder' ? 'Grow' : plan === 'studio' ? 'Scale' : 'Free';
  
  await sendNotification({
    userId,
    type: 'renewal_success',
    title: '✅ Subscription Renewed Successfully',
    body: `Your ${planDisplay} plan has renewed! ${creditsAdded.toLocaleString()} credits added. New balance: ${currentBalance.toLocaleString()} credits.`,
    data: {
      plan,
      nextRenewalDate: nextRenewalDate.toISOString(),
      creditsAdded,
      currentBalance
    },
    priority: 'high'
  });

  // Log successful renewal
  const logKey = `subscription_renewal_log:${userId}:${new Date().toISOString()}`;
  await kv.set(logKey, JSON.stringify({
    userId,
    type: 'renewal_success',
    plan,
    creditsAdded,
    currentBalance,
    renewedAt: new Date().toISOString()
  }));
}

/**
 * Send payment failed notification
 * Called when payment fails during renewal
 */
export async function sendPaymentFailedNotification(
  userId: string,
  plan: string,
  amount: number,
  retryDate?: Date
): Promise<void> {
  const planDisplay = plan === 'creator' ? 'Launch' : plan === 'builder' ? 'Grow' : plan === 'studio' ? 'Scale' : 'Free';
  
  const body = retryDate
    ? `Payment for your ${planDisplay} plan failed. We'll retry on ${retryDate.toLocaleDateString()}. Please update your payment method.`
    : `Payment for your ${planDisplay} plan failed. Please update your payment method to avoid service interruption.`;

  await sendNotification({
    userId,
    type: 'payment_failed',
    title: '⚠️ Payment Failed',
    body,
    data: {
      plan,
      amount,
      retryDate: retryDate?.toISOString()
    },
    priority: 'high'
  });

  // Log payment failure
  const logKey = `subscription_payment_failed_log:${userId}:${new Date().toISOString()}`;
  await kv.set(logKey, JSON.stringify({
    userId,
    type: 'payment_failed',
    plan,
    amount,
    failedAt: new Date().toISOString()
  }));
}

/**
 * Send subscription cancelled notification
 * Called when subscription is cancelled (voluntary or due to non-payment)
 */
export async function sendSubscriptionCancelledNotification(
  userId: string,
  plan: string,
  reason: 'voluntary' | 'non_payment' | 'other',
  accessUntil?: Date
): Promise<void> {
  const planDisplay = plan === 'creator' ? 'Launch' : plan === 'builder' ? 'Grow' : plan === 'studio' ? 'Scale' : 'Free';
  
  let body: string;
  if (reason === 'non_payment') {
    body = `Your ${planDisplay} plan was cancelled due to payment failure.`;
    if (accessUntil) {
      body += ` You'll have access until ${accessUntil.toLocaleDateString()}.`;
    }
  } else {
    body = `Your ${planDisplay} plan has been cancelled.`;
    if (accessUntil) {
      body += ` You'll continue to have access until ${accessUntil.toLocaleDateString()}.`;
    }
  }

  await sendNotification({
    userId,
    type: 'subscription_cancelled',
    title: reason === 'non_payment' ? '❌ Subscription Cancelled - Payment Failed' : 'Subscription Cancelled',
    body,
    data: {
      plan,
      reason,
      accessUntil: accessUntil?.toISOString()
    },
    priority: 'high'
  });

  // Log cancellation
  const logKey = `subscription_cancellation_log:${userId}:${new Date().toISOString()}`;
  await kv.set(logKey, JSON.stringify({
    userId,
    type: 'subscription_cancelled',
    plan,
    reason,
    cancelledAt: new Date().toISOString()
  }));
}

/**
 * Send credits renewed notification
 * Called when monthly credits are replenished
 */
export async function sendCreditsRenewedNotification(
  userId: string,
  plan: string,
  creditsAdded: number,
  newBalance: number
): Promise<void> {
  const planDisplay = plan === 'creator' ? 'Launch' : plan === 'builder' ? 'Grow' : plan === 'studio' ? 'Scale' : 'Free';
  
  await sendNotification({
    userId,
    type: 'credits_renewed',
    title: '🎁 Monthly Credits Added',
    body: `${creditsAdded.toLocaleString()} ${planDisplay} plan credits added! New balance: ${newBalance.toLocaleString()} credits.`,
    data: {
      plan,
      creditsAdded,
      newBalance
    },
    priority: 'normal'
  });
}

/**
 * Send credits rollover notification
 * Called when unused credits roll over to next period
 */
export async function sendCreditsRolloverNotification(
  userId: string,
  plan: string,
  rolledOverAmount: number,
  newBalance: number,
  wasCapped: boolean,
  cap?: number
): Promise<void> {
  let body = `${rolledOverAmount.toLocaleString()} unused credits rolled over!`;
  if (wasCapped && cap) {
    body += ` Note: Credits capped at ${cap.toLocaleString()} (maximum for your plan).`;
  }
  body += ` New balance: ${newBalance.toLocaleString()} credits.`;

  await sendNotification({
    userId,
    type: 'credits_rollover',
    title: '🔄 Credits Rolled Over',
    body,
    data: {
      plan,
      rolledOverAmount,
      newBalance,
      wasCapped,
      cap
    },
    priority: 'normal'
  });
}

/**
 * Check all users for upcoming renewals and send reminders
 * Called by scheduler (runs daily)
 */
export async function checkAndSendRenewalReminders(): Promise<{
  checked: number;
  reminded: number;
  errors: number;
}> {
  console.log('🔔 Subscription Notifications: Checking for upcoming renewals...');

  let checked = 0;
  let reminded = 0;
  let errors = 0;

  try {
    // Get all subscription data
    const allSubscriptions = await kv.getByPrefix('subscription:');
    console.log(`📊 Found ${allSubscriptions.length} subscriptions to check`);

    for (const item of allSubscriptions) {
      try {
        checked++;
        
        const subscription = typeof item === 'string' ? JSON.parse(item) : item;
        const userId = subscription.userId || subscription.user_id;
        
        if (!userId) continue;

        // Only check active subscriptions
        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
          continue;
        }

        // Get renewal date from subscription
        const currentPeriodEnd = subscription.current_period_end;
        if (!currentPeriodEnd) continue;

        const renewalDate = new Date(typeof currentPeriodEnd === 'number' ? currentPeriodEnd * 1000 : currentPeriodEnd);
        const now = new Date();
        const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send reminders at 7, 3, and 1 days
        if (daysUntilRenewal === 7 || daysUntilRenewal === 3 || daysUntilRenewal === 1) {
          // Check if we already sent a reminder for this period
          const reminderKey = `reminder_sent:${userId}:${daysUntilRenewal}:${renewalDate.toISOString().split('T')[0]}`;
          const alreadySent = await kv.get(reminderKey);

          if (!alreadySent) {
            const plan = subscription.plan || 'free';
            const amount = subscription.amount || 0;

            await sendRenewalReminder(userId, daysUntilRenewal, plan, renewalDate, amount / 100);
            
            // Mark reminder as sent
            await kv.set(reminderKey, 'sent', { expirationTtl: 86400 * 8 }); // Expire after 8 days
            
            reminded++;
            console.log(`✅ Sent ${daysUntilRenewal}-day reminder to user ${userId}`);
          }
        }

      } catch (error) {
        console.error('❌ Error processing subscription for reminders:', error);
        errors++;
      }
    }

    console.log(`✅ Renewal reminders check complete: ${checked} checked, ${reminded} reminded, ${errors} errors`);
    
    return { checked, reminded, errors };
  } catch (error) {
    console.error('❌ Error in checkAndSendRenewalReminders:', error);
    return { checked, reminded, errors };
  }
}

/**
 * Process subscription renewal from Stripe webhook
 * Syncs credits with actual billing cycle
 */
export async function processSubscriptionRenewal(
  userId: string,
  subscription: any
): Promise<void> {
  try {
    console.log(`💳 Processing subscription renewal for user ${userId}`);

    const plan = subscription.plan || subscription.items?.data?.[0]?.price?.product?.name || 'free';
    const planKey = plan.toLowerCase().includes('studio') || plan.toLowerCase().includes('scale') ? 'studio' :
                    plan.toLowerCase().includes('builder') || plan.toLowerCase().includes('grow') ? 'builder' :
                    plan.toLowerCase().includes('creator') || plan.toLowerCase().includes('launch') ? 'creator' : 'free';

    const monthlyAllocation = PLAN_CREDITS[planKey as keyof typeof PLAN_CREDITS];
    
    // Get current credits
    const currentCreditsValue = await kv.get(`credits:${userId}`);
    const currentCredits = currentCreditsValue 
      ? (typeof currentCreditsValue === 'number' ? currentCreditsValue : parseInt(currentCreditsValue))
      : 0;

    // Calculate rollover
    const rolledOver = Math.max(0, currentCredits);
    const rolloverCap = monthlyAllocation * 2;
    
    // Add monthly allocation
    let newBalance = rolledOver + monthlyAllocation;
    let wasCapped = false;
    
    if (newBalance > rolloverCap) {
      newBalance = rolloverCap;
      wasCapped = true;
    }

    // Update credits
    await kv.set(`credits:${userId}`, newBalance);
    await kv.set(`credits:${userId}:plan`, planKey);

    // Update renewal date
    const nextRenewalDate = new Date(subscription.current_period_end * 1000);
    await kv.set(`credits:${userId}:renewal_date`, nextRenewalDate.toISOString());

    // Send notifications
    await sendRenewalSuccessNotification(userId, planKey, nextRenewalDate, monthlyAllocation, newBalance);
    
    if (rolledOver > 0) {
      await sendCreditsRolloverNotification(userId, planKey, rolledOver, newBalance, wasCapped, rolloverCap);
    } else {
      await sendCreditsRenewedNotification(userId, planKey, monthlyAllocation, newBalance);
    }

    console.log(`✅ Subscription renewal processed for user ${userId}:`, {
      plan: planKey,
      previousBalance: currentCredits,
      monthlyAllocation,
      rolledOver,
      newBalance,
      wasCapped,
      nextRenewalDate
    });

  } catch (error) {
    console.error(`❌ Error processing subscription renewal for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Start the renewal reminder scheduler (runs daily at midnight UTC)
 */
export function startRenewalReminderScheduler() {
  console.log('🕐 Renewal Reminder Scheduler: Starting (runs daily at midnight UTC)');

  // Calculate time until next midnight UTC
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  // Run at midnight, then every 24 hours
  setTimeout(() => {
    checkAndSendRenewalReminders();
    
    setInterval(() => {
      checkAndSendRenewalReminders();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, msUntilMidnight);

  // Also run immediately on startup
  checkAndSendRenewalReminders();
}
