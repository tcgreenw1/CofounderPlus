/**
 * Credit Renewal Management Endpoints
 * Manual renewal triggers and status checks
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';
import { manualRenewal, processAllRenewals } from './credit-renewal-scheduler.tsx';

const app = new Hono();

// GET /credits/renewal/status - Check renewal status for current user
app.get('/make-server-373d8b09/credits/renewal/status', async (c) => {
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

    // Get renewal date
    const renewalDateStr = await kv.get(`credits:${user.id}:renewal_date`);
    const renewalDate = renewalDateStr ? new Date(renewalDateStr) : null;

    // Get current credits
    const currentCredits = await kv.get(`credits:${user.id}`);
    const credits = currentCredits 
      ? (typeof currentCredits === 'number' ? currentCredits : parseInt(currentCredits))
      : 0;

    // Get plan
    const plan = await kv.get(`credits:${user.id}:plan`) || 'free';

    // Calculate days until renewal
    let daysUntilRenewal = null;
    if (renewalDate) {
      const now = new Date();
      const diffTime = renewalDate.getTime() - now.getTime();
      daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get last renewal log
    const renewalLogs = await kv.getByPrefix(`credit_renewal_log:${user.id}:`);
    const lastRenewal = renewalLogs.length > 0 
      ? renewalLogs.sort((a, b) => {
          const aTime = new Date(a.timestamp || 0).getTime();
          const bTime = new Date(b.timestamp || 0).getTime();
          return bTime - aTime;
        })[0]
      : null;

    return c.json({
      success: true,
      userId: user.id,
      currentCredits: credits,
      plan,
      renewalDate: renewalDate ? renewalDate.toISOString() : null,
      daysUntilRenewal,
      isOverdue: renewalDate ? new Date() >= renewalDate : false,
      lastRenewal: lastRenewal || null
    });
  } catch (error: any) {
    console.error('❌ Error fetching renewal status:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// POST /credits/renewal/trigger - Manually trigger renewal for current user
app.post('/make-server-373d8b09/credits/renewal/trigger', async (c) => {
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

    console.log(`🔧 Manual renewal triggered for user ${user.id}`);

    const result = await manualRenewal(user.id);

    return c.json({
      success: result.success,
      ...result
    });
  } catch (error: any) {
    console.error('❌ Error triggering manual renewal:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// POST /credits/renewal/process-all - Admin only: Process all renewals
app.post('/make-server-373d8b09/credits/renewal/process-all', async (c) => {
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

    // Check if user is admin
    const adminEmails = [
      'josh@withcofounder.com',
      'test@withcofounder.com',
      'demo@withcofounder.com'
    ];

    if (!adminEmails.includes(user.email || '')) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log(`🔧 Admin ${user.email} triggered renewal for all users`);

    const result = await processAllRenewals();

    return c.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('❌ Error processing all renewals:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;
