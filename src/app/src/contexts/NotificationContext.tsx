import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  category?: 'marketing' | 'finance' | 'sales' | 'operations' | 'system';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  businessId?: string;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, businessId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch notifications from server
  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // User not logged in, clear notifications (this is expected and normal)
        setNotifications([]);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/list`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (!response.ok) {
        // Only log as error if it's not a 401 (which is expected when logged out)
        if (response.status !== 401) {
          console.error('Failed to fetch notifications:', response.status);
        }
        // Clear notifications on any error (including 401)
        setNotifications([]);
        return;
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.notifications)) {
        // Map ALL server notifications to local format
        // Include cofounder_notification, automation, etc. for the counter
        const mappedNotifications = data.notifications
          .map((n: any) => ({
            id: n.id,
            title: n.title || n.message,
            message: n.message,
            type: n.type || 'info',
            category: n.category,
            timestamp: n.createdAt || n.timestamp,
            read: n.status === 'read' || n.read || false,
            actionUrl: n.actionUrl,
            metadata: n
          }));
        
        setNotifications(mappedNotifications);
        console.log(`🔔 NotificationContext: Loaded ${mappedNotifications.length} notifications from server (${mappedNotifications.filter(n => !n.read).length} unread)`);
      }
    } catch (error: any) {
      // Only log genuine errors, not network interruptions/offline state which are common
      if (error?.message !== 'Failed to fetch' && error?.name !== 'TypeError') {
        console.error('❌ Error fetching notifications:', error);
      }
    }
  };

  // Initialize and fetch notifications on mount
  useEffect(() => {
    if (!isInitialized) {
      fetchNotifications();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100
  };

  const markAsRead = async (id: string) => {
    // Update local state immediately for responsive UI
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );

    // Persist to backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/${id}/mark-read`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            }
          }
        );

        if (!response.ok) {
          console.error('Failed to mark notification as read on server:', response.status);
        } else {
          console.log(`✅ Notification ${id} marked as read on server`);
        }
      }
    } catch (error) {
      console.error('❌ Error marking notification as read on server:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Update local state immediately for responsive UI
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );

    // Persist to backend for each unread notification
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const promises = unreadNotifications.map(notification =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/${notification.id}/mark-read`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              }
            }
          )
        );

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`✅ Marked ${successCount}/${unreadNotifications.length} notifications as read on server`);
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read on server:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    // Update local state immediately for responsive UI
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Persist to backend
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/${id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            }
          }
        );

        if (!response.ok) {
          console.error('Failed to delete notification on server:', response.status);
        } else {
          console.log(`✅ Notification ${id} deleted on server`);
        }
      }
    } catch (error) {
      console.error('❌ Error deleting notification on server:', error);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};