import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addSalesforceOAuthEndpoints(app: any) {
  console.log('🔧 Adding Salesforce OAuth endpoints...');

  const SALESFORCE_CLIENT_ID = Deno.env.get('SALESFORCE_CLIENT_ID');
  const SALESFORCE_CLIENT_SECRET = Deno.env.get('SALESFORCE_CLIENT_SECRET');
  const SALESFORCE_REDIRECT_URI = 'https://www.cofounderplus.com/operations/sales/salesforce-callback';

  // Log the configuration on startup for debugging
  console.log('🔍 Salesforce OAuth Configuration:');
  console.log('   Client ID:', SALESFORCE_CLIENT_ID ? `${SALESFORCE_CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
  console.log('   Client Secret:', SALESFORCE_CLIENT_SECRET ? `${SALESFORCE_CLIENT_SECRET.substring(0, 8)}...` : 'NOT SET');
  console.log('   Redirect URI:', SALESFORCE_REDIRECT_URI);

  // Test endpoint to verify OAuth configuration
  app.get('/make-server-373d8b09/salesforce/config-test', async (c: any) => {
    try {
      return c.json({
        success: true,
        configured: {
          hasClientId: !!SALESFORCE_CLIENT_ID,
          hasClientSecret: !!SALESFORCE_CLIENT_SECRET,
          redirectUri: SALESFORCE_REDIRECT_URI,
          clientIdPrefix: SALESFORCE_CLIENT_ID ? SALESFORCE_CLIENT_ID.substring(0, 8) + '...' : 'NOT SET',
        },
        message: (!SALESFORCE_CLIENT_ID || !SALESFORCE_CLIENT_SECRET) 
          ? '⚠️ Missing OAuth credentials. Please set SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET in Supabase environment variables.'
          : '✅ OAuth credentials configured correctly!'
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Helper to get user's access token
  async function getUserAccessToken(userId: string) {
    const tokenData = await kv.get(`salesforce_oauth:${userId}`);
    return tokenData;
  }

  // Helper to refresh access token if expired
  async function refreshAccessToken(userId: string, refreshToken: string, instanceUrl: string) {
    try {
      const response = await fetch(`${instanceUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: SALESFORCE_CLIENT_ID!,
          client_secret: SALESFORCE_CLIENT_SECRET!,
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();

      // Store new tokens
      await kv.set(`salesforce_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: refreshToken, // Salesforce doesn't always return a new refresh token
        instance_url: data.instance_url,
        issued_at: data.issued_at,
        id: data.id
      });

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Helper to make authenticated Salesforce API calls
  async function salesforceRequest(userId: string, endpoint: string, options: any = {}) {
    const tokenData = await getUserAccessToken(userId);

    if (!tokenData) {
      throw new Error('User not connected to Salesforce. Please authorize first.');
    }

    let accessToken = tokenData.access_token;
    const instanceUrl = tokenData.instance_url;

    const url = `${instanceUrl}${endpoint}`;
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
      console.error(`Salesforce API error (${endpoint}):`, errorText);
      
      // If 401, token might be invalid - try refreshing
      if (response.status === 401 && tokenData.refresh_token) {
        console.log('🔄 Got 401, attempting token refresh...');
        accessToken = await refreshAccessToken(userId, tokenData.refresh_token, instanceUrl);
        
        // Retry request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`Salesforce API error: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }

      throw new Error(`Salesforce API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Get OAuth authorization URL
  app.get('/make-server-373d8b09/salesforce/auth-url', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      if (!SALESFORCE_CLIENT_ID) {
        return c.json({ 
          error: 'Salesforce OAuth not configured. Please add SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET environment variables.' 
        }, 500);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Build OAuth authorization URL
      const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', SALESFORCE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', SALESFORCE_REDIRECT_URI);
      authUrl.searchParams.set('state', userId); // Pass userId as state for callback

      console.log('🔗 Generated Salesforce OAuth URL:');
      console.log('   Client ID:', SALESFORCE_CLIENT_ID ? `${SALESFORCE_CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
      console.log('   Redirect URI being sent:', SALESFORCE_REDIRECT_URI);
      console.log('   Full Auth URL:', authUrl.toString());

      return c.json({
        success: true,
        authUrl: authUrl.toString(),
        redirectUri: SALESFORCE_REDIRECT_URI
      });

    } catch (error: any) {
      console.error('Get auth URL error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // OAuth callback handler
  app.post('/make-server-373d8b09/salesforce/callback', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const body = await c.req.json();
      const code = body.code;
      const userId = body.userId;

      if (!code || !userId) {
        return c.json({ error: 'Invalid callback parameters' }, 400);
      }

      console.log(`🔑 Exchanging code for access token for user ${userId}...`);

      // Exchange authorization code for access token
      const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: SALESFORCE_CLIENT_ID!,
          client_secret: SALESFORCE_CLIENT_SECRET!,
          redirect_uri: SALESFORCE_REDIRECT_URI,
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
      await kv.set(`salesforce_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        instance_url: data.instance_url,
        issued_at: data.issued_at,
        id: data.id,
        connected_at: new Date().toISOString()
      });

      console.log(`✅ Salesforce connected successfully for user ${userId}, Instance URL: ${data.instance_url}`);

      return c.json({
        success: true,
        message: 'Salesforce account connected successfully!',
        instanceUrl: data.instance_url
      });

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Check connection status
  app.get('/make-server-373d8b09/salesforce/status', async (c: any) => {
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
          message: 'Not connected to Salesforce'
        });
      }

      // Verify token is still valid by making a test request
      try {
        await salesforceRequest(userId, '/services/data/v59.0/');
        
        return c.json({
          connected: true,
          instanceUrl: tokenData.instance_url,
          connectedAt: tokenData.connected_at
        });
      } catch (error) {
        // Token invalid or expired
        return c.json({
          connected: false,
          message: 'Salesforce connection expired. Please reconnect.'
        });
      }

    } catch (error: any) {
      console.error('Status check error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Disconnect Salesforce
  app.post('/make-server-373d8b09/salesforce/disconnect', async (c: any) => {
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
      await kv.del(`salesforce_oauth:${userId}`);

      console.log(`🔌 Salesforce disconnected for user ${userId}`);

      return c.json({
        success: true,
        message: 'Salesforce disconnected successfully'
      });

    } catch (error: any) {
      console.error('Disconnect error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Sync all data
  app.post('/make-server-373d8b09/salesforce/sync', async (c: any) => {
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

      console.log(`🔄 Starting full Salesforce sync for user ${userId}...`);

      // Get instance URL once
      const tokenData = await getUserAccessToken(userId);
      const instanceUrl = tokenData?.instance_url || '';

      // Fetch all data in parallel
      const [contactsData, accountsData, opportunitiesData] = await Promise.all([
        salesforceRequest(userId, '/services/data/v59.0/query?q=SELECT+Id,FirstName,LastName,Email,Phone,Account.Name,Title,CreatedDate+FROM+Contact+LIMIT+100'),
        salesforceRequest(userId, '/services/data/v59.0/query?q=SELECT+Id,Name,Website,Industry,Phone,BillingCity,BillingState,BillingCountry,NumberOfEmployees,AnnualRevenue,CreatedDate+FROM+Account+LIMIT+100'),
        salesforceRequest(userId, '/services/data/v59.0/query?q=SELECT+Id,Name,Amount,StageName,Probability,CloseDate,CreatedDate+FROM+Opportunity+LIMIT+100')
      ]);

      // Process all data
      const contacts = contactsData.records.map((contact: any) => ({
        id: contact.Id,
        firstName: contact.FirstName || '',
        lastName: contact.LastName || '',
        email: contact.Email || '',
        phone: contact.Phone || '',
        accountName: contact.Account?.Name || '',
        title: contact.Title || '',
        createdAt: contact.CreatedDate,
        salesforceUrl: `${instanceUrl}/lightning/r/Contact/${contact.Id}/view`
      }));

      const accounts = accountsData.records.map((account: any) => ({
        id: account.Id,
        name: account.Name || '',
        website: account.Website || '',
        industry: account.Industry || '',
        phone: account.Phone || '',
        billingCity: account.BillingCity || '',
        billingState: account.BillingState || '',
        billingCountry: account.BillingCountry || '',
        numberOfEmployees: account.NumberOfEmployees || 0,
        annualRevenue: account.AnnualRevenue || 0,
        createdAt: account.CreatedDate,
        salesforceUrl: `${instanceUrl}/lightning/r/Account/${account.Id}/view`
      }));

      const opportunities = opportunitiesData.records.map((opp: any) => ({
        id: opp.Id,
        name: opp.Name || '',
        amount: opp.Amount || 0,
        stage: opp.StageName || '',
        probability: opp.Probability || 0,
        closeDate: opp.CloseDate || '',
        createdAt: opp.CreatedDate,
        salesforceUrl: `${instanceUrl}/lightning/r/Opportunity/${opp.Id}/view`
      }));

      // Store all data
      const syncTime = new Date().toISOString();
      const keyPrefix = businessId ? `${userId}:${businessId}` : userId;

      await Promise.all([
        kv.set(`salesforce_contacts:${keyPrefix}`, { contacts, lastSync: syncTime }),
        kv.set(`salesforce_accounts:${keyPrefix}`, { accounts, lastSync: syncTime }),
        kv.set(`salesforce_opportunities:${keyPrefix}`, { opportunities, lastSync: syncTime })
      ]);

      console.log(`✅ Full sync complete: ${contacts.length} contacts, ${accounts.length} accounts, ${opportunities.length} opportunities`);

      return c.json({
        success: true,
        synced: {
          contacts: contacts.length,
          accounts: accounts.length,
          opportunities: opportunities.length
        },
        lastSync: syncTime
      });

    } catch (error: any) {
      console.error('Sync error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get cached data
  app.get('/make-server-373d8b09/salesforce/cached', async (c: any) => {
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

      const [contactsCache, accountsCache, opportunitiesCache] = await Promise.all([
        kv.get(`salesforce_contacts:${keyPrefix}`),
        kv.get(`salesforce_accounts:${keyPrefix}`),
        kv.get(`salesforce_opportunities:${keyPrefix}`)
      ]);

      return c.json({
        success: true,
        contacts: contactsCache?.contacts || [],
        accounts: accountsCache?.accounts || [],
        opportunities: opportunitiesCache?.opportunities || [],
        lastSync: contactsCache?.lastSync || null
      });

    } catch (error: any) {
      console.error('Get cached data error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  console.log('✅ Salesforce OAuth endpoints added successfully');
}