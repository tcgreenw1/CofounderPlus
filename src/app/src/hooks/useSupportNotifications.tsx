import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface SupportTicket {
  id: string;
  status: string;
  updatedAt: string;
  messages?: Array<{
    sender: 'user' | 'admin' | 'system';
    timestamp: string;
  }>;
}

/**
 * Hook to track unread support ticket updates
 * Counts tickets with admin replies or status changes that haven't been viewed
 */
export function useSupportNotifications(userId?: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const checkUnreadTickets = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setUnreadCount(0);
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/user-tickets`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            }
          }
        );

        if (!response.ok) {
          // Silent fail for auth/permission issues or server errors during polling
          return;
        }

        const data = await response.json();
        
        if (!data.success || !data.tickets) {
          return;
        }

        // Get last viewed timestamps from localStorage
        const lastViewedKey = `support_last_viewed_${userId}`;
        const lastViewed = JSON.parse(localStorage.getItem(lastViewedKey) || '{}');

        // Count tickets with updates since last view
        let count = 0;
        
        for (const ticket of data.tickets as SupportTicket[]) {
          const ticketLastViewed = lastViewed[ticket.id];
          const ticketUpdatedAt = new Date(ticket.updatedAt).getTime();
          
          // Skip if ticket hasn't been viewed yet (will be 0 on first load)
          if (!ticketLastViewed) {
            continue;
          }

          // Check if ticket was updated since last view
          if (ticketUpdatedAt > ticketLastViewed) {
            // Check if update was from admin/system (not user themselves)
            const hasAdminReply = ticket.messages?.some(msg => 
              (msg.sender === 'admin' || msg.sender === 'system') &&
              new Date(msg.timestamp).getTime() > ticketLastViewed
            );
            
            if (hasAdminReply) {
              count++;
            }
          }
        }

        setUnreadCount(count);
      } catch (error: any) {
        // Only log genuine errors, not network interruptions
        if (error?.message !== 'Failed to fetch' && error?.name !== 'TypeError') {
          console.error('Error checking support notifications:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkUnreadTickets();

    // Poll for updates every 30 seconds
    intervalId = setInterval(checkUnreadTickets, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userId]);

  // Function to mark a ticket as viewed
  const markTicketAsViewed = (ticketId: string) => {
    if (!userId) return;
    
    const lastViewedKey = `support_last_viewed_${userId}`;
    const lastViewed = JSON.parse(localStorage.getItem(lastViewedKey) || '{}');
    lastViewed[ticketId] = Date.now();
    localStorage.setItem(lastViewedKey, JSON.stringify(lastViewed));
    
    // Recalculate unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Function to mark all tickets as viewed
  const markAllAsViewed = (tickets: SupportTicket[]) => {
    if (!userId) return;
    
    const lastViewedKey = `support_last_viewed_${userId}`;
    const lastViewed: Record<string, number> = {};
    const now = Date.now();
    
    tickets.forEach(ticket => {
      lastViewed[ticket.id] = now;
    });
    
    localStorage.setItem(lastViewedKey, JSON.stringify(lastViewed));
    setUnreadCount(0);
  };

  return {
    unreadCount,
    loading,
    markTicketAsViewed,
    markAllAsViewed
  };
}
