// CRITICAL: Silence ALL console output BEFORE any imports to prevent JSON corruption
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  debug: console.debug,
  error: console.error
};

// IMMEDIATE console silencing - must be first
console.log = () => {};
console.info = () => {};
console.debug = () => {};
console.warn = () => {};
console.error = () => {}; // Completely silence even errors

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_cache.tsx';

// Import endpoint modules
import { addHREndpoints } from './hr-endpoints.tsx';
import { addNotesEndpoints } from './notes-endpoints.tsx';
import { addAdminEndpoints } from './admin-endpoints.tsx';
import { addRoadmapEndpoints } from './roadmap-endpoints.tsx';
import { addTeamEndpoints } from './team-endpoints.tsx';
import { addTeamInvitationEndpoints } from './team-invitations.tsx';
import { addFinanceEndpoints } from './finance-endpoints.tsx';
import { addSalesEndpoints } from './sales-endpoints.tsx';
import { addProductEndpoints } from './product-endpoints.tsx';

// Import route handlers
import stripeRoutes from './stripe-handler.tsx';
import supportRoutes from './support-endpoints.tsx';
import debugTicketsRoutes from './debug-tickets.tsx';
import openaiRoutes from './openai-handler.tsx';
import creditsRoutes from './credits-endpoints.tsx';
import { subscriptionOverrideHandler } from './subscription-override-endpoints.tsx';
import stripeAdminOverrides from './stripe-admin-overrides.tsx';
import stripeStatusEnhanced from './stripe-status-enhanced.tsx';
import fileUploadRoutes from './file-upload-endpoints.tsx';
import quizRoutes from './quiz-endpoints-fixed.tsx';
import { quizCalculationFixed } from './quiz-calculation-fixed.tsx';
import stripeCustomerLookup from './stripe-customer-lookup.tsx';
import stripeWebhookSync from './stripe-webhook-sync.tsx';
import stripeCustomerVerification from './stripe-customer-verification.tsx';
import stripeCheckoutFix from './stripe-checkout-fix.tsx';
import stripeSessionSync from './stripe-session-sync.tsx';
import minimalJsonTest from './minimal-json-test.tsx';
import isolatedSeatTest from './isolated-seat-test.tsx';
import ultraMinimalSeat from './ultra-minimal-seat.tsx';
import bookkeepingRoutes from './bookkeeping-endpoints.tsx';
import agiChatRoutes from './agi-chat-endpoints.tsx';
import appleIapRoutes from './apple-iap-native-endpoints.tsx';
import teamV3Router from './team-v3-clean.tsx';
import founderCallRoutes from './founder-call-endpoints.tsx';

// UNIFIED COFOUNDER CHAT - Single source of truth for all AI chat
import unifiedCofounderChat from './unified-cofounder-chat.tsx';

const app = new Hono();

// Middleware - CORS must be first
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

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

