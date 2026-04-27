import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addHubSpotOAuthEndpoints(app: any) {
  console.log('🔧 Adding HubSpot OAuth endpoints...');

  const HUBSPOT_CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID');
  const HUBSPOT_CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET');
  const HUBSPOT_REDIRECT_URI = 'https://www.cofounderplus.com/operations/sales/hubspot-callback'; // Hardcoded to match registered callback

  // Log the configuration on startup for debugging
  console.log('🔍 HubSpot OAuth Configuration:');
  console.log('   Client ID:', HUBSPOT_CLIENT_ID ? `${HUBSPOT_CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
  console.log('   Client Secret:', HUBSPOT_CLIENT_SECRET ? `${HUBSPOT_CLIENT_SECRET.substring(0, 8)}...` : 'NOT SET');
  console.log('   Redirect URI:', HUBSPOT_REDIRECT_URI);

  // Test endpoint to verify OAuth configuration
  app.get('/make-server-373d8b09/hubspot/config-test', async (c: any) => {
    try {
      return c.json({
        success: true,
        configured: {
          hasClientId: !!HUBSPOT_CLIENT_ID,
          hasClientSecret: !!HUBSPOT_CLIENT_SECRET,
          redirectUri: HUBSPOT_REDIRECT_URI,
          clientIdPrefix: HUBSPOT_CLIENT_ID ? HUBSPOT_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET',
        },
        message: (!HUBSPOT_CLIENT_ID || !HUBSPOT_CLIENT_SECRET) 
          ? '⚠️ Missing OAuth credentials. Please set HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET in Supabase environment variables.'
          : '✅ OAuth credentials configured correctly!'
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Helper to get user's access token
  async function getUserAccessToken(userId: string) {
    const tokenData = await kv.get(`hubspot_oauth:${userId}`);
    return tokenData;
  }

  // Helper to refresh access token if expired
  async function refreshAccessToken(userId: string, refreshToken: string) {
    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: HUBSPOT_CLIENT_ID!,
          client_secret: HUBSPOT_CLIENT_SECRET!,
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();

      // Store new tokens
      await kv.set(`hubspot_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000),
        hub_id: data.hub_id
      });

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Helper to make authenticated HubSpot API calls with user's token
  async function hubspotRequest(userId: string, endpoint: string, options: any = {}) {
    const tokenData = await getUserAccessToken(userId);

    if (!tokenData) {
      throw new Error('User not connected to HubSpot. Please authorize first.');
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    if (Date.now() >= tokenData.expires_at) {
      console.log('🔄 Access token expired, refreshing...');
      accessToken = await refreshAccessToken(userId, tokenData.refresh_token);
    }

    const url = `https://api.hubapi.com${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HubSpot API error (${endpoint}):`, errorText);
      
      // If 401, token might be invalid - try refreshing
      if (response.status === 401 && tokenData.refresh_token) {
        console.log('🔄 Got 401, attempting token refresh...');
        accessToken = await refreshAccessToken(userId, tokenData.refresh_token);
        
        // Retry request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`HubSpot API error: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }

      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Get OAuth authorization URL
  app.get('/make-server-373d8b09/hubspot/auth-url', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      if (!HUBSPOT_CLIENT_ID) {
        return c.json({ 
          error: 'HubSpot OAuth not configured. Please add HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET environment variables.' 
        }, 500);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Build OAuth authorization URL - with proper CRM scopes
      // Matching the scopes from HubSpot app configuration
      const scopes = [
        'oauth',
        'crm.objects.contacts.read',
        'crm.objects.contacts.write',
        'crm.objects.companies.read',
        'crm.objects.deals.read',
        'crm.objects.deals.write',
        'crm.lists.read',
        'crm.lists.write',
        'crm.schemas.contacts.read',
        'crm.schemas.companies.read',
        'crm.schemas.deals.read'
      ];

      // Optional scopes that may be granted
      const optionalScopes = [
        'crm.objects.companies.write',
        'crm.schemas.contacts.write',
        'crm.schemas.companies.write',
        'crm.schemas.deals.write'
      ];

      // Use the correct regional HubSpot OAuth endpoint (app-na2 for North America)
      const authUrl = new URL('https://app-na2.hubspot.com/oauth/authorize');
      authUrl.searchParams.set('client_id', HUBSPOT_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', HUBSPOT_REDIRECT_URI);
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('state', userId); // Pass userId as state for callback

      console.log('🔗 Generated HubSpot OAuth URL:');
      console.log('   Client ID:', HUBSPOT_CLIENT_ID ? `${HUBSPOT_CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
      console.log('   Redirect URI being sent:', HUBSPOT_REDIRECT_URI);
      console.log('   Scopes:', scopes.join(' '));
      console.log('   Full Auth URL:', authUrl.toString());

      return c.json({
        success: true,
        authUrl: authUrl.toString(),
        redirectUri: HUBSPOT_REDIRECT_URI // Add this for debugging
      });

    } catch (error: any) {
      console.error('Get auth URL error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // OAuth callback handler
  app.get('/make-server-373d8b09/hubspot/callback', async (c: any) => {
    try {
      const code = c.req.query('code');
      const state = c.req.query('state'); // This is the userId
      const error = c.req.query('error');

      if (error) {
        console.error('OAuth error:', error);
        return c.json({ error: `HubSpot authorization failed: ${error}` }, 400);
      }

      if (!code || !state) {
        return c.json({ error: 'Invalid callback parameters' }, 400);
      }

      const userId = state;

      console.log(`🔑 Exchanging code for access token for user ${userId}...`);

      // Exchange authorization code for access token
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: HUBSPOT_CLIENT_ID!,
          client_secret: HUBSPOT_CLIENT_SECRET!,
          redirect_uri: HUBSPOT_REDIRECT_URI,
          code: code
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', errorText);
        return c.json({ error: 'Failed to exchange authorization code' }, 500);
      }

      const data = await response.json();

      // Store tokens for this user
      await kv.set(`hubspot_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000),
        hub_id: data.hub_id,
        connected_at: new Date().toISOString()
      });

      console.log(`✅ HubSpot connected successfully for user ${userId}, Hub ID: ${data.hub_id}`);

      return c.json({
        success: true,
        message: 'HubSpot account connected successfully!',
        hubId: data.hub_id
      });

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Check connection status
  app.get('/make-server-373d8b09/hubspot/status', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const tokenData = await getUserAccessToken(userId);

      if (!tokenData) {
        return c.json({
          connected: false,
          message: 'Not connected to HubSpot'
        });
      }

      // Verify token is still valid by making a test request
      try {
        const accountInfo = await hubspotRequest(userId, '/account-info/v3/details');
        
        return c.json({
          connected: true,
          hubId: tokenData.hub_id,
          portalId: accountInfo.portalId,
          connectedAt: tokenData.connected_at
        });
      } catch (error) {
        // Token invalid or expired
        return c.json({
          connected: false,
          message: 'HubSpot connection expired. Please reconnect.'
        });
      }

    } catch (error: any) {
      console.error('Status check error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Disconnect HubSpot
  app.post('/make-server-373d8b09/hubspot/disconnect', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const body = await c.req.json();
      const userId = body.userId;

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Delete stored tokens
      await kv.del(`hubspot_oauth:${userId}`);

      console.log(`🔌 HubSpot disconnected for user ${userId}`);

      return c.json({
        success: true,
        message: 'HubSpot disconnected successfully'
      });

    } catch (error: any) {
      console.error('Disconnect error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get contacts
  app.get('/make-server-373d8b09/hubspot/contacts', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const businessId = c.req.query('businessId');

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`📇 Fetching HubSpot contacts for user ${userId}...`);

      const contactsData = await hubspotRequest(
        userId,
        '/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,createdate,lastmodifieddate'
      );

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
        hubspotUrl: `https://app.hubspot.com/contacts/contacts/${contact.id}`
      }));

      // Cache per user (and optionally per business)
      const cacheKey = businessId ? `hubspot_contacts:${userId}:${businessId}` : `hubspot_contacts:${userId}`;
      await kv.set(cacheKey, {
        contacts,
        lastSync: new Date().toISOString()
      });

      console.log(`✅ Fetched ${contacts.length} contacts`);

      return c.json({
        success: true,
        contacts,
        total: contactsData.total || contacts.length
      });

    } catch (error: any) {
      console.error('Get contacts error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get companies
  app.get('/make-server-373d8b09/hubspot/companies', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const businessId = c.req.query('businessId');

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`🏢 Fetching HubSpot companies for user ${userId}...`);

      const companiesData = await hubspotRequest(
        userId,
        '/crm/v3/objects/companies?limit=100&properties=name,domain,industry,phone,city,state,country,numberofemployees,annualrevenue,createdate,lastmodifieddate'
      );

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
        hubspotUrl: `https://app.hubspot.com/contacts/companies/${company.id}`
      }));

      const cacheKey = businessId ? `hubspot_companies:${userId}:${businessId}` : `hubspot_companies:${userId}`;
      await kv.set(cacheKey, {
        companies,
        lastSync: new Date().toISOString()
      });

      console.log(`✅ Fetched ${companies.length} companies`);

      return c.json({
        success: true,
        companies,
        total: companiesData.total || companies.length
      });

    } catch (error: any) {
      console.error('Get companies error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get deals
  app.get('/make-server-373d8b09/hubspot/deals', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const businessId = c.req.query('businessId');

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`💼 Fetching HubSpot deals for user ${userId}...`);

      const dealsData = await hubspotRequest(
        userId,
        '/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate'
      );

      const deals = dealsData.results.map((deal: any) => ({
        id: deal.id,
        name: deal.properties.dealname || '',
        amount: deal.properties.amount || '0',
        stage: deal.properties.dealstage || '',
        pipeline: deal.properties.pipeline || '',
        closeDate: deal.properties.closedate || '',
        createdAt: deal.properties.createdate,
        updatedAt: deal.properties.hs_lastmodifieddate,
        hubspotUrl: `https://app.hubspot.com/contacts/deals/${deal.id}`
      }));

      const cacheKey = businessId ? `hubspot_deals:${userId}:${businessId}` : `hubspot_deals:${userId}`;
      await kv.set(cacheKey, {
        deals,
        lastSync: new Date().toISOString()
      });

      console.log(`✅ Fetched ${deals.length} deals`);

      return c.json({
        success: true,
        deals,
        total: dealsData.total || deals.length
      });

    } catch (error: any) {
      console.error('Get deals error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Sync all data
  app.post('/make-server-373d8b09/hubspot/sync', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const body = await c.req.json();
      const userId = body.userId;
      const businessId = body.businessId;

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`🔄 Starting full HubSpot sync for user ${userId}...`);

      // Fetch all data in parallel
      const [contactsData, companiesData, dealsData] = await Promise.all([
        hubspotRequest(userId, '/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,company,jobtitle,lifecyclestage,createdate,lastmodifieddate'),
        hubspotRequest(userId, '/crm/v3/objects/companies?limit=100&properties=name,domain,industry,phone,city,state,country,numberofemployees,annualrevenue,createdate,lastmodifieddate'),
        hubspotRequest(userId, '/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate')
      ]);

      // Process all data
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

      // Store all data in HubSpot cache
      const syncTime = new Date().toISOString();
      const keyPrefix = businessId ? `${userId}:${businessId}` : userId;

      await Promise.all([
        kv.set(`hubspot_contacts:${keyPrefix}`, { contacts, lastSync: syncTime }),
        kv.set(`hubspot_companies:${keyPrefix}`, { companies, lastSync: syncTime }),
        kv.set(`hubspot_deals:${keyPrefix}`, { deals, lastSync: syncTime })
      ]);

      console.log(`✅ HubSpot cache updated: ${contacts.length} contacts, ${companies.length} companies, ${deals.length} deals`);

      // AUTO-POPULATE SALES TABLES
      if (businessId) {
        console.log(`📊 Auto-populating sales tables for business ${businessId}...`);

        // Map HubSpot Contacts → Sales Leads
        const leadsPromises = contacts.map(async (contact: any) => {
          const leadId = `hubspot-lead-${contact.id}`;
          const lead = {
            id: leadId,
            name: `${contact.firstName} ${contact.lastName}`.trim() || contact.email,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            title: contact.jobTitle,
            status: contact.lifecycleStage || 'new',
            source: 'HubSpot',
            hubspotId: contact.id,
            created_at: contact.createdAt || syncTime,
            updated_at: contact.updatedAt || syncTime
          };
          await kv.set(`lead:${userId}:${businessId}:${leadId}`, lead);
        });

        // Map HubSpot Companies → Sales Customers
        const customersPromises = companies.map(async (company: any) => {
          const customerId = `hubspot-customer-${company.id}`;
          const customer = {
            id: customerId,
            name: company.name,
            email: '', // Companies don't have direct email in HubSpot
            phone: company.phone,
            company: company.name,
            industry: company.industry,
            location: [company.city, company.state, company.country].filter(Boolean).join(', '),
            website: company.domain,
            employees: company.numberOfEmployees,
            revenue: company.annualRevenue,
            source: 'HubSpot',
            hubspotId: company.id,
            created_at: company.createdAt || syncTime,
            updated_at: company.updatedAt || syncTime
          };
          await kv.set(`customer:${userId}:${businessId}:${customerId}`, customer);
        });

        // Map HubSpot Deals → Sales Deals
        const dealsPromises = deals.map(async (deal: any) => {
          const dealId = `hubspot-deal-${deal.id}`;
          const salesDeal = {
            id: dealId,
            name: deal.name,
            value: parseFloat(deal.amount) || 0,
            stage: deal.stage,
            pipeline: deal.pipeline,
            close_date: deal.closeDate,
            status: deal.stage === 'closedwon' ? 'won' : deal.stage === 'closedlost' ? 'lost' : 'open',
            source: 'HubSpot',
            hubspotId: deal.id,
            created_at: deal.createdAt || syncTime,
            updated_at: deal.updatedAt || syncTime
          };
          await kv.set(`deal:${userId}:${businessId}:${dealId}`, salesDeal);
        });

        // Execute all promises in parallel
        await Promise.all([
          ...leadsPromises,
          ...customersPromises,
          ...dealsPromises
        ]);

        console.log(`✅ Sales tables populated: ${contacts.length} leads, ${companies.length} customers, ${deals.length} deals`);
      }

      console.log(`✅ Full sync complete: ${contacts.length} contacts, ${companies.length} companies, ${deals.length} deals`);

      return c.json({
        success: true,
        synced: {
          contacts: contacts.length,
          companies: companies.length,
          deals: deals.length
        },
        salesTablesPopulated: !!businessId,
        lastSync: syncTime
      });

    } catch (error: any) {
      console.error('Sync error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get cached data
  app.get('/make-server-373d8b09/hubspot/cached', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const businessId = c.req.query('businessId');

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const keyPrefix = businessId ? `${userId}:${businessId}` : userId;

      const [contactsCache, companiesCache, dealsCache] = await Promise.all([
        kv.get(`hubspot_contacts:${keyPrefix}`),
        kv.get(`hubspot_companies:${keyPrefix}`),
        kv.get(`hubspot_deals:${keyPrefix}`)
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
      return c.json({ error: error.message }, 500);
    }
  });

  console.log('✅ HubSpot OAuth endpoints added successfully');
}