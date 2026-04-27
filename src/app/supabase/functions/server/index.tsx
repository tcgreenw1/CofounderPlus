// CRITICAL: Silence ALL console output BEFORE any imports to prevent JSON corruption
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  debug: console.debug,
  error: console.error
};

// IMMEDIATE console silencing - must be first
// BUT: Allow business-context and AI endpoint debugging temporarily
console.log = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('business context') || msg.includes('Business context') || 
      msg.includes('📋') || msg.includes('🤖') || msg.includes('🔧') || 
      msg.includes('✅') || msg.includes('Tool calls') || msg.includes('Executing tool') ||
      msg.includes('Team member') || msg.includes('Function') || 
      msg.includes('OpenAI') || msg.includes('Enhanced Chat') || 
      msg.includes('Available tools') || msg.includes('hasToolCalls') ||
      msg.includes('transaction') || msg.includes('Transaction') ||
      msg.includes('Sales lead') || msg.includes('Budget') || 
      msg.includes('Marketing campaign') || msg.includes('Roadmap task') ||
      msg.includes('Note created') || msg.includes('📝') || msg.includes('Notes:') ||
      msg.includes('Organization') || msg.includes('organization') ||
      msg.includes('Notification') || msg.includes('notification') || msg.includes('ℹ️') ||
      msg.includes('APNS') || msg.includes('Push') || msg.includes('📱') || msg.includes('🔍') ||
      msg.includes('Supabase OAuth') || msg.includes('🔗') ||
      msg.includes('Build Preview') || msg.includes('🏗️') || msg.includes('🎨') ||
      msg.includes('📦') || msg.includes('🏭') || msg.includes('🔄') ||
      msg.includes('Products') || msg.includes('products') || msg.includes('MergedProductsView') ||
      msg.includes('Support') || msg.includes('support') || msg.includes('Ticket') || msg.includes('ticket') || msg.includes('🎫') ||
      msg.includes('Notification') || msg.includes('notification') || msg.includes('📬') ||
      msg.includes('Auth request failed') || msg.includes('retrying') ||
      msg.includes('📅') || msg.includes('Fetching availability') || msg.includes('booking') || msg.includes('Booking')) {
    originalConsole.log(...args);
  }
};
console.info = () => {};
console.debug = () => {};
console.warn = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('Tool call') || msg.includes('⚠️') || 
      msg.includes('Notes') || msg.includes('Organization') ||
      msg.includes('Notification') || msg.includes('APNS') || msg.includes('Push') ||
      msg.includes('Auth request failed') || msg.includes('retrying')) {
    originalConsole.warn(...args);
  }
};
console.error = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('business context') || msg.includes('Business context') || 
      msg.includes('❌') || msg.includes('Tool') || msg.includes('tool') ||
      msg.includes('Notes') || msg.includes('notes') || 
      msg.includes('Organization') || msg.includes('organization') ||
      msg.includes('Notification') || msg.includes('notification') ||
      msg.includes('APNS') || msg.includes('Push') ||
      msg.includes('Failed') || msg.includes('Error')) {
    originalConsole.error(...args);
  }
};

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_cache.tsx';
// import * as kvCache from './kv_cache.tsx'; // Redundant - using kv alias for cache wrapper

// Import notes endpoints
import { addNotesEndpoints } from './notes-endpoints.tsx';

// Import roadmap endpoints
import { addRoadmapEndpoints } from './roadmap-endpoints.tsx';

// Import product endpoints
import { addProductEndpoints } from './product-endpoints.tsx';

// Import cofounder product endpoints
import { addCofounderProductEndpoints } from './cofounder-product-endpoints.tsx';

// Import finance endpoints
import { addFinanceEndpoints } from './finance-endpoints.tsx';

// Import HR endpoints
import { addHREndpoints } from './hr-endpoints.tsx';

// Import team endpoints
import { addTeamEndpoints } from './team-endpoints.tsx';

// Import founder call booking endpoints
import founderCallRoutes from './founder-call-endpoints.tsx';

// Stub functions for removed endpoints - these files don't exist anymore
const addUniversityEndpoints = () => {};

// Import account deletion routes
import accountDeletionRoutes from './account-deletion.tsx';

// Import streak routes
import streakApp from './streak-endpoints.tsx';

// Import beta routes
import { betaRouter } from './beta-endpoints.tsx';

// Import notification routes (DISABLED - imported later as notificationRouter at line 153)
// import notificationApp from './notification-endpoints.tsx';

// Import customization routes
import customizationRoutes from './customization-endpoints.tsx';

// Import subscription management routes
import subscriptionManagementRoutes from './subscription-management-endpoints.tsx';

// Import dream board routes
import { dreamBoardRoutes } from './dream-board-endpoints.tsx';

// Import Plaid bank endpoints (replaced Stripe Financial Connections)
import plaidBankRoutes from './plaid-bank-endpoints.tsx';

// Import Getting Started Checklist endpoints
import checklistRouter from './checklist-endpoints.tsx';

// Import HubSpot OAuth endpoints
import { addHubSpotOAuthEndpoints } from './hubspot-oauth-endpoints.tsx';

// Import Salesforce OAuth endpoints
import { addSalesforceOAuthEndpoints } from './salesforce-oauth-endpoints.tsx';

// Import Google OAuth endpoints
import { addGoogleOAuthEndpoints } from './google-oauth-endpoints.tsx';

// Import GitHub OAuth endpoints
import { addGitHubOAuthEndpoints } from './github-oauth-endpoints.tsx';

// Import Admin endpoints (includes bulk operations)
import { addAdminEndpoints } from './admin-endpoints.tsx';

// Import Calendar endpoints
import { addCalendarEndpoints } from './calendar-endpoints.tsx';

// Import Slack endpoints
import { addSlackEndpoints } from './slack-endpoints.tsx';

// Import IAP endpoints
import iapRoutes from './iap-endpoints.tsx';

// Import email 2FA endpoints
import email2FARoutes from './email-2fa-endpoints.tsx';

// Import bookkeeping endpoints - Last updated 2025-01-16 15:30 UTC
import bookkeepingRoutes from './bookkeeping-endpoints.tsx';

// Import product research endpoints
import productResearchRoutes from './product-research-endpoints.tsx';

// Import ecommerce product endpoints
import ecommerceProductRoutes from './ecommerce-product-endpoints.tsx';

// Import marketing endpoints
import marketingRoutes from './marketing-endpoints.tsx';

// Import product marketing endpoints
import productMarketingRoutes from './product-marketing-endpoints.tsx';

// Import sales endpoints
import salesRouter from './sales-endpoints.tsx';

// Import business health endpoints
import { getBusinessHealthScore } from './business-health-endpoints.tsx';

// Import industry benchmark endpoints
import { getIndustryBenchmarks } from './industry-benchmark-endpoints.tsx';

// Import NEW V3 clean team system (ONLY team invitation system - Resend removed, Supabase only)
import teamV3Router from './team-v3-clean.tsx';

// Import Organization endpoints
import orgRouter from './organization-endpoints.tsx';

// Import Notification endpoints
import notificationRouter from './notification-endpoints.tsx';

// Import Push Notification endpoints (APNS)
import { pushNotificationApp } from './push-notification-endpoints.tsx';

// Import Cofounder Settings endpoints
import cofounderSettingsRouter from './cofounder-settings-endpoints.tsx';

// Import Automation endpoints
import automationRouter from './automation-endpoints.tsx';

// Import Dashboard Widget endpoints
import dashboardWidgetRoutes from './dashboard-widget-endpoints.tsx';

// Import Job Application endpoints
import jobApplicationRoutes from './job-application-endpoints.tsx';

// Import Mastery Refresh endpoints
import masteryRefreshRoutes from './mastery-refresh-endpoint.tsx';

// Import Credits endpoints
import creditsRoutes from './credits-endpoints.tsx';

// Import Todo endpoints
import todoRoutes from './todo-endpoints.tsx';

// Import Credits 10x Migration endpoint
import credits10xMigrationApp from './credits-10x-migration.tsx';

// Import Credit Diagnostic endpoint
import creditDiagnosticApp from './credit-diagnostic-endpoint.tsx';

// Import Credit Renewal endpoints and scheduler
import creditRenewalApp from './credit-renewal-endpoints.tsx';
import { startCreditRenewalScheduler } from './credit-renewal-scheduler.tsx';

// Import Subscription Lifecycle Notifications
import { startRenewalReminderScheduler } from './subscription-lifecycle-notifications.tsx';

// Import Subscription Webhook Handler
import subscriptionWebhookRouter from './subscription-webhook-handler.tsx';

// GPT-5.1 CHAT ENDPOINT - New function calling format with tool_calls (CONSOLIDATED - All chats use this)
import gpt51ChatEndpoint from './gpt-5-1-chat-endpoint.tsx';

// DATA DIAGNOSTIC ENDPOINT - Verify CRUD functions are working
import dataDiagnosticEndpoint from './data-diagnostic-endpoint.tsx';

// BUSINESS MEMORY - Extract and store business details from conversations
import businessMemoryRoutes from './business-memory-endpoints.tsx';

// CPA CHAT - Finance CPA services with ChatGPT (LEGACY - keeping for backward compatibility)
import cpaChat from './cpa-chat-endpoints.tsx';

// CLAUDE MAKE - Claude AI integration for Cofounder Make
import { claudeMakeApp } from './claude-make-endpoints.tsx';

// BUILD PREVIEW - Generate preview builds for Cofounder Make
import { buildPreviewApp } from './build-preview-endpoints.tsx';

// SQUARESPACE PUBLISH - Publish builds to Squarespace with DNS configuration
import { squarespacePublishApp } from './squarespace-publish-endpoints.tsx';

// SUPABASE OAUTH - Connect user's own Supabase accounts for Cofounder Make
import supabaseOAuthApp from './supabase-oauth-endpoints.tsx';

// OpenAI Response Extractor utility
import { extractOpenAIResponse } from './openai-response-extractor.tsx';

// Chat Memory Helpers - Unified memory system
import { loadUnifiedMemory } from './chat-memory-helpers.tsx';
import { buildSystemMessage } from './chat-system-message.tsx';

import supportChatRouter from './support-chat-endpoints.tsx';
import supportRouter from './support-endpoints.tsx';

// Helper function: Retry auth requests with exponential backoff
async function retryAuthRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error?.message || String(error);
      
      // Check if it's a connection error that should be retried
      const shouldRetry = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout');
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`⚠️ Auth request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

// Simple fallback routes - these files don't exist anymore
const openaiRoutes = new Hono();

// Add OpenAI chat endpoint to the stub router
openaiRoutes.post('/chat', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create auth client for this request with token in headers
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    // Retry auth request to handle connection resets
    const { data: { user }, error: authError } = await retryAuthRequest(() => 
      authClient.auth.getUser()
    );
    
    if (authError || !user) {
      return c.json({ error: 'Invalid authorization' }, 401);
    }

    const body = await c.req.json();
    const { message, sessionId, businessId } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Make request to OpenAI
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        input: [
          {
            role: 'system',
            content: 'You are a helpful business assistant for Cofounder, helping entrepreneurs build and grow their businesses. IMPORTANT: You are specifically running on GPT-5.1, OpenAI\'s most advanced reasoning model. When asked about what model you\'re using, always respond with "GPT-5.1" (not 4.1, not GPT-4o, not any other version).'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_output_tokens: 1000,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ 
        error: `OpenAI request failed with status ${response.status}: ${error}` 
      }, response.status);
    }

    const data = await response.json();
    
    // Use centralized response extraction utility
    const aiResponse = extractOpenAIResponse(data);

    // Save message to KV store
    if (sessionId && businessId) {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        id: messageId,
        user_message: message,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_id: user.id,
        business_id: businessId
      };
      await kv.set(`ai_chat_message:${user.id}:${sessionId}:${messageId}`, JSON.stringify(messageData));
    }

    return c.json({
      response: aiResponse,
      sessionId: sessionId || `session_${Date.now()}`
    });

  } catch (error: any) {
    return c.json({ 
      error: error.message || 'Failed to process chat message' 
    }, 500);
  }
});

const stripeSupabaseSync = new Hono();
const performStripeSync = async () => {};

const app = new Hono();

// Middleware - CORS must be first
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

// Cache prewarming middleware - must be early to warm cache before endpoints use it
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      // Try to get user ID from token
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!
      );
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      
      if (user && !kv.isCacheWarmed(user.id)) {
        // Prewarm cache in background (don't await)
        kv.prewarmUserCache(user.id);
      }
    } catch (error) {
      // Silently ignore auth errors in middleware
    }
  }
  await next();
});

// Request logging middleware for debugging
app.use('*', async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;
  console.log(`📥 Incoming request: ${method} ${path}`);
  
  // Log specifically for team endpoints
  if (path.includes('/team-v3/')) {
    console.log(`👥 TEAM ENDPOINT REQUEST: ${method} ${path}`);
    console.log(`🔑 Auth:`, c.req.header('Authorization') ? 'Present' : 'Missing');
  }
  
  // Log specifically for user profile endpoint
  if (path.includes('/user/profile')) {
    console.log(`🔍 USER PROFILE REQUEST: ${method} ${path}`);
    console.log(`🔍 Headers:`, c.req.header('Authorization') ? 'Has Auth' : 'No Auth');
  }
  
  await next();
});

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Create Supabase clients with error handling
let supabase: any = null;
let supabaseAuth: any = null;

try {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (error) {
  // Silent error handling
}

// Helper functions
function isAdminEmail(email: string): boolean {
  const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
  return adminEmails.includes(email);
}

function isAnonKey(token: string): boolean {
  return token === SUPABASE_ANON_KEY || (!token.startsWith('eyJ') && token.length > 100);
}

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Failed to decode JWT payload');
  }
}

// Helper function to get current organization ID for a user
async function getCurrentOrganizationId(userId: string): Promise<string> {
  try {
    const contextKey = `user_current_org:${userId}`;
    const context = await kv.get(contextKey);
    
    if (!context) {
      // No org context set, user is in their own organization
      return userId;
    }
    
    const parsedContext = typeof context === 'string' ? JSON.parse(context) : context;
    return parsedContext.organizationId || userId;
  } catch (error) {
    console.error('❌ Error getting current organization:', error);
    // Fallback to user's own organization on error
    return userId;
  }
}

// Helper function to get user from auth token (for AI endpoints)
async function getUserFromAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    // Use retry logic for auth requests
    const { data: { user }, error } = await retryAuthRequest(() => 
      supabaseAuth.auth.getUser(token)
    );
    return error ? null : user;
  } catch {
    return null;
  }
}

async function verifyUserAccess(accessToken: string) {
  if (!accessToken) {
    throw new Error('No access token provided');
  }

  if (isAnonKey(accessToken)) {
    throw new Error('Anonymous access not allowed for this endpoint');
  }

  // Enhanced Anon Check: Decode to check role before doing anything else
  try {
    const parts = accessToken.split('.');
    if (parts.length === 3) {
      // Simple base64 decode to check role without verification first
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'anon') {
        throw new Error('Anonymous access not allowed for this endpoint (role: anon)');
      }
    }
  } catch (e) {
    // Continue if decode fails - verifyUserAccess will catch it later
  }

  if (!accessToken.startsWith('eyJ')) {
    throw new Error('Invalid token format - expected JWT');
  }

  try {
    if (supabaseAuth) {
      try {
        // Use retry logic for auth requests
        const { data: { user }, error } = await retryAuthRequest(() => 
          supabaseAuth.auth.getUser(accessToken)
        );
        if (!error && user) {
          console.log('✅ verifyUserAccess: Successfully verified user via Supabase:', user.id);
          return user;
        }
        console.log('⚠️ verifyUserAccess: Supabase getUser failed, falling back to JWT decode:', error?.message);
      } catch (supabaseError) {
        console.log('⚠️ verifyUserAccess: Supabase error, falling back to JWT decode:', supabaseError.message);
        // Fall through to manual JWT decoding
      }
    }
    
    console.log('🔍 verifyUserAccess: Attempting manual JWT decode...');
    const payload = decodeJWT(accessToken);
    console.log('🔍 verifyUserAccess: JWT payload:', {
      sub: payload.sub,
      user_id: payload.user_id,
      email: payload.email,
      aud: payload.aud,
      role: payload.role,
      exp: payload.exp,
      iat: payload.iat,
      allKeys: Object.keys(payload)
    });
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }
    
    const userId = payload.sub || payload.user_id;
    const userEmail = payload.email;
    
    if (!userId) {
      console.error('❌ verifyUserAccess: No user ID found in token payload:', payload);
      throw new Error('No user ID found in token');
    }
    
    const user = {
      id: userId,
      email: userEmail,
      user_metadata: payload.user_metadata || {},
      created_at: payload.created_at || new Date(payload.iat * 1000).toISOString(),
      aud: payload.aud,
      role: payload.role,
      session_id: payload.session_id
    };

    console.log('✅ verifyUserAccess: Successfully created user from JWT:', user.id);
    return user;
  } catch (error) {
    console.error('❌ verifyUserAccess error:', error.message);
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

// Mount support chat router
app.route('/make-server-373d8b09/support/chat', supportChatRouter);
app.route('/make-server-373d8b09/support', supportRouter);

// DEVELOPMENT SERVER ROUTES - Mirror all production routes
// AI modifications should target the shared /server/ codebase
// Development server provides isolated testing environment
app.route('/make-server-development/support/chat', supportChatRouter);
app.route('/make-server-development/support', supportRouter);

// Ping endpoint for business server
app.get('/make-server-ac1075a9/ping', async (c) => {
  return c.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString(),
    server: 'business-api'
  });
});

// Test endpoint for business server
app.get('/make-server-ac1075a9/test', async (c) => {
  return c.json({ 
    status: 'server-online', 
    timestamp: new Date().toISOString(),
    service: 'business-server'
  });
});

// Business management endpoints
app.get('/make-server-ac1075a9/businesses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);

    const businessesRaw = await kv.getByPrefix(`business:${user.id}:`) || [];
    const businesses = businessesRaw.map((b: string) => JSON.parse(b));
    
    return c.json({ businesses });

  } catch (error) {
    return c.json({ error: `Error getting businesses: ${error.message}` }, 500);
  }
});

app.post('/make-server-ac1075a9/businesses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);

    const businessData = await c.req.json();

    if (!businessData.name?.trim()) {
      return c.json({ error: 'Business name is required' }, 400);
    }

    const businessId = `biz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const business = {
      id: businessId,
      name: businessData.name.trim(),
      industry: businessData.industry || 'Other',
      description: businessData.description?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id
    };

    await kv.set(`business:${user.id}:${businessId}`, JSON.stringify(business));
    
    return c.json({ business });

  } catch (error) {
    return c.json({ error: `Error creating business: ${error.message}` }, 500);
  }
});

app.put('/make-server-ac1075a9/businesses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    const businessId = c.req.param('id');

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    const existingBusinessStr = await kv.get(`business:${user.id}:${businessId}`);
    if (!existingBusinessStr) {
      return c.json({ error: 'Business not found' }, 404);
    }

    const existingBusiness = JSON.parse(existingBusinessStr);
    const updateData = await c.req.json();
    
    const updatedBusiness = {
      ...existingBusiness,
      ...updateData,
      id: businessId,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    await kv.set(`business:${user.id}:${businessId}`, JSON.stringify(updatedBusiness));
    
    return c.json({ business: updatedBusiness });

  } catch (error) {
    return c.json({ error: `Error updating business: ${error.message}` }, 500);
  }
});

app.delete('/make-server-ac1075a9/businesses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization token is required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const businessId = c.req.param('id');

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log(`🗑️ Attempting to delete business ${businessId} for user ${user.id}`);
    
    // Debug: List all businesses for this user to see what exists
    const allBusinessesRaw = await kv.getByPrefix(`business:${user.id}:`) || [];
    const allBusinesses = allBusinessesRaw.map((b: string) => JSON.parse(b));
    console.log(`🔍 Found ${allBusinesses.length} businesses for user:`, allBusinesses.map(b => ({ id: b.id, name: b.name })));
    
    const businessKey = `business:${user.id}:${businessId}`;
    console.log(`🔑 Looking for business with key: ${businessKey}`);
    
    const existingBusinessStr = await kv.get(businessKey);
    if (!existingBusinessStr) {
      console.log(`❌ Business not found with key: ${businessKey}`);
      console.log(`🔍 Available business keys:`, allBusinesses.map(b => `business:${user.id}:${b.id}`));
      return c.json({ error: `Business not found. Looking for key: ${businessKey}` }, 404);
    }

    const existingBusiness = JSON.parse(existingBusinessStr);
    console.log(`✅ Found business to delete: ${existingBusiness.name}`);

    // Delete the main business record
    await kv.del(`business:${user.id}:${businessId}`);
    console.log(`🗑️ Deleted main business record`);

    // Clean up related data
    try {
      // Delete finance data
      const financeKeys = [
        `bank_balance:${user.id}:${businessId}`,
        `finance_summary:${user.id}:${businessId}`
      ];
      
      for (const key of financeKeys) {
        await kv.del(key);
      }

      // Delete transactions, invoices, budgets
      const transactionKeysRaw = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      const transactionKeys = transactionKeysRaw.map((t: string) => JSON.parse(t));
      for (const transaction of transactionKeys) {
        await kv.del(`transaction:${user.id}:${businessId}:${transaction.id}`);
      }

      const invoiceKeysRaw = await kv.getByPrefix(`invoice:${user.id}:${businessId}:`) || [];
      const invoiceKeys = invoiceKeysRaw.map((i: string) => JSON.parse(i));
      for (const invoice of invoiceKeys) {
        await kv.del(`invoice:${user.id}:${businessId}:${invoice.id}`);
      }

      const budgetKeysRaw = await kv.getByPrefix(`budget:${user.id}:${businessId}:`) || [];
      const budgetKeys = budgetKeysRaw.map((b: string) => JSON.parse(b));
      for (const budget of budgetKeys) {
        await kv.del(`budget:${user.id}:${businessId}:${budget.id}`);
      }

      // Delete notes
      const noteKeysRaw = await kv.getByPrefix(`note:${user.id}:${businessId}:`) || [];
      const noteKeys = noteKeysRaw.map((n: string) => JSON.parse(n));
      for (const note of noteKeys) {
        await kv.del(`note:${user.id}:${businessId}:${note.id}`);
      }

      console.log(`🧹 Cleaned up related data: ${transactionKeys.length} transactions, ${invoiceKeys.length} invoices, ${budgetKeys.length} budgets, ${noteKeys.length} notes`);
      
    } catch (cleanupError) {
      console.warn(`⚠️ Error during cleanup (business still deleted):`, cleanupError);
    }
    
    console.log(`✅ Business ${businessId} deleted successfully`);
    return c.json({ 
      success: true, 
      message: 'Business and all related data deleted successfully',
      deletedBusiness: existingBusiness
    });

  } catch (error) {
    console.error(`❌ Error deleting business:`, error);
    return c.json({ error: `Error deleting business: ${error.message}` }, 500);
  }
});

