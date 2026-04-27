/**
 * Credit Diagnostic Endpoint
 * Helps investigate credit usage issues and discrepancies
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';

const app = new Hono();

// GET /credits/diagnostic - Get comprehensive credit diagnostic info
app.get('/make-server-373d8b09/credits/diagnostic', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🔍 Running credit diagnostic for user ${user.id}...`);

    // Get current credits
    const currentCredits = await kv.get(`credits:${user.id}`);
    const currentPlan = await kv.get(`credits:${user.id}:plan`);

    // Get subscription data
    const subscriptionIds = await kv.get(`user:${user.id}:subscriptions`) || [];
    const subscriptions = [];
    for (const subId of subscriptionIds) {
      try {
        const subData = await kv.get(`subscription:${subId}`);
        if (subData) {
          const sub = typeof subData === 'string' ? JSON.parse(subData) : subData;
          subscriptions.push({
            id: subId,
            plan: sub.plan,
            status: sub.status,
            type: sub.type
          });
        }
      } catch (error) {
        console.error(`Error reading subscription ${subId}:`, error);
      }
    }

    // Get ALL credit logs for this user (last 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffTimestamp = cutoffDate.toISOString();

    const creditLogs = await kv.getByPrefix(`credit_log:${user.id}:`);
    const parsedLogs = creditLogs
      .map(log => {
        try {
          return typeof log === 'string' ? JSON.parse(log) : log;
        } catch {
          return null;
        }
      })
      .filter(log => log && log.timestamp >= cutoffTimestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate total credits deducted in last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    const last24HoursTimestamp = last24Hours.toISOString();

    const last24HoursLogs = parsedLogs.filter(log => log.timestamp >= last24HoursTimestamp);
    const last24HoursTotal = last24HoursLogs.reduce((sum, log) => sum + (log.amount || 0), 0);

    // Find the largest single deduction
    const largestDeduction = parsedLogs.reduce((max, log) => {
      return (log.amount || 0) > (max?.amount || 0) ? log : max;
    }, null);

    // Group by action type
    const actionBreakdown: Record<string, { count: number; total: number }> = {};
    parsedLogs.forEach(log => {
      const action = log.action || 'Unknown';
      if (!actionBreakdown[action]) {
        actionBreakdown[action] = { count: 0, total: 0 };
      }
      actionBreakdown[action].count++;
      actionBreakdown[action].total += log.amount || 0;
    });

    // Get credit usage records (from tracking endpoint)
    const usageRecords = await kv.getByPrefix(`credit_usage:${user.id}:`);
    const parsedUsage = usageRecords
      .map(record => {
        try {
          return typeof record === 'string' ? JSON.parse(record) : record;
        } catch {
          return null;
        }
      })
      .filter(record => record && record.timestamp >= cutoffTimestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const diagnostic = {
      userId: user.id,
      timestamp: new Date().toISOString(),
      currentState: {
        credits: currentCredits,
        plan: currentPlan,
        subscriptions
      },
      last24Hours: {
        totalDeducted: last24HoursTotal,
        transactionCount: last24HoursLogs.length,
        logs: last24HoursLogs.slice(0, 50) // Last 50 transactions
      },
      last7Days: {
        totalLogs: parsedLogs.length,
        largestDeduction,
        actionBreakdown,
        allLogs: parsedLogs.slice(0, 100) // Last 100 transactions
      },
      usageTracking: {
        totalRecords: parsedUsage.length,
        recentRecords: parsedUsage.slice(0, 20)
      },
      potentialIssues: []
    };

    // Identify potential issues
    if (last24HoursTotal > 15000) {
      diagnostic.potentialIssues.push({
        type: 'HIGH_USAGE_24H',
        message: `Unusually high credit usage in last 24 hours: ${last24HoursTotal} credits`,
        severity: 'high'
      });
    }

    if (largestDeduction && largestDeduction.amount > 5000) {
      diagnostic.potentialIssues.push({
        type: 'LARGE_SINGLE_DEDUCTION',
        message: `Large single deduction detected: ${largestDeduction.amount} credits for "${largestDeduction.action}"`,
        severity: 'high',
        details: largestDeduction
      });
    }

    if (currentCredits !== null && currentCredits < 500 && currentPlan === 'builder') {
      diagnostic.potentialIssues.push({
        type: 'LOW_CREDITS_PREMIUM_PLAN',
        message: 'Builder plan user has very low credits',
        severity: 'medium'
      });
    }

    console.log(`✅ Diagnostic complete for user ${user.id}:`, {
      currentCredits,
      last24HoursTotal,
      totalLogs: parsedLogs.length
    });

    return c.json({ success: true, diagnostic });
  } catch (error: any) {
    console.error('❌ Error running credit diagnostic:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// POST /credits/restore - Manually restore credits (emergency use)
app.post('/make-server-373d8b09/credits/restore', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { amount, reason = 'Manual restoration' } = body;

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    // Get current credits
    const currentCredits = await kv.get(`credits:${user.id}`);
    const credits = currentCredits ? (typeof currentCredits === 'number' ? currentCredits : parseInt(currentCredits)) : 0;

    // Add credits
    const newBalance = credits + amount;
    await kv.set(`credits:${user.id}`, newBalance);

    // Log the restoration
    const timestamp = new Date().toISOString();
    const logKey = `credit_log:${user.id}:${timestamp}`;
    const logData = {
      userId: user.id,
      amount: -amount, // Negative to indicate restoration
      action: `RESTORATION: ${reason}`,
      remainingBalance: newBalance,
      timestamp
    };
    await kv.set(logKey, JSON.stringify(logData));

    console.log(`💳 Restored ${amount} credits to user ${user.id}. New balance: ${newBalance}. Reason: ${reason}`);

    return c.json({
      success: true,
      previousBalance: credits,
      restoredAmount: amount,
      newBalance,
      reason
    });
  } catch (error: any) {
    console.error('❌ Error restoring credits:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;
