/**
 * Cofounder Notification Utilities
 * Helper functions for the Cofounder AGI to send notifications to users
 */

import { supabase } from './supabase/client';
import { projectId } from './supabase/info';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationCategory = 'general' | 'task' | 'deadline' | 'insight' | 'warning' | 'achievement';

export interface SendCofounderNotificationParams {
  businessId: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Send a notification from Cofounder AGI to the current user
 * This function should be called by Cofounder automation systems
 */
export async function sendCofounderNotification(params: SendCofounderNotificationParams): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('No session found - cannot send notification');
      return false;
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/cofounder/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: params.businessId,
          title: params.title,
          message: params.message,
          priority: params.priority || 'normal',
          category: params.category || 'general',
          actionUrl: params.actionUrl,
          actionLabel: params.actionLabel
        })
      }
    );

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Cofounder notification sent:', params.title);
      return true;
    } else {
      console.error('Failed to send Cofounder notification:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending Cofounder notification:', error);
    return false;
  }
}

/**
 * Example: Send a task creation notification
 */
export async function notifyTaskCreated(businessId: string, taskTitle: string) {
  return sendCofounderNotification({
    businessId,
    title: 'New Task Created',
    message: `Cofounder has created a new task for you: "${taskTitle}"`,
    priority: 'normal',
    category: 'task',
    actionUrl: '/notes',
    actionLabel: 'View Tasks'
  });
}

/**
 * Example: Send a deadline warning
 */
export async function notifyDeadlineApproaching(businessId: string, taskTitle: string, hoursRemaining: number) {
  return sendCofounderNotification({
    businessId,
    title: 'Deadline Approaching',
    message: `"${taskTitle}" is due in ${hoursRemaining} hours. Time to take action!`,
    priority: hoursRemaining <= 2 ? 'urgent' : 'high',
    category: 'deadline',
    actionUrl: '/notes',
    actionLabel: 'View Task'
  });
}

/**
 * Example: Send a business insight
 */
export async function notifyBusinessInsight(businessId: string, insight: string) {
  return sendCofounderNotification({
    businessId,
    title: 'Business Insight',
    message: insight,
    priority: 'normal',
    category: 'insight',
    actionUrl: '/dashboard',
    actionLabel: 'View Dashboard'
  });
}

/**
 * Example: Send a warning notification
 */
export async function notifyWarning(businessId: string, warningMessage: string) {
  return sendCofounderNotification({
    businessId,
    title: 'Action Required',
    message: warningMessage,
    priority: 'high',
    category: 'warning',
    actionUrl: '/finance',
    actionLabel: 'Review Finances'
  });
}

/**
 * Example: Send an achievement notification
 */
export async function notifyAchievement(businessId: string, achievementTitle: string, description: string) {
  return sendCofounderNotification({
    businessId,
    title: `🎉 ${achievementTitle}`,
    message: description,
    priority: 'normal',
    category: 'achievement',
    actionUrl: '/dashboard',
    actionLabel: 'View Progress'
  });
}