// ==============================================================================
// NEW BUSINESS ENDPOINTS - Updated prefix make-server-373d8b09
// ==============================================================================

app.get('/make-server-373d8b09/businesses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);

    // Get user's current organization context
    const contextKey = `user_current_org:${user.id}`;
    const context = await kv.get(contextKey);
    
    let organizationId = user.id; // Default to own organization
    if (context) {
      const parsedContext = typeof context === 'string' ? JSON.parse(context) : context;
      organizationId = parsedContext.organizationId || user.id;
    }
    
    console.log(`📋 Fetching businesses for organization: ${organizationId} (user: ${user.id})`);

    // getByPrefix may return strings (old format) or objects (new format)
    // Fetch businesses for the ORGANIZATION, not just the user
    const businessesRaw = await kv.getByPrefix(`business:${organizationId}:`) || [];
    
    // Handle both old format (stringified) and new format (objects)
    const businesses = businessesRaw.map((b: any) => {
      if (typeof b === 'string') {
        try {
          return JSON.parse(b); // Old format: stored as stringified JSON
        } catch (e) {
          console.error('Failed to parse business:', b);
          return null;
        }
      }
      return b; // New format: already an object
    }).filter(Boolean); // Remove any null values from parse errors
    
    // CRITICAL FIX: Filter out temporary businesses, board IDs, and other non-business data
    // Only filter if id exists and actually starts with 'temp-' or 'board_'
    const validBusinesses = businesses.filter((b: any) => {
      if (!b || !b.id) {
        console.warn('📋 Found business without ID, filtering out');
        return false;
      }
      const id = b.id.toString();
      const isTemp = id.startsWith('temp-');
      const isBoard = id.startsWith('board_');
      
      if (isTemp) {
        console.warn(`📋 Filtering out temp business: ${b.id}`);
      }
      if (isBoard) {
        console.warn(`📋 Filtering out board ID from business list: ${b.id}`);
      }
      
      return !isTemp && !isBoard;
    });
    
    if (validBusinesses.length !== businesses.length) {
      console.log(`businessApi: Filtered out ${businesses.length - validBusinesses.length} invalid/temporary businesses/boards`);
    }
    
    console.log(`📋 Retrieved ${validBusinesses.length} businesses for organization ${organizationId}`);
    console.log(`📋 Business IDs: ${validBusinesses.map((b: any) => b.id).join(', ')}`);
    
    return c.json({ businesses: validBusinesses });

  } catch (error) {
    console.error('❌ Error getting businesses:', error);
    return c.json({ error: `Error getting businesses: ${error.message}` }, 500);
  }
});

app.post('/make-server-373d8b09/businesses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);

    // Get user's current organization
    const organizationId = await getCurrentOrganizationId(user.id);
    console.log(`📋 Creating business for organization: ${organizationId} (user: ${user.id})`);

    const businessData = await c.req.json();

    if (!businessData.name?.trim()) {
      return c.json({ error: 'Business name is required' }, 400);
    }

    const businessId = `biz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const business = {
      id: businessId,
      name: businessData.name.trim(),
      industry: businessData.industry || 'Other',
      description: businessData.description?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
      organization_id: organizationId // Store which organization this business belongs to
    };

    // Store business under the ORGANIZATION, not just the user
    await kv.set(`business:${organizationId}:${businessId}`, business);
    
    console.log(`✅ Created business: ${business.name} (ID: ${businessId}) for organization ${organizationId}`);
    
    return c.json({ business });

  } catch (error) {
    console.error('❌ Error creating business:', error);
    return c.json({ error: `Error creating business: ${error.message}` }, 500);
  }
});

app.put('/make-server-373d8b09/businesses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    const businessId = c.req.param('id');

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    // Get user's current organization
    const organizationId = await getCurrentOrganizationId(user.id);

    // kv.get may return string (old format) or object (new format)
    let existingBusinessRaw = await kv.get(`business:${organizationId}:${businessId}`);
    if (!existingBusinessRaw) {
      return c.json({ error: 'Business not found' }, 404);
    }

    // Handle both old and new format
    const existingBusiness = typeof existingBusinessRaw === 'string' 
      ? JSON.parse(existingBusinessRaw) 
      : existingBusinessRaw;

    const updateData = await c.req.json();
    
    const updatedBusiness = {
      ...existingBusiness,
      ...updateData,
      id: businessId,
      user_id: user.id,
      organization_id: organizationId,
      updated_at: new Date().toISOString()
    };

    // Store as object under the organization
    await kv.set(`business:${organizationId}:${businessId}`, updatedBusiness);
    
    console.log(`✅ Updated business: ${updatedBusiness.name} (ID: ${businessId}) for organization ${organizationId}`);
    
    return c.json({ business: updatedBusiness });

  } catch (error) {
    console.error('❌ Error updating business:', error);
    return c.json({ error: `Error updating business: ${error.message}` }, 500);
  }
});

app.delete('/make-server-373d8b09/businesses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Authorization token is required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const businessId = c.req.param('id');

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    // Get user's current organization
    const organizationId = await getCurrentOrganizationId(user.id);
    
    console.log(`🗑️ Attempting to delete business ${businessId} for organization ${organizationId}`);
    
    // Debug: List all businesses for this organization (handle both string and object format)
    const allBusinessesRaw = await kv.getByPrefix(`business:${organizationId}:`) || [];
    const allBusinesses = allBusinessesRaw.map((b: any) => 
      typeof b === 'string' ? JSON.parse(b) : b
    );
    console.log(`🔍 Found ${allBusinesses.length} businesses for organization:`, allBusinesses.map(b => ({ id: b.id, name: b.name })));
    
    const businessKey = `business:${organizationId}:${businessId}`;
    console.log(`🔑 Looking for business with key: ${businessKey}`);
    
    // kv.get may return string or object
    let existingBusinessRaw = await kv.get(businessKey);
    if (!existingBusinessRaw) {
      console.log(`❌ Business not found with key: ${businessKey}`);
      console.log(`🔍 Available business keys:`, allBusinesses.map(b => `business:${organizationId}:${b.id}`));
      return c.json({ error: `Business not found. Looking for key: ${businessKey}` }, 404);
    }

    const existingBusiness = typeof existingBusinessRaw === 'string' 
      ? JSON.parse(existingBusinessRaw) 
      : existingBusinessRaw;
    
    console.log(`✅ Found business to delete: ${existingBusiness.name}`);

    // Delete the main business record
    await kv.del(`business:${organizationId}:${businessId}`);
    console.log(`🗑️ Deleted main business record`);

    // Clean up related data
    try {
      // Delete finance data (use organization context)
      const financeKeys = [
        `bank_balance:${organizationId}:${businessId}`,
        `finance_summary:${organizationId}:${businessId}`
      ];
      
      for (const key of financeKeys) {
        await kv.del(key);
      }

      // Delete transactions, invoices, budgets (use organization context)
      const transactionKeysRaw = await kv.getByPrefix(`transaction:${organizationId}:${businessId}:`) || [];
      const transactionKeys = transactionKeysRaw.map((t: string) => JSON.parse(t));
      for (const transaction of transactionKeys) {
        await kv.del(`transaction:${organizationId}:${businessId}:${transaction.id}`);
      }

      const invoiceKeysRaw = await kv.getByPrefix(`invoice:${organizationId}:${businessId}:`) || [];
      const invoiceKeys = invoiceKeysRaw.map((i: string) => JSON.parse(i));
      for (const invoice of invoiceKeys) {
        await kv.del(`invoice:${organizationId}:${businessId}:${invoice.id}`);
      }

      const budgetKeysRaw = await kv.getByPrefix(`budget:${organizationId}:${businessId}:`) || [];
      const budgetKeys = budgetKeysRaw.map((b: string) => JSON.parse(b));
      for (const budget of budgetKeys) {
        await kv.del(`budget:${organizationId}:${businessId}:${budget.id}`);
      }

      // Delete notes (use organization context)
      const noteKeysRaw = await kv.getByPrefix(`note:${organizationId}:${businessId}:`) || [];
      const noteKeys = noteKeysRaw.map((n: string) => JSON.parse(n));
      for (const note of noteKeys) {
        await kv.del(`note:${organizationId}:${businessId}:${note.id}`);
      }

      console.log(`🧹 Cleaned up related data: ${transactionKeys.length} transactions, ${invoiceKeys.length} invoices, ${budgetKeys.length} budgets, ${noteKeys.length} notes`);
      
    } catch (cleanupError) {
      console.warn(`⚠️ Error during cleanup (business still deleted):`, cleanupError);
    }
    
    console.log(`✅ Business ${businessId} deleted successfully`);
    return c.json({ 
      success: true, 
      message: 'Business and all related data deleted successfully',
      deletedBusiness: existingBusiness
    });

  } catch (error) {
    console.error(`❌ Error deleting business:`, error);
    return c.json({ error: `Error deleting business: ${error.message}` }, 500);
  }
});

// Business Health Score endpoint
app.get('/make-server-373d8b09/business-health/:businessId', getBusinessHealthScore);

// Industry Benchmarks endpoint
app.get('/make-server-373d8b09/industry-benchmarks/:businessId', getIndustryBenchmarks);

// Ping endpoint for business API health check
app.get('/make-server-373d8b09/ping', (c) => {
  return c.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString(),
    server: 'business-api'
  });
});

// Support Tickets Endpoints
app.get('/make-server-373d8b09/support/user-tickets', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized', tickets: [] }, 401);
    }
    
    const ticketsKey = `user:${user.id}:support_tickets`;
    const tickets = await kv.get(ticketsKey) || [];
    
    const sortedTickets = Array.isArray(tickets) 
      ? tickets.sort((a: any, b: any) => 
          new Date(b.updatedAt || b.createdAt).getTime() - 
          new Date(a.updatedAt || a.createdAt).getTime()
        )
      : [];
    
    return c.json({ success: true, tickets: sortedTickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch support tickets',
      tickets: []
    }, 500);
  }
});

app.post('/make-server-373d8b09/support/create-ticket', async (c) => {
  console.log('🎫 CREATE TICKET: Endpoint called');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    if (!user) {
      console.log('🎫 CREATE TICKET: Unauthorized - no user');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    console.log('🎫 CREATE TICKET: User authenticated:', user.email);
    
    const body = await c.req.json();
    const { subject, message, category, type, priority = 'medium' } = body;
    
    console.log('🎫 CREATE TICKET: Request body:', { subject, type, category, priority });
    
    if (!subject || !message) {
      console.log('🎫 CREATE TICKET: Missing required fields');
      return c.json({ success: false, error: 'Subject and message are required' }, 400);
    }
    
    const ticketsKey = `user:${user.id}:support_tickets`;
    const existingTickets = await kv.get(ticketsKey) || [];
    
    // Use type if provided, fallback to category, default to 'general'
    const ticketType = type || category || 'general';
    
    const newTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      userEmail: user.email,
      subject,
      type: ticketType,
      category: ticketType, // Keep both for backward compatibility
      priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: `msg_${Date.now()}`,
        sender: 'user',
        message,
        timestamp: new Date().toISOString()
      }]
    };
    
    console.log('🎫 CREATE TICKET: New ticket created:', newTicket);
    
    const updatedTickets = Array.isArray(existingTickets) 
      ? [...existingTickets, newTicket]
      : [newTicket];
    
    await kv.set(ticketsKey, updatedTickets);
    console.log('🎫 CREATE TICKET: Saved to user tickets key:', ticketsKey);
    
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    console.log('🎫 CREATE TICKET: Current admin tickets count:', Array.isArray(adminTickets) ? adminTickets.length : 'not array');
    
    const updatedAdminTickets = Array.isArray(adminTickets)
      ? [...adminTickets, newTicket]
      : [newTicket];
    
    await kv.set(adminTicketsKey, updatedAdminTickets);
    console.log('🎫 CREATE TICKET: Saved to admin tickets key:', adminTicketsKey);
    console.log('🎫 CREATE TICKET: New admin tickets count:', updatedAdminTickets.length);
    
    // Verify it was saved
    const verifyAdminTickets = await kv.get(adminTicketsKey);
    console.log('🎫 CREATE TICKET: Verification - tickets in admin key:', Array.isArray(verifyAdminTickets) ? verifyAdminTickets.length : 'not array');
    
    return c.json({ success: true, ticket: newTicket });
  } catch (error) {
    console.error('🎫 CREATE TICKET: Error:', error);
    return c.json({
      success: false,
      error: 'Failed to create support ticket'
    }, 500);
  }
});

app.post('/make-server-373d8b09/support/add-message', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { ticketId, message } = body;
    
    if (!ticketId || !message) {
      return c.json({ success: false, error: 'Ticket ID and message are required' }, 400);
    }
    
    const ticketsKey = `user:${user.id}:support_tickets`;
    const tickets = await kv.get(ticketsKey) || [];
    
    if (!Array.isArray(tickets)) {
      return c.json({ success: false, error: 'Invalid tickets data' }, 500);
    }
    
    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
    
    if (ticketIndex === -1) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    const ticket = tickets[ticketIndex];
    
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      message,
      timestamp: new Date().toISOString()
    };
    
    ticket.messages = [...(ticket.messages || []), newMessage];
    ticket.updatedAt = new Date().toISOString();
    ticket.status = 'open';
    
    tickets[ticketIndex] = ticket;
    await kv.set(ticketsKey, tickets);
    
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    if (Array.isArray(adminTickets)) {
      const adminTicketIndex = adminTickets.findIndex((t: any) => t.id === ticketId);
      if (adminTicketIndex !== -1) {
        adminTickets[adminTicketIndex] = ticket;
        await kv.set(adminTicketsKey, adminTickets);
      }
    }
    
    return c.json({ success: true, ticket });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    return c.json({
      success: false,
      error: 'Failed to add message'
    }, 500);
  }
});

// GET /make-server-373d8b09/support/check-updates - Check for unread support ticket updates
app.get('/make-server-373d8b09/support/check-updates', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get user's ticket IDs
    const ticketsKey = `user_tickets:${user.id}`;
    const ticketIds = await kv.get(ticketsKey) || [];
    
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return c.json({ success: true, hasUnread: false, unreadCount: 0 });
    }
    
    // Get read status tracking
    const readStatusKey = `user:${user.id}:support_read_status`;
    const readStatus = await kv.get(readStatusKey) || {};
    
    let unreadCount = 0;
    let lastUpdate: string | null = null;
    
    // Load each ticket and check for unread admin messages
    for (const ticketId of ticketIds) {
      const ticket = await kv.get(`support_ticket:${ticketId}`);
      
      if (!ticket) continue;
      
      const ticketReadStatus = readStatus[ticket.id] || {};
      const lastReadTime = ticketReadStatus.lastReadTime || ticket.createdAt;
      
      // Check if there are admin messages or status changes after last read
      const hasUnreadMessages = (ticket.messages || []).some((msg: any) => 
        msg.sender === 'admin' && msg.timestamp > lastReadTime
      );
      
      const hasStatusChange = ticketReadStatus.lastKnownStatus && 
        ticket.status !== ticketReadStatus.lastKnownStatus &&
        ticket.updatedAt > lastReadTime;
      
      if (hasUnreadMessages || hasStatusChange) {
        unreadCount++;
        if (!lastUpdate || ticket.updatedAt > lastUpdate) {
          lastUpdate = ticket.updatedAt;
        }
      }
    }
    
    console.log(`📬 Support check-updates for user ${user.id}: ${unreadCount} unread tickets`);
    
    return c.json({
      success: true,
      hasUnread: unreadCount > 0,
      unreadCount,
      lastUpdate
    });
  } catch (error) {
    console.error('Error checking support updates:', error);
    return c.json({
      success: false,
      error: 'Failed to check updates'
    }, 500);
  }
});

// POST /make-server-373d8b09/support/mark-read/:ticketId - Mark a support ticket as read
app.post('/make-server-373d8b09/support/mark-read/:ticketId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const ticketId = c.req.param('ticketId');
    
    // Get the ticket to verify it belongs to the user
    const ticket = await kv.get(`support_ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    if (ticket.userId !== user.id) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }
    
    // Update read status
    const readStatusKey = `user:${user.id}:support_read_status`;
    const readStatus = await kv.get(readStatusKey) || {};
    
    readStatus[ticketId] = {
      lastReadTime: new Date().toISOString(),
      lastKnownStatus: ticket.status
    };
    
    await kv.set(readStatusKey, readStatus);
    
    console.log(`📬 User ${user.id} marked ticket ${ticketId} as read`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking ticket as read:', error);
    return c.json({
      success: false,
      error: 'Failed to mark as read'
    }, 500);
  }
});

// Helper function to save chat messages to history
const saveMessagesToHistory = async (userId: string, sessionId: string, userMessage: string, aiResponse: string, functionCalled?: string, functionResult?: any, dataUsed?: string[], businessContext?: any) => {
  try {
    const now = new Date().toISOString();
    
    // Save user message
    const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userMessageData = {
      id: userMessageId,
      role: 'user',
      content: userMessage,
      timestamp: now,
      session_id: sessionId,
      user_id: userId
    };
    await kv.set(`ai_chat_message:${userId}:${sessionId}:${userMessageId}`, JSON.stringify(userMessageData));

    // Save AI response
    const aiMessageId = `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`;
    const aiMessageData = {
      id: aiMessageId,
      role: 'assistant',
      content: aiResponse,
      timestamp: now,
      session_id: sessionId,
      user_id: userId,
      context: businessContext,
      actions: [],
      data_used: dataUsed || [],
      function_called: functionCalled,
      function_result: functionResult
    };
    await kv.set(`ai_chat_message:${userId}:${sessionId}:${aiMessageId}`, JSON.stringify(aiMessageData));

    // Update session metadata
    const sessionKey = `ai_chat_session:${userId}:${sessionId}`;
    const sessionStr = await kv.get(sessionKey);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      session.updated_at = now;
      session.last_message = userMessage;
      session.message_count = (session.message_count || 0) + 2; // User message + AI response
      await kv.set(sessionKey, JSON.stringify(session));
    }
  } catch (error) {
    // Silent error handling for logging
  }
};

// Add Finance Endpoints
addFinanceEndpoints(app, verifyUserAccess);

// Add Product Endpoints
addProductEndpoints(app, verifyUserAccess);

// Add University Endpoints
addUniversityEndpoints(app, verifyUserAccess);

// Add HR Endpoints
addHREndpoints(app, verifyUserAccess);

// Add Team Endpoints
addTeamEndpoints(app, verifyUserAccess);

// Add HubSpot OAuth Endpoints
addHubSpotOAuthEndpoints(app);

// Add Salesforce OAuth Endpoints
addSalesforceOAuthEndpoints(app);

// Add Google OAuth Endpoints
addGoogleOAuthEndpoints(app);

// Add GitHub OAuth Endpoints
addGitHubOAuthEndpoints(app);

// Add Slack Endpoints
addSlackEndpoints(app, verifyUserAccess);

// Add Calendar Endpoints
addCalendarEndpoints(app, verifyUserAccess);

// Add Admin Endpoints (includes bulk operations and user status updates)
addAdminEndpoints(app, verifyUserAccess);

// ==============================================================================
// USER PROFILE ENDPOINTS
// ==============================================================================

// Update user profile (display name)
app.put('/make-server-ac1075a9/user/profile', async (c) => {
  console.log('✅ User profile update endpoint called');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return c.json({ success: false, error: 'Valid name is required' }, 400);
    }

    // Update user metadata in Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          name: name.trim(),
          full_name: name.trim()
        }
      }
    );

    if (error) {
      console.error('❌ Error updating user profile:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Also update in KV store if exists
    const userKey = `user:${user.id}`;
    const kvUser = await kv.get(userKey).catch(() => null);
    if (kvUser) {
      const parsed = JSON.parse(kvUser);
      parsed.name = name.trim();
      parsed.updated_at = new Date().toISOString();
      await kv.set(userKey, JSON.stringify(parsed));
    }

    console.log(`✅ Profile updated successfully for user ${user.id}: ${name.trim()}`);
    return c.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: data.user
    });

  } catch (error: any) {
    console.error('❌ Update user profile error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to update profile'
    }, 500);
  }
});

// Update user profile - WITHOUT PREFIX (fallback for routing issues)
app.put('/user/profile', async (c) => {
  console.log('✅ User profile update endpoint called (NO PREFIX)');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return c.json({ success: false, error: 'Valid name is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          name: name.trim(),
          full_name: name.trim()
        }
      }
    );

    if (error) {
      console.error('❌ Error updating user profile:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    const userKey = `user:${user.id}`;
    const kvUser = await kv.get(userKey).catch(() => null);
    if (kvUser) {
      const parsed = JSON.parse(kvUser);
      parsed.name = name.trim();
      parsed.updated_at = new Date().toISOString();
      await kv.set(userKey, JSON.stringify(parsed));
    }

    console.log(`✅ Profile updated (NO PREFIX) for user ${user.id}: ${name.trim()}`);
    return c.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: data.user
    });

  } catch (error: any) {
    console.error('❌ Update user profile error (NO PREFIX):', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to update profile'
    }, 500);
  }
});

