import { Hono } from 'npm:hono@4';
import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const salesRouter = new Hono();

// Initialize Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

// ==========================================
// SALES PIPELINE MANAGEMENT
// ==========================================

// Get all deals/pipeline
salesRouter.get('/pipeline', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const supabase = getSupabaseClient();
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('❌ Sales Pipeline - Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('📊 Loading sales pipeline for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_pipeline`;
    const pipeline = await kv.get(key);

    console.log('✅ Sales pipeline loaded:', pipeline ? `${pipeline.length} deals` : 'empty');
    
    return c.json({
      success: true,
      pipeline: pipeline || [],
      count: pipeline?.length || 0
    });
  } catch (error) {
    console.error('❌ Error loading sales pipeline:', error);
    return c.json({ error: 'Failed to load pipeline', details: error.message }, 500);
  }
});

// Create new deal
salesRouter.post('/pipeline/create', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('❌ Create Deal - Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, deal } = body;

    if (!businessId || !deal) {
      return c.json({ error: 'Business ID and deal data are required' }, 400);
    }

    console.log('💼 Creating deal for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_pipeline`;
    const existingPipeline = await kv.get(key) || [];

    const newDeal = {
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stage: 'prospecting', // Default stage
      value: 0, // Default value
      probability: 0, // Default probability
      ...deal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id
    };

    const updatedPipeline = [...existingPipeline, newDeal];
    await kv.set(key, updatedPipeline);

    console.log('✅ Deal created successfully:', newDeal.id);

    return c.json({
      success: true,
      deal: newDeal,
      message: 'Deal created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating deal:', error);
    return c.json({ error: 'Failed to create deal', details: error.message }, 500);
  }
});

// Update deal
salesRouter.put('/pipeline/update', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, dealId, updates } = body;

    if (!businessId || !dealId || !updates) {
      return c.json({ error: 'Business ID, deal ID, and updates are required' }, 400);
    }

    const key = `business:${user.id}:${businessId}:sales_pipeline`;
    const pipeline = await kv.get(key) || [];

    const updatedPipeline = pipeline.map((deal: any) =>
      deal.id === dealId
        ? { ...deal, ...updates, updatedAt: new Date().toISOString() }
        : deal
    );

    await kv.set(key, updatedPipeline);

    console.log('✅ Deal updated:', dealId);

    return c.json({
      success: true,
      message: 'Deal updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating deal:', error);
    return c.json({ error: 'Failed to update deal', details: error.message }, 500);
  }
});

// Delete deal
salesRouter.delete('/pipeline/delete', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const businessId = c.req.query('businessId');
    const dealId = c.req.query('dealId');

    if (!businessId || !dealId) {
      return c.json({ error: 'Business ID and deal ID are required' }, 400);
    }

    const key = `business:${user.id}:${businessId}:sales_pipeline`;
    const pipeline = await kv.get(key) || [];

    const updatedPipeline = pipeline.filter((deal: any) => deal.id !== dealId);
    await kv.set(key, updatedPipeline);

    console.log('✅ Deal deleted:', dealId);

    return c.json({
      success: true,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting deal:', error);
    return c.json({ error: 'Failed to delete deal', details: error.message }, 500);
  }
});

// ==========================================
// HOT LEADS MANAGEMENT
// ==========================================

// Get all hot leads
salesRouter.get('/hot-leads', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const supabase = getSupabaseClient();
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('🔥 Loading hot leads for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_hot_leads`;
    const hotLeads = await kv.get(key);

    console.log('✅ Hot leads loaded:', hotLeads ? `${hotLeads.length} hot leads` : 'empty');
    
    return c.json({
      success: true,
      hotLeads: hotLeads || [],
      count: hotLeads?.length || 0
    });
  } catch (error) {
    console.error('❌ Error loading hot leads:', error);
    return c.json({ error: 'Failed to load hot leads', details: error.message }, 500);
  }
});

// Create new hot lead
salesRouter.post('/hot-leads/create', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, hotLead } = body;

    if (!businessId || !hotLead) {
      return c.json({ error: 'Business ID and hot lead data are required' }, 400);
    }

    console.log('🔥 Creating hot lead for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_hot_leads`;
    const existingHotLeads = await kv.get(key) || [];

    const newHotLead = {
      id: `hotlead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...hotLead,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
      score: hotLead.score || 80, // Default high score for hot leads
      importedFrom: hotLead.importedFrom || 'manual'
    };

    const updatedHotLeads = [...existingHotLeads, newHotLead];
    await kv.set(key, updatedHotLeads);

    console.log('✅ Hot lead created successfully:', newHotLead.id);

    return c.json({
      success: true,
      hotLead: newHotLead,
      message: 'Hot lead created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating hot lead:', error);
    return c.json({ error: 'Failed to create hot lead', details: error.message }, 500);
  }
});

// Update hot lead
salesRouter.put('/hot-leads/update', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, hotLeadId, updates } = body;

    if (!businessId || !hotLeadId || !updates) {
      return c.json({ error: 'Business ID, hot lead ID, and updates are required' }, 400);
    }

    const key = `business:${user.id}:${businessId}:sales_hot_leads`;
    const hotLeads = await kv.get(key) || [];

    const updatedHotLeads = hotLeads.map((lead: any) =>
      lead.id === hotLeadId
        ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
        : lead
    );

    await kv.set(key, updatedHotLeads);

    console.log('✅ Hot lead updated:', hotLeadId);

    return c.json({
      success: true,
      message: 'Hot lead updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating hot lead:', error);
    return c.json({ error: 'Failed to update hot lead', details: error.message }, 500);
  }
});

// Delete hot lead
salesRouter.delete('/hot-leads/delete', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const businessId = c.req.query('businessId');
    const hotLeadId = c.req.query('hotLeadId');

    if (!businessId || !hotLeadId) {
      return c.json({ error: 'Business ID and hot lead ID are required' }, 400);
    }

    const key = `business:${user.id}:${businessId}:sales_hot_leads`;
    const hotLeads = await kv.get(key) || [];

    const updatedHotLeads = hotLeads.filter((lead: any) => lead.id !== hotLeadId);
    await kv.set(key, updatedHotLeads);

    console.log('✅ Hot lead deleted:', hotLeadId);

    return c.json({
      success: true,
      message: 'Hot lead deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting hot lead:', error);
    return c.json({ error: 'Failed to delete hot lead', details: error.message }, 500);
  }
});

// Import leads from marketing to hot leads
salesRouter.post('/import-leads', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, leadIds } = body;

    if (!businessId || !leadIds || !Array.isArray(leadIds)) {
      return c.json({ error: 'Business ID and lead IDs array are required' }, 400);
    }

    console.log('📥 Importing', leadIds.length, 'leads from marketing to hot leads');

    // Get marketing leads
    const marketingLeadsKey = `business:${user.id}:${businessId}:marketing_leads`;
    const marketingLeads = await kv.get(marketingLeadsKey) || [];

    // Filter the leads to import
    const leadsToImport = marketingLeads.filter((lead: any) => leadIds.includes(lead.id));

    if (leadsToImport.length === 0) {
      return c.json({ error: 'No matching leads found' }, 404);
    }

    // Get existing hot leads
    const hotLeadsKey = `business:${user.id}:${businessId}:sales_hot_leads`;
    const existingHotLeads = await kv.get(hotLeadsKey) || [];

    // Convert marketing leads to hot leads format
    const newHotLeads = leadsToImport.map((lead: any) => ({
      id: `hotlead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone || '',
      value: lead.estimatedValue || null,
      source: lead.source || 'Marketing',
      score: lead.score || 80,
      notes: lead.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
      importedFrom: 'marketing' as const,
      originalLeadId: lead.id
    }));

    const updatedHotLeads = [...existingHotLeads, ...newHotLeads];
    await kv.set(hotLeadsKey, updatedHotLeads);

    console.log('✅ Successfully imported', newHotLeads.length, 'leads to hot leads');

    return c.json({
      success: true,
      imported: newHotLeads.length,
      hotLeads: newHotLeads,
      message: `Successfully imported ${newHotLeads.length} lead(s)`
    });
  } catch (error) {
    console.error('❌ Error importing leads:', error);
    return c.json({ error: 'Failed to import leads', details: error.message }, 500);
  }
});

