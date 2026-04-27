import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { 
  Loader2, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  ArrowLeft,
  Users,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserCheck,
  Archive,
  Trash2,
  Plus,
  Download,
  Settings,
  Eye,
  MessageCircle
} from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

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
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
  assignedTo?: string;
  messages?: SupportMessage[];
  tags?: string[];
}

interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  waitingForUser: number;
  resolved: number;
  closed: number;
  byType: Record<string, number>;
  avgResponseTime: number;
  ticketsToday: number;
  ticketsThisWeek: number;
}

interface AdminSupportDashboardProps {
  user: any;
  isSigningOut?: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export const AdminSupportDashboard: React.FC<AdminSupportDashboardProps> = ({ user, isSigningOut = false }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  });
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Check if user is admin
  const isAdmin = user?.email === 'tylerg@cofounderplus.com' || user?.email === 'admin@cofounderplus.com';

  // Load all tickets with pagination and filters (admin only)
  const loadTickets = useCallback(async (page = 1, showLoading = true) => {
    if (!isAdmin) {
      setError('Access denied: Admin privileges required');
      return;
    }

    // Don't load data if signing out
    if (isSigningOut) {
      console.log('🔄 Skipping support tickets load because user is signing out');
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        if (!isSigningOut) {
          setError('Authentication required');
        }
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        adminEmail: user.email,
        sortBy,
        sortOrder
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (assigneeFilter !== 'all') params.append('assignee', assigneeFilter);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/admin/all?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'x-admin-email': user.email
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTickets(data.tickets || []);
          setStats(data.stats || null);
          setPagination(data.pagination || pagination);
          setLastRefresh(new Date());
          setError('');
        } else {
          setError(data.error || 'Failed to load tickets');
        }
      } else {
        setError('Failed to load support tickets');
      }
    } catch (error) {
      if (!isSigningOut) {
        console.error('Error loading tickets:', error);
        setError('Failed to load support tickets');
        toast.error('Failed to load support tickets');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isAdmin, user?.email, pagination.itemsPerPage, searchQuery, statusFilter, typeFilter, priorityFilter, assigneeFilter, sortBy, sortOrder]);

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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/ticket/${ticketId}`,
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
          setError('');
        } else {
          setError(data.error || 'Failed to load ticket details');
          toast.error('Failed to load ticket details');
        }
      } else {
        setError('Failed to load ticket details');
        toast.error('Failed to load ticket details');
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      setError('Failed to load ticket details');
      toast.error('Failed to load ticket details');
    } finally {
      setLoadingTicket(false);
    }
  };

  // Send admin reply to ticket
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
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/ticket/${selectedTicket.id}/message`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: replyMessage.trim(),
            senderEmail: user.email,
            isAdmin: true
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh ticket details
          await loadTicketDetails(selectedTicket.id);
          setReplyMessage('');
          // Refresh main ticket list
          loadTickets(pagination.currentPage, false);
          toast.success('Reply sent successfully');
        } else {
          setError(data.error || 'Failed to send reply');
          toast.error('Failed to send reply');
        }
      } else {
        setError('Failed to send reply');
        toast.error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setError('Failed to send reply');
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (status: string, ticketId?: string) => {
    const targetTicket = ticketId ? tickets.find(t => t.id === ticketId) : selectedTicket;
    if (!targetTicket) return;

    try {
      setUpdatingStatus(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/ticket/${targetTicket.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status,
            adminEmail: user.email
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (selectedTicket && selectedTicket.id === targetTicket.id) {
            await loadTicketDetails(targetTicket.id);
          }
          loadTickets(pagination.currentPage, false);
          toast.success('Status updated successfully');
        } else {
          setError(data.error || 'Failed to update status');
          toast.error('Failed to update status');
        }
      } else {
        setError('Failed to update ticket status');
        toast.error('Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update ticket status');
      toast.error('Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Bulk update selected tickets
  const bulkUpdateStatus = async (status: string) => {
    if (selectedTicketIds.size === 0) return;

    try {
      setUpdatingStatus(true);
      const promises = Array.from(selectedTicketIds).map(ticketId => 
        updateTicketStatus(status, ticketId)
      );
      
      await Promise.all(promises);
      setSelectedTicketIds(new Set());
      setShowBulkActions(false);
      toast.success(`Updated ${selectedTicketIds.size} tickets`);
    } catch (error) {
      console.error('Error bulk updating:', error);
      toast.error('Failed to update tickets');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Generate test tickets for development
  const generateTestTickets = async () => {
    if (!confirm('Generate 50 test tickets? This will help test the system with sample data.')) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/support/admin/generate-test-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'x-admin-email': user.email
          },
          body: JSON.stringify({ count: 50 })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Test tickets generated successfully');
          loadTickets(1);
        } else {
          toast.error(data.error || 'Failed to generate test tickets');
        }
      } else {
        toast.error('Failed to generate test tickets');
      }
    } catch (error) {
      console.error('Error generating test tickets:', error);
      toast.error('Failed to generate test tickets');
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
      loadTickets(page);
    }
  };

  // Handle ticket selection
  const toggleTicketSelection = (ticketId: string) => {
    const newSelected = new Set(selectedTicketIds);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTicketIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Select all visible tickets
  const toggleSelectAll = () => {
    if (selectedTicketIds.size === tickets.length) {
      setSelectedTicketIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedTicketIds(new Set(tickets.map(t => t.id)));
      setShowBulkActions(true);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !isAdmin || isSigningOut) return;

    const interval = setInterval(() => {
      if (!isSigningOut) {
        loadTickets(pagination.currentPage, false);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isAdmin, isSigningOut, loadTickets, pagination.currentPage]);

  // Load tickets on filter changes
  useEffect(() => {
    if (isAdmin) {
      loadTickets(1);
    }
  }, [searchQuery, statusFilter, typeFilter, priorityFilter, assigneeFilter, sortBy, sortOrder]);

  // Load tickets on mount
  useEffect(() => {
    if (isAdmin) {
      loadTickets();
    }
  }, [isAdmin]);

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

  // Filter tickets (for now, filtering happens on server)
  const filteredTickets = tickets;

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            Access denied: This page requires admin privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-muted-foreground">Loading support dashboard...</span>
        </div>
      </div>
    );
  }

  // Ticket detail view
  if (selectedTicket) {
    return (
      <div 
        className="h-full flex flex-col bg-background"
        style={{ padding: 'var(--spacing-6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-[var(--spacing-6)]">
          <div className="flex items-center gap-[var(--spacing-4)]">
            <button
              onClick={() => setSelectedTicket(null)}
              className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] bg-muted text-foreground rounded-[var(--radius-lg)] hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 
              className="text-foreground"
              style={{ 
                fontSize: '1.5rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              Ticket Details
            </h1>
          </div>
        </div>

        {error && (
          <div
            className="mb-[var(--spacing-4)]"
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--destructive-soft)',
              border: '1px solid var(--destructive)',
            }}
          >
            <div className="flex items-center gap-[var(--spacing-2)]">
              <AlertCircle className="size-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          </div>
        )}

        {loadingTicket ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading ticket details...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-[var(--spacing-6)]">
            {/* Ticket Header Card */}
            <div
              style={{
                padding: 'var(--spacing-6)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-start justify-between mb-[var(--spacing-4)]">
                <div>
                  <h2 
                    className="text-foreground mb-[var(--spacing-2)]"
                    style={{ 
                      fontSize: '1.25rem',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    {selectedTicket.subject}
                  </h2>
                  <div className="flex items-center gap-[var(--spacing-2)] text-sm text-muted-foreground flex-wrap">
                    <span>#{selectedTicket.id}</span>
                    <span>•</span>
                    <span>From: {selectedTicket.userEmail}</span>
                    <span>•</span>
                    <span>Created {formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-2)]">
                    <span className="text-sm" style={{ fontWeight: 'var(--font-weight-medium)' }}>Type:</span>
                    <div
                      className="px-[var(--spacing-2)] py-[var(--spacing-1)] rounded-[var(--radius-md)] text-xs"
                      style={{
                        background: 'var(--muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {formatType(selectedTicket.type)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-[var(--spacing-2)]">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>

              {/* Status Update */}
              <div className="pt-[var(--spacing-4)] border-t border-border">
                <label className="block text-sm text-foreground mb-[var(--spacing-2)]" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                  Update Status
                </label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => updateTicketStatus(e.target.value)}
                  disabled={updatingStatus}
                  className="w-full md:w-auto px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground"
                  style={{
                    opacity: updatingStatus ? '0.5' : '1',
                    cursor: updatingStatus ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="waiting-for-user">Waiting for User</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                padding: 'var(--spacing-6)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <h3 
                className="text-foreground mb-[var(--spacing-4)] flex items-center gap-[var(--spacing-2)]"
                style={{ 
                  fontSize: '1.125rem',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                <MessageSquare className="size-5 text-primary" />
                Conversation
              </h3>
              
              <div className="space-y-[var(--spacing-4)]">
                {selectedTicket.messages?.map((message, index) => (
                  <div key={message.id}>
                    <div
                      className={message.sender === 'admin' ? 'ml-8' : message.sender === 'user' ? 'mr-8' : ''}
                      style={{
                        padding: 'var(--spacing-4)',
                        borderRadius: 'var(--radius-lg)',
                        background: message.sender === 'user' 
                          ? 'var(--muted)' 
                          : message.sender === 'admin'
                          ? 'var(--primary-soft, rgba(var(--primary-rgb, 59, 130, 246), 0.1))'
                          : 'var(--background)',
                        border: `1px solid ${message.sender === 'admin' ? 'var(--primary)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-[var(--spacing-2)]">
                        <div className="flex items-center gap-[var(--spacing-2)]">
                          <div
                            className="px-[var(--spacing-2)] py-[var(--spacing-1)] rounded-[var(--radius-md)] text-xs"
                            style={{
                              background: message.sender === 'admin' ? 'var(--primary)' : message.sender === 'user' ? 'var(--muted)' : 'var(--background)',
                              color: message.sender === 'admin' ? 'white' : 'var(--foreground)',
                              border: message.sender !== 'admin' ? '1px solid var(--border)' : 'none',
                            }}
                          >
                            {message.sender === 'user' ? `User (${message.senderEmail})` : message.sender === 'admin' ? `Admin (${message.senderEmail})` : 'System'}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                      </p>
                    </div>
                    {index < (selectedTicket.messages?.length || 0) - 1 && (
                      <div 
                        className="my-[var(--spacing-3)]"
                        style={{
                          height: '1px',
                          background: 'var(--border)',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Reply Section */}
            <div
              style={{
                padding: 'var(--spacing-6)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <h3 
                className="text-foreground mb-[var(--spacing-4)]"
                style={{ 
                  fontSize: '1.125rem',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                Send Reply
              </h3>
              
              <div className="space-y-[var(--spacing-4)]">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your admin response here..."
                  rows={4}
                  className="w-full px-[var(--spacing-3)] py-[var(--spacing-2)] bg-background border border-border rounded-[var(--radius-lg)] text-foreground resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={sendReply}
                    disabled={!replyMessage.trim() || sendingReply}
                    className="flex items-center gap-[var(--spacing-2)] px-[var(--spacing-4)] py-[var(--spacing-2)] bg-primary text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Admin Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Support Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={generateTestTickets}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate Test Data
            </Button>
            <Button
              onClick={() => loadTickets(pagination.currentPage)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{pagination.totalItems} total tickets</span>
          </div>
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

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
              <div className="text-sm text-muted-foreground">Open</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.waitingForUser}</div>
              <div className="text-sm text-muted-foreground">Waiting</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
              <div className="text-sm text-muted-foreground">Closed</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by subject, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="waiting-for-user">Waiting for User</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="technical-issue">Technical Issue</SelectItem>
                <SelectItem value="billing-question">Billing Question</SelectItem>
                <SelectItem value="feature-request">Feature Request</SelectItem>
                <SelectItem value="account-help">Account Help</SelectItem>
                <SelectItem value="roadmap-question">Roadmap Question</SelectItem>
                <SelectItem value="business-setup">Business Setup</SelectItem>
                <SelectItem value="operations-help">Operations Help</SelectItem>
                <SelectItem value="general-inquiry">General Inquiry</SelectItem>
                <SelectItem value="bug-report">Bug Report</SelectItem>
                <SelectItem value="partnership-inquiry">Partnership Inquiry</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedTicketIds.size === tickets.length}
                onChange={toggleSelectAll}
                className="text-gray-500"
              />
              <span className="text-sm text-muted-foreground">
                {selectedTicketIds.size} ticket{selectedTicketIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => bulkUpdateStatus('in-progress')}
                  variant="outline"
                  size="sm"
                  disabled={updatingStatus}
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Set In Progress
                </Button>
                <Button
                  onClick={() => bulkUpdateStatus('waiting-for-user')}
                  variant="outline"
                  size="sm"
                  disabled={updatingStatus}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Set Waiting
                </Button>
                <Button
                  onClick={() => bulkUpdateStatus('resolved')}
                  variant="outline"
                  size="sm"
                  disabled={updatingStatus}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve
                </Button>
                <Button
                  onClick={() => bulkUpdateStatus('closed')}
                  variant="outline"
                  size="sm"
                  disabled={updatingStatus}
                  className="flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && lastRefresh && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Auto-refresh enabled (every 30s)</span>
          </div>
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tickets Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'No tickets match your current filters.' 
                : 'No support tickets have been created yet.'}
            </p>
            {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
              <Button onClick={generateTestTickets} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Generate Test Tickets
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-md transition-shadow group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox
                      checked={selectedTicketIds.has(ticket.id)}
                      onChange={() => toggleTicketSelection(ticket.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="space-y-2 flex-1" onClick={() => loadTicketDetails(ticket.id)}>
                      <h3 className="font-medium text-lg">{ticket.subject}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>#{ticket.id}</span>
                        <span>•</span>
                        <span>{ticket.userEmail}</span>
                        <span>•</span>
                        <span>{formatType(ticket.type)}</span>
                        <span>•</span>
                        <span>{ticket.messageCount} message{ticket.messageCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>Updated {formatDate(ticket.updatedAt)}</span>
                      </div>
                      {ticket.lastMessage && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          Last message: {ticket.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadTicketDetails(ticket.id);
                      }}
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
                </span>
                <Button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select
                  value={pagination.itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setPagination(prev => ({ ...prev, itemsPerPage: parseInt(value), currentPage: 1 }));
                    loadTickets(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSupportDashboard;