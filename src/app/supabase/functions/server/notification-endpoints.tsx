/**
 * Notification Endpoints
 * Handles in-app notifications for team invitations and account switching
 * Version: 1.0
 */

import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_cache.tsx';
import { sendPushNotification } from './push-notification-helper.tsx';

const notificationRouter = new Hono();

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
    } catch (error: any) {
      lastError = error as Error;
      const errorMessage = error?.message || String(error);
      
      const shouldRetry = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('503');
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

// Helper to verify user and get details
async function getAuthUser(authHeader: string | undefined) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
  
  try {
    const { data: { user }, error } = await retryAuthRequest(() => 
      authClient.auth.getUser(token)
    );
    if (error || !user) return null;
    return user;
  } catch (e) {
    console.error('Auth check failed:', e);
    return null;
  }
}

/**
 * GET /notifications/list
 * Get all notifications for the current user
 */
notificationRouter.get('/notifications/list', async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    
    if (!user) {
      console.log('ℹ️ Notifications: No valid session (user not authenticated)');
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    console.log('✅ Notifications: Loading for user:', user.email);

    // Get user notifications (team invitations and cofounder notifications)
    const notificationsKey = `user_notifications:${user.id}`;
    const notificationsData = await kv.get(notificationsKey);
    
    let notifications = [];
    if (notificationsData && typeof notificationsData === 'string') {
      notifications = JSON.parse(notificationsData);
    } else if (Array.isArray(notificationsData)) {
      notifications = notificationsData;
    }

    // Get automation notifications
    const automationNotifs = await kv.getByPrefix(`automation_notification:${user.id}`);
    const automationNotifications = automationNotifs?.map(item => {
      try {
        // getByPrefix returns items directly, not wrapped in {value: ...}
        return item;
      } catch {
        return null;
      }
    }).filter(Boolean) || [];

    // Get marketing notifications (pattern: notification:businessId:userId:notifId)
    // We need to search all businesses for this user
    // Note: This is expensive, relies on KV cache to be efficient
    const allMarketingNotifs = await kv.getByPrefix(`notification:`);
    console.log(`🔍 Debug: Found ${allMarketingNotifs?.length || 0} total marketing notifications with prefix 'notification:'`);
    
    const marketingNotifications = allMarketingNotifs?.filter((item: any) => {
      // Check if this notification belongs to this user
      const matches = item && item.userId === user.id;
      if (matches) {
        console.log(`✅ Debug: Marketing notification matches user ${user.id}:`, item.title);
      }
      return matches;
    }) || [];
    
    console.log(`📊 Debug: Filtered to ${marketingNotifications.length} marketing notifications for user ${user.id}`);

    // Combine all notifications
    const allNotifications = [...notifications, ...automationNotifications, ...marketingNotifications];
    console.log(`📋 Debug: Total combined notifications: ${allNotifications.length} (user: ${notifications.length}, automation: ${automationNotifications.length}, marketing: ${marketingNotifications.length})`);

    // Filter out expired notifications and include 'pending', 'unread', and 'running'
    const now = new Date();
    const activeNotifications = allNotifications.filter((notif: any) => {
      try {
        const expiresAt = new Date(notif.expiresAt);
        const isNotExpired = expiresAt > now;
        const hasValidStatus = notif.status === 'pending' || notif.status === 'unread' || notif.status === 'running';
        
        if (!isNotExpired) {
          console.log(`⏰ Debug: Notification expired: ${notif.title}`);
        }
        if (!hasValidStatus) {
          console.log(`❌ Debug: Invalid status (${notif.status}): ${notif.title}`);
        }
        
        // Include 'pending' (team invitations), 'unread' (cofounder notifications), and 'running' (automation in progress)
        return isNotExpired && hasValidStatus;
      } catch (err) {
        console.log(`⚠️ Debug: Error filtering notification:`, err);
        return false;
      }
    });

    // Sort by creation date (most recent first)
    activeNotifications.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`✅ Notifications: Returning ${activeNotifications.length} notifications (${automationNotifications.length} automation notifications)`);

    return c.json({
      success: true,
      notifications: activeNotifications,
      count: activeNotifications.length
    });

  } catch (error: any) {
    console.error('❌ Error listing notifications:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to list notifications'
    }, 500);
  }
});

