import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Loader2, MessageSquare, Clock, CheckCircle, AlertCircle, Send, ArrowLeft, Plus, EyeOff, Eye } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import SupportModal from './SupportModal';

interface SupportMessage {
  id: string;
  content: string;
  sender: 'user' | 'admin' | 'system';
  senderEmail: string;
  timestamp: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
  messages?: SupportMessage[];
}

interface SupportPageProps {
  user: any;
}

export const SupportPage: React.FC<SupportPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefillData, setPrefillData] = useState<any>(null);
  
  // New state for filtering - Load from localStorage or default to true
  const [showResolvedTickets, setShowResolvedTickets] = useState(() => {
    const saved = localStorage.getItem('support_show_resolved_tickets');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [markingResolved, setMarkingResolved] = useState(false);

  // Check for message query parameter and auto-open create modal
  useEffect(() => {
    const messageParam = searchParams.get('message');
    if (messageParam) {
      const decodedMessage = decodeURIComponent(messageParam);
      setPrefillData({ message: decodedMessage });
      setShowCreateModal(true);
      // Remove the query parameter
      searchParams.delete('message');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check for prefill data from navigation state
  useEffect(() => {
    if (location.state?.prefillData) {
      setPrefillData(location.state.prefillData);
      setShowCreateModal(true);
      // Clear the location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Save preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('support_show_resolved_tickets', JSON.stringify(showResolvedTickets));
  }, [showResolvedTickets]);

  // Load user's tickets
  const loadTickets = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/support/user/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTickets(data.tickets || []);
        } else {
          setError(data.error || 'Failed to load tickets');
        }
      } else {
        setError('Failed to load support tickets');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  // Load specific ticket details
  const loadTicketDetails = async (ticketId: string) => {
    try {
      setLoadingTicket(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/support/ticket/${ticketId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedTicket(data.ticket);
        } else {
          setError(data.error || 'Failed to load ticket details');
        }
      } else {
        setError('Failed to load ticket details');
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoadingTicket(false);
    }
  };

  // Send reply to ticket
  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/support/ticket/${selectedTicket.id}/message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: replyMessage.trim(),
            senderEmail: user.email,
            isAdmin: false
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh ticket details
          await loadTicketDetails(selectedTicket.id);
          setReplyMessage('');
        } else {
          setError(data.error || 'Failed to send reply');
        }
      } else {
        setError('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setError('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Mark ticket as resolved
  const markTicketAsResolved = async () => {
    if (!selectedTicket) return;

    try {
      setMarkingResolved(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/support/ticket/${selectedTicket.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'resolved',
            userEmail: user.email
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the selected ticket status
          setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null);
          // Refresh the tickets list
          await loadTickets();
          setError('');
        } else {
          setError(data.error || 'Failed to mark ticket as resolved');
        }
      } else {
        setError('Failed to mark ticket as resolved');
      }
    } catch (error) {
      console.error('Error marking ticket as resolved:', error);
      setError('Failed to mark ticket as resolved');
    } finally {
      setMarkingResolved(false);
    }
  };

  // Filter tickets based on showResolvedTickets setting
  const filteredTickets = showResolvedTickets 
    ? tickets 
    : tickets.filter(ticket => ticket.status !== 'resolved' && ticket.status !== 'closed');

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, [user?.id]);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      'open': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: AlertCircle },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
      'waiting-for-user': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: MessageSquare },
      'resolved': { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
      'closed': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: CheckCircle }
    };

    const style = styles[status as keyof typeof styles] || styles.open;
    const IconComponent = style.icon;

    return (
      <Badge className={`${style.color} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    const styles = {
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'urgent': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };

    return (
      <Badge className={styles[priority as keyof typeof styles] || styles.medium}>
        {priority}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format type label
  const formatType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-muted-foreground">Loading support tickets...</span>
        </div>
      </div>
    );
  }

  // Ticket detail view
  if (selectedTicket) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedTicket(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tickets
            </Button>
            <h1 className="text-2xl font-bold">Support Ticket</h1>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {loadingTicket ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-muted-foreground">Loading ticket details...</span>
          </div>
        ) : (
          <>
            {/* Ticket Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>#{selectedTicket.id}</span>
                      <span>•</span>
                      <span>Created {formatDate(selectedTicket.createdAt)}</span>
                      <span>•</span>
                      <span>{formatType(selectedTicket.type)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTicket.messages?.map((message, index) => (
                  <div key={message.id} className="space-y-2">
                    <div className={`p-4 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 ml-4' 
                        : message.sender === 'admin'
                        ? 'bg-green-50 dark:bg-green-900/20 mr-4'
                        : 'bg-gray-50 dark:bg-gray-900/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={message.sender === 'user' ? 'default' : message.sender === 'admin' ? 'secondary' : 'outline'}>
                            {message.sender === 'user' ? 'You' : message.sender === 'admin' ? 'Support Team' : 'System'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                      </p>
                    </div>
                    {index < (selectedTicket.messages?.length || 0) - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Reply Section */}
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Reply</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={sendReply}
                        disabled={!replyMessage.trim() || sendingReply}
                        className="flex items-center gap-2"
                      >
                        {sendingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolve Ticket Section */}
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
              <Card>
                <CardHeader>
                  <CardTitle>Resolve Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={markTicketAsResolved}
                      disabled={markingResolved}
                      className="flex items-center gap-2"
                    >
                      {markingResolved ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark as Resolved
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  // Tickets list view
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Center</h1>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Controls */}
      {tickets.length > 0 && (
        <Card>
          <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              {/* Button-style toggle for better mobile UX */}
              <Button
                variant={showResolvedTickets ? "default" : "outline"}
                size="sm"
                onClick={() => setShowResolvedTickets(!showResolvedTickets)}
                className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
              >
                {showResolvedTickets ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span>{showResolvedTickets ? 'Hide' : 'Show'} resolved tickets</span>
              </Button>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Showing {filteredTickets.length} of {tickets.length} tickets
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Support Tickets</h3>
            <p className="text-muted-foreground mb-4">
              You haven't created any support tickets yet.
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => loadTicketDetails(ticket.id)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <h3 className="font-medium text-base sm:text-lg truncate">{ticket.subject}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="truncate">#{ticket.id.slice(0, 8)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{formatType(ticket.type)}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="hidden sm:inline">•</span>
                        <span>{ticket.messageCount} msg{ticket.messageCount !== 1 ? 's' : ''}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">Created {formatDate(ticket.createdAt)}</span>
                        <span className="sm:hidden text-[10px]">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Support Ticket Modal */}
      <SupportModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPrefillData(null);
          // Refresh tickets after creating a new one
          loadTickets();
        }}
        user={user}
        prefillData={prefillData}
      />
    </div>
  );
};

export default SupportPage;