// Update user profile - make-server-373d8b09 (for frontend compatibility)
app.put('/make-server-373d8b09/user/profile', async (c) => {
  console.log('✅ User profile update endpoint called (373d8b09 prefix)');
  console.log('🔍 Request headers:', c.req.header('Authorization') ? 'Auth header present' : 'No auth header');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    if (!user) {
      console.error('❌ User verification failed - no user returned');
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    console.log(`✅ User verified: ${user.id}`);

    const body = await c.req.json();
    const { name } = body;

    console.log(`🔍 Request body - name: "${name}"`);

    if (!name || typeof name !== 'string' || !name.trim()) {
      console.error('❌ Invalid name provided');
      return c.json({ success: false, error: 'Valid name is required' }, 400);
    }

    // Update user metadata in Supabase Auth
    if (!supabase) {
      console.error('❌ Supabase client not available');
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

    console.log(`✅ Supabase client available, proceeding with update...`);

    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          name: name.trim(),
          full_name: name.trim()
        }
      }
    );

    if (error) {
      console.error('❌ Error updating user profile (373d8b09):', error);
      console.error('❌ Error JSON:', JSON.stringify(error, null, 2));
      console.error('❌ User ID:', user.id);
      console.error('❌ Name:', name.trim());
      return c.json({ 
        success: false, 
        error: error.message || 'Failed to update user profile',
        errorCode: error.status || error.code || 'UNKNOWN',
        userId: user.id
      }, 500);
    }

    console.log(`✅ Profile update successful for user ${user.id}: "${name.trim()}"`);
    console.log(`✅ Updated user data:`, data.user);

    // Also update in KV store if exists
    const userKey = `user:${user.id}`;
    const kvUser = await kv.get(userKey).catch(() => null);
    if (kvUser) {
      try {
        const parsed = typeof kvUser === 'string' ? JSON.parse(kvUser) : kvUser;
        parsed.name = name.trim();
        parsed.updated_at = new Date().toISOString();
        await kv.set(userKey, parsed);
        console.log(`✅ KV store updated for user ${user.id}`);
      } catch (kvError) {
        console.error('❌ Error updating KV store:', kvError);
        // Don't fail the request if KV update fails
      }
    }

    console.log(`✅ Profile updated successfully for user ${user.id}: ${name.trim()}`);
    return c.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: data.user
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in user profile update (373d8b09):', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    return c.json({
      success: false,
      error: `Update failed: ${error.message || 'Unknown error occurred'}`,
      errorDetails: {
        type: error.name || 'UnknownError',
        message: error.message || 'An unexpected error occurred',
        stack: error.stack
      }
    }, 500);
  }
});

// Update user email - make-server-373d8b09 (for frontend compatibility)
app.put('/make-server-373d8b09/user/email', async (c) => {
  console.log('✅ User email update endpoint called (373d8b09 prefix)');
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return c.json({ success: false, error: 'Valid email is required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return c.json({ success: false, error: 'Invalid email format' }, 400);
    }

    // Update user email using the user's access token - this will send a confirmation email automatically
    // We must use the client-side auth.updateUser() method, not admin.updateUserById()
    if (!supabase) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

    // Create a client with the user's access token to trigger email verification
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    // Use updateUser with the user's session - this triggers email verification
    const { data, error } = await userSupabase.auth.updateUser({
      email: email.trim().toLowerCase()
    });

    if (error) {
      console.error('❌ Error updating user email:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Email update requested for user ${user.id}: ${email.trim()}`);
    console.log('📧 Verification email sent to new address via Supabase Auth');
    
    return c.json({ 
      success: true,
      message: 'Email change requested! Please check your NEW email address for a verification link. Your email will be updated once you click the verification link.',
      requiresVerification: true,
      user: data.user
    });

  } catch (error: any) {
    console.error('❌ Update user email error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to update email'
    }, 500);
  }
});

// DEBUG: Show all registered routes
app.get('/make-server-ac1075a9/debug/routes', async (c) => {
  return c.json({ 
    message: 'Route debugging endpoint',
    note: 'Check server logs for all registered routes',
    timestamp: new Date().toISOString()
  });
});

// TEST: Verify admin endpoints are loaded
app.get('/make-server-ac1075a9/admin/test', async (c) => {
  return c.json({ 
    message: 'Admin endpoints are loaded and working', 
    timestamp: new Date().toISOString(),
    endpoints_loaded: true
  });
});

// TEST: Direct bulk-delete endpoint to verify routing
app.post('/make-server-ac1075a9/admin/users/bulk-delete-test', async (c) => {
  return c.json({ 
    message: 'TEST ENDPOINT WORKING', 
    timestamp: new Date().toISOString(),
    note: 'If you see this, routing is working but admin-endpoints may have an issue'
  });
});

// TEST: Verify bookkeeping endpoints are loaded - Added 2025-01-16
app.get('/make-server-ac1075a9/bookkeeping/test', async (c) => {
  return c.json({ 
    message: 'Bookkeeping endpoints are loaded and working', 
    timestamp: new Date().toISOString(),
    endpoints_loaded: true,
    version: '2.0.0'
  });
});

// Add Notes Endpoints (DISABLED - added later at line ~6449)
// addNotesEndpoints(app);

// Add Roadmap Endpoints
addRoadmapEndpoints(app, verifyUserAccess);

// Mount OpenAI Assistant routes under /make-server-ac1075a9/ai/
// This provides:
// - POST /make-server-ac1075a9/ai/chat (main chat endpoint with product management)
// - GET /make-server-ac1075a9/ai/test-assistant (test endpoint)
app.route('/make-server-ac1075a9/ai', openaiRoutes);

// ==============================================================================
// AI CHAT SESSIONS ENDPOINTS - For CofounderAI Page
// ==============================================================================

// GET /make-server-373d8b09/ai/chat-sessions - Get all chat sessions for a user
app.get('/make-server-373d8b09/ai/chat-sessions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const userId = c.req.query('userId') || user.id;

    // Get all sessions for this user from KV store
    const sessionPrefix = `ai_chat_session:${userId}:`;
    const sessions = await kv.getByPrefix(sessionPrefix);

    // Transform sessions into the expected format
    const formattedSessions = sessions
      .map((session: any) => {
        try {
          const parsed = typeof session === 'string' ? JSON.parse(session) : session;
          return {
            id: parsed.id,
            title: parsed.title || 'Chat Session',
            threadId: parsed.threadId || null,
            last_message: parsed.last_message || null,
            updated_at: parsed.updated_at || parsed.created_at || new Date().toISOString(),
            created_at: parsed.created_at || new Date().toISOString()
          };
        } catch (e) {
          return null;
        }
      })
      .filter((s: any) => s !== null)
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return c.json({ sessions: formattedSessions });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to load chat sessions' }, 500);
  }
});

// PUT /make-server-373d8b09/ai/chat-sessions/:sessionId - Update session title
app.put('/make-server-373d8b09/ai/chat-sessions/:sessionId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { title } = body;

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Get the session from KV store
    const sessionKey = `ai_chat_session:${user.id}:${sessionId}`;
    const sessionStr = await kv.get(sessionKey);

    if (!sessionStr) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Parse the session JSON string
    const session = typeof sessionStr === 'string' ? JSON.parse(sessionStr) : sessionStr;

    // Update the session
    const updatedSession = {
      ...session,
      title,
      updated_at: new Date().toISOString()
    };

    await kv.set(sessionKey, JSON.stringify(updatedSession));

    return c.json({ 
      success: true, 
      session: updatedSession 
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update session' }, 500);
  }
});

// DELETE /make-server-373d8b09/ai/chat-sessions/:sessionId - Delete a session
app.delete('/make-server-373d8b09/ai/chat-sessions/:sessionId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const sessionId = c.req.param('sessionId');

    // Delete the session from KV store
    const sessionKey = `ai_chat_session:${user.id}:${sessionId}`;
    await kv.del(sessionKey);

    // Also delete all messages for this session
    const messagePrefix = `ai_chat_message:${user.id}:${sessionId}:`;
    const messages = await kv.getByPrefix(messagePrefix);
    for (const msg of messages) {
      const msgData = typeof msg === 'string' ? JSON.parse(msg) : msg;
      if (msgData.id) {
        await kv.del(`ai_chat_message:${user.id}:${sessionId}:${msgData.id}`);
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete session' }, 500);
  }
});

// GET /make-server-373d8b09/ai/chat-history - Get chat history for a session
app.get('/make-server-373d8b09/ai/chat-history', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const sessionId = c.req.query('sessionId');

    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }

    // Get all messages for this session
    const messagePrefix = `ai_chat_message:${user.id}:${sessionId}:`;
    const messages = await kv.getByPrefix(messagePrefix);

    // Transform messages into the expected format - return as flat array with user and assistant messages
    const allMessages: any[] = [];
    
    messages.forEach((msg: any) => {
      try {
        const parsed = typeof msg === 'string' ? JSON.parse(msg) : msg;
        
        // Add user message
        allMessages.push({
          id: parsed.id,
          role: 'user',
          content: parsed.user_message,
          timestamp: parsed.timestamp
        });
        
        // Add AI response as separate message
        if (parsed.ai_response) {
          allMessages.push({
            id: `${parsed.id}_ai`,
            role: 'assistant',
            content: parsed.ai_response,
            timestamp: parsed.timestamp
          });
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });
    
    // Sort by timestamp
    const formattedMessages = allMessages
      .filter(m => m !== null && m.content)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return c.json({ messages: formattedMessages });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to load chat history' }, 500);
  }
});

// POST /make-server-373d8b09/ai/chat - Send message to AI chat
app.post('/make-server-373d8b09/ai/chat', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const body = await c.req.json();
    const { message, sessionId, threadId, conversationHistory, businessContext } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // CREDIT DEDUCTION: Deduct 1 credit for cofounder chat message
    const { deductUserCredits } = await import('./credits-endpoints.tsx');
    const deductResult = await deductUserCredits(user.id, 1, 'Cofounder Chat Message');

    if (!deductResult.success) {
      console.log('❌ Credit deduction failed:', deductResult.error);
      return c.json({ 
        error: deductResult.error || 'Insufficient credits for this action',
        needsUpgrade: true,
        remainingCredits: deductResult.remainingCredits
      }, 402);
    }

    console.log('✅ Credit deducted successfully. Remaining:', deductResult.remainingCredits);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Load unified memory from all departments (Marketing, HR, Finance, etc.)
    const unifiedMemory = businessContext?.id ? await loadUnifiedMemory(businessContext.id) : '';

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are Cofounder AI, a helpful business assistant for entrepreneurs. ${businessContext ? `The user is working on their business: "${businessContext.name}" in the ${businessContext.industry} industry.` : ''}`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Make request to OpenAI
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        input: messages,
        temperature: 0.7,
        max_output_tokens: 2000,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ 
        error: `OpenAI request failed with status ${response.status}: ${error}` 
      }, response.status);
    }

    const data = await response.json();
    
    // Use centralized response extraction utility
    const aiResponse = extractOpenAIResponse(data);

    // Save message to KV store
    if (sessionId) {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        id: messageId,
        user_message: message,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_id: user.id,
        business_id: businessContext?.id || null
      };
      await kv.set(`ai_chat_message:${user.id}:${sessionId}:${messageId}`, JSON.stringify(messageData));

      // Update session with last message
      const sessionKey = `ai_chat_session:${user.id}:${sessionId}`;
      const sessionStr = await kv.get(sessionKey);
      if (sessionStr) {
        const session = typeof sessionStr === 'string' ? JSON.parse(sessionStr) : sessionStr;
        const updatedSession = {
          ...session,
          last_message: message.substring(0, 100),
          updated_at: new Date().toISOString()
        };
        await kv.set(sessionKey, JSON.stringify(updatedSession));
      } else {
        // Create new session if it doesn't exist
        const newSession = {
          id: sessionId,
          title: 'New Chat',
          last_message: message.substring(0, 100),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          threadId: threadId || null,
          user_id: user.id
        };
        await kv.set(sessionKey, JSON.stringify(newSession));
      }
    }

    return c.json({
      message: aiResponse,
      response: aiResponse,
      threadId: threadId || sessionId,
      sessionId: sessionId || `session_${Date.now()}`
    });

  } catch (error: any) {
    return c.json({ 
      error: error.message || 'Failed to process chat message' 
    }, 500);
  }
});

// Mount Subscription Management routes
app.route('/make-server-ac1075a9/subscriptions', subscriptionManagementRoutes);

// Mount Stripe Supabase Sync routes
app.route('/make-server-ac1075a9/stripe-supabase-sync', stripeSupabaseSync);

// Mount Stripe Setup routes (for production setup)
// COMMENTED OUT: File was deleted during cleanup
// import stripeSetupProducts from './stripe-setup-products.tsx';
// app.route('/make-server-373d8b09/stripe-setup', stripeSetupProducts);

// Mount Stripe Production Migration routes (to handle test->prod migration)
// COMMENTED OUT: File was deleted during cleanup
// import stripeProductionMigration from './stripe-production-migration.tsx';
// app.route('/make-server-373d8b09/stripe-migration', stripeProductionMigration);

// Mount Customization routes
app.route('/make-server-373d8b09', customizationRoutes); // Mount for frontend compatibility (onboarding tour)
app.route('/make-server-ac1075a9', customizationRoutes);

// Mount IAP routes
app.route('/make-server-373d8b09', iapRoutes); // Mount for frontend compatibility (Apple IAP)

// Mount Email 2FA routes
app.route('/make-server-373d8b09', email2FARoutes); // Email-based 2FA with Resend

// Mount Founder Call Booking routes
app.route('/', founderCallRoutes); // Mount founder call booking endpoints - routes already include /make-server-373d8b09 prefix

// Mount Bookkeeping routes - Updated 2025-01-16 15:35 UTC
app.route('/make-server-ac1075a9', bookkeepingRoutes); // Mount bookkeeping auto-bookkeeping engine

// Mount Product Research routes
app.route('/make-server-373d8b09', productResearchRoutes); // Product research for ecommerce

// Mount Ecommerce Product routes
app.route('/make-server-373d8b09', ecommerceProductRoutes); // Ecommerce product management with AI enhancement

// Mount Marketing routes
app.route('/make-server-373d8b09', marketingRoutes); // Marketing content generation and strategy

// Mount Product Marketing routes
app.route('/make-server-373d8b09/product-marketing', productMarketingRoutes); // Product marketing plans with GPT-4o

// Mount Sales routes
app.route('/make-server-373d8b09/sales', salesRouter); // Sales pipeline, leads, sequences with GPT insights

// ==============================================================================
// NAV CUSTOMIZATION ENDPOINTS - FRESH START (v2)
// ==============================================================================

// Simple test endpoint to verify server is responding
app.get('/make-server-ac1075a9/nav-test', async (c) => {
  return c.json({ 
    success: true, 
    message: 'Nav customization endpoint is alive!',
    timestamp: new Date().toISOString()
  });
});

// GET user's nav customization
app.get('/make-server-373d8b09/nav-customize/get', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'No auth token' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    // Get from KV store
    const kvKey = `nav_custom_v2:${user.id}`;
    const savedData = await kv.get(kvKey);

    if (!savedData) {
      // Return defaults - NEW STRUCTURE: Dashboard, Sales, Finance, Marketing, Settings
      return c.json({
        success: true,
        navItems: [
          { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
          { id: 'sales', label: 'Sales', icon: 'trending-up', path: '/operations/sales' },
          { id: 'finance', label: 'Finance', icon: 'credit-card', path: '/operations/finance' },
          { id: 'marketing', label: 'Marketing', icon: 'megaphone', path: '/operations/marketing' },
          { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
        ]
      });
    }

    const parsed = JSON.parse(savedData);
    // Handle both old format (array) and new format (object with navItems)
    const navItems = Array.isArray(parsed) ? parsed : parsed.navItems;

    return c.json({
      success: true,
      navItems: navItems || []
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: `Server error: ${error.message}`
    }, 500);
  }
});

// SAVE user's nav customization
app.post('/make-server-373d8b09/nav-customize/save', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'No auth token' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    const body = await c.req.json();
    const { navItems } = body;

    if (!navItems || !Array.isArray(navItems)) {
      return c.json({ 
        success: false, 
        error: 'navItems must be an array' 
      }, 400);
    }

    if (navItems.length > 7) {
      return c.json({ 
        success: false, 
        error: 'Max 7 items allowed' 
      }, 400);
    }

    // Save to KV store (save as object for consistency with reset)
    const kvKey = `nav_custom_v2:${user.id}`;
    await kv.set(kvKey, JSON.stringify({
      navItems,
      updatedAt: new Date().toISOString()
    }));

    console.log(`✅ Saved nav customization for user ${user.id}:`, navItems);

    return c.json({
      success: true,
      message: 'Nav customization saved to database!',
      savedItems: navItems
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: `Server error: ${error.message}`
    }, 500);
  }
});

// RESET to defaults
app.post('/make-server-373d8b09/nav-customize/reset', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'No auth token' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    // Save default nav items to KV store (don't just delete - persist the defaults!)
    // NEW STRUCTURE: Dashboard, Sales, Finance, Marketing, Settings
    const defaultNavItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
      { id: 'sales', label: 'Sales', icon: 'trending-up', path: '/operations/sales' },
      { id: 'finance', label: 'Finance', icon: 'credit-card', path: '/operations/finance' },
      { id: 'marketing', label: 'Marketing', icon: 'megaphone', path: '/operations/marketing' },
      { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
    ];

    const kvKey = `nav_custom_v2:${user.id}`;
    await kv.set(kvKey, JSON.stringify({
      navItems: defaultNavItems,
      updatedAt: new Date().toISOString()
    }));

    console.log(`✅ Reset nav to defaults for user ${user.id}`);

    return c.json({
      success: true,
      message: 'Reset to defaults',
      navItems: defaultNavItems
    });

  } catch (error: any) {
    console.error('❌ Reset error:', error);
    return c.json({
      success: false,
      error: `Server error: ${error.message}`
    }, 500);
  }
});

// ==============================================================================
// END NAV CUSTOMIZATION ENDPOINTS v2
// ==============================================================================

// DIRECT INLINE Customization Endpoints (in case mounting fails)
app.get('/make-server-ac1075a9/customization/preferences', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Get preferences from KV store
    const preferencesKey = `customization_preferences:${userId}`;
    const preferences = await kv.get(preferencesKey);

    // Return default preferences if none exist
    if (!preferences) {
      const defaultPreferences = {
        navItems: [
          { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
          { id: 'operations', label: 'Operations', icon: 'briefcase', path: '/operations' },
          { id: 'roadmap', label: 'Cofounder AGI', icon: 'sparkles', path: '/roadmap' },
          { id: 'notes', label: 'Notes', icon: 'sticky-note', path: '/notes' },
          { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
        ],
        updatedAt: new Date().toISOString()
      };

      return c.json({
        success: true,
        preferences: defaultPreferences
      });
    }

    return c.json({
      success: true,
      preferences: JSON.parse(preferences)
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to get preferences'
    }, 500);
  }
});

app.post('/make-server-ac1075a9/customization/preferences', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const { navItems } = body;

    if (!navItems || !Array.isArray(navItems)) {
      return c.json({ 
        success: false, 
        error: 'Invalid navItems array' 
      }, 400);
    }

    // Validate max 7 items
    if (navItems.length > 7) {
      return c.json({ 
        success: false, 
        error: 'Maximum 7 nav items allowed' 
      }, 400);
    }

    const preferences = {
      navItems,
      updatedAt: new Date().toISOString()
    };

    // Save to KV store
    const preferencesKey = `customization_preferences:${userId}`;
    await kv.set(preferencesKey, JSON.stringify(preferences));

    return c.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to save preferences'
    }, 500);
  }
});

app.post('/make-server-ac1075a9/customization/reset', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Delete preferences from KV store
    const preferencesKey = `customization_preferences:${userId}`;
    await kv.del(preferencesKey);

    return c.json({
      success: true,
      message: 'Preferences reset to default'
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to reset preferences'
    }, 500);
  }
});

// Dream Savings Bank Balance Preference Endpoints
app.get('/make-server-373d8b09/user-preferences/dream-savings-subtract', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Get preference from KV store
    const preferenceKey = `dream_savings_subtract_preference:${userId}`;
    const preferenceData = await kv.get(preferenceKey);
    
    return c.json({
      success: true,
      preference: preferenceData || null // null means no preference set (show dialog)
    });

  } catch (error: any) {
    console.error('Error getting dream savings preference:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get preference'
    }, 500);
  }
});

app.post('/make-server-373d8b09/user-preferences/dream-savings-subtract', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const { shouldSubtract, neverAskAgain } = body;

    if (typeof shouldSubtract !== 'boolean') {
      return c.json({ 
        success: false, 
        error: 'shouldSubtract must be a boolean' 
      }, 400);
    }

    const preference = {
      shouldSubtract,
      neverAskAgain: neverAskAgain || false,
      updatedAt: new Date().toISOString()
    };

    // Save to KV store
    const preferenceKey = `dream_savings_subtract_preference:${userId}`;
    await kv.set(preferenceKey, preference);

    console.log(`✅ Dream savings preference saved for user ${userId}: shouldSubtract=${shouldSubtract}, neverAskAgain=${neverAskAgain}`);

    return c.json({
      success: true,
      message: 'Preference saved successfully',
      preference
    });

  } catch (error: any) {
    console.error('Error saving dream savings preference:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to save preference'
    }, 500);
  }
});

// INLINE OPENAI CHAT ENDPOINT - For frontend compatibility with 373d8b09 prefix
app.post('/make-server-373d8b09/openai/chat', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create auth client for this request
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return c.json({ error: 'Invalid authorization' }, 401);
    }

    const body = await c.req.json();
    const { message, sessionId, businessId } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Make request to OpenAI
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        input: [
          {
            role: 'system',
            content: 'You are a helpful business assistant for Cofounder, helping entrepreneurs build and grow their businesses. IMPORTANT: You are specifically running on GPT-5.1, OpenAI\'s most advanced reasoning model. When asked about what model you\'re using, always respond with "GPT-5.1" (not 4.1, not GPT-4o, not any other version).'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_output_tokens: 1000,
        response_format: { type: "text" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return c.json({ 
        error: `OpenAI request failed with status ${response.status}: ${error}` 
      }, response.status);
    }

    const data = await response.json();
    
    // Use centralized response extraction utility
    const aiResponse = extractOpenAIResponse(data);

    // Save message to KV store
    if (sessionId && businessId) {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        id: messageId,
        user_message: message,
        ai_response: aiResponse,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_id: user.id,
        business_id: businessId
      };
      await kv.set(`ai_chat_message:${user.id}:${sessionId}:${messageId}`, JSON.stringify(messageData));
    }

    return c.json({
      response: aiResponse,
      sessionId: sessionId || `session_${Date.now()}`
    });

  } catch (error: any) {
    return c.json({ 
      error: error.message || 'Failed to process chat message' 
    }, 500);
  }
});

// Mount Account Deletion routes - FIXED: Mount at base path to create /delete-account endpoint
app.route('/make-server-ac1075a9', accountDeletionRoutes);

// Mount Streak routes
app.route('/make-server-373d8b09/streak', streakApp);

// ============================================================================
// TEAM V3 SYSTEM - INLINE ENDPOINTS (Guaranteed to work)
// ============================================================================

// Re-enabled - teamV3Router was returning 404, using inline endpoints instead
// Test endpoint to verify routing works
app.get('/make-server-ac1075a9/team-v3/test', async (c) => {
  return c.json({ 
    success: true, 
    message: 'Team V3 endpoints are working!',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to verify route registration
app.get('/make-server-ac1075a9/team-v3/debug-routes', async (c) => {
  return c.json({
    success: true,
    message: 'If you can see this, the route registration is working',
    timestamp: new Date().toISOString(),
    hint: 'Check if team-v3/data endpoint exists'
  });
});

// OPTIONS handler for CORS pre-flight on team-v3/data - DISABLED (router provides this)
// app.options('/make-server-ac1075a9/team-v3/data', async (c) => {
//   return c.json({ success: true, message: 'CORS preflight for team-v3/data' });
// });

// GET /team-v3/data - Get team members and invitations - DISABLED (using router instead at line ~2170)
/*
app.get('/make-server-ac1075a9/team-v3/data', async (c) => {
  console.log('🎯 team-v3/data endpoint HIT!');
  try {
    const authHeader = c.req.header('Authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    if (!authHeader) throw new Error('No auth header');
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) {
      console.log('❌ Auth failed:', error?.message || 'No user');
      throw new Error('Auth failed');
    }
    console.log('✅ Auth success, user ID:', user.id);
    
    const membersKey = `team_v3_members:${user.id}`;
    const invitesKey = `team_v3_invites:${user.id}`;
    console.log('📦 Fetching team data from keys:', membersKey, invitesKey);
    
    // Handle both string (old format) and object/array (new format)
    let membersRaw = await kv.get(membersKey);
    let invitesRaw = await kv.get(invitesKey);
    
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    const teamMembers = [];
    
    if (Array.isArray(members)) {
      for (const m of members) {
        teamMembers.push({
          id: m.id,
          email: m.email,
          name: m.name,
          role: m.role || 'member',
          status: 'active',
          joined_at: m.joinedAt,
        });
      }
    }
    
    if (Array.isArray(invites)) {
      const now = Date.now();
      for (const inv of invites) {
        if (inv.expiresAt && new Date(inv.expiresAt).getTime() < now) continue;
        teamMembers.push({
          id: inv.id,
          email: inv.email,
          name: inv.name,
          role: 'member',
          status: 'invited',
          invited_at: inv.invitedAt,
        });
      }
    }
    
    console.log('📊 Returning team data:', {
      teamMembersCount: teamMembers.length,
      membersCount: Array.isArray(members) ? members.length : 0,
      invitesCount: Array.isArray(invites) ? invites.length : 0
    });
    
    return c.json({
      success: true,
      teamMembers,
      stats: {
        activeMembers: Array.isArray(members) ? members.length : 0,
        pendingInvites: Array.isArray(invites) ? invites.length : 0,
        totalSlots: 10,
        usedSlots: 1 + teamMembers.length,
        availableSlots: 10 - (1 + teamMembers.length),
      }
    });
  } catch (err: any) {
    console.log('❌ Error in team-v3/data:', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});
*/

// Fallback route without prefix for team-v3/data (for Supabase routing compatibility) - DISABLED (using router)
/*
app.get('/team-v3/data', async (c) => {
  console.log('🎯 team-v3/data endpoint HIT! (NO PREFIX)');
  try {
    const authHeader = c.req.header('Authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    if (!authHeader) throw new Error('No auth header');
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) {
      console.log('❌ Auth failed:', error?.message || 'No user');
      throw new Error('Auth failed');
    }
    console.log('✅ Auth success, user ID:', user.id);
    
    const membersKey = `team_v3_members:${user.id}`;
    const invitesKey = `team_v3_invites:${user.id}`;
    console.log('📦 Fetching team data from keys:', membersKey, invitesKey);
    
    // Handle both string (old format) and object/array (new format)
    let membersRaw = await kv.get(membersKey);
    let invitesRaw = await kv.get(invitesKey);
    
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    const teamMembers = [];
    
    if (Array.isArray(members)) {
      for (const m of members) {
        teamMembers.push({
          id: m.id,
          email: m.email,
          name: m.name,
          role: m.role || 'member',
          status: 'active',
          joined_at: m.joinedAt,
        });
      }
    }
    
    if (Array.isArray(invites)) {
      const now = Date.now();
      for (const inv of invites) {
        if (inv.expiresAt && new Date(inv.expiresAt).getTime() < now) continue;
        teamMembers.push({
          id: inv.id,
          email: inv.email,
          name: inv.name,
          role: 'member',
          status: 'invited',
          invited_at: inv.invitedAt,
        });
      }
    }
    
    console.log('📊 Returning team data:', {
      teamMembersCount: teamMembers.length,
      membersCount: Array.isArray(members) ? members.length : 0,
      invitesCount: Array.isArray(invites) ? invites.length : 0
    });
    
    return c.json({
      success: true,
      teamMembers,
      stats: {
        activeMembers: Array.isArray(members) ? members.length : 0,
        pendingInvites: Array.isArray(invites) ? invites.length : 0,
        totalSlots: 10,
        usedSlots: 1 + teamMembers.length,
        availableSlots: 10 - (1 + teamMembers.length),
      }
    });
  } catch (err: any) {
    console.log('❌ Error in team-v3/data (NO PREFIX):', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});
*/

// POST /team-v3/invite - Send team invitation - DISABLED (using router)
/*
app.post('/make-server-ac1075a9/team-v3/invite', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) throw new Error('No auth header');
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) throw new Error('Auth failed');
    
    const body = await c.req.json();
    const { inviteEmail, inviteName, ownerName } = body;
    
    if (!inviteEmail?.trim()) {
      return c.json({ success: false, error: 'Email required' }, 400);
    }
    
    const email = inviteEmail.trim().toLowerCase();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, error: 'Invalid email' }, 400);
    }
    
    if (email === user.email.toLowerCase()) {
      return c.json({ success: false, error: 'Cannot invite yourself' }, 400);
    }
    
    const membersKey = `team_v3_members:${user.id}`;
    const invitesKey = `team_v3_invites:${user.id}`;
    
    // Handle both string (old format) and object/array (new format)
    let membersRaw = await kv.get(membersKey);
    let invitesRaw = await kv.get(invitesKey);
    
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    const memberCount = Array.isArray(members) ? members.length : 0;
    const inviteCount = Array.isArray(invites) ? invites.length : 0;
    const totalCount = 1 + memberCount + inviteCount;
    
    if (totalCount >= 10) {
      return c.json({ 
        success: false, 
        error: `Team limit reached (10 max). Contact support for enterprise.` 
      }, 400);
    }
    
    if (Array.isArray(members) && members.some((m: any) => m.email === email)) {
      return c.json({ success: false, error: 'Already a team member' }, 400);
    }
    
    if (Array.isArray(invites) && invites.some((i: any) => i.email === email && i.status === 'pending')) {
      return c.json({ success: false, error: 'Invitation already pending' }, 400);
    }
    
    const genToken = Array.from({ length: 32 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        .charAt(Math.floor(Math.random() * 62))
    ).join('');
    
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name: inviteName?.trim() || null,
      ownerId: user.id,
      ownerEmail: user.email,
      ownerName: ownerName || user.user_metadata?.name || user.email,
      token: genToken,
      status: 'pending',
      invitedAt: now,
      expiresAt,
    };
    
    const updatedInvites = Array.isArray(invites) ? [...invites, invitation] : [invitation];
    await kv.set(invitesKey, updatedInvites);
    await kv.set(`team_v3_token:${genToken}`, invitation);
    
    // Send email via Supabase Auth (for NEW users only)
    let emailSent = false;
    const link = `https://www.cofounderplus.com/invite/${genToken}`;
    
    try {
      console.log('📧 Sending team invitation via Supabase Auth...');
      
      // Use Supabase's inviteUserByEmail method
      const { data, error: emailError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: link,
        data: {
          invitation_type: 'team',
          inviter_name: invitation.ownerName,
          invitee_name: inviteName,
          invitation_link: link,
        }
      });
      
      if (emailError) {
        console.error('❌ Failed to send invitation email:', emailError);
      } else {
        emailSent = true;
        console.log('✅ Invitation email sent via Supabase');
      }
    } catch (e) {
      console.error('❌ Email error:', e);
      // Email failed but continue
    }
    
    return c.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        invitedAt: invitation.invitedAt,
      },
      emailSent,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
