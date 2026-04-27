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

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// Create Financial Connections Session
app.post('/create-session', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const { userId, businessId, successUrl, cancelUrl } = await c.req.json();
    
    if (!userId || !businessId) {
      return c.json({ success: false, error: 'User ID and business ID are required' }, 400);
    }

    // Get or create Stripe customer
    let stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!stripeCustomerId) {
      // Get user details
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      // Create Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email!,
          'metadata[userId]': userId,
          'metadata[businessId]': businessId
        })
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to create Stripe customer');
      }

      const customer = await customerResponse.json();
      stripeCustomerId = customer.id;
      await kv.set(`stripe_customer:${userId}`, stripeCustomerId);
    }

    // Create Financial Connections Session
    const sessionResponse = await fetch('https://api.stripe.com/v1/financial_connections/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account_holder: JSON.stringify({
          type: 'customer',
          customer: stripeCustomerId
        }),
        permissions: JSON.stringify(['payment_method', 'balances', 'transactions']),
        filters: JSON.stringify({
          countries: ['US']
        }),
        return_url: successUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/operations/finance?bank_connected=true`
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      return c.json({ success: false, error: 'Failed to create Financial Connections session' }, 500);
    }

    const session = await sessionResponse.json();

    // Store session info for later retrieval
    await kv.set(`financial_connection_session:${session.id}`, {
      userId,
      businessId,
      sessionId: session.id,
      created_at: new Date().toISOString()
    });

    return c.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.hosted_url,
      clientSecret: session.client_secret
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

// Get connected accounts for a business
app.get('/connected-accounts/:businessId', async (c) => {
  try {
    const businessId = c.req.param('businessId');
    
    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    const accounts = await kv.getByPrefix(`bank_connection:${businessId}:`);
    
    return c.json({
      success: true,
      accounts: accounts || []
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Sync transactions from a connected account
app.post('/sync-transactions', async (c) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const { businessId, accountId } = await c.req.json();
    
    if (!businessId || !accountId) {
      return c.json({ success: false, error: 'Business ID and account ID are required' }, 400);
    }

    // Get the stored account connection info
    const connectionKey = `bank_connection:${businessId}:${accountId}`;
    const connection = await kv.get(connectionKey);
    
    if (!connection) {
      return c.json({ success: false, error: 'Bank connection not found' }, 404);
    }

    // Retrieve transactions from Stripe Financial Connections
    const transactionsResponse = await fetch(
      `https://api.stripe.com/v1/financial_connections/transactions?account=${accountId}&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
        }
      }
    );

    if (!transactionsResponse.ok) {
      const errorText = await transactionsResponse.text();
      return c.json({ success: false, error: 'Failed to fetch transactions from Stripe' }, 500);
    }

    const transactionsData = await transactionsResponse.json();
    const stripeTransactions = transactionsData.data || [];

    // Get existing transactions to avoid duplicates
    const existingTransactions = await kv.getByPrefix(`finance_transaction:${businessId}:`);
    const existingStripeIds = new Set(
      existingTransactions
        .filter((t: any) => t.stripe_transaction_id)
        .map((t: any) => t.stripe_transaction_id)
    );

    // Convert Stripe transactions to our format
    let importedCount = 0;
    for (const stripeTx of stripeTransactions) {
      // Skip if already imported
      if (existingStripeIds.has(stripeTx.id)) {
        continue;
      }

      const transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        business_id: businessId,
        stripe_transaction_id: stripeTx.id,
        type: stripeTx.amount < 0 ? 'expense' : 'income',
        amount: Math.abs(stripeTx.amount) / 100, // Convert from cents
        description: stripeTx.description || 'Bank transaction',
        category: categorizeTransaction(stripeTx),
        date: new Date(stripeTx.transacted_at * 1000).toISOString(),
        status: 'completed',
        payment_method: connection.institution_name || 'Bank Transfer',
        reference: stripeTx.id,
        notes: `Imported from ${connection.institution_name}`,
        created_at: new Date().toISOString(),
        imported_from_bank: true
      };

      await kv.set(`finance_transaction:${businessId}:${transaction.id}`, transaction);
      importedCount++;
    }

    // Update last synced timestamp
    connection.last_synced = new Date().toISOString();
    await kv.set(connectionKey, connection);

    return c.json({
      success: true,
      transactionsImported: importedCount,
      totalTransactions: stripeTransactions.length
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'Unknown error' }, 500);
  }
});

// Disconnect a bank account
app.post('/disconnect/:accountId', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    
    if (!accountId) {
      return c.json({ success: false, error: 'Account ID is required' }, 400);
    }

    // Find and remove the connection
    const allConnections = await kv.getByPrefix('bank_connection:');
    const connection = allConnections.find((conn: any) => conn.account_id === accountId);
    
    if (connection) {
      const businessId = connection.business_id;
      await kv.del(`bank_connection:${businessId}:${accountId}`);
      
      // Optionally disconnect from Stripe as well
      if (STRIPE_SECRET_KEY) {
        await fetch(`https://api.stripe.com/v1/financial_connections/accounts/${accountId}/disconnect`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
          }
        });
      }
    }

    return c.json({
      success: true,
      message: 'Bank account disconnected'
    });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Webhook handler for Financial Connections events
app.post('/webhook', async (c) => {
  try {
    const event = await c.req.json();

    switch (event.type) {
      case 'financial_connections.account.created':
        // Store the connected account
        const account = event.data.object;
        const sessionInfo = await kv.get(`financial_connection_session:${account.session_id}`);
        
        if (sessionInfo) {
          const connectionData = {
            id: `conn_${Date.now()}`,
            business_id: sessionInfo.businessId,
            account_id: account.id,
            institution_name: account.institution_name,
            account_name: account.display_name,
            account_mask: account.last4,
            account_type: account.subcategory,
            status: 'active',
            created_at: new Date().toISOString()
          };
          
          await kv.set(`bank_connection:${sessionInfo.businessId}:${account.id}`, connectionData);
        }
        break;

      case 'financial_connections.account.disconnected':
        // Mark account as disconnected
        const disconnectedAccount = event.data.object;
        const allConnections = await kv.getByPrefix('bank_connection:');
        const existingConnection = allConnections.find((conn: any) => conn.account_id === disconnectedAccount.id);
        
        if (existingConnection) {
          existingConnection.status = 'disconnected';
          await kv.set(`bank_connection:${existingConnection.business_id}:${disconnectedAccount.id}`, existingConnection);
        }
        break;

      default:
        // Unhandled webhook event type
        break;
    }

    return c.json({ received: true });

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Helper function to categorize transactions
function categorizeTransaction(stripeTx: any): string {
  const description = (stripeTx.description || '').toLowerCase();
  
  // Simple categorization based on merchant/description
  if (description.includes('payroll') || description.includes('salary')) {
    return 'Payroll';
  } else if (description.includes('rent') || description.includes('lease')) {
    return 'Rent/Lease';
  } else if (description.includes('utility') || description.includes('electric') || description.includes('water')) {
    return 'Utilities';
  } else if (description.includes('software') || description.includes('subscription') || description.includes('saas')) {
    return 'Software/SaaS';
  } else if (description.includes('advertising') || description.includes('marketing') || description.includes('ad')) {
    return 'Marketing';
  } else if (description.includes('office') || description.includes('supply')) {
    return 'Office Supplies';
  } else if (description.includes('travel') || description.includes('hotel') || description.includes('flight')) {
    return 'Travel';
  } else if (stripeTx.amount < 0) {
    return 'Business Expense';
  } else {
    return 'Revenue';
  }
}

export default app;