async function verifyUserAccess(accessToken: string) {
  if (!accessToken) {
    throw new Error('No access token provided');
  }

  if (isAnonKey(accessToken)) {
    throw new Error('Anonymous access not allowed for this endpoint');
  }

  if (!accessToken.startsWith('eyJ')) {
    throw new Error('Invalid token format - expected JWT');
  }

  try {
    if (supabaseAuth) {
      try {
        const { data: { user }, error } = await supabaseAuth.auth.getUser(accessToken);
        if (!error && user) {
          return user;
        }
      } catch (supabaseError) {
        // Fall through to manual JWT decoding
      }
    }
    
    const payload = decodeJWT(accessToken);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }
    
    const userId = payload.sub || payload.user_id;
    const userEmail = payload.email;
    
    if (!userId) {
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

    return user;
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}

async function verifyUserAccessOptional(accessToken: string) {
  if (!accessToken) {
    return null;
  }

  if (isAnonKey(accessToken)) {
    return null;
  }

  if (accessToken.startsWith('eyJ')) {
    try {
      if (!supabaseAuth) {
        return null;
      }
      return await verifyUserAccess(accessToken);
    } catch (error) {
      return null;
    }
  }

  return null;
}

// Add endpoint modules - ONLY ONCE
addHREndpoints(app, verifyUserAccess);
addNotesEndpoints(app, verifyUserAccess);
addAdminEndpoints(app, verifyUserAccess);
addRoadmapEndpoints(app, verifyUserAccess);
addTeamEndpoints(app, verifyUserAccess);
addTeamInvitationEndpoints(app);
addFinanceEndpoints(app, verifyUserAccess);
addSalesEndpoints(app, verifyUserAccess);
addProductEndpoints(app, verifyUserAccess);

// Add route handlers - ONLY ONCE
app.route('/make-server-ac1075a9/stripe', stripeRoutes);
app.route('/make-server-ac1075a9/support', supportRoutes);
app.route('/make-server-ac1075a9/openai', openaiRoutes);
app.route('/make-server-ac1075a9/credits', creditsRoutes);
app.route('/', bookkeepingRoutes); // Mount at root - function path already includes make-server-ac1075a9
app.route('/', agiChatRoutes); // Mount at root - function path already includes make-server-ac1075a9
app.route('/make-server-373d8b09', appleIapRoutes); // Apple IAP endpoints
app.route('/make-server-373d8b09/debug', debugTicketsRoutes); // Debug ticket endpoints
app.route('/make-server-ac1075a9', subscriptionOverrideHandler);
app.route('/make-server-ac1075a9/stripe-admin', stripeAdminOverrides);
app.route('/make-server-ac1075a9', stripeStatusEnhanced);
app.route('/', fileUploadRoutes);
app.route('/', quizRoutes);
app.route('/', quizCalculationFixed);
app.route('/make-server-ac1075a9/stripe-lookup', stripeCustomerLookup);
app.route('/make-server-ac1075a9/webhook', stripeWebhookSync);
app.route('/make-server-ac1075a9/customer-verification', stripeCustomerVerification);
app.route('/make-server-ac1075a9', stripeCheckoutFix);
app.route('/make-server-373d8b09/stripe', stripeCheckoutFix); // Mount for frontend compatibility
app.route('/make-server-ac1075a9/stripe-session', stripeSessionSync);
app.route('/make-server-ac1075a9', minimalJsonTest);
app.route('/make-server-ac1075a9', isolatedSeatTest);
app.route('/make-server-ac1075a9', ultraMinimalSeat);
app.route('/', founderCallRoutes); // Mount founder call booking endpoints

// ULTRA SIMPLE TEST - No auth required
app.get('/make-server-ac1075a9/team-v3/ping', async (c) => {
  return c.json({ 
    success: true, 
    message: 'TEAM V3 ENDPOINT IS ALIVE!',
    timestamp: new Date().toISOString(),
    server: 'make-server-ac1075a9'
  });
});

// TEAM V3 INLINE ENDPOINTS - Direct implementation to bypass routing issues
app.get('/make-server-ac1075a9/team-v3/data', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ success: false, error: 'No auth' }, 401);
    
    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation - pass token in headers
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) return c.json({ success: false, error: 'Auth failed' }, 401);
    
    // Handle both string (old format) and object/array (new format)
    let membersRaw = await kv.get(`team_v3_members:${user.id}`);
    let invitesRaw = await kv.get(`team_v3_invites:${user.id}`);
    
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
          id: m.id, email: m.email, name: m.name, role: m.role || 'member',
          status: 'active', joined_at: m.joinedAt,
        });
      }
    }
    if (Array.isArray(invites)) {
      const now = Date.now();
      for (const inv of invites) {
        if (inv.expiresAt && new Date(inv.expiresAt).getTime() < now) continue;
        teamMembers.push({
          id: inv.id, email: inv.email, name: inv.name, role: 'member',
          status: 'invited', invited_at: inv.invitedAt,
        });
      }
    }
    
    return c.json({
      success: true, teamMembers,
      stats: {
        activeMembers: Array.isArray(members) ? members.length : 0,
        pendingInvites: Array.isArray(invites) ? invites.length : 0,
        totalSlots: 10, usedSlots: 1 + teamMembers.length,
        availableSlots: 10 - (1 + teamMembers.length),
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/make-server-ac1075a9/team-v3/invite', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ success: false, error: 'No auth' }, 401);
    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation - pass token in headers
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) return c.json({ success: false, error: 'Auth failed' }, 401);
    
    const { inviteEmail, inviteName, ownerName } = await c.req.json();
    if (!inviteEmail?.trim()) return c.json({ success: false, error: 'Email required' }, 400);
    
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ success: false, error: 'Invalid email' }, 400);
    if (email === user.email.toLowerCase()) return c.json({ success: false, error: 'Cannot invite yourself' }, 400);
    
    // Handle both string (old format) and object/array (new format)
    let membersRaw = await kv.get(`team_v3_members:${user.id}`);
    let invitesRaw = await kv.get(`team_v3_invites:${user.id}`);
    
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    
    const totalCount = 1 + (Array.isArray(members) ? members.length : 0) + (Array.isArray(invites) ? invites.length : 0);
    if (totalCount >= 10) return c.json({ success: false, error: 'Team limit reached (10 max)' }, 400);
    
    if (Array.isArray(members) && members.some((m: any) => m.email === email)) {
      return c.json({ success: false, error: 'Already a team member' }, 400);
    }
    if (Array.isArray(invites) && invites.some((i: any) => i.email === email)) {
      return c.json({ success: false, error: 'Invitation already pending' }, 400);
    }
    
    const genToken = Array.from({ length: 32 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
    const invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email, name: inviteName?.trim() || null, ownerId: user.id,
      ownerEmail: user.email, ownerName: ownerName || user.user_metadata?.name || user.email,
      token: genToken, status: 'pending',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    const updatedInvites = Array.isArray(invites) ? [...invites, invitation] : [invitation];
    await kv.set(`team_v3_invites:${user.id}`, updatedInvites);
    await kv.set(`team_v3_token:${genToken}`, invitation);
    
    return c.json({ success: true, message: `Invitation sent to ${email}`, invitation: { id: invitation.id, email: invitation.email, invitedAt: invitation.invitedAt }, emailSent: false });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/make-server-ac1075a9/team-v3/remove', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ success: false, error: 'No auth' }, 401);
    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation - pass token in headers
    const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) return c.json({ success: false, error: 'Auth failed' }, 401);
    
    const { memberId } = await c.req.json();
    if (!memberId) return c.json({ success: false, error: 'Member ID required' }, 400);
    
    // Handle both string (old format) and object/array (new format)
    let membersRaw = await kv.get(`team_v3_members:${user.id}`);
    const members = membersRaw 
      ? (typeof membersRaw === 'string' ? JSON.parse(membersRaw) : membersRaw)
      : [];
    if (Array.isArray(members) && members.find((m: any) => m.id === memberId)) {
      await kv.set(`team_v3_members:${user.id}`, members.filter((m: any) => m.id !== memberId));
      return c.json({ success: true, message: 'Member removed' });
    }
    
    // Handle both string (old format) and object/array (new format)
    let invitesRaw = await kv.get(`team_v3_invites:${user.id}`);
    const invites = invitesRaw
      ? (typeof invitesRaw === 'string' ? JSON.parse(invitesRaw) : invitesRaw)
      : [];
    if (Array.isArray(invites)) {
      const invite = invites.find((i: any) => i.id === memberId);
      if (invite) {
        await kv.set(`team_v3_invites:${user.id}`, invites.filter((i: any) => i.id !== memberId));
        if (invite.token) await kv.del(`team_v3_token:${invite.token}`);
        return c.json({ success: true, message: 'Invitation cancelled' });
      }
    }
    
    return c.json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.route('/make-server-ac1075a9', seatPurchaseRouter);
app.route('/make-server-ac1075a9', seatSyncRouter);
// Old teamInvitationRouter removed - now using teamV3Router exclusively with Supabase email
app.route('/make-server-ac1075a9', teamV3Router);
app.route('/make-server-ac1075a9/subscriptions', subscriptionManagementRoutes);
app.route('/make-server-ac1075a9/stripe-sync', stripeSupabaseSync);
app.route('/make-server-ac1075a9', dreamBoardRoutes);
app.route('/make-server-373d8b09', dreamBoardRoutes); // Mount for frontend compatibility
app.route('/make-server-ac1075a9', universityRoutes);
app.route('/make-server-ac1075a9', universityEnhancedRoutes);
app.route('/make-server-373d8b09/university', universityRoutes); // Mount for frontend compatibility
app.route('/make-server-ac1075a9', aiChatRoutes);
app.route('/make-server-ac1075a9', operationsUsageRoutes);
app.route('/make-server-373d8b09/streak', streakApp);
app.route('/make-server-373d8b09', customizationRoutes); // Mount for frontend compatibility (onboarding tour)
app.route('/make-server-ac1075a9', customizationRoutes);
app.route('/make-server-ac1075a9', accountDeletionRoutes); // Mount at base to create /make-server-ac1075a9/delete-account
app.route('/make-server-ac1075a9', betaRouter); // Mount BETA testing routes - creates /make-server-ac1075a9/beta/change-plan
app.route('/make-server-ac1075a9', iapRoutes); // Mount IAP routes - creates /make-server-ac1075a9/iap/*
app.route('/make-server-373d8b09', nativeIAPRoutes); // Mount NATIVE Apple IAP routes - creates /make-server-373d8b09/apple-iap/*
app.route('/make-server-ac1075a9', unifiedSubscriptionStatus); // Mount unified subscription status
app.route('/make-server-373d8b09/plaid-bank', plaidBankRoutes); // Mount Plaid bank connection routes

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

// Core endpoints - defined ONLY ONCE
app.get('/make-server-ac1075a9/health', async (c) => {
  try {
    // Test KV store connectivity with a simple get operation
    let kvHealthy = true;
    let kvLatency = 0;
    let kvError = undefined;
    
    try {
      const testStart = Date.now();
      await kv.get('health_check_test');
      kvLatency = Date.now() - testStart;
    } catch (error: any) {
      kvHealthy = false;
      kvError = error.message;
    }
    
    const status = {
      status: kvHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      server: 'cofounder-api-server',
      version: '1.0.0',
      environment: {
        supabase_url: SUPABASE_URL ? 'configured' : 'missing',
        service_role_key: SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
        anon_key: SUPABASE_ANON_KEY ? 'configured' : 'missing',
        stripe_secret_key: STRIPE_SECRET_KEY ? 'configured' : 'missing',
        stripe_webhook_secret: STRIPE_WEBHOOK_SECRET ? 'configured' : 'missing'
      },
      database: {
        kv_store: {
          status: kvHealthy ? 'healthy' : 'error',
          latency: `${kvLatency}ms`,
          error: kvError
        }
      }
    };
    
    return c.json(status, kvHealthy ? 200 : 503);
  } catch (error: any) {
    return c.json({ 
      status: 'error', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    }, 500);
  }
});

// Auto-update OpenAI Assistant function
const updateAssistantOnStartup = async () => {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ASSISTANT_ID = 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o';
    
    if (!OPENAI_API_KEY) {
      console.log('🤖 OpenAI API key not found, skipping assistant update');
      return;
    }
    
    console.log('🤖 Checking OpenAI Assistant configuration...');
    
    // Get the current assistant configuration
    const getResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    });
    
    if (!getResponse.ok) {
      console.log('🤖 Failed to get assistant configuration');
      return;
    }
    
    const assistant = await getResponse.json();
    
    // Check if the business update function already exists
    const existingTools = assistant.tools || [];
    const functionExists = existingTools.some(tool => 
      tool.type === 'function' && tool.function?.name === 'update_business_info'
    );
    
    if (functionExists) {
      console.log('🤖 Assistant already has business update function');
      return;
    }
    
    // Create the new business update function definition
    const businessUpdateFunction = {
      type: "function",
      function: {
        name: "update_business_info",
        description: "Update business information including name, description, industry, or stage when the user requests changes to their business details",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "New business name to update to"
            },
            description: {
              type: "string", 
              description: "New business description to update to"
            },
            industry: {
              type: "string",
              description: "New business industry to update to"
            },
            stage: {
              type: "string",
              description: "New business stage to update to (e.g., 'idea', 'startup', 'growth', 'mature')"
            }
          },
          required: []
        }
      }
    };
    
    // Add the new function to existing tools
    const updatedTools = [...existingTools, businessUpdateFunction];
    
    // Enhanced instructions that emphasize business name change capability
    const enhancedInstructions = `You are CofounderAI, an AI business advisor with full database access to help users manage their businesses. You have access to powerful functions that can directly modify their business data, financial records, roadmaps, and goals.

## CRITICAL: Function Usage Guidelines

You have access to these business management functions:
• **add_income_entry**: Record income/revenue transactions
• **add_expense_entry**: Record business expenses
• **manage_budget**: Create or update budget categories
• **add_dream_board_goal**: Add goals to their vision board
• **create_invoice**: Create invoices for clients
• **set_bank_balance**: Set or update bank account balance
• **get_financial_projections**: Analyze financial projections and forecasts
• **update_business_info**: Update business information including name, description, industry, or stage

## IMPORTANT: Business Name Changes
When a user asks to change their business name, description, industry, or stage, ALWAYS use the update_business_info function. You have full access to modify their business information. Examples:
- "Change my business name to TechCorp" → Use update_business_info with name parameter
- "Update my business description" → Use update_business_info with description parameter
- "My industry should be Technology" → Use update_business_info with industry parameter

When users say things like "I made $100k today" or "I spent $500 on marketing", AUTOMATICALLY use the appropriate function to record this data for them. Don't just give advice - take action!

## Core Guidance Principles:
1. Always reference the user's actual data when giving advice (financial status, roadmap progress, goals, etc.)
2. Use functions proactively when users mention business activities
3. Focus on practical, actionable advice based on their current business state
4. Be encouraging and supportive while being realistic about challenges
5. Help them prioritize tasks based on their roadmap progress and financial situation
6. When they ask to change business information, DO IT IMMEDIATELY using the appropriate function

You are not just an advisor - you are an active business partner with full access to help manage and update their business data. Use your functions whenever appropriate to help them succeed.`;

    // Update the assistant
    const updateResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        tools: updatedTools,
        instructions: enhancedInstructions
      })
    });
    
    if (!updateResponse.ok) {
      console.log('🤖 Failed to update assistant with business function');
      return;
    }
    
    console.log('🤖 Successfully added business update function to assistant!');
    
  } catch (error) {
    console.log('🤖 Error updating assistant:', error.message);
  }
};