*/

// POST /team-v3/remove - Remove member or cancel invitation - DISABLED (using router)
/*
app.post('/make-server-ac1075a9/team-v3/remove', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) throw new Error('No auth header');
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) throw new Error('Auth failed');
    
    const { memberId } = await c.req.json();
    
    if (!memberId) {
      return c.json({ success: false, error: 'Member ID required' }, 400);
    }
    
    const membersKey = `team_v3_members:${user.id}`;
    
    // Handle both string (old format) and object/array (new format)
    let membersRaw = await kv.get(membersKey);
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    
    if (Array.isArray(members)) {
      const member = members.find((m: any) => m.id === memberId);
      if (member) {
        const updated = members.filter((m: any) => m.id !== memberId);
        await kv.set(membersKey, updated);
        return c.json({ success: true, message: 'Member removed' });
      }
    }
    
    const invitesKey = `team_v3_invites:${user.id}`;
    
    // Handle both string (old format) and object/array (new format)
    let invitesRaw = await kv.get(invitesKey);
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    if (Array.isArray(invites)) {
      const invite = invites.find((i: any) => i.id === memberId);
      if (invite) {
        const updated = invites.filter((i: any) => i.id !== memberId);
        await kv.set(invitesKey, updated);
        if (invite.token) {
          await kv.del(`team_v3_token:${invite.token}`);
        }
        return c.json({ success: true, message: 'Invitation cancelled' });
      }
    }
    
    return c.json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
*/

// Mount NEW V3 Team System (CLEAN - no legacy conflicts)
// All team-v3 endpoints are now handled by this router
app.route('/make-server-ac1075a9', teamV3Router);

// DIRECT test endpoint - bypassing router to debug
app.get('/make-server-ac1075a9/team-v3/direct-test', (c) => {
  return c.json({
    success: true,
    message: 'Direct endpoint working - router might have issues',
    timestamp: new Date().toISOString(),
  });
});

// Mount Team V3 routes (ONLY team invitation system - Resend removed, Supabase email only)
// OLD teamInvitationRouter completely removed - it was using Resend API
app.route('/make-server-373d8b09', teamV3Router);
app.route('/make-server-ac1075a9', teamV3Router);

// Mount Organization routes (on BOTH servers for compatibility)
app.route('/make-server-373d8b09', orgRouter);
app.route('/make-server-ac1075a9', orgRouter);

// Mount Notification routes (on BOTH servers for compatibility)
app.route('/make-server-373d8b09', notificationRouter);
app.route('/make-server-ac1075a9', notificationRouter);

// Mount Push Notification routes (APNS) - on BOTH servers for compatibility
app.route('/', pushNotificationApp); // Routes already include /make-server-373d8b09 prefix

// Mount Cofounder Settings routes
app.route('/make-server-373d8b09', cofounderSettingsRouter);
app.route('/make-server-ac1075a9', cofounderSettingsRouter);

// Mount Automation routes
app.route('/make-server-373d8b09', automationRouter);
app.route('/make-server-ac1075a9', automationRouter);

// Mount BETA Testing routes (on BOTH servers so data is accessible everywhere)
app.route('/make-server-373d8b09', betaRouter);
app.route('/make-server-ac1075a9', betaRouter);

// Mount Job Application routes (on BOTH servers for compatibility)
app.route('/make-server-373d8b09', jobApplicationRoutes);
app.route('/make-server-ac1075a9', jobApplicationRoutes);

// Mount Mastery Refresh routes (on BOTH servers for compatibility)
app.route('/make-server-373d8b09', masteryRefreshRoutes);
app.route('/make-server-ac1075a9', masteryRefreshRoutes);

// BETA endpoint test/ping - test different route patterns
app.get('/make-server-ac1075a9/beta/ping', async (c) => {
  return c.json({ 
    status: 'beta endpoint is working (WITH prefix)',
    timestamp: new Date().toISOString(),
    path: c.req.path
  });
});

app.get('/beta/ping', async (c) => {
  return c.json({ 
    status: 'beta endpoint is working (WITHOUT prefix)',
    timestamp: new Date().toISOString(),
    path: c.req.path
  });
});

// Try WITHOUT prefix version first (in case Supabase function name is make-server-ac1075a9)
app.post('/beta/change-plan', async (c) => {
  try {
    // Restore console for debugging this endpoint only
    const tempLog = originalConsole.log;
    const tempError = originalConsole.error;
    
    tempLog('🧪 BETA: Change plan endpoint called (WITHOUT prefix)');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      tempError('🧪 BETA: No authorization header');
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    tempLog('🧪 BETA: Token received, length:', token.length);
    
    // Create Supabase client for auth
    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      tempError('🧪 BETA: Authentication failed:', authError);
      return c.json({ success: false, error: 'Authentication failed', details: authError?.message }, 401);
    }

    tempLog('🧪 BETA: User authenticated:', user.id);

    // Parse request body
    const body = await c.req.json();
    const { userId, plan } = body;
    
    tempLog('🧪 BETA: Request body:', { userId, plan });

    if (!userId || !plan) {
      return c.json({ success: false, error: 'userId and plan are required' }, 400);
    }

    // Verify the user is changing their own plan
    if (userId !== user.id) {
      return c.json({ success: false, error: 'You can only change your own plan' }, 403);
    }

    // Validate plan
    const validPlans = ['free', 'creator', 'builder', 'studio'];
    if (!validPlans.includes(plan)) {
      tempError('🧪 BETA: Invalid plan:', plan);
      return c.json({ success: false, error: 'Invalid plan' }, 400);
    }

    tempLog('🧪 BETA: Creating subscription for plan:', plan);

    // Create a unique subscription ID for beta testing
    const subscriptionId = `beta_sub_${userId}_${plan}`;
    const now = Date.now();
    
    // Create subscription object in the format expected by the system
    const subscription = {
      id: subscriptionId,
      userId: userId,
      status: plan === 'free' ? 'canceled' : 'active',
      plan: plan,
      customer: `beta_cus_${userId}`,
      current_period_start: Math.floor(now / 1000),
      current_period_end: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000),
      items: [
        {
          id: `item_${plan}`,
          plan: {
            id: plan,
            product: plan,
            interval: 'month',
            amount: 0
          }
        }
      ],
      metadata: {
        source: 'beta_testing',
        plan_name: plan
      },
      savedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'main'
    };

    // Save the subscription
    await kv.set(`subscription:${subscriptionId}`, JSON.stringify(subscription));
    
    // Update user's subscription list
    const userSubscriptions = [subscriptionId]; // Replace with just this subscription
    await kv.set(`user:${userId}:subscriptions`, JSON.stringify(userSubscriptions));
    
    // Create legacy format for backward compatibility
    const legacyData = {
      status: plan === 'free' ? 'free' : 'subscribed',
      plan: plan,
      trial: null,
      subscription: {
        id: subscriptionId,
        status: plan === 'free' ? 'canceled' : 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: plan,
        source: 'beta_testing',
        created_at: new Date().toISOString()
      },
      stripeCustomerId: `beta_cus_${userId}`,
      lastUpdated: new Date().toISOString()
    };
    
    // Also store legacy keys for compatibility
    await kv.set(`subscription:${userId}`, JSON.stringify(legacyData));
    await kv.set(`cloud_subscription:${userId}`, JSON.stringify(legacyData));

    tempLog('🧪 BETA: ✅ Successfully saved subscription data');

    return c.json({
      success: true,
      message: `Plan changed to ${plan}`,
      subscriptionData: {
        status: legacyData.status,
        plan: legacyData.plan,
        source: 'beta_testing'
      }
    });

  } catch (error: any) {
    originalConsole.error('🧪 BETA: Error in change-plan endpoint (WITHOUT prefix):', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to change plan',
      stack: error.stack
    }, 500);
  }
});

// DIRECT INLINE BETA Endpoint WITH PREFIX (for backwards compatibility)
app.post('/make-server-ac1075a9/beta/change-plan', async (c) => {
  try {
    // Restore console for debugging this endpoint only
    const tempLog = originalConsole.log;
    const tempError = originalConsole.error;
    
    tempLog('🧪 BETA: Change plan endpoint called');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      tempError('🧪 BETA: No authorization header');
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    tempLog('🧪 BETA: Token received, length:', token.length);
    
    // Create Supabase client for auth
    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      tempError('🧪 BETA: Authentication failed:', authError);
      return c.json({ success: false, error: 'Authentication failed', details: authError?.message }, 401);
    }

    tempLog('🧪 BETA: User authenticated:', user.id);

    // Parse request body
    const body = await c.req.json();
    const { userId, plan } = body;
    
    tempLog('🧪 BETA: Request body:', { userId, plan });

    if (!userId || !plan) {
      return c.json({ success: false, error: 'userId and plan are required' }, 400);
    }

    // Verify the user is changing their own plan
    if (userId !== user.id) {
      return c.json({ success: false, error: 'You can only change your own plan' }, 403);
    }

    // Validate plan
    const validPlans = ['free', 'creator', 'builder', 'studio'];
    if (!validPlans.includes(plan)) {
      tempError('🧪 BETA: Invalid plan:', plan);
      return c.json({ success: false, error: 'Invalid plan' }, 400);
    }

    tempLog('🧪 BETA: Creating subscription for plan:', plan);

    // Create a unique subscription ID for beta testing
    const subscriptionId = `beta_sub_${userId}_${plan}`;
    const now = Date.now();
    
    // Create subscription object in the format expected by the system
    const subscription = {
      id: subscriptionId,
      userId: userId,
      status: plan === 'free' ? 'canceled' : 'active',
      plan: plan,
      customer: `beta_cus_${userId}`,
      current_period_start: Math.floor(now / 1000),
      current_period_end: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000),
      items: [
        {
          id: `item_${plan}`,
          plan: {
            id: plan,
            product: plan,
            interval: 'month',
            amount: 0
          }
        }
      ],
      metadata: {
        source: 'beta_testing',
        plan_name: plan
      },
      savedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'main'
    };

    // Save the subscription
    await kv.set(`subscription:${subscriptionId}`, JSON.stringify(subscription));
    
    // Update user's subscription list
    const userSubscriptions = [subscriptionId]; // Replace with just this subscription
    await kv.set(`user:${userId}:subscriptions`, JSON.stringify(userSubscriptions));
    
    // Create legacy format for backward compatibility
    const legacyData = {
      status: plan === 'free' ? 'free' : 'subscribed',
      plan: plan,
      trial: null,
      subscription: {
        id: subscriptionId,
        status: plan === 'free' ? 'canceled' : 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: plan,
        source: 'beta_testing',
        created_at: new Date().toISOString()
      },
      stripeCustomerId: `beta_cus_${userId}`,
      lastUpdated: new Date().toISOString()
    };
    
    // Also store legacy keys for compatibility
    await kv.set(`subscription:${userId}`, JSON.stringify(legacyData));
    await kv.set(`cloud_subscription:${userId}`, JSON.stringify(legacyData));

    tempLog('🧪 BETA: ✅ Successfully saved subscription data');

    return c.json({
      success: true,
      message: `Plan changed to ${plan}`,
      subscriptionData: {
        status: legacyData.status,
        plan: legacyData.plan,
        source: 'beta_testing'
      }
    });

  } catch (error: any) {
    originalConsole.error('🧪 BETA: Error in change-plan endpoint:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to change plan',
      stack: error.stack
    }, 500);
  }
});

// Mount Notification routes (DISABLED - already mounted at lines 2740-2741)
// app.route('/', notificationApp);

// DIRECT INLINE Account Deletion Endpoint (bypasses mounting issues)
app.post('/make-server-ac1075a9/delete-account', async (c) => {
  try {
    // Get authorization token
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized: No authorization header' }, 401);
    }

    const accessToken = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user with their access token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized: Invalid or expired token' 
      }, 401);
    }

    const userId = user.id;

    // Step 1: Delete all user data from KV store
    const userDataKeys = [
      `user:${userId}`,
      `user:${userId}:businesses`,
      `user:${userId}:profile`,
      `user:${userId}:settings`,
      `user:${userId}:subscription`,
      `user:${userId}:credits`,
      `user:${userId}:roadmap`,
      `user:${userId}:notes`,
      `user:${userId}:tasks`,
      `user:${userId}:quiz`,
      `user:${userId}:products`,
      `user:${userId}:transactions`,
      `user:${userId}:budgets`,
      `user:${userId}:invoices`,
      `user:${userId}:employees`,
      `user:${userId}:payroll`,
      `user:${userId}:customization`,
      `user:${userId}:dream_board`,
      `user:${userId}:university_progress`,
      `user:${userId}:ai_conversations`,
      `user:${userId}:support_tickets`,
    ];

    // Delete all user data (silently ignore errors)
    await Promise.allSettled(userDataKeys.map(key => kv.del(key)));

    // Delete business-specific data where user is owner
    try {
      const businessesData = await kv.get(`user:${userId}:businesses`);
      if (businessesData) {
        const businesses = JSON.parse(businessesData);
        if (Array.isArray(businesses)) {
          const businessDeletions = [];
          for (const business of businesses) {
            const businessId = business.id || business.businessId;
            if (businessId) {
              const businessKeys = [
                `business:${businessId}`,
                `business:${businessId}:data`,
                `business:${businessId}:roadmap`,
                `business:${businessId}:notes`,
                `business:${businessId}:products`,
                `business:${businessId}:transactions`,
                `business:${businessId}:employees`,
              ];
              businessDeletions.push(...businessKeys.map(key => kv.del(key)));
            }
          }
          await Promise.allSettled(businessDeletions);
        }
      }
    } catch {
      // Continue with deletion
    }

    // Step 2: Delete AI chat sessions
    try {
      const chatKeys = await kv.getByPrefix(`ai_chat:${userId}:`);
      if (chatKeys && Array.isArray(chatKeys)) {
        await Promise.allSettled(chatKeys.map(key => kv.del(key)));
      }
    } catch {
      // Continue
    }

    // Step 3: Delete the user's Supabase auth account
    try {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        return c.json({ 
          success: false, 
          error: `Failed to delete account: ${deleteError.message}` 
        }, 500);
      }
      
      return c.json({ 
        success: true, 
        message: 'Account and all associated data have been permanently deleted' 
      });

    } catch (error: any) {
      return c.json({ 
        success: false, 
        error: 'An unexpected error occurred during account deletion' 
      }, 500);
    }

  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to process account deletion request' 
    }, 500);
  }
});