// Convert hot lead to deal
salesRouter.post('/convert-to-deal', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, leadId } = body;

    if (!businessId || !leadId) {
      return c.json({ error: 'Business ID and lead ID are required' }, 400);
    }

    console.log('🤝 Converting hot lead to deal:', leadId);

    // Get the hot lead
    const hotLeadsKey = `business:${user.id}:${businessId}:sales_hot_leads`;
    const hotLeads = await kv.get(hotLeadsKey) || [];
    const hotLead = hotLeads.find((l: any) => l.id === leadId);

    if (!hotLead) {
      return c.json({ error: 'Hot lead not found' }, 404);
    }

    // Create a deal from the hot lead
    const dealsKey = `business:${user.id}:${businessId}:sales_deals`;
    const existingDeals = await kv.get(dealsKey) || [];

    const newDeal = {
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: hotLead.name,
      company: hotLead.company,
      email: hotLead.email,
      phone: hotLead.phone || '',
      value: hotLead.value || 0,
      status: 'pending',
      notes: hotLead.notes || '',
      source: hotLead.source || '',
      createdAt: new Date().toISOString(),
      importedFrom: 'hot-leads'
    };

    const updatedDeals = [...existingDeals, newDeal];
    await kv.set(dealsKey, updatedDeals);

    // Remove from hot leads
    const updatedHotLeads = hotLeads.filter((l: any) => l.id !== leadId);
    await kv.set(hotLeadsKey, updatedHotLeads);

    console.log('✅ Hot lead converted to deal:', newDeal.id);
    console.log('📊 Deal created:', { id: newDeal.id, name: newDeal.name, company: newDeal.company });
    console.log('📊 Total deals after conversion:', updatedDeals.length);
    console.log('📊 Remaining hot leads:', updatedHotLeads.length);

    return c.json({
      success: true,
      deal: newDeal,
      message: 'Hot lead converted to deal successfully'
    });
  } catch (error) {
    console.error('❌ Error converting hot lead to deal:', error);
    return c.json({ error: 'Failed to convert to deal', details: error.message }, 500);
  }
});

// ==========================================
// SALES ANALYTICS & METRICS
// ==========================================

// Get sales analytics
salesRouter.get('/analytics', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const supabase = getSupabaseClient();
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('📈 Loading sales analytics for user:', user.id, 'business:', businessId);

    // Fetch all sales data
    const pipelineKey = `business:${user.id}:${businessId}:sales_pipeline`;
    const leadsKey = `business:${user.id}:${businessId}:sales_leads`;
    const sequencesKey = `business:${user.id}:${businessId}:sales_sequences`;

    const pipeline = await kv.get(pipelineKey) || [];
    const leads = await kv.get(leadsKey) || [];
    const sequences = await kv.get(sequencesKey) || [];

    // Calculate metrics
    const totalDeals = pipeline.length;
    const activeDeals = pipeline.filter((d: any) => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length;
    const wonDeals = pipeline.filter((d: any) => d.stage === 'closed-won').length;
    const lostDeals = pipeline.filter((d: any) => d.stage === 'closed-lost').length;
    
    const totalValue = pipeline.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    const wonValue = pipeline
      .filter((d: any) => d.stage === 'closed-won')
      .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    
    const winRate = totalDeals > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
    
    const highValueLeads = leads.filter((l: any) => l.score >= 70).length;
    const mediumValueLeads = leads.filter((l: any) => l.score >= 40 && l.score < 70).length;
    const lowValueLeads = leads.filter((l: any) => l.score < 40).length;

    const activeSequences = sequences.filter((s: any) => s.status === 'active').length;

    const analytics = {
      pipeline: {
        total: totalDeals,
        active: activeDeals,
        won: wonDeals,
        lost: lostDeals,
        totalValue,
        wonValue,
        winRate: Math.round(winRate)
      },
      leads: {
        total: leads.length,
        high: highValueLeads,
        medium: mediumValueLeads,
        low: lowValueLeads
      },
      sequences: {
        total: sequences.length,
        active: activeSequences,
        paused: sequences.filter((s: any) => s.status === 'paused').length,
        draft: sequences.filter((s: any) => s.status === 'draft').length
      }
    };

    console.log('✅ Sales analytics calculated');

    return c.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('❌ Error loading analytics:', error);
    return c.json({ error: 'Failed to load analytics', details: error.message }, 500);
  }
});

