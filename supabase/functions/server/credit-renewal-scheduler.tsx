/**
 * Credit Renewal Scheduler
 * Automatically renews credits monthly for all plans including free tier
 * Runs every hour to check for users who need credit renewal
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';
import { sendCreditsRenewedNotification, sendCreditsRolloverNotification } from './subscription-lifecycle-notifications.tsx';

const PLAN_CREDITS = {
  free: 500,
  creator: 5000,
  builder: 20000,
  studio: 150000
};

const ROLLOVER_CAPS = {
  free: 1000,        // Can rollover up to 2x monthly allocation
  creator: 10000,    // Can rollover up to 2x monthly allocation
  builder: 40000,    // Can rollover up to 2x monthly allocation
  studio: 300000     // Can rollover up to 2x monthly allocation
};

/**
 * Get user's plan from KV store
 */
async function getUserPlan(userId: string): Promise<'free' | 'creator' | 'builder' | 'studio'> {
  try {
    const subscriptionIds = await kv.get(`user:${userId}:subscriptions`) || [];
    
    for (const subId of subscriptionIds) {
      try {
        const subscriptionData = await kv.get(`subscription:${subId}`);
        if (subscriptionData) {
          const sub = typeof subscriptionData === 'string' ? JSON.parse(subscriptionData) : subscriptionData;
          
          if (sub.status === 'active' || sub.status === 'trialing') {
            const planStr = (sub.plan || '').toLowerCase();
            
            // Map plan to credit tier
            if (planStr === 'studio' || planStr === 'scale') {
              return 'studio';
            }
            if (planStr === 'builder' || planStr === 'grow') {
              return 'builder';
            }
            if (planStr === 'creator' || planStr === 'launch') {
              return 'creator';
            }
          }
        }
      } catch (error) {
        console.error(`⚠️ Credit Renewal: Error fetching subscription ${subId}:`, error);
        continue;
      }
    }
    
    // Check legacy location
    try {
      const legacySub = await kv.get(`subscription:${userId}`);
      if (legacySub) {
        const sub = typeof legacySub === 'string' ? JSON.parse(legacySub) : legacySub;
        if (sub.status === 'active' || sub.status === 'trialing') {
          const planStr = (sub.plan || '').toLowerCase();
          
          if (planStr === 'studio' || planStr === 'scale') return 'studio';
          if (planStr === 'builder' || planStr === 'grow') return 'builder';
          if (planStr === 'creator' || planStr === 'launch') return 'creator';
        }
      }
    } catch (error) {
      console.error(`⚠️ Credit Renewal: Error fetching legacy subscription:`, error);
    }

    return 'free';
  } catch (error) {
    console.error('❌ Credit Renewal: Error fetching user plan:', error);
    return 'free';
  }
}

/**
 * Get user's renewal date
 */
async function getRenewalDate(userId: string): Promise<Date | null> {
  try {
    const renewalDateStr = await kv.get(`credits:${userId}:renewal_date`);
    if (renewalDateStr) {
      return new Date(renewalDateStr);
    }
    return null;
  } catch (error) {
    console.error('❌ Credit Renewal: Error fetching renewal date:', error);
    return null;
  }
}

/**
 * Set user's next renewal date
 */
async function setNextRenewalDate(userId: string): Promise<Date> {
  const now = new Date();
  const nextRenewal = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  await kv.set(`credits:${userId}:renewal_date`, nextRenewal.toISOString());
  return nextRenewal;
}

/**
 * Initialize renewal date for new user (or migrated user)
 */
async function initializeRenewalDate(userId: string): Promise<Date> {
  // Check if user already has a renewal date
  const existingDate = await getRenewalDate(userId);
  if (existingDate) {
    return existingDate;
  }
  
  // Set renewal date to 30 days from now for new users
  return await setNextRenewalDate(userId);
}

/**
 * Renew credits for a user
 */