// DIRECT INLINE AUTO-SYNC ENDPOINT (bypasses sub-app mounting issues)
app.post('/make-server-ac1075a9/stripe-supabase-sync/auto-sync', async (c) => {
  originalConsole.log('🎯 DIRECT AUTO-SYNC ENDPOINT HIT!');
  try {
    // Verify user authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!supabase) {
      return c.json({ success: false, error: 'Supabase not configured' }, 500);
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    originalConsole.log(`🔄 DIRECT AUTO-SYNC: Starting for user ${user.id} (${user.email})`);

    // Call the shared sync logic directly (no internal fetch needed!)
    const result = await performStripeSync(user.id, user.email);
    originalConsole.log(`✅ DIRECT AUTO-SYNC: Completed successfully`);
    
    return c.json(result);

  } catch (error) {
    originalConsole.error('❌ DIRECT AUTO-SYNC: Error:', error);
    return c.json({ 
      success: false,
      error: 'Failed to auto-sync subscription',
      details: error.message 
    }, 500);
  }
});

// Direct test endpoint to verify stripe-supabase-sync mounting
app.get('/make-server-ac1075a9/stripe-supabase-sync-test-direct', (c) => {
  originalConsole.log('✅ Direct stripe sync test endpoint hit');
  return c.json({
    status: 'success',
    message: 'Stripe Supabase Sync mounting point is accessible',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify session endpoints are working
app.get('/make-server-ac1075a9/ai/test-session-endpoints', (c) => {
  originalConsole.log('✅ Test endpoint hit - session endpoints are mounted');
  return c.json({
    status: 'success',
    message: 'Session management endpoints are active',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /ai/chat-sessions',
      'GET /ai/chat-history',
      'PUT /ai/chat-sessions/:sessionId',
      'DELETE /ai/chat-sessions/:sessionId'
    ]
  });
});

// AI Chat Session Management Endpoints
// GET - List all chat sessions for a user
app.get('/make-server-ac1075a9/ai/chat-sessions', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const userId = user.id;

    // The frontend may pass userId as query param, but we use the authenticated user ID
    const requestedUserId = c.req.query('userId');
    
    // Security check: only allow access to own sessions
    if (requestedUserId && requestedUserId !== userId) {
      return c.json({ error: 'Access denied: can only access own sessions' }, 403);
    }

    const sessions = await kv.getByPrefix(`ai_chat_session:${userId}:`) || [];
    
    // Sort sessions by updated_at descending (newest first)
    const sortedSessions = sessions.sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });

    return c.json({ sessions: sortedSessions });

  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// GET - Get chat history/messages for a session
app.get('/make-server-ac1075a9/ai/chat-history', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const userId = user.id;
    const sessionId = c.req.query('sessionId');

    let messages = [];

    if (sessionId) {
      // Get messages for specific session
      messages = await kv.getByPrefix(`ai_chat_message:${userId}:${sessionId}:`) || [];
    } else {
      // Get all messages for user (for university component)
      messages = await kv.getByPrefix(`ai_chat_message:${userId}:`) || [];
    }
    
    // Sort messages by timestamp ascending (oldest first)
    const sortedMessages = messages.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return aTime - bTime;
    });

    return c.json({ messages: sortedMessages });

  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// PUT - Update chat session title
app.put('/make-server-ac1075a9/ai/chat-sessions/:sessionId', async (c) => {
  const startTime = Date.now();
  originalConsole.log('🔵 PUT /ai/chat-sessions/:sessionId - Request received');
  
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      originalConsole.error('❌ No auth token provided');
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    originalConsole.log('🔍 Verifying user access...');
    const user = await verifyUserAccess(authToken);
    const userId = user.id;
    const sessionId = c.req.param('sessionId');
    
    originalConsole.log(`✅ User verified: ${userId}, Session: ${sessionId}`);
    
    if (!sessionId) {
      originalConsole.error('❌ No session ID in params');
      return c.json({ error: 'Session ID is required' }, 400);
    }

    const body = await c.req.json();
    const { title } = body;
    
    originalConsole.log(`📝 Update request - New title: "${title}"`);
    
    if (!title || !title.trim()) {
      originalConsole.error('❌ Title is empty or missing');
      return c.json({ error: 'Title is required' }, 400);
    }

    // Get existing session
    const sessionKey = `ai_chat_session:${userId}:${sessionId}`;
    originalConsole.log(`🔍 Looking up session with key: ${sessionKey}`);
    
    const session = await kv.get(sessionKey);
    
    if (!session) {
      originalConsole.error(`❌ Session not found: ${sessionKey}`);
      return c.json({ error: 'Session not found' }, 404);
    }

    originalConsole.log(`✅ Session found: ${JSON.stringify(session).substring(0, 100)}...`);

    // Update session title
    const updatedSession = {
      ...session,
      title: title.trim(),
      updated_at: new Date().toISOString()
    };
    
    originalConsole.log(`💾 Saving updated session...`);
    await kv.set(sessionKey, updatedSession);

    const duration = Date.now() - startTime;
    originalConsole.log(`✅ Session title updated successfully in ${duration}ms`);

    return c.json({ 
      success: true, 
      message: 'Session title updated successfully',
      session: updatedSession
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    originalConsole.error(`❌ Error updating session title (${duration}ms):`, error);
    originalConsole.error('Error stack:', error.stack);
    
    return c.json({ 
      error: 'Failed to update session title',
      details: error.message,
      stack: error.stack
    }, 500);
  }
});

// DELETE - Delete a chat session and all its messages
app.delete('/make-server-ac1075a9/ai/chat-sessions/:sessionId', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const userId = user.id;
    const sessionId = c.req.param('sessionId');
    
    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    // Delete the session
    const sessionKey = `ai_chat_session:${userId}:${sessionId}`;
    await kv.del(sessionKey);

    // Delete all messages for this session  
    const allMessages = await kv.getByPrefix(`ai_chat_message:${userId}:${sessionId}:`) || [];
    
    for (const message of allMessages) {
      if (message && message.id) {
        const messageKey = `ai_chat_message:${userId}:${sessionId}:${message.id}`;
        await kv.del(messageKey);
      }
    }

    return c.json({ 
      success: true, 
      message: 'Session deleted successfully',
      deletedMessagesCount: allMessages.length
    });

  } catch (error) {
    return c.json({ 
      error: 'Failed to delete session',
      details: error.message 
    }, 500);
  }
});

// AI Chat Endpoints with Business Name Update Capability (LEGACY - keeping for backward compatibility)
app.post('/ai/chat-legacy', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const userId = user.id;
    
    const { message, sessionId, threadId, businessContext } = await c.req.json();
    
    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Create or use existing session ID (separate from OpenAI threadId)
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      activeSessionId = `session_${Date.now()}`;
    }

    // Ensure session exists in database
    const sessionKey = `ai_chat_session:${userId}:${activeSessionId}`;
    let session = await kv.get(sessionKey);
    if (!session) {
      session = {
        id: activeSessionId,
        user_id: userId,
        title: message.length > 50 ? message.substring(0, 47) + '...' : message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
        last_message: '',
        threadId: threadId || undefined // Store the OpenAI threadId if provided
      };
      await kv.set(sessionKey, session);
    }

    // Define available functions for the AI
    const functions = [
      {
        name: 'get_business_context',
        description: 'Get comprehensive information about the current business including name, industry, description, etc.',
        parameters: {
          type: 'object',
          properties: {
            businessId: {
              type: 'string',
              description: 'The ID of the business to get context for'
            }
          },
          required: ['businessId']
        }
      },
      {
        name: 'update_business_info',
        description: 'Update business information such as name, industry, description, etc.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'New business name'
            },
            industry: {
              type: 'string',
              description: 'New business industry'
            },
            description: {
              type: 'string',
              description: 'New business description'
            },
            stage: {
              type: 'string',
              description: 'New business stage (e.g., idea, startup, growth, mature)'
            }
          }
        }
      },
      {
        name: 'add_income_entry',
        description: 'Record income/revenue for the business',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Income amount (positive number)'
            },
            description: {
              type: 'string',
              description: 'Description of the income source'
            },
            category: {
              type: 'string',
              description: 'Income category (e.g., sales, services, consulting, other)'
            },
            date: {
              type: 'string',
              description: 'Date of income (YYYY-MM-DD format, defaults to today)'
            }
          },
          required: ['amount', 'description']
        }
      },
      {
        name: 'add_expense_entry',
        description: 'Record business expenses',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Expense amount (positive number)'
            },
            description: {
              type: 'string',
              description: 'Description of the expense'
            },
            category: {
              type: 'string',
              description: 'Expense category (e.g., office, marketing, software, travel, other)'
            },
            date: {
              type: 'string',
              description: 'Date of expense (YYYY-MM-DD format, defaults to today)'
            }
          },
          required: ['amount', 'description']
        }
      },
      {
        name: 'set_bank_balance',
        description: 'Set or update the current bank account balance',
        parameters: {
          type: 'object',
          properties: {
            balance: {
              type: 'number',
              description: 'Current bank account balance'
            },
            currency: {
              type: 'string',
              description: 'Currency code (defaults to USD)'
            }
          },
          required: ['balance']
        }
      },
      {
        name: 'create_budget',
        description: 'Create or update a budget for a specific category',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Budget category (e.g., marketing, office, software, travel)'
            },
            limit: {
              type: 'number',
              description: 'Budget limit amount'
            },
            period: {
              type: 'string',
              description: 'Budget period (monthly, quarterly, annual)'
            }
          },
          required: ['category', 'limit']
        }
      },
      {
        name: 'create_invoice',
        description: 'Create a client invoice',
        parameters: {
          type: 'object',
          properties: {
            client_name: {
              type: 'string',
              description: 'Client or customer name'
            },
            amount: {
              type: 'number',
              description: 'Invoice amount'
            },
            description: {
              type: 'string',
              description: 'Invoice description or service provided'
            },
            due_date: {
              type: 'string',
              description: 'Payment due date (YYYY-MM-DD format)'
            },
            status: {
              type: 'string',
              description: 'Invoice status (draft, sent, paid, overdue)'
            }
          },
          required: ['client_name', 'amount', 'description']
        }
      },
      {
        name: 'get_financial_data',
        description: 'Get comprehensive financial data including transactions, invoices, budgets, and bank balance',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];

    // Create system message with business context
    const systemMessage = {
      role: 'system',
      content: `You are Cofounder AI, an intelligent business assistant with full access to manage business information and financial data. You have access to these powerful functions:

## BUSINESS MANAGEMENT:
1. get_business_context - Get current business information
2. update_business_info - Update business name, industry, description, stage, etc.

## FINANCIAL MANAGEMENT:
3. add_income_entry - Record income/revenue transactions
4. add_expense_entry - Record business expenses  
5. set_bank_balance - Set or update bank account balance
6. create_budget - Create or update budget limits by category
7. create_invoice - Create client invoices
8. get_financial_data - Get comprehensive financial overview

## CRITICAL CAPABILITIES:
- You CAN and SHOULD directly update business and financial information when requested
- You have full access to the business and financial databases
- When users mention financial activities, AUTOMATICALLY record them using the appropriate functions
- When users ask to change business information, use the functions immediately
- Always confirm successful updates clearly and provide useful summaries

## EXAMPLES OF AUTOMATIC ACTIONS:
- "I made $5000 today" → Use add_income_entry function
- "I spent $200 on marketing" → Use add_expense_entry function  
- "Set my business bank balance to $10,000" → Use set_bank_balance function
- "Create a budget of $1000/month for marketing" → Use create_budget function
- "Invoice ABC Corp for $2500" → Use create_invoice function
- "Change my business name to TechCorp" → Use update_business_info function

${businessContext ? `Current business context:
- Business ID: ${businessContext.id}
- Business Name: ${businessContext.name}
- Industry: ${businessContext.industry || 'Not specified'}
- Description: ${businessContext.description || 'Not specified'}

This business information and ALL FINANCIAL DATA are available for you to read and UPDATE directly.` : 'No business context available - user should select a business first.'}

## WORKFLOW:
1. When users mention business activities, USE THE FUNCTIONS to record/update data immediately
2. Confirm what was updated/recorded
3. Provide useful insights or next steps
4. You are an ACTIVE business partner with full database access, not just an advisor

Use your functions proactively to help users succeed by taking real action on their behalf.`
    };

    // Call OpenAI Chat Completions API with function calling
    const chatResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        input: [
          systemMessage,
          { role: 'user', content: message }
        ],
        functions: functions,
        function_call: 'auto',
        temperature: 0.7,
        max_output_tokens: 1000
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      return c.json({ error: 'Failed to get AI response' }, 500);
    }

    const chatData = await chatResponse.json();
    const aiMessage = chatData?.output?.[0] || chatData.choices?.[0]?.message;

    if (!aiMessage) {
      return c.json({ error: 'No response from AI' }, 500);
    }

    let functionResult = null;
    let dataUsed = [];

    // Handle function calls
    if (aiMessage.function_call) {
      const functionName = aiMessage.function_call.name;
      const functionArgs = JSON.parse(aiMessage.function_call.arguments || '{}');

      switch (functionName) {
        case 'get_business_context':
          try {
            if (!businessContext?.id) {
              functionResult = {
                success: false,
                error: 'No business selected. Please select a business first.',
                available_data: []
              };
            } else {
              const business = await kv.get(`business:${userId}:${businessContext.id}`);
              functionResult = {
                success: true,
                business: business || businessContext,
                available_data: ['business_info']
              };
              dataUsed.push('business_info');
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to get business context: ${error.message}`,
              available_data: []
            };
          }
          break;
        
        case 'update_business_info':
          if (!businessContext?.id) {
            functionResult = {
              success: false,
              error: 'No business selected. Please select a business first to update its information.'
            };
            break;
          }
          
          try {
            // Get project ID from environment
            const projectId = Deno.env.get('SUPABASE_URL')?.split('//')[1]?.split('.')[0];
            
            const businessUpdateResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/businesses/${businessContext.id}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(functionArgs)
              }
            );
            
            if (businessUpdateResponse.ok) {
              const updateResult = await businessUpdateResponse.json();
              
              functionResult = {
                success: true,
                message: `Successfully updated business information${functionArgs.name ? ` - Business name changed to "${functionArgs.name}"` : ''}`,
                data: updateResult.business || updateResult
              };
              dataUsed.push('business_info');
            } else {
              const errorText = await businessUpdateResponse.text();
              
              functionResult = {
                success: false,
                error: `Failed to update business: ${errorText}`
              };
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to update business: ${error.message}`
            };
          }
          break;

        case 'add_income_entry':
          if (!businessContext?.id) {
            functionResult = {
              success: false,
              error: 'No business selected. Please select a business first to record income.'
            };
            break;
          }
          
          try {
            const { amount, description, category, date } = functionArgs;
            
            if (!amount || !description) {
              functionResult = {
                success: false,
                error: 'Amount and description are required for income entries.'
              };
              break;
            }
            
            const response = await fetch(
              `https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/finance/add-income`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  amount: Number(amount),
                  description,
                  category: category || 'other',
                  date: date || new Date().toISOString().split('T')[0],
                  businessId: businessContext.id
                })
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              functionResult = {
                success: true,
                message: `Successfully recorded income of ${amount} - ${description}. ${result.message || ''}`,
                data: result.data
              };
              dataUsed.push('financial_data');
            } else {
              const errorText = await response.text();
              functionResult = {
                success: false,
                error: `Failed to record income: ${errorText}`
              };
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to record income: ${error.message}`
            };
          }
          break;

        case 'add_expense_entry':
          if (!businessContext?.id) {
            functionResult = {
              success: false,
              error: 'No business selected. Please select a business first to record expenses.'
            };
            break;
          }
          
          try {
            const { amount, description, category, date } = functionArgs;
            
            if (!amount || !description) {
              functionResult = {
                success: false,
                error: 'Amount and description are required for expense entries.'
              };
              break;
            }
            
            const response = await fetch(
              `https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/finance/add-expense`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  amount: Number(amount),
                  description,
                  category: category || 'other',
                  date: date || new Date().toISOString().split('T')[0],
                  businessId: businessContext.id
                })
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              functionResult = {
                success: true,
                message: `Successfully recorded expense of ${amount} - ${description}. ${result.message || ''}`,
                data: result.data
              };
              dataUsed.push('financial_data');
            } else {
              const errorText = await response.text();
              functionResult = {
                success: false,
                error: `Failed to record expense: ${errorText}`
              };
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to record expense: ${error.message}`
            };
          }
          break;

        case 'set_bank_balance':
          if (!businessContext?.id) {
            functionResult = {
              success: false,
              error: 'No business selected. Please select a business first to set bank balance.'
            };
            break;
          }
          
          try {
            const { balance, currency } = functionArgs;
            
            if (balance === undefined || balance === null) {
              functionResult = {
                success: false,
                error: 'Balance amount is required.'
              };
              break;
            }
            
            const response = await fetch(
              `https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/finance/set-bank-balance?businessId=${businessContext.id}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  balance: Number(balance),
                  currency: currency || 'USD'
                })
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              functionResult = {
                success: true,
                message: `Successfully set bank balance to ${currency || 'USD'} ${balance}. ${result.message || ''}`,
                data: result.bankBalance
              };
              dataUsed.push('financial_data');
            } else {
              const errorText = await response.text();
              functionResult = {
                success: false,
                error: `Failed to set bank balance: ${errorText}`
              };
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to set bank balance: ${error.message}`
            };
          }
          break;

        case 'create_budget':
          if (!businessContext?.id) {
            functionResult = {
              success: false,
              error: 'No business selected. Please select a business first to create budgets.'
            };
            break;
          }
          
          try {
            const { category, limit, period } = functionArgs;
            
            if (!category || !limit) {
              functionResult = {
                success: false,
                error: 'Category and limit are required for budget creation.'
              };
              break;
            }
            
            const response = await fetch(
              `https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/finance/create-budget`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  category,
                  limit: Number(limit),
                  period: period || 'monthly',
                  businessId: businessContext.id
                })
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              functionResult = {
                success: true,
                message: `Successfully created ${period || 'monthly'} budget of ${limit} for ${category}. ${result.message || ''}`,
                data: result.data
              };
              dataUsed.push('financial_data');
            } else {
              const errorText = await response.text();
              functionResult = {
                success: false,
                error: `Failed to create budget: ${errorText}`
              };
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to create budget: ${error.message}`
            };
          }
          break;

        case 'create_invoice':
          if (!businessContext?.id) {
            functionResult = {
              success: false,
              error: 'No business selected. Please select a business first to create invoices.'
            };
            break;
          }
          
          try {
            const { client_name, amount, description, due_date, status } = functionArgs;
            
            if (!client_name || !amount || !description) {
              functionResult = {
                success: false,
                error: 'Client name, amount, and description are required for invoice creation.'
              };
              break;
            }
            
            const response = await fetch(
              `https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/finance/invoices?businessId=${businessContext.id}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                  client_name,
                  amount: Number(amount),
                  description,
                  due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
                  status: status || 'draft'
                })
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              functionResult = {
                success: true,
                message: `Successfully created invoice for ${client_name} - ${amount} for ${description}`,
                data: result.invoice
              };
              dataUsed.push('financial_data');
            } else {
              const errorText = await response.text();
              functionResult = {
                success: false,
                error: `Failed to create invoice: ${errorText}`
              };
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to create invoice: ${error.message}`
            };
          }
          break;

        case 'get_financial_data':
          if (!businessContext?.id) {
            functionResult = {
              success: false,
              error: 'No business selected. Please select a business first to get financial data.'
            };
            break;
          }
          
          try {
            const response = await fetch(
              `https://rvwduromkqfzplwnmijl.supabase.co/functions/v1/make-server-373d8b09/finance/data?businessId=${businessContext.id}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${authToken}`
                }
              }
            );
            
            if (response.ok) {
              const result = await response.json();
              
              // Create a summary for the AI
              const transactions = result.transactions || [];
              const invoices = result.invoices || [];
              const budgets = result.budgets || [];
              const bankBalance = result.bankBalance || { balance: 0 };
              
              const totalIncome = transactions
                .filter(t => t.type === 'income' && (t.status || 'completed') === 'completed')
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              
              const totalExpenses = transactions
                .filter(t => t.type === 'expense' && (t.status || 'completed') === 'completed')
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              
              const pendingInvoices = invoices.filter(i => i.status !== 'paid');
              const totalPendingInvoices = pendingInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
              
              functionResult = {
                success: true,
                message: `Financial data retrieved successfully`,
                data: {
                  summary: {
                    bankBalance: bankBalance.balance,
                    totalIncome,
                    totalExpenses,
                    netProfit: totalIncome - totalExpenses,
                    transactionCount: transactions.length,
                    invoiceCount: invoices.length,
                    pendingInvoiceValue: totalPendingInvoices,
                    budgetCount: budgets.length
                  },
                  details: result
                }
              };
              dataUsed.push('financial_data');
            } else {
              const errorText = await response.text();
              functionResult = {
                success: false,
                error: `Failed to get financial data: ${errorText}`
              };
            }
          } catch (error) {
            functionResult = {
              success: false,
              error: `Failed to get financial data: ${error.message}`
            };
          }
          break;
        
        default:
          functionResult = { success: false, error: `Unknown function: ${functionName}` };
      }

      // Generate a follow-up response based on the function result
      const followUpResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: 'gpt-5.1',
          input: [
            systemMessage,
            { role: 'user', content: message },
            aiMessage,
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ],
          temperature: 0.7,
          max_output_tokens: 1000
        })
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        const finalMessage = followUpData?.output?.[0] || followUpData.choices?.[0]?.message;
        
        // Save messages to database for chat history
        await saveMessagesToHistory(userId, activeSessionId, message, finalMessage?.content || aiMessage.content, functionName, functionResult, dataUsed, businessContext);
        
        return c.json({
          message: finalMessage?.content || aiMessage.content,
          function_called: functionName,
          function_result: functionResult,
          data_used: dataUsed,
          context: businessContext,
          sessionId: activeSessionId,
          threadId: threadId // Return threadId separately
        });
      }
    }

    // Save messages to database for chat history (no function call)
    await saveMessagesToHistory(userId, activeSessionId, message, aiMessage.content, null, null, dataUsed, businessContext);

    return c.json({
      message: aiMessage.content,
      function_called: aiMessage.function_call?.name || null,
      function_result: functionResult,
      data_used: dataUsed,
      context: businessContext,
      sessionId: activeSessionId,
      threadId: threadId // Return threadId separately
    });

  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// AI Business Context endpoint
