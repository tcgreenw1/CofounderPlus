/**
 * Data Diagnostic Endpoint
 * 
 * Endpoint to verify that all GPT-5.1 CRUD functions are working correctly.
 * Returns actual data records created via function calls for verification.
 */

import { Hono } from 'npm:hono@4';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Verify user access
async function verifyUserAccess(accessToken: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

// Database diagnostic endpoint - returns actual data created by function calls
app.get('/database-diagnostic', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'businessId query parameter required' }, 400);
    }

    console.log(`🔍 Diagnostic: Checking data for business ${businessId} and user ${user.id}`);

    // Fetch actual data from each category
    const diagnosticResults = {
      businessId,
      userId: user.id,
      timestamp: new Date().toISOString(),
      
      // Finance data
      transactions: {
        count: 0,
        items: [] as any[]
      },
      budgets: {
        count: 0,
        items: [] as any[]
      },
      
      // Sales data
      leads: {
        count: 0,
        items: [] as any[]
      },
      deals: {
        count: 0,
        items: [] as any[]
      },
      customers: {
        count: 0,
        items: [] as any[]
      },
      emailSequences: {
        count: 0,
        items: [] as any[]
      },
      
      // Marketing data
      campaigns: {
        count: 0,
        items: [] as any[]
      },
      marketingLeads: {
        count: 0,
        items: [] as any[]
      },
      
      // HR data
      teamMembers: {
        count: 0,
        items: [] as any[]
      },
      contractors: {
        count: 0,
        items: [] as any[]
      },
      benefits: {
        count: 0,
        items: [] as any[]
      },
      performances: {
        count: 0,
        items: [] as any[]
      },
      handbooks: {
        count: 0,
        items: [] as any[]
      },
      onboarding: {
        count: 0,
        items: [] as any[]
      },
      
      // Product data
      roadmapTasks: {
        count: 0,
        items: [] as any[]
      }
    };

    // Fetch transactions (using new array pattern)
    try {
      const transactionsArray = await kv.get(`business:${user.id}:${businessId}:transactions`);
      if (Array.isArray(transactionsArray)) {
        diagnosticResults.transactions.items = transactionsArray;
        diagnosticResults.transactions.count = transactionsArray.length;
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    }

    // Fetch budgets
    try {
      const budgetsRaw = await kv.getByPrefix(`budget:${user.id}:${businessId}:`) || [];
      diagnosticResults.budgets.items = budgetsRaw.map((b: any) => 
        typeof b === 'string' ? JSON.parse(b) : b
      );
      diagnosticResults.budgets.count = diagnosticResults.budgets.items.length;
    } catch (e) {
      console.error('Error fetching budgets:', e);
    }

    // Fetch sales leads
    try {
      const leadsRaw = await kv.getByPrefix(`sales_lead:${user.id}:${businessId}:`) || [];
      diagnosticResults.leads.items = leadsRaw.map((l: any) => 
        typeof l === 'string' ? JSON.parse(l) : l
      );
      diagnosticResults.leads.count = diagnosticResults.leads.items.length;
    } catch (e) {
      console.error('Error fetching leads:', e);
    }

    // Fetch deals
    try {
      const dealsRaw = await kv.getByPrefix(`sales_deal:${user.id}:${businessId}:`) || [];
      diagnosticResults.deals.items = dealsRaw.map((d: any) => 
        typeof d === 'string' ? JSON.parse(d) : d
      );
      diagnosticResults.deals.count = diagnosticResults.deals.items.length;
    } catch (e) {
      console.error('Error fetching deals:', e);
    }

    // Fetch customers
    try {
      const customersRaw = await kv.getByPrefix(`sales_customer:${user.id}:${businessId}:`) || [];
      diagnosticResults.customers.items = customersRaw.map((c: any) => 
        typeof c === 'string' ? JSON.parse(c) : c
      );
      diagnosticResults.customers.count = diagnosticResults.customers.items.length;
    } catch (e) {
      console.error('Error fetching customers:', e);
    }

    // Fetch email sequences
    try {
      const sequencesRaw = await kv.getByPrefix(`sales_email_sequence:${user.id}:${businessId}:`) || [];
      diagnosticResults.emailSequences.items = sequencesRaw.map((s: any) => 
        typeof s === 'string' ? JSON.parse(s) : s
      );
      diagnosticResults.emailSequences.count = diagnosticResults.emailSequences.items.length;
    } catch (e) {
      console.error('Error fetching email sequences:', e);
    }

    // Fetch campaigns
    try {
      const campaignsRaw = await kv.getByPrefix(`marketing_campaign:${user.id}:${businessId}:`) || [];
      diagnosticResults.campaigns.items = campaignsRaw.map((c: any) => 
        typeof c === 'string' ? JSON.parse(c) : c
      );
      diagnosticResults.campaigns.count = diagnosticResults.campaigns.items.length;
    } catch (e) {
      console.error('Error fetching campaigns:', e);
    }

    // Fetch marketing leads
    try {
      const mLeadsRaw = await kv.getByPrefix(`marketing_lead:${user.id}:${businessId}:`) || [];
      diagnosticResults.marketingLeads.items = mLeadsRaw.map((l: any) => 
        typeof l === 'string' ? JSON.parse(l) : l
      );
      diagnosticResults.marketingLeads.count = diagnosticResults.marketingLeads.items.length;
    } catch (e) {
      console.error('Error fetching marketing leads:', e);
    }

    // Fetch team members
    try {
      const teamRaw = await kv.getByPrefix(`team_member:${user.id}:${businessId}:`) || [];
      diagnosticResults.teamMembers.items = teamRaw.map((t: any) => 
        typeof t === 'string' ? JSON.parse(t) : t
      );
      diagnosticResults.teamMembers.count = diagnosticResults.teamMembers.items.length;
    } catch (e) {
      console.error('Error fetching team members:', e);
    }

    // Fetch contractors
    try {
      const contractorsRaw = await kv.getByPrefix(`contractor:${user.id}:${businessId}:`) || [];
      diagnosticResults.contractors.items = contractorsRaw.map((c: any) => 
        typeof c === 'string' ? JSON.parse(c) : c
      );
      diagnosticResults.contractors.count = diagnosticResults.contractors.items.length;
    } catch (e) {
      console.error('Error fetching contractors:', e);
    }

    // Fetch benefits
    try {
      const benefitsRaw = await kv.getByPrefix(`employee_benefit:${user.id}:${businessId}:`) || [];
      diagnosticResults.benefits.items = benefitsRaw.map((b: any) => 
        typeof b === 'string' ? JSON.parse(b) : b
      );
      diagnosticResults.benefits.count = diagnosticResults.benefits.items.length;
    } catch (e) {
      console.error('Error fetching benefits:', e);
    }

    // Fetch performances
    try {
      const performancesRaw = await kv.getByPrefix(`employee_performance:${user.id}:${businessId}:`) || [];
      diagnosticResults.performances.items = performancesRaw.map((p: any) => 
        typeof p === 'string' ? JSON.parse(p) : p
      );
      diagnosticResults.performances.count = diagnosticResults.performances.items.length;
    } catch (e) {
      console.error('Error fetching performances:', e);
    }

    // Fetch handbooks
    try {
      const handbooksRaw = await kv.getByPrefix(`handbook:${user.id}:${businessId}:`) || [];
      diagnosticResults.handbooks.items = handbooksRaw.map((h: any) => 
        typeof h === 'string' ? JSON.parse(h) : h
      );
      diagnosticResults.handbooks.count = diagnosticResults.handbooks.items.length;
    } catch (e) {
      console.error('Error fetching handbooks:', e);
    }

    // Fetch onboarding materials
    try {
      const onboardingRaw = await kv.getByPrefix(`employee_onboarding:${user.id}:${businessId}:`) || [];
      diagnosticResults.onboarding.items = onboardingRaw.map((o: any) => 
        typeof o === 'string' ? JSON.parse(o) : o
      );
      diagnosticResults.onboarding.count = diagnosticResults.onboarding.items.length;
    } catch (e) {
      console.error('Error fetching onboarding:', e);
    }

    // Fetch roadmap tasks
    try {
      const tasksRaw = await kv.getByPrefix(`roadmap_task:${user.id}:${businessId}:`) || [];
      diagnosticResults.roadmapTasks.items = tasksRaw.map((t: any) => 
        typeof t === 'string' ? JSON.parse(t) : t
      );
      diagnosticResults.roadmapTasks.count = diagnosticResults.roadmapTasks.items.length;
    } catch (e) {
      console.error('Error fetching roadmap tasks:', e);
    }

    console.log('✅ Diagnostic complete');
    console.log(`📊 Summary: ${diagnosticResults.transactions.count} txns, ${diagnosticResults.leads.count} leads, ${diagnosticResults.teamMembers.count} team`);

    return c.json({
      success: true,
      data: diagnosticResults
    });

  } catch (error: any) {
    console.error('❌ Diagnostic Error:', error);
    return c.json({ 
      error: error.message || 'Diagnostic failed',
      details: error.toString()
    }, 500);
  }
});

export default app;
