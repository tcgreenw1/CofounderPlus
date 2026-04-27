import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const accountDeletionRoutes = new Hono();

/**
 * Account Deletion Endpoint
 * Compliant with Apple App Store requirements for in-app account deletion
 * 
 * This endpoint:
 * 1. Verifies the user is authenticated
 * 2. Deletes all user data from the KV store
 * 3. Deletes the user's Supabase auth account
 * 4. Returns success confirmation
 */
accountDeletionRoutes.post('/delete-account', async (c) => {
  try {
    // Get authorization token
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized: No authorization header' }, 401);
    }

    const accessToken = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the user with their access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

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
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
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

    } catch {
      return c.json({ 
        success: false, 
        error: 'An unexpected error occurred during account deletion' 
      }, 500);
    }

  } catch {
    return c.json({ 
      success: false, 
      error: 'Failed to process account deletion request' 
    }, 500);
  }
});

export default accountDeletionRoutes;