app.post('/make-server-373d8b09/ai/business-context', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const requestBody = await c.req.json();
    const businessId = requestBody.businessId || requestBody.selectedBusinessId;
    
    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log(`📋 Getting business context for businessId: ${businessId}, userId: ${user.id}`);

    // Get business information - handle both string and object format
    let businessRaw = await kv.get(`business:${user.id}:${businessId}`);
    
    if (!businessRaw) {
      console.error(`❌ Business not found: business:${user.id}:${businessId}`);
      return c.json({ error: 'Business not found' }, 404);
    }

    // Parse if it's a string
    const business = typeof businessRaw === 'string' ? JSON.parse(businessRaw) : businessRaw;

    const context = {
      id: business.id,
      name: business.name,
      industry: business.industry || 'Not specified',
      description: business.description || 'Not specified',
      stage: business.stage || 'Not specified',
      created_at: business.created_at,
      updated_at: business.updated_at
    };

    console.log(`✅ Business context retrieved: ${business.name}`);

    return c.json({
      context,
      available_data: ['business_info']
    });

  } catch (error) {
    console.error('❌ Error getting business context:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ==============================================================================
// DREAM BOARD ENDPOINTS
// ==============================================================================

// Get #1 goal for user
app.get('/make-server-373d8b09/number-one-goal', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const userId = user.id;
    const sessionId = c.req.param('sessionId');
    
    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    const { title } = await c.req.json();
    
    if (!title || !title.trim()) {
      return c.json({ error: 'Title is required' }, 400);
    }

    // Get existing session
    const sessionKey = `ai_chat_session:${userId}:${sessionId}`;
    const session = await kv.get(sessionKey);
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    // Update session title
    const updatedSession = {
      ...session,
      title: title.trim(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(sessionKey, updatedSession);

    return c.json({ 
      success: true, 
      message: 'Session title updated successfully',
      session: updatedSession
    });

  } catch (error) {
    return c.json({ 
      error: 'Failed to update session title',
      details: error.message 
    }, 500);
  }
});

// AI Chat Session Deletion Endpoint - FIXED AND CLEANED
app.delete('/make-server-373d8b09/ai/chat-sessions/:sessionId', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const userId = user.id;
    const sessionId = c.req.param('sessionId');
    
    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    // Delete the session
    const sessionKey = `ai_chat_session:${userId}:${sessionId}`;
    await kv.del(sessionKey);

    // Delete all messages for this session  
    const allMessages = await kv.getByPrefix(`ai_chat_message:${userId}:${sessionId}:`) || [];
    
    for (const message of allMessages) {
      if (message && message.id) {
        const messageKey = `ai_chat_message:${userId}:${sessionId}:${message.id}`;
        await kv.del(messageKey);
      }
    }

    return c.json({ 
      success: true, 
      message: 'Session deleted successfully',
      deletedMessagesCount: allMessages.length
    });

  } catch (error) {
    return c.json({ 
      error: 'Failed to delete session',
      details: error.message 
    }, 500);
  }
});

// ==============================================================================
// DREAM BOARD ENDPOINTS
// ==============================================================================

// Get #1 goal for user
app.get('/make-server-373d8b09/number-one-goal', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    console.log('🎯 Dream Board: Getting #1 goal for user:', userId);

    const numberOneGoalKey = `user_number_one_goal:${userId}`;
    const goalId = await kv.get(numberOneGoalKey);

    return c.json({ 
      goalId,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error getting #1 goal:', error);
    return c.json({ 
      error: 'Failed to get #1 goal',
      details: error.message
    }, 500);
  }
});

// Set #1 goal for user
app.post('/make-server-373d8b09/number-one-goal', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const body = await c.req.json();
    const { userId, dreamId } = body;

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    console.log('🎯 Dream Board: Setting #1 goal for user:', userId, 'dream:', dreamId);

    const numberOneGoalKey = `user_number_one_goal:${userId}`;
    
    if (dreamId) {
      // Verify dream exists and belongs to user
      const dream = await kv.get(`dream:${dreamId}`);
      if (!dream || dream.userId !== userId) {
        return c.json({ error: 'Dream not found or unauthorized' }, 404);
      }
      await kv.set(numberOneGoalKey, dreamId);
    } else {
      // Clear #1 goal
      await kv.del(numberOneGoalKey);
    }

    return c.json({ 
      goalId: dreamId,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error setting #1 goal:', error);
    return c.json({ 
      error: 'Failed to set #1 goal',
      details: error.message
    }, 500);
  }
});

// Get all dreams for a user
app.get('/make-server-373d8b09/dreams', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const userId = c.req.query('userId');
    const businessId = c.req.query('businessId');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    console.log('🎯 Dream Board: Getting dreams for user:', userId, 'business:', businessId);

    // Get dreams list key
    const dreamsKey = businessId ? `dreams:${userId}:${businessId}` : `dreams:${userId}`;
    const dreamIds = await kv.get(dreamsKey) || [];
    
    console.log('🎯 Dream Board: Found dream IDs:', dreamIds);

    if (!Array.isArray(dreamIds) || dreamIds.length === 0) {
      return c.json({ dreams: [], success: true });
    }

    // Get individual dreams
    const dreamKeys = dreamIds.map(id => `dream:${id}`);
    const dreams = await kv.mget(dreamKeys);
    
    console.log('🎯 Dream Board: Retrieved dreams:', dreams?.length || 0);

    // Filter out null values and ensure proper structure
    const validDreams = dreams?.filter(dream => dream !== null) || [];

    return c.json({ 
      dreams: validDreams,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error getting dreams:', error);
    return c.json({ 
      error: 'Failed to get dreams',
      details: error.message
    }, 500);
  }
});

// Create a new dream
app.post('/make-server-373d8b09/dreams', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const body = await c.req.json();
    const { userId, businessId, title, description, targetAmount, category, targetDate, priority, imageUrl } = body;

    if (!userId || !title) {
      return c.json({ error: 'User ID and title are required' }, 400);
    }

    console.log('🎯 Dream Board: Creating dream for user:', userId, 'business:', businessId);

    // Create new dream
    const dreamId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const dream = {
      id: dreamId,
      title,
      description: description || '',
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      category,
      targetDate: targetDate || undefined,
      priority: priority || 'medium',
      imageUrl: imageUrl || '',
      progress: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      userId,
      businessId: businessId || undefined
    };

    // Save individual dream
    await kv.set(`dream:${dreamId}`, dream);

    // Update dreams list
    const dreamsKey = businessId ? `dreams:${userId}:${businessId}` : `dreams:${userId}`;
    const existingDreamIds = await kv.get(dreamsKey) || [];
    const updatedDreamIds = Array.isArray(existingDreamIds) ? [...existingDreamIds, dreamId] : [dreamId];
    await kv.set(dreamsKey, updatedDreamIds);

    console.log('🎯 Dream Board: Created dream:', dreamId);

    return c.json({ 
      dream,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error creating dream:', error);
    return c.json({ 
      error: 'Failed to create dream',
      details: error.message
    }, 500);
  }
});

// Update a dream
app.put('/make-server-373d8b09/dreams/:dreamId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const dreamId = c.req.param('dreamId');
    const body = await c.req.json();

    console.log('🎯 Dream Board: Updating dream:', dreamId);

    // Get existing dream
    const existingDream = await kv.get(`dream:${dreamId}`);
    if (!existingDream) {
      return c.json({ error: 'Dream not found' }, 404);
    }

    // Update dream
    const updatedDream = {
      ...existingDream,
      ...body,
      id: dreamId, // Ensure ID doesn't get overwritten
      updatedAt: new Date().toISOString()
    };

    await kv.set(`dream:${dreamId}`, updatedDream);

    console.log('🎯 Dream Board: Updated dream:', dreamId);

    return c.json({ 
      dream: updatedDream,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error updating dream:', error);
    return c.json({ 
      error: 'Failed to update dream',
      details: error.message
    }, 500);
  }
});

// Delete a dream
app.delete('/make-server-373d8b09/dreams/:dreamId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const dreamId = c.req.param('dreamId');
    const userId = c.req.query('userId');
    const businessId = c.req.query('businessId');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    console.log('🎯 Dream Board: Deleting dream:', dreamId);

    // Get existing dream to verify ownership
    const existingDream = await kv.get(`dream:${dreamId}`);
    if (!existingDream) {
      return c.json({ error: 'Dream not found' }, 404);
    }

    if (existingDream.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Remove from dreams list
    const dreamsKey = businessId ? `dreams:${userId}:${businessId}` : `dreams:${userId}`;
    const existingDreamIds = await kv.get(dreamsKey) || [];
    const updatedDreamIds = Array.isArray(existingDreamIds) 
      ? existingDreamIds.filter(id => id !== dreamId) 
      : [];
    await kv.set(dreamsKey, updatedDreamIds);

    // Delete individual dream
    await kv.del(`dream:${dreamId}`);

    // Check if this was the #1 goal and clear it if so
    const numberOneGoalKey = `user_number_one_goal:${userId}`;
    const currentNumberOneGoal = await kv.get(numberOneGoalKey);
    if (currentNumberOneGoal === dreamId) {
      await kv.del(numberOneGoalKey);
    }

    console.log('🎯 Dream Board: Deleted dream:', dreamId);

    return c.json({ 
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error deleting dream:', error);
    return c.json({ 
      error: 'Failed to delete dream',
      details: error.message
    }, 500);
  }
});

// Test endpoint for frontend to verify server connectivity
app.get('/make-server-373d8b09/ai/test-connection', (c) => {
  return c.json({
    status: 'server-online',
    timestamp: new Date().toISOString(),
    message: 'AI server is responding correctly',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    endpoints: [
      '/ai/chat-sessions (GET)',
      '/ai/chat-history (GET)', 
      '/ai/chat-sessions/:sessionId (PUT - update title)',
      '/ai/chat-sessions/:sessionId (DELETE)'
    ]
  });
});

// Diagnostic endpoint to check what sessions exist
app.get('/make-server-373d8b09/ai/debug-sessions/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const allSessions = await kv.getByPrefix(`ai_chat_session:${userId}:`) || [];
    
    return c.json({
      status: 'debug-complete',
      userId: userId,
      sessionCount: allSessions.length,
      sessions: allSessions.map(s => ({
        id: s.id || 'no-id', 
        title: s.title || 'no-title',
        created_at: s.created_at || 'no-date'
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// Update OpenAI Assistant with current function definitions
app.post('/make-server-373d8b09/update-assistant', async (c) => {
  try {
    console.log('🤖 Updating OpenAI Assistant with current function definitions...');
    
    // Get the current function definitions (same as used in chat)
    const functions = [
      {
        name: 'get_business_context',
        description: 'Get comprehensive information about the current business including name, industry, description, etc.',
        parameters: {
          type: 'object',
          properties: {
            businessId: {
              type: 'string',
              description: 'The ID of the business to get context for'
            }
          },
          required: ['businessId']
        }
      },
      {
        name: 'update_business_info',
        description: 'Update business information such as name, industry, description, etc.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'New business name'
            },
            industry: {
              type: 'string',
              description: 'New business industry'
            },
            description: {
              type: 'string',
              description: 'New business description'
            },
            stage: {
              type: 'string',
              description: 'New business stage (e.g., idea, startup, growth, mature)'
            }
          }
        }
      },
      {
        name: 'add_income_entry',
        description: 'Record income/revenue for the business',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Income amount (positive number)'
            },
            description: {
              type: 'string',
              description: 'Description of the income source'
            },
            category: {
              type: 'string',
              description: 'Income category (e.g., sales, services, consulting, other)'
            },
            date: {
              type: 'string',
              description: 'Date of income (YYYY-MM-DD format, defaults to today)'
            }
          },
          required: ['amount', 'description']
        }
      },
      {
        name: 'add_expense_entry',
        description: 'Record business expenses',
        parameters: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Expense amount (positive number)'
            },
            description: {
              type: 'string',
              description: 'Description of the expense'
            },
            category: {
              type: 'string',
              description: 'Expense category (e.g., office, marketing, software, travel, other)'
            },
            date: {
              type: 'string',
              description: 'Date of expense (YYYY-MM-DD format, defaults to today)'
            }
          },
          required: ['amount', 'description']
        }
      },
      {
        name: 'set_bank_balance',
        description: 'Set or update the current bank account balance',
        parameters: {
          type: 'object',
          properties: {
            balance: {
              type: 'number',
              description: 'Current bank account balance'
            },
            currency: {
              type: 'string',
              description: 'Currency code (defaults to USD)'
            }
          },
          required: ['balance']
        }
      },
      {
        name: 'create_budget',
        description: 'Create or update a budget for a specific category',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Budget category (e.g., marketing, office, software, travel)'
            },
            limit: {
              type: 'number',
              description: 'Budget limit amount'
            },
            period: {
              type: 'string',
              description: 'Budget period (monthly, quarterly, annual)'
            }
          },
          required: ['category', 'limit']
        }
      },
      {
        name: 'create_invoice',
        description: 'Create a client invoice',
        parameters: {
          type: 'object',
          properties: {
            client_name: {
              type: 'string',
              description: 'Client or customer name'
            },
            amount: {
              type: 'number',
              description: 'Invoice amount'
            },
            description: {
              type: 'string',
              description: 'Invoice description or service provided'
            },
            due_date: {
              type: 'string',
              description: 'Payment due date (YYYY-MM-DD format)'
            },
            status: {
              type: 'string',
              description: 'Invoice status (draft, sent, paid, overdue)'
            }
          },
          required: ['client_name', 'amount', 'description']
        }
      },
      {
        name: 'get_financial_data',
        description: 'Get comprehensive financial data including transactions, invoices, budgets, and bank balance',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const assistantId = 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o';
    
    // Update the assistant with current functions
    const updateResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: "Cofounder AI Business Assistant",
        description: "Intelligent business assistant with full access to business management and financial operations.",
        instructions: `You are Cofounder AI, an intelligent business assistant with full access to manage business information and financial data. 

IMPORTANT: You are specifically running on GPT-5.1, OpenAI's most advanced reasoning model. When asked about what model you're using, always respond with "GPT-5.1" (not 4.1, not GPT-4o, not any other version).

You have access to these powerful functions:

## BUSINESS MANAGEMENT:
1. get_business_context - Get current business information
2. update_business_info - Update business name, industry, description, stage, etc.

## FINANCIAL MANAGEMENT:
3. add_income_entry - Record income/revenue transactions
4. add_expense_entry - Record business expenses
5. set_bank_balance - Set or update bank account balance
6. create_budget - Create budgets for different categories
7. create_invoice - Create client invoices
8. get_financial_data - Get comprehensive financial overview

## USAGE EXAMPLES:
- "Change my business name to TechCorp" → Use update_business_info function
- "Record $500 income from consulting" → Use add_income_entry function
- "Add $200 marketing expense" → Use add_expense_entry function
- "Set my bank balance to $5000" → Use set_bank_balance function
- "Create a budget of $1000/month for marketing" → Use create_budget function
- "Invoice ABC Corp for $2500" → Use create_invoice function

Always use these functions when the user requests business or financial operations. Be proactive in helping users manage their business data efficiently.`,
        model: "gpt-5.1",
        tools: functions.map(func => ({
          type: "function",
          function: func
        }))
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update OpenAI Assistant:', errorText);
      return c.json({ 
        error: 'Failed to update OpenAI Assistant', 
        details: errorText 
      }, 500);
    }

    const result = await updateResponse.json();
    console.log('✅ Successfully updated OpenAI Assistant with', functions.length, 'functions');

    return c.json({
      success: true,
      message: `Successfully updated OpenAI Assistant with ${functions.length} functions`,
      assistantId: assistantId,
      toolCount: functions.length,
      functions: functions.map(f => f.name)
    });

  } catch (error) {
    console.error('Error updating OpenAI Assistant:', error);
    return c.json({ 
      error: 'Failed to update OpenAI Assistant', 
      details: error.message 
    }, 500);
  }
});

