import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, MessageSquare, Send, User, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface ChatSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'active' | 'resolved';
  startedAt: string;
  lastActivity: string;
  messagesCount: number;
  lastMessage?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  senderName?: string;
}

export function SupportChatManager() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active sessions
  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/chat/list`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected session
  const loadMessages = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/chat/history?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 15000); // Poll list every 15s
    return () => clearInterval(interval);
  }, []);

  // Poll messages when session selected
  useEffect(() => {
    if (!selectedSessionId) return;
    
    loadMessages(selectedSessionId);
    const interval = setInterval(() => loadMessages(selectedSessionId), 3000); // Poll messages every 3s
    
    return () => clearInterval(interval);
  }, [selectedSessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedSessionId || !replyMessage.trim()) return;
    
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          message: replyMessage,
          role: 'agent',
          senderName: 'Support Agent' // Or current admin name
        })
      });

      if (response.ok) {
        setReplyMessage('');
        loadMessages(selectedSessionId); // Refresh immediately
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleResolveSession = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/chat/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          sessionId,
          status: 'resolved'
        })
      });

      if (response.ok) {
        toast.success('Session marked as resolved');
        loadSessions();
      }
    } catch (error) {
      console.error('Error resolving session:', error);
    }
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-card">
      {/* Sessions List */}
      <div className="w-1/3 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b flex justify-between items-center bg-card">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Active Chats
          </h3>
          <Button variant="ghost" size="icon" onClick={loadSessions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No active chat sessions
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedSessionId === session.id ? 'bg-muted border-l-4 border-l-primary' : ''
                }`}
                onClick={() => setSelectedSessionId(session.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{session.userName || 'Guest'}</span>
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {session.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate mb-2">
                  {session.lastMessage || 'No messages yet'}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(session.lastActivity).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-card">
        {selectedSessionId ? (
          <>
            <div className="p-4 border-b flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {sessions.find(s => s.id === selectedSessionId)?.userName}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({sessions.find(s => s.id === selectedSessionId)?.userEmail})
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleResolveSession(selectedSessionId)}
              >
                <CheckCircle className="w-4 h-4" /> Resolve
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground mt-8">No messages</div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'agent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border'
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                      <div className="text-[10px] opacity-70 mt-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Input
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a reply..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={sending || !replyMessage.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat session to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
