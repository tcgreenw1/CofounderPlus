import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Users, Send, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

interface SlackConnection {
  connected: boolean;
  team_name?: string;
  team_id?: string;
  user_id?: string;
  connected_at?: string;
}

interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_member: boolean;
  num_members?: number;
}

interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  channel: string;
  type: string;
  username?: string;
  reply_count?: number;
}

export default function SlackPage() {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<SlackConnection>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  useEffect(() => {
    if (connectionStatus.connected) {
      fetchChannels();
    }
  }, [connectionStatus.connected]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel);
    }
  }, [selectedChannel]);

  const checkConnectionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`${serverUrl}/slack/status`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data);
      }
    } catch (error) {
      console.error('Error checking Slack connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectToSlack = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`${serverUrl}/slack/auth/initiate`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Error initiating Slack OAuth:', error);
    }
  };

  const disconnectFromSlack = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`${serverUrl}/slack/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        setConnectionStatus({ connected: false });
        setChannels([]);
        setMessages([]);
        setSelectedChannel('');
      }
    } catch (error) {
      console.error('Error disconnecting from Slack:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`${serverUrl}/slack/channels`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
    }
  };

  const fetchMessages = async (channelId: string) => {
    setFetchingMessages(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`${serverUrl}/slack/messages/${channelId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching Slack messages:', error);
    } finally {
      setFetchingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChannel) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`${serverUrl}/slack/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: selectedChannel,
          text: messageText
        })
      });

      if (response.ok) {
        setMessageText('');
        // Refresh messages
        fetchMessages(selectedChannel);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8 pb-20 sm:pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/operations/hr')}
            variant="ghost"
            className="hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to HR
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-black flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-600" />
              Slack Integration
            </h1>
            <p className="text-gray-600 mt-2">
              Connect your Slack workspace to read and send messages through Cofounder
            </p>
          </div>
          {connectionStatus.connected && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>

        {/* Connection Status Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Manage your Slack workspace connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!connectionStatus.connected ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900">
                      Connect your Slack workspace to enable message reading and sending capabilities.
                      This will allow the Cofounder AGI to help manage your team communications.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={connectToSlack}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Connect to Slack
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">Workspace</p>
                    <p className="text-black mt-1">{connectionStatus.team_name}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">Connected Since</p>
                    <p className="text-black mt-1">
                      {connectionStatus.connected_at ? new Date(connectionStatus.connected_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={disconnectFromSlack}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disconnect Slack
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Interface */}
        {connectionStatus.connected && (
          <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                View and send messages to your Slack channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="channels" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/30">
                  <TabsTrigger value="channels">Channels</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="channels" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-black">Available Channels</h3>
                    <Button
                      onClick={fetchChannels}
                      variant="outline"
                      size="sm"
                      className="border-purple-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  <ScrollArea className="h-[400px] rounded-lg border border-purple-200 p-4">
                    {channels.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No channels found</p>
                    ) : (
                      <div className="space-y-2">
                        {channels.map((channel) => (
                          <div
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedChannel === channel.id
                                ? 'bg-purple-100 border-2 border-purple-400'
                                : 'bg-white border border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                <span className="text-black">#{channel.name}</span>
                              </div>
                              {channel.num_members && (
                                <Badge variant="outline" className="text-xs">
                                  {channel.num_members} members
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="messages" className="space-y-4 mt-4">
                  {!selectedChannel ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a channel to view messages</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-black">
                          #{channels.find(c => c.id === selectedChannel)?.name || 'Channel'}
                        </h3>
                        <Button
                          onClick={() => fetchMessages(selectedChannel)}
                          variant="outline"
                          size="sm"
                          disabled={fetchingMessages}
                          className="border-purple-300"
                        >
                          {fetchingMessages ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Refresh
                        </Button>
                      </div>

                      <ScrollArea className="h-[300px] rounded-lg border border-purple-200 p-4 bg-white">
                        {messages.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No messages found</p>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((message) => (
                              <div key={message.ts} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="text-sm text-purple-600">{message.username || message.user}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(parseFloat(message.ts) * 1000).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800">{message.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>

                      <div className="space-y-2">
                        <Textarea
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="resize-none border-purple-200"
                          rows={3}
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!messageText.trim() || sending}
                          className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Send Message
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}