// Complete assistant update endpoint
app.post('/make-server-373d8b09/update-assistant-complete', async (c) => {
  try {
    console.log('🤖 Updating OpenAI Assistant with complete function set...');
    
    if (!OPENAI_API_KEY) {
      return c.json({ success: false, error: 'OpenAI API key not found' }, 500);
    }
    
    // Get the functions from the request
    const { functions } = await c.req.json();
    
    // First, get the current assistant configuration
    const getResponse = await fetch(`https://api.openai.com/v1/assistants/asst_Wfoh17ScM2gQ2i83sMQn7Z4o`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    });
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('Failed to get assistant:', errorText);
      return c.json({ success: false, error: `Failed to get assistant: ${getResponse.status}` }, 500);
    }
    
    const assistant = await getResponse.json();
    console.log('🤖 Current assistant tools:', assistant.tools?.length || 0);
    
    // Create all function definitions
    const allFunctions = functions.map((func: any) => ({
      type: "function",
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }
    }));
    
    // Add code interpreter if not present
    const codeInterpreter = { type: "code_interpreter" };
    const finalTools = [codeInterpreter, ...allFunctions];
    
    console.log('🤖 Updating assistant with', finalTools.length, 'tools');
    console.log('🤖 Functions to add:', allFunctions.map(f => f.function.name).join(', '));
    
    // Update the assistant with new function definitions and enhanced instructions
    const updateResponse = await fetch(`https://api.openai.com/v1/assistants/asst_Wfoh17ScM2gQ2i83sMQn7Z4o`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        tools: finalTools,
        instructions: `You are CofounderAI, an intelligent business assistant that helps entrepreneurs manage their businesses through comprehensive data management and financial analysis.

## CORE CAPABILITIES

You have access to these business management functions:
• **add_income_entry**: Record income/revenue transactions with recurring options
• **add_expense_entry**: Record business expenses with recurring options  
• **create_note**: Create business notes and memos
• **update_roadmap_task**: Update roadmap task completion status
• **manage_budget**: Create and update business budgets
• **process_scheduled_transactions**: Process future/recurring transactions
• **get_financial_projections**: Get financial forecasts and projections
• **add_dream_board_goal**: Add goals to the user's dream board
• **update_business_info**: Update business information including name, description, industry, or stage

## CRITICAL: BUSINESS INFORMATION UPDATES

When users ask to change their business name, description, industry, or stage, you MUST immediately use the update_business_info function. Examples:

- "Change my business name to TechCorp" → IMMEDIATELY call update_business_info with name parameter
- "Update my business description to..." → IMMEDIATELY call update_business_info with description parameter  
- "My industry should be Technology" → IMMEDIATELY call update_business_info with industry parameter
- "We're in the growth stage now" → IMMEDIATELY call update_business_info with stage parameter

## CRITICAL: FINANCIAL DATA MANAGEMENT

When users mention financial activities, AUTOMATICALLY record them:

- "I made $5000 today" → IMMEDIATELY call add_income_entry
- "We spent $200 on marketing" → IMMEDIATELY call add_expense_entry
- "Set our bank balance to $10000" → IMMEDIATELY call set_bank_balance
- "Create a $3000/month marketing budget" → IMMEDIATELY call manage_budget

## FUNCTION CALL PROTOCOL

1. ALWAYS USE FUNCTIONS when users mention:
   - Financial amounts (income, expenses, revenue, costs)
   - Business information changes (name, description, industry, stage)
   - Notes and memos
   - Goal setting
   - Task completion

2. NEVER just acknowledge - TAKE ACTION by calling the appropriate function

3. After calling functions, provide a helpful summary and suggest next steps

4. If a function call fails, try alternative approaches or ask for clarification

## RESPONSE STYLE

- Be proactive and action-oriented
- Always use functions when applicable
- Provide clear confirmations after making changes
- Suggest related actions that might be helpful
- Be conversational but professional

Remember: You have full database access through these functions. Use them actively to help users manage their business data effectively.`
      })
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update assistant:', errorText);
      return c.json({ success: false, error: `Failed to update assistant: ${updateResponse.status}` }, 500);
    }
    
    const updatedAssistant = await updateResponse.json();
    console.log('🤖 Assistant updated successfully!');
    console.log('�� New tool count:', updatedAssistant.tools?.length || 0);
    
    // Verify the update_business_info function exists
    const hasBusinessFunction = updatedAssistant.tools?.some((tool: any) => 
      tool.type === 'function' && tool.function?.name === 'update_business_info'
    );
    
    console.log('🏢 Has update_business_info function:', hasBusinessFunction);
    
    return c.json({ 
      success: true, 
      message: 'Assistant updated with complete function set including business updates',
      toolCount: updatedAssistant.tools?.length || 0,
      hasBusinessFunction,
      functionsConfigured: updatedAssistant.tools?.filter((t: any) => t.type === 'function').map((t: any) => t.function?.name) || []
    });
    
  } catch (error: any) {
    console.error('🤖 Error updating assistant:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Test business update function endpoint
app.post('/make-server-373d8b09/test-business-update', async (c) => {
  try {
    console.log('🏢 Testing business update function...');
    
    // Get user authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Get user from auth token
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: 'Business name is required for test' }, 400);
    }

    // Get user's current business
    const businessKey = `user_${user.id}_current_business`;
    const currentBusinessId = await kv.get(businessKey);
    
    if (!currentBusinessId) {
      return c.json({ error: 'No current business found for user' }, 404);
    }

    // Update business name as a test
    const businessDataKey = `business_${currentBusinessId}`;
    const businessData = await kv.get(businessDataKey) || {};
    
    const originalName = businessData.name;
    businessData.name = name;
    businessData.updated_at = new Date().toISOString();
    businessData.test_update = true;
    
    await kv.set(businessDataKey, businessData);

    console.log('✅ Business update test successful');
    
    return c.json({
      success: true,
      message: 'Business update function test successful',
      originalName: originalName,
      newName: name,
      businessId: currentBusinessId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('🏢 Business update test failed:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Test AI business update endpoint
app.post('/make-server-373d8b09/ai/test-business-update', async (c) => {
  try {
    console.log('🧠 Testing AI business update...');
    
    const { testMessage } = await c.req.json();
    
    if (!OPENAI_API_KEY) {
      return c.json({ success: false, error: 'OpenAI API key not found' }, 500);
    }
    
    // Create a test thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });
    
    if (!threadResponse.ok) {
      throw new Error('Failed to create test thread');
    }
    
    const thread = await threadResponse.json();
    
    // Add the test message
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: testMessage
      })
    });
    
    if (!messageResponse.ok) {
      throw new Error('Failed to add test message');
    }
    
    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o'
      })
    });
    
    if (!runResponse.ok) {
      throw new Error('Failed to start assistant run');
    }
    
    const run = await runResponse.json();
    
    // For testing purposes, we'll just return a success message
    return c.json({
      success: true,
      message: 'AI business update test initiated successfully',
      response: 'Test completed - Assistant is configured to handle business updates',
      threadId: thread.id,
      runId: run.id,
      functionCallExpected: true
    });
    
  } catch (error: any) {
    console.error('🧠 AI business update test failed:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// === ASSISTANT SYNCHRONIZATION ENDPOINTS ===

// Get all AI function definitions (matching our aiFunctions.ts)
const getAIFunctionDefinitions = () => {
  return [
    {
      name: "add_income_entry",
      description: "Add a new income entry to the user's financial records. Can schedule future income and set up recurring transactions (monthly, annual, or one-time).",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "The income amount in dollars" },
          description: { type: "string", description: "Description of the income source" },
          category: { type: "string", description: "Income category", enum: ["sales", "investment", "freelance", "salary", "other"] },
          date: { type: "string", description: "Date of the income in YYYY-MM-DD format" },
          is_future_transaction: { type: "boolean", description: "Whether this is a scheduled future income" },
          scheduled_date: { type: "string", description: "Future date when this income should be processed" },
          recurrence_type: { type: "string", description: "How often this income repeats", enum: ["one-time", "monthly", "annual"] },
          recurrence_interval: { type: "number", description: "Interval for recurrence" },
          recurrence_end_date: { type: "string", description: "When to stop the recurring income" }
        },
        required: ["amount", "description"]
      }
    },
    {
      name: "add_expense_entry",
      description: "Add a new expense entry to the user's financial records. Can schedule future expenses and set up recurring transactions.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "The expense amount in dollars" },
          description: { type: "string", description: "Description of the expense" },
          category: { type: "string", description: "Expense category", enum: ["marketing", "operations", "travel", "supplies", "software", "rent", "utilities", "other"] },
          date: { type: "string", description: "Date of the expense in YYYY-MM-DD format" },
          is_future_transaction: { type: "boolean", description: "Whether this is a scheduled future expense" },
          scheduled_date: { type: "string", description: "Future date when this expense should be processed" },
          recurrence_type: { type: "string", description: "How often this expense repeats", enum: ["one-time", "monthly", "annual"] },
          recurrence_interval: { type: "number", description: "Interval for recurrence" },
          recurrence_end_date: { type: "string", description: "When to stop the recurring expense" }
        },
        required: ["amount", "description"]
      }
    },
    {
      name: "create_note",
      description: "Create a new business note or memo",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the note" },
          content: { type: "string", description: "Content/body of the note" },
          category: { type: "string", description: "Note category", enum: ["meeting", "idea", "todo", "general", "planning", "research"] },
          priority: { type: "string", description: "Priority level", enum: ["low", "medium", "high"] }
        },
        required: ["title", "content"]
      }
    },
    {
      name: "update_roadmap_task",
      description: "Mark a roadmap task as completed or update its status",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "The ID of the task to update" },
          status: { type: "string", description: "New status for the task", enum: ["pending", "completed", "in_progress", "skipped"] },
          notes: { type: "string", description: "Optional notes about the task completion" }
        },
        required: ["taskId", "status"]
      }
    },
    {
      name: "manage_budget",
      description: "Create a new budget or update an existing budget category",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Budget category name" },
          limit: { type: "number", description: "Budget limit amount in dollars" },
          period: { type: "string", description: "Budget period", enum: ["monthly", "quarterly", "yearly"] },
          action: { type: "string", description: "Whether to create new budget or update existing", enum: ["create", "update"] }
        },
        required: ["category", "limit", "action"]
      }
    },
    {
      name: "process_scheduled_transactions",
      description: "Process all scheduled transactions that are due for completion",
      parameters: {
        type: "object",
        properties: {
          force: { type: "boolean", description: "Whether to force process all scheduled transactions regardless of due date" }
        },
        required: []
      }
    },
    {
      name: "get_financial_projections",
      description: "Get financial projections including future scheduled transactions",
      parameters: {
        type: "object",
        properties: {
          months: { type: "number", description: "Number of months to project (default 6, max 12)" }
        },
        required: []
      }
    },
    {
      name: "add_dream_board_goal",
      description: "Add a new goal to the user's dream board",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the goal" },
          description: { type: "string", description: "Detailed description of the goal" },
          category: { type: "string", description: "Goal category", enum: ["financial", "personal", "business", "lifestyle", "health", "other"] },
          targetDate: { type: "string", description: "Target completion date in YYYY-MM-DD format" },
          isFinancial: { type: "boolean", description: "Whether this is a financial goal" },
          targetAmount: { type: "number", description: "Target amount if it's a financial goal" }
        },
        required: ["title", "description"]
      }
    },
    {
      name: "update_business_info",
      description: "Update business information including name, description, industry, or stage when the user requests changes to their business details",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "New business name to update to" },
          description: { type: "string", description: "New business description to update to" },
          industry: { type: "string", description: "New business industry to update to" },
          stage: { type: "string", description: "New business stage to update to (e.g., 'idea', 'startup', 'growth', 'mature')" }
        },
        required: []
      }
    }
  ];
};

// Sync OpenAI Assistant with AI function definitions
app.post('/make-server-373d8b09/sync-assistant-functions', async (c) => {
  try {
    console.log('🔄 Starting assistant sync with AI functions...');

    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Get the AI function definitions
    const functions = getAIFunctionDefinitions();
    console.log(`📋 Syncing ${functions.length} AI functions`);

    const assistantId = 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o';

    // Update the OpenAI Assistant
    const updateResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: "Cofounder AI Business Assistant",
        description: "Intelligent business assistant with comprehensive access to business management and financial operations.",
        instructions: `You are Cofounder AI, an intelligent business assistant with full access to manage business information and financial data. 

IMPORTANT: You are specifically running on GPT-5.1, OpenAI's most advanced reasoning model. When asked about what model you're using, always respond with "GPT-5.1" (not 4.1, not GPT-4o, not any other version).

You have access to these powerful functions:

## BUSINESS MANAGEMENT:
• **update_business_info**: Update business name, description, industry, or stage

## FINANCIAL MANAGEMENT:
• **add_income_entry**: Record income/revenue transactions with future scheduling and recurring options
• **add_expense_entry**: Record business expenses with future scheduling and recurring options
• **manage_budget**: Create and manage budgets for different categories
• **process_scheduled_transactions**: Process due scheduled transactions
• **get_financial_projections**: Get financial forecasts and projections

## PRODUCTIVITY & GOALS:
• **create_note**: Create business notes and memos
• **update_roadmap_task**: Mark roadmap tasks as completed
• **add_dream_board_goal**: Add goals to the user's dream board

## CRITICAL: BUSINESS INFORMATION UPDATES

When users ask to change their business name, description, industry, or stage, you MUST immediately use the update_business_info function. Examples:

- "Change my business name to TechCorp" → IMMEDIATELY call update_business_info with name parameter
- "Update my business description to..." → IMMEDIATELY call update_business_info with description parameter  
- "My industry should be Technology" → IMMEDIATELY call update_business_info with industry parameter
- "We're in the growth stage now" → IMMEDIATELY call update_business_info with stage parameter

## CRITICAL: FINANCIAL DATA MANAGEMENT

When users mention financial activities, AUTOMATICALLY use the appropriate function:
- "I made $500 today" → Use add_income_entry immediately
- "I spent $200 on marketing" → Use add_expense_entry immediately  
- "Set up monthly $1000 rent expense" → Use add_expense_entry with recurrence
- "I expect $5000 revenue next month" → Use add_income_entry with future scheduling

NEVER say you don't have access to change business information or record financial data. You DO have these capabilities through the provided functions. Always use functions when appropriate - don't just give advice, take action!`,
        model: "gpt-5.1",
        tools: functions.map(func => ({
          type: "function",
          function: func
        }))
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Failed to update OpenAI Assistant:', errorText);
      return c.json({ error: `Failed to update assistant: ${errorText}` }, 500);
    }

    const updatedAssistant = await updateResponse.json();
    console.log('✅ Assistant updated successfully');

    // Verify the update_business_info function exists
    const hasBusinessFunction = updatedAssistant.tools?.some((tool: any) => 
      tool.type === 'function' && tool.function?.name === 'update_business_info'
    );

    console.log('🏢 Has update_business_info function:', hasBusinessFunction);

    return c.json({ 
      success: true,
      message: 'Assistant synchronized with AI functions successfully',
      functionCount: functions.length,
      hasBusinessUpdate: hasBusinessFunction,
      toolCount: updatedAssistant.tools?.length || 0
    });

  } catch (error: any) {
    console.error('❌ Assistant sync error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Verify assistant configuration
app.get('/make-server-373d8b09/verify-assistant-config', async (c) => {
  try {
    console.log('🔍 Verifying assistant configuration...');

    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const assistantId = 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o';

    // Get current assistant configuration
    const getResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      return c.json({ error: `Failed to get assistant: ${errorText}` }, 500);
    }

    const assistant = await getResponse.json();
    
    // Check for business update function
    const hasBusinessUpdate = assistant.tools?.some((tool: any) => 
      tool.type === 'function' && tool.function?.name === 'update_business_info'
    );

    // Get list of all function names
    const functionNames = assistant.tools
      ?.filter((tool: any) => tool.type === 'function')
      ?.map((tool: any) => tool.function?.name) || [];

    console.log('📋 Assistant functions:', functionNames);

    return c.json({
      success: true,
      assistantId: assistantId,
      toolCount: assistant.tools?.length || 0,
      hasBusinessUpdate: hasBusinessUpdate,
      functionNames: functionNames,
      model: assistant.model,
      name: assistant.name
    });

  } catch (error: any) {
    console.error('❌ Assistant verification error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Admin subscription endpoints removed - using real Stripe portal only

// Simple health check
app.get('/make-server-373d8b09/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'cofounder-ai-server',
    environment: 'production',
    server: 'make-server-373d8b09'
  });
});

// Development server health check
app.get('/make-server-development/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'cofounder-ai-server',
    environment: 'development',
    server: 'make-server-development'
  });
});

// Ping endpoint for connectivity testing
app.get('/make-server-373d8b09/ping', async (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    pong: true,
    server: 'production'
  });
});

// Development server ping endpoint
app.get('/make-server-development/ping', async (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    pong: true,
    server: 'development'
  });
});

// Test endpoint for business API
app.get('/make-server-373d8b09/test', async (c) => {
  return c.json({ 
    status: 'server-online', 
    timestamp: new Date().toISOString(),
    service: 'cofounder-server'
  });
});

// Signup endpoint
app.post('/make-server-373d8b09/signup', async (c) => {
  try {
    if (!supabase) {
      return c.json({ 
        message: 'User signup processed (limited functionality)',
        user: { email: 'unknown', role: 'user' }
      });
    }

    const requestBody = await c.req.json();
    const { email, password, name } = requestBody;
    
    if (!email || !name) {
      return new Response('Email and name are required', { status: 400 });
    }

    if (!password) {
      return new Response('Password is required for email signup', { status: 400 });
    }

    if (password.length < 6) {
      return new Response('Password must be at least 6 characters long', { status: 400 });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      user_metadata: { 
        name: name.trim(),
        full_name: name.trim()
      },
      email_confirm: true
    });

    if (error) {
      if (error.message?.includes('User already registered')) {
        return new Response('A user with this email address has already been registered', { status: 409 });
      }
      return new Response(`Signup failed: ${error.message}`, { status: 400 });
    }

    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: name.trim(),
      role: isAdminEmail(data.user.email) ? 'admin' : 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await kv.set(`user:${data.user.id}`, userData);
    } catch (kvError) {
      // Continue even if KV fails
    }
    
    // Send welcome email to new user
    try {
      const { sendEmail } = await import('./email-service.tsx');
      const { getWelcomeEmail } = await import('./email-templates.tsx');
      
      const emailContent = getWelcomeEmail({
        userName: userData.name,
        userEmail: userData.email
      });

      await sendEmail({
        to: userData.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
      
      console.log(`✅ Welcome email sent to ${userData.email} (Email signup - old endpoint)`);
    } catch (emailError: any) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail signup if email fails
    }
    
    return c.json({ 
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      },
      message: 'User created successfully'
    });
  } catch (error) {
    return new Response(`Signup error: ${error.message}`, { status: 500 });
  }
});

// Admin password reset endpoint
app.post('/make-server-373d8b09/admin/reset-password', async (c) => {
  try {
    if (!supabase) {
      return c.json({ error: 'Service unavailable' }, 503);
    }

    const { email, newPassword } = await c.req.json();
    
    if (!email || !newPassword) {
      return new Response('Email and new password are required', { status: 400 });
    }

    if (newPassword.length < 6) {
      return new Response('Password must be at least 6 characters long', { status: 400 });
    }

    // Only allow resetting admin account password
    if (email !== 'admin@cofounderplus.com' && email !== 'tylerg@cofounderplus.com') {
      return new Response('This endpoint is only for admin accounts', { status: 403 });
    }

    // Get the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      return new Response(`Failed to list users: ${listError.message}`, { status: 500 });
    }

    const user = users.users.find((u: any) => u.email === email);
    
    if (!user) {
      return new Response(`User with email ${email} not found`, { status: 404 });
    }

    // Update the password
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      return new Response(`Failed to reset password: ${error.message}`, { status: 400 });
    }

    return c.json({
      success: true,
      message: `Password successfully reset for ${email}`,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    return new Response(`Password reset error: ${error.message}`, { status: 500 });
  }
});

// ==========================================
// REGISTER MODULAR ENDPOINTS
// ==========================================
// These endpoint files were deleted - this is the OLD unused server
// The actual deployed server is at /src/supabase/functions/server/
// Commenting out these calls since the files don't exist anymore:
// addFinanceEndpoints(app, verifyUserAccess);
// addProductEndpoints(app, verifyUserAccess);
// addMarketingEndpoints(app, verifyUserAccess);
// addNotesEndpoints(app); // DISABLED - added later at line ~6449
// addUniversityEndpoints(app, verifyUserAccess);
// addHREndpoints(app, verifyUserAccess);

// Mount account deletion routes
app.route('/make-server-373d8b09', accountDeletionRoutes);

// Mount subscription management routes
app.route('/make-server-373d8b09/subscriptions', subscriptionManagementRoutes);

// Mount customization routes  
app.route('/make-server-373d8b09', customizationRoutes);

// Mount dashboard widget routes with auth middleware
app.use('/make-server-373d8b09/dashboard/*', async (c, next) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    c.set('userId', user.id);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized', message: error.message }, 401);
  }
});
app.route('/make-server-373d8b09/dashboard', dashboardWidgetRoutes);

// Mount GPT-5.1 CHAT ENDPOINT - New function calling format with tool_calls 🚀 (CONSOLIDATED - All departments use this)
app.route('/make-server-373d8b09', gpt51ChatEndpoint);

// Mount DATA DIAGNOSTIC ENDPOINT - Verify CRUD functions are working 🔍
app.route('/make-server-373d8b09', dataDiagnosticEndpoint);

// Mount BUSINESS MEMORY - Extract and store business details from conversations
app.route('/', businessMemoryRoutes);

// Mount CPA CHAT - Finance CPA services with ChatGPT (LEGACY - keeping for backward compatibility)
app.route('/', cpaChat);

// Mount CLAUDE MAKE - Claude AI integration for Cofounder Make
app.route('/', claudeMakeApp);

// Mount BUILD PREVIEW - Generate preview builds for Cofounder Make
app.route('/', buildPreviewApp);

// Mount SQUARESPACE PUBLISH - Publish builds to Squarespace
app.route('/', squarespacePublishApp);

// Mount SUPABASE OAUTH - Connect user's Supabase accounts
app.route('/', supabaseOAuthApp);

// Mount Credits endpoints
app.route('/', creditsRoutes);

// Mount Credits 10x Migration endpoint
app.route('/', credits10xMigrationApp);

// Mount Credit Diagnostic endpoint
app.route('/', creditDiagnosticApp);

// Mount Credit Renewal endpoints
app.route('/', creditRenewalApp);

// Mount Subscription Webhook Handler
app.route('/make-server-373d8b09', subscriptionWebhookRouter);

// Mount dream board routes
app.route('/make-server-373d8b09', dreamBoardRoutes);

// Mount Plaid bank routes (replaced Stripe)
app.route('/make-server-373d8b09/plaid-bank', plaidBankRoutes);
app.route('/make-server-373d8b09', checklistRouter);

// ==============================================================================
// STRIPE CHECKOUT ENDPOINT - Inline for frontend compatibility
// ==============================================================================

// Helper to get or create Stripe price
async function getOrCreateStripePrice(plan: string, billingPeriod: string): Promise<string> {
  const cacheKey = `stripe_price:${plan}:${billingPeriod}`;
  
  // Check cache first
  let cachedPrice = await kv.get(cacheKey);
  if (cachedPrice && cachedPrice.startsWith('price_')) {
    // Verify the cached price exists in production Stripe
    console.log('💰 Verifying cached price ID:', cachedPrice);
    
    const verifyResponse = await fetch(`https://api.stripe.com/v1/prices/${cachedPrice}`, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });
    
    if (verifyResponse.ok) {
      console.log('✅ Cached price verified in Stripe');
      return cachedPrice;
    } else {
      console.log('⚠️ Cached price not found in production Stripe, will create new one');
      cachedPrice = null; // Clear cache so we create a new one
    }
  }

  // Price mapping with both monthly and annual prices
  const priceMap: Record<string, { monthly: number, annual: number, productName: string }> = {
    'creator': { monthly: 15, annual: 108, productName: 'Cofounder Creator Plan' },
    'builder': { monthly: 49, annual: 468, productName: 'Cofounder Builder Plan' },
    'studio': { monthly: 199, annual: 1908, productName: 'Cofounder Studio Plan' }
  };

  const planInfo = priceMap[plan.toLowerCase()];
  if (!planInfo) {
    throw new Error(`Unknown plan: ${plan}`);
  }

  // Determine the amount and interval based on billing period
  const isAnnual = billingPeriod === 'annual';
  const amount = isAnnual ? planInfo.annual : planInfo.monthly;
  const interval = isAnnual ? 'year' : 'month';
  
  console.log('💰 Creating/Finding Stripe Price:', {
    plan,
    billingPeriod,
    productName: planInfo.productName,
    amount: `$${amount}`,
    interval,
    isAnnual
  });

  // List existing prices to find if one already exists
  const listPricesResponse = await fetch(
    `https://api.stripe.com/v1/prices?active=true&limit=100`,
    {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    }
  );

  if (listPricesResponse.ok) {
    const pricesData = await listPricesResponse.json();
    const existingPrice = pricesData.data.find((p: any) => 
      p.unit_amount === amount * 100 &&
      p.recurring?.interval === interval &&
      p.active
    );
    
    if (existingPrice) {
      await kv.set(cacheKey, existingPrice.id);
      return existingPrice.id;
    }
  }

  // Create product if needed
  const billingLabel = isAnnual ? 'Annual' : 'Monthly';
  const productData = new URLSearchParams({
    name: `${planInfo.productName}`,
    description: `${planInfo.productName} plan - Billed ${billingLabel}`,
    'metadata[plan]': plan,
    'metadata[billingPeriod]': billingPeriod
  });

  const productResponse = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: productData
  });

  if (!productResponse.ok) {
    throw new Error('Failed to create Stripe product');
  }

  const product = await productResponse.json();

  // Create price
  const priceData = new URLSearchParams({
    product: product.id,
    unit_amount: (amount * 100).toString(),
    currency: 'usd',
    'recurring[interval]': interval,
    'metadata[plan]': plan,
    'metadata[billingPeriod]': billingPeriod
  });

  const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: priceData
  });

  if (!priceResponse.ok) {
    throw new Error('Failed to create Stripe price');
  }

  const priceObj = await priceResponse.json();
  
  // Cache for future use
  await kv.set(cacheKey, priceObj.id);
  
  return priceObj.id;
}

