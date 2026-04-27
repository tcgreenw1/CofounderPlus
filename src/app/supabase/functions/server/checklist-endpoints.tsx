/**
 * Getting Started Checklist Endpoints
 * Handles checklist status, auto-detection, and manual toggles
 * Version: 1.0
 */

import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const checklistRouter = new Hono();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Helper: Verify user authentication
 */
async function verifyUser(authHeader: string | undefined) {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Check if token is the anon key (simple string check)
  if (token === SUPABASE_ANON_KEY) {
    throw new Error('Authentication failed: Anonymous access not allowed');
  }
  
  // Use ANON_KEY for user token validation - pass token in headers
  const authClient = createClient(
    SUPABASE_URL ?? '', 
    SUPABASE_ANON_KEY ?? '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
  
  // Get user from Supabase Auth
  const { data: { user }, error } = await authClient.auth.getUser();

  if (error || !user) {
    console.warn('⚠️ verifyUser: Supabase getUser failed, falling back to JWT decode:', error?.message);
    
    // Fallback: Manual JWT Verification
    try {
      // Simple JWT decode
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const payloadStr = parts[1];
      const paddedPayload = payloadStr + '='.repeat((4 - payloadStr.length % 4) % 4);
      const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);
      const payload = JSON.parse(jsonPayload);
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token has expired');
      }
      
      // Check role
      if (payload.role === 'anon') {
         throw new Error('Anonymous token provided');
      }
      
      // Construct user object from payload
      const userId = payload.sub || payload.user_id;
      if (!userId) {
        throw new Error('No user ID found in token');
      }
      
      console.log('✅ verifyUser: Successfully verified via JWT fallback:', userId);
      
      return {
        id: userId,
        email: payload.email,
        user_metadata: payload.user_metadata || {},
        role: payload.role,
        aud: payload.aud
      };
    } catch (e) {
      console.error('❌ Auth error:', error?.message || 'No user found', 'Fallback error:', e.message);
      throw new Error('Authentication failed');
    }
  }

  return user;
}

/**
 * GET /checklist/status
 * Get checklist completion status with auto-detection
 */
checklistRouter.get('/checklist/status', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    
    console.log('📋 Getting checklist status for user:', user.id);
    
    // Check if checklist is permanently dismissed
    const dismissedKey = `checklist_dismissed:${user.id}`;
    const isDismissed = await kv.get(dismissedKey);
    
    if (isDismissed) {
      return c.json({
        success: true,
        dismissed: true,
        profile: true,
        business: true,
        goal: true,
        finance: true,
        cofounder: true,
        subscription: true,
      });
    }
    
    // Get manual overrides (user-toggled completions)
    const manualTogglesKey = `checklist_manual:${user.id}`;
    const manualToggles = await kv.get(manualTogglesKey) || {};
    
    // Auto-detect completions
    const status = {
      profile: await checkProfileComplete(user),
      business: await checkBusinessCreated(user),
      goal: await checkGoalSet(user),
      roadmap: await checkRoadmapStarted(user),
      finance: await checkFinanceAdded(user),
      integration: await checkIntegrationConnected(user),
      note: await checkNoteCreated(user),
      cofounder: await checkCofounderChatted(user),
      subscription: await checkSubscriptionActive(user),
    };
    
    // Override with manual toggles
    const finalStatus = {
      ...status,
      ...manualToggles,
    };
    
    console.log('📋 Checklist status:', finalStatus);
    
    return c.json({
      success: true,
      dismissed: false,
      ...finalStatus,
    });
    
  } catch (error: any) {
    console.error('❌ Error getting checklist status:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get checklist status'
    }, 500);
  }
});

/**
 * POST /checklist/toggle
 * Manually toggle a checklist item
 */
