import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Bell, 
  Send, 
  CheckCircle, 
  Clock, 
  Users, 
  Smartphone,
  Apple,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt: string;
  sentBy: string;
  recipients: 'all' | 'specific';
  recipientIds?: string[];
  status: 'sent' | 'scheduled';
}

interface DeviceStats {
  total: number;
  ios: number;
  android: number;
}

export const NotificationManagement: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    loadNotificationHistory();
    loadDeviceStats();
  }, []);

  const loadNotificationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/history`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to load history');
      }

      const data = await response.json();
      setHistory(data.notifications || []);
    } catch (error: any) {
      console.error('Error loading notification history:', error);
      toast.error(error.message || 'Failed to load notification history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadDeviceStats = async () => {
    setIsLoadingStats(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/device-count`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load device stats');
      }

      const data = await response.json();
      setDeviceStats(data);
    } catch (error: any) {
      console.error('Error loading device stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            recipients: 'all',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to send notification');
      }

      const data = await response.json();
      toast.success(`Notification sent to ${data.recipientCount} devices`);

      // Clear form
      setTitle('');
      setBody('');

      // Refresh history
      loadNotificationHistory();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">
          <Bell className="inline-block w-8 h-8 mr-2 text-primary" />
          Push Notifications
        </h1>
        <p className="text-muted-foreground">
          Send notifications to all app users via Apple Push Notification Service
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">
              {isLoadingStats ? '...' : (deviceStats?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Apple className="w-4 h-4 text-foreground" />
              iOS Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">
              {isLoadingStats ? '...' : (deviceStats?.ios || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-success" />
              Notifications Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{history.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send New Notification</CardTitle>
          <CardDescription>
            Compose and send a push notification to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Feature Available!"
              maxLength={50}
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/50 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g., Check out the new roadmap features we just launched!"
              maxLength={200}
              rows={4}
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/200 characters
            </p>
          </div>

          <Alert>
            <Bell className="w-4 h-4" />
            <AlertDescription>
              This notification will be sent to all registered devices ({deviceStats?.total || 0} total).
              Make sure your message is clear and actionable.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSendNotification}
            disabled={isSending || !title.trim() || !body.trim()}
            className="w-full bg-primary text-primary-foreground bouncy-button"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Previously sent push notifications
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadNotificationHistory}
              disabled={isLoadingHistory}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications sent yet
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((notification) => (
                <div
                  key={notification.id}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                    <Badge
                      variant={notification.status === 'sent' ? 'default' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {notification.status === 'sent' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {notification.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(notification.sentAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {notification.recipients === 'all' ? 'All users' : 'Specific users'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
