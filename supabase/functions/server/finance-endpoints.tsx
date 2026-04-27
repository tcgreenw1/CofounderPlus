import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from "jsr:@supabase/supabase-js@2";

export function addFinanceEndpoints(app: any, verifyUserAccess: any) {
  console.log('💰 Adding Finance endpoints...');

  // Get all finance data for a business
  app.get('/make-server-373d8b09/finance/data', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      console.log(`💰 Getting finance data for user ${user.id}, business ${businessId}`);

      // Get finance data from KV store using correct key format with userId
      // All transactions (manual and Plaid) are stored with transaction: prefix
      const transactionsRaw = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      const invoicesRaw = await kv.getByPrefix(`invoice:${user.id}:${businessId}:`) || [];
      const budgetsRaw = await kv.getByPrefix(`budget:${user.id}:${businessId}:`) || [];
      
      // Parse the data
      const transactions = transactionsRaw.map((t: any) => typeof t === 'string' ? JSON.parse(t) : t);
      const invoices = invoicesRaw.map((i: any) => typeof i === 'string' ? JSON.parse(i) : i);
      const budgets = budgetsRaw.map((b: any) => typeof b === 'string' ? JSON.parse(b) : b);
      
      // Get or initialize bank balance
      let bankBalance = await kv.get(`bank_balance:${user.id}:${businessId}`);
      if (!bankBalance) {
        // Initialize bank balance to 0 for new businesses
        bankBalance = {
          balance: 0,
          currency: 'USD',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        await kv.set(`bank_balance:${user.id}:${businessId}`, bankBalance);
      }

      return c.json({
        transactions,
        invoices,
        budgets,
        bankBalance,
        businessInfo: {}
      });

    } catch (error: any) {
      console.error('Finance data error:', error);
      return c.json({ error: `Error getting finance data: ${error.message}` }, 500);
    }
  });

  // Helper function to update bank balance
  const updateBankBalance = async (userId: string, businessId: string, transactionType: 'income' | 'expense', amount: number, operation: 'add' | 'subtract' = 'add') => {
    try {
      let bankBalance = await kv.get(`bank_balance:${userId}:${businessId}`);
      if (!bankBalance) {
        bankBalance = {
          balance: 0,
          currency: 'USD',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      }

      let balanceChange = 0;
      if (operation === 'add') {
        if (transactionType === 'income' || transactionType === 'revenue') {
          balanceChange = amount;
        } else if (transactionType === 'expense') {
          balanceChange = -amount;
        }
      } else {
        if (transactionType === 'income' || transactionType === 'revenue') {
          balanceChange = -amount;
        } else if (transactionType === 'expense') {
          balanceChange = amount;
        }
      }

      bankBalance.balance += balanceChange;
      bankBalance.last_updated = new Date().toISOString();

      await kv.set(`bank_balance:${userId}:${businessId}`, bankBalance);
      
      return bankBalance;
    } catch (error) {
      console.error('Error updating bank balance:', error);
      throw error;
    }
  };

  // TRANSACTION ENDPOINTS
  app.post('/make-server-373d8b09/finance/transactions', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const transactionData = await c.req.json();
      const transactionId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const today = new Date().toISOString().split('T')[0];
      const transactionDate = transactionData.date || today;
      
      const transaction = {
        ...transactionData,
        id: transactionId,
        date: transactionDate,
        status: transactionData.status || 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, transaction);

      // Update bank balance if transaction is completed
      if (transaction.status === 'completed') {
        await updateBankBalance(user.id, businessId, transaction.type, Number(transaction.amount) || 0, 'add');
      }
      
      return c.json({ transaction });

    } catch (error: any) {
      console.error('Create transaction error:', error);
      return c.json({ error: `Error creating transaction: ${error.message}` }, 500);
    }
  });

  app.put('/make-server-373d8b09/finance/transactions/:id', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      const transactionId = c.req.param('id');

      if (!businessId || !transactionId) {
        return c.json({ error: 'Business ID and Transaction ID are required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const existingTransaction = await kv.get(`transaction:${user.id}:${businessId}:${transactionId}`);
      if (!existingTransaction) {
        return c.json({ error: 'Transaction not found' }, 404);
      }

      const updateData = await c.req.json();
      
      // Handle bank balance updates
      const wasCompleted = (existingTransaction.status || 'completed') === 'completed';
      const willBeCompleted = (updateData.status || existingTransaction.status || 'completed') === 'completed';
      
      const oldAmount = Number(existingTransaction.amount) || 0;
      const newAmount = Number(updateData.amount ?? existingTransaction.amount) || 0;
      const oldType = existingTransaction.type;
      const newType = updateData.type ?? existingTransaction.type;

      // Reverse old transaction if it was completed
      if (wasCompleted) {
        await updateBankBalance(user.id, businessId, oldType, oldAmount, 'subtract');
      }

      const updatedTransaction = {
        ...existingTransaction,
        ...updateData,
        id: transactionId,
        updated_at: new Date().toISOString()
      };

      // Apply new transaction if it should be completed
      if (willBeCompleted) {
        await updateBankBalance(user.id, businessId, newType, newAmount, 'add');
      }

      await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, updatedTransaction);
      
      return c.json({ transaction: updatedTransaction });

    } catch (error: any) {
      console.error('Update transaction error:', error);
      return c.json({ error: `Error updating transaction: ${error.message}` }, 500);
    }
  });

  app.delete('/make-server-373d8b09/finance/transactions/:id', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      const transactionId = c.req.param('id');

      if (!businessId || !transactionId) {
        return c.json({ error: 'Business ID and Transaction ID are required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const existingTransaction = await kv.get(`transaction:${user.id}:${businessId}:${transactionId}`);
      if (!existingTransaction) {
        return c.json({ error: 'Transaction not found' }, 404);
      }

      // Update bank balance by reversing the transaction if it was completed
      if ((existingTransaction.status || 'completed') === 'completed') {
        await updateBankBalance(user.id, businessId, existingTransaction.type, Number(existingTransaction.amount) || 0, 'subtract');
      }

      await kv.del(`transaction:${user.id}:${businessId}:${transactionId}`);
      
      return c.json({ 
        success: true, 
        message: 'Transaction deleted successfully',
        deletedTransaction: existingTransaction
      });

    } catch (error: any) {
      console.error('Delete transaction error:', error);
      return c.json({ error: `Error deleting transaction: ${error.message}` }, 500);
    }
  });

  // INVOICE ENDPOINTS
  app.post('/make-server-373d8b09/finance/invoices', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const invoiceData = await c.req.json();
      const invoiceId = `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const invoice = {
        ...invoiceData,
        id: invoiceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`invoice:${user.id}:${businessId}:${invoiceId}`, invoice);
      
      return c.json({ invoice });

    } catch (error: any) {
      console.error('Create invoice error:', error);
      return c.json({ error: `Error creating invoice: ${error.message}` }, 500);
    }
  });

  app.put('/make-server-373d8b09/finance/invoices/:id', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      const invoiceId = c.req.param('id');

      if (!businessId || !invoiceId) {
        return c.json({ error: 'Business ID and Invoice ID are required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const existingInvoice = await kv.get(`invoice:${user.id}:${businessId}:${invoiceId}`);
      if (!existingInvoice) {
        return c.json({ error: 'Invoice not found' }, 404);
      }

      const updateData = await c.req.json();
      
      const updatedInvoice = {
        ...existingInvoice,
        ...updateData,
        id: invoiceId,
        updated_at: new Date().toISOString()
      };

      await kv.set(`invoice:${user.id}:${businessId}:${invoiceId}`, updatedInvoice);
      
      return c.json({ invoice: updatedInvoice });

    } catch (error: any) {
      console.error('Update invoice error:', error);
      return c.json({ error: `Error updating invoice: ${error.message}` }, 500);
    }
  });

  app.delete('/make-server-373d8b09/finance/invoices/:id', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      const invoiceId = c.req.param('id');

      if (!businessId || !invoiceId) {
        return c.json({ error: 'Business ID and Invoice ID are required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const existingInvoice = await kv.get(`invoice:${user.id}:${businessId}:${invoiceId}`);
      if (!existingInvoice) {
        return c.json({ error: 'Invoice not found' }, 404);
      }

      await kv.del(`invoice:${user.id}:${businessId}:${invoiceId}`);
      
      return c.json({ success: true, message: 'Invoice deleted successfully' });

    } catch (error: any) {
      console.error('Delete invoice error:', error);
      return c.json({ error: `Error deleting invoice: ${error.message}` }, 500);
    }
  });

  // BUDGET ENDPOINTS
  app.post('/make-server-373d8b09/finance/budgets', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const budgetData = await c.req.json();
      const budgetId = `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const budget = {
        ...budgetData,
        id: budgetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`budget:${user.id}:${businessId}:${budgetId}`, budget);
      
      return c.json({ budget });

    } catch (error: any) {
      console.error('Create budget error:', error);
      return c.json({ error: `Error creating budget: ${error.message}` }, 500);
    }
  });

  app.put('/make-server-373d8b09/finance/budgets/:id', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      const budgetId = c.req.param('id');

      if (!businessId || !budgetId) {
        return c.json({ error: 'Business ID and Budget ID are required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const existingBudget = await kv.get(`budget:${user.id}:${businessId}:${budgetId}`);
      if (!existingBudget) {
        return c.json({ error: 'Budget not found' }, 404);
      }

      const updateData = await c.req.json();
      
      const updatedBudget = {
        ...existingBudget,
        ...updateData,
        id: budgetId,
        updated_at: new Date().toISOString()
      };

      await kv.set(`budget:${user.id}:${businessId}:${budgetId}`, updatedBudget);
      
      return c.json({ budget: updatedBudget });

    } catch (error: any) {
      console.error('Update budget error:', error);
      return c.json({ error: `Error updating budget: ${error.message}` }, 500);
    }
  });

  app.delete('/make-server-373d8b09/finance/budgets/:id', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      const budgetId = c.req.param('id');

      if (!businessId || !budgetId) {
        return c.json({ error: 'Business ID and Budget ID are required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const existingBudget = await kv.get(`budget:${user.id}:${businessId}:${budgetId}`);
      if (!existingBudget) {
        return c.json({ error: 'Budget not found' }, 404);
      }

      await kv.del(`budget:${user.id}:${businessId}:${budgetId}`);
      
      return c.json({ success: true, message: 'Budget deleted successfully' });

    } catch (error: any) {
      console.error('Delete budget error:', error);
      return c.json({ error: `Error deleting budget: ${error.message}` }, 500);
    }
  });

  // Bank balance endpoints
  app.get('/make-server-373d8b09/finance/bank-balance', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      let bankBalance = await kv.get(`bank_balance:${user.id}:${businessId}`);
      if (!bankBalance) {
        bankBalance = {
          balance: 0,
          currency: 'USD',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        await kv.set(`bank_balance:${user.id}:${businessId}`, bankBalance);
      }

      return c.json({ bankBalance });

    } catch (error: any) {
      console.error('Get bank balance error:', error);
      return c.json({ error: `Error getting bank balance: ${error.message}` }, 500);
    }
  });

  app.put('/make-server-373d8b09/finance/bank-balance', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const { balance } = await c.req.json();
      
      const bankBalance = {
        balance: Number(balance) || 0,
        currency: 'USD',
        last_updated: new Date().toISOString(),
        manually_set: true,
        created_at: new Date().toISOString()
      };

      await kv.set(`bank_balance:${user.id}:${businessId}`, bankBalance);
      
      return c.json({ bankBalance });

    } catch (error: any) {
      console.error('Update bank balance error:', error);
      return c.json({ error: `Error updating bank balance: ${error.message}` }, 500);
    }
  });

  // POST endpoint for setting bank balance (used by balance calculator)
  app.post('/make-server-373d8b09/finance/set-bank-balance', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      const { balance } = await c.req.json();
      
      console.log(`🏦 Setting bank balance for user ${user.id}, business ${businessId}: $${balance}`);
      
      const bankBalance = {
        balance: Number(balance) || 0,
        currency: 'USD',
        last_updated: new Date().toISOString(),
        manually_set: true,
        created_at: new Date().toISOString()
      };

      await kv.set(`bank_balance:${user.id}:${businessId}`, bankBalance);
      
      console.log('✅ Bank balance updated successfully:', bankBalance);
      
      return c.json({ bankBalance });

    } catch (error: any) {
      console.error('Set bank balance error:', error);
      return c.json({ error: `Error setting bank balance: ${error.message}` }, 500);
    }
  });

  // AGI categorization endpoint
  app.post('/make-server-373d8b09/finance/categorize-with-agi', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      console.log(`🤖 AGI Categorization started for user ${user.id}, business ${businessId}`);

      // Get all transactions - both manual and Plaid are stored with transaction: prefix
      const allTransactionsRaw = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      
      const allTransactions = allTransactionsRaw.map((t: any) => typeof t === 'string' ? JSON.parse(t) : t);
      
      // Count Plaid vs manual for logging
      const plaidCount = allTransactions.filter((t: any) => t.plaid_transaction_id || t.imported_from_bank).length;
      const manualCount = allTransactions.length - plaidCount;
      
      console.log(`📊 Total transactions found: ${allTransactions.length} (${manualCount} manual + ${plaidCount} from Plaid)`);
      
      // Debug: Log sample transaction categories
      if (allTransactions.length > 0) {
        const sampleCategories = allTransactions.slice(0, 5).map(t => ({ 
          id: t.id, 
          category: t.category, 
          description: t.description?.substring(0, 30),
          isPlaid: !!t.plaid_transaction_id
        }));
        console.log('📝 Sample transaction categories:', JSON.stringify(sampleCategories, null, 2));
      }
      
      // Filter out already categorized transactions (skip transactions that already have a category set)
      // Only process transactions with no category, empty category, or "Uncategorized"
      const uncategorized = allTransactions.filter(t => 
        !t.category || 
        t.category === '' || 
        t.category === 'Uncategorized' ||
        t.category.toLowerCase() === 'uncategorized'
      );
      
      console.log(`📊 Found ${uncategorized.length} uncategorized transactions (${allTransactions.length - uncategorized.length} already categorized)`);
      
      // Process up to 300 transactions per batch
      const toProcess = uncategorized.slice(0, 300);

      if (toProcess.length === 0) {
        console.log(`✅ All transactions are already categorized! Total transactions: ${allTransactions.length}`);
        return c.json({ 
          success: true,
          message: 'All transactions are already categorized',
          processed: 0,
          skipped: allTransactions.length,
          cost: 0
        });
      }

      console.log(`🚀 Processing ${toProcess.length} uncategorized transactions (${uncategorized.length - toProcess.length} remaining for next batch)`);

      // IRS Schedule C Categories for Tax Purposes
      const incomeCategories = [
        'Gross Receipts or Sales',
        'Returns and Allowances',
        'Other Income'
      ];
      
      const expenseCategories = [
        'Advertising',
        'Car and Truck Expenses',
        'Commissions and Fees',
        'Contract Labor',
        'Depletion',
        'Depreciation',
        'Employee Benefits',
        'Insurance (Other than Health)',
        'Interest (Mortgage)',
        'Interest (Other)',
        'Legal and Professional Services',
        'Office Expense',
        'Pension and Profit-Sharing Plans',
        'Rent or Lease (Vehicles)',
        'Rent or Lease (Equipment)',
        'Rent or Lease (Property)',
        'Repairs and Maintenance',
        'Supplies',
        'Taxes and Licenses',
        'Travel',
        'Meals',
        'Utilities',
        'Wages',
        'Other Expenses'
      ];

      // Call OpenAI to categorize
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        return c.json({ error: 'OpenAI API key not configured' }, 500);
      }

      // Prepare batch request to OpenAI
      const transactionDescriptions = toProcess.map((t: any, idx: number) => {
        return `${idx + 1}. Type: ${t.type}, Description: "${t.description}", Amount: $${t.amount}`;
      }).join('\n');

      const systemPrompt = `You are a financial categorization expert specializing in IRS Schedule C tax categories. Categorize each transaction into the most appropriate IRS tax category based on its type, description, and amount.

Income categories (IRS Schedule C, Part I - Income): ${incomeCategories.join(', ')}
Expense categories (IRS Schedule C, Part II - Expenses): ${expenseCategories.join(', ')}

CRITICAL: Return ONLY a raw JSON array. Do NOT wrap it in markdown code blocks or any other formatting.
Format: [{"index": 1, "category": "CategoryName"}, {"index": 2, "category": "CategoryName"}, ...]

Rules for Tax Categorization:
- Use the exact IRS Schedule C category names provided above
- Match based on transaction type (income/expense) and consider IRS tax rules
- For income: Use "Gross Receipts or Sales" for product/service sales, "Returns and Allowances" for refunds, "Other Income" for miscellaneous income
- For expenses, match the transaction description to the most appropriate IRS expense category
- Default to "Other Income" for income or "Other Expenses" for expenses if the category is unclear
- These categories are used for IRS tax filing, so accuracy is critical
- Return ONLY the JSON array, nothing else`;

      const userPrompt = `Categorize these transactions:

${transactionDescriptions}`;

      console.log('🔮 Calling OpenAI API...');

      const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5.1',
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_output_tokens: 2000
        })
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        return c.json({ error: 'Failed to categorize with AI' }, 500);
      }

      const openaiData = await openaiResponse.json();
      
      // Extract JSON from the response (strip markdown code blocks if present)
      let rawContent =
        openaiData.output_text ??
        openaiData?.output?.[0]?.content?.[0]?.text ??
        "";
      console.log('📝 Raw OpenAI response (first 200 chars):', rawContent.substring(0, 200));
      
      let categorizations;
      try {
        categorizations = JSON.parse(rawContent);
      } catch (parseError: any) {
        console.error('❌ JSON parse error:', parseError.message);
        console.error('📝 Cleaned content:', rawContent.substring(0, 500));
        return c.json({ 
          error: 'Failed to parse AI response. Please try again.',
          details: parseError.message 
        }, 500);
      }

      console.log('✅ Received categorizations from OpenAI:', categorizations.length, 'transactions');

      // Calculate cost
      const promptTokens = openaiData.usage.prompt_tokens;
      const completionTokens = openaiData.usage.completion_tokens;
      // GPT-5.1 pricing: $5.00 per 1M input tokens, $15.00 per 1M output tokens
      const inputCost = (promptTokens / 1000000) * 5.00;
      const outputCost = (completionTokens / 1000000) * 15.00;
      const totalCost = inputCost + outputCost;

      console.log(`💰 API Cost: $${totalCost.toFixed(4)} (${promptTokens} input + ${completionTokens} output tokens)`);

      // Update transactions with categories
      let updatedCount = 0;
      for (const categorization of categorizations) {
        const idx = categorization.index - 1;
        if (idx >= 0 && idx < toProcess.length) {
          const transaction = toProcess[idx];
          transaction.category = categorization.category;
          transaction.updated_at = new Date().toISOString();
          transaction.agi_categorized = true; // Mark as AGI categorized
          
          // All transactions (manual and Plaid) use the same transaction: prefix
          await kv.set(`transaction:${user.id}:${businessId}:${transaction.id}`, transaction);
          updatedCount++;
          
          console.log(`✅ Updated transaction:${user.id}:${businessId}:${transaction.id} with category: ${categorization.category}`);
        }
      }

      console.log(`✅ Successfully categorized ${updatedCount} transactions`);

      const remainingUncategorized = uncategorized.length - toProcess.length;

      return c.json({
        success: true,
        processed: updatedCount,
        remaining: remainingUncategorized,
        totalTransactions: allTransactions.length,
        alreadyCategorized: allTransactions.length - uncategorized.length,
        cost: totalCost,
        details: {
          promptTokens,
          completionTokens,
          totalTokens: openaiData.usage.total_tokens
        }
      });

    } catch (error: any) {
      console.error('AGI categorization error:', error);
      return c.json({ error: `Error categorizing transactions: ${error.message}` }, 500);
    }
  });

  // Cofounder Finance categorization endpoint (with credit deduction)
  app.post('/make-server-373d8b09/finance/categorize-with-cofounder', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      console.log(`💼 Cofounder Finance Categorization started for user ${user.id}, business ${businessId}`);

      // Get all transactions - both manual and Plaid are stored with transaction: prefix
      const allTransactionsRaw = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      
      const allTransactions = allTransactionsRaw.map((t: any) => typeof t === 'string' ? JSON.parse(t) : t);
      
      // Count Plaid vs manual for logging
      const plaidCount = allTransactions.filter((t: any) => t.plaid_transaction_id || t.imported_from_bank).length;
      const manualCount = allTransactions.length - plaidCount;
      
      console.log(`📊 Total transactions found: ${allTransactions.length} (${manualCount} manual + ${plaidCount} from Plaid)`);
      
      // Filter out transactions that have already been categorized by Cofounder Finance
      // Only process transactions with no category AND haven't been processed by Cofounder Finance yet
      const uncategorized = allTransactions.filter(t => 
        (!t.category || 
        t.category === '' || 
        t.category === 'Uncategorized' ||
        t.category.toLowerCase() === 'uncategorized') &&
        !t.cofounder_finance_categorized
      );
      
      console.log(`📊 Found ${uncategorized.length} uncategorized transactions not yet processed by Cofounder Finance`);
      
      // Process up to 300 transactions per batch
      const toProcess = uncategorized.slice(0, 300);

      if (toProcess.length === 0) {
        console.log(`✅ All transactions have been categorized by Cofounder Finance! Total transactions: ${allTransactions.length}`);
        return c.json({ 
          success: true,
          message: 'All transactions have been categorized with Cofounder Finance',
          processed: 0,
          remaining: 0,
          alreadyCategorized: allTransactions.length
        });
      }

      // Check user credits
      const userCreditsValue = await kv.get(`credits:${user.id}`);
      const userCredits = userCreditsValue ? (typeof userCreditsValue === 'number' ? userCreditsValue : parseInt(userCreditsValue as string)) : 0;
      
      if (userCredits < 10) {
        return c.json({ 
          error: 'Insufficient credits. You need 10 credits to categorize transactions.',
          creditsNeeded: 10,
          creditsAvailable: userCredits
        }, 402);
      }

      console.log(`🚀 Processing ${toProcess.length} uncategorized transactions (${uncategorized.length - toProcess.length} remaining for next batch)`);

      // IRS Schedule C Categories for Tax Purposes
      const incomeCategories = [
        'Gross Receipts or Sales',
        'Returns and Allowances',
        'Other Income'
      ];
      
      const expenseCategories = [
        'Advertising',
        'Car and Truck Expenses',
        'Commissions and Fees',
        'Contract Labor',
        'Depletion',
        'Depreciation',
        'Employee Benefits',
        'Insurance (Other than Health)',
        'Interest (Mortgage)',
        'Interest (Other)',
        'Legal and Professional Services',
        'Office Expense',
        'Pension and Profit-Sharing Plans',
        'Rent or Lease (Vehicles)',
        'Rent or Lease (Equipment)',
        'Rent or Lease (Property)',
        'Repairs and Maintenance',
        'Supplies',
        'Taxes and Licenses',
        'Travel',
        'Meals',
        'Utilities',
        'Wages',
        'Other Expenses'
      ];

      // Call OpenAI to categorize
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        return c.json({ error: 'OpenAI API key not configured' }, 500);
      }

      // Prepare batch request to OpenAI
      const transactionDescriptions = toProcess.map((t: any, idx: number) => {
        return `${idx + 1}. Type: ${t.type}, Description: "${t.description}", Amount: $${t.amount}`;
      }).join('\n');

      const systemPrompt = `You are a financial categorization expert specializing in IRS Schedule C tax categories. Categorize each transaction into the most appropriate IRS tax category based on its type, description, and amount.

Income categories (IRS Schedule C, Part I - Income): ${incomeCategories.join(', ')}
Expense categories (IRS Schedule C, Part II - Expenses): ${expenseCategories.join(', ')}

CRITICAL: Return a JSON object with a "categorizations" key containing an array of ALL transaction categorizations.
Format: {"categorizations": [{"index": 1, "category": "CategoryName"}, {"index": 2, "category": "CategoryName"}, ...]}

Rules for Tax Categorization:
- Use the exact IRS Schedule C category names provided above
- Match based on transaction type (income/expense) and consider IRS tax rules
- For income: Use "Gross Receipts or Sales" for product/service sales, "Returns and Allowances" for refunds, "Other Income" for miscellaneous income
- For expenses, match the transaction description to the most appropriate IRS expense category
- Default to "Other Income" for income or "Other Expenses" for expenses if the category is unclear
- These categories are used for IRS tax filing, so accuracy is critical
- You MUST categorize ALL transactions provided - do not skip any
- Return valid JSON only`;

      const userPrompt = `Categorize ALL ${toProcess.length} of these transactions:

${transactionDescriptions}`;

      console.log('🔮 Calling OpenAI API...');

      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        return c.json({ error: 'Failed to categorize with AI' }, 500);
      }

      const openaiData = await openaiResponse.json();
      
      // Extract JSON from the response (correct format for chat completions)
      let rawContent = openaiData.choices?.[0]?.message?.content ?? "";
      console.log('📝 Raw OpenAI response (first 200 chars):', rawContent.substring(0, 200));
      
      let categorizations;
      try {
        const parsed = JSON.parse(rawContent);
        // Handle both array format and object format with categorizations key
        categorizations = Array.isArray(parsed) ? parsed : (parsed.categorizations || []);
      } catch (parseError: any) {
        console.error('❌ JSON parse error:', parseError.message);
        console.error('❌ Raw content that failed to parse:', rawContent);
        return c.json({ 
          error: 'Failed to parse AI response. Please try again.',
          details: parseError.message 
        }, 500);
      }

      console.log('✅ Received categorizations from OpenAI:', categorizations.length, 'transactions (expected:', toProcess.length, ')');
      
      if (categorizations.length !== toProcess.length) {
        console.warn(`⚠️ WARNING: OpenAI returned ${categorizations.length} categorizations but we sent ${toProcess.length} transactions!`);
      }

      // Update transactions with categories and mark as Cofounder Finance categorized
      let updatedCount = 0;
      const skippedIndexes = [];
      
      for (const categorization of categorizations) {
        const idx = categorization.index - 1;
        if (idx >= 0 && idx < toProcess.length) {
          const transaction = toProcess[idx];
          transaction.category = categorization.category;
          transaction.updated_at = new Date().toISOString();
          transaction.cofounder_finance_categorized = true; // Mark as Cofounder Finance categorized
          transaction.categorized_date = new Date().toISOString();
          
          // All transactions (manual and Plaid) use the same transaction: prefix
          await kv.set(`transaction:${user.id}:${businessId}:${transaction.id}`, transaction);
          updatedCount++;
          
          console.log(`✅ [${updatedCount}/${toProcess.length}] Updated transaction:${user.id}:${businessId}:${transaction.id} with category: ${categorization.category}`);
        } else {
          skippedIndexes.push(categorization.index);
          console.warn(`⚠️ Skipped invalid index ${categorization.index} (out of range 1-${toProcess.length})`);
        }
      }
      
      if (skippedIndexes.length > 0) {
        console.warn(`⚠️ Skipped ${skippedIndexes.length} invalid indexes: ${skippedIndexes.join(', ')}`);
      }

      console.log(`✅ Successfully categorized ${updatedCount} of ${toProcess.length} transactions with Cofounder Finance`);

      // Deduct 10 credits from user
      const newCredits = userCredits - 10;
      await kv.set(`credits:${user.id}`, newCredits);
      console.log(`💳 Deducted 10 credits from user ${user.id}. Remaining credits: ${newCredits}`);

      const remainingUncategorized = uncategorized.length - toProcess.length;

      return c.json({
        success: true,
        processed: updatedCount,
        remaining: remainingUncategorized,
        totalTransactions: allTransactions.length,
        alreadyCategorized: allTransactions.filter((t: any) => t.cofounder_finance_categorized).length,
        creditsRemaining: newCredits
      });

    } catch (error: any) {
      console.error('Cofounder Finance categorization error:', error);
      return c.json({ error: `Error categorizing transactions: ${error.message}` }, 500);
    }
  });

  // Process receipt with AI image recognition
  app.post('/make-server-373d8b09/finance/process-receipt', async (c: any) => {
    console.log('📸 Receipt processing endpoint called');
    
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      const body = await c.req.json();
      const { image, fileName } = body;
      
      if (!image) {
        return c.json({ error: 'Receipt image is required' }, 400);
      }

      console.log(`📸 Processing receipt for user ${user.id}, business ${businessId}`);

      // Get OpenAI API key
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return c.json({ error: 'OpenAI API key not configured' }, 500);
      }

      // Call OpenAI Vision API to extract receipt data
      const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-5.1',
          input: [
            {
              role: 'system',
              content: `You are a receipt data extraction assistant. Extract transaction information from receipt images and return it as JSON.
              
Return ONLY a valid JSON object with this structure:
{
  "transactions": [
    {
      "description": "string (merchant name or main item)",
      "amount": number (total amount),
      "date": "YYYY-MM-DD",
      "category": "string (pick from: Food & Dining, Transportation, Shopping, Groceries, Entertainment, Healthcare, Utilities, Office Supplies, Travel, Professional Services, Marketing, Software & Subscriptions, Equipment, Rent, Insurance, Taxes, Payroll, Other)",
      "subcategory": "string (optional, more specific category)",
      "payment_method": "string (Credit Card, Debit Card, Cash, etc.)",
      "notes": "string (any additional details from receipt)"
    }
  ],
  "merchant": "string (store/business name)",
  "total": number,
  "tax": number (if shown),
  "confidence": number (0-1, your confidence in the extraction)
}

If you can't extract data, return: { "error": "Unable to read receipt", "confidence": 0 }`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all transaction information from this receipt. Return the data as JSON.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ],
          max_output_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API error:', errorData);
        return c.json({ error: 'Failed to process receipt with AI' }, 500);
      }

      const openaiData = await openaiResponse.json();
      
      const extractedText =
        openaiData.output_text ??
        openaiData?.output?.[0]?.content?.[0]?.text ??
        null;
      
      if (!extractedText) {
        return c.json({ error: 'No data extracted from receipt' }, 400);
      }

      console.log('🤖 OpenAI extracted:', extractedText);

      // Parse the JSON response
      let receiptData;
      try {
        // Remove markdown code blocks if present
        const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        receiptData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return c.json({ error: 'Failed to parse receipt data', details: extractedText }, 400);
      }

      if (receiptData.error || !receiptData.transactions || receiptData.transactions.length === 0) {
        return c.json({ error: receiptData.error || 'No transactions found in receipt' }, 400);
      }

      // Create transactions from extracted data
      const createdTransactions = [];
      for (const txn of receiptData.transactions) {
        const transactionId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const transaction = {
          id: transactionId,
          type: 'expense', // Receipts are typically expenses
          amount: txn.amount || receiptData.total || 0,
          description: txn.description || receiptData.merchant || 'Receipt Transaction',
          category: txn.category || 'Other',
          subcategory: txn.subcategory || null,
          date: txn.date || new Date().toISOString().split('T')[0],
          status: 'completed',
          payment_method: txn.payment_method || 'Unknown',
          notes: txn.notes ? `${txn.notes} (Auto-imported from receipt: ${fileName})` : `Auto-imported from receipt: ${fileName}`,
          tags: ['receipt-upload', 'ai-processed'],
          created_at: new Date().toISOString(),
          is_future_transaction: false
        };

        await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, transaction);
        createdTransactions.push(transaction);
      }

      // Update bank balance
      const balanceKey = `bank_balance:${user.id}:${businessId}`;
      let bankBalance = await kv.get(balanceKey) || { balance: 0, currency: 'USD' };
      
      const totalAmount = createdTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      bankBalance.balance -= totalAmount; // Subtract expenses
      bankBalance.last_updated = new Date().toISOString();
      await kv.set(balanceKey, bankBalance);

      console.log(`✅ Created ${createdTransactions.length} transactions from receipt`);

      // Fixed credit cost for receipt processing
      const tokensUsed = openaiData.usage?.total_tokens || 500;
      const creditsCost = 20; // Fixed cost: 20 credits per receipt

      return c.json({
        success: true,
        transactionsCreated: createdTransactions.length,
        transactions: createdTransactions,
        merchant: receiptData.merchant,
        total: receiptData.total,
        confidence: receiptData.confidence,
        creditsCost: creditsCost,
        tokensUsed: tokensUsed
      });

    } catch (error) {
      console.error('📸 Receipt processing error:', error);
      return c.json({ error: error.message || 'Failed to process receipt' }, 500);
    }
  });

  // Upload receipt for background processing
  app.post('/make-server-373d8b09/finance/upload-receipt', async (c: any) => {
    console.log('📤 Receipt upload endpoint called');
    
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const body = await c.req.json();
      const { businessId, image, fileName, fileSize, fileType } = body;
      
      if (!businessId || !image || !fileName) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
      if (!validTypes.includes(fileType)) {
        return c.json({ error: 'Invalid file type' }, 400);
      }

      // Create receipt job
      const receiptId = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const receiptJob = {
        id: receiptId,
        businessId,
        userId: user.id,
        fileName,
        fileSize,
        fileType,
        imageData: image, // Store temporarily for processing
        status: 'processing',
        uploadedAt: new Date().toISOString()
      };

      // Store receipt job
      await kv.set(`receipt:${user.id}:${businessId}:${receiptId}`, receiptJob);

      // Process asynchronously (don't await)
      processReceiptBackground(receiptId, user.id, businessId, image, fileName).catch(error => {
        console.error(`Background processing error for receipt ${receiptId}:`, error);
      });

      return c.json({
        success: true,
        receiptId,
        message: 'Receipt uploaded and queued for processing'
      });

    } catch (error) {
      console.error('📤 Receipt upload error:', error);
      return c.json({ error: error.message || 'Failed to upload receipt' }, 500);
    }
  });

  // Get receipts for a business
  app.get('/make-server-373d8b09/finance/receipts', async (c: any) => {
    console.log('📋 Get receipts endpoint called');
    
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      
      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get all receipts for this business
      const receipts = await kv.getByPrefix(`receipt:${user.id}:${businessId}:`);
      
      // Remove imageData from response to reduce payload size
      const cleanedReceipts = receipts.map(receipt => {
        const { imageData, ...rest } = receipt;
        return rest;
      });

      // Sort by uploadedAt descending
      cleanedReceipts.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      return c.json({
        success: true,
        receipts: cleanedReceipts
      });

    } catch (error) {
      console.error('📋 Get receipts error:', error);
      return c.json({ error: error.message || 'Failed to get receipts' }, 500);
    }
  });

  // Delete receipt
  app.delete('/make-server-373d8b09/finance/receipts/:receiptId', async (c: any) => {
    console.log('🗑️ Delete receipt endpoint called');
    
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const receiptId = c.req.param('receiptId');
      const businessId = c.req.query('businessId');
      
      if (!businessId || !receiptId) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      // Delete receipt
      await kv.del(`receipt:${user.id}:${businessId}:${receiptId}`);

      return c.json({
        success: true,
        message: 'Receipt deleted'
      });

    } catch (error) {
      console.error('🗑️ Delete receipt error:', error);
      return c.json({ error: error.message || 'Failed to delete receipt' }, 500);
    }
  });

  // Generate AI report for quick actions
  app.post('/make-server-373d8b09/finance/generate-report', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const body = await c.req.json();
      const { businessId, title, category, data } = body;

      if (!businessId || !title || !data) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      console.log(`📊 Generating AI report for ${title}`);
      console.log(`📊 Report data size: ${JSON.stringify(data).length} characters`);

      // Send "report started" notification
      const startNotificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startNotification = {
        id: startNotificationId,
        type: 'cofounder_notification',
        businessId,
        title: 'Financial Report Started',
        message: `Your "${title}" report is being generated...`,
        priority: 'normal',
        category: 'finance',
        status: 'unread',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Save start notification
      const notificationsKey = `user_notifications:${user.id}`;
      const existingNotifications = await kv.get(notificationsKey) || [];
      const notificationsList = Array.isArray(existingNotifications) ? existingNotifications : 
        (typeof existingNotifications === 'string' ? JSON.parse(existingNotifications) : []);
      notificationsList.unshift(startNotification);
      await kv.set(notificationsKey, notificationsList);

      // Get OpenAI API key
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return c.json({ error: 'AI service not configured' }, 500);
      }

      // Create prompt for GPT-4o based on the action type
      const prompt = `You are a financial analyst creating an executive summary for a business report titled "${title}". 
      
Here is the financial data:
${JSON.stringify(data, null, 2)}

Create a concise, professional 2-3 paragraph executive summary that:
1. Highlights the key findings and most important metrics
2. Provides actionable insights and recommendations
3. Uses clear, business-friendly language (avoid jargon)
4. Focuses on what the business owner needs to know

Keep it under 200 words and make it practical and actionable.`;

      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_completion_tokens: 500,
          temperature: 0.7
        })
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error response:', errorText);
        console.error('OpenAI API status:', openaiResponse.status);
        
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
          console.error('OpenAI API error details:', JSON.stringify(errorDetails, null, 2));
        } catch {
          errorDetails = { error: errorText };
        }
        
        throw new Error(`Failed to generate AI summary: ${openaiResponse.status} - ${errorDetails.error?.message || errorText}`);
      }

      const openaiResult = await openaiResponse.json();
      const aiSummary = openaiResult.choices[0].message.content;
      console.log(`✅ Successfully generated AI summary (${aiSummary.length} characters)`);

      // Deduct credits after successful generation (10 credits)
      const creditsKey = `credits:${user.id}`;
      const currentCredits = await kv.get(creditsKey) || 0;
      const newBalance = currentCredits - 10;
      await kv.set(creditsKey, newBalance);
      console.log(`💎 Deducted 10 credits for Finance report. New balance: ${newBalance}`);

      // Save report to KV store
      const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const report = {
        id: reportId,
        title,
        category,
        aiSummary,
        data,
        createdAt: new Date().toISOString()
      };

      await kv.set(`report:${user.id}:${businessId}:${reportId}`, report);

      // Send "report completed" notification
      const completeNotificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const completeNotification = {
        id: completeNotificationId,
        type: 'cofounder_notification',
        businessId,
        title: 'Financial Report Ready',
        message: `Your "${title}" report has been generated successfully. View it in the Finance section.`,
        priority: 'normal',
        category: 'finance',
        actionUrl: '/operations/finance',
        actionLabel: 'View Report',
        status: 'unread',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Update notifications with completion notification
      const updatedNotificationsList = await kv.get(notificationsKey) || [];
      const finalNotificationsList = Array.isArray(updatedNotificationsList) ? updatedNotificationsList : 
        (typeof updatedNotificationsList === 'string' ? JSON.parse(updatedNotificationsList) : []);
      finalNotificationsList.unshift(completeNotification);
      await kv.set(notificationsKey, finalNotificationsList);

      console.log(`✅ Report ${reportId} generated successfully`);
      return c.json({ id: reportId, aiSummary });

    } catch (error: any) {
      console.error('Report generation error:', error);
      console.error('Report generation error stack:', error.stack);
      return c.json({ error: error.message || 'Failed to generate report' }, 500);
    }
  });

  // Get all reports for a business
  app.get('/make-server-373d8b09/finance/reports', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return c.json({ error: 'Business ID is required' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      // Get all reports from KV store
      const reportsRaw = await kv.getByPrefix(`report:${user.id}:${businessId}:`) || [];
      const reports = reportsRaw.map((r: any) => typeof r === 'string' ? JSON.parse(r) : r);

      // Sort by date, newest first
      reports.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return c.json({ reports });

    } catch (error) {
      console.error('Error loading reports:', error);
      return c.json({ error: error.message || 'Failed to load reports' }, 500);
    }
  });

  // Delete a report
  app.delete('/make-server-373d8b09/finance/reports/:reportId', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const businessId = c.req.query('businessId');
      const reportId = c.req.param('reportId');

      if (!businessId || !reportId) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      // Get user from token
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import('npm:@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return c.json({ error: 'Authentication failed' }, 401);
      }

      // Delete report from KV store
      await kv.del(`report:${user.id}:${businessId}:${reportId}`);

      console.log(`🗑️ Report ${reportId} deleted`);
      return c.json({ success: true });

    } catch (error) {
      console.error('Error deleting report:', error);
      return c.json({ error: error.message || 'Failed to delete report' }, 500);
    }
  });

  console.log('✅ Finance endpoints added successfully');
}