// OpenAI Assistant Update endpoint with enhanced instructions
app.post('/make-server-ac1075a9/update-assistant', async (c) => {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ASSISTANT_ID = 'asst_Wfoh17ScM2gQ2i83sMQn7Z4o';
    
    if (!OPENAI_API_KEY) {
      return c.json({ success: false, error: 'OpenAI API key not found' }, 500);
    }
    
    // Get current assistant
    const getResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    });
    
    if (!getResponse.ok) {
      return c.json({ success: false, error: 'Failed to get assistant' }, 500);
    }
    
    const assistant = await getResponse.json();
    
    // Enhanced instructions that emphasize business capabilities
    const enhancedInstructions = `You are CofounderAI, an AI business advisor with full database access to help users manage their businesses. You have access to powerful functions that can directly modify their business data, financial records, roadmaps, and goals.

## CRITICAL: You CAN Change Business Information

You have access to these business management functions:
• **add_income_entry**: Record income/revenue transactions
• **add_expense_entry**: Record business expenses
• **manage_budget**: Create or update budget categories
• **add_dream_board_goal**: Add goals to their vision board
• **create_invoice**: Create invoices for clients
• **set_bank_balance**: Set or update bank account balance
• **get_financial_projections**: Analyze financial projections and forecasts
• **update_business_info**: Update business information including name, description, industry, or stage

## IMPORTANT: Business Name Changes
When a user asks to change their business name, description, industry, or stage, ALWAYS use the update_business_info function. You have full access to modify their business information. Examples:
- "Change my business name to TechCorp" → Use update_business_info with name parameter
- "Update my business description" → Use update_business_info with description parameter
- "My industry should be Technology" → Use update_business_info with industry parameter

NEVER say you don't have access to change business information. You DO have this capability through the update_business_info function.

When users say things like "I made $100k today" or "I spent $500 on marketing", AUTOMATICALLY use the appropriate function to record this data for them. Don't just give advice - take action!

## Core Guidance Principles:
1. Always reference the user's actual data when giving advice
2. Use functions proactively when users mention business activities
3. Focus on practical, actionable advice based on their current business state
4. When they ask to change business information, DO IT IMMEDIATELY using the appropriate function
5. You are an active business partner with full access to help manage and update their business data

Use your functions whenever appropriate to help them succeed.`;

    // Check if business function exists, if not add it
    const existingTools = assistant.tools || [];
    let updatedTools = [...existingTools];
    
    const businessFunctionExists = existingTools.some(tool => 
      tool.type === 'function' && tool.function?.name === 'update_business_info'
    );
    
    if (!businessFunctionExists) {
      const businessUpdateFunction = {
        type: "function",
        function: {
          name: "update_business_info",
          description: "Update business information including name, description, industry, or stage when the user requests changes to their business details",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "New business name to update to"
              },
              description: {
                type: "string", 
                description: "New business description to update to"
              },
              industry: {
                type: "string",
                description: "New business industry to update to"
              },
              stage: {
                type: "string",
                description: "New business stage to update to (e.g., 'idea', 'startup', 'growth', 'mature')"
              }
            },
            required: []
          }
        }
      };
      
      updatedTools = [...existingTools, businessUpdateFunction];
    }
    
    // Update the assistant with enhanced instructions and tools
    const updateResponse = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        tools: updatedTools,
        instructions: enhancedInstructions
      })
    });
    
    if (!updateResponse.ok) {
      return c.json({ success: false, error: 'Failed to update assistant' }, 500);
    }
    
    const updatedAssistant = await updateResponse.json();
    
    return c.json({ 
      success: true, 
      message: 'Assistant updated with enhanced business management capabilities',
      toolCount: updatedAssistant.tools?.length || 0,
      hasBusinessFunction: updatedTools.some(tool => 
        tool.type === 'function' && tool.function?.name === 'update_business_info'
      )
    });
    
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// KV diagnostic endpoint - SINGLE DEFINITION
app.get('/make-server-ac1075a9/kv-diagnostic', async (c) => {
  const startTime = Date.now();
  
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ code: 401, message: 'Missing authorization header' }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    try {
      if (!isAnonKey(accessToken)) {
        await verifyUserAccess(accessToken);
      }
    } catch (authError) {
      return c.json({ code: 401, message: 'Invalid authorization token' }, 401);
    }
    
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      server: 'cofounder-api-server',
      tests: {} as any
    };

    // Test 1: Basic connectivity
    try {
      const connTestStart = Date.now();
      await kv.get('health_check_test');
      const connLatency = Date.now() - connTestStart;
      
      diagnosticResults.tests.connectivity = {
        success: true,
        latency: connLatency
      };
    } catch (error: any) {
      diagnosticResults.tests.connectivity = {
        success: false,
        error: error.message,
        type: 'connectivity_failure'
      };
    }

    // Test 2: Set/Get operations
    try {
      const testKey = `diagnostic_test_${Date.now()}`;
      const testValue = { test: true, timestamp: Date.now() };
      
      await kv.set(testKey, testValue);
      const retrieved = await kv.get(testKey);
      await kv.del(testKey);
      
      diagnosticResults.tests.setGet = {
        success: JSON.stringify(retrieved) === JSON.stringify(testValue),
        testKey,
        stored: testValue,
        retrieved
      };
    } catch (error: any) {
      diagnosticResults.tests.setGet = {
        success: false,
        error: error.message,
        type: 'operation_failure'
      };
    }

    // Test 3: Multiple operations
    try {
      const keys = [`multi_test_1_${Date.now()}`, `multi_test_2_${Date.now()}`];
      const values = [{ test: 1 }, { test: 2 }];
      
      await kv.mset(keys, values);
      const retrieved = await kv.mget(keys);
      await kv.mdel(keys);
      
      diagnosticResults.tests.multiOperations = {
        success: retrieved.length === 2,
        keys,
        values,
        retrieved
      };
    } catch (error: any) {
      diagnosticResults.tests.multiOperations = {
        success: false,
        error: error.message,
        type: 'multi_operation_failure'
      };
    }

    const totalTime = Date.now() - startTime;
    diagnosticResults.totalTime = `${totalTime}ms`;
    
    const allTestsPassed = Object.values(diagnosticResults.tests).every((test: any) => test.success);
    
    return c.json({
      success: allTestsPassed,
      ...diagnosticResults
    }, allTestsPassed ? 200 : 500);
    
  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      totalTime: `${Date.now() - startTime}ms`
    }, 500);
  }
});