async function renewUserCredits(userId: string): Promise<{
  success: boolean;
  previousBalance: number;
  newBalance: number;
  monthlyAllocation: number;
  rolledOver: number;
  capped: boolean;
}> {
  try {
    // Get current plan
    const plan = await getUserPlan(userId);
    const monthlyAllocation = PLAN_CREDITS[plan];
    const rolloverCap = ROLLOVER_CAPS[plan];

    // Get current credits
    const currentCreditsValue = await kv.get(`credits:${userId}`);
    const currentCredits = currentCreditsValue 
      ? (typeof currentCreditsValue === 'number' ? currentCreditsValue : parseInt(currentCreditsValue))
      : 0;

    // Calculate rollover (unused credits from previous period)
    const rolledOver = Math.max(0, currentCredits);
    
    // Add monthly allocation
    let newBalance = rolledOver + monthlyAllocation;
    
    // Apply rollover cap
    let capped = false;
    if (newBalance > rolloverCap) {
      newBalance = rolloverCap;
      capped = true;
    }

    // Update credits
    await kv.set(`credits:${userId}`, newBalance);
    
    // Update plan tracking
    await kv.set(`credits:${userId}:plan`, plan);

    // Log the renewal
    const renewalLog = {
      userId,
      timestamp: new Date().toISOString(),
      plan,
      previousBalance: currentCredits,
      monthlyAllocation,
      rolledOver,
      newBalance,
      capped,
      rolloverCap
    };
    
    const logKey = `credit_renewal_log:${userId}:${new Date().toISOString()}`;
    await kv.set(logKey, renewalLog);

    // Also log as a credit transaction for audit
    const creditLogKey = `credit_log:${userId}:${new Date().toISOString()}`;
    await kv.set(creditLogKey, JSON.stringify({
      userId,
      amount: -(monthlyAllocation), // Negative to indicate addition
      action: `MONTHLY RENEWAL: ${plan} plan (${monthlyAllocation} credits + ${rolledOver} rolled over${capped ? ', capped at ' + rolloverCap : ''})`,
      remainingBalance: newBalance,
      timestamp: new Date().toISOString()
    }));

    console.log(`✅ Credit Renewal: User ${userId} renewed`, {
      plan,
      previousBalance: currentCredits,
      monthlyAllocation,
      rolledOver,
      newBalance,
      capped
    });

    // Send notifications
    try {
      if (rolledOver > 0) {
        await sendCreditsRolloverNotification(userId, plan, rolledOver, newBalance, capped, rolloverCap);
      } else {
        await sendCreditsRenewedNotification(userId, plan, monthlyAllocation, newBalance);
      }
    } catch (notifError) {
      console.error('❌ Credit Renewal: Error sending notification:', notifError);
      // Don't fail the renewal if notification fails
    }

    return {
      success: true,
      previousBalance: currentCredits,
      newBalance,
      monthlyAllocation,
      rolledOver,
      capped
    };
  } catch (error: any) {
    console.error(`❌ Credit Renewal: Error renewing credits for user ${userId}:`, error);
    return {
      success: false,
      previousBalance: 0,
      newBalance: 0,
      monthlyAllocation: 0,
      rolledOver: 0,
      capped: false
    };
  }
}

/**
 * Process all users for credit renewal
 */
export async function processAllRenewals() {
  try {
    console.log('🔄 Credit Renewal: Starting renewal check...');
    
    const now = new Date();
    let renewed = 0;
    let skipped = 0;
    let initialized = 0;

    // Get all users who have credits (indicates they've used the system)
    // Use timeout-safe query with fallback
    let allCreditKeys: any[] = [];
    try {
      allCreditKeys = await kv.getByPrefix('credits:');
      console.log(`📊 Credit Renewal: Found ${allCreditKeys.length} credit keys`);
    } catch (error: any) {
      console.error('❌ Credit Renewal: Failed to query credits, will retry later:', error.message);
      // Return early if we can't query credits - don't fail the entire process
      return {
        success: false,
        error: 'Database timeout',
        renewed: 0,
        skipped: 0,
        initialized: 0
      };
    }
    
    // Extract unique user IDs
    const userIds = new Set<string>();
    for (const item of allCreditKeys) {
      try {
        const key = item.key || item;
        if (typeof key === 'string' && key.startsWith('credits:') && !key.includes(':plan') && !key.includes(':renewal_date')) {
          const parts = key.split(':');
          if (parts.length >= 2) {
            userIds.add(parts[1]);
          }
        }
      } catch (err) {
        // Skip malformed entries
        console.warn('⚠️ Credit Renewal: Skipped malformed credit key:', item);
      }
    }

    console.log(`📊 Credit Renewal: Found ${userIds.size} users to check`);

    for (const userId of userIds) {
      try {
        // Get or initialize renewal date
        let renewalDate = await getRenewalDate(userId);
        
        if (!renewalDate) {
          // First-time setup: initialize renewal date
          renewalDate = await initializeRenewalDate(userId);
          initialized++;
          console.log(`🆕 Credit Renewal: Initialized renewal date for user ${userId}: ${renewalDate.toISOString()}`);
          skipped++;
          continue; // Skip renewal on first initialization
        }

        // Check if renewal is due
        if (now >= renewalDate) {
          console.log(`💳 Credit Renewal: Processing renewal for user ${userId}`);
          
          // Renew credits
          const result = await renewUserCredits(userId);
          
          if (result.success) {
            // Set next renewal date (30 days from now)
            await setNextRenewalDate(userId);
            renewed++;
            
            console.log(`✅ Credit Renewal: Successfully renewed ${userId}:`, {
              previousBalance: result.previousBalance,
              added: result.monthlyAllocation,
              rolledOver: result.rolledOver,
              newBalance: result.newBalance,
              capped: result.capped
            });
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ Credit Renewal: Error processing user ${userId}:`, error);
      }
    }

    console.log(`✅ Credit Renewal: Check complete - Renewed: ${renewed}, Skipped: ${skipped}, Initialized: ${initialized}`);
    
    return {
      renewed,
      skipped,
      initialized,
      totalChecked: userIds.size
    };
  } catch (error) {
    console.error('❌ Credit Renewal: Error in renewal processor:', error);
    throw error;
  }
}

/**
 * Start the credit renewal scheduler (runs every hour)
 */
export function startCreditRenewalScheduler() {
  console.log('🕐 Credit Renewal Scheduler: Starting (runs every hour)');

  // Run immediately on startup
  processAllRenewals();

  // Then run every hour
  setInterval(() => {
    processAllRenewals();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
}

/**
 * Manual renewal endpoint (for testing or admin use)
 */
export async function manualRenewal(userId: string) {
  console.log(`🔧 Credit Renewal: Manual renewal requested for user ${userId}`);
  
  const result = await renewUserCredits(userId);
  
  if (result.success) {
    await setNextRenewalDate(userId);
  }
  
  return result;
}