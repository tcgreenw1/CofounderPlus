import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

// Helper function to calculate next occurrence for recurring transactions
function calculateNextOccurrence(currentDate: string, recurrenceType: string, interval: number = 1): string {
  const date = new Date(currentDate);
  
  switch (recurrenceType) {
    case 'bi-weekly':
      date.setDate(date.getDate() + (14 * interval));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + interval);
      break;
    default:
      return null; // One-time transactions don't have next occurrence
  }
  
  return date.toISOString().split('T')[0];
}

// Helper function to generate recurring transactions
async function generateRecurringTransactions(originalTransaction: any, userId: string, businessId: string) {
  const recurringTransactions = [];
  
  if (originalTransaction.recurrence_type === 'one-time' || !originalTransaction.next_occurrence) {
    return recurringTransactions;
  }
  
  let nextDate = originalTransaction.next_occurrence;
  const endDate = originalTransaction.recurrence_end_date;
  const maxOccurrences = 60; // Limit to 5 years of monthly transactions
  let count = 0;
  
  while (nextDate && count < maxOccurrences) {
    if (endDate && new Date(nextDate) > new Date(endDate)) {
      break;
    }
    
    const recurringId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const recurringTransaction = {
      ...originalTransaction,
      id: recurringId,
      date: nextDate,
      scheduled_date: nextDate,
      is_future_transaction: true,
      status: 'scheduled',
      is_recurring_instance: true,
      parent_transaction_id: originalTransaction.id,
      occurrence_number: count + 1,
      next_occurrence: calculateNextOccurrence(nextDate, originalTransaction.recurrence_type, originalTransaction.recurrence_interval),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    recurringTransactions.push(recurringTransaction);
    
    // Store the recurring transaction
    await kv.set(`transaction:${userId}:${businessId}:${recurringId}`, recurringTransaction);
    
    nextDate = recurringTransaction.next_occurrence;
    count++;
  }
  
  return recurringTransactions;
}

export function addFinanceEndpoints(app: any, verifyUserAccess: any) {
  console.log('💰 Adding Finance endpoints...');

  // Get all finance data for a business
  app.get('/make-server-ac1075a9/finance/data', async (c: any) => {
    console.log('Finance data endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get finance data from KV store using array pattern
      let transactions = await kv.get(`business:${user.id}:${businessId}:transactions`);
      if (!Array.isArray(transactions)) transactions = [];
      
      const invoices = await kv.getByPrefix(`invoice:${user.id}:${businessId}:`) || [];
      const budgets = await kv.getByPrefix(`budget:${user.id}:${businessId}:`) || [];
      
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
        console.log('🏦 Initialized bank balance for business:', businessId);
      }

      // Calculate balance from transactions for informational purposes
      const completedTransactions = transactions.filter(t => (t.status || 'completed') === 'completed');
      const totalIncome = completedTransactions
        .filter(t => t.type === 'income' || t.type === 'revenue')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalExpenses = completedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const calculatedBalance = totalIncome - totalExpenses;
      
      // Only auto-sync if bankBalance has never been manually set (indicated by a specific flag)
      // Or if this is a completely new business with no transactions yet
      if (!bankBalance.manually_set && transactions.length === 0) {
        console.log('🏦 Auto-initializing bank balance for new business:', calculatedBalance);
        bankBalance.balance = calculatedBalance;
        bankBalance.last_updated = new Date().toISOString();
        await kv.set(`bank_balance:${user.id}:${businessId}`, bankBalance);
      } else {
        console.log('🏦 Preserving manually set bank balance:', bankBalance.balance, '(calculated would be:', calculatedBalance, ')');
      }

      console.log(`Finance data loaded: ${transactions.length} transactions, ${invoices.length} invoices, ${budgets.length} budgets, bank balance: ${bankBalance.balance}`);

      return c.json({
        transactions,
        invoices,
        budgets,
        bankBalance,
        businessInfo: {} // Could be expanded to include business-specific finance info
      });

    } catch (error) {
      console.error('Finance data error:', error);
      return new Response(`Error getting finance data: ${error.message}`, { status: 500 });
    }
  });

  // Helper function to update bank balance
  const updateBankBalance = async (userId: string, businessId: string, transactionType: 'income' | 'expense', amount: number, operation: 'add' | 'subtract' = 'add') => {
    try {
      // Get current bank balance
      let bankBalance = await kv.get(`bank_balance:${userId}:${businessId}`);
      if (!bankBalance) {
        bankBalance = {
          balance: 0,
          currency: 'USD',
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      }

      // Update balance based on transaction type and operation
      let balanceChange = 0;
      if (operation === 'add') {
        if (transactionType === 'income' || transactionType === 'revenue') {
          balanceChange = amount; // Income increases balance
        } else if (transactionType === 'expense') {
          balanceChange = -amount; // Expense decreases balance
        }
      } else { // subtract operation (for deletions/reversals)
        if (transactionType === 'income' || transactionType === 'revenue') {
          balanceChange = -amount; // Removing income decreases balance
        } else if (transactionType === 'expense') {
          balanceChange = amount; // Removing expense increases balance
        }
      }

      bankBalance.balance += balanceChange;
      bankBalance.last_updated = new Date().toISOString();

      await kv.set(`bank_balance:${userId}:${businessId}`, bankBalance);
      
      console.log(`🏦 Bank balance updated: ${operation} ${transactionType} ${amount}, new balance: ${bankBalance.balance}`);
      return bankBalance;
    } catch (error) {
      console.error('🏦 Error updating bank balance:', error);
      throw error;
    }
  };

  // TRANSACTION ENDPOINTS
  app.post('/make-server-ac1075a9/finance/transactions', async (c: any) => {
    console.log('Create transaction endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const transactionData = await c.req.json();
      const transactionId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Ensure proper date handling for future transactions
      const today = new Date().toISOString().split('T')[0];
      const transactionDate = transactionData.date || today;
      const scheduledDate = transactionData.scheduled_date;
      
      // Determine if this is truly a future transaction
      const isFutureTransaction = transactionData.is_future_transaction && 
                                  scheduledDate && 
                                  new Date(scheduledDate) > new Date(today);
      
      const transaction = {
        ...transactionData,
        id: transactionId,
        date: transactionDate,
        scheduled_date: scheduledDate,
        due_date: transactionData.due_date || transactionDate, // Due date for payments/receipts
        is_future_transaction: isFutureTransaction,
        status: isFutureTransaction ? 'scheduled' : (transactionData.status || 'completed'),
        // Enhanced recurring transaction support
        recurrence_type: transactionData.recurrence_type || 'one-time', // 'bi-weekly', 'monthly', 'annual', 'one-time'
        recurrence_interval: transactionData.recurrence_interval || 1, // Every X intervals
        recurrence_end_date: transactionData.recurrence_end_date, // When to stop recurring
        next_occurrence: isFutureTransaction && transactionData.recurrence_type !== 'one-time' 
          ? calculateNextOccurrence(scheduledDate, transactionData.recurrence_type, transactionData.recurrence_interval)
          : null,
        // Enhanced product integration
        product_id: transactionData.product_id,
        product_name: transactionData.product_name,
        quantity: transactionData.quantity || (transactionData.product_id ? 1 : undefined),
        unit_price: transactionData.unit_price,
        discount_amount: transactionData.discount_amount || 0,
        discount_percentage: transactionData.discount_percentage || 0,
        // Enhanced categorization
        category: transactionData.category || 'other',
        subcategory: transactionData.subcategory,
        tags: transactionData.tags || [],
        // Additional metadata
        payment_method: transactionData.payment_method,
        reference: transactionData.reference,
        notes: transactionData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, transaction);

      // Generate recurring transactions if applicable
      let recurringTransactions = [];
      if (transaction.recurrence_type !== 'one-time' && transaction.next_occurrence) {
        console.log('📅 Generating recurring transactions for:', transaction.recurrence_type);
        recurringTransactions = await generateRecurringTransactions(transaction, user.id, businessId);
        console.log(`📅 Generated ${recurringTransactions.length} recurring transactions`);
      }

      // Update bank balance ONLY if transaction is completed AND not a future transaction
      // This prevents future transactions from affecting current balance
      const shouldUpdateBalance = (transaction.status || 'completed') === 'completed' && 
                                  !transaction.is_future_transaction &&
                                  (!transaction.scheduled_date || new Date(transaction.scheduled_date) <= new Date());
      
      console.log('🏦 Bank balance update check:', {
        status: transaction.status,
        is_future: transaction.is_future_transaction,
        scheduled_date: transaction.scheduled_date,
        should_update: shouldUpdateBalance,
        amount: transaction.amount,
        type: transaction.type
      });
      
      if (shouldUpdateBalance) {
        await updateBankBalance(user.id, businessId, transaction.type, Number(transaction.amount) || 0, 'add');
        console.log('🏦 Bank balance updated for immediate transaction');
      } else {
        console.log('🏦 Bank balance NOT updated - future or scheduled transaction');
      }
      
      console.log('Transaction created:', transaction);
      return c.json({ 
        transaction,
        recurring_transactions: recurringTransactions,
        total_created: 1 + recurringTransactions.length
      });

    } catch (error) {
      console.error('Create transaction error:', error);
      return new Response(`Error creating transaction: ${error.message}`, { status: 500 });
    }
  });

  app.put('/make-server-ac1075a9/finance/transactions/:id', async (c: any) => {
    console.log('Update transaction endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const transactionId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!transactionId) {
        return new Response('Transaction ID is required', { status: 400 });
      }

      const existingTransaction = await kv.get(`transaction:${user.id}:${businessId}:${transactionId}`);
      if (!existingTransaction) {
        return new Response('Transaction not found', { status: 404 });
      }

      const updateData = await c.req.json();
      
      // Handle bank balance updates properly for edits
      const wasCompleted = (existingTransaction.status || 'completed') === 'completed' && !existingTransaction.is_future_transaction;
      const willBeCompleted = (updateData.status || existingTransaction.status || 'completed') === 'completed' && 
                               !(updateData.is_future_transaction ?? existingTransaction.is_future_transaction);
      
      const oldAmount = Number(existingTransaction.amount) || 0;
      const newAmount = Number(updateData.amount ?? existingTransaction.amount) || 0;
      const oldType = existingTransaction.type;
      const newType = updateData.type ?? existingTransaction.type;

      // Reverse old transaction if it was completed
      if (wasCompleted) {
        await updateBankBalance(user.id, businessId, oldType, oldAmount, 'subtract');
        console.log('🏦 Reversed old transaction from bank balance');
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
        console.log('🏦 Applied updated transaction to bank balance');
      }

      await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, updatedTransaction);
      
      console.log('Transaction updated:', updatedTransaction);
      return c.json({ transaction: updatedTransaction });

    } catch (error) {
      console.error('Update transaction error:', error);
      return new Response(`Error updating transaction: ${error.message}`, { status: 500 });
    }
  });

  app.delete('/make-server-ac1075a9/finance/transactions/:id', async (c: any) => {
    console.log('Delete transaction endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const transactionId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!transactionId) {
        return new Response('Transaction ID is required', { status: 400 });
      }

      const existingTransaction = await kv.get(`transaction:${user.id}:${businessId}:${transactionId}`);
      if (!existingTransaction) {
        return new Response('Transaction not found', { status: 404 });
      }

      // Update bank balance by reversing the transaction if it was completed
      const wasCompleted = (existingTransaction.status || 'completed') === 'completed' && 
                           !existingTransaction.is_future_transaction;
      
      if (wasCompleted) {
        await updateBankBalance(user.id, businessId, existingTransaction.type, Number(existingTransaction.amount) || 0, 'subtract');
        console.log('🏦 Reversed deleted transaction from bank balance');
      }

      // Delete all related recurring transactions if this is a parent transaction
      if (existingTransaction.recurrence_type !== 'one-time' && !existingTransaction.is_recurring_instance) {
        console.log('🔄 Deleting related recurring transactions...');
        const allTransactions = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
        const recurringInstances = allTransactions.filter(t => 
          t.parent_transaction_id === transactionId || 
          (t.is_recurring_instance && t.parent_transaction_id === transactionId)
        );
        
        for (const recurringTransaction of recurringInstances) {
          await kv.del(`transaction:${user.id}:${businessId}:${recurringTransaction.id}`);
        }
        
        console.log(`🔄 Deleted ${recurringInstances.length} recurring transaction instances`);
      }

      await kv.del(`transaction:${user.id}:${businessId}:${transactionId}`);
      
      console.log('Transaction deleted:', transactionId);
      return c.json({ 
        success: true, 
        message: 'Transaction deleted successfully',
        deletedTransaction: existingTransaction
      });

    } catch (error) {
      console.error('Delete transaction error:', error);
      return new Response(`Error deleting transaction: ${error.message}`, { status: 500 });
    }
  });

  // INVOICE ENDPOINTS
  app.post('/make-server-ac1075a9/finance/invoices', async (c: any) => {
    console.log('Create invoice endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
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
      
      console.log('Invoice created:', invoice);
      return c.json({ invoice });

    } catch (error) {
      console.error('Create invoice error:', error);
      return new Response(`Error creating invoice: ${error.message}`, { status: 500 });
    }
  });

  app.put('/make-server-ac1075a9/finance/invoices/:id', async (c: any) => {
    console.log('Update invoice endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const invoiceId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!invoiceId) {
        return new Response('Invoice ID is required', { status: 400 });
      }

      const existingInvoice = await kv.get(`invoice:${user.id}:${businessId}:${invoiceId}`);
      if (!existingInvoice) {
        return new Response('Invoice not found', { status: 404 });
      }

      const updateData = await c.req.json();
      
      const updatedInvoice = {
        ...existingInvoice,
        ...updateData,
        id: invoiceId,
        updated_at: new Date().toISOString()
      };

      await kv.set(`invoice:${user.id}:${businessId}:${invoiceId}`, updatedInvoice);
      
      console.log('Invoice updated:', updatedInvoice);
      return c.json({ invoice: updatedInvoice });

    } catch (error) {
      console.error('Update invoice error:', error);
      return new Response(`Error updating invoice: ${error.message}`, { status: 500 });
    }
  });

  app.delete('/make-server-ac1075a9/finance/invoices/:id', async (c: any) => {
    console.log('Delete invoice endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const invoiceId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!invoiceId) {
        return new Response('Invoice ID is required', { status: 400 });
      }

      const existingInvoice = await kv.get(`invoice:${user.id}:${businessId}:${invoiceId}`);
      if (!existingInvoice) {
        return new Response('Invoice not found', { status: 404 });
      }

      await kv.del(`invoice:${user.id}:${businessId}:${invoiceId}`);
      
      console.log('Invoice deleted:', invoiceId);
      return c.json({ success: true, message: 'Invoice deleted successfully' });

    } catch (error) {
      console.error('Delete invoice error:', error);
      return new Response(`Error deleting invoice: ${error.message}`, { status: 500 });
    }
  });

  // BUDGET ENDPOINTS
  app.post('/make-server-ac1075a9/finance/budgets', async (c: any) => {
    console.log('Create budget endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
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
      
      console.log('Budget created:', budget);
      return c.json({ budget });

    } catch (error) {
      console.error('Create budget error:', error);
      return new Response(`Error creating budget: ${error.message}`, { status: 500 });
    }
  });

  app.put('/make-server-ac1075a9/finance/budgets/:id', async (c: any) => {
    console.log('Update budget endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const budgetId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!budgetId) {
        return new Response('Budget ID is required', { status: 400 });
      }

      const existingBudget = await kv.get(`budget:${user.id}:${businessId}:${budgetId}`);
      if (!existingBudget) {
        return new Response('Budget not found', { status: 404 });
      }

      const updateData = await c.req.json();
      
      const updatedBudget = {
        ...existingBudget,
        ...updateData,
        id: budgetId,
        updated_at: new Date().toISOString()
      };

      await kv.set(`budget:${user.id}:${businessId}:${budgetId}`, updatedBudget);
      
      console.log('Budget updated:', updatedBudget);
      return c.json({ budget: updatedBudget });

    } catch (error) {
      console.error('Update budget error:', error);
      return new Response(`Error updating budget: ${error.message}`, { status: 500 });
    }
  });

  app.delete('/make-server-ac1075a9/finance/budgets/:id', async (c: any) => {
    console.log('Delete budget endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const budgetId = c.req.param('id');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      if (!budgetId) {
        return new Response('Budget ID is required', { status: 400 });
      }

      const existingBudget = await kv.get(`budget:${user.id}:${businessId}:${budgetId}`);
      if (!existingBudget) {
        return new Response('Budget not found', { status: 404 });
      }

      await kv.del(`budget:${user.id}:${businessId}:${budgetId}`);
      
      console.log('Budget deleted:', budgetId);
      return c.json({ success: true, message: 'Budget deleted successfully' });

    } catch (error) {
      console.error('Delete budget error:', error);
      return new Response(`Error deleting budget: ${error.message}`, { status: 500 });
    }
  });

  // AI FUNCTION SPECIFIC ENDPOINTS
  
  // Add income entry (for AI functions)
  app.post('/make-server-ac1075a9/finance/add-income', async (c: any) => {
    console.log('🤖 AI Add income endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const { amount, description, category, date, businessId } = await c.req.json();

      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }

      if (!amount || !description) {
        return c.json({ success: false, error: 'Amount and description are required' }, 400);
      }

      const transactionId = `income-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const amountValue = parseFloat(amount);
      
      const transaction = {
        id: transactionId,
        type: 'income',
        amount: amountValue,
        description: description,
        category: category || 'other',
        date: date || new Date().toISOString().split('T')[0],
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        businessId: businessId,
        userId: user.id
      };

      await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, transaction);

      // Update bank balance
      const updatedBalance = await updateBankBalance(user.id, businessId, 'income', amountValue, 'add');
      
      console.log('🤖 AI Income transaction created:', transaction);
      return c.json({ 
        success: true, 
        message: `Income of ${amount} added successfully. New balance: ${updatedBalance.balance.toFixed(2)}`,
        data: transaction,
        bankBalance: updatedBalance
      });

    } catch (error: any) {
      console.error('🤖 AI Add income error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Add expense entry (for AI functions)
  app.post('/make-server-ac1075a9/finance/add-expense', async (c: any) => {
    console.log('🤖 AI Add expense endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const { amount, description, category, date, businessId } = await c.req.json();

      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }

      if (!amount || !description) {
        return c.json({ success: false, error: 'Amount and description are required' }, 400);
      }

      const transactionId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const amountValue = parseFloat(amount);
      
      const transaction = {
        id: transactionId,
        type: 'expense',
        amount: amountValue,
        description: description,
        category: category || 'other',
        date: date || new Date().toISOString().split('T')[0],
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        businessId: businessId,
        userId: user.id
      };

      await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, transaction);

      // Update bank balance
      const updatedBalance = await updateBankBalance(user.id, businessId, 'expense', amountValue, 'add');
      
      console.log('🤖 AI Expense transaction created:', transaction);
      return c.json({ 
        success: true, 
        message: `Expense of ${amount} added successfully. New balance: ${updatedBalance.balance.toFixed(2)}`,
        data: transaction,
        bankBalance: updatedBalance
      });

    } catch (error: any) {
      console.error('🤖 AI Add expense error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Create budget (for AI functions)
  app.post('/make-server-ac1075a9/finance/create-budget', async (c: any) => {
    console.log('🤖 AI Create budget endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const { category, limit, period, businessId } = await c.req.json();

      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }

      if (!category || !limit) {
        return c.json({ success: false, error: 'Category and limit are required' }, 400);
      }

      const budgetId = `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const budget = {
        id: budgetId,
        category: category,
        limit: parseFloat(limit),
        period: period || 'monthly',
        spent: 0,
        remaining: parseFloat(limit),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        businessId: businessId,
        userId: user.id
      };

      await kv.set(`budget:${user.id}:${businessId}:${budgetId}`, budget);
      
      console.log('🤖 AI Budget created:', budget);
      return c.json({ 
        success: true, 
        message: `Budget for ${category} created successfully`,
        data: budget 
      });

    } catch (error: any) {
      console.error('🤖 AI Create budget error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Update budget (for AI functions)
  app.post('/make-server-ac1075a9/finance/update-budget', async (c: any) => {
    console.log('🤖 AI Update budget endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const { category, limit, period, businessId } = await c.req.json();

      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }

      if (!category || !limit) {
        return c.json({ success: false, error: 'Category and limit are required' }, 400);
      }

      // Find existing budget by category
      const budgets = await kv.getByPrefix(`budget:${user.id}:${businessId}:`) || [];
      const existingBudget = budgets.find(b => b.category === category);
      
      if (existingBudget) {
        // Update existing budget
        const updatedBudget = {
          ...existingBudget,
          limit: parseFloat(limit),
          period: period || existingBudget.period,
          remaining: parseFloat(limit) - (existingBudget.spent || 0),
          updated_at: new Date().toISOString()
        };

        await kv.set(`budget:${user.id}:${businessId}:${existingBudget.id}`, updatedBudget);
        
        console.log('🤖 AI Budget updated:', updatedBudget);
        return c.json({ 
          success: true, 
          message: `Budget for ${category} updated successfully`,
          data: updatedBudget 
        });
      } else {
        // Create new budget if not found
        const budgetId = `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const budget = {
          id: budgetId,
          category: category,
          limit: parseFloat(limit),
          period: period || 'monthly',
          spent: 0,
          remaining: parseFloat(limit),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          businessId: businessId,
          userId: user.id
        };

        await kv.set(`budget:${user.id}:${businessId}:${budgetId}`, budget);
        
        console.log('🤖 AI Budget created (update requested):', budget);
        return c.json({ 
          success: true, 
          message: `Budget for ${category} created successfully`,
          data: budget 
        });
      }

    } catch (error: any) {
      console.error('🤖 AI Update budget error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // BANK BALANCE ENDPOINTS
  
  // Get bank balance
  app.get('/make-server-ac1075a9/finance/bank-balance', async (c: any) => {
    console.log('🏦 Get bank balance endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

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

      console.log('🏦 Bank balance retrieved:', bankBalance);
      return c.json({ bankBalance });

    } catch (error) {
      console.error('🏦 Get bank balance error:', error);
      return new Response(`Error getting bank balance: ${error.message}`, { status: 500 });
    }
  });

  // Set bank balance (manual override)
  app.post('/make-server-ac1075a9/finance/set-bank-balance', async (c: any) => {
    console.log('🏦 Set bank balance endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const { balance, currency = 'USD' } = await c.req.json();

      if (balance === undefined || balance === null) {
        return new Response('Balance is required', { status: 400 });
      }

      const bankBalance = {
        balance: parseFloat(balance),
        currency: currency,
        manually_set: true, // Flag to indicate this was manually set
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      await kv.set(`bank_balance:${user.id}:${businessId}`, bankBalance);

      console.log('🏦 Bank balance set manually:', bankBalance);
      return c.json({ 
        success: true, 
        message: `Bank balance set to ${currency} ${balance}`,
        bankBalance 
      });

    } catch (error) {
      console.error('🏦 Set bank balance error:', error);
      return new Response(`Error setting bank balance: ${error.message}`, { status: 500 });
    }
  });

  // Recalculate bank balance from transactions (sync)
  app.post('/make-server-ac1075a9/finance/sync-bank-balance', async (c: any) => {
    console.log('🏦 Sync bank balance endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get all completed transactions
      const transactions = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      const completedTransactions = transactions.filter(t => (t.status || 'completed') === 'completed');
      
      // Calculate balance from transactions
      const totalIncome = completedTransactions
        .filter(t => t.type === 'income' || t.type === 'revenue')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalExpenses = completedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const calculatedBalance = totalIncome - totalExpenses;

      // Update bank balance (remove manually_set flag since we're syncing from transactions)
      const bankBalance = {
        balance: calculatedBalance,
        currency: 'USD',
        manually_set: false, // This is now calculated from transactions
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      await kv.set(`bank_balance:${user.id}:${businessId}`, bankBalance);

      console.log('🏦 Bank balance synced from transactions:', bankBalance);
      return c.json({ 
        success: true, 
        message: `Bank balance synced to ${calculatedBalance.toFixed(2)} from ${completedTransactions.length} transactions`,
        bankBalance,
        summary: {
          totalIncome,
          totalExpenses,
          transactionCount: completedTransactions.length
        }
      });

    } catch (error) {
      console.error('🏦 Sync bank balance error:', error);
      return new Response(`Error syncing bank balance: ${error.message}`, { status: 500 });
    }
  });

  // Get financial projections including future transactions
  app.get('/make-server-ac1075a9/finance/projections', async (c: any) => {
    console.log('💰 Financial projections endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');
      const months = parseInt(c.req.query('months') || '6'); // Default to 6 months

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get all transactions including scheduled ones
      const allTransactions = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      
      // Get current bank balance
      let bankBalance = await kv.get(`bank_balance:${user.id}:${businessId}`);
      if (!bankBalance) {
        bankBalance = { balance: 0, currency: 'USD' };
      }
      
      // Get recurring transactions
      const recurringTransactions = await kv.getByPrefix(`recurring_transaction:${user.id}:${businessId}:`) || [];

      // Filter transactions by type
      const currentTransactions = allTransactions.filter(t => 
        !t.is_future_transaction && (t.status || 'completed') === 'completed'
      );
      const futureTransactions = allTransactions.filter(t => 
        t.is_future_transaction && t.status === 'scheduled'
      );

      // Calculate current totals
      const currentIncome = currentTransactions
        .filter(t => t.type === 'income' || t.type === 'revenue')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const currentExpenses = currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Generate monthly projections
      const projections = [];
      let runningBalance = bankBalance.balance;
      
      for (let i = 0; i < months; i++) {
        const projectionDate = new Date();
        projectionDate.setMonth(projectionDate.getMonth() + i);
        const monthStart = new Date(projectionDate.getFullYear(), projectionDate.getMonth(), 1);
        const monthEnd = new Date(projectionDate.getFullYear(), projectionDate.getMonth() + 1, 0);
        
        // Calculate scheduled transactions for this month
        const monthlyScheduledIncome = futureTransactions
          .filter(t => {
            if (!t.scheduled_date) return false;
            const schedDate = new Date(t.scheduled_date);
            return (t.type === 'income' || t.type === 'revenue') && schedDate >= monthStart && schedDate <= monthEnd;
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          
        const monthlyScheduledExpenses = futureTransactions
          .filter(t => {
            if (!t.scheduled_date) return false;
            const schedDate = new Date(t.scheduled_date);
            return t.type === 'expense' && schedDate >= monthStart && schedDate <= monthEnd;
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        // Calculate recurring transactions for this month
        const monthlyRecurringIncome = recurringTransactions
          .filter(t => (t.type === 'income' || t.type === 'revenue') && t.is_recurring)
          .reduce((sum, t) => {
            if (t.frequency === 'monthly') return sum + (Number(t.amount) || 0);
            if (t.frequency === 'annual' && projectionDate.getMonth() === new Date(t.start_date).getMonth()) {
              return sum + (Number(t.amount) || 0);
            }
            return sum;
          }, 0);
          
        const monthlyRecurringExpenses = recurringTransactions
          .filter(t => t.type === 'expense' && t.is_recurring)
          .reduce((sum, t) => {
            if (t.frequency === 'monthly') return sum + (Number(t.amount) || 0);
            if (t.frequency === 'annual' && projectionDate.getMonth() === new Date(t.start_date).getMonth()) {
              return sum + (Number(t.amount) || 0);
            }
            return sum;
          }, 0);

        const totalMonthlyIncome = monthlyScheduledIncome + monthlyRecurringIncome;
        const totalMonthlyExpenses = monthlyScheduledExpenses + monthlyRecurringExpenses;
        const monthlyNet = totalMonthlyIncome - totalMonthlyExpenses;
        
        runningBalance += monthlyNet;

        projections.push({
          month: projectionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          monthIndex: i,
          income: {
            scheduled: monthlyScheduledIncome,
            recurring: monthlyRecurringIncome,
            total: totalMonthlyIncome
          },
          expenses: {
            scheduled: monthlyScheduledExpenses,
            recurring: monthlyRecurringExpenses,
            total: totalMonthlyExpenses
          },
          net: monthlyNet,
          runningBalance: runningBalance,
          projectedBalance: runningBalance
        });
      }

      console.log(`💰 Generated ${projections.length} month projections with ${futureTransactions.length} future transactions`);
      
      return c.json({
        success: true,
        currentBalance: bankBalance.balance,
        projections,
        summary: {
          currentIncome,
          currentExpenses,
          futureTransactionsCount: futureTransactions.length,
          recurringTransactionsCount: recurringTransactions.length,
          projectionMonths: months
        }
      });

    } catch (error) {
      console.error('💰 Financial projections error:', error);
      return new Response(`Error generating projections: ${error.message}`, { status: 500 });
    }
  });

  // Process scheduled transactions that are due
  app.post('/make-server-373d8b09/finance/process-scheduled', async (c: any) => {
    console.log('⏰ Process scheduled transactions endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      // Get all scheduled transactions
      const allTransactions = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      const scheduledTransactions = allTransactions.filter(t => 
        t.is_future_transaction && 
        t.status === 'scheduled' && 
        t.scheduled_date
      );

      const today = new Date().toISOString().split('T')[0];
      const processedTransactions = [];

      // Process transactions that are due today or earlier
      for (const transaction of scheduledTransactions) {
        if (transaction.scheduled_date <= today) {
          // Update transaction to completed status
          const updatedTransaction = {
            ...transaction,
            status: 'completed',
            date: transaction.scheduled_date, // Use the scheduled date as the actual date
            is_future_transaction: false,
            updated_at: new Date().toISOString()
          };

          // Save the updated transaction
          await kv.set(`transaction:${user.id}:${businessId}:${transaction.id}`, updatedTransaction);

          // Update bank balance
          await updateBankBalance(
            user.id, 
            businessId, 
            transaction.type, 
            Number(transaction.amount) || 0, 
            'add'
          );

          processedTransactions.push(updatedTransaction);
          console.log(`⏰ Processed scheduled transaction: ${transaction.description} (${transaction.amount})`);

          // Handle recurring transactions - create next occurrence if applicable
          if (transaction.recurrence_type !== 'one-time' && transaction.next_occurrence) {
            const nextOccurrenceDate = transaction.next_occurrence;
            const endDate = transaction.recurrence_end_date;
            
            // Check if we should create the next occurrence
            if (!endDate || new Date(nextOccurrenceDate) <= new Date(endDate)) {
              const nextRecurringId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const nextRecurringTransaction = {
                ...transaction,
                id: nextRecurringId,
                date: nextOccurrenceDate,
                scheduled_date: nextOccurrenceDate,
                is_future_transaction: true,
                status: 'scheduled',
                is_recurring_instance: true,
                parent_transaction_id: transaction.parent_transaction_id || transaction.id,
                occurrence_number: (transaction.occurrence_number || 0) + 1,
                next_occurrence: calculateNextOccurrence(
                  nextOccurrenceDate, 
                  transaction.recurrence_type, 
                  transaction.recurrence_interval || 1
                ),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              // Store the next recurring transaction
              await kv.set(`transaction:${user.id}:${businessId}:${nextRecurringId}`, nextRecurringTransaction);
              console.log(`📅 Created next recurring transaction for ${nextOccurrenceDate}`);
            } else {
              console.log(`📅 Recurring series ended for transaction: ${transaction.description}`);
            }
          }
        }
      }

      console.log(`⏰ Processed ${processedTransactions.length} scheduled transactions out of ${scheduledTransactions.length} total`);
      
      return c.json({
        success: true,
        processedCount: processedTransactions.length,
        totalScheduled: scheduledTransactions.length,
        processedTransactions
      });

    } catch (error) {
      console.error('⏰ Process scheduled transactions error:', error);
      return new Response(`Error processing scheduled transactions: ${error.message}`, { status: 500 });
    }
  });

  // Bulk import transactions
  app.post('/make-server-ac1075a9/finance/bulk-import', async (c: any) => {
    console.log('📤 Bulk import transactions endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      const businessId = c.req.query('businessId');

      if (!businessId) {
        return new Response('Business ID is required', { status: 400 });
      }

      const { transactions } = await c.req.json();

      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return c.json({ success: false, error: 'Transactions array is required' }, 400);
      }

      console.log(`📤 Importing ${transactions.length} transactions for business ${businessId}`);

      const importedTransactions = [];
      const errors = [];

      for (let i = 0; i < transactions.length; i++) {
        try {
          const txData = transactions[i];
          const transactionId = `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Determine if this is a future transaction
          const isFutureTransaction = txData.scheduled_date 
            ? new Date(txData.scheduled_date) > new Date() 
            : new Date(txData.date) > new Date();

          // Determine if we should update balance now
          const shouldUpdateBalance = !isFutureTransaction && (!txData.status || txData.status === 'completed');

          const transaction = {
            id: transactionId,
            type: txData.type,
            amount: Number(txData.amount),
            description: txData.description,
            category: txData.category || 'other',
            date: txData.date,
            status: txData.status || 'completed',
            recurrence_type: txData.recurrence_type || 'one-time',
            recurrence_interval: txData.recurrence_interval || 1,
            next_occurrence: txData.next_occurrence || null,
            recurrence_end_date: txData.recurrence_end_date || null,
            scheduled_date: txData.scheduled_date || null,
            is_future_transaction: isFutureTransaction,
            is_recurring_instance: false,
            businessId: businessId,
            userId: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Store transaction
          await kv.set(`transaction:${user.id}:${businessId}:${transactionId}`, transaction);

          // Update bank balance if this is a completed immediate transaction
          if (shouldUpdateBalance) {
            await updateBankBalance(user.id, businessId, transaction.type, Number(transaction.amount), 'add');
          }

          // Generate recurring transactions if needed
          if (transaction.recurrence_type !== 'one-time' && transaction.next_occurrence) {
            const recurringTransactions = await generateRecurringTransactions(transaction, user.id, businessId);
            for (const recurringTx of recurringTransactions) {
              await kv.set(`transaction:${user.id}:${businessId}:${recurringTx.id}`, recurringTx);
            }
            console.log(`📅 Generated ${recurringTransactions.length} recurring instances for imported transaction`);
          }

          importedTransactions.push(transaction);
        } catch (error) {
          console.error(`Error importing transaction ${i}:`, error);
          errors.push({ index: i, error: error.message });
        }
      }

      console.log(`📤 Successfully imported ${importedTransactions.length} transactions with ${errors.length} errors`);

      return c.json({
        success: true,
        imported: importedTransactions.length,
        total: transactions.length,
        errors: errors.length > 0 ? errors : undefined,
        transactions: importedTransactions
      });

    } catch (error) {
      console.error('📤 Bulk import error:', error);
      return c.json({ success: false, error: error.message }, 500);
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
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
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
          temperature: 0.1
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API error:', errorData);
        return c.json({ error: 'Failed to process receipt with AI' }, 500);
      }

      const openaiData = await openaiResponse.json();
      const extractedText = openaiData.choices[0]?.message?.content;
      
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

      // Calculate credits used (approximate based on tokens)
      const tokensUsed = openaiData.usage?.total_tokens || 500;
      const creditsCost = Math.ceil(tokensUsed / 10); // Rough estimate: 10 tokens = 1 credit

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

  console.log('✅ Finance endpoints added successfully');
}