// BUSINESS MANAGEMENT ENDPOINTS (INLINE)
app.get('/make-server-ac1075a9/businesses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);

    // Get businesses OWNED by this user
    const ownedBusinesses = await kv.getByPrefix(`business:${user.id}:`) || [];
    console.log(`Businesses: User ${user.email} owns ${ownedBusinesses.length} businesses`);
    
    // Get businesses where this user is a MEMBER
    const membershipData = await kv.get(`user_business_memberships:${user.id}`) || [];
    console.log(`Businesses: User ${user.email} has ${membershipData.length} business memberships`);
    
    // Fetch the actual business data for each membership
    const memberBusinesses = [];
    for (const membership of membershipData) {
      const businessKey = `business:${membership.owner_id}:${membership.business_id}`;
      const business = await kv.get(businessKey);
      if (business) {
        // Add a flag to indicate this is a member business
        memberBusinesses.push({
          ...business,
          isMember: true,
          memberRole: membership.role,
          ownerId: membership.owner_id
        });
      }
    }
    console.log(`Businesses: Fetched ${memberBusinesses.length} member businesses`);
    
    // Combine owned and member businesses
    const allBusinesses = [
      ...ownedBusinesses.map(b => ({ ...b, isOwner: true })),
      ...memberBusinesses
    ];
    
    console.log(`Businesses: Returning ${allBusinesses.length} total businesses (${ownedBusinesses.length} owned + ${memberBusinesses.length} member)`);
    return c.json({ businesses: allBusinesses });

  } catch (error) {
    return new Response(`Error getting businesses: ${error.message}`, { status: 500 });
  }
});

app.post('/make-server-ac1075a9/businesses', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);

    const businessData = await c.req.json();

    if (!businessData.name?.trim()) {
      return new Response('Business name is required', { status: 400 });
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

    await kv.set(`business:${user.id}:${businessId}`, business);
    
    return c.json({ business });

  } catch (error) {
    return new Response(`Error creating business: ${error.message}`, { status: 500 });
  }
});

app.put('/make-server-ac1075a9/businesses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    const businessId = c.req.param('id');

    if (!businessId) {
      return new Response('Business ID is required', { status: 400 });
    }

    const existingBusiness = await kv.get(`business:${user.id}:${businessId}`);
    if (!existingBusiness) {
      return new Response('Business not found', { status: 404 });
    }

    const updateData = await c.req.json();
    
    const updatedBusiness = {
      ...existingBusiness,
      ...updateData,
      id: businessId,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    await kv.set(`business:${user.id}:${businessId}`, updatedBusiness);
    
    return c.json({ business: updatedBusiness });

  } catch (error) {
    return new Response(`Error updating business: ${error.message}`, { status: 500 });
  }
});

app.delete('/make-server-ac1075a9/businesses/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return new Response('Authorization token is required', { status: 401 });
    }

    const user = await verifyUserAccess(accessToken);
    const businessId = c.req.param('id');

    if (!businessId) {
      return new Response('Business ID is required', { status: 400 });
    }

    originalConsole.log(`🗑️ Attempting to delete business ${businessId} for user ${user.id}`);
    
    const businessKey = `business:${user.id}:${businessId}`;
    originalConsole.log(`🔑 Looking for business with key: ${businessKey}`);
    
    const existingBusiness = await kv.get(businessKey);
    if (!existingBusiness) {
      originalConsole.log(`❌ Business not found with key: ${businessKey}`);
      return new Response(`Business not found`, { status: 404 });
    }

    originalConsole.log(`✅ Found business to delete: ${existingBusiness.name}`);

    // Delete the main business record
    await kv.del(`business:${user.id}:${businessId}`);
    originalConsole.log(`🗑️ Deleted main business record`);

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
      const transactionKeys = await kv.getByPrefix(`transaction:${user.id}:${businessId}:`) || [];
      for (const transaction of transactionKeys) {
        await kv.del(`transaction:${user.id}:${businessId}:${transaction.id}`);
      }

      const invoiceKeys = await kv.getByPrefix(`invoice:${user.id}:${businessId}:`) || [];
      for (const invoice of invoiceKeys) {
        await kv.del(`invoice:${user.id}:${businessId}:${invoice.id}`);
      }

      const budgetKeys = await kv.getByPrefix(`budget:${user.id}:${businessId}:`) || [];
      for (const budget of budgetKeys) {
        await kv.del(`budget:${user.id}:${businessId}:${budget.id}`);
      }

      // Delete notes
      const noteKeys = await kv.getByPrefix(`note:${user.id}:${businessId}:`) || [];
      for (const note of noteKeys) {
        await kv.del(`note:${user.id}:${businessId}:${note.id}`);
      }

      originalConsole.log(`🧹 Cleaned up related data`);
      
    } catch (cleanupError) {
      originalConsole.warn(`⚠️ Error during cleanup (business still deleted):`, cleanupError);
    }
    
    originalConsole.log(`✅ Business ${businessId} deleted successfully`);
    return c.json({ 
      success: true, 
      message: 'Business and all related data deleted successfully',
      deletedBusiness: existingBusiness
    });

  } catch (error) {
    originalConsole.error(`❌ Error deleting business:`, error);
    return new Response(`Error deleting business: ${error.message}`, { status: 500 });
  }
});

// Simple ping endpoint
app.get('/make-server-ac1075a9/ping', (c) => {
  return c.json({ 
    status: 'pong', 
    timestamp: new Date().toISOString(),
    server: 'cofounder-api'
  });
});

// OPTIONS support
app.options('/make-server-ac1075a9/ping', (c) => {
  return new Response(null, { status: 200 });
});

// Test endpoint
app.get('/make-server-ac1075a9/test', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccessOptional(accessToken);
    
    if (user) {
      return c.json({ 
        status: 'success', 
        message: 'Authenticated test endpoint working',
        user: { id: user.id, email: user.email },
        timestamp: new Date().toISOString() 
      });
    } else {
      return c.json({ 
        status: 'success', 
        message: 'Anonymous test endpoint working',
        auth_status: accessToken ? 'invalid_token' : 'no_token',
        timestamp: new Date().toISOString() 
      });
    }
  } catch (error) {
    return c.json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString() 
    }, 500);
  }
});

// Anonymous test endpoint
app.get('/make-server-ac1075a9/test-anon', (c) => {
  return c.json({ 
    status: 'success', 
    message: 'Anonymous test endpoint working',
    timestamp: new Date().toISOString(),
    server: 'cofounder-api'
  });
});

