import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell, Hash, AtSign, Smile, FileUp, MessageCircle, ExternalLink,
  Loader2, CheckCircle, Brain, AlertCircle, Clipboard, RefreshCw, Filter, Sparkles
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useBusiness } from '../BusinessContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface SlackNotification {
  id: string;
  source: string; // Channel or DM name
  type: 'message' | 'mention' | 'reaction' | 'file_upload' | 'thread_reply';
  preview: string;
  sender: string;
  senderAvatar?: string;
  received: string;
  status: 'unread' | 'acknowledged' | 'actioned';
  channelId: string;
  timestamp: string;
}

interface SlackConnection {
  connected: boolean;
  workspace_name?: string;
  workspace_icon?: string;
  user_id?: string;
  access_token?: string;
}

interface HRNotificationsProps {
  user?: any;
  userData?: any;
}

export function HRNotifications({ user, userData }: HRNotificationsProps) {
  const { selectedBusiness } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notifications, setNotifications] = useState<SlackNotification[]>([]);
  const [slackConnection, setSlackConnection] = useState<SlackConnection>({ connected: false });
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [channels, setChannels] = useState<any[]>([]);
  
  // AGI Automation toggles
  const [autoSummarize, setAutoSummarize] = useState(false);
  const [detectIssues, setDetectIssues] = useState(false);
  const [convertToTasks, setConvertToTasks] = useState(false);

  useEffect(() => {
    if (selectedBusiness && user) {
      loadSlackConnection();
    }
  }, [selectedBusiness, user]);

  useEffect(() => {
    if (slackConnection.connected) {
      loadChannels();
    }
  }, [slackConnection.connected]);

  useEffect(() => {
    if (channels.length > 0) {
      loadNotifications();
    }
  }, [channels]);

  const loadSlackConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/slack/connection-status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSlackConnection({
          connected: data.connected,
          workspace_name: data.workspace_name,
          workspace_icon: data.workspace_icon,
          user_id: data.user_id
        });
      }
    } catch (error) {
      console.error('Error loading Slack connection:', error);
    }
  };

  const loadChannels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/slack/channels`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Load messages from all channels and convert to notifications
      const allNotifications: SlackNotification[] = [];

      for (const channel of channels.slice(0, 5)) { // Limit to first 5 channels
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/slack/messages/${channel.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || [];

          // Convert messages to notifications
          messages.forEach((msg: any) => {
            allNotifications.push({
              id: msg.ts || `${Date.now()}-${Math.random()}`,
              source: `#${channel.name}`,
              type: msg.text?.includes(`<@`) ? 'mention' : 'message',
              preview: msg.text || '',
              sender: msg.user || 'Unknown',
              received: msg.ts || new Date().toISOString(),
              status: 'unread',
              channelId: channel.id,
              timestamp: msg.ts || new Date().toISOString()
            });
          });
        }
      }

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    toast.info('🔄 Syncing Slack notifications...');
    await loadChannels();
    await loadNotifications();
    setSyncing(false);
    toast.success('✅ Notifications synced successfully');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'acknowledged' })));
    toast.success('All notifications marked as read');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4" />;
      case 'reaction':
        return <Smile className="w-4 h-4" />;
      case 'file_upload':
        return <FileUp className="w-4 h-4" />;
      case 'thread_reply':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'acknowledged':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'actioned':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = Date.now();
    const then = parseFloat(timestamp) * 1000;
    const diff = now - then;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const filteredNotifications = filterChannel === 'all'
    ? notifications
    : notifications.filter(n => n.channelId === filterChannel);

  if (!slackConnection.connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Bell className="w-24 h-24 text-gray-300 dark:text-gray-600" />
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
                  >
                    <span style={{ fontSize: '0.75rem' }}>💤</span>
                  </motion.div>
                </div>
              </div>
              <h3 
                className="font-bold text-gray-900 dark:text-white mb-2"
                style={{ fontSize: '1.5rem' }}
              >
                No notifications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Stay tuned for updates from your team.
              </p>
              <Button
                onClick={() => window.location.href = '/operations/hr/slack'}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
              >
                Connect Slack to Get Started
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Slack Connection Header */}
      <Card 
        className="border-0 shadow-xl"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <CardHeader 
          className="p-6"
          style={{
            padding: 'var(--spacing-6)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 'var(--spacing-4)' }}>
              <div 
                className="p-3 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-primary-soft)',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-xl)',
                }}
              >
                <MessageCircle className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <CardTitle style={{ color: 'var(--color-foreground)' }}>Slack Notifications</CardTitle>
                <CardDescription className="mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  Connected to <strong>{slackConnection.workspace_name}</strong>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-primary-soft)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <MessageCircle className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notifications Table */}
      <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-white/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>
                <h3 style={{ fontSize: '1.125rem' }}>Team Notifications</h3>
              </CardTitle>
              <CardDescription>Recent activity from your Slack workspace</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-[180px] bg-white/50 dark:bg-white/10 border-white/20">
                  <SelectValue placeholder="Filter by channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="bg-white/50 dark:bg-white/10 border-white/20"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={syncNow}
                disabled={syncing}
                className="bg-white/50 dark:bg-white/10 border-white/20"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No notifications found
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white/80 dark:bg-white/10 backdrop-blur-sm z-10">
                  <TableRow>
                    <TableHead className="w-[180px]">Source</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead className="w-[150px]">Sender</TableHead>
                    <TableHead className="w-[100px]">Received</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification, index) => (
                    <motion.tr
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors border-b border-white/10"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          <span style={{ fontSize: '0.875rem' }}>{notification.source}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-gray-700 dark:text-gray-300 truncate" style={{ fontSize: '0.875rem' }}>
                          {notification.preview}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center text-white"
                            style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'var(--font-weight-bold)' 
                            }}
                          >
                            {notification.sender.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.875rem' }}>{notification.sender}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.875rem' }}>
                        {getRelativeTime(notification.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-white/50 dark:hover:bg-white/10"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cofounder AGI Automation Panel */}
      <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-950/20 dark:to-cyan-950/20 border border-purple-200/50 dark:border-purple-800/30 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-b border-purple-200/30 dark:border-purple-800/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>
                <h3 style={{ fontSize: '1.125rem' }}>Smart Actions by Cofounder AGI</h3>
              </CardTitle>
              <CardDescription className="mt-1" style={{ fontSize: '0.875rem' }}>
                Automate Slack follow-ups, summaries, and HR workflows
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Auto-Summarize */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-start justify-between p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/40 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clipboard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Auto-Summarize Daily HR Mentions
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.875rem' }}>
                    Automatically compile all HR-related Slack mentions into a daily summary on your HR Notes board
                  </p>
                </div>
              </div>
              <Switch
                checked={autoSummarize}
                onCheckedChange={setAutoSummarize}
                className="mt-1"
              />
            </motion.div>

            {/* Detect Issues */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-start justify-between p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/40 dark:border-white/10 hover:border-orange-300 dark:hover:border-orange-700 transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Detect Employee Issues
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.875rem' }}>
                    Use AI to analyze tone and keywords in Slack messages, flagging potential employee concerns in the HR dashboard
                  </p>
                </div>
              </div>
              <Switch
                checked={detectIssues}
                onCheckedChange={setDetectIssues}
                className="mt-1"
              />
            </motion.div>

            {/* Convert to Tasks */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-start justify-between p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/40 dark:border-white/10 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Convert Feedback into Tasks
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.875rem' }}>
                    Automatically transform Slack feedback and action items into trackable tasks in the Performance To-Do list
                  </p>
                </div>
              </div>
              <Switch
                checked={convertToTasks}
                onCheckedChange={setConvertToTasks}
                className="mt-1"
              />
            </motion.div>
          </div>

          {(autoSummarize || detectIssues || convertToTasks) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 rounded-xl border border-purple-300/50 dark:border-purple-700/30"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <p 
                  className="font-medium text-gray-900 dark:text-white"
                  style={{ fontSize: '0.875rem' }}
                >
                  {[autoSummarize, detectIssues, convertToTasks].filter(Boolean).length} automation{[autoSummarize, detectIssues, convertToTasks].filter(Boolean).length > 1 ? 's' : ''} active
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}