// Background receipt processing function
async function processReceiptBackground(
  receiptId: string,
  userId: string,
  businessId: string,
  image: string,
  fileName: string
) {
  console.log(`🔄 Starting background processing for receipt ${receiptId}`);
  
  const receiptKey = `receipt:${userId}:${businessId}:${receiptId}`;
  
  try {
    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Call OpenAI Vision API to extract receipt data
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a receipt data extraction assistant. Extract transaction information from receipt images and return it as JSON.
              
Return ONLY a valid JSON object with this structure:
{
  "transactions": [
    {
      "description": "string (merchant name or main item)",
      "amount": number (total amount),
      "date": "YYYY-MM-DD",
      "category": "string (pick from: Food & Dining, Transportation, Shopping, Groceries, Entertainment, Healthcare, Utilities, Office Supplies, Travel, Professional Services, Marketing, Software & Subscriptions, Equipment, Rent, Insurance, Taxes, Payroll, Other)",
      "subcategory": "string (optional, more specific category)",
      "payment_method": "string (Credit Card, Debit Card, Cash, etc.)",
      "notes": "string (any additional details from receipt)"
    }
  ],
  "merchant": "string (store/business name)",
  "total": number,
  "tax": number (if shown),
  "confidence": number (0-1, your confidence in the extraction)
}

If you can't extract data, return: { "error": "Unable to read receipt", "confidence": 0 }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all transaction information from this receipt. Return the data as JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    
    const extractedText = openaiData.choices?.[0]?.message?.content ?? null;
    
    if (!extractedText) {
      throw new Error('No data extracted from receipt');
    }

    console.log('🤖 OpenAI extracted:', extractedText);

    // Fixed cost for receipt processing
    const promptTokens = openaiData.usage?.prompt_tokens || 0;
    const completionTokens = openaiData.usage?.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;
    const creditsUsed = 20; // Fixed cost: 20 credits per receipt
    
    console.log(`💰 Receipt Processing Cost: ${creditsUsed} credits (${totalTokens} tokens: ${promptTokens} input + ${completionTokens} output)`);

    // Parse the JSON response
    let receiptData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      receiptData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error(`Failed to parse receipt data: ${parseError.message}`);
    }

    if (receiptData.error || !receiptData.transactions || receiptData.transactions.length === 0) {
      throw new Error(receiptData.error || 'No transactions found in receipt');
    }

    // Create transactions from extracted data
    const createdTransactions = [];
    const transactionIds = [];
    
    for (const txn of receiptData.transactions) {
      const transactionId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction = {
        id: transactionId,
        type: 'expense', // Receipts are typically expenses
        amount: txn.amount || receiptData.total || 0,
        description: txn.description || receiptData.merchant || 'Receipt Transaction',
        category: txn.category || 'Other',
        subcategory: txn.subcategory || null,
        date: txn.date || new Date().toISOString().split('T')[0],
        status: 'completed',
        payment_method: txn.payment_method || 'Unknown',
        notes: txn.notes ? `${txn.notes} (Auto-imported from receipt: ${fileName})` : `Auto-imported from receipt: ${fileName}`,
        tags: ['receipt-upload', 'ai-processed'],
        created_at: new Date().toISOString(),
        is_future_transaction: false
      };

      await kv.set(`transaction:${userId}:${businessId}:${transactionId}`, transaction);
      createdTransactions.push(transaction);
      transactionIds.push(transactionId);
    }

    // Update bank balance
    const balanceKey = `bank_balance:${userId}:${businessId}`;
    let bankBalance = await kv.get(balanceKey) || { balance: 0, currency: 'USD' };
    
    const totalAmount = createdTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    bankBalance.balance -= totalAmount; // Subtract expenses
    bankBalance.last_updated = new Date().toISOString();
    await kv.set(balanceKey, bankBalance);

    // Update receipt job with success
    const receipt = await kv.get(receiptKey);
    if (receipt) {
      receipt.status = 'completed';
      receipt.processedAt = new Date().toISOString();
      receipt.extractedData = {
        merchant: receiptData.merchant,
        total: receiptData.total,
        tax: receiptData.tax,
        date: receiptData.transactions[0]?.date,
        confidence: receiptData.confidence,
        transactions: receiptData.transactions
      };
      receipt.transactionIds = transactionIds;
      receipt.creditsUsed = creditsUsed; // Store credits used for this receipt
      receipt.tokensUsed = totalTokens; // Store total tokens for debugging
      delete receipt.imageData; // Remove image data to save space
      await kv.set(receiptKey, receipt);
    }

    console.log(`✅ Successfully processed receipt ${receiptId}, created ${createdTransactions.length} transactions`);

  } catch (error) {
    console.error(`❌ Failed to process receipt ${receiptId}:`, error);
    
    // Update receipt job with error
    const receipt = await kv.get(receiptKey);
    if (receipt) {
      receipt.status = 'failed';
      receipt.processedAt = new Date().toISOString();
      receipt.error = error.message || 'Failed to process receipt';
      receipt.errorDetails = error.stack || error.toString();
      delete receipt.imageData; // Remove image data to save space
      await kv.set(receiptKey, receipt);
    }
  }
}