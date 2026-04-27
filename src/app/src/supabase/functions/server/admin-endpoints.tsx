import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import * as kvSafe from './kv-helpers.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

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

  // Get all users (admin only)
  app.get('/make-server-ac1075a9/admin/users', async (c) => {
    console.log('Admin: Get users endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Create Supabase admin client to list all users
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Get all users from Supabase Auth (with pagination to get ALL users)
      let allAuthUsers: any[] = [];
      let page = 1;
      const perPage = 1000;
      
      while (true) {
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage
        });
        
        if (authError) {
          console.error('Error fetching users from Supabase Auth:', authError);
          return new Response(`Error fetching users: ${authError.message}`, { status: 500 });
        }
        
        allAuthUsers = allAuthUsers.concat(authUsers);
        console.log(`Admin: Fetched page ${page}, got ${authUsers.length} users, total so far: ${allAuthUsers.length}`);
        
        // If we got less than perPage, we've reached the end
        if (authUsers.length < perPage) {
          break;
        }
        page++;
      }

      console.log(`Admin: Found ${allAuthUsers.length} total users from Supabase Auth`);
      console.log(`Admin: Sample of user dates:`, allAuthUsers.slice(0, 5).map(u => ({ 
        email: u.email, 
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at 
      })));

      // Enrich with data from KV store if available
      const users = await Promise.all(allAuthUsers.map(async (authUser) => {
        // Try to get additional data from KV store (use safe wrappers to avoid timeouts)
        const kvData = await kvSafe.safeGet(`user:${authUser.id}`, null);
        
        // Get user's businesses count
        const businesses = await kvSafe.safeGetByPrefix(`business:${authUser.id}:`, []);
        
        // Get subscription data
        const subscription = await kvSafe.getSubscription(authUser.id);

        // Debug: Log auth user data to verify last_sign_in_at is present
        if (allAuthUsers.indexOf(authUser) < 3) {
          console.log(`📊 Auth user sample data for ${authUser.email}:`, {
            id: authUser.id,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            kvData_last_login: kvData?.last_login
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
          last_login: kvData?.last_login || authUser.last_sign_in_at,
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
            next_billing_date: subscription.current_period_end || null,
            is_past_due: subscription.status === 'past_due'
          } : {
            plan_type: 'free',
            monthly_amount: 0,
            subscription_status: 'free',
            next_billing_date: null,
            is_past_due: false
          }
        };
      }));

      console.log(`Admin: Returning ${users.length} enriched users`);
      console.log(`📊 First user last_login value:`, users[0]?.last_login);
      return c.json({ users });

    } catch (error) {
      console.error('Admin get users error:', error);
      return new Response(`Error getting users: ${error.message}`, { status: 500 });
    }
  });

  // Get specific user details (admin only)
  app.get('/make-server-ac1075a9/admin/users/:userId', async (c) => {
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
  app.get('/make-server-ac1075a9/admin/notifications', async (c) => {
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
      return new Response(`Error getting notifications: ${error.message}`, { status: 500 });
    }
  });

  // Mark notification as read
  app.put('/make-server-ac1075a9/admin/notifications/:notificationId/read', async (c) => {
    console.log('Admin: Mark notification read endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const notificationId = c.req.param('notificationId');
      const notification = await kv.get(`admin_notification:${notificationId}`);
      
      if (!notification) {
        return new Response('Notification not found', { status: 404 });
      }

      const updatedNotification = {
        ...notification,
        read: true,
        read_at: new Date().toISOString()
      };

      await kv.set(`admin_notification:${notificationId}`, updatedNotification);
      return c.json({ success: true });

    } catch (error) {
      console.error('Admin mark notification read error:', error);
      return new Response(`Error marking notification as read: ${error.message}`, { status: 500 });
    }
  });

  // Send community message
  app.post('/make-server-ac1075a9/admin/community/message', async (c) => {
    console.log('Admin: Send community message endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const adminUser = await verifyAdminAccess(verifyUserAccess, accessToken);

      const { title, content, type } = await c.req.json();
      
      if (!title || !content) {
        return new Response('Title and content are required', { status: 400 });
      }

      const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message = {
        id: messageId,
        title: title.trim(),
        content: content.trim(),
        type: type || 'announcement',
        author: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.user_metadata?.name || 'Admin'
        },
        created_at: new Date().toISOString(),
        status: 'sent'
      };

      // Store the community message
      await kv.set(`community_message:${messageId}`, message);

      // Create a notification for the admin that the message was sent
      const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: 'community_message_sent',
        title: 'Community Message Sent',
        message: `Your message "${title}" has been sent to the community`,
        data: { messageId, title },
        read: false,
        created_at: new Date().toISOString()
      };

      await kv.set(`admin_notification:${notificationId}`, notification);

      console.log(`Admin: Community message sent - ${title}`);
      return c.json({ message, success: true });

    } catch (error) {
      console.error('Admin send community message error:', error);
      return new Response(`Error sending community message: ${error.message}`, { status: 500 });
    }
  });

  // Get community messages
  app.get('/make-server-ac1075a9/admin/community/messages', async (c) => {
    console.log('Admin: Get community messages endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const messages = await kv.getByPrefix('community_message:');
      
      // Sort by creation date (newest first)
      const sortedMessages = messages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log(`Admin: Found ${messages.length} community messages`);
      return c.json({ messages: sortedMessages });

    } catch (error) {
      console.error('Admin get community messages error:', error);
      return new Response(`Error getting community messages: ${error.message}`, { status: 500 });
    }
  });

  // Reset user password (admin only)
  app.post('/make-server-ac1075a9/admin/users/:userId/reset-password', async (c) => {
    console.log('Admin: Reset password endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { newPassword } = await c.req.json();
      
      if (!newPassword || newPassword.length < 6) {
        return new Response('Password must be at least 6 characters long', { status: 400 });
      }

      // This would typically update the password via Supabase Auth
      // For now, we'll create a notification that password reset was requested
      const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: 'password_reset_requested',
        title: 'Password Reset Requested',
        message: `Password reset requested for user ${userId}`,
        data: { userId },
        read: false,
        created_at: new Date().toISOString()
      };

      await kv.set(`admin_notification:${notificationId}`, notification);

      console.log(`Admin: Password reset requested for user ${userId}`);
      return c.json({ success: true, message: 'Password reset request created' });

    } catch (error) {
      console.error('Admin reset password error:', error);
      return new Response(`Error resetting password: ${error.message}`, { status: 500 });
    }
  });

  // Get platform statistics
  app.get('/make-server-ac1075a9/admin/stats', async (c) => {
    console.log('Admin: Get platform stats endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Get all users
      const allUsers = await kv.getByPrefix('user:');
      
      // Get all businesses
      const allBusinesses = await kv.getByPrefix('business:');
      
      // Get all community messages
      const allMessages = await kv.getByPrefix('community_message:');
      
      // Get all notifications
      const allNotifications = await kv.getByPrefix('admin_notification:');

      const stats = {
        users: {
          total: allUsers.length,
          admins: allUsers.filter(u => u.role === 'admin').length,
          regular: allUsers.filter(u => u.role !== 'admin').length,
          newToday: allUsers.filter(u => {
            const today = new Date().toDateString();
            return new Date(u.created_at).toDateString() === today;
          }).length
        },
        businesses: {
          total: allBusinesses.length,
          newToday: allBusinesses.filter(b => {
            const today = new Date().toDateString();
            return new Date(b.created_at).toDateString() === today;
          }).length
        },
        community: {
          totalMessages: allMessages.length,
          messagesThisWeek: allMessages.filter(m => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(m.created_at) > weekAgo;
          }).length
        },
        notifications: {
          total: allNotifications.length,
          unread: allNotifications.filter(n => !n.read).length
        }
      };

      console.log('Admin: Platform stats generated');
      return c.json({ stats });

    } catch (error) {
      console.error('Admin get stats error:', error);
      return new Response(`Error getting platform stats: ${error.message}`, { status: 500 });
    }
  });

  // Seed notification data (admin only - for development/testing)
  app.post('/make-server-ac1075a9/admin/seed/notification', async (c) => {
    console.log('Admin: Seed notification endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const notificationData = await c.req.json();
      
      // Store the notification
      await kv.set(`admin_notification:${notificationData.id}`, notificationData);
      
      console.log(`Admin: Seeded notification - ${notificationData.title}`);
      return c.json({ success: true, notification: notificationData });

    } catch (error) {
      console.error('Admin seed notification error:', error);
      return new Response(`Error seeding notification: ${error.message}`, { status: 500 });
    }
  });

  // Seed sample users (admin only - for development/testing)
  app.post('/make-server-ac1075a9/admin/seed/users', async (c) => {
    console.log('Admin: Seed users endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const adminUser = await verifyAdminAccess(verifyUserAccess, accessToken);

      const sampleUsers = [
        {
          id: `user-${Date.now()}-1`,
          email: 'john@example.com',
          name: 'John Smith',
          role: 'user',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          business_info: { business_name: 'TechStart Solutions', industry: 'Technology' }
        },
        {
          id: `user-${Date.now()}-2`,
          email: 'sarah@example.com',
          name: 'Sarah Johnson',
          role: 'user',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          last_activity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          business_info: { business_name: 'Creative Marketing Co', industry: 'Marketing' }
        },
        {
          id: `user-${Date.now()}-3`,
          email: 'mike@example.com',
          name: 'Mike Davis',
          role: 'user',
          created_at: new Date().toISOString(), // Today
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          business_info: { business_name: 'Local Eats', industry: 'Food & Beverage' }
        },
        // Include the actual admin user
        {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.user_metadata?.name || adminUser.user_metadata?.full_name || 'Admin',
          role: 'admin',
          created_at: adminUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          business_info: { business_name: 'Cofounder Platform', industry: 'Technology' }
        }
      ];

      // Store the sample users
      for (const user of sampleUsers) {
        await kv.set(`user:${user.id}`, user);
      }
      
      console.log(`Admin: Seeded ${sampleUsers.length} sample users`);
      return c.json({ success: true, users: sampleUsers });

    } catch (error) {
      console.error('Admin seed users error:', error);
      return new Response(`Error seeding users: ${error.message}`, { status: 500 });
    }
  });

  // Seed community message data (admin only - for development/testing)
  app.post('/make-server-ac1075a9/admin/seed/community-message', async (c) => {
    console.log('Admin: Seed community message endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const messageData = await c.req.json();
      
      // Store the community message
      await kv.set(`community_message:${messageData.id}`, messageData);
      
      console.log(`Admin: Seeded community message - ${messageData.title}`);
      return c.json({ success: true, message: messageData });

    } catch (error) {
      console.error('Admin seed community message error:', error);
      return new Response(`Error seeding community message: ${error.message}`, { status: 500 });
    }
  });

  // Moderation endpoints
  // Get all moderation appeals
  app.get('/make-server-ac1075a9/moderation/appeals', async (c) => {
    console.log('Moderation: Get appeals endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Get all moderation appeals from KV store
      const appeals = await kv.getByPrefix('moderation_appeal:');
      
      // Sort by creation date (newest first)
      const sortedAppeals = appeals.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(`Moderation: Found ${appeals.length} appeals`);
      return c.json({ appeals: sortedAppeals });

    } catch (error) {
      console.error('Moderation get appeals error:', error);
      return new Response(`Error getting appeals: ${error.message}`, { status: 500 });
    }
  });

  // Review moderation appeal
  app.put('/make-server-ac1075a9/moderation/appeals/:appealId', async (c) => {
    console.log('Moderation: Review appeal endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const adminUser = await verifyAdminAccess(verifyUserAccess, accessToken);

      const appealId = c.req.param('appealId');
      const { status, reviewNote } = await c.req.json();
      
      if (!['approved', 'rejected'].includes(status)) {
        return new Response('Status must be approved or rejected', { status: 400 });
      }

      // Get the existing appeal
      const appeal = await kv.get(`moderation_appeal:${appealId}`);
      if (!appeal) {
        return new Response('Appeal not found', { status: 404 });
      }

      // Update the appeal
      const updatedAppeal = {
        ...appeal,
        status,
        reviewNote: reviewNote || '',
        reviewedBy: adminUser.id,
        reviewedAt: new Date().toISOString()
      };

      await kv.set(`moderation_appeal:${appealId}`, updatedAppeal);

      console.log(`Moderation: Appeal ${appealId} ${status} by ${adminUser.email}`);
      return c.json({ appeal: updatedAppeal });

    } catch (error) {
      console.error('Moderation review appeal error:', error);
      return new Response(`Error reviewing appeal: ${error.message}`, { status: 500 });
    }
  });

  // Create sample moderation appeals for testing
  app.post('/make-server-ac1075a9/moderation/seed-appeals', async (c) => {
    console.log('Moderation: Seed appeals endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // NO LONGER CREATING DEMO APPEALS - Only real appeals from actual users will be shown
      console.log('Moderation: Demo appeals seeding disabled - only real user appeals will be shown');
      return c.json({ 
        success: true, 
        appeals: [],
        message: 'Demo appeals seeding disabled. Only real user appeals will be shown in the moderation panel.'
      });

    } catch (error) {
      console.error('Moderation seed appeals error:', error);
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  });

  // Comprehensive admin data seeding endpoint
  app.post('/make-server-ac1075a9/admin/seed/all', async (c) => {
    console.log('Admin: Seed all data endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const adminUser = await verifyAdminAccess(verifyUserAccess, accessToken);

      const results = {
        users: 0,
        notifications: 0,
        appeals: 0,
        communityMessages: 0
      };

      // Sample users
      const sampleUsers = [
        {
          id: `user-${Date.now()}-1`,
          email: 'john@example.com',
          name: 'John Smith',
          role: 'user',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          business_info: { business_name: 'TechStart Solutions', industry: 'Technology' }
        },
        {
          id: `user-${Date.now()}-2`,
          email: 'sarah@example.com',
          name: 'Sarah Johnson',
          role: 'user',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          last_activity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          business_info: { business_name: 'Creative Marketing Co', industry: 'Marketing' }
        },
        {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.user_metadata?.name || adminUser.user_metadata?.full_name || 'Admin',
          role: 'admin',
          created_at: adminUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          business_info: { business_name: 'Cofounder Platform', industry: 'Technology' }
        }
      ];

      // Store users
      for (const user of sampleUsers) {
        await kv.set(`user:${user.id}`, user);
        results.users++;
      }

      // NO SAMPLE NOTIFICATIONS - Only real notifications will be created by actual system events
      console.log('Admin: Skipping demo notifications - only real notifications will be shown');

      // NO SAMPLE MODERATION APPEALS - Only real appeals will be created by actual user appeals
      console.log('Admin: Skipping demo moderation appeals - only real appeals will be shown');

      // NO SAMPLE COMMUNITY MESSAGES - Only real messages will be created by actual admin messages
      console.log('Admin: Skipping demo community messages - only real messages will be shown');

      console.log(`Admin: Seeded ${results.users} users, ${results.notifications} notifications, ${results.appeals} appeals, ${results.communityMessages} messages`);
      return c.json({ 
        success: true, 
        results,
        message: 'Sample users seeded. Demo notifications and moderation appeals removed - only real data will be shown.'
      });

    } catch (error) {
      console.error('Admin seed all data error:', error);
      return new Response(`Error seeding admin data: ${error.message}`, { status: 500 });
    }
  });

  // Clear all demo/sample data - keep only real user data
  app.post('/make-server-ac1075a9/admin/clear-demo-data', async (c) => {
    console.log('Admin: Clear demo data endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      let cleared = {
        notifications: 0,
        appeals: 0,
        communityMessages: 0,
        demoUsers: 0
      };

      // Get all notifications and filter out demo ones
      const allNotifications = await kv.getByPrefix('admin_notification:');
      for (const notification of allNotifications) {
        // Remove notifications that seem like demo data (containing example emails or generic messages)
        if (notification.message?.includes('john@example.com') || 
            notification.message?.includes('sarah@example.com') ||
            notification.title?.includes('User Help Request') ||
            notification.title?.includes('New Community Post') ||
            (notification.type === 'system' && notification.title === 'Platform Update')) {
          await kv.del(`admin_notification:${notification.id}`);
          cleared.notifications++;
        }
      }

      // Get all moderation appeals and filter out demo ones
      const allAppeals = await kv.getByPrefix('moderation_appeal:');
      for (const appeal of allAppeals) {
        // Remove appeals that seem like demo data
        if (appeal.userName === 'John Smith' || 
            appeal.userName === 'Sarah Johnson' || 
            appeal.userName === 'Mike Davis' ||
            appeal.originalContent?.includes('amazing opportunity to make money fast') ||
            appeal.originalContent?.includes('pizza') ||
            appeal.userMessage?.includes('This is not spam')) {
          await kv.del(`moderation_appeal:${appeal.id}`);
          cleared.appeals++;
        }
      }

      // Get all community messages and clear demo ones
      const allMessages = await kv.getByPrefix('community_message:');
      for (const message of allMessages) {
        // Remove messages that seem like demo data
        if (message.author?.email?.includes('example.com') ||
            message.title?.includes('Welcome to') ||
            message.content?.includes('sample')) {
          await kv.del(`community_message:${message.id}`);
          cleared.communityMessages++;
        }
      }

      // Get all users and remove demo ones (keep admin)
      const allUsers = await kv.getByPrefix('user:');
      for (const user of allUsers) {
        // Remove demo users but keep admin users
        if (user.email?.includes('example.com') && user.role !== 'admin') {
          await kv.del(`user:${user.id}`);
          cleared.demoUsers++;
        }
      }

      console.log(`Admin: Cleared ${cleared.notifications} demo notifications, ${cleared.appeals} demo appeals, ${cleared.communityMessages} demo messages, ${cleared.demoUsers} demo users`);
      return c.json({ 
        success: true, 
        cleared,
        message: 'Demo data cleared successfully. Only real user data remains.'
      });

    } catch (error) {
      console.error('Admin clear demo data error:', error);
      return new Response(`Error clearing demo data: ${error.message}`, { status: 500 });
    }
  });

  // Get all subscriptions (admin only)
  app.get('/make-server-ac1075a9/admin/subscriptions', async (c) => {
    console.log('Admin: Get all subscriptions endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Get all subscriptions from KV store (use safe wrapper to avoid timeouts)
      const allSubscriptions = await kvSafe.safeGetByPrefix('subscription:', [], 500);
      console.log(`🔧 Raw subscription data from KV store:`, allSubscriptions);
      console.log(`🔧 Number of subscription records found:`, allSubscriptions.length);
      
      // Get all users for mapping (use safe wrapper to avoid timeouts)
      const allUsers = await kvSafe.safeGetByPrefix('user:', [], 1000);
      console.log(`🔧 Number of users found for mapping:`, allUsers.length);
      const userMap = {};
      allUsers.forEach(user => {
        userMap[user.id] = user;
      });
      
      // Format subscriptions for admin dashboard with user info
      const subscriptions = allSubscriptions.map(subscriptionData => {
        const userId = subscriptionData.user_id || subscriptionData.userId;
        const user = userMap[userId];
        
        console.log(`🔧 Processing subscription for user ${userId}:`, subscriptionData);
        
        return {
          id: subscriptionData.stripe_subscription_id || subscriptionData.id || 'unknown',
          user_id: userId,
          user_email: user?.email || 'Unknown',
          user_name: user?.name || 'Unknown User',
          plan: subscriptionData.plan || 'free',
          status: subscriptionData.status || 'unknown',
          stripe_customer_id: subscriptionData.stripe_customer_id || subscriptionData.stripeCustomerId,
          stripe_subscription_id: subscriptionData.stripe_subscription_id || subscriptionData.subscriptionId,
          current_period_start: subscriptionData.current_period_start,
          current_period_end: subscriptionData.current_period_end,
          created_at: subscriptionData.created_at || new Date().toISOString(),
          source: subscriptionData.source || 'unknown',
          billing_period: subscriptionData.billing_period || subscriptionData.billingPeriod || 'monthly'
        };
      });

      console.log(`Admin: Found ${subscriptions.length} subscriptions after processing`);
      console.log(`🔧 Final subscription data:`, subscriptions);
      
      return c.json({ 
        subscriptions: subscriptions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        debug: {
          rawSubscriptionCount: allSubscriptions.length,
          userCount: allUsers.length,
          processedSubscriptionCount: subscriptions.length
        }
      });

    } catch (error) {
      console.error('Admin get subscriptions error:', error);
      return new Response(`Error getting subscriptions: ${error.message}`, { status: 500 });
    }
  });

  // Add admin subscription management endpoints
  app.post('/make-server-ac1075a9/admin/sync-all-subscriptions', async (c) => {
    try {
      console.log('🔧 Admin: Starting subscription sync for all users');
      
      // For now, just return a success message
      // In the future, this could sync with Stripe to update all user subscription statuses
      
      return c.json({
        success: true,
        message: 'Subscription sync initiated',
        synced: 0,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('🔧 Admin: Error syncing subscriptions:', error);
      return c.json({ error: 'Failed to sync subscriptions' }, 500);
    }
  });

  // Create mock subscription (admin only) - NEW ENDPOINT
  app.post('/make-server-ac1075a9/admin/subscriptions/:userId/create-mock', async (c) => {
    console.log('Admin: Create mock subscription endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { plan, status, billingPeriod, customerId, subscriptionId, adminNote } = await c.req.json();

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      if (!plan || !['creator', 'builder', 'studio'].includes(plan)) {
        return c.json({ error: 'Valid plan is required (creator, builder, studio)' }, 400);
      }

      console.log(`Admin: Creating mock subscription for user ${userId}: ${plan} (${billingPeriod || 'monthly'})`);

      // Check if subscription already exists (use safe wrapper to avoid timeouts)
      const existingSubscription = await kvSafe.getSubscription(userId);
      if (existingSubscription) {
        console.log(`Admin: Existing subscription found for user ${userId}, overwriting`);
      }

      // Create mock subscription data
      const mockSubscription = {
        user_id: userId,
        userId: userId, // Backward compatibility
        plan: plan,
        status: status || 'active',
        stripe_customer_id: customerId || `mock_customer_${Date.now()}`,
        stripe_subscription_id: subscriptionId || `mock_sub_${Date.now()}`,
        billing_period: billingPeriod || 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (billingPeriod === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'admin_mock_creation',
        admin_created: true,
        admin_note: adminNote || 'Mock subscription created via admin tools'
      };

      // Store the subscription
      await kv.set(`subscription:${userId}`, mockSubscription);

      // Also store the customer ID mapping
      await kv.set(`stripe_customer:${userId}`, mockSubscription.stripe_customer_id);

      console.log(`Admin: ✅ Mock subscription created successfully for user ${userId}`);
      console.log(`Admin: Mock subscription data:`, mockSubscription);

      return c.json({
        success: true,
        subscription: mockSubscription,
        message: `Mock ${plan} subscription created successfully`
      });

    } catch (error) {
      console.error('Admin create mock subscription error:', error);
      return new Response(`Error creating mock subscription: ${error.message}`, { status: 500 });
    }
  });

  // Update subscription status (admin only)
  app.patch('/make-server-ac1075a9/admin/subscriptions/:userId/status', async (c) => {
    console.log('Admin: Update subscription status endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { status, adminNote } = await c.req.json();

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      if (!['active', 'canceled', 'past_due', 'trialing', 'incomplete'].includes(status)) {
        return c.json({ error: 'Invalid status' }, 400);
      }

      // Get existing subscription data (use safe wrapper to avoid timeouts)
      const existingSubscription = await kvSafe.getSubscription(userId);
      if (!existingSubscription) {
        return c.json({ error: 'Subscription not found' }, 404);
      }

      // Update subscription status
      const updatedSubscription = {
        ...existingSubscription,
        status,
        admin_modified: true,
        admin_note: adminNote || '',
        updated_at: new Date().toISOString(),
        updated_by: 'admin'
      };

      await kv.set(`subscription:${userId}`, updatedSubscription);

      console.log(`Admin: Updated subscription status for user ${userId} to ${status}`);
      return c.json({ 
        success: true, 
        subscription: updatedSubscription,
        message: `Subscription status updated to ${status}`
      });

    } catch (error) {
      console.error('Admin update subscription status error:', error);
      return new Response(`Error updating subscription status: ${error.message}`, { status: 500 });
    }
  });

  // Update subscription plan (admin only)
  app.patch('/make-server-ac1075a9/admin/subscriptions/:userId/plan', async (c) => {
    console.log('Admin: Update subscription plan endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { plan, billingPeriod, adminNote } = await c.req.json();

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      if (!['free', 'creator', 'builder', 'studio'].includes(plan)) {
        return c.json({ error: 'Invalid plan' }, 400);
      }

      if (billingPeriod && !['monthly', 'annual'].includes(billingPeriod)) {
        return c.json({ error: 'Invalid billing period' }, 400);
      }

      // Get existing subscription data
      const existingSubscription = await kv.get(`subscription:${userId}`);
      if (!existingSubscription) {
        return c.json({ error: 'Subscription not found' }, 404);
      }

      // Update subscription plan
      const updatedSubscription = {
        ...existingSubscription,
        plan,
        billing_period: billingPeriod || existingSubscription.billing_period || 'monthly',
        admin_modified: true,
        admin_note: adminNote || '',
        updated_at: new Date().toISOString(),
        updated_by: 'admin'
      };

      await kv.set(`subscription:${userId}`, updatedSubscription);

      console.log(`Admin: Updated subscription plan for user ${userId} to ${plan} (${billingPeriod || 'monthly'})`);
      return c.json({ 
        success: true, 
        subscription: updatedSubscription,
        message: `Subscription plan updated to ${plan}`
      });

    } catch (error) {
      console.error('Admin update subscription plan error:', error);
      return new Response(`Error updating subscription plan: ${error.message}`, { status: 500 });
    }
  });

  // Cancel subscription (admin only)
  app.post('/make-server-ac1075a9/admin/subscriptions/:userId/cancel', async (c) => {
    console.log('Admin: Cancel subscription endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { reason, adminNote, immediateCancel } = await c.req.json();

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Get existing subscription data
      const existingSubscription = await kv.get(`subscription:${userId}`);
      if (!existingSubscription) {
        return c.json({ error: 'Subscription not found' }, 404);
      }

      // Update subscription to canceled status
      const canceledSubscription = {
        ...existingSubscription,
        status: 'canceled',
        plan: 'free', // Downgrade to free
        canceled_at: new Date().toISOString(),
        cancel_reason: reason || 'Admin cancellation',
        admin_modified: true,
        admin_note: adminNote || '',
        immediate_cancel: immediateCancel || false,
        updated_at: new Date().toISOString(),
        updated_by: 'admin'
      };

      await kv.set(`subscription:${userId}`, canceledSubscription);

      console.log(`Admin: Canceled subscription for user ${userId}. Reason: ${reason || 'Admin cancellation'}`);
      return c.json({ 
        success: true, 
        subscription: canceledSubscription,
        message: `Subscription canceled successfully`
      });

    } catch (error) {
      console.error('Admin cancel subscription error:', error);
      return new Response(`Error canceling subscription: ${error.message}`, { status: 500 });
    }
  });

  // Restore subscription (admin only)
  app.post('/make-server-ac1075a9/admin/subscriptions/:userId/restore', async (c) => {
    console.log('Admin: Restore subscription endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { plan, adminNote } = await c.req.json();

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      if (!['creator', 'builder', 'studio'].includes(plan)) {
        return c.json({ error: 'Invalid plan for restoration' }, 400);
      }

      // Get existing subscription data
      const existingSubscription = await kv.get(`subscription:${userId}`);
      if (!existingSubscription) {
        return c.json({ error: 'Subscription not found' }, 404);
      }

      // Restore subscription
      const restoredSubscription = {
        ...existingSubscription,
        status: 'active',
        plan,
        restored_at: new Date().toISOString(),
        admin_modified: true,
        admin_note: adminNote || '',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: 'admin'
      };

      await kv.set(`subscription:${userId}`, restoredSubscription);

      console.log(`Admin: Restored subscription for user ${userId} to ${plan} plan`);
      return c.json({ 
        success: true, 
        subscription: restoredSubscription,
        message: `Subscription restored to ${plan} plan`
      });

    } catch (error) {
      console.error('Admin restore subscription error:', error);
      return new Response(`Error restoring subscription: ${error.message}`, { status: 500 });
    }
  });

  // Get subscription history (admin only)
  app.get('/make-server-ac1075a9/admin/subscriptions/:userId/history', async (c) => {
    console.log('Admin: Get subscription history endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Get subscription data
      const subscription = await kv.get(`subscription:${userId}`);
      
      // For now, return the current subscription as history
      // In a real implementation, you'd maintain a history table
      const history = subscription ? [subscription] : [];

      console.log(`Admin: Retrieved subscription history for user ${userId}`);
      return c.json({ 
        success: true, 
        history,
        count: history.length
      });

    } catch (error) {
      console.error('Admin get subscription history error:', error);
      return new Response(`Error getting subscription history: ${error.message}`, { status: 500 });
    }
  });

  app.post('/make-server-ac1075a9/admin/fix-subscription-state', async (c) => {
    try {
      const body = await c.req.json();
      const { userId, forceStatus, forcePlan } = body;
      
      console.log('🔧 Admin: Forcing subscription state fix:', { userId, forceStatus, forcePlan });
      
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }
      
      // Force update subscription state in KV store
      const subscriptionData = {
        user_id: userId,
        plan: forcePlan || 'creator',
        status: forceStatus || 'active',
        stripe_subscription_id: `forced_${Date.now()}`,
        stripe_customer_id: `forced_customer_${userId}`,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };
      
      await kv.set(`subscription:${userId}`, subscriptionData);
      
      console.log('🔧 Admin: Forced subscription state updated:', subscriptionData);
      
      return c.json({
        success: true,
        message: 'Subscription state force updated',
        subscription: subscriptionData
      });
      
    } catch (error) {
      console.error('🔧 Admin: Error forcing subscription fix:', error);
      return c.json({ error: 'Failed to fix subscription state' }, 500);
    }
  });

  // Create mock seat subscription (admin only)
  app.post('/make-server-ac1075a9/admin/subscriptions/:userId/create-mock-seats', async (c) => {
    console.log('Admin: Create mock seat subscription endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      const userId = c.req.param('userId');
      const { seatQuantity, status, billingPeriod, customerId, subscriptionId, adminNote } = await c.req.json();

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      if (!seatQuantity || seatQuantity < 1) {
        return c.json({ error: 'Seat quantity must be at least 1' }, 400);
      }

      console.log(`Admin: Creating mock seat subscription for user ${userId}: ${seatQuantity} seats (${billingPeriod || 'monthly'})`);

      // Create mock seat subscription data
      const mockSeatSubscription = {
        user_id: userId,
        userId: userId, // Backward compatibility
        type: 'seat_subscription',
        seat_quantity: parseInt(seatQuantity),
        status: status || 'active',
        stripe_customer_id: customerId || `mock_customer_seats_${Date.now()}`,
        stripe_subscription_id: subscriptionId || `mock_seat_sub_${Date.now()}`,
        billing_period: billingPeriod || 'monthly',
        unit_amount: 1200, // $12 per seat per month
        total_amount: parseInt(seatQuantity) * 1200,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (billingPeriod === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'admin_mock_seat_creation',
        admin_created: true,
        admin_note: adminNote || 'Mock seat subscription created via admin tools'
      };

      // Store the seat subscription
      await kv.set(`seat_subscription:${userId}`, mockSeatSubscription);

      // Also store the customer ID mapping if not exists
      const existingCustomerId = await kv.get(`stripe_customer:${userId}`);
      if (!existingCustomerId) {
        await kv.set(`stripe_customer:${userId}`, mockSeatSubscription.stripe_customer_id);
      }

      console.log(`Admin: ✅ Mock seat subscription created successfully for user ${userId}`);
      console.log(`Admin: Mock seat subscription data:`, mockSeatSubscription);

      return c.json({
        success: true,
        seatSubscription: mockSeatSubscription,
        message: `Mock seat subscription created: ${seatQuantity} seats at ${(mockSeatSubscription.total_amount / 100).toFixed(2)}/${billingPeriod || 'monthly'}`
      });

    } catch (error) {
      console.error('Admin create mock seat subscription error:', error);
      return new Response(`Error creating mock seat subscription: ${error.message}`, { status: 500 });
    }
  });

  // Get seat subscriptions (admin only)
  app.get('/make-server-ac1075a9/admin/seat-subscriptions', async (c) => {
    console.log('Admin: Get all seat subscriptions endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      await verifyAdminAccess(verifyUserAccess, accessToken);

      // Get all seat subscriptions from KV store
      const allSeatSubscriptions = await kv.getByPrefix('seat_subscription:');
      console.log(`🪑 Raw seat subscription data from KV store:`, allSeatSubscriptions);
      console.log(`🪑 Number of seat subscription records found:`, allSeatSubscriptions.length);
      
      // Get all users for mapping
      const allUsers = await kv.getByPrefix('user:');
      const userMap = {};
      allUsers.forEach(user => {
        userMap[user.id] = user;
      });
      
      // Format seat subscriptions for admin dashboard with user info
      const seatSubscriptions = allSeatSubscriptions.map(seatSubData => {
        const userId = seatSubData.user_id || seatSubData.userId;
        const user = userMap[userId];
        
        console.log(`🪑 Processing seat subscription for user ${userId}:`, seatSubData);
        
        return {
          id: seatSubData.stripe_subscription_id || seatSubData.id || 'unknown',
          user_id: userId,
          user_email: user?.email || 'Unknown',
          user_name: user?.name || 'Unknown User',
          type: 'seat_subscription',
          seat_quantity: seatSubData.seat_quantity || 1,
          status: seatSubData.status || 'unknown',
          stripe_customer_id: seatSubData.stripe_customer_id || seatSubData.stripeCustomerId,
          stripe_subscription_id: seatSubData.stripe_subscription_id || seatSubData.subscriptionId,
          unit_amount: seatSubData.unit_amount || 1200,
          total_amount: seatSubData.total_amount || (seatSubData.seat_quantity * 1200),
          current_period_start: seatSubData.current_period_start,
          current_period_end: seatSubData.current_period_end,
          created_at: seatSubData.created_at || new Date().toISOString(),
          source: seatSubData.source || 'unknown',
          billing_period: seatSubData.billing_period || seatSubData.billingPeriod || 'monthly'
        };
      });

      console.log(`Admin: Found ${seatSubscriptions.length} seat subscriptions after processing`);
      
      return c.json({ 
        seatSubscriptions: seatSubscriptions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        debug: {
          rawSeatSubscriptionCount: allSeatSubscriptions.length,
          userCount: allUsers.length,
          processedSeatSubscriptionCount: seatSubscriptions.length
        }
      });

    } catch (error) {
      console.error('Admin get seat subscriptions error:', error);
      return new Response(`Error getting seat subscriptions: ${error.message}`, { status: 500 });
    }
  });

  // Bulk user operations (admin only)
  
  // Bulk deactivate users
  app.post('/make-server-ac1075a9/admin/users/bulk-deactivate', async (c) => {
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
  app.post('/make-server-ac1075a9/admin/users/bulk-activate', async (c) => {
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
  app.post('/make-server-ac1075a9/admin/users/bulk-delete', async (c) => {
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
  app.post('/make-server-ac1075a9/admin/users/bulk-role-update', async (c) => {
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