/**
 * POST /notifications/accept-invitation
 * Accept a team invitation from notification
 */
notificationRouter.post('/notifications/accept-invitation', async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const { notificationId } = await c.req.json();

    if (!notificationId) {
      return c.json({ success: false, error: 'Notification ID is required' }, 400);
    }

    // Get notifications
    const notificationsKey = `user_notifications:${user.id}`;
    const notificationsData = await kv.get(notificationsKey);
    
    let notifications = [];
    if (notificationsData && typeof notificationsData === 'string') {
      notifications = JSON.parse(notificationsData);
    } else if (Array.isArray(notificationsData)) {
      notifications = notificationsData;
    }

    const notification = notifications.find((n: any) => n.id === notificationId);

    if (!notification) {
      return c.json({ success: false, error: 'Notification not found' }, 404);
    }

    if (notification.status !== 'pending') {
      return c.json({ success: false, error: 'Notification already processed' }, 400);
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(notification.expiresAt);
    
    if (expiresAt <= now) {
      return c.json({ success: false, error: 'Invitation has expired' }, 400);
    }

    // Add user to the inviter's organization
    const orgsKey = `user_organizations:${user.id}`;
    let orgsData;
    try {
      orgsData = await kv.get(orgsKey);
    } catch (kvError) {
      console.error(`❌ KV get failed for ${orgsKey}:`, kvError);
      orgsData = null;
    }
    
    let userOrgs = [];
    if (orgsData && typeof orgsData === 'string') {
      try {
        userOrgs = JSON.parse(orgsData);
      } catch (parseError) {
        console.error(`❌ JSON parse failed for ${orgsKey}:`, parseError);
        userOrgs = [];
      }
    } else if (Array.isArray(orgsData)) {
      userOrgs = orgsData;
    }

    // Check if already a member
    const alreadyMember = userOrgs.some((org: any) => org.organizationId === notification.organizationId);
    
    if (!alreadyMember) {
      // Add the organization to user's list
      userOrgs.push({
        organizationId: notification.organizationId,
        role: 'member',
        joinedAt: new Date().toISOString(),
        ownerEmail: notification.fromUserEmail,
        ownerName: notification.fromUserName
      });
      await kv.set(orgsKey, JSON.stringify(userOrgs));

      // Update organization data to include this user as a member
      const orgDataKey = `organization_data:${notification.organizationId}`;
      const orgDataRaw = await kv.get(orgDataKey);
      
      let orgData: any = { members: [] };
      if (orgDataRaw && typeof orgDataRaw === 'string') {
        orgData = JSON.parse(orgDataRaw);
      } else if (orgDataRaw) {
        orgData = orgDataRaw;
      }

      if (!orgData.members) {
        orgData.members = [];
      }

      if (!orgData.members.includes(user.id)) {
        orgData.members.push(user.id);
        await kv.set(orgDataKey, JSON.stringify(orgData));
      }
    }

    // Mark notification as accepted
    notification.status = 'accepted';
    const updatedNotifications = notifications.map((n: any) => 
      n.id === notificationId ? notification : n
    );
    await kv.set(notificationsKey, updatedNotifications); // Store as array, not JSON string

    // Remove from inviter's pending invitations if it exists
    try {
      const pendingInvKey = `pending_invitations:${notification.organizationId}`;
      const pendingInvitations = await kv.get(pendingInvKey) || [];
      const filteredInvitations = (Array.isArray(pendingInvitations) ? pendingInvitations : [])
        .filter((inv: any) => inv.email?.toLowerCase() !== user.email.toLowerCase());
      await kv.set(pendingInvKey, filteredInvitations);
    } catch (error) {
      console.warn('Could not clean up pending invitations:', error);
    }

    return c.json({
      success: true,
      message: 'Invitation accepted successfully',
      organizationId: notification.organizationId
    });

  } catch (error: any) {
    console.error('❌ Error accepting invitation:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to accept invitation'
    }, 500);
  }
});