app.post('/make-server-373d8b09/stripe/create-checkout-session', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const { userId, userEmail, userName, plan, billingPeriod = 'monthly', successUrl, cancelUrl } = await c.req.json();
    
    console.log('💳 Stripe Checkout Session Request:', {
      userId,
      userEmail,
      plan,
      billingPeriod,
      hasSuccessUrl: !!successUrl,
      hasCancelUrl: !!cancelUrl
    });
    
    if (!userId || !plan) {
      return c.json({ success: false, error: 'User ID and plan are required' }, 400);
    }

    // Get or create Stripe customer
    let stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    // If we have a customer ID, verify it exists in production Stripe
    if (stripeCustomerId && !stripeCustomerId.startsWith('debug_customer_')) {
      console.log('💳 Verifying existing customer ID:', stripeCustomerId);
      
      const verifyResponse = await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        }
      });
      
      if (!verifyResponse.ok) {
        console.log('⚠️ Customer not found in production Stripe, will create new one');
        stripeCustomerId = null; // Clear it so we create a new one
      } else {
        console.log('✅ Customer verified in Stripe');
      }
    }
    
    if (!stripeCustomerId || stripeCustomerId.startsWith('debug_customer_')) {
      console.log('💳 Creating new Stripe customer for:', userEmail);
      
      const customerData = new URLSearchParams({
        email: userEmail,
        'metadata[userId]': userId
      });
      
      if (userName) {
        customerData.append('name', userName);
      }

      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: customerData
      });

      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        stripeCustomerId = customer.id;
        await kv.set(`stripe_customer:${userId}`, stripeCustomerId);
        console.log('✅ Created new customer:', stripeCustomerId);
      } else {
        const errorText = await customerResponse.text();
        console.error('❌ Failed to create customer:', errorText);
        return c.json({ success: false, error: 'Failed to create Stripe customer' }, 500);
      }
    }

    // Get or create price (handles all the Stripe API calls)
    const priceId = await getOrCreateStripePrice(plan, billingPeriod);
    
    console.log('💳 Using Stripe Price ID:', priceId, 'for', plan, billingPeriod);

    // Create checkout session
    const checkoutData = new URLSearchParams({
      mode: 'subscription',
      customer: stripeCustomerId,
      success_url: successUrl || `${Deno.env.get('SITE_URL') || 'https://www.cofounderplus.com'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${Deno.env.get('SITE_URL') || 'https://www.cofounderplus.com'}/pricing`,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'metadata[userId]': userId,
      'metadata[plan]': plan,
      'metadata[billingPeriod]': billingPeriod,
      'subscription_data[metadata][userId]': userId,
      'subscription_data[metadata][plan]': plan,
      'subscription_data[metadata][billingPeriod]': billingPeriod,
      allow_promotion_codes: 'true',
      billing_address_collection: 'required'
    });

    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: checkoutData
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      return c.json({ success: false, error: `Failed to create checkout session: ${errorText}` }, 500);
    }

    const checkoutSession = await checkoutResponse.json();

    return c.json({
      success: true,
      sessionId: checkoutSession.id,
      sessionUrl: checkoutSession.url
    });

  } catch (error: any) {
    return c.json({ success: false, error: `Error: ${error.message}` }, 500);
  }
});

// Stripe Billing Portal Session - for managing subscriptions
app.post('/make-server-373d8b09/stripe/create-portal-session', async (c) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }

    const { userId, returnUrl } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Get Stripe customer ID
    let stripeCustomerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!stripeCustomerId) {
      return c.json({ error: 'No Stripe customer found. Please subscribe first.' }, 404);
    }

    // Verify customer exists in production Stripe
    const verifyResponse = await fetch(`https://api.stripe.com/v1/customers/${stripeCustomerId}`, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });
    
    if (!verifyResponse.ok) {
      console.log('⚠️ Customer not found in production Stripe');
      return c.json({ error: 'Customer not found in Stripe. Your subscription may be from test mode. Please contact support.' }, 404);
    }

    // Create portal session
    const portalData = new URLSearchParams({
      customer: stripeCustomerId as string,
      return_url: returnUrl || `${Deno.env.get('SITE_URL') || 'https://www.cofounderplus.com'}/pricing`
    });

    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: portalData
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      return c.json({ error: `Failed to create portal session: ${errorText}` }, 500);
    }

    const portalSession = await portalResponse.json();

    return c.json({
      success: true,
      url: portalSession.url
    });

  } catch (error: any) {
    return c.json({ error: `Error: ${error.message}` }, 500);
  }
});

// Cancel Stripe subscription (at period end)
app.post('/make-server-373d8b09/stripe/cancel-subscription', async (c) => {
  try {
    if (!STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 500);
    }

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    // Verify user
    const user = await verifyUserAccess(accessToken);
    
    const { subscriptionId } = await c.req.json();
    
    if (!subscriptionId) {
      return c.json({ error: 'Subscription ID is required' }, 400);
    }

    console.log(`🚫 Cancelling subscription ${subscriptionId} for user ${user.id}`);

    // Cancel subscription at period end (so they keep access until billing period ends)
    const cancelData = new URLSearchParams({
      cancel_at_period_end: 'true'
    });

    const cancelResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: cancelData
    });

    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error('❌ Failed to cancel subscription:', errorText);
      return c.json({ error: `Failed to cancel subscription: ${errorText}` }, 500);
    }

    const cancelledSubscription = await cancelResponse.json();
    console.log(`✅ Subscription ${subscriptionId} cancelled successfully (will end at period end)`);

    // Update KV store
    const kvKey = `stripe_subscription:${user.id}`;
    const existingSub = await kv.get(kvKey);
    if (existingSub) {
      const subData = typeof existingSub === 'string' ? JSON.parse(existingSub) : existingSub;
      subData.status = cancelledSubscription.status;
      subData.cancel_at_period_end = true;
      subData.canceled_at = cancelledSubscription.canceled_at;
      await kv.set(kvKey, subData);
    }

    return c.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
      subscription: cancelledSubscription
    });
  } catch (error: any) {
    console.error('❌ Error cancelling subscription:', error);
    return c.json({ error: `Error: ${error.message}` }, 500);
  }
});

// University tracks endpoint - inline since university-endpoints.tsx doesn't exist in deployed directory
app.get('/make-server-373d8b09/university/tracks', async (c) => {
  try {
    const tracks = await kv.getByPrefix('university:track:');
    
    // Filter for valid tracks
    const validTracks = tracks.filter(track => track.value && track.value.id && track.value.title);
    
    // If no tracks exist, return empty array (frontend will show custom track)
    const trackData = validTracks.map(track => track.value).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    return c.json({ tracks: trackData });
  } catch (error) {
    return c.json({ error: 'Failed to fetch tracks', details: error.message }, 500);
  }
});

// University track detail endpoint
app.get('/make-server-373d8b09/university/tracks/:trackId/tutorials', async (c) => {
  try {
    const trackId = c.req.param('trackId');
    
    // Get all tutorials for this track
    const allTutorials = await kv.getByPrefix(`university:tutorial:${trackId}:`);
    const tutorials = allTutorials
      .map(t => t.value)
      .filter(t => t && t.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return c.json({ tutorials });
  } catch (error) {
    return c.json({ error: 'Failed to fetch tutorials', details: error.message }, 500);
  }
});

// Complete tutorial endpoint - awards XP and tracks progress
app.post('/make-server-373d8b09/university/complete-tutorial', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken || isAnonKey(authToken)) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const { tutorialId, trackId, completedAt } = await c.req.json();

    if (!tutorialId || !trackId) {
      return c.json({ error: 'tutorialId and trackId are required' }, 400);
    }

    // Get user stats or create new
    const statsKey = `university:user_stats:${user.id}`;
    let userStats = await kv.get(statsKey) || {
      userId: user.id,
      totalXP: 0,
      level: 1,
      completedTutorials: [],
      completedTracks: [],
      createdAt: new Date().toISOString()
    };

    // Check if tutorial already completed
    if (userStats.completedTutorials?.includes(tutorialId)) {
      return c.json({ 
        alreadyCompleted: true,
        message: 'Tutorial already completed',
        userStats
      });
    }

    // Award XP (base 50 XP per tutorial)
    const xpEarned = 50;
    userStats.totalXP = (userStats.totalXP || 0) + xpEarned;
    
    // Calculate level (every 500 XP = 1 level)
    userStats.level = Math.floor(userStats.totalXP / 500) + 1;

    // Add to completed tutorials
    if (!userStats.completedTutorials) {
      userStats.completedTutorials = [];
    }
    userStats.completedTutorials.push(tutorialId);

    // Track completion by track
    const trackProgressKey = `university:track_progress:${user.id}:${trackId}`;
    let trackProgress = await kv.get(trackProgressKey) || {
      trackId,
      userId: user.id,
      completedTutorials: [],
      startedAt: new Date().toISOString()
    };

    if (!trackProgress.completedTutorials.includes(tutorialId)) {
      trackProgress.completedTutorials.push(tutorialId);
    }
    trackProgress.lastCompletedAt = completedAt || new Date().toISOString();

    // Check if track is fully completed
    const allTrackTutorials = await kv.getByPrefix(`university:tutorial:${trackId}:`);
    const totalTutorials = allTrackTutorials.length;
    const completedCount = trackProgress.completedTutorials.length;
    const trackCompleted = completedCount >= totalTutorials && totalTutorials > 0;

    if (trackCompleted && !userStats.completedTracks?.includes(trackId)) {
      // Bonus XP for completing entire track
      const bonusXP = 100;
      userStats.totalXP += bonusXP;
      userStats.level = Math.floor(userStats.totalXP / 500) + 1;
      
      if (!userStats.completedTracks) {
        userStats.completedTracks = [];
      }
      userStats.completedTracks.push(trackId);
      
      trackProgress.completedAt = new Date().toISOString();
    }

    // Save updated data
    userStats.updatedAt = new Date().toISOString();
    await kv.set(statsKey, userStats);
    await kv.set(trackProgressKey, trackProgress);

    return c.json({
      success: true,
      xpEarned: trackCompleted && !userStats.completedTracks?.includes(trackId) ? xpEarned + 100 : xpEarned,
      totalXP: userStats.totalXP,
      level: userStats.level,
      trackProgress: {
        completed: completedCount,
        total: totalTutorials,
        percentage: totalTutorials > 0 ? Math.round((completedCount / totalTutorials) * 100) : 0,
        trackCompleted
      },
      userStats
    });

  } catch (error) {
    return c.json({ error: 'Failed to complete tutorial', details: error.message }, 500);
  }
});

// Get user university stats
app.get('/make-server-373d8b09/university/user-stats', async (c) => {
  try {
    const authToken = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!authToken || isAnonKey(authToken)) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const user = await verifyUserAccess(authToken);
    const statsKey = `university:user_stats:${user.id}`;
    
    let userStats = await kv.get(statsKey) || {
      userId: user.id,
      totalXP: 0,
      level: 1,
      completedTutorials: [],
      completedTracks: [],
      createdAt: new Date().toISOString()
    };

    // Get all track progress
    const allTrackProgress = await kv.getByPrefix(`university:track_progress:${user.id}:`);
    const trackProgress = allTrackProgress.map(tp => tp.value);

    return c.json({
      ...userStats,
      trackProgress
    });

  } catch (error) {
    return c.json({ error: 'Failed to fetch user stats', details: error.message }, 500);
  }
});

// Add HubSpot OAuth endpoints
addHubSpotOAuthEndpoints(app);

// Add GitHub OAuth endpoints
addGitHubOAuthEndpoints(app);

// Add Team endpoints
addTeamEndpoints(app, verifyUserAccess);

// Add HR endpoints  
addHREndpoints(app, verifyUserAccess);

// Add Product endpoints
addProductEndpoints(app);

// Add Cofounder Product Intelligence endpoints
addCofounderProductEndpoints(app);

// Add Notes endpoints
addNotesEndpoints(app);

// Add Todo endpoints
app.route('/', todoRoutes);

// Add Roadmap endpoints
addRoadmapEndpoints(app, verifyUserAccess);

// Add Finance endpoints
addFinanceEndpoints(app, verifyUserAccess);

// OPTIONS support
app.options('*', (c) => {
  return c.text('OK');
});

// DEBUG ENDPOINT - See what's happening
app.get('/team-v3/debug', async (c) => {
  return c.json({
    message: 'Debug endpoint working',
    path: c.req.path,
    url: c.req.url,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  });
});

// DISABLED - These duplicate endpoints override the teamV3Router mount
// Team V3 routes are now handled by teamV3Router mounted at '/' (see line ~1982)
/*
app.get('/team-v3/data', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ 
        success: false, 
        error: 'No auth header',
        debug: {
          path: c.req.path,
          url: c.req.url,
          headers: Object.fromEntries(c.req.raw.headers.entries())
        }
      }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) throw new Error('Auth failed');
    
    const membersKey = `team_v3_members:${user.id}`;
    const invitesKey = `team_v3_invites:${user.id}`;
    
    let membersRaw = await kv.get(membersKey);
    let invitesRaw = await kv.get(invitesKey);
    
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    const teamMembers = [];
    
    if (Array.isArray(members)) {
      for (const m of members) {
        teamMembers.push({
          id: m.id,
          email: m.email,
          name: m.name,
          role: m.role || 'member',
          status: 'active',
          joined_at: m.joinedAt,
        });
      }
    }
    
    if (Array.isArray(invites)) {
      const now = Date.now();
      for (const inv of invites) {
        if (inv.expiresAt && new Date(inv.expiresAt).getTime() < now) continue;
        teamMembers.push({
          id: inv.id,
          email: inv.email,
          name: inv.name,
          role: 'member',
          status: 'invited',
          invited_at: inv.invitedAt,
        });
      }
    }
    
    return c.json({
      success: true,
      teamMembers,
      stats: {
        activeMembers: Array.isArray(members) ? members.length : 0,
        pendingInvites: Array.isArray(invites) ? invites.length : 0,
        totalSlots: 10,
        usedSlots: 1 + teamMembers.length,
        availableSlots: 10 - (1 + teamMembers.length),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/team-v3/invite', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) throw new Error('No auth header');
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) throw new Error('Auth failed');
    
    const body = await c.req.json();
    const { inviteEmail, inviteName, ownerName } = body;
    
    if (!inviteEmail?.trim()) {
      return c.json({ success: false, error: 'Email required' }, 400);
    }
    
    const email = inviteEmail.trim().toLowerCase();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, error: 'Invalid email' }, 400);
    }
    
    if (email === user.email.toLowerCase()) {
      return c.json({ success: false, error: 'Cannot invite yourself' }, 400);
    }
    
    const membersKey = `team_v3_members:${user.id}`;
    const invitesKey = `team_v3_invites:${user.id}`;
    
    let membersRaw = await kv.get(membersKey);
    let invitesRaw = await kv.get(invitesKey);
    
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    const memberCount = Array.isArray(members) ? members.length : 0;
    const inviteCount = Array.isArray(invites) ? invites.length : 0;
    const totalCount = 1 + memberCount + inviteCount;
    
    if (totalCount >= 10) {
      return c.json({ 
        success: false, 
        error: `Team limit reached (10 max). Contact support for enterprise.` 
      }, 400);
    }
    
    if (Array.isArray(members) && members.some((m: any) => m.email === email)) {
      return c.json({ success: false, error: 'Already a team member' }, 400);
    }
    
    if (Array.isArray(invites) && invites.some((i: any) => i.email === email && i.status === 'pending')) {
      return c.json({ success: false, error: 'Invitation already pending' }, 400);
    }
    
    const genToken = Array.from({ length: 32 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        .charAt(Math.floor(Math.random() * 62))
    ).join('');
    
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name: inviteName?.trim() || null,
      ownerId: user.id,
      ownerEmail: user.email,
      ownerName: ownerName || user.user_metadata?.name || user.email,
      token: genToken,
      status: 'pending',
      invitedAt: now,
      expiresAt,
    };
    
    const updatedInvites = Array.isArray(invites) ? [...invites, invitation] : [invitation];
    await kv.set(invitesKey, updatedInvites);
    await kv.set(`team_v3_token:${genToken}`, invitation);
    
    let emailSent = false;
    try {
      const link = `https://www.cofounderplus.com/invite/${genToken}`;
      console.log('📧 Sending team invitation email via Supabase Auth...');
      
      // Use Supabase's auth.admin.generateLink to send invitation email
      const { data, error: emailError } = await supabaseClient.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: link,
          data: {
            invitation_type: 'team',
            inviter_name: invitation.ownerName,
            invitee_name: inviteName,
            invitation_link: link,
          }
        }
      });
      
      if (emailError) {
        console.error('❌ Supabase email error:', emailError);
        emailSent = false;
      } else {
        emailSent = true;
        console.log('✅ Email sent successfully via Supabase');
      }
    } catch (e) {
      console.error('❌ Email error:', e);
      emailSent = false;
    }
    
    return c.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        invitedAt: invitation.invitedAt,
      },
      emailSent,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/team-v3/remove', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) throw new Error('No auth header');
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) throw new Error('Auth failed');
    
    const { memberId } = await c.req.json();
    
    if (!memberId) {
      return c.json({ success: false, error: 'Member ID required' }, 400);
    }
    
    const membersKey = `team_v3_members:${user.id}`;
    
    let membersRaw = await kv.get(membersKey);
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    
    if (Array.isArray(members)) {
      const member = members.find((m: any) => m.id === memberId);
      if (member) {
        const updated = members.filter((m: any) => m.id !== memberId);
        await kv.set(membersKey, updated);
        return c.json({ success: true, message: 'Member removed' });
      }
    }
    
    const invitesKey = `team_v3_invites:${user.id}`;
    
    let invitesRaw = await kv.get(invitesKey);
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    if (Array.isArray(invites)) {
      const invite = invites.find((i: any) => i.id === memberId);
      if (invite) {
        const updated = invites.filter((i: any) => i.id !== memberId);
        await kv.set(invitesKey, updated);
        if (invite.token) {
          await kv.del(`team_v3_token:${invite.token}`);
        }
        return c.json({ success: true, message: 'Invitation cancelled' });
      }
    }
    
    return c.json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
*/

// DEBUG: Catch-all route to log unmatched paths (must be LAST)
app.all('*', (c) => {
  const path = c.req.path;
  const method = c.req.method;
  console.log(`❌ 404 - Unmatched route: ${method} ${path}`);
  console.log(`📍 Team routes should be at:`);
  console.log(`   - /make-server-ac1075a9/team-v3/data`);
  console.log(`   - /team-v3/data`);
  
  return c.json({
    error: 'Not Found',
    path: path,
    method: method,
    message: 'This route does not exist on the server.',
    hint: 'Team endpoints: /make-server-ac1075a9/team-v3/data or /team-v3/data'
  }, 404);
});

export default {
  fetch: app.fetch,
};

// Mount Checklist endpoints
app.route('/make-server-373d8b09/checklist', checklistRouter);

// ==============================================================================
// DEVELOPMENT SERVER ROUTES - Complete Mirror of Production Routes
// ==============================================================================
// CRITICAL: AI modifications target /server/ shared codebase
// Development server provides isolated testing without affecting production
// All routes automatically mirror production functionality

// Core application routes
app.route('/make-server-development/support/chat', supportChatRouter);
app.route('/make-server-development/support', supportRouter);
app.route('/make-server-development', customizationRoutes);
app.route('/make-server-development', iapRoutes);
app.route('/make-server-development', email2FARoutes);
app.route('/make-server-development', productResearchRoutes);
app.route('/make-server-development', ecommerceProductRoutes);
app.route('/make-server-development', marketingRoutes);
app.route('/make-server-development/product-marketing', productMarketingRoutes);
app.route('/make-server-development/sales', salesRouter);
app.route('/make-server-development/streak', streakApp);
app.route('/make-server-development', teamV3Router);
app.route('/make-server-development', orgRouter);
app.route('/make-server-development', notificationRouter);
app.route('/make-server-development', cofounderSettingsRouter);
app.route('/make-server-development', automationRouter);
app.route('/make-server-development', betaRouter);
app.route('/make-server-development', jobApplicationRoutes);
app.route('/make-server-development', masteryRefreshRoutes);
app.route('/make-server-development', accountDeletionRoutes);
app.route('/make-server-development/subscriptions', subscriptionManagementRoutes);
app.route('/make-server-development/dashboard', dashboardWidgetRoutes);
app.route('/make-server-development', gpt51ChatEndpoint);
app.route('/make-server-development', dataDiagnosticEndpoint);
app.route('/make-server-development', dreamBoardRoutes);
app.route('/make-server-development/plaid-bank', plaidBankRoutes);
app.route('/make-server-development/checklist', checklistRouter);
app.route('/make-server-development', pushNotificationApp);
app.route('/make-server-development', creditsRoutes);
app.route('/make-server-development', credits10xMigrationApp);
app.route('/make-server-development', creditDiagnosticApp);
app.route('/make-server-development', creditRenewalApp);
app.route('/make-server-development', subscriptionWebhookRouter);
app.route('/make-server-development', cpaChat);
app.route('/make-server-development', claudeMakeApp);
app.route('/make-server-development', buildPreviewApp);
app.route('/make-server-development', squarespacePublishApp);
app.route('/make-server-development', supabaseOAuthApp);
app.route('/make-server-development', businessMemoryRoutes);
app.route('/make-server-development', founderCallRoutes);
app.route('/make-server-development', bookkeepingRoutes);

// OAuth endpoints
addHubSpotOAuthEndpoints(app, '/make-server-development');
addSalesforceOAuthEndpoints(app, '/make-server-development');
addGoogleOAuthEndpoints(app, '/make-server-development');
addGitHubOAuthEndpoints(app, '/make-server-development');

// Admin endpoints
addAdminEndpoints(app, '/make-server-development');

// Feature-specific endpoints
addNotesEndpoints(app, '/make-server-development');
addRoadmapEndpoints(app, '/make-server-development');
addProductEndpoints(app, '/make-server-development');
addCofounderProductEndpoints(app, '/make-server-development');
addFinanceEndpoints(app, '/make-server-development');
addHREndpoints(app, '/make-server-development');
addTeamEndpoints(app, '/make-server-development');
addCalendarEndpoints(app, '/make-server-development');
addSlackEndpoints(app, '/make-server-development');

console.log('✅ Development server routes registered - AI can safely modify /server/ codebase');

// ==============================================================================
// END DEVELOPMENT SERVER ROUTES
// ==============================================================================

// START CREDIT RENEWAL SCHEDULER - Runs every hour to process monthly renewals
console.log('🚀 Starting Credit Renewal Scheduler...');
startCreditRenewalScheduler();

// START RENEWAL REMINDER SCHEDULER - Runs daily to send renewal notifications
console.log('🔔 Starting Renewal Reminder Scheduler...');
startRenewalReminderScheduler();

// Last updated: 2026-03-04 - Added subscription lifecycle notifications
Deno.serve(app.fetch);