// ==========================================
// DEALS MANAGEMENT
// ==========================================

// Get all deals
salesRouter.get('/deals', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const supabase = getSupabaseClient();
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('❌ Deals - Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('🤝 Loading deals for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_deals`;
    const deals = await kv.get(key);

    console.log('✅ Deals loaded:', deals ? `${deals.length} deals` : 'empty');
    
    return c.json({
      success: true,
      deals: deals || []
    });
  } catch (error) {
    console.error('❌ Error loading deals:', error);
    return c.json({ error: 'Failed to load deals', details: error.message }, 500);
  }
});

// Create a new deal
salesRouter.post('/create-deal', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, deal } = body;

    if (!businessId || !deal) {
      return c.json({ error: 'Business ID and deal data are required' }, 400);
    }

    console.log('🤝 Creating deal for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_deals`;
    const existingDeals = await kv.get(key) || [];

    const newDeal = {
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...deal,
      createdAt: new Date().toISOString(),
      importedFrom: 'manual'
    };

    const updatedDeals = [...existingDeals, newDeal];
    await kv.set(key, updatedDeals);

    console.log('✅ Deal created:', newDeal.id);

    return c.json({
      success: true,
      deal: newDeal
    });
  } catch (error) {
    console.error('❌ Error creating deal:', error);
    return c.json({ error: 'Failed to create deal', details: error.message }, 500);
  }
});

// Update deal
salesRouter.put('/deals/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dealId = c.req.param('id');
    const body = await c.req.json();
    const { businessId, updates } = body;

    if (!businessId || !dealId) {
      return c.json({ error: 'Business ID and deal ID are required' }, 400);
    }

    console.log('📝 Updating deal:', dealId);

    // Get existing deals
    const dealsKey = `business:${user.id}:${businessId}:sales_deals`;
    const deals = await kv.get(dealsKey) || [];

    // Find and update the deal
    const dealIndex = deals.findIndex((d: any) => d.id === dealId);
    if (dealIndex === -1) {
      return c.json({ error: 'Deal not found' }, 404);
    }

    const updatedDeal = {
      ...deals[dealIndex],
      ...updates,
      id: dealId, // Preserve original ID
      createdAt: deals[dealIndex].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    deals[dealIndex] = updatedDeal;
    await kv.set(dealsKey, deals);

    console.log('✅ Deal updated successfully:', updatedDeal.id);
    return c.json({ success: true, deal: updatedDeal });
  } catch (error) {
    console.error('❌ Error updating deal:', error);
    return c.json({ error: 'Failed to update deal', details: error.message }, 500);
  }
});

// Delete deal
salesRouter.delete('/deals/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dealId = c.req.param('id');
    const businessId = c.req.query('businessId');

    if (!businessId || !dealId) {
      return c.json({ error: 'Business ID and deal ID are required' }, 400);
    }

    console.log('🗑️ Deleting deal:', dealId);

    // Get existing deals
    const dealsKey = `business:${user.id}:${businessId}:sales_deals`;
    const deals = await kv.get(dealsKey) || [];

    // Filter out the deal to delete
    const dealToDelete = deals.find((d: any) => d.id === dealId);
    if (!dealToDelete) {
      return c.json({ error: 'Deal not found' }, 404);
    }

    const updatedDeals = deals.filter((d: any) => d.id !== dealId);
    await kv.set(dealsKey, updatedDeals);

    console.log('✅ Deal deleted successfully:', dealId);
    console.log('📊 Remaining deals:', updatedDeals.length);
    return c.json({ success: true, deleted: dealId });
  } catch (error) {
    console.error('❌ Error deleting deal:', error);
    return c.json({ error: 'Failed to delete deal', details: error.message }, 500);
  }
});

