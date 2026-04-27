import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export interface SupportTicketUpdate {
  hasUnread: boolean;
  unreadCount: number;
  lastUpdate: string | null;
}

/**
 * Hook to track support ticket notifications
 * Returns unread count and whether there are admin replies/status changes
 */
export function useSupportTicketNotifications(userId?: string) {
  const [updates, setUpdates] = useState<SupportTicketUpdate>({
    hasUnread: false,
    unreadCount: 0,
    lastUpdate: null
  });
  const [loading, setLoading] = useState(true);

  const checkUpdates = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/check-updates`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUpdates({
            hasUnread: data.hasUnread || false,
            unreadCount: data.unreadCount || 0,
            lastUpdate: data.lastUpdate || null
          });
        }
      }
    } catch (error) {
      console.error('Failed to check support ticket updates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUpdates();

    // Poll every 30 seconds for updates
    const interval = setInterval(checkUpdates, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const markAsRead = async (ticketId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/mark-read/${ticketId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      // Refresh after marking as read
      await checkUpdates();
    } catch (error) {
      console.error('Failed to mark ticket as read:', error);
    }
  };

  return {
    ...updates,
    loading,
    refresh: checkUpdates,
    markAsRead
  };
}
