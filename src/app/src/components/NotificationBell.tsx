import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, UserPlus, Clock, Megaphone, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { getSupabaseClient } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Notification {
  id: string;
  type: 'team_invitation' | 'marketing' | 'info' | 'success';
  fromUserId?: string;
  fromUserEmail?: string;
  fromUserName?: string;
  organizationId?: string;
  status: 'pending' | 'accepted' | 'declined' | 'unread' | 'read';
  createdAt: string;
  expiresAt: string;
  email?: string;
  title?: string;
  message?: string;
  category?: string;
}

interface NotificationBellProps {
  user: any;
  onOrganizationChanged?: () => void;
}

export function NotificationBell({ user, onOrganizationChanged }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/list`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleAcceptInvitation = async (notificationId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/accept-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notificationId })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Invitation accepted! You now have access to this organization.');
        await loadNotifications();
        
        // Notify parent component to refresh
        if (onOrganizationChanged) {
          onOrganizationChanged();
        }
      } else {
        toast.error(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('An error occurred while accepting the invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvitation = async (notificationId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/decline-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notificationId })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Invitation declined');
        await loadNotifications();
      } else {
        toast.error(data.error || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('An error occurred while declining the invitation');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-all duration-200 hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-muted)',
        }}
        aria-label="Notifications"
      >
        <Bell 
          className="w-5 h-5" 
          style={{ color: 'var(--color-foreground)' }}
        />
        {pendingCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs rounded-full"
            style={{
              backgroundColor: 'var(--color-destructive)',
              color: 'white',
            }}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3"
            style={{
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h3 className="font-semibold">Notifications</h3>
            {pendingCount > 0 && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                You have {pendingCount} pending {pendingCount === 1 ? 'invitation' : 'invitations'}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell 
                  className="w-12 h-12 mx-auto mb-3 opacity-30" 
                  style={{ color: 'var(--color-muted-foreground)' }}
                />
                <p style={{ color: 'var(--color-muted-foreground)' }}>
                  No notifications
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => {
                  // Determine icon and colors based on notification type
                  let Icon = UserPlus;
                  let iconColor = 'var(--color-primary)';
                  let iconBg = 'var(--color-primary-soft)';
                  
                  if (notification.type === 'marketing' || notification.category === 'marketing') {
                    Icon = Megaphone;
                    iconColor = 'var(--success)';
                    iconBg = 'var(--success-soft)';
                  } else if (notification.type === 'success') {
                    Icon = CheckCircle;
                    iconColor = 'var(--success)';
                    iconBg = 'var(--success-soft)';
                  }
                  
                  return (
                  <div
                    key={notification.id}
                    className="px-4 py-3 transition-colors"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: notification.status === 'pending' || notification.status === 'unread'
                        ? 'var(--color-muted)' 
                        : 'transparent',
                    }}
                  >
                    {/* Notification Icon */}
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg mt-0.5"
                        style={{
                          backgroundColor: iconBg,
                        }}
                      >
                        <Icon 
                          className="w-4 h-4" 
                          style={{ color: iconColor }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Notification Content */}
                        {notification.type === 'team_invitation' ? (
                          <p className="text-sm">
                            <span style={{ color: 'var(--color-primary)' }}>
                              {notification.fromUserName}
                            </span>
                            {' '}invited you to join their team
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                              {notification.message}
                            </p>
                          </>
                        )}
                        
                        {/* Time */}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" style={{ color: 'var(--color-muted-foreground)' }} />
                          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>

                        {/* Action Buttons for Team Invitations */}
                        {notification.type === 'team_invitation' && notification.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInvitation(notification.id)}
                              disabled={loading}
                              style={{
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                              }}
                              className="hover:opacity-90 transition-opacity"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineInvitation(notification.id)}
                              disabled={loading}
                              style={{
                                borderColor: 'var(--color-border)',
                                color: 'var(--color-muted-foreground)',
                              }}
                              className="hover:opacity-80 transition-opacity"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {/* Status Badge */}
                        {notification.status === 'accepted' && (
                          <Badge 
                            variant="outline" 
                            className="mt-2 text-xs"
                            style={{
                              backgroundColor: 'var(--color-success-soft)',
                              color: 'var(--color-success)',
                              borderColor: 'var(--color-success)',
                            }}
                          >
                            Accepted
                          </Badge>
                        )}
                        {notification.status === 'declined' && (
                          <Badge 
                            variant="outline" 
                            className="mt-2 text-xs"
                            style={{
                              backgroundColor: 'var(--color-muted)',
                              color: 'var(--color-muted-foreground)',
                              borderColor: 'var(--color-border)',
                            }}
                          >
                            Declined
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}