// Import hot leads to deals
salesRouter.post('/import-to-deals', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, leadIds } = body;

    if (!businessId || !leadIds || !Array.isArray(leadIds)) {
      return c.json({ error: 'Business ID and lead IDs array are required' }, 400);
    }

    console.log('🤝 Importing hot leads to deals:', leadIds.length);

    // Get hot leads
    const hotLeadsKey = `business:${user.id}:${businessId}:sales_hot_leads`;
    const hotLeads = await kv.get(hotLeadsKey) || [];

    // Filter selected leads
    const leadsToImport = hotLeads.filter((lead: any) => leadIds.includes(lead.id));

    if (leadsToImport.length === 0) {
      return c.json({ error: 'No matching hot leads found' }, 404);
    }

    // Get existing deals
    const dealsKey = `business:${user.id}:${businessId}:sales_deals`;
    const existingDeals = await kv.get(dealsKey) || [];

    // Convert hot leads to deals
    const newDeals = leadsToImport.map((lead: any, index: number) => ({
      id: `deal_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      value: lead.value || 0,
      status: 'pending',
      notes: lead.notes,
      createdAt: new Date().toISOString(),
      importedFrom: 'hot-leads'
    }));

    // Add to deals
    const updatedDeals = [...existingDeals, ...newDeals];
    await kv.set(dealsKey, updatedDeals);

    // Remove from hot leads
    const updatedHotLeads = hotLeads.filter((lead: any) => !leadIds.includes(lead.id));
    await kv.set(hotLeadsKey, updatedHotLeads);

    console.log('✅ Successfully imported', newDeals.length, 'hot leads to deals');
    console.log('📊 New deals created:', newDeals.map((d: any) => ({ id: d.id, name: d.name })));
    console.log('📊 Total deals after import:', updatedDeals.length);
    console.log('📊 Remaining hot leads:', updatedHotLeads.length);

    return c.json({
      success: true,
      imported: newDeals.length,
      deals: newDeals
    });
  } catch (error) {
    console.error('❌ Error importing hot leads to deals:', error);
    return c.json({ error: 'Failed to import hot leads', details: error.message }, 500);
  }
});

// Convert deal to account
salesRouter.post('/convert-to-account', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, dealId } = body;

    if (!businessId || !dealId) {
      return c.json({ error: 'Business ID and deal ID are required' }, 400);
    }

    console.log('👤 Converting deal to account:', dealId);

    // Get the deal
    const dealsKey = `business:${user.id}:${businessId}:sales_deals`;
    const deals = await kv.get(dealsKey) || [];
    const deal = deals.find((d: any) => d.id === dealId);

    if (!deal) {
      return c.json({ error: 'Deal not found' }, 404);
    }

    // Create an account from the deal
    const accountsKey = `business:${user.id}:${businessId}:sales_accounts`;
    const existingAccounts = await kv.get(accountsKey) || [];

    const newAccount = {
      id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: deal.name,
      company: deal.company,
      email: deal.email,
      phone: deal.phone,
      accountValue: deal.value,
      status: 'current customer',
      notes: deal.notes,
      createdAt: new Date().toISOString(),
      importedFrom: 'deals',
      originalDealId: deal.id
    };

    const updatedAccounts = [...existingAccounts, newAccount];
    await kv.set(accountsKey, updatedAccounts);

    console.log('✅ Deal converted to account:', newAccount.id);

    return c.json({
      success: true,
      account: newAccount,
      message: 'Deal converted to account successfully'
    });
  } catch (error) {
    console.error('❌ Error converting deal to account:', error);
    return c.json({ error: 'Failed to convert to account', details: error.message }, 500);
  }
});

// ==========================================
// ACCOUNTS MANAGEMENT
// ==========================================

// Get all accounts
salesRouter.get('/accounts', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const supabase = getSupabaseClient();
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('❌ Accounts - Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('👤 Loading accounts for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_accounts`;
    const accounts = await kv.get(key);

    console.log('✅ Accounts loaded:', accounts ? `${accounts.length} accounts` : 'empty');
    
    return c.json({
      success: true,
      accounts: accounts || []
    });
  } catch (error) {
    console.error('❌ Error loading accounts:', error);
    return c.json({ error: 'Failed to load accounts', details: error.message }, 500);
  }
});

// Create a new account
salesRouter.post('/create-account', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, account } = body;

    if (!businessId || !account) {
      return c.json({ error: 'Business ID and account data are required' }, 400);
    }

    console.log('👤 Creating account for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_accounts`;
    const existingAccounts = await kv.get(key) || [];

    const newAccount = {
      id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...account,
      createdAt: new Date().toISOString(),
      importedFrom: 'manual'
    };

    const updatedAccounts = [...existingAccounts, newAccount];
    await kv.set(key, updatedAccounts);

    console.log('✅ Account created:', newAccount.id);

    return c.json({
      success: true,
      account: newAccount
    });
  } catch (error) {
    console.error('❌ Error creating account:', error);
    return c.json({ error: 'Failed to create account', details: error.message }, 500);
  }
});