/**
 * POST /notifications/decline-invitation
 * Decline a team invitation from notification
 */
notificationRouter.post('/notifications/decline-invitation', async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const { notificationId } = await c.req.json();

    if (!notificationId) {
      return c.json({ success: false, error: 'Notification ID is required' }, 400);
    }

    // Get notifications
    const notificationsKey = `user_notifications:${user.id}`;
    const notificationsData = await kv.get(notificationsKey);
    
    let notifications = [];
    if (notificationsData && typeof notificationsData === 'string') {
      notifications = JSON.parse(notificationsData);
    } else if (Array.isArray(notificationsData)) {
      notifications = notificationsData;
    }

    const notification = notifications.find((n: any) => n.id === notificationId);

    if (!notification) {
      return c.json({ success: false, error: 'Notification not found' }, 404);
    }

    if (notification.status !== 'pending') {
      return c.json({ success: false, error: 'Notification already processed' }, 400);
    }

    // Mark notification as declined
    notification.status = 'declined';
    const updatedNotifications = notifications.map((n: any) => 
      n.id === notificationId ? notification : n
    );
    await kv.set(notificationsKey, updatedNotifications); // Store as array, not JSON string

    return c.json({
      success: true,
      message: 'Invitation declined'
    });

  } catch (error: any) {
    console.error('❌ Error declining invitation:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to decline invitation'
    }, 500);
  }
});

/**
 * DELETE /notifications/:notificationId
 * Delete a notification
 */
notificationRouter.delete('/notifications/:notificationId', async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const notificationId = c.req.param('notificationId');

    // Get notifications
    const notificationsKey = `user_notifications:${user.id}`;
    const notificationsData = await kv.get(notificationsKey);
    
    let notifications = [];
    if (notificationsData && typeof notificationsData === 'string') {
      notifications = JSON.parse(notificationsData);
    } else if (Array.isArray(notificationsData)) {
      notifications = notificationsData;
    }

    const updatedNotifications = notifications.filter((n: any) => n.id !== notificationId);
    await kv.set(notificationsKey, updatedNotifications); // Store as array, not JSON string

    return c.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error: any) {
    console.error('❌ Error deleting notification:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to delete notification'
    }, 500);
  }
});

/**
 * POST /notifications/cofounder/send
 * Send a Cofounder AGI notification to a user
 */
notificationRouter.post('/notifications/cofounder/send', async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const { 
      businessId, 
      title, 
      message, 
      priority = 'normal',
      category,
      actionUrl,
      actionLabel
    } = await c.req.json();

    if (!businessId || !title || !message) {
      return c.json({ 
        success: false, 
        error: 'businessId, title, and message are required' 
      }, 400);
    }

    // Check if user's Cofounder notifications are enabled for this business
    const settingsKey = `business:${user.id}:${businessId}:cofounder_settings`;
    const settingsData = await kv.get(settingsKey);
    
    let settings: any = {};
    if (settingsData && typeof settingsData === 'string') {
      settings = JSON.parse(settingsData);
    } else if (settingsData) {
      settings = settingsData;
    }

    // Check if the specific notification category is enabled
    if (settings.notificationPreferences && category) {
      const categoryEnabled = settings.notificationPreferences[category];
      if (categoryEnabled === false) {
        return c.json({
          success: false,
          error: 'This notification category is disabled by user preferences'
        }, 403);
      }
    }

    // Create notification
    const notification = {
      id: crypto.randomUUID(),
      type: 'cofounder_notification',
      businessId,
      title,
      message,
      priority,
      category: category || 'general',
      actionUrl,
      actionLabel,
      status: 'unread',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    // Get user's notifications
    const notificationsKey = `user_notifications:${user.id}`;
    const notificationsData = await kv.get(notificationsKey);
    
    let notifications = [];
    if (notificationsData && typeof notificationsData === 'string') {
      notifications = JSON.parse(notificationsData);
    } else if (Array.isArray(notificationsData)) {
      notifications = notificationsData;
    }

    // Add new notification
    notifications.push(notification);

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications = notifications.slice(-100);
    }

    await kv.set(notificationsKey, notifications);

    console.log(`✅ Cofounder notification sent to user ${user.id} for business ${businessId}: ${title}`);

    return c.json({
      success: true,
      notification,
      message: 'Cofounder notification sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending Cofounder notification:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to send Cofounder notification'
    }, 500);
  }
});