checklistRouter.post('/checklist/toggle', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    const { taskId } = await c.req.json();
    
    if (!taskId) {
      return c.json({ success: false, error: 'Task ID is required' }, 400);
    }
    
    console.log('📋 Toggling task:', taskId, 'for user:', user.id);
    
    // Get current manual toggles
    const manualTogglesKey = `checklist_manual:${user.id}`;
    const manualToggles = await kv.get(manualTogglesKey) || {};
    
    // Toggle the task
    const currentValue = manualToggles[taskId];
    manualToggles[taskId] = !currentValue;
    
    // Save back to KV
    await kv.set(manualTogglesKey, manualToggles);
    
    console.log('✅ Task toggled:', taskId, '→', manualToggles[taskId]);
    
    return c.json({
      success: true,
      taskId,
      completed: manualToggles[taskId],
    });
    
  } catch (error: any) {
    console.error('❌ Error toggling checklist task:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to toggle task'
    }, 500);
  }
});

/**
 * POST /checklist/dismiss
 * Permanently dismiss the checklist
 */
checklistRouter.post('/checklist/dismiss', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    
    console.log('📋 Dismissing checklist for user:', user.id);
    
    const dismissedKey = `checklist_dismissed:${user.id}`;
    await kv.set(dismissedKey, true);
    
    console.log('✅ Checklist dismissed');
    
    return c.json({
      success: true,
      message: 'Checklist permanently dismissed',
    });
    
  } catch (error: any) {
    console.error('❌ Error dismissing checklist:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to dismiss checklist'
    }, 500);
  }
});

/**
 * POST /checklist/reset
 * Clear manual overrides and re-detect all tasks
 */
checklistRouter.post('/checklist/reset', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    
    console.log('🔄 Resetting checklist manual overrides for user:', user.id);
    
    // Clear manual toggles so auto-detection can work fresh
    const manualTogglesKey = `checklist_manual:${user.id}`;
    await kv.del(manualTogglesKey);
    
    console.log('✅ Manual overrides cleared, checklist will now auto-detect all tasks');
    
    return c.json({
      success: true,
      message: 'Checklist reset - all tasks will be auto-detected',
    });
    
  } catch (error: any) {
    console.error('❌ Error resetting checklist:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to reset checklist'
    }, 500);
  }
});

// ====================
// AUTO-DETECTION HELPERS
// ====================

/**
 * Check if user profile is complete
 */
async function checkProfileComplete(user: any): Promise<boolean> {
  try {
    // Check if user has name in metadata
    const hasName = !!(user.user_metadata?.name || user.user_metadata?.full_name);
    
    // Check if user has phone number
    const hasPhone = !!user.phone;
    
    // Consider profile complete if they have at least a name
    return hasName;
  } catch (error) {
    console.error('Error checking profile:', error);
    return false;
  }
}

/**
 * Check if user has created a business
 */
async function checkBusinessCreated(user: any): Promise<boolean> {
  try {
    // Check KV store for businesses
    const businessesKey = `businesses:${user.id}`;
    const businesses = await kv.get(businessesKey);
    
    console.log('📋 Checking business for user:', user.id);
    console.log('📋 Businesses found:', businesses);
    
    if (Array.isArray(businesses) && businesses.length > 0) {
      // Filter out sample/demo businesses
      const realBusinesses = businesses.filter((b: any) => 
        !b.id?.includes('sample') && 
        !b.id?.includes('demo') &&
        b.name !== 'Sample Business'
      );
      
      console.log('📋 Real businesses (after filtering):', realBusinesses.length);
      return realBusinesses.length > 0;
    }
    
    console.log('📋 No businesses found');
    return false;
  } catch (error) {
    console.error('Error checking business:', error);
    return false;
  }
}

/**
 * Check if user has set a #1 goal
 */
async function checkGoalSet(user: any): Promise<boolean> {
  try {
    // Check for number one goal in dream board
    const goalKey = `number_one_goal:${user.id}`;
    const goal = await kv.get(goalKey);
    
    return !!goal;
  } catch (error) {
    console.error('Error checking goal:', error);
    return false;
  }
}

/**
 * Check if user has added a transaction
 */