// Import deals to accounts
salesRouter.post('/import-to-accounts', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, dealIds } = body;

    if (!businessId || !dealIds || !Array.isArray(dealIds)) {
      return c.json({ error: 'Business ID and deal IDs array are required' }, 400);
    }

    console.log('👤 Importing deals to accounts:', dealIds.length);

    // Get deals
    const dealsKey = `business:${user.id}:${businessId}:sales_deals`;
    const deals = await kv.get(dealsKey) || [];

    // Filter selected deals
    const dealsToImport = deals.filter((deal: any) => dealIds.includes(deal.id));

    if (dealsToImport.length === 0) {
      return c.json({ error: 'No matching deals found' }, 404);
    }

    // Get existing accounts
    const accountsKey = `business:${user.id}:${businessId}:sales_accounts`;
    const existingAccounts = await kv.get(accountsKey) || [];

    // Convert deals to accounts
    const newAccounts = dealsToImport.map((deal: any) => ({
      id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: deal.name,
      company: deal.company,
      email: deal.email,
      phone: deal.phone,
      website: '',
      industry: '',
      accountValue: deal.value || 0,
      status: 'current customer',
      notes: deal.notes,
      createdAt: new Date().toISOString(),
      importedFrom: 'deals',
      originalDealId: deal.id
    }));

    // Add to accounts
    const updatedAccounts = [...existingAccounts, ...newAccounts];
    await kv.set(accountsKey, updatedAccounts);

    // Remove from deals
    const updatedDeals = deals.filter((deal: any) => !dealIds.includes(deal.id));
    await kv.set(dealsKey, updatedDeals);

    console.log('✅ Successfully imported', newAccounts.length, 'deals to accounts');

    return c.json({
      success: true,
      imported: newAccounts.length,
      accounts: newAccounts
    });
  } catch (error) {
    console.error('❌ Error importing deals to accounts:', error);
    return c.json({ error: 'Failed to import deals', details: error.message }, 500);
  }
});

// ==========================================
// LOSSES MANAGEMENT
// ==========================================

// Get all losses
salesRouter.get('/losses', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const supabase = getSupabaseClient();
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('❌ Losses - Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('💔 Loading losses for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_losses`;
    const losses = await kv.get(key);

    console.log('✅ Losses loaded:', losses ? `${losses.length} losses` : 'empty');
    
    return c.json({
      success: true,
      losses: losses || [],
      count: losses?.length || 0
    });
  } catch (error) {
    console.error('❌ Error loading losses:', error);
    return c.json({ error: 'Failed to load losses', details: error.message }, 500);
  }
});

// Create new loss manually
salesRouter.post('/losses/create', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('❌ Create Loss - Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, loss } = body;

    if (!businessId || !loss) {
      return c.json({ error: 'Business ID and loss data are required' }, 400);
    }

    console.log('💔 Creating loss for user:', user.id, 'business:', businessId);

    const key = `business:${user.id}:${businessId}:sales_losses`;
    const existingLosses = await kv.get(key) || [];

    const newLoss = {
      id: `loss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...loss,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id
    };

    const updatedLosses = [...existingLosses, newLoss];
    await kv.set(key, updatedLosses);

    console.log('✅ Loss created successfully:', newLoss.id);

    return c.json({
      success: true,
      loss: newLoss,
      message: 'Loss created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating loss:', error);
    return c.json({ error: 'Failed to create loss', details: error.message }, 500);
  }
});