/**
 * POST /notifications/mark-all-read
 * Mark all notifications as read in a single operation
 */
notificationRouter.post('/notifications/mark-all-read', async (c) => {
  try {
    console.log('📬 MARK ALL AS READ: Endpoint called');
    
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      console.log('📬 MARK ALL AS READ: Auth failed');
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    console.log('📬 MARK ALL AS READ: User:', user.email);

    // Get notifications
    const notificationsKey = `user_notifications:${user.id}`;
    
    const notificationsData = await kv.get(notificationsKey);
    
    let notifications = [];
    if (notificationsData && typeof notificationsData === 'string') {
      notifications = JSON.parse(notificationsData);
    } else if (Array.isArray(notificationsData)) {
      notifications = notificationsData;
    }

    // Mark all as read in a single operation
    const updatedNotifications = notifications.map((n: any) => ({ ...n, status: 'read' }));
    
    console.log('📬 MARK ALL AS READ: Marking', updatedNotifications.length, 'notifications as read');
    
    // Store as array, NOT as JSON string
    await kv.set(notificationsKey, updatedNotifications);
    console.log('📬 MARK ALL AS READ: Saved to KV store as array');

    return c.json({
      success: true,
      count: updatedNotifications.length,
      message: 'All notifications marked as read'
    });

  } catch (error: any) {
    console.error('❌ Error marking all notifications as read:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to mark all notifications as read'
    }, 500);
  }
});

/**
 * POST /notifications/:notificationId/mark-read
 * Mark a notification as read
 */
notificationRouter.post('/notifications/:notificationId/mark-read', async (c) => {
  try {
    console.log('📬 MARK AS READ: Endpoint called');
    
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      console.log('📬 MARK AS READ: Auth failed');
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const notificationId = c.req.param('notificationId');
    console.log('📬 MARK AS READ: User:', user.email, 'Notification ID:', notificationId);

    // Get notifications
    const notificationsKey = `user_notifications:${user.id}`;
    
    const notificationsData = await kv.get(notificationsKey);
    
    let notifications = [];
    if (notificationsData && typeof notificationsData === 'string') {
      notifications = JSON.parse(notificationsData);
    } else if (Array.isArray(notificationsData)) {
      notifications = notificationsData;
    }

    // Mark as read
    const updatedNotifications = notifications.map((n: any) => 
      n.id === notificationId ? { ...n, status: 'read' } : n
    );
    
    // Store as array, NOT as JSON string
    await kv.set(notificationsKey, updatedNotifications);
    console.log('📬 MARK AS READ: Saved to KV store as array');
    
    return c.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error: any) {
    console.error('❌ Error marking notification as read:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to mark notification as read'
    }, 500);
  }
});

/**
 * POST /notifications/test
 * Send a test notification for preview purposes
 */
notificationRouter.post('/notifications/test', async (c) => {
  try {
    const user = await getAuthUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const { title, message, category, icon, color } = await c.req.json();

    if (!title || !message) {
      return c.json({ 
        success: false, 
        error: 'title and message are required' 
      }, 400);
    }

    console.log(`📱 Sending test notification to user ${user.id}: ${title}`);

    // Send push notification if device is registered
    try {
      await sendPushNotification({
        userId: user.id,
        title,
        message,
        category: category || 'system',
        data: {
          isTest: true,
          icon,
          color
        }
      });
      console.log(`✅ Test push notification sent to user ${user.id}`);
    } catch (pushError) {
      console.error(`❌ Failed to send test push notification:`, pushError);
      // Don't fail the request if push fails
    }

    return c.json({
      success: true,
      message: 'Test notification sent'
    });

  } catch (error: any) {
    console.error('❌ Error sending test notification:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to send test notification'
    }, 500);
  }
});

export default notificationRouter;