import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

// Plaid Configuration
const PLAID_CLIENT_ID = '690b80cb1a623c001feb6e2f';
const PLAID_SANDBOX_SECRET = Deno.env.get('PLAID_SANDBOX_SECRET'); // 1a2a7c18898503eff801ea1d60b96f
const PLAID_PRODUCTION_SECRET = Deno.env.get('PLAID_PRODUCTION_SECRET'); // Production key from environment
const PLAID_ENVIRONMENT = Deno.env.get('PLAID_ENVIRONMENT') || 'production'; // Changed default to production

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create Supabase client singleton
let supabase: any = null;
function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
}

// Helper function to safely get user from access token with retry logic
async function getUserFromToken(accessToken: string, retries = 3): Promise<{ user: any; error: any }> {
  const client = getSupabaseClient();
  
  if (!client) {
    console.error('🔐 Supabase client not initialized');
    return { user: null, error: { message: 'Supabase not configured' } };
  }
  
  if (!accessToken) {
    console.error('🔐 No access token provided');
    return { user: null, error: { message: 'No access token provided' } };
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔐 Attempting to verify user (attempt ${attempt}/${retries})...`);
      
      const { data: { user }, error } = await client.auth.getUser(accessToken);
      
      if (error) {
        console.error(`🔐 Auth error (attempt ${attempt}):`, error.message);
        
        // If it's the last attempt, return the error
        if (attempt === retries) {
          return { user: null, error };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        continue;
      }
      
      if (!user) {
        console.error('🔐 No user returned from auth');
        return { user: null, error: { message: 'Invalid token' } };
      }
      
      console.log(`🔐 ✅ User verified: ${user.id}`);
      return { user, error: null };
      
    } catch (error: any) {
      console.error(`🔐 Exception during auth (attempt ${attempt}):`, error.message);
      
      // If it's the last attempt, return the error
      if (attempt === retries) {
        return { user: null, error: { message: error.message || 'Authentication failed' } };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  return { user: null, error: { message: 'Authentication failed after retries' } };
}

// =============================================================================
// PLAID PRICING MODEL & COST OPTIMIZATION STRATEGY
// =============================================================================
// 
// Plaid charges per connected bank account ("Item") per month. Here's how to minimize costs:
//
// 1. TRANSACTIONS PRODUCT (what we use):
//    - Cost: ~$0.40-$1.00 per Item/month (varies by volume)
//    - Includes: Initial sync + automatic daily updates via webhooks (FREE after connection)
//    - Balance data is INCLUDED FOR FREE in transaction responses
//
// 2. WEBHOOKS (FREE):
//    - Plaid sends us notifications when new transactions are available
//    - We auto-sync in response to webhooks (no polling needed)
//    - This is the most cost-effective way to stay updated
//
// 3. BALANCE PRODUCT (separate, NOT used):
//    - Cost: Additional ~$0.40-$1.00 per Item/month
//    - Only needed for real-time balance updates beyond transaction sync
//    - We DON'T use this product
//
// 4. OUR OPTIMIZATION STRATEGY:
//    a) Use webhooks for automatic updates (FREE)
//    b) Get balance data from /accounts/get (included with transactions product)
//    c) Rate limit manual refreshes to prevent excessive API calls
//    d) Users get fresh data automatically via webhooks every 24 hours
//
// 5. COST BREAKDOWN:
//    - Per connected bank: ~$0.40-$1.00/month
//    - 10 connected banks: ~$4-10/month
//    - 100 connected banks: ~$40-100/month
//    - Webhooks: FREE
//    - Balance updates via /accounts/get: FREE (included with transactions)
//
// =============================================================================

// Get the appropriate Plaid secret based on mode
function getPlaidSecret(demoMode: boolean = false) {
  // If demo mode is explicitly requested, always use sandbox
  if (demoMode) {
    console.log('🏦 Using SANDBOX secret (demo mode requested)');
    return PLAID_SANDBOX_SECRET;
  }
  
  // For production mode, use production secret if available
  if (PLAID_PRODUCTION_SECRET) {
    console.log('🏦 Using PRODUCTION secret');
    return PLAID_PRODUCTION_SECRET;
  }
  
  // Fallback to sandbox
  console.log('🏦 Using SANDBOX secret (fallback - no production secret configured)');
  return PLAID_SANDBOX_SECRET;
}

// Get Plaid API URL based on mode
function getPlaidUrl(demoMode: boolean = false) {
  // If demo mode is explicitly requested, always use sandbox
  if (demoMode) {
    console.log('🏦 Using SANDBOX URL (demo mode requested)');
    return 'https://sandbox.plaid.com';
  }
  
  // For production mode
  if (PLAID_PRODUCTION_SECRET) {
    console.log('🏦 Using PRODUCTION URL');
    return 'https://production.plaid.com';
  }
  
  // Fallback to sandbox
  console.log('🏦 Using SANDBOX URL (fallback)');
  return 'https://sandbox.plaid.com';
}

// Create Plaid Link Token (Step 1)
app.post('/create-link-token', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { userId, businessId, demoMode = false, isMobile = false } = await c.req.json();
    
    const plaidSecret = getPlaidSecret(demoMode);
    const plaidUrl = getPlaidUrl(demoMode);
    const environment = demoMode ? 'sandbox' : PLAID_ENVIRONMENT;
    
    if (!plaidSecret) {
      return c.json({ 
        success: false, 
        error: `Plaid ${environment} secret not configured` 
      }, 500);
    }

    console.log('🏦 =================================================');
    console.log('🏦 PLAID LINK TOKEN CREATION');
    console.log('🏦 =================================================');
    console.log('🏦 Mode:', demoMode ? 'DEMO (Sandbox)' : 'PRODUCTION');
    console.log('🏦 Environment:', environment);
    console.log('🏦 Client ID:', PLAID_CLIENT_ID);
    console.log('🏦 API URL:', plaidUrl);
    console.log('🏦 =================================================');
    
    if (!userId || !businessId) {
      return c.json({ success: false, error: 'User ID and business ID are required' }, 400);
    }

    // Get user details for Plaid
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }

    // Determine redirect URI based on platform
    // For iOS/Android native apps, use HTTPS redirect with deep link handling
    // Plaid requires HTTPS redirects, not custom URL schemes
    // The web page will then redirect to the app using a custom URL scheme
    const redirectUri = isMobile 
      ? 'https://www.cofounderplus.com/plaid-oauth-redirect'  // Mobile: special page that deep links back to app
      : 'https://www.cofounderplus.com/operations/finance';   // Web: normal redirect
    
    console.log('🏦 Platform Detection:', {
      isMobile,
      redirectUri,
      userAgent: c.req.header('User-Agent')?.substring(0, 100)
    });
    
    // Create Plaid Link Token
    const requestBody = {
      client_id: PLAID_CLIENT_ID,
      secret: plaidSecret,
      user: {
        client_user_id: userId,
      },
      client_name: 'Cofounder',
      products: ['transactions'], // Only request transactions - 'auth' requires separate Plaid approval
      country_codes: ['US'],
      language: 'en',
      redirect_uri: redirectUri,
      webhook: 'https://mktlvijfqgzmnfudfqvn.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/webhook',
      // For mobile, we need to enable OAuth for institutions that require it
      ...(isMobile && {
        // Enable OAuth flow for mobile
        android_package_name: null, // Not using Android package name approach
        // We'll use the web OAuth flow with deep linking
      })
    };

    console.log('🏦 Creating Link Token with request:', {
      client_user_id: userId,
      products: requestBody.products,
      environment: environment,
      mode: demoMode ? 'DEMO' : 'PRODUCTION',
      platform: isMobile ? 'MOBILE (Native App)' : 'WEB (Browser)',
      redirect_uri: redirectUri
    });

    const response = await fetch(`${plaidUrl}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🏦 Plaid Link Token Error:', errorData);
      return c.json({ 
        success: false, 
        error: `Plaid API Error: ${errorData.error_message || 'Unknown error'}`,
        details: errorData
      }, response.status);
    }

    const data = await response.json();
    
    console.log('🏦 ✅ Link Token created successfully:', {
      link_token: data.link_token?.substring(0, 20) + '...',
      expiration: data.expiration
    });

    return c.json({
      success: true,
      link_token: data.link_token,
      expiration: data.expiration
    });

  } catch (error: any) {
    console.error('🏦 Create Link Token Error:', error);
    return c.json({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

// Exchange Public Token for Access Token (Step 2)
app.post('/exchange-public-token', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { publicToken, businessId, metadata, demoMode = false } = await c.req.json();
    
    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;
    
    // Determine which environment this token came from
    // Public tokens from sandbox start with "public-sandbox-"
    // Public tokens from production start with "public-production-"
    const isSandboxToken = publicToken.startsWith('public-sandbox-');
    const isProductionToken = publicToken.startsWith('public-production-');
    const isDemoConnection = demoMode || isSandboxToken;
    
    const plaidSecret = getPlaidSecret(isDemoConnection);
    const plaidUrl = getPlaidUrl(isDemoConnection);
    
    if (!plaidSecret) {
      return c.json({ 
        success: false, 
        error: `Plaid secret not configured for ${isDemoConnection ? 'sandbox' : 'production'}` 
      }, 500);
    }
    
    if (!publicToken || !businessId) {
      return c.json({ success: false, error: 'Public token and business ID are required' }, 400);
    }

    console.log('🏦 Exchanging public token for access token...', {
      businessId,
      institution: metadata?.institution?.name,
      mode: isDemoConnection ? 'DEMO (Sandbox)' : 'PRODUCTION',
      tokenType: isSandboxToken ? 'sandbox' : isProductionToken ? 'production' : 'unknown'
    });

    // Exchange public token for access token
    const response = await fetch(`${plaidUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        public_token: publicToken
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🏦 Token Exchange Error:', errorData);
      return c.json({ 
        success: false, 
        error: `Plaid API Error: ${errorData.error_message || 'Unknown error'}`,
        details: errorData
      }, response.status);
    }

    const data = await response.json();
    
    console.log('🏦 ✅ Token exchange successful:', {
      access_token: data.access_token?.substring(0, 20) + '...',
      item_id: data.item_id
    });

    // Store access token and item info
    const connectionData = {
      id: `plaid_${Date.now()}`,
      business_id: businessId,
      item_id: data.item_id,
      access_token: data.access_token,
      institution_name: metadata?.institution?.name || 'Unknown Bank',
      institution_id: metadata?.institution?.institution_id,
      account_id: metadata?.account?.id,
      account_name: metadata?.account?.name,
      account_mask: metadata?.account?.mask,
      account_type: metadata?.account?.type,
      account_subtype: metadata?.account?.subtype,
      status: 'active',
      is_demo: isDemoConnection, // Track if this is a demo/sandbox connection
      environment: isDemoConnection ? 'sandbox' : 'production',
      created_at: new Date().toISOString()
    };

    // Save connection with userId in key
    await kv.set(`business:${userId}:${businessId}:plaid_connection:${data.item_id}`, connectionData);
    
    // Also save a mapping of item_id -> connection details for webhooks
    await kv.set(`plaid_item_mapping:${data.item_id}`, {
      userId,
      businessId
    });
    
    console.log('🏦 Saved connection:', `business:${userId}:${businessId}:plaid_connection:${data.item_id}`);

    return c.json({
      success: true,
      item_id: data.item_id,
      connection: connectionData
    });

  } catch (error: any) {
    console.error('🏦 Exchange Token Error:', error);
    return c.json({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

// Get connected accounts for a business
app.get('/connected-accounts/:businessId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const businessId = c.req.param('businessId');
    
    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    const accounts = await kv.getByPrefix(`business:${userId}:${businessId}:plaid_connection:`);
    
    return c.json({
      success: true,
      accounts: accounts || []
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Helper function to sync transactions
async function syncTransactionsInternal(userId: string, businessId: string, itemId: string) {
  // Get the stored connection info to determine environment
  const connectionKey = `business:${userId}:${businessId}:plaid_connection:${itemId}`;
  const connection = await kv.get(connectionKey);
  
  if (!connection || !connection.access_token) {
    throw new Error('Bank connection not found');
  }

  // Determine which environment to use based on connection
  const isDemoConnection = connection.is_demo || connection.environment === 'sandbox';
  const plaidSecret = getPlaidSecret(isDemoConnection);
  const plaidUrl = getPlaidUrl(isDemoConnection);
  
  if (!plaidSecret) {
    throw new Error(`Plaid secret not configured for ${isDemoConnection ? 'sandbox' : 'production'}`);
  }

  console.log('🏦 Syncing transactions for:', {
    businessId,
    itemId,
    institution: connection.institution_name,
    mode: isDemoConnection ? 'DEMO (Sandbox)' : 'PRODUCTION'
  });

  // Calculate date range - Get full transaction history (2 years max for Plaid)
  // Plaid's transactions/get endpoint supports up to 2 years of history
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);

  // Fetch transactions from Plaid
  const response = await fetch(`${plaidUrl}/transactions/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: plaidSecret,
      access_token: connection.access_token,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('🏦 Transactions Fetch Error:', errorData);
    throw new Error(`Plaid API Error: ${errorData.error_message || 'Unknown error'}`);
  }

  const transactionsData = await response.json();
  const plaidTransactions = transactionsData.transactions || [];
  const accounts = transactionsData.accounts || [];

  console.log(`🏦 Retrieved ${plaidTransactions.length} transactions from Plaid`);

  // Update account balances if provided in the response
  // This is the optimal way to get balances - it comes free with transactions/get
  if (accounts.length > 0) {
    console.log('🏦 Updating balances from transactions response (free update)');
    // Find matching account if possible, or update all associated with this item
    // In our simplified model, the connection object tracks the primary account
    const matchingAccount = accounts.find((acc: any) => acc.account_id === connection.account_id) || accounts[0];
    
    if (matchingAccount) {
      connection.current_balance = matchingAccount.balances.current;
      connection.available_balance = matchingAccount.balances.available;
      connection.currency = matchingAccount.balances.iso_currency_code || 'USD';
      connection.balance_last_updated = new Date().toISOString();
      // We'll save connection at the end
    }
  }

  // Get existing transactions to avoid duplicates
  // Use correct key format: transaction:${userId}:${businessId}:${transactionId}
  const existingTransactions = await kv.getByPrefix(`transaction:${userId}:${businessId}:`);
  const existingPlaidIds = new Set(
    existingTransactions
      .filter((t: any) => t.plaid_transaction_id)
      .map((t: any) => t.plaid_transaction_id)
  );

  // Convert Plaid transactions to our format
  let importedCount = 0;
  for (const plaidTx of plaidTransactions) {
    // Skip if already imported
    if (existingPlaidIds.has(plaidTx.transaction_id)) {
      continue;
    }

    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      business_id: businessId,
      plaid_transaction_id: plaidTx.transaction_id,
      plaid_item_id: itemId,
      type: plaidTx.amount > 0 ? 'expense' : 'income', // Plaid uses positive for debits/expenses
      amount: Math.abs(plaidTx.amount),
      description: plaidTx.name || 'Bank transaction',
      category: plaidTx.category?.[0] || 'Uncategorized',
      merchant_name: plaidTx.merchant_name,
      date: plaidTx.date,
      status: plaidTx.pending ? 'pending' : 'completed',
      payment_method: connection.institution_name || 'Bank Transfer',
      reference: plaidTx.transaction_id,
      notes: `Imported from ${connection.institution_name} via Plaid`,
      created_at: new Date().toISOString(),
      imported_from_bank: true,
      account_id: plaidTx.account_id
    };

    // Format: transaction:${userId}:${businessId}:${transactionId}
    await kv.set(`transaction:${userId}:${businessId}:${transaction.id}`, transaction);
    importedCount++;
  }

  // Update last synced timestamp
  connection.last_synced = new Date().toISOString();
  await kv.set(connectionKey, connection);

  console.log(`🏦 ✅ Imported ${importedCount} new transactions`);

  return {
    importedCount,
    totalTransactions: plaidTransactions.length,
    lastSynced: connection.last_synced
  };
}

// Sync transactions from Plaid
app.post('/sync-transactions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { businessId, itemId, forceWithCredits } = await c.req.json();
    
    if (!businessId || !itemId) {
      return c.json({ success: false, error: 'Business ID and item ID are required' }, 400);
    }

    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    // Check 24-hour window for transaction syncs
    const rateLimitKey = `plaid_transaction_sync_limit:${itemId}`;
    
    let lastSync = await kv.get(rateLimitKey);
    // Handle potential string serialization
    if (typeof lastSync === 'string') {
      try { lastSync = JSON.parse(lastSync); } catch (e) {}
    }
    
    let shouldChargeCredits = false;
    let hoursRemaining = 0;
    
    if (lastSync && lastSync.timestamp) {
      const lastSyncTime = new Date(lastSync.timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60);
      
      console.log('🏦 Transaction sync rate limit check:', {
        itemId,
        hoursSinceSync,
        lastSyncTime: lastSync.timestamp,
        now: new Date().toISOString(),
        allowed: hoursSinceSync >= 24
      });
      
      if (hoursSinceSync < 24) {
        hoursRemaining = Math.ceil(24 - hoursSinceSync);
        
        // If user is not forcing with credits, return rate limit info
        if (!forceWithCredits) {
          console.log(`🏦 BLOCKED: Transaction sync attempted too soon (${hoursSinceSync.toFixed(2)} hours)`);
          
          return c.json({ 
            success: false, 
            error: `You can sync transactions for free in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. To sync now, it will cost 10 credits.`,
            rateLimited: true,
            hoursRemaining,
            creditCost: 10,
            requiresCredits: true
          }, 429);
        }
        
        // User wants to force sync with credits
        shouldChargeCredits = true;
      }
    }

    // If charging credits, deduct them first
    if (shouldChargeCredits) {
      console.log('🏦 Charging 10 credits for early transaction sync');
      
      // Get user's current credit balance
      const creditsKey = `credits:${userId}`;
      let creditsData = await kv.get(creditsKey);
      if (typeof creditsData === 'string') {
        try { creditsData = JSON.parse(creditsData); } catch (e) {}
      }
      
      const currentBalance = creditsData?.balance || 0;
      
      if (currentBalance < 10) {
        return c.json({
          success: false,
          error: 'Insufficient credits. You need 10 credits to sync now.',
          requiresCredits: true,
          currentBalance,
          requiredAmount: 10
        }, 402); // Payment Required
      }
      
      // Deduct credits
      const newBalance = currentBalance - 10;
      await kv.set(creditsKey, {
        balance: newBalance,
        last_updated: new Date().toISOString()
      });
      
      console.log(`🏦 Deducted 10 credits. New balance: ${newBalance}`);
    }

    const result = await syncTransactionsInternal(userId, businessId, itemId);
    
    // Set rate limit for transaction sync (24-hour window)
    await kv.set(rateLimitKey, {
      timestamp: new Date().toISOString(),
      itemId
    });

    return c.json({
      success: true,
      transactionsImported: result.importedCount,
      totalTransactions: result.totalTransactions,
      lastSynced: result.lastSynced,
      creditsCharged: shouldChargeCredits ? 10 : 0
    });

  } catch (error: any) {
    console.error('🏦 Sync Transactions Error:', error);
    return c.json({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

// Sync all connected bank accounts at once
app.post('/sync-all-transactions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { businessId } = await c.req.json();
    
    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    // Get all connected accounts for this business
    const allConnections = await kv.getByPrefix(`business:${userId}:${businessId}:plaid_connection:`);
    console.log(`🏦 Found ${allConnections.length} connected bank accounts for sync-all`);
    
    if (allConnections.length === 0) {
      return c.json({ 
        success: true, 
        transactionsImported: 0, 
        message: 'No connected bank accounts found' 
      });
    }

    // Check rate limiting for bulk syncs (more restrictive)
    const bulkRateLimitKey = `plaid_sync_all_limit:${businessId}`;
    
    let lastBulkSync = await kv.get(bulkRateLimitKey);
    if (typeof lastBulkSync === 'string') {
      try { lastBulkSync = JSON.parse(lastBulkSync); } catch (e) {}
    }
    
    if (lastBulkSync && lastBulkSync.timestamp) {
      const lastBulkSyncTime = new Date(lastBulkSync.timestamp).getTime();
      const now = new Date().getTime();
      // Allow bulk sync every 15 minutes
      const minutesSinceBulkSync = (now - lastBulkSyncTime) / (1000 * 60);
      
      if (minutesSinceBulkSync < 15) {
        return c.json({ 
          success: false, 
          error: `Please wait ${Math.ceil(15 - minutesSinceBulkSync)} minutes before syncing all accounts again.`,
          rateLimited: true
        }, 429);
      }
    }

    // Sync all accounts sequentially (to avoid overwhelming Plaid API)
    let totalImported = 0;
    const results: any[] = [];
    
    for (const connection of allConnections) {
      try {
        console.log(`🏦 Syncing account: ${connection.institution_name} (${connection.item_id})`);
        const result = await syncTransactionsInternal(userId, businessId, connection.item_id);
        totalImported += result.importedCount;
        results.push({
          itemId: connection.item_id,
          institution: connection.institution_name,
          imported: result.importedCount,
          success: true
        });
      } catch (error: any) {
        console.error(`🏦 Error syncing ${connection.institution_name}:`, error);
        results.push({
          itemId: connection.item_id,
          institution: connection.institution_name,
          imported: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    // Set rate limit for bulk sync
    await kv.set(bulkRateLimitKey, {
      timestamp: new Date().toISOString(),
      businessId
    });

    return c.json({
      success: true,
      transactionsImported: totalImported,
      accountsSynced: allConnections.length,
      results
    });

  } catch (error: any) {
    console.error('🏦 Sync All Transactions Error:', error);
    return c.json({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

// Disconnect a bank account
app.post('/disconnect/:itemId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const itemId = c.req.param('itemId');
    
    if (!itemId) {
      return c.json({ success: false, error: 'Item ID is required' }, 400);
    }

    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    // Find and remove the connection
    const allConnections = await kv.getByPrefix(`business:${userId}:`);
    const connection = allConnections.find((conn: any) => conn.item_id === itemId);
    
    if (connection) {
      const businessId = connection.business_id;
      await kv.del(`business:${userId}:${businessId}:plaid_connection:${itemId}`);
      
      console.log('🏦 Disconnected bank account:', itemId);
    }

    return c.json({
      success: true,
      message: 'Bank account disconnected'
    });

  } catch (error: any) {
    console.error('🏦 Disconnect Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update tax label for a bank account
app.post('/update-tax-label', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { businessId, itemId, taxLabel } = await c.req.json();
    
    if (!businessId || !itemId || !taxLabel) {
      return c.json({ success: false, error: 'Business ID, item ID, and tax label are required' }, 400);
    }

    if (taxLabel !== 'personal' && taxLabel !== 'business') {
      return c.json({ success: false, error: 'Tax label must be "personal" or "business"' }, 400);
    }

    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    // Get the connection
    const connectionKey = `business:${userId}:${businessId}:plaid_connection:${itemId}`;
    const connection = await kv.get(connectionKey);
    
    if (!connection) {
      return c.json({ success: false, error: 'Bank connection not found' }, 404);
    }

    // Update tax label
    connection.tax_label = taxLabel;
    await kv.set(connectionKey, connection);

    console.log(`🏦 Updated tax label for ${itemId} to ${taxLabel}`);

    return c.json({
      success: true,
      message: 'Tax label updated successfully'
    });

  } catch (error: any) {
    console.error('🏦 Update Tax Label Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Webhook handler for Plaid events
app.post('/webhook', async (c) => {
  try {
    const event = await c.req.json();
    
    console.log('🏦 Plaid Webhook Event:', event.webhook_type, event.webhook_code);

    switch (event.webhook_type) {
      case 'TRANSACTIONS':
        if (event.webhook_code === 'DEFAULT_UPDATE' || event.webhook_code === 'INITIAL_UPDATE') {
          // New transactions available
          const itemId = event.item_id;
          console.log('🏦 New transactions available for item:', itemId);
          
          // Lookup connection details using the mapping
          const mappingKey = `plaid_item_mapping:${itemId}`;
          const mapping = await kv.get(mappingKey);
          
          if (mapping && mapping.userId && mapping.businessId) {
            console.log('🏦 Auto-sync triggered via webhook for:', mapping.businessId);
            
            // Trigger automatic sync
            // Note: This runs in background, we don't wait for it
            syncTransactionsInternal(mapping.userId, mapping.businessId, itemId)
              .then(result => {
                console.log(`🏦 Auto-sync completed via webhook: ${result.importedCount} transactions`);
              })
              .catch(err => {
                console.error('🏦 Auto-sync failed via webhook:', err);
              });
          } else {
             console.log('🏦 Could not find mapping for item_id:', itemId);
             // Try fallback search (less efficient but necessary for older connections)
             const allConnections = await kv.getByPrefix('business:');
             const connection = allConnections.find((conn: any) => conn.item_id === itemId);
             
             if (connection) {
               console.log('🏦 Found connection via fallback search');
               // Extract userId from connection key pattern logic or stored field if available?
               // The connection object doesn't have userId usually, but the KEY does.
               // We can't easily get the key here. 
               // Best effort: if we found it, we might need to parse the key if we had it, but `getByPrefix` returns values.
               // Actually, `kv.getByPrefix` returns values. 
               // Without the key or userId stored in the value, we are stuck.
               // So we will just log this limitation.
               console.log('🏦 Cannot sync - missing userId context. Mapping required.');
             }
          }
        }
        break;

      case 'ITEM':
        if (event.webhook_code === 'ERROR') {
          // Item encountered an error
          const itemId = event.item_id;
          console.error('🏦 Item error:', itemId, event.error);
          
          // Lookup connection details
          const mappingKey = `plaid_item_mapping:${itemId}`;
          const mapping = await kv.get(mappingKey);
          
          if (mapping) {
             const connectionKey = `business:${mapping.userId}:${mapping.businessId}:plaid_connection:${itemId}`;
             const connection = await kv.get(connectionKey);
             
             if (connection) {
                connection.status = 'error';
                connection.error_message = event.error?.error_message;
                await kv.set(connectionKey, connection);
                console.log('🏦 Connection status updated to error via webhook');
             }
          }
        }
        break;

      default:
        console.log('🏦 Unhandled webhook type:', event.webhook_type);
        break;
    }

    return c.json({ received: true });

  } catch (error: any) {
    console.error('🏦 Webhook Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get account balance from Plaid
// NOTE: We get balances automatically when syncing transactions, so this endpoint
// is primarily for explicit balance refresh requests. However, the /accounts/balance/get
// endpoint requires the "balance" product which may not be enabled in production.
// Instead, we'll use /accounts/get which only requires "transactions" product.
app.post('/get-balance', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const plaidSecret = getPlaidSecret();
    
    if (!plaidSecret) {
      return c.json({ success: false, error: 'Plaid not configured' }, 500);
    }

    // Verify user authentication
    const { user, error: authError } = await getUserFromToken(accessToken);
    
    if (!user?.id || authError) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    const { businessId, itemId, forceWithCredits } = await c.req.json();

    // Check rate limiting (once per day)
    // Use itemId as the primary key for rate limiting as it's unique to the connection
    const rateLimitKey = `plaid_balance_refresh_limit:${itemId}`;
    
    // Debug logging for rate limit check
    console.log(`🏦 Checking rate limit for key: ${rateLimitKey}`);
    
    let lastRefresh = await kv.get(rateLimitKey);
    
    // Handle potential string serialization issues (defensive coding)
    if (typeof lastRefresh === 'string') {
      try {
        console.log('🏦 Parsing stringified rate limit data');
        lastRefresh = JSON.parse(lastRefresh);
      } catch (e) {
        console.error('🏦 Error parsing rate limit data:', e);
      }
    }
    
    console.log('🏦 Last refresh data:', JSON.stringify(lastRefresh));
    
    let shouldChargeCredits = false;
    let hoursRemaining = 0;
    
    // Plaid Balance product costs money per call.
    // However, transactions/get (which we use in sync-transactions) includes balance data for free.
    // So we should encourage users to use sync-transactions instead of explicit get-balance.
    // But if they insist on get-balance, we must limit it.
    
    if (lastRefresh && lastRefresh.timestamp) {
      const lastRefreshTime = new Date(lastRefresh.timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceRefresh = (now - lastRefreshTime) / (1000 * 60 * 60);
      
      console.log('🏦 Rate limit check:', {
        itemId,
        hoursSinceRefresh,
        lastRefreshTime: lastRefresh.timestamp,
        now: new Date().toISOString(),
        allowed: hoursSinceRefresh >= 24
      });

      if (hoursSinceRefresh < 24) {
        hoursRemaining = Math.ceil(24 - hoursSinceRefresh);
        
        // If user is not forcing with credits, return rate limit info
        if (!forceWithCredits) {
          console.log(`🏦 BLOCKED: Refresh attempted too soon (${hoursSinceRefresh.toFixed(2)} hours)`);
          
          return c.json({ 
            success: false, 
            error: `You can refresh balance for free in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. To refresh now, it will cost 10 credits.`,
            rateLimited: true,
            hoursRemaining,
            creditCost: 10,
            requiresCredits: true
          }, 429);
        }
        
        // User wants to force refresh with credits
        shouldChargeCredits = true;
      }
    } else {
      console.log('🏦 ALLOWED: No previous refresh record found');
    }

    // If charging credits, deduct them first
    if (shouldChargeCredits) {
      console.log('🏦 Charging 10 credits for early balance refresh');
      
      // Get user's current credit balance
      const creditsKey = `credits:${userId}`;
      let creditsData = await kv.get(creditsKey);
      if (typeof creditsData === 'string') {
        try { creditsData = JSON.parse(creditsData); } catch (e) {}
      }
      
      const currentBalance = creditsData ? (typeof creditsData === 'number' ? creditsData : parseInt(creditsData as string)) : 0;
      
      if (currentBalance < 10) {
        return c.json({
          success: false,
          error: 'Insufficient credits. You need 10 credits to refresh now.',
          requiresCredits: true,
          currentBalance,
          requiredAmount: 10
        }, 402); // Payment Required
      }
      
      // Deduct credits
      const newBalance = currentBalance - 10;
      await kv.set(creditsKey, newBalance);
      
      console.log(`🏦 Deducted 10 credits. New balance: ${newBalance}`);
    }

    // Get bank connection
    const connectionKey = `business:${userId}:${businessId}:plaid_connection:${itemId}`;
    const connection = await kv.get(connectionKey);
    
    if (!connection || !connection.access_token) {
      return c.json({ success: false, error: 'Bank connection not found' }, 404);
    }

    console.log('🏦 Fetching balance for:', {
      businessId,
      itemId,
      institution: connection.institution_name
    });

    // Use /accounts/get instead of /accounts/balance/get
    // This only requires "transactions" product, not "balance" product
    const response = await fetch(`${getPlaidUrl()}/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        access_token: connection.access_token
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🏦 Balance Fetch Error:', errorData);
      return c.json({ 
        success: false, 
        error: `Plaid API Error: ${errorData.error_message || 'Unknown error'}`,
        details: errorData
      }, response.status);
    }

    const balanceData = await response.json();
    const accounts = balanceData.accounts || [];

    console.log(`🏦 Retrieved ${accounts.length} accounts with balances`);

    // Update connection with latest balance info
    if (accounts.length > 0) {
      const primaryAccount = accounts[0]; // Use first account or find matching account_id
      connection.current_balance = primaryAccount.balances.current;
      connection.available_balance = primaryAccount.balances.available;
      connection.currency = primaryAccount.balances.iso_currency_code || 'USD';
      connection.balance_last_updated = new Date().toISOString();
      
      await kv.set(connectionKey, connection);
    }

    // Set rate limit
    console.log(`🏦 Setting new rate limit for key: ${rateLimitKey}`);
    await kv.set(rateLimitKey, {
      timestamp: new Date().toISOString(),
      itemId
    });

    console.log('🏦 ✅ Balance fetched successfully');

    return c.json({
      success: true,
      accounts: accounts.map((acc: any) => ({
        account_id: acc.account_id,
        name: acc.name,
        mask: acc.mask,
        type: acc.type,
        subtype: acc.subtype,
        current_balance: acc.balances.current,
        available_balance: acc.balances.available,
        currency: acc.balances.iso_currency_code || 'USD'
      })),
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🏦 Get Balance Error:', error);
    return c.json({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

// Check if refresh is available (rate limit check)
app.post('/check-refresh-available', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { businessId, itemId, type } = await c.req.json();
    
    if (!businessId || !itemId || !type) {
      return c.json({ success: false, error: 'Business ID, item ID, and type are required' }, 400);
    }

    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    const rateLimitKey = type === 'balance' 
      ? `plaid_balance_refresh_limit:${itemId}`
      : `plaid_sync_limit:${itemId}`;
    
    let lastRefresh = await kv.get(rateLimitKey);
    // Handle potential string serialization
    if (typeof lastRefresh === 'string') {
      try { lastRefresh = JSON.parse(lastRefresh); } catch (e) {}
    }
    
    if (!lastRefresh || !lastRefresh.timestamp) {
      return c.json({
        success: true,
        available: true,
        message: 'Refresh available'
      });
    }

    const lastRefreshTime = new Date(lastRefresh.timestamp).getTime();
    const now = new Date().getTime();
    const hoursSinceRefresh = (now - lastRefreshTime) / (1000 * 60 * 60);
    
    if (hoursSinceRefresh >= 24) {
      return c.json({
        success: true,
        available: true,
        message: 'Refresh available'
      });
    }

    const hoursRemaining = Math.ceil(24 - hoursSinceRefresh);
    return c.json({
        success: true,
        available: false,
        hoursRemaining,
        nextRefreshAvailable: new Date(lastRefreshTime + 24 * 60 * 60 * 1000).toISOString(),
        message: `Refresh available in ${hoursRemaining} hours`
      });

  } catch (error: any) {
    console.error('🏦 Check Refresh Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Verify Plaid configuration endpoint
app.get('/verify-config', async (c) => {
  try {
    const plaidSecret = getPlaidSecret();
    
    if (!plaidSecret) {
      return c.json({ 
        configured: false, 
        error: `Plaid ${PLAID_ENVIRONMENT} secret not set` 
      });
    }

    return c.json({
      configured: true,
      environment: PLAID_ENVIRONMENT,
      clientId: PLAID_CLIENT_ID,
      apiUrl: getPlaidUrl(),
      secretSet: !!plaidSecret
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// MIGRATION ENDPOINT: Fix transaction keys from old format to new format
// Old format: business:${userId}:${businessId}:transaction:${id}
// New format: transaction:${userId}:${businessId}:${id}
app.post('/migrate-transaction-keys', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { businessId } = await c.req.json();
    
    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    // Get user ID from access token
    const { user, error: authError } = await getUserFromToken(accessToken);
    if (authError || !user) {
      console.error('🏦 Auth failed:', authError?.message);
      return c.json({ success: false, error: authError?.message || 'Unauthorized' }, 401);
    }
    const userId = user.id;

    console.log('🔄 Starting transaction key migration for:', { userId, businessId });

    // Get all transactions with OLD key format
    const oldTransactions = await kv.getByPrefix(`business:${userId}:${businessId}:transaction:`);
    
    if (!oldTransactions || oldTransactions.length === 0) {
      console.log('🔄 No old-format transactions found');
      return c.json({
        success: true,
        migrated: 0,
        message: 'No transactions to migrate'
      });
    }

    console.log(`🔄 Found ${oldTransactions.length} transactions with old key format`);

    let migrated = 0;
    let failed = 0;

    for (const transaction of oldTransactions) {
      try {
        const transactionId = transaction.id;
        
        // Save with NEW key format
        await kv.set(`transaction:${userId}:${businessId}:${transactionId}`, transaction);
        
        // Delete OLD key format
        await kv.del(`business:${userId}:${businessId}:transaction:${transactionId}`);
        
        migrated++;
        console.log(`🔄 Migrated transaction: ${transactionId}`);
      } catch (error) {
        console.error(`🔄 Failed to migrate transaction:`, error);
        failed++;
      }
    }

    console.log(`🔄 ✅ Migration complete: ${migrated} migrated, ${failed} failed`);

    return c.json({
      success: true,
      migrated,
      failed,
      message: `Successfully migrated ${migrated} transactions`
    });

  } catch (error: any) {
    console.error('🔄 Migration Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;