// Update a loss
salesRouter.put('/losses/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const lossId = c.req.param('id');
    const body = await c.req.json();
    const { businessId, updates } = body;

    if (!businessId || !updates) {
      return c.json({ error: 'Business ID and updates are required' }, 400);
    }

    console.log('📝 Updating loss:', lossId, 'for user:', user.id);

    const key = `business:${user.id}:${businessId}:sales_losses`;
    const losses = await kv.get(key) || [];

    const lossIndex = losses.findIndex((l: any) => l.id === lossId);
    if (lossIndex === -1) {
      return c.json({ error: 'Loss not found' }, 404);
    }

    losses[lossIndex] = {
      ...losses[lossIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(key, losses);

    console.log('✅ Loss updated successfully');

    return c.json({
      success: true,
      loss: losses[lossIndex],
      message: 'Loss updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating loss:', error);
    return c.json({ error: 'Failed to update loss', details: error.message }, 500);
  }
});

// Delete a loss
salesRouter.delete('/losses/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const lossId = c.req.param('id');
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log('🗑️ Deleting loss:', lossId, 'for user:', user.id);

    const key = `business:${user.id}:${businessId}:sales_losses`;
    const losses = await kv.get(key) || [];

    const filteredLosses = losses.filter((l: any) => l.id !== lossId);

    if (filteredLosses.length === losses.length) {
      return c.json({ error: 'Loss not found' }, 404);
    }

    await kv.set(key, filteredLosses);

    console.log('✅ Loss deleted successfully');

    return c.json({
      success: true,
      message: 'Loss deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting loss:', error);
    return c.json({ error: 'Failed to delete loss', details: error.message }, 500);
  }
});

// Import losses from other stages (marketing leads, hot leads, deals, accounts)
salesRouter.post('/losses/import', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.error('❌ Import Losses - Authentication failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { businessId, sourceStage, itemIds, lostReason, lostDate, notes, winBackStrategy, competitorName, followUpDate } = body;

    if (!businessId || !sourceStage || !itemIds || !Array.isArray(itemIds) || !lostReason) {
      return c.json({ error: 'Business ID, source stage, item IDs, and lost reason are required' }, 400);
    }

    console.log('📥 Importing', itemIds.length, `items from ${sourceStage} to losses`);

    // Determine source key based on stage
    let sourceKey = '';
    if (sourceStage === 'marketing lead') {
      sourceKey = `business:${user.id}:${businessId}:marketing_leads`;
    } else if (sourceStage === 'hot lead') {
      sourceKey = `business:${user.id}:${businessId}:sales_hot_leads`;
    } else if (sourceStage === 'deal') {
      sourceKey = `business:${user.id}:${businessId}:sales_deals`;
    } else if (sourceStage === 'account') {
      sourceKey = `business:${user.id}:${businessId}:sales_accounts`;
    } else {
      return c.json({ error: 'Invalid source stage' }, 400);
    }

    // Get source items
    const sourceItems = await kv.get(sourceKey) || [];

    // Filter the items to import
    const itemsToImport = sourceItems.filter((item: any) => itemIds.includes(item.id));

    if (itemsToImport.length === 0) {
      return c.json({ error: 'No matching items found' }, 404);
    }

    // Get existing losses
    const lossesKey = `business:${user.id}:${businessId}:sales_losses`;
    const existingLosses = await kv.get(lossesKey) || [];

    // Convert items to losses
    const newLosses = itemsToImport.map((item: any) => ({
      id: `loss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || item.contactName || 'Unknown',
      company: item.company || item.companyName || '',
      email: item.email || '',
      phone: item.phone || item.phoneNumber || '',
      value: item.value || item.dealValue || 0,
      stage: sourceStage,
      lostReason,
      lostDate: lostDate || new Date().toISOString().split('T')[0],
      notes: notes || '',
      winBackStrategy: winBackStrategy || '',
      competitorName: competitorName || '',
      followUpDate: followUpDate || '',
      importedFrom: sourceStage,
      originalId: item.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id
    }));

    // Add to losses
    const updatedLosses = [...existingLosses, ...newLosses];
    await kv.set(lossesKey, updatedLosses);

    // Optionally remove from source (commented out - keep in both places for now)
    // const updatedSource = sourceItems.filter((item: any) => !itemIds.includes(item.id));
    // await kv.set(sourceKey, updatedSource);

    console.log('✅ Successfully imported', newLosses.length, 'losses');

    return c.json({
      success: true,
      imported: newLosses.length,
      losses: newLosses,
      message: `Successfully imported ${newLosses.length} loss${newLosses.length !== 1 ? 'es' : ''}`
    });
  } catch (error) {
    console.error('❌ Error importing losses:', error);
    return c.json({ error: 'Failed to import losses', details: error.message }, 500);
  }
});

export default salesRouter;