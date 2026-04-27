import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

// Helper to verify admin access
async function verifyAdminAccess(verifyUserAccess: Function, accessToken: string) {
  try {
    const user = await verifyUserAccess(accessToken);
    
    // Check if user is admin by email first (faster check)
    const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
    if (adminEmails.includes(user.email)) {
      console.log(`✅ Admin access granted for ${user.email} (by email)`);
      return user;
    }
    
    // Get user data to check role (with error handling)
    try {
      const userData = await kv.get(`user:${user.id}`);
      
      // Check if user is admin
      const isAdmin = userData?.role === 'admin';
      
      if (!isAdmin) {
        console.log(`❌ Admin access denied for ${user.email} (role: ${userData?.role || 'none'})`);
        throw new Error('Admin access required');
      }
      
      console.log(`✅ Admin access granted for ${user.email} (by role)`);
      return user;
    } catch (kvError) {
      console.error('KV Store error during admin verification:', kvError);
      
      // If KV store fails and user has admin email, allow access
      if (adminEmails.includes(user.email)) {
        console.log(`✅ Admin access granted for ${user.email} (fallback to email check due to KV error)`);
        return user;
      }
      
      // Otherwise deny access
      console.log(`❌ Admin access denied for ${user.email} (KV error and not admin email)`);
      throw new Error('Admin access verification failed');
    }
  } catch (error) {
    console.error('Admin access verification error:', error);
    throw error;
  }
}

