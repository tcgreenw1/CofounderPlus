import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useBusiness } from './BusinessContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Bell, 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  Bot, 
  Sparkles, 
  ExternalLink,
  ListTodo,
  AlertTriangle,
  TrendingUp,
  Megaphone,
  DollarSign,
  ShoppingCart,
  Briefcase,
  Zap,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { getSupabaseClient } from '../utils/supabase/client';
import { NotificationSettings } from './NotificationSettings';

interface TeamInvitationNotification {
  id: string;
  type: 'team_invitation';
  fromUserId: string;
  fromUserEmail: string;
  fromUserName: string;
  organizationId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt: string;
  email: string;
}

interface CofounderNotification {
  id: string;
  type: 'cofounder_notification' | 'renewal_reminder' | 'renewal_success' | 'payment_failed' | 'subscription_cancelled' | 'credits_renewed' | 'credits_rollover' | 'subscription';
  businessId?: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'task' | 'deadline' | 'insight' | 'warning' | 'achievement' | 'marketing' | 'finance' | 'sales' | 'operations' | 'subscription';
  actionUrl?: string;
  actionLabel?: string;
  status: 'unread' | 'read';
  read?: boolean;
  createdAt?: string;
  timestamp?: string;
  expiresAt?: string;
  data?: any;
}

interface AutomationNotification {
  id: string;
  type: 'automation_run' | 'automation_completed' | 'roadmap_refresh';
  businessId: string;
  automationId?: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general';
  status: 'running' | 'unread' | 'read';
  actionUrl?: string;
  actionLabel?: string;
  resultKey?: string;
  creditsUsed?: number;
  insights?: any;
  createdAt: string;
  expiresAt: string;
  updatedAt?: string;
}

type Notification = TeamInvitationNotification | CofounderNotification | AutomationNotification;