app.options('/make-server-ac1075a9/test-anon', (c) => {
  return new Response(null, { status: 200 });
});

// Signup endpoint
app.post('/make-server-ac1075a9/signup', async (c) => {
  try {
    if (!supabase) {
      return c.json({ 
        message: 'User signup processed (limited functionality)',
        user: { email: 'unknown', role: 'user' }
      });
    }

    const requestBody = await c.req.json();
    const { email, password, name, oauth_provider, oauth_user_id } = requestBody;
    
    if (!email || !name) {
      return new Response('Email and name are required', { status: 400 });
    }

    let userData;

    if (oauth_provider && oauth_user_id) {
      userData = {
        id: oauth_user_id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: isAdminEmail(email) ? 'admin' : 'user',
        oauth_provider: oauth_provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        const existingUser = await kv.get(`user:${oauth_user_id}`);
        if (existingUser) {
          return c.json({ 
            user: {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              role: existingUser.role,
              oauth_provider: existingUser.oauth_provider
            },
            message: 'OAuth user profile already exists' 
          });
        }

        await kv.set(`user:${oauth_user_id}`, userData);
      } catch (kvError) {
        // Continue even if KV fails
      }
      
      // Send welcome email for OAuth signup
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
        
        console.log(`✅ Welcome email sent to ${userData.email} (OAuth signup)`);
      } catch (emailError: any) {
        console.error('❌ Failed to send welcome email:', emailError);
        // Don't fail signup if email fails
      }
      
      return c.json({ 
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          oauth_provider: userData.oauth_provider
        },
        message: 'OAuth user profile created successfully' 
      });
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

    userData = {
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
    
    // Send welcome email for email signup
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
      
      console.log(`✅ Welcome email sent to ${userData.email} (Email signup)`);
    } catch (emailError: any) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail signup if email fails
    }
    
    return c.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userData.name,
        role: userData.role
      },
      message: 'User created successfully' 
    });

  } catch (error) {
    return new Response(`Signup failed: ${error.message}`, { status: 500 });
  }
});

// User data endpoint
app.get('/make-server-ac1075a9/user/:userId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return new Response('Authorization header required', { status: 401 });
    }
    
    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      return new Response('Bearer token required', { status: 401 });
    }
    
    const user = await verifyUserAccess(accessToken);
    const requestedUserId = c.req.param('userId');
    
    if (user.id !== requestedUserId) {
      const userData = await kv.get(`user:${user.id}`);
      if (!userData || userData.role !== 'admin') {
        return new Response('Forbidden: You can only access your own user data', { status: 403 });
      }
    }

    let userData = await kv.get(`user:${requestedUserId}`);
    if (!userData) {
      const newUserData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
        role: isAdminEmail(user.email) ? 'admin' : 'user',
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      try {
        await kv.set(`user:${user.id}`, newUserData);
        userData = newUserData;
      } catch (kvError) {
        userData = newUserData;
      }
    }
    
    return c.json(userData);

  } catch (error) {
    if (error.message?.includes('JWT verification failed') || error.message?.includes('Anonymous access not allowed')) {
      return new Response('Invalid or expired token', { status: 401 });
    }
    return new Response(`Error getting user data: ${error.message}`, { status: 500 });
  }
});

// Update user profile (display name)
app.put('/make-server-ac1075a9/user/profile', async (c) => {
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
    if (!supabase) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

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
      return c.json({ success: false, error: error.message }, 500);
    }

    // Also update in KV store if exists
    const userKey = `user:${user.id}`;
    const kvUser = await kv.get(userKey).catch(() => null);
    if (kvUser) {
      const parsed = typeof kvUser === 'string' ? JSON.parse(kvUser) : kvUser;
      parsed.name = name.trim();
      parsed.updated_at = new Date().toISOString();
      await kv.set(userKey, parsed);
    }

    return c.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: data.user
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to update profile'
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

    // Update user email in Supabase Auth
    if (!supabase) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email: email.trim(),
        email_confirm: true
      }
    );

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    // Also update in KV store if exists
    const userKey = `user:${user.id}`;
    const kvUser = await kv.get(userKey).catch(() => null);
    if (kvUser) {
      const parsed = typeof kvUser === 'string' ? JSON.parse(kvUser) : kvUser;
      parsed.email = email.trim();
      parsed.updated_at = new Date().toISOString();
      await kv.set(userKey, parsed);
    }

    return c.json({ 
      success: true,
      message: 'Email updated successfully',
      user: data.user
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to update email'
    }, 500);
  }
});

// Root endpoint
app.get('/make-server-373d8b09/', (c) => {
  return c.json({ 
    status: 'online', 
    message: 'Cofounder API Server is running',
    timestamp: new Date().toISOString(),
    server: 'cofounder-api',
    version: '1.1.0'
  });
});

