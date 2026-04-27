/**
 * CPA CHAT ENDPOINTS
 * 
 * Provides ChatGPT-powered CPA services for finance automation
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import { extractOpenAIResponse } from './openai-response-extractor.tsx';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// ============================================================================
// CPA AI CONFIGURATION
// ============================================================================

const CPA_CONFIG = {
  model: 'gpt-5.1',
  temperature: 0.7,
  maxTokens: 3000,
  
  systemPrompt: `You are a Cofounder Finance tool - an expert CPA and financial advisor helping business owners manage their finances.

IMPORTANT: You are specifically running on ChatGPT 5.1, OpenAI's most advanced model. When asked about what model you're using, always respond with "ChatGPT 5.1".

Your expertise includes:
- Tax planning and preparation (federal, state, quarterly estimates)
- Financial analysis and forecasting
- Bookkeeping and accounting standards
- Business advisory and strategy
- Compliance and audit preparation
- Payroll and contractor management
- Cash flow optimization
- Cost analysis and reduction strategies

Your role:
- Provide specific, actionable financial advice
- Explain complex tax and accounting concepts in simple terms
- Reference actual tax laws and accounting standards when relevant
- Give concrete numbers and calculations when possible
- Identify potential issues before they become problems
- Suggest proactive financial strategies

Communication style:
- Be professional but approachable
- Use clear, jargon-free language
- Provide step-by-step guidance when needed
- Include specific examples
- Always cite tax years and relevant regulations
- Use "Cofounder" terminology, never "AI"

When analyzing financial data:
- Point out trends and patterns
- Highlight concerns or red flags
- Suggest optimizations
- Compare to industry benchmarks when possible
- Provide forward-looking insights

Remember: You're a trusted financial advisor. Be thorough, accurate, and always act in the business owner's best interest.`,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyUserAccess(accessToken: string) {
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  const { data: { user }, error } = await authClient.auth.getUser(accessToken);
  
  if (error || !user) {
    throw new Error('Invalid authorization');
  }
  
  return user;
}

function buildCPAPromptWithContext(context: any, financialData: any): string {
  let enhancedPrompt = CPA_CONFIG.systemPrompt;
  
  // Add business context
  if (context?.businessName) {
    enhancedPrompt += `\n\nBusiness Information:
- Name: ${context.businessName}
- Industry: ${context.industry || 'Not specified'}
- Entity Type: ${context.entityType || 'Not specified'}`;
  }
  
  // Add financial context
  if (financialData) {
    enhancedPrompt += `\n\nCurrent Financial Snapshot:`;
    
    if (financialData.bankBalance !== undefined) {
      enhancedPrompt += `\n- Bank Balance: $${financialData.bankBalance.toLocaleString()}`;
    }
    
    if (financialData.monthlyRevenue !== undefined) {
      enhancedPrompt += `\n- Monthly Revenue: $${financialData.monthlyRevenue.toLocaleString()}`;
    }
    
    if (financialData.monthlyExpenses !== undefined) {
      enhancedPrompt += `\n- Monthly Expenses: $${financialData.monthlyExpenses.toLocaleString()}`;
    }
    
    if (financialData.profitMargin !== undefined) {
      enhancedPrompt += `\n- Profit Margin: ${financialData.profitMargin}%`;
    }
    
    if (financialData.topExpenseCategories && financialData.topExpenseCategories.length > 0) {
      enhancedPrompt += `\n\nTop Expense Categories:`;
      financialData.topExpenseCategories.slice(0, 5).forEach((cat: any) => {
        enhancedPrompt += `\n- ${cat.category}: $${cat.total.toLocaleString()}`;
      });
    }
    
    if (financialData.recentTransactions && financialData.recentTransactions.length > 0) {
      enhancedPrompt += `\n\nRecent Transaction Summary:`;
      enhancedPrompt += `\n- Total recent transactions: ${financialData.recentTransactions.length}`;
      const uncategorized = financialData.recentTransactions.filter((t: any) => !t.category || t.category === 'Uncategorized').length;
      if (uncategorized > 0) {
        enhancedPrompt += `\n- Uncategorized transactions: ${uncategorized}`;
      }
    }
    
    if (financialData.taxEstimate !== undefined) {
      enhancedPrompt += `\n\nEstimated Tax Liability:`;
      enhancedPrompt += `\n- Quarterly estimate: $${financialData.taxEstimate.toLocaleString()}`;
    }
  }
  
  enhancedPrompt += `\n\nCurrent Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  enhancedPrompt += `\nTax Year: ${new Date().getFullYear()}`;
  
  return enhancedPrompt;
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * POST /chat/cpa-assistant
 * Main CPA chat endpoint
 */