export function NotificationsPage() {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const { 
    notifications: localNotifications, 
    markAsRead: markLocalAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications 
  } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Pagination state
  const [pendingPage, setPendingPage] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.access_token) {
        console.error('No session found for notifications');
        setLoading(false);
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

      const data = await response.json();
      console.log('Notifications response:', data);

      if (response.ok && data.success) {
        setNotifications(data.notifications || []);
        // Also refresh the context to update the counter
        await refreshNotifications();
      } else {
        console.error('Failed to load notifications:', data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (notificationId: string) => {
    setProcessingId(notificationId);
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
        toast.success('Invitation accepted! Refreshing...');
        await loadNotifications();
        
        // Reload page to refresh with new organization context
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        toast.error(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('An error occurred while accepting the invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvitation = async (notificationId: string) => {
    setProcessingId(notificationId);
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
      setProcessingId(null);
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Optimistically update local state immediately for responsive UI
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, status: 'read' as const } : n
        )
      );

      // Also refresh the context to update the counter in the nav
      await refreshNotifications();

      // Call backend to persist
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/${notificationId}/mark-read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        console.log('✅ Notification marked as read:', notificationId);
        // Don't reload - we already updated the local state optimistically
      } else {
        // If backend failed, revert the optimistic update
        console.error('❌ Failed to mark notification as read on server');
        await loadNotifications();
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Revert on error
      await loadNotifications();
    }
  };

  const handleNotificationAction = (notification: CofounderNotification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      handleMarkAsRead(notification.id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'task': return ListTodo;
      case 'deadline': return Clock;
      case 'insight': return Sparkles;
      case 'warning': return AlertTriangle;
      case 'achievement': return TrendingUp;
      case 'marketing': return Megaphone;
      case 'finance': return DollarSign;
      case 'sales': return ShoppingCart;
      case 'operations': return Briefcase;
      case 'subscription': return CreditCard;
      default: return Bot;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'task': return '#2b7fff';
      case 'deadline': return '#ffe020';
      case 'insight': return '#6c5ce7';
      case 'warning': return '#ff4f50';
      case 'achievement': return '#00a73d';
      case 'marketing': return '#6CFF6C';
      case 'finance': return '#00E0FF';
      case 'sales': return '#FFCF00';
      case 'subscription': return 'var(--primary)';
      case 'operations': return '#9333EA';
      default: return '#6c5ce7';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return { label: 'Urgent', color: '#ff4f50' };
      case 'high': return { label: 'High', color: '#ffe020' };
      case 'normal': return { label: 'Normal', color: '#2b7fff' };
      case 'low': return { label: 'Low', color: 'var(--muted-foreground)' };
      default: return { label: 'Normal', color: '#2b7fff' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return TrendingUp;
      case 'info': return Sparkles;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      default: return Sparkles;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return '#00a73d';
      case 'info': return '#2b7fff';
      case 'warning': return '#ffe020';
      case 'error': return '#ff4f50';
      default: return '#2b7fff';
    }
  };

  const pendingNotifications = notifications.filter(n => 
    n.type === 'team_invitation' && n.status === 'pending'
  );
  
  // Only show UNREAD notifications (filter out anything marked as read)
  const activityNotifications = notifications.filter(n => {
    // Exclude team invitations (they have their own section)
    if (n.type === 'team_invitation') return false;
    
    // ONLY include unread or running notifications
    // Support both status field and read boolean
    const isUnread = n.status === 'unread' || n.status === 'running' || (n.read === false);
    return isUnread;
  });

  if (loading) {
    return (
      <div className="p-6">
        <Card style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <CardContent className="p-8 text-center">
            <p style={{ color: 'var(--color-muted-foreground)' }}>Loading notifications...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="flex items-center gap-3">
            <Bell className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
            <span>Notifications</span>
          </h1>
          <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
            {activityNotifications.length > 0 && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Update local state optimistically
                    setNotifications(prev => 
                      prev.map(n => ({ ...n, status: 'read' as const }))
                    );

                    // Call the backend once to mark all as read
                    const { data: { session } } = await getSupabaseClient().auth.getSession();
                    if (!session?.access_token) {
                      toast.error('Please sign in to continue');
                      return;
                    }

                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/mark-all-read`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                        }
                      }
                    );

                    if (response.ok) {
                      const data = await response.json();
                      toast.success(`${data.count} notifications marked as read`);
                      // Refresh context to update counter
                      await refreshNotifications();
                    } else {
                      toast.error('Failed to mark notifications as read');
                      // Revert on error
                      await loadNotifications();
                    }
                  } catch (error) {
                    console.error('Error marking all as read:', error);
                    toast.error('An error occurred');
                    await loadNotifications();
                  }
                }}
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)'
                }}
              >
                <Check className="w-4 h-4" />
                Mark All as Read
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}
            >
              <Settings className="w-4 h-4" />
              {showSettings ? 'Hide Settings' : 'Settings'}
            </Button>
          </div>
        </div>
        <p style={{ color: 'var(--color-muted-foreground)' }}>
          {showSettings ? 'Manage your notification preferences' : 'Team invitations and important updates'}
        </p>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6">
          <NotificationSettings />
        </div>
      )}

      {/* Only show notifications list if not in settings mode */}
      {!showSettings && (
        <>

      {/* Pending Invitations */}
      {pendingNotifications.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 flex items-center gap-2">
            Pending Invitations
            <Badge 
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              {pendingNotifications.length}
            </Badge>
          </h2>
          
          <div className="space-y-3">
            {pendingNotifications.slice(pendingPage * ITEMS_PER_PAGE, (pendingPage + 1) * ITEMS_PER_PAGE).map((notification) => (
              <Card 
                key={notification.id}
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: 'var(--color-primary)',
                  borderWidth: '2px'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="p-3 rounded-xl flex-shrink-0"
                      style={{
                        backgroundColor: 'var(--color-primary-soft)',
                      }}
                    >
                      <UserPlus 
                        className="w-6 h-6" 
                        style={{ color: 'var(--color-primary)' }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1">
                        Team Invitation
                      </h3>
                      <p className="mb-3" style={{ color: 'var(--color-foreground)' }}>
                        <span style={{ color: 'var(--color-primary)' }}>
                          {notification.fromUserName}
                        </span>
                        {' '}
                        (<span style={{ color: 'var(--color-muted-foreground)' }}>{notification.fromUserEmail}</span>)
                        {' '}invited you to join their team
                      </p>
                      
                      {/* Time */}
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAcceptInvitation(notification.id)}
                          disabled={processingId === notification.id}
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                          }}
                          className="hover:opacity-90 transition-opacity"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Invitation
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeclineInvitation(notification.id)}
                          disabled={processingId === notification.id}
                          style={{
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-muted-foreground)',
                          }}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingNotifications.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center items-center mt-4" style={{ gap: 'var(--spacing-2)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingPage(pendingPage - 1)}
                  disabled={pendingPage === 0}
                  style={{
                    borderColor: 'var(--border)',
                    color: pendingPage === 0 ? 'var(--muted-foreground)' : 'var(--foreground)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span style={{ 
                  color: 'var(--muted-foreground)', 
                  fontSize: '0.875rem',
                  padding: '0 var(--spacing-2)'
                }}>
                  {pendingPage + 1} / {Math.ceil(pendingNotifications.length / ITEMS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingPage(pendingPage + 1)}
                  disabled={pendingPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE >= pendingNotifications.length}
                  style={{
                    borderColor: 'var(--border)',
                    color: pendingPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE >= pendingNotifications.length ? 'var(--muted-foreground)' : 'var(--foreground)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Updates - Consolidated Section */}
      {activityNotifications.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 flex items-center" style={{ gap: 'var(--spacing-2)' }}>
            <Zap className="w-5 h-5" style={{ color: '#667eea' }} />
            Activity Updates
            <Badge 
              style={{ 
                backgroundColor: 'rgba(102, 126, 234, 0.15)',
                color: '#667eea',
                borderColor: 'rgba(102, 126, 234, 0.3)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              {activityNotifications.length}
            </Badge>
          </h2>
          
          {/* Multi-column grid layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 'var(--spacing-3)'
          }}>
            {activityNotifications.slice(activityPage * ITEMS_PER_PAGE, (activityPage + 1) * ITEMS_PER_PAGE).map((notification) => {
              const cofounderNotif = notification as CofounderNotification;
              const CategoryIcon = getCategoryIcon(cofounderNotif.category);
              const categoryColor = getCategoryColor(cofounderNotif.category);
              
              return (
                <Card 
                  key={cofounderNotif.id}
                  className="transition-all hover:shadow-md cursor-pointer"
                  onClick={() => cofounderNotif.actionUrl && handleNotificationAction(cofounderNotif)}
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: categoryColor,
                    borderWidth: '1px',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <CardContent style={{ padding: 'var(--spacing-3)' }}>
                    <div className="flex items-start" style={{ gap: 'var(--spacing-2)' }}>
                      {/* Icon */}
                      <div
                        className="rounded flex-shrink-0"
                        style={{
                          padding: 'var(--spacing-2)',
                          backgroundColor: `${categoryColor}15`,
                        }}
                      >
                        <CategoryIcon 
                          className="w-4 h-4" 
                          style={{ color: categoryColor }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 style={{ 
                          marginBottom: 'var(--spacing-1)',
                          fontSize: '0.875rem'
                        }}>
                          {cofounderNotif.title}
                        </h4>
                        
                        <p style={{ 
                          color: 'var(--muted-foreground)',
                          marginBottom: 'var(--spacing-2)',
                          fontSize: '0.8125rem',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {cofounderNotif.message}
                        </p>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span style={{ 
                            color: 'var(--muted-foreground)',
                            fontSize: '0.75rem'
                          }}>
                            {formatTimeAgo(cofounderNotif.createdAt || cofounderNotif.timestamp || new Date().toISOString())}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(cofounderNotif.id);
                            }}
                            style={{
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              height: 'auto',
                              fontSize: '0.75rem',
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {activityNotifications.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center items-center mt-4" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivityPage(activityPage - 1)}
                disabled={activityPage === 0}
                style={{
                  borderColor: 'var(--border)',
                  color: activityPage === 0 ? 'var(--muted-foreground)' : 'var(--foreground)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span style={{ 
                color: 'var(--muted-foreground)', 
                fontSize: '0.875rem',
                padding: '0 var(--spacing-2)'
              }}>
                {activityPage + 1} / {Math.ceil(activityNotifications.length / ITEMS_PER_PAGE)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivityPage(activityPage + 1)}
                disabled={activityPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE >= activityNotifications.length}
                style={{
                  borderColor: 'var(--border)',
                  color: activityPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE >= activityNotifications.length ? 'var(--muted-foreground)' : 'var(--foreground)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {(pendingNotifications.length === 0 && activityNotifications.length === 0) && (
        <Card style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <CardContent className="p-12 text-center">
            <Bell 
              className="w-16 h-16 mx-auto mb-4 opacity-30" 
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <h3 className="mb-2">No notifications</h3>
            <p style={{ color: 'var(--color-muted-foreground)' }}>
              You're all caught up! You'll see team invitations and updates here.
            </p>
          </CardContent>
        </Card>
      )}
      </>
      )}
    </div>
  );
}