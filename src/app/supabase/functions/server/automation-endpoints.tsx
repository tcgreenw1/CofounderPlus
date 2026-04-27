/**
 * Automation Endpoints
 * Handles testing and execution of Cofounder automations
 * Version: 1.1 - Fixed initialization
 */

import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { storeAutomationResult } from './automation-storage.tsx';

const automationRouter = new Hono();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

/**
 * Load chat history for context
 */
async function loadChatHistory(userId: string, businessId: string) {
  try {
    const historyKeys = await kv.getByPrefix(`chat_history:${userId}:${businessId}`);
    if (historyKeys && historyKeys.length > 0) {
      // Get most recent 20 messages for context
      const messages = historyKeys
        .map(item => {
          // KV store returns objects directly (JSONB)
          if (typeof item.value === 'object') {
            return item.value;
          }
          return JSON.parse(item.value);
        })
        .flat()
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
      return messages;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading chat history:', error);
    return [];
  }
}

/**
 * Load business context
 */
async function loadBusinessContext(userId: string, businessId: string) {
  try {
    const contextKey = `business_context:${userId}:${businessId}`;
    const contextData = await kv.get(contextKey);
    if (contextData) {
      // KV store returns objects directly (JSONB)
      if (typeof contextData === 'object') {
        return contextData;
      }
      return JSON.parse(contextData);
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading business context:', error);
    return null;
  }
}

/**
 * Load relevant data based on automation type
 */
async function loadAutomationData(userId: string, businessId: string, automationId: string) {
  const data: any = {};

  try {
    // Load based on automation category
    if (automationId.includes('product') || automationId.includes('roadmap')) {
      // Load roadmap data
      const roadmapData = await kv.getByPrefix(`roadmap:${userId}:${businessId}`);
      data.roadmap = roadmapData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('sales') || automationId.includes('lead') || automationId.includes('deal')) {
      // Load sales data
      const salesData = await kv.getByPrefix(`sales:${userId}:${businessId}`);
      data.sales = salesData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('marketing') || automationId.includes('campaign')) {
      // Load marketing data
      const marketingData = await kv.getByPrefix(`marketing:${userId}:${businessId}`);
      data.marketing = marketingData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('finance') || automationId.includes('expense') || automationId.includes('cash')) {
      // Load finance data
      const financeData = await kv.getByPrefix(`finance:${userId}:${businessId}`);
      data.finance = financeData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('hr') || automationId.includes('handbook') || automationId.includes('onboarding')) {
      // Load HR data
      const hrData = await kv.getByPrefix(`hr:${userId}:${businessId}`);
      data.hr = hrData?.map(item => JSON.parse(item.value)) || [];
    }

    return data;
  } catch (error) {
    console.error('❌ Error loading automation data:', error);
    return data;
  }
}

/**
 * Get automation category from automation ID
 */
function getAutomationCategory(automationId: string): string {
  const categoryMap: Record<string, string> = {
    // Product
    'product-market-monitoring': 'product',
    'feature-prioritization': 'product',
    'user-feedback-synthesis': 'product',
    'roadmap-health-check': 'product',
    
    // Sales
    'lead-scoring-refresh': 'sales',
    'pipeline-forecast-analysis': 'sales',
    'outreach-performance-review': 'sales',
    'stalled-deal-detection': 'sales',
    'follow-up-queue-builder': 'sales',
    
    // Marketing
    'campaign-performance-audit': 'marketing',
    'competitive-intelligence': 'marketing',
    'content-calendar-generator': 'marketing',
    'seo-content-suggestions': 'marketing',
    'marketing-metrics-digest': 'marketing',
    
    // Finance
    'expense-review-categorization': 'finance',
    'cash-runway-forecast': 'finance',
    'invoice-collection-monitor': 'finance',
    'financial-statement-generator': 'finance',
    'budget-variance-tracking': 'finance',
    'tax-optimization-scanner': 'finance',
    
    // HR
    'policy-compliance-check': 'hr',
    'onboarding-readiness-check': 'hr',
    'performance-review-prep': 'hr',
    'team-engagement-insights': 'hr',
    
    // General
    'daily-business-brief': 'general',
    'missing-task-identifier': 'general',
    'deadline-risk-scanner': 'general',
    'cross-department-sync': 'general'
  };

  return categoryMap[automationId] || 'general';
}

/**
 * Format automation ID into readable title
 */
function formatAutomationTitle(automationId: string) {
  const titles: Record<string, string> = {
    'product-market-monitoring': 'Product Market Monitoring',
    'feature-prioritization': 'Feature Prioritization',
    'user-feedback-synthesis': 'User Feedback Synthesis',
    'roadmap-health-check': 'Roadmap Health Check',
    'lead-scoring-refresh': 'Lead Scoring Refresh',
    'pipeline-forecast-analysis': 'Pipeline Forecast Analysis',
    'outreach-performance-review': 'Outreach Performance Review',
    'stalled-deal-detection': 'Stalled Deal Detection',
    'follow-up-queue-builder': 'Follow-up Queue Builder',
    'campaign-performance-audit': 'Campaign Performance Audit',
    'competitive-intelligence': 'Competitive Intelligence',
    'content-calendar-generator': 'Content Calendar Generator',
    'seo-content-suggestions': 'SEO Content Suggestions',
    'marketing-metrics-digest': 'Marketing Metrics Digest',
    'expense-review-categorization': 'Expense Review Categorization',
    'cash-runway-forecast': 'Cash Runway Forecast',
    'invoice-collection-monitor': 'Invoice Collection Monitor',
    'financial-statement-generator': 'Financial Statement Generator',
    'budget-variance-tracking': 'Budget Variance Tracking',
    'tax-optimization-scanner': 'Tax Optimization Scanner',
    'policy-compliance-check': 'Policy Compliance Check',
    'onboarding-readiness-check': 'Onboarding Readiness Check',
    'performance-review-prep': 'Performance Review Prep',
    'team-engagement-insights': 'Team Engagement Insights',
    'daily-business-brief': 'Daily Business Brief',
    'missing-task-identifier': 'Missing Task Identifier',
    'deadline-risk-scanner': 'Deadline Risk Scanner',
    'cross-department-sync': 'Cross-Department Sync'
  };

  return titles[automationId] || 'Automation';
}

/**
 * Get automation prompt based on automation ID
 */
function getAutomationPrompt(automationId: string, context: any) {
  const userInput = context.userInput || {};
  
  // Generic comprehensive prompt that works for all automations
  return `You are a business automation assistant analyzing data for: ${formatAutomationTitle(automationId)}

**User Configuration:**
${JSON.stringify(userInput, null, 2)}

**Business Context:**
${JSON.stringify(context.business, null, 2)}

**Relevant Data:**
${JSON.stringify(context.data, null, 2)}

**Recent Activity:**
${JSON.stringify(context.chatHistory?.slice(0, 5), null, 2)}

Provide detailed, actionable insights based on the automation type. Format responses as JSON when appropriate for structured data (like scores, lists, or reports). Include specific recommendations and next steps.`;
}

/**
 * Call GPT-4o to execute automation
 */
async function executeAutomation(automationId: string, context: any) {
  try {
    const prompt = getAutomationPrompt(automationId, context);

    console.log(`🤖 Executing automation: ${automationId}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a business automation assistant. Provide detailed, actionable insights based on the data provided. Format responses as JSON when appropriate for structured data (like scores, lists, or reports).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content;

    console.log(`✅ Automation ${automationId} completed`);

    return result;
  } catch (error: any) {
    console.error(`❌ Error executing automation ${automationId}:`, error);
    throw error;
  }
}

/**
 * POST /automations/test
 * Test an automation with current business data
 */
automationRouter.post('/automations/test', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const { businessId, automationId, userInput } = await c.req.json();

    if (!businessId || !automationId) {
      return c.json({ 
        success: false, 
        error: 'businessId and automationId are required' 
      }, 400);
    }

    console.log(`🧪 Testing automation: ${automationId} for business: ${businessId}`);
    if (userInput) {
      console.log('📝 User input provided:', JSON.stringify(userInput, null, 2));
    }

    // Create "running" notification
    const notificationId = `automation_notification:${user.id}:${businessId}:${automationId}:${Date.now()}`;
    const runningNotification = {
      id: notificationId,
      type: 'automation_run',
      businessId,
      automationId,
      title: `Running ${formatAutomationTitle(automationId)}`,
      message: 'Your automation is currently processing...',
      priority: 'normal',
      category: 'general',
      status: 'running',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    await kv.set(notificationId, runningNotification);
    console.log(`📬 Created running notification: ${notificationId}`);

    // Load all context
    const [chatHistory, businessContext, automationData] = await Promise.all([
      loadChatHistory(user.id, businessId),
      loadBusinessContext(user.id, businessId),
      loadAutomationData(user.id, businessId, automationId)
    ]);

    const context = {
      chatHistory,
      business: businessContext,
      data: automationData,
      userInput: userInput || {} // Include user input in context
    };

    // Execute automation
    const result = await executeAutomation(automationId, context);

    // Get credit cost from automation definition
    const creditCosts: Record<string, number> = {
      'product-market-monitoring': 80,
      'feature-prioritization': 50,
      'user-feedback-synthesis': 40,
      'roadmap-health-check': 60,
      'lead-scoring-refresh': 30,
      'pipeline-forecast-analysis': 50,
      'outreach-performance-review': 40,
      'stalled-deal-detection': 30,
      'follow-up-queue-builder': 20,
      'campaign-performance-audit': 70,
      'competitive-intelligence': 60,
      'content-calendar-generator': 50,
      'seo-content-suggestions': 50,
      'marketing-metrics-digest': 40,
      'expense-review-categorization': 20,
      'cash-runway-forecast': 50,
      'invoice-collection-monitor': 30,
      'financial-statement-generator': 40,
      'budget-variance-tracking': 30,
      'tax-optimization-scanner': 60,
      'policy-compliance-check': 80,
      'onboarding-readiness-check': 40,
      'performance-review-prep': 50,
      'team-engagement-insights': 40,
      'daily-business-brief': 50,
      'missing-task-identifier': 20,
      'deadline-risk-scanner': 30,
      'cross-department-sync': 20
    };

    const creditsUsed = creditCosts[automationId] || 50;

    // Store result using automation storage helper
    const resultKey = await storeAutomationResult(user.id, businessId, automationId, result, userInput);

    // Get category for the automation
    const automationCategory = getAutomationCategory(automationId);

    // Update notification to "completed" status
    const completedNotification = {
      id: notificationId,
      type: 'automation_complete',
      businessId,
      automationId,
      title: `${formatAutomationTitle(automationId)} Complete`,
      message: 'Your automation has finished running successfully.',
      priority: 'normal',
      category: automationCategory,
      status: 'completed',
      actionLabel: 'View Results',
      resultKey,
      creditsUsed,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    await kv.set(notificationId, completedNotification);
    console.log(`📬 Updated notification to completed: ${notificationId}`);

    console.log(`✅ Automation test completed: ${automationId}`);

    return c.json({
      success: true,
      result,
      creditsUsed,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Automation test error:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to execute automation' 
    }, 500);
  }
});

/**
 * GET /automations/results/:category
 * Get automation results by category
 */
automationRouter.get('/automations/results/:category', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const category = c.req.param('category');
    const businessId = c.req.query('businessId');
    const storageType = c.req.query('type') as 'report' | 'data' | 'tasks' | 'insights' | undefined;

    if (!businessId) {
      return c.json({ 
        success: false, 
        error: 'businessId is required' 
      }, 400);
    }

    const { getAutomationResultsByCategory } = await import('./automation-storage.tsx');
    const results = await getAutomationResultsByCategory(user.id, businessId, category, storageType);

    return c.json({
      success: true,
      results,
      count: results.length,
      category,
      storageType: storageType || 'all'
    });

  } catch (error: any) {
    console.error('❌ Error fetching automation results:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to fetch results' 
    }, 500);
  }
});

/**
 * GET /automations/latest/:automationId
 * Get latest result for specific automation
 */
automationRouter.get('/automations/latest/:automationId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const automationId = c.req.param('automationId');
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ 
        success: false, 
        error: 'businessId is required' 
      }, 400);
    }

    const { getLatestAutomationResult } = await import('./automation-storage.tsx');
    const result = await getLatestAutomationResult(user.id, businessId, automationId);

    if (!result) {
      return c.json({
        success: false,
        error: 'No results found for this automation'
      }, 404);
    }

    return c.json({
      success: true,
      result,
      automationId
    });

  } catch (error: any) {
    console.error('❌ Error fetching latest automation result:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to fetch result' 
    }, 500);
  }
});

export default automationRouter;