export function addAdminEndpoints(app: Hono, verifyUserAccess: Function) {
  console.log('🔧 Adding admin endpoints...');
  console.log('🔧 Registering bulk endpoints: bulk-deactivate, bulk-activate, bulk-delete, bulk-role-update');
  console.log('🔧 Admin endpoints will use table: kv_store_373d8b09');

  // Get all users (admin only) - CORRECTLY fetch from Supabase Auth
  app.get('/make-server-373d8b09/admin/users', async (c) => {
    console.log('🔧 Admin: Get users endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Create Supabase admin client to list all users
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      console.log('🔧 Admin: Fetching users from Supabase Auth...');
      
      // Get all users from Supabase Auth with pagination
      let allAuthUsers: any[] = [];
      let page = 1;
      const perPage = 1000;
      
      while (true) {
        console.log(`🔧 Admin: Fetching page ${page} with perPage=${perPage}...`);
        
        const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage
        });
        
        if (authError) {
          console.error('❌ Admin: Error fetching users from Supabase Auth:', authError);
          return new Response(`Error fetching users: ${authError.message}`, { status: 500 });
        }
        
        const authUsers = data?.users || [];
        allAuthUsers = allAuthUsers.concat(authUsers);
        console.log(`🔧 Admin: Page ${page} returned ${authUsers.length} users, total so far: ${allAuthUsers.length}`);
        
        // If we got less than perPage, we've reached the end
        if (authUsers.length < perPage) {
          console.log(`🔧 Admin: Reached end of users (got ${authUsers.length} < ${perPage})`);
          break;
        }
        page++;
      }

      console.log(`✅ Admin: Found ${allAuthUsers.length} total users from Supabase Auth`);
      console.log(`🔧 Admin: Sample of user auth data:`, allAuthUsers.slice(0, 3).map(u => ({ 
        email: u.email, 
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at 
      })));

      // Enrich with data from KV store if available
      const users = await Promise.all(allAuthUsers.map(async (authUser) => {
        // Try to get additional data from KV store
        const kvData = await kv.get(`user:${authUser.id}`).catch(() => null);
        
        // Get user's businesses count
        const businesses = await kv.getByPrefix(`business:${authUser.id}:`).catch(() => []);
        
        // Get subscription data
        const subscription = await kv.get(`subscription:${authUser.id}`).catch(() => null);

        // Debug: Log first few users
        if (allAuthUsers.indexOf(authUser) < 3) {
          console.log(`📊 User data for ${authUser.email}:`, {
            id: authUser.id,
            auth_last_sign_in_at: authUser.last_sign_in_at,
            kv_last_login: kvData?.last_login,
            will_use: kvData?.last_login || authUser.last_sign_in_at
          });
        }

        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || kvData?.name || 'Unknown',
          role: kvData?.role || (authUser.email === 'tylerg@cofounderplus.com' || authUser.email === 'admin@cofounderplus.com' ? 'admin' : 'user'),
          created_at: authUser.created_at,
          last_activity: authUser.last_sign_in_at || kvData?.last_activity || authUser.created_at,
          is_active: kvData?.is_active !== false,
          // IMPORTANT: Prioritize authUser.last_sign_in_at from Supabase Auth if kvData.last_login is null
          last_login: kvData?.last_login || authUser.last_sign_in_at || null,
          login_count_this_month: kvData?.login_count_this_month || 0,
          business_info: businesses.length > 0 ? {
            business_name: businesses[0]?.name,
            industry: businesses[0]?.industry,
            total_businesses: businesses.length
          } : null,
          billing_info: subscription ? {
            plan_type: subscription.plan || 'free',
            monthly_amount: subscription.amount || 0,
            subscription_status: subscription.status || 'free',
            next_billing_date: subscription.current_period_end,
            is_past_due: subscription.status === 'past_due'
          } : null
        };
      }));

      console.log(`Admin: Returning ${users.length} enriched users`);
      console.log(`Admin: First user last_login:`, users[0]?.last_login);
      return c.json({ users });

    } catch (error) {
      console.error('Admin get users error:', error);
      return new Response(`Error getting users: ${error.message}`, { status: 500 });
    }
  });

  // Get specific user details (admin only)
  app.get('/make-server-373d8b09/admin/users/:userId', async (c) => {
    console.log('Admin: Get user details endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const userData = await kv.get(`user:${userId}`);
      
      if (!userData) {
        return new Response('User not found', { status: 404 });
      }

      // Get user's businesses
      const userBusinesses = await kv.getByPrefix(`business:${userId}:`);
      
      // Get user's recent activity (notes, transactions, etc.)
      const recentNotes = await kv.getByPrefix(`notes_board:${userId}:`);
      const recentTransactions = [];
      
      // Get transactions from all user businesses
      for (const business of userBusinesses) {
        const businessTransactions = await kv.getByPrefix(`transaction:${business.id}:`);
        recentTransactions.push(...businessTransactions);
      }

      const userDetails = {
        ...userData,
        businesses: userBusinesses.map(b => ({ id: b.id, name: b.name, industry: b.industry })),
        stats: {
          totalBusinesses: userBusinesses.length,
          totalNotes: recentNotes.length,
          totalTransactions: recentTransactions.length,
          lastActivity: userData.last_activity || userData.updated_at
        }
      };

      return c.json({ user: userDetails });

    } catch (error) {
      console.error('Admin get user details error:', error);
      return new Response(`Error getting user details: ${error.message}`, { status: 500 });
    }
  });

  // Get admin notifications
  app.get('/make-server-373d8b09/admin/notifications', async (c) => {
    console.log('Admin: Get notifications endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Get admin notifications from KV store
      const notifications = await kv.getByPrefix('admin_notification:');
      
      // Sort by creation date (newest first)
      const sortedNotifications = notifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log(`Admin: Found ${notifications.length} notifications`);
      return c.json({ notifications: sortedNotifications });

    } catch (error) {
      console.error('Admin get notifications error:', error);
      return c.json({ error: `Error getting notifications: ${error?.message || error}`, notifications: [] }, 500);
    }
  });

  // Get all subscriptions (admin only)
  app.get('/make-server-373d8b09/admin/subscriptions', async (c) => {
    console.log('Admin: Get subscriptions endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Get all subscriptions from KV store
      const allSubscriptions = await kv.getByPrefix('subscription:');
      
      console.log(`Admin: Found ${allSubscriptions.length} subscriptions`);
      return c.json({ subscriptions: allSubscriptions });

    } catch (error) {
      console.error('Admin get subscriptions error:', error);
      return new Response(`Error getting subscriptions: ${error.message}`, { status: 500 });
    }
  });

  // Update user status (activate/deactivate) (admin only)
  app.patch('/make-server-373d8b09/admin/users/:userId/status', async (c) => {
    console.log('Admin: Update user status endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { is_active, admin_email } = await c.req.json();

      // Get existing user data from KV store or create new entry
      const userData = await kv.get(`user:${userId}`).catch(() => null);
      
      // Update user status
      const updatedUser = {
        ...(userData || {}),
        id: userId,
        is_active: is_active,
        updated_at: new Date().toISOString(),
        updated_by: admin_email
      };

      await kv.set(`user:${userId}`, updatedUser);

      console.log(`Admin: User ${userId} status updated to ${is_active ? 'active' : 'deactivated'} by ${admin_email}`);
      return c.json({ 
        success: true, 
        user: updatedUser,
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error) {
      console.error('Admin update user status error:', error);
      return new Response(`Error updating user status: ${error.message}`, { status: 500 });
    }
  });

  // Get all support tickets (admin only)
  app.get('/make-server-373d8b09/support/admin/all', async (c) => {
    console.log('🎫 ADMIN GET TICKETS: Endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      console.log('🎫 ADMIN GET TICKETS: Access token present:', !!accessToken);
      
      await verifyAdminAccess(verifyUserAccess, accessToken);
      console.log('🎫 ADMIN GET TICKETS: Admin access verified');

      // Get all support tickets from KV store (stored as a single array)
      const adminTicketsKey = 'admin:support_tickets';
      console.log('🎫 ADMIN GET TICKETS: Fetching from key:', adminTicketsKey);
      
      const allTickets = await kv.get(adminTicketsKey) || [];
      console.log('🎫 ADMIN GET TICKETS: Raw data from KV:', allTickets);
      console.log('🎫 ADMIN GET TICKETS: Is array?', Array.isArray(allTickets));
      console.log('🎫 ADMIN GET TICKETS: Count:', Array.isArray(allTickets) ? allTickets.length : 'N/A');
      
      // Ensure it's an array
      const ticketsArray = Array.isArray(allTickets) ? allTickets : [];
      
      if (ticketsArray.length > 0) {
        console.log('🎫 ADMIN GET TICKETS: Sample ticket:', ticketsArray[0]);
      }
      
      // Calculate stats
      const stats = {
        total: ticketsArray.length,
        open: ticketsArray.filter(t => t.status === 'open').length,
        'in-progress': ticketsArray.filter(t => t.status === 'in-progress').length,
        'waiting-for-user': ticketsArray.filter(t => t.status === 'waiting-for-user').length,
        resolved: ticketsArray.filter(t => t.status === 'resolved').length,
        closed: ticketsArray.filter(t => t.status === 'closed').length
      };

      console.log('🎫 ADMIN GET TICKETS: Stats:', stats);
      console.log('🎫 ADMIN GET TICKETS: Returning', ticketsArray.length, 'tickets');
      
      return c.json({ 
        tickets: ticketsArray,
        stats 
      });

    } catch (error) {
      console.error('🎫 ADMIN GET TICKETS: Error:', error);
      return c.json({ error: `Error getting support tickets: ${error?.message || error}`, tickets: [], stats: { total: 0, open: 0, 'in-progress': 0, 'waiting-for-user': 0, resolved: 0, closed: 0 } }, 500);
    }
  });

  // Track user login (called automatically on user sign in) - CORRECT ENDPOINT
  app.post('/make-server-373d8b09/track-login', async (c) => {
    console.log('Track login endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      // Get existing user data or create new entry
      const userData = await kv.get(`user:${user.id}`).catch(() => null);

      // Get current month/year for tracking
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Check if we need to reset the counter (new month)
      const lastTrackedMonth = userData?.login_tracking_month || '';
      const loginCountThisMonth = (lastTrackedMonth === currentMonth) 
        ? (userData?.login_count_this_month || 0) + 1 
        : 1; // Reset to 1 if new month

      // Update user data with login tracking
      const updatedUser = {
        ...(userData || { id: user.id, email: user.email, name: user.user_metadata?.name || 'Unknown' }),
        last_login: now.toISOString(),
        login_count_this_month: loginCountThisMonth,
        login_tracking_month: currentMonth,
        updated_at: now.toISOString()
      };

      await kv.set(`user:${user.id}`, updatedUser);

      console.log(`✅ Login tracked for user ${user.email}: ${loginCountThisMonth} logins this month`);
      return c.json({ 
        success: true, 
        login_count_this_month: loginCountThisMonth,
        last_login: updatedUser.last_login
      });

    } catch (error) {
      console.error('Track login error:', error);
      // Don't fail the request - just log the error
      return c.json({ success: false, error: error?.message || 'Failed to track login' }, 200);
    }
  });

  // Bulk user operations (admin only)
  
  // Bulk deactivate users
  app.post('/make-server-373d8b09/admin/users/bulk-deactivate', async (c) => {
    console.log('Admin: Bulk deactivate users endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const { userIds } = await c.req.json();
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return new Response('User IDs array is required', { status: 400 });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          const userData = await kv.get(`user:${userId}`);
          
          if (!userData) {
            results.push({ userId, success: false, error: 'User not found' });
            continue;
          }

          // Don't deactivate admin users
          if (userData.role === 'admin') {
            results.push({ userId, success: false, error: 'Cannot deactivate admin users' });
            continue;
          }

          const updatedUser = {
            ...userData,
            is_active: false,
            deactivated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await kv.set(`user:${userId}`, updatedUser);
          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`Admin: Bulk deactivated ${successCount}/${userIds.length} users`);
      return c.json({ results, successCount, totalCount: userIds.length });

    } catch (error) {
      console.error('Admin bulk deactivate error:', error);
      return new Response(`Error bulk deactivating users: ${error.message}`, { status: 500 });
    }
  });

  // Bulk activate users
  app.post('/make-server-373d8b09/admin/users/bulk-activate', async (c) => {
    console.log('Admin: Bulk activate users endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const { userIds } = await c.req.json();
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return new Response('User IDs array is required', { status: 400 });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          const userData = await kv.get(`user:${userId}`);
          
          if (!userData) {
            results.push({ userId, success: false, error: 'User not found' });
            continue;
          }

          const updatedUser = {
            ...userData,
            is_active: true,
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          await kv.set(`user:${userId}`, updatedUser);
          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`Admin: Bulk activated ${successCount}/${userIds.length} users`);
      return c.json({ results, successCount, totalCount: userIds.length });

    } catch (error) {
      console.error('Admin bulk activate error:', error);
      return new Response(`Error bulk activating users: ${error.message}`, { status: 500 });
    }
  });

  // Bulk delete users
  app.post('/make-server-373d8b09/admin/users/bulk-delete', async (c) => {
    console.log('Admin: Bulk delete users endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const { userIds } = await c.req.json();
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return new Response('User IDs array is required', { status: 400 });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          const userData = await kv.get(`user:${userId}`);
          
          if (!userData) {
            results.push({ userId, success: false, error: 'User not found' });
            continue;
          }

          // Don't delete admin users
          if (userData.role === 'admin') {
            results.push({ userId, success: false, error: 'Cannot delete admin users' });
            continue;
          }

          // Delete user data
          await kv.del(`user:${userId}`);
          
          // Also delete related data
          const businesses = await kv.getByPrefix(`business:${userId}:`);
          for (const business of businesses) {
            await kv.del(`business:${userId}:${business.id}`);
          }

          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`Admin: Bulk deleted ${successCount}/${userIds.length} users`);
      return c.json({ results, successCount, totalCount: userIds.length });

    } catch (error) {
      console.error('Admin bulk delete error:', error);
      return new Response(`Error bulk deleting users: ${error.message}`, { status: 500 });
    }
  });

  // Bulk update user roles
  app.post('/make-server-373d8b09/admin/users/bulk-role-update', async (c) => {
    console.log('Admin: Bulk role update endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const { userIds, role } = await c.req.json();
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return new Response('User IDs array is required', { status: 400 });
      }

      if (!role || !['user', 'admin'].includes(role)) {
        return new Response('Valid role is required (user or admin)', { status: 400 });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          const userData = await kv.get(`user:${userId}`);
          
          if (!userData) {
            results.push({ userId, success: false, error: 'User not found' });
            continue;
          }

          const updatedUser = {
            ...userData,
            role,
            updated_at: new Date().toISOString()
          };

          await kv.set(`user:${userId}`, updatedUser);
          results.push({ userId, success: true });
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`Admin: Bulk updated role to ${role} for ${successCount}/${userIds.length} users`);
      return c.json({ results, successCount, totalCount: userIds.length });

    } catch (error) {
      console.error('Admin bulk role update error:', error);
      return new Response(`Error bulk updating user roles: ${error.message}`, { status: 500 });
    }
  });

  // Clear all business industries (set to null)
  app.post('/make-server-373d8b09/admin/businesses/clear-industries', async (c) => {
    console.log('Admin: Clear all business industries endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Get all businesses from all users
      const allUsers = await kv.getByPrefix('user:');
      let totalUpdated = 0;
      let totalBusinesses = 0;

      for (const userData of allUsers) {
        const userId = userData.id;
        const businesses = await kv.getByPrefix(`business:${userId}:`);
        
        for (const business of businesses) {
          totalBusinesses++;
          
          // Remove industry field by setting it to null
          const updatedBusiness = {
            ...business,
            industry: null,
            updated_at: new Date().toISOString()
          };

          await kv.set(`business:${userId}:${business.id}`, updatedBusiness);
          totalUpdated++;
        }
      }

      console.log(`Admin: Cleared industries for ${totalUpdated}/${totalBusinesses} businesses`);
      return c.json({ 
        success: true,
        message: `Successfully cleared industries for ${totalUpdated} businesses`,
        totalUpdated,
        totalBusinesses
      });

    } catch (error) {
      console.error('Admin clear industries error:', error);
      return new Response(`Error clearing industries: ${error.message}`, { status: 500 });
    }
  });

  // Admin impersonation endpoint - generates a session token for a specific user
  app.post('/make-server-373d8b09/admin/impersonate/:userId', async (c) => {
    console.log('🔧 Admin: Impersonate user endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const adminUser = await verifyAdminAccess(verifyUserAccess, accessToken);
      const targetUserId = c.req.param('userId');

      console.log(`🔧 Admin ${adminUser.email} attempting to impersonate user ${targetUserId}`);

      // Create Supabase admin client
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Get the target user's information
      const { data: targetUserData, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      
      if (userError || !targetUserData) {
        console.error('❌ Admin: Target user not found:', userError);
        return new Response('User not found', { status: 404 });
      }

      // Generate a new session for the target user
      // We'll return the user's existing session or create a new access token
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: targetUserData.user.email!,
      });

      if (sessionError) {
        console.error('❌ Admin: Error generating session:', sessionError);
        return new Response(`Error generating session: ${sessionError.message}`, { status: 500 });
      }

      console.log(`✅ Admin: Generated impersonation data for ${targetUserData.user.email}`);

      return c.json({
        success: true,
        impersonatedUser: {
          id: targetUserData.user.id,
          email: targetUserData.user.email,
          user_metadata: targetUserData.user.user_metadata,
        },
        // Return admin info to store for later restoration
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
        },
        authLink: sessionData.properties.action_link, // This contains the token
      });

    } catch (error) {
      console.error('❌ Admin impersonation error:', error);
      return new Response(`Error impersonating user: ${error.message}`, { status: 500 });
    }
  });

  console.log('✅ Admin endpoints added successfully');
}