import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addHubSpotEndpoints(app: any) {
  console.log('🔧 Adding HubSpot endpoints...');

  const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY');

  // Helper function to make HubSpot API calls
  // Supports both Private App tokens (Bearer) and Developer API keys (hapikey query param)
  async function hubspotRequest(endpoint: string, options: any = {}) {
    let url = `https://api.hubapi.com${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Check if the key is a Developer API key (hapikey) or Private App token (pat-)
    const isDeveloperKey = HUBSPOT_API_KEY && !HUBSPOT_API_KEY.startsWith('pat-');
    
    if (isDeveloperKey) {
      // Developer API key - add as query parameter
      const separator = endpoint.includes('?') ? '&' : '?';
      url = `${url}${separator}hapikey=${HUBSPOT_API_KEY}`;
    } else {
      // Private App token - use Bearer authorization
      headers['Authorization'] = `Bearer ${HUBSPOT_API_KEY}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HubSpot API error (${endpoint}):`, errorText);
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Test HubSpot connection
  app.get('/make-server-373d8b09/hubspot/test', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required', connected: false }, 401);
      }

      if (!HUBSPOT_API_KEY) {
        console.error('❌ HubSpot API key not found in environment variables');
        return c.json({ 
          error: 'HubSpot API key not configured in environment variables. Please add HUBSPOT_API_KEY.',
          connected: false 
        }, 500);
      }

      console.log('🧪 Testing HubSpot connection...');
      console.log('📋 API Key present:', HUBSPOT_API_KEY ? 'Yes' : 'No');
      console.log('📋 API Key length:', HUBSPOT_API_KEY?.length || 0);
      console.log('📋 API Key prefix:', HUBSPOT_API_KEY?.substring(0, 10) + '...');
      
      const isDeveloperKey = HUBSPOT_API_KEY && !HUBSPOT_API_KEY.startsWith('pat-');
      console.log('📋 Key type:', isDeveloperKey ? 'Developer API Key (hapikey)' : 'Private App Token');

      // Test with a simple account info request
      const accountInfo = await hubspotRequest('/account-info/v3/details');

      console.log('✅ HubSpot connection successful!');
      console.log('📊 Portal ID:', accountInfo.portalId);

      return c.json({
        success: true,
        connected: true,
        portalId: accountInfo.portalId,
        timeZone: accountInfo.timeZone,
        currency: accountInfo.currency
      });

    } catch (error: any) {
      console.error('❌ HubSpot test error:', error);
      console.error('❌ Error details:', error.message);
      
      let errorMessage = error.message;
      
      // Provide helpful error messages based on the error
      if (errorMessage.includes('401')) {
        errorMessage = 'Invalid HubSpot API key. Please check your API key is correct and has the required scopes.';
      } else if (errorMessage.includes('403')) {
        errorMessage = 'Access forbidden. Your HubSpot API key may not have the required permissions.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'HubSpot endpoint not found. Please verify the API endpoint is correct.';
      }
      
      return c.json({ 
        error: `HubSpot connection failed: ${errorMessage}`,
        connected: false,
        details: error.message
      }, 500);
    }
  });

  // Get all contacts
  app.get('/make-server-373d8b09/hubspot/contacts', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`📇 Fetching HubSpot contacts for business ${businessId}...`);

      // Fetch contacts from HubSpot
      const contactsData = await hubspotRequest('/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,createdate,lastmodifieddate');

      const contacts = contactsData.results.map((contact: any) => ({
        id: contact.id,
        firstName: contact.properties.firstname || '',
        lastName: contact.properties.lastname || '',
        email: contact.properties.email || '',
        phone: contact.properties.phone || '',
        company: contact.properties.company || '',
        jobTitle: contact.properties.jobtitle || '',
        lifecycleStage: contact.properties.lifecyclestage || '',
        createdAt: contact.properties.createdate,
        updatedAt: contact.properties.lastmodifieddate,
        hubspotUrl: `https://app.hubspot.com/contacts/${contactsData.results[0]?.properties.hs_object_id || contact.id}`
      }));

      // Store in KV for caching
      await kv.set(`hubspot_contacts:${businessId}`, {
        contacts,
        lastSync: new Date().toISOString()
      });

      console.log(`✅ Fetched ${contacts.length} contacts from HubSpot`);

      return c.json({
        success: true,
        contacts,
        total: contactsData.total || contacts.length
      });

    } catch (error: any) {
      console.error('Get contacts error:', error);
      return c.json({ error: `Error fetching contacts: ${error.message}` }, 500);
    }
  });

  // Get all companies
  app.get('/make-server-373d8b09/hubspot/companies', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`🏢 Fetching HubSpot companies for business ${businessId}...`);

      // Fetch companies from HubSpot
      const companiesData = await hubspotRequest('/crm/v3/objects/companies?limit=100&properties=name,domain,industry,phone,city,state,country,numberofemployees,annualrevenue,createdate,lastmodifieddate');

      const companies = companiesData.results.map((company: any) => ({
        id: company.id,
        name: company.properties.name || '',
        domain: company.properties.domain || '',
        industry: company.properties.industry || '',
        phone: company.properties.phone || '',
        city: company.properties.city || '',
        state: company.properties.state || '',
        country: company.properties.country || '',
        numberOfEmployees: company.properties.numberofemployees || '',
        annualRevenue: company.properties.annualrevenue || '',
        createdAt: company.properties.createdate,
        updatedAt: company.properties.lastmodifieddate,
        hubspotUrl: `https://app.hubspot.com/contacts/${companiesData.results[0]?.properties.hs_object_id || company.id}/company/${company.id}`
      }));

      // Store in KV for caching
      await kv.set(`hubspot_companies:${businessId}`, {
        companies,
        lastSync: new Date().toISOString()
      });

      console.log(`✅ Fetched ${companies.length} companies from HubSpot`);

      return c.json({
        success: true,
        companies,
        total: companiesData.total || companies.length
      });

    } catch (error: any) {
      console.error('Get companies error:', error);
      return c.json({ error: `Error fetching companies: ${error.message}` }, 500);
    }
  });

  // Get deals
  app.get('/make-server-373d8b09/hubspot/deals', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`💼 Fetching HubSpot deals for business ${businessId}...`);

      // Fetch deals from HubSpot
      const dealsData = await hubspotRequest('/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate');

      const deals = dealsData.results.map((deal: any) => ({
        id: deal.id,
        name: deal.properties.dealname || '',
        amount: deal.properties.amount || '0',
        stage: deal.properties.dealstage || '',
        pipeline: deal.properties.pipeline || '',
        closeDate: deal.properties.closedate || '',
        createdAt: deal.properties.createdate,
        updatedAt: deal.properties.hs_lastmodifieddate,
        hubspotUrl: `https://app.hubspot.com/contacts/${dealsData.results[0]?.properties.hs_object_id || deal.id}/deal/${deal.id}`
      }));

      // Store in KV for caching
      await kv.set(`hubspot_deals:${businessId}`, {
        deals,
        lastSync: new Date().toISOString()
      });

      console.log(`✅ Fetched ${deals.length} deals from HubSpot`);

      return c.json({
        success: true,
        deals,
        total: dealsData.total || deals.length
      });

    } catch (error: any) {
      console.error('Get deals error:', error);
      return c.json({ error: `Error fetching deals: ${error.message}` }, 500);
    }
  });

  // Sync all HubSpot data at once
  app.post('/make-server-373d8b09/hubspot/sync', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`🔄 Starting full HubSpot sync for business ${businessId}...`);

      // Fetch all data in parallel
      const [contactsData, companiesData, dealsData] = await Promise.all([
        hubspotRequest('/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,createdate,lastmodifieddate'),
        hubspotRequest('/crm/v3/objects/companies?limit=100&properties=name,domain,industry,phone,city,state,country,numberofemployees,annualrevenue,createdate,lastmodifieddate'),
        hubspotRequest('/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate')
      ]);

      // Process contacts
      const contacts = contactsData.results.map((contact: any) => ({
        id: contact.id,
        firstName: contact.properties.firstname || '',
        lastName: contact.properties.lastname || '',
        email: contact.properties.email || '',
        phone: contact.properties.phone || '',
        company: contact.properties.company || '',
        jobTitle: contact.properties.jobtitle || '',
        lifecycleStage: contact.properties.lifecyclestage || '',
        createdAt: contact.properties.createdate,
        updatedAt: contact.properties.lastmodifieddate
      }));

      // Process companies
      const companies = companiesData.results.map((company: any) => ({
        id: company.id,
        name: company.properties.name || '',
        domain: company.properties.domain || '',
        industry: company.properties.industry || '',
        phone: company.properties.phone || '',
        city: company.properties.city || '',
        state: company.properties.state || '',
        country: company.properties.country || '',
        numberOfEmployees: company.properties.numberofemployees || '',
        annualRevenue: company.properties.annualrevenue || '',
        createdAt: company.properties.createdate,
        updatedAt: company.properties.lastmodifieddate
      }));

      // Process deals
      const deals = dealsData.results.map((deal: any) => ({
        id: deal.id,
        name: deal.properties.dealname || '',
        amount: deal.properties.amount || '0',
        stage: deal.properties.dealstage || '',
        pipeline: deal.properties.pipeline || '',
        closeDate: deal.properties.closedate || '',
        createdAt: deal.properties.createdate,
        updatedAt: deal.properties.hs_lastmodifieddate
      }));

      // Store all data
      const syncTime = new Date().toISOString();
      await Promise.all([
        kv.set(`hubspot_contacts:${businessId}`, { contacts, lastSync: syncTime }),
        kv.set(`hubspot_companies:${businessId}`, { companies, lastSync: syncTime }),
        kv.set(`hubspot_deals:${businessId}`, { deals, lastSync: syncTime })
      ]);

      console.log(`✅ Full sync complete: ${contacts.length} contacts, ${companies.length} companies, ${deals.length} deals`);

      return c.json({
        success: true,
        synced: {
          contacts: contacts.length,
          companies: companies.length,
          deals: deals.length
        },
        lastSync: syncTime
      });

    } catch (error: any) {
      console.error('Sync error:', error);
      return c.json({ error: `Error syncing HubSpot data: ${error.message}` }, 500);
    }
  });

  // Get cached data (for offline/fast loading)
  app.get('/make-server-373d8b09/hubspot/cached', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      console.log(`📦 Fetching cached HubSpot data for business ${businessId}...`);

      const [contactsCache, companiesCache, dealsCache] = await Promise.all([
        kv.get(`hubspot_contacts:${businessId}`),
        kv.get(`hubspot_companies:${businessId}`),
        kv.get(`hubspot_deals:${businessId}`)
      ]);

      return c.json({
        success: true,
        contacts: contactsCache?.contacts || [],
        companies: companiesCache?.companies || [],
        deals: dealsCache?.deals || [],
        lastSync: contactsCache?.lastSync || null
      });

    } catch (error: any) {
      console.error('Get cached data error:', error);
      return c.json({ error: `Error fetching cached data: ${error.message}` }, 500);
    }
  });

  console.log('✅ HubSpot endpoints added successfully');
}