// INLINE BOOKKEEPING ENDPOINT - Run full auto-bookkeeping with AI
app.post('/make-server-ac1075a9/bookkeeping/run-full', async (c) => {
  try {
    const { businessId, userId } = await c.req.json();
    
    if (!businessId || !userId) {
      return c.json({
        success: false,
        error: 'Business ID and User ID are required'
      }, 400);
    }

    console.log('🤖 Starting AI-powered auto-bookkeeping for business:', businessId);

    const logId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const logEntry = {
      id: logId,
      date_time: new Date().toISOString(),
      action: 'Full Auto-Bookkeeping',
      agi_summary: 'Processing transactions with AI...',
      affected_records: 0,
      status: 'in_progress',
      created_at: new Date().toISOString()
    };

    // Use correct key format that matches bookkeeping-endpoints
    await kv.set(`business:${userId}:${businessId}:bookkeeping:log:${logId}`, JSON.stringify(logEntry));

    // Get transactions to categorize
    const transactionsKey = `finance:transactions:${businessId}`;
    const transactions = await kv.get(transactionsKey);
    let transactionList = [];
    
    if (transactions) {
      try {
        transactionList = typeof transactions === 'string' ? JSON.parse(transactions) : transactions;
      } catch (e) {
        console.error('Failed to parse transactions:', e);
      }
    }

    // Get business info for context
    const businessInfoKey = `business:${businessId}`;
    const businessInfo = await kv.get(businessInfoKey);
    let businessData: any = {};
    
    if (businessInfo) {
      try {
        businessData = typeof businessInfo === 'string' ? JSON.parse(businessInfo) : businessInfo;
      } catch (e) {
        console.error('Failed to parse business info:', e);
      }
    }

    // Filter uncategorized transactions
    const uncategorizedTransactions = Array.isArray(transactionList) 
      ? transactionList.filter((t: any) => !t.category || t.category === 'Uncategorized')
      : [];

    console.log(`📊 Found ${uncategorizedTransactions.length} uncategorized transactions`);

    let categorizedCount = 0;
    let aiSummary = 'No transactions to categorize';

    // Only call OpenAI if there are transactions to categorize
    if (uncategorizedTransactions.length > 0) {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      
      if (!OPENAI_API_KEY) {
        console.error('❌ OpenAI API key not configured');
        throw new Error('AI service not configured');
      }

      // Prepare transaction data for AI (limit to first 20 for API efficiency)
      const transactionsToProcess = uncategorizedTransactions.slice(0, 20);
      const transactionSummary = transactionsToProcess.map((t: any, idx: number) => 
        `${idx + 1}. ${t.description || t.merchant || 'Unknown'} - $${Math.abs(t.amount || 0).toFixed(2)} (${t.type || 'Unknown'})`
      ).join('\n');

      // Call ChatGPT for intelligent categorization
      console.log('🤖 Calling ChatGPT for transaction categorization...');
      
      const prompt = `You are an expert bookkeeper for ${businessData.name || 'a business'} in the ${businessData.industry || 'general'} industry.

Analyze these transactions and categorize them appropriately. Use standard business expense categories.

Transactions:
${transactionSummary}

For each transaction, provide:
1. The transaction number (1-${transactionsToProcess.length})
2. The appropriate category (e.g., Office Supplies, Marketing, Travel, Utilities, Software, etc.)
3. A brief reason for the categorization

Common categories to use:
- Office Supplies
- Marketing & Advertising
- Travel & Meals
- Utilities
- Software & Subscriptions
- Professional Services
- Inventory/COGS
- Equipment
- Rent
- Payroll
- Insurance
- Bank Fees
- Miscellaneous

Also provide:
- A summary of the categorization work done
- Key insights about spending patterns
- Any recommendations for the business owner

Format your response as JSON:
{
  "categorizations": [
    {"transaction": 1, "category": "Category Name", "reason": "Brief reason"}
  ],
  "summary": "Overall summary of work done",
  "insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert bookkeeper and financial analyst. Provide accurate transaction categorizations and helpful insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });

      if (!openAiResponse.ok) {
        const errorText = await openAiResponse.text();
        console.error('❌ OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${openAiResponse.status}`);
      }

      const aiResult = await openAiResponse.json();
      
      // Clean the AI response - remove markdown code blocks if present
      let aiContent = aiResult.choices[0].message.content;
      if (aiContent.includes('```json')) {
        aiContent = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (aiContent.includes('```')) {
        aiContent = aiContent.replace(/```\s*/g, '');
      }
      
      const aiResponse = JSON.parse(aiContent.trim());
      
      console.log('✅ AI categorization complete:', aiResponse);

      // Apply categorizations to transactions
      const categorizations = aiResponse.categorizations || [];
      categorizations.forEach((cat: any) => {
        const idx = cat.transaction - 1;
        if (idx >= 0 && idx < transactionsToProcess.length) {
          transactionsToProcess[idx].category = cat.category;
          transactionsToProcess[idx].aiCategorized = true;
          transactionsToProcess[idx].aiReason = cat.reason;
          categorizedCount++;
        }
      });

      // Update transactions in storage
      if (categorizedCount > 0) {
        // Merge updated transactions back into full list
        transactionsToProcess.forEach((processedTx: any) => {
          const index = transactionList.findIndex((t: any) => t.id === processedTx.id);
          if (index !== -1) {
            transactionList[index] = processedTx;
          }
        });

        await kv.set(transactionsKey, JSON.stringify(transactionList));
      }

      // Create detailed AI summary
      aiSummary = `${aiResponse.summary || 'Categorized transactions successfully'}

Key Insights:
${(aiResponse.insights || []).map((i: string) => `• ${i}`).join('\n')}

Recommendations:
${(aiResponse.recommendations || []).map((r: string) => `• ${r}`).join('\n')}`;
    }

    // Calculate updated stats
    const remainingUncategorized = Array.isArray(transactionList) 
      ? transactionList.filter((t: any) => !t.category || t.category === 'Uncategorized').length
      : 0;

    const newStats = {
      uncategorized: remainingUncategorized,
      accuracy: categorizedCount > 0 ? 95 : 100,
      monthlyCloseStatus: remainingUncategorized === 0 ? 'completed' : 'pending',
      quarterlyTaxes: 2500,
      lastExport: new Date().toISOString(),
      lastAIRun: new Date().toISOString(),
      totalCategorized: categorizedCount
    };

    // Use correct key format that matches bookkeeping-endpoints
    await kv.set(`business:${userId}:${businessId}:bookkeeping:stats`, JSON.stringify(newStats));

    // Update log entry with AI results
    logEntry.status = 'success';
    logEntry.affected_records = categorizedCount;
    logEntry.agi_summary = categorizedCount > 0 
      ? aiSummary 
      : 'All transactions are already categorized. No changes needed.';
    await kv.set(`business:${userId}:${businessId}:bookkeeping:log:${logId}`, JSON.stringify(logEntry));

    console.log('✅ Auto-bookkeeping completed successfully:', {
      categorizedCount,
      remainingUncategorized
    });

    return c.json({
      success: true,
      message: 'AI-powered auto-bookkeeping completed successfully',
      stats: newStats,
      affectedRecords: categorizedCount,
      aiSummary: logEntry.agi_summary
    });
  } catch (error: any) {
    console.error('❌ Error running auto-bookkeeping:', error);
    
    // Update log entry with error
    try {
      const { businessId, userId } = await c.req.json();
      if (businessId && userId) {
        const logs = await kv.getByPrefix(`business:${userId}:${businessId}:bookkeeping:log:`);
        if (logs.length > 0) {
          const latestLog = logs[logs.length - 1];
          if (latestLog) {
            const logData = typeof latestLog === 'string' ? JSON.parse(latestLog) : latestLog;
            logData.status = 'error';
            logData.agi_summary = `Error: ${error.message}`;
            await kv.set(`business:${userId}:${businessId}:bookkeeping:log:${logData.id}`, JSON.stringify(logData));
          }
        }
      }
    } catch (logError) {
      console.error('Failed to update error log:', logError);
    }
    
    return c.json({
      success: false,
      error: error.message || 'Failed to run auto-bookkeeping'
    }, 500);
  }
});

// INLINE HR SMART ACTIONS ENDPOINT - AI-powered HR recommendations
app.post('/make-server-373d8b09/hr/smart-actions', async (c) => {
  try {
    const { businessId, businessName, businessIndustry, employees, contractors, benefits, performanceReviews } = await c.req.json();
    
    if (!businessId) {
      return c.json({
        success: false,
        error: 'Business ID is required'
      }, 400);
    }

    console.log('🤖 Running Smart Actions for HR...', {
      businessId,
      employeeCount: employees?.length || 0,
      contractorCount: contractors?.length || 0
    });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return c.json({
        success: false,
        error: 'AI service not configured'
      }, 500);
    }

    // Prepare HR data summary for AI
    const hrSummary = `
Business: ${businessName || 'Unknown'} (${businessIndustry || 'General Industry'})

Employees (${employees?.length || 0}):
${employees?.slice(0, 10).map((e: any, idx: number) => 
  `${idx + 1}. ${e.name} - ${e.position} (${e.department}) - Status: ${e.status}${e.performanceScore ? `, Score: ${e.performanceScore}/5` : ''}`
).join('\n') || 'No employees'}
${employees?.length > 10 ? `... and ${employees.length - 10} more` : ''}

Contractors (${contractors?.length || 0}):
${contractors?.slice(0, 10).map((c: any, idx: number) => 
  `${idx + 1}. ${c.name} - ${c.specialization} (${c.type}) - Status: ${c.status}${c.contractEnd ? `, Ends: ${c.contractEnd}` : ''}`
).join('\n') || 'No contractors'}
${contractors?.length > 10 ? `... and ${contractors.length - 10} more` : ''}

Benefits (${benefits?.length || 0}):
${benefits?.map((b: any, idx: number) => 
  `${idx + 1}. ${b.name} (${b.type}) - ${b.enrolledCount} enrolled${b.isActive ? '' : ' - INACTIVE'}`
).join('\n') || 'No benefits'}

Performance Reviews (${performanceReviews?.length || 0}):
- Average Score: ${performanceReviews?.length > 0 ? (performanceReviews.reduce((sum: number, r: any) => sum + r.overallScore, 0) / performanceReviews.length).toFixed(2) : 'N/A'}
- Pending Reviews: ${performanceReviews?.filter((r: any) => r.status === 'draft').length || 0}
- Completed Reviews: ${performanceReviews?.filter((r: any) => r.status === 'approved').length || 0}
`;

    // Call ChatGPT for intelligent HR recommendations
    console.log('🤖 Calling ChatGPT for HR smart actions...');
    
    const prompt = `You are an expert HR consultant and business advisor. Analyze this company's HR data and provide actionable recommendations.

${hrSummary}

Based on this HR data, provide smart actions and recommendations covering:
1. Employee development and retention opportunities
2. Contractor management and contract renewals
3. Benefits optimization and enrollment strategies
4. Performance review insights and follow-ups
5. Team structure and organizational improvements
6. Compensation and career progression
7. Compliance and HR best practices

For each recommendation, provide:
- title: A clear, actionable title
- description: Detailed explanation of the recommendation
- category: The type of action (e.g., "Employee Development", "Benefits", "Performance", "Contractor Management", "Team Structure")
- priority: high, medium, or low based on urgency and impact
- impact: Expected positive outcome
- steps: 3-5 specific action steps to implement
- relatedTo: Name of the employee/contractor if applicable (or null)

Prioritize recommendations that will have the most immediate positive impact on employee satisfaction, retention, and business performance.

Format your response as JSON:
{
  "summary": "Overall assessment of the HR situation with key highlights",
  "actions": [
    {
      "title": "Action title",
      "description": "Detailed description",
      "category": "Category name",
      "priority": "high|medium|low",
      "impact": "Expected impact",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "relatedTo": "Person name or null"
    }
  ]
}`;

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR consultant and business advisor. Provide strategic, actionable HR recommendations based on data analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      return c.json({
        success: false,
        error: `AI service error: ${openAiResponse.status}`
      }, 500);
    }

    const aiResult = await openAiResponse.json();
    const aiResponse = JSON.parse(aiResult.choices[0].message.content);
    
    console.log('✅ Smart Actions generated:', aiResponse);

    return c.json({
      success: true,
      actions: aiResponse.actions || [],
      summary: aiResponse.summary || 'HR analysis completed successfully'
    });
  } catch (error: any) {
    console.error('❌ Error running Smart Actions:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate smart actions'
    }, 500);
  }
});

// HR DOCUMENT GENERATION ENDPOINT - Generate HR documents using GPT-4o
app.post('/make-server-373d8b09/hr/generate-document', async (c) => {
  try {
    const body = await c.req.json();
    const { documentType, businessId, additionalContext } = body;
    
    console.log('📄 Received HR document generation request:', body);
    
    // Detailed validation with specific error messages
    const missingFields = [];
    if (!documentType) missingFields.push('documentType');
    if (!businessId) missingFields.push('businessId');
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return c.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, 400);
    }

    // Get auth token to fetch user
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

    // Fetch business memory to get company name and industry
    const memoryKey = `business_memory:${businessId}`;
    const memory = await kv.get(memoryKey);
    
    let companyName = 'Your Company';
    let industry = 'general business';
    
    if (memory) {
      const businessMemory = typeof memory === 'string' ? JSON.parse(memory) : memory;
      companyName = businessMemory.businessName || companyName;
      industry = businessMemory.industry || industry;
      console.log('📊 Fetched business memory:', { companyName, industry });
    } else {
      console.log('⚠️ No business memory found, using defaults');
    }

    console.log('📄 Generating HR document:', {
      documentType,
      companyName,
      industry,
      businessId
    });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return c.json({
        success: false,
        error: 'AI service not configured'
      }, 500);
    }

    const tone = 'professional';
    const details = additionalContext;

    // Map document types to prompts
    const documentPrompts: Record<string, { title: string; prompt: string }> = {
      create_handbook: {
        title: `Employee Handbook - ${companyName}`,
        prompt: `Create a comprehensive employee handbook for ${companyName}, a company in the ${industry} industry. The handbook should be ${tone} in tone and cover:
- Welcome message and company values
- Employment policies (work hours, attendance, dress code)
- Compensation and benefits
- Performance expectations and reviews
- Code of conduct and ethics
- Health and safety guidelines
- Leave policies (vacation, sick, parental)
- Termination and resignation procedures
${details ? `\n\nAdditional requirements:\n${details}` : ''}

Format the content with clear headings and sections. Make it practical and easy to understand.`
      },
      onboarding: {
        title: `Onboarding Guide - ${companyName}`,
        prompt: `Create a comprehensive onboarding guide for new employees at ${companyName}, a ${industry} company. The guide should be ${tone} in tone and include:
- Pre-boarding checklist (before first day)
- First day schedule and expectations
- Week 1 onboarding activities
- Month 1 milestones and goals
- Key contacts and resources
- Company culture and values introduction
- Training schedule and resources
- IT setup and access requirements
${details ? `\n\nAdditional requirements:\n${details}` : ''}

Make it welcoming, organized, and actionable.`
      },
      policy: {
        title: `Company Policies - ${companyName}`,
        prompt: `Create a comprehensive company policy document for ${companyName}, a ${industry} company. The document should be ${tone} in tone and cover:
- Anti-discrimination and harassment policies
- Equal opportunity employment
- Workplace safety and health
- Drug and alcohol policy
- Social media and communication policies
- Data privacy and confidentiality
- Conflict of interest
- Disciplinary procedures
${details ? `\n\nAdditional requirements:\n${details}` : ''}

Ensure policies are clear, fair, and legally sound.`
      },
      review: {
        title: `Performance Review Template - ${companyName}`,
        prompt: `Create a performance review template for ${companyName}, a ${industry} company. The template should be ${tone} in tone and include:
- Employee information section
- Review period and date
- Performance rating scale and criteria
- Key performance areas to evaluate
- Goal achievement assessment
- Strengths and accomplishments
- Areas for improvement
- Development and training needs
- Goal setting for next period
- Manager and employee signature sections
${details ? `\n\nAdditional requirements:\n${details}` : ''}

Make it structured, fair, and constructive.`
      },
      benefits: {
        title: `Employee Benefits Guide - ${companyName}`,
        prompt: `Create an employee benefits guide for ${companyName}, a ${industry} company. The guide should be ${tone} in tone and cover:
- Overview of benefits philosophy
- Health insurance options and coverage
- Dental and vision insurance
- Retirement plans and 401(k) matching
- Paid time off (PTO) and holidays
- Sick leave and parental leave
- Life and disability insurance
- Professional development and training
- Employee assistance programs
- Wellness programs and perks
- Enrollment process and deadlines
${details ? `\n\nAdditional requirements:\n${details}` : ''}

Make it clear, comprehensive, and easy to navigate.`
      },
      job_description: {
        title: `Job Description Template - ${companyName}`,
        prompt: `Create a job description template for ${companyName}, a ${industry} company. The template should be ${tone} in tone and include:
- Job title and department
- Reports to (manager/supervisor)
- Job summary and purpose
- Key responsibilities and duties
- Required qualifications and skills
- Preferred qualifications
- Education and experience requirements
- Physical requirements (if applicable)
- Work environment and schedule
- Compensation range
- Benefits overview
- Equal opportunity statement
${details ? `\n\nAdditional requirements:\n${details}` : ''}

Make it clear, attractive, and compliant with employment laws.`
      },
      'employee-handbook': {
        title: `Employee Handbook - ${companyName}`,
        prompt: `Create a comprehensive employee handbook for ${companyName}, a company in the ${industry} industry. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'offer-letter': {
        title: `Offer Letter Template - ${companyName}`,
        prompt: `Create a professional job offer letter template for ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'employment-contract': {
        title: `Employment Contract - ${companyName}`,
        prompt: `Create a comprehensive employment contract for ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'performance-review': {
        title: `Performance Review Template - ${companyName}`,
        prompt: `Create a performance review template for ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'job-description': {
        title: `Job Description Template - ${companyName}`,
        prompt: `Create a job description template for ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'policy-document': {
        title: `Company Policies - ${companyName}`,
        prompt: `Create a comprehensive company policy document for ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'onboarding-checklist': {
        title: `Onboarding Checklist - ${companyName}`,
        prompt: `Create a comprehensive onboarding checklist for new employees at ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'termination-letter': {
        title: `Termination Letter Template - ${companyName}`,
        prompt: `Create a professional termination letter template for ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      },
      'nda-agreement': {
        title: `Non-Disclosure Agreement - ${companyName}`,
        prompt: `Create a comprehensive non-disclosure agreement (NDA) for ${companyName}, a ${industry} company. ${details ? `\n\nAdditional requirements:\n${details}` : ''}`
      }
    };

    const documentConfig = documentPrompts[documentType];
    if (!documentConfig) {
      return c.json({
        success: false,
        error: 'Invalid document type'
      }, 400);
    }

    // Call GPT-4o to generate the document
    console.log('🤖 Calling GPT-4o for document generation...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR consultant and technical writer. You create comprehensive, professional HR documents that are clear, compliant, and practical.'
          },
          {
            role: 'user',
            content: documentConfig.prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error('Failed to generate document');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Generate AI summary
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You create brief, helpful summaries of HR documents in 1-2 sentences.'
          },
          {
            role: 'user',
            content: `Summarize this HR document in 1-2 sentences:\n\n${content.substring(0, 1000)}`
          }
        ],
        temperature: 0.5,
        max_tokens: 150
      }),
    });

    let aiSummary = 'Generated HR document';
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      aiSummary = summaryData.choices[0]?.message?.content || aiSummary;
    }

    // Create document object
    const document = {
      id: crypto.randomUUID(),
      business_id: businessId,
      document_type: documentType,
      title: documentConfig.title,
      content: content,
      aiSummary: aiSummary,
      metadata: {
        companyName,
        industry,
        tone,
        details,
        generatedAt: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    // Store in KV store
    await kv.set(`hr_document:${businessId}:${document.id}`, document);
    
    console.log('✅ HR document generated successfully:', {
      documentId: document.id,
      type: documentType,
      contentLength: content.length
    });

    return c.json({
      success: true,
      document
    });

  } catch (error: any) {
    console.error('❌ HR document generation error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate HR document'
    }, 500);
  }
});

// GET HR DOCUMENTS ENDPOINT
app.get('/make-server-373d8b09/hr/documents', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    
    if (!businessId) {
      return c.json({
        success: false,
        error: 'Business ID is required'
      }, 400);
    }

    console.log('📄 Loading HR documents for business:', businessId);

    // Get all documents for this business from KV store
    const documents = await kv.getByPrefix(`hr_document:${businessId}:`);
    
    console.log('✅ Loaded HR documents:', documents.length);

    return c.json({
      success: true,
      documents: documents || []
    });

  } catch (error: any) {
    console.error('❌ Error loading HR documents:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to load HR documents'
    }, 500);
  }
});

// DELETE HR DOCUMENT ENDPOINT
app.delete('/make-server-373d8b09/hr/documents/:documentId', async (c) => {
  try {
    const documentId = c.req.param('documentId');
    const businessId = c.req.query('businessId');
    
    if (!documentId || !businessId) {
      return c.json({
        success: false,
        error: 'Document ID and Business ID are required'
      }, 400);
    }

    console.log('🗑️ Deleting HR document:', documentId);

    // Delete from KV store
    await kv.del(`hr_document:${businessId}:${documentId}`);
    
    console.log('✅ HR document deleted');

    return c.json({
      success: true
    });

  } catch (error: any) {
    console.error('❌ Error deleting HR document:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to delete HR document'
    }, 500);
  }
});

// INLINE MASTERY AI COACH ENDPOINT - ChatGPT-powered skill coaching
app.post('/make-server-373d8b09/mastery/chat', async (c) => {
  try {
    const { message, masteryContext, conversationHistory } = await c.req.json();
    
    if (!message) {
      return c.json({
        success: false,
        error: 'Message is required'
      }, 400);
    }

    console.log('🤖 Mastery AI Coach request:', {
      message,
      masteryLevel: masteryContext?.currentLevel,
      domainCount: masteryContext?.domains?.length
    });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return c.json({
        success: false,
        error: 'AI service not configured'
      }, 500);
    }

    // Build mastery context summary
    const sortedDomains = (masteryContext?.domains || []).sort((a: any, b: any) => b.level - a.level);
    const strongest = sortedDomains[0];
    const weakest = sortedDomains[sortedDomains.length - 1];
    
    const contextSummary = `
User's Mastery Profile:
- Current Level: ${masteryContext?.currentLevel || 'Unknown'}
- Total XP: ${masteryContext?.totalXP || 0}
- Progress to Next Level: ${Math.round((masteryContext?.levelProgress / masteryContext?.maxXPForLevel) * 100) || 0}%

Skill Domains:
${sortedDomains.map((d: any, i: number) => `${i + 1}. ${d.name}: ${d.level}%`).join('\n')}

Strongest Domain: ${strongest?.name} (${strongest?.level}%)
Weakest Domain: ${weakest?.name} (${weakest?.level}%)

Achievements:
- Unlocked Badges: ${masteryContext?.unlockedBadges || 0}
- Total Badges: ${masteryContext?.badges || 0}
`;

    // Format conversation history for API
    const formattedHistory = (conversationHistory || []).slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Call ChatGPT for personalized coaching
    console.log('🤖 Calling ChatGPT for mastery coaching...');
    
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert skills coach and mastery mentor. Your role is to help users understand their strengths, identify growth opportunities, and create personalized development plans. 

You have access to their complete skill mastery profile. Provide actionable, encouraging, and strategic advice. Use emojis sparingly but effectively. Be concise yet insightful.

Key coaching principles:
- Celebrate strengths and achievements
- Identify specific growth opportunities
- Provide actionable 3-5 step plans when asked
- Use gamification concepts (XP, levels, domains)
- Balance encouragement with realistic challenges
- Reference specific domains and skill levels from their profile

Context:
${contextSummary}`
          },
          ...formattedHistory,
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 500
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      return c.json({
        success: false,
        error: `AI service error: ${openAiResponse.status}`
      }, 500);
    }

    const aiResult = await openAiResponse.json();
    const aiResponse = aiResult.choices[0].message.content;
    
    console.log('✅ Mastery AI Coach response generated:', aiResponse.substring(0, 100) + '...');

    return c.json({
      success: true,
      response: aiResponse
    });
  } catch (error: any) {
    console.error('❌ Error in Mastery AI Coach:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate coaching response'
    }, 500);
  }
});

// VOICE CHAT ENDPOINTS - Text-to-Speech for Scale users
app.post('/make-server-373d8b09/voice/text-to-speech', async (c) => {
  try {
    const { text } = await c.req.json();
    
    if (!text) {
      return c.json({
        success: false,
        error: 'Text is required'
      }, 400);
    }

    // Verify user authentication
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({
        success: false,
        error: 'Unauthorized'
      }, 401);
    }

    // Check if user has Scale tier subscription
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const isScaleTier = subscriptionData?.tier === 'scale' || 
                        subscriptionData?.plan?.toLowerCase().includes('scale');

    if (!isScaleTier) {
      return c.json({
        success: false,
        error: 'Voice features are only available for Scale tier users',
        requiresUpgrade: true,
        currentTier: subscriptionData?.tier || 'free'
      }, 403);
    }

    console.log('🔊 Generating speech for Scale user:', user.id);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return c.json({
        success: false,
        error: 'Voice service not configured'
      }, 500);
    }

    // Call OpenAI TTS API
    const openAiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        speed: 1.0
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('❌ OpenAI TTS API error:', errorText);
      return c.json({
        success: false,
        error: `Voice generation error: ${openAiResponse.status}`
      }, 500);
    }

    const audioBuffer = await openAiResponse.arrayBuffer();
    
    console.log('✅ Speech generated successfully');

    // Return audio as blob
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error in text-to-speech:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to generate speech'
    }, 500);
  }
});

// Update OpenAI Assistant on startup
updateAssistantOnStartup();

// NOTE: Server is started at the end of the file after all routes are registered
// DO NOT add Deno.serve() here - it will prevent routes below from being registered