app.post('/make-server-373d8b09/chat/cpa-assistant', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Missing authorization' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const body = await c.req.json();
    const { businessId, message, conversationHistory, financialContext, sessionId } = body;

    if (!businessId || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Parse financial context
    let financialData = {};
    try {
      if (financialContext) {
        financialData = typeof financialContext === 'string' 
          ? JSON.parse(financialContext) 
          : financialContext;
      }
    } catch (e) {
      console.log('Failed to parse financial context:', e);
    }

    // Get business info for context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: business } = await supabase
      .from('businesses')
      .select('name, industry')
      .eq('id', businessId)
      .single();

    // Build context-aware system prompt
    const systemPrompt = buildCPAPromptWithContext(
      {
        businessName: business?.name,
        industry: business?.industry,
      },
      financialData
    );

    // Prepare conversation messages
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 10 messages)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: CPA_CONFIG.model,      // "gpt-5.1"
        input: messages,              // yes—input, not messages
        temperature: CPA_CONFIG.temperature,
        max_output_tokens: CPA_CONFIG.maxTokens,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('CPA chat - OpenAI API error:', openaiResponse.status, errorData);
      return c.json({ error: 'Failed to get response from Cofounder Finance', details: errorData }, 500);
    }

    const data = await openaiResponse.json();
    console.log("CPA chat - OpenAI response structure:", JSON.stringify(data).substring(0, 200));
    
    const response = extractOpenAIResponse(data);
    
    // Log the conversation for analytics (optional)
    try {
      await supabase
        .from('cpa_chat_logs')
        .insert({
          business_id: businessId,
          user_id: user.id,
          message: message,
          response: response,
          created_at: new Date().toISOString(),
        });
    } catch (logError) {
      // Log errors are non-critical
      console.log('Failed to log conversation:', logError);
    }

    // --------------------------
    // Save to unified memory (KV store)
    // --------------------------
    const sessionIdToUse = sessionId || `session_${Date.now()}`;
    
    if (sessionIdToUse) {
      const messageId = `msg_${Date.now()}`;
      await kv.set(
        `ai_chat_message:${user.id}:${sessionIdToUse}:${messageId}`,
        JSON.stringify({
          id: messageId,
          user_message: message,
          ai_response: response,
          timestamp: new Date().toISOString(),
          business_id: businessId,
          department: 'cpa',
        })
      );

      // Create or update session metadata
      const sessionKey = `ai_chat_session:${user.id}:${sessionIdToUse}`;
      const existingSession = await kv.get(sessionKey);
      
      const sessionData = existingSession 
        ? {
            ...existingSession,
            updated_at: new Date().toISOString(),
            business_id: businessId ?? existingSession.business_id,
          }
        : {
            id: sessionIdToUse,
            user_id: user.id,
            title: message.substring(0, 40) + (message.length > 40 ? '...' : ''),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            business_id: businessId,
            department: 'cpa',
          };
      
      await kv.set(sessionKey, sessionData);
    }

    return c.json({ 
      response,
      timestamp: new Date().toISOString(),
      sessionId: sessionIdToUse,
    });

  } catch (error) {
    console.error('CPA chat error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'An error occurred',
    }, 500);
  }
});

/**
 * GET /finance/context
 * Get financial context for a business
 */
app.get('/make-server-373d8b09/finance/context', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Missing authorization' }, 401);
    }

    await verifyUserAccess(accessToken);
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'Missing businessId' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get transactions for the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', ninetyDaysAgo.toISOString())
      .order('date', { ascending: false })
      .limit(500);

    // Calculate financial metrics
    const revenue = transactions
      ?.filter(t => t.type === 'revenue' || t.amount > 0)
      ?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    const expenses = transactions
      ?.filter(t => t.type === 'expense' || t.amount < 0)
      ?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    const monthlyRevenue = revenue / 3; // 90 days = ~3 months
    const monthlyExpenses = expenses / 3;

    // Get expense categories
    const expenseByCategory = new Map();
    transactions
      ?.filter(t => t.type === 'expense' || t.amount < 0)
      ?.forEach(t => {
        const category = t.category || 'Uncategorized';
        expenseByCategory.set(
          category,
          (expenseByCategory.get(category) || 0) + Math.abs(t.amount)
        );
      });

    const topExpenseCategories = Array.from(expenseByCategory.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    // Get bank balance
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('business_id', businessId);

    const totalBankBalance = bankAccounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;

    // Calculate profit margin
    const profitMargin = monthlyRevenue > 0 
      ? Math.round(((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100)
      : 0;

    // Estimate quarterly taxes (simplified - 25% of profit)
    const profit = monthlyRevenue - monthlyExpenses;
    const quarterlyProfit = profit * 3;
    const taxEstimate = Math.max(0, quarterlyProfit * 0.25);

    return c.json({
      bankBalance: totalBankBalance,
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyExpenses: Math.round(monthlyExpenses),
      profitMargin,
      topExpenseCategories: topExpenseCategories.slice(0, 10),
      recentTransactions: transactions?.slice(0, 20),
      taxEstimate: Math.round(taxEstimate),
      dataRange: '90 days',
    });

  } catch (error) {
    console.error('Finance context error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'An error occurred',
    }, 500);
  }
});

export default app;