async function checkFinanceAdded(user: any): Promise<boolean> {
  try {
    // Get all user businesses
    const businessesKey = `businesses:${user.id}`;
    const businesses = await kv.get(businessesKey);
    
    if (!Array.isArray(businesses)) {
      return false;
    }
    
    // Check if any business has transactions
    for (const business of businesses) {
      const transactionsKey = `transactions:${business.id}`;
      const transactions = await kv.get(transactionsKey);
      
      if (Array.isArray(transactions) && transactions.length > 0) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking finance:', error);
    return false;
  }
}

/**
 * Check if user has chatted with AI Cofounder
 */
async function checkCofounderChatted(user: any): Promise<boolean> {
  try {
    // Check for chat messages/conversations
    const conversationsKey = `conversations:${user.id}`;
    const conversations = await kv.get(conversationsKey);
    
    if (Array.isArray(conversations) && conversations.length > 0) {
      return true;
    }
    
    // Alternative: Check for any AI chat history
    const chatHistoryKey = `chat_history:${user.id}`;
    const chatHistory = await kv.get(chatHistoryKey);
    
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking cofounder chat:', error);
    return false;
  }
}

/**
 * Check if user has started roadmap
 */
async function checkRoadmapStarted(user: any): Promise<boolean> {
  try {
    // Check for roadmap data in KV
    const roadmapKey = `roadmap:${user.id}`;
    const roadmap = await kv.get(roadmapKey);
    
    if (roadmap) {
      return true;
    }
    
    // Check if user has any roadmap items
    const roadmapItemsKey = `roadmap_items:${user.id}`;
    const roadmapItems = await kv.get(roadmapItemsKey);
    
    if (Array.isArray(roadmapItems) && roadmapItems.length > 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking roadmap:', error);
    return false;
  }
}

/**
 * Check if user has connected an integration
 */
async function checkIntegrationConnected(user: any): Promise<boolean> {
  try {
    // Check for integrations in KV
    const integrationsKey = `integrations:${user.id}`;
    const integrations = await kv.get(integrationsKey);
    
    if (Array.isArray(integrations) && integrations.length > 0) {
      // Check if any integration is actually connected
      const connectedIntegrations = integrations.filter((i: any) => i.connected || i.enabled);
      return connectedIntegrations.length > 0;
    }
    
    // Alternative: Check for OAuth connections
    const oauthKey = `oauth_connections:${user.id}`;
    const oauthConnections = await kv.get(oauthKey);
    
    if (Array.isArray(oauthConnections) && oauthConnections.length > 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking integration:', error);
    return false;
  }
}

/**
 * Check if user has created a note
 */
async function checkNoteCreated(user: any): Promise<boolean> {
  try {
    // Get all user businesses to check for notes
    const businessesKey = `businesses:${user.id}`;
    const businesses = await kv.get(businessesKey);
    
    if (!Array.isArray(businesses)) {
      return false;
    }
    
    // Check if any business has notes/boards
    for (const business of businesses) {
      const boardsKey = `notes_boards:${business.id}`;
      const boards = await kv.get(boardsKey);
      
      if (Array.isArray(boards) && boards.length > 0) {
        // Check if any board has actual cards (not just empty boards)
        for (const board of boards) {
          if (board.lists && Array.isArray(board.lists)) {
            for (const list of board.lists) {
              if (list.cards && Array.isArray(list.cards) && list.cards.length > 0) {
                return true;
              }
            }
          }
        }
      }
    }
    
    // Alternative: Check user-level notes
    const notesKey = `notes:${user.id}`;
    const notes = await kv.get(notesKey);
    
    if (Array.isArray(notes) && notes.length > 0) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking note:', error);
    return false;
  }
}

/**
 * Check if user has an active subscription
 */
async function checkSubscriptionActive(user: any): Promise<boolean> {
  try {
    // Check subscription status in KV
    const subscriptionKey = `subscription:${user.id}`;
    const subscription = await kv.get(subscriptionKey);
    
    if (subscription) {
      // Check if subscription is active
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        return true;
      }
    }
    
    // Alternative: Check user metadata for subscription info
    if (user.user_metadata?.subscription_tier) {
      const tier = user.user_metadata.subscription_tier;
      return tier === 'creator' || tier === 'builder' || tier === 'pro';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

export default checklistRouter;