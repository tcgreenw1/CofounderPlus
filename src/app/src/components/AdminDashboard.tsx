import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { toast } from 'sonner@2.0.3';
import { 
  Shield, Users, Bell, MessageSquare,
  Settings, BarChart3,
  AlertTriangle, CheckCircle, Clock, Mail, Phone, Building,
  TrendingUp, DollarSign, Target, Search, Filter, RefreshCw,
  Eye, Edit, Trash2, UserPlus, Send, Archive, LogOut, Database,
  ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, Reply, 
  MessageCircle, User, Calendar, AlertCircle, CheckSquare, 
  XCircle, FileText, Clock3, UserX, Ban, Power, CreditCard,
  Terminal, Wrench, TestTube, Activity, Map, Zap, Calculator
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import AdminJobApplications from './AdminJobApplications';
import { CPAServicesAutomation } from './operations/CPAServicesAutomation';
import { FounderCallsAdmin } from './admin/FounderCallsAdmin';
import { SupportChatManager } from './admin/SupportChatManager';
import { useIsMobile } from './ui/use-mobile';
import { isIOS } from '../utils/platformDetection';

interface AdminDashboardProps {
  user: any;
  isSigningOut?: boolean;
  authReady?: boolean;
  accessToken?: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  business_info: any;
  last_activity: string;
  is_active?: boolean;
  last_login?: string;
  login_count_this_month?: number;
  billing_info?: {
    plan_type: 'free' | 'pro' | 'enterprise';
    monthly_amount: number;
    next_billing_date: string;
    is_past_due: boolean;
    last_payment_date?: string;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing';
    stripe_customer_id?: string;
  };
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
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
  assignedTo: string | null;
}

interface SupportTicketDetails {
  id: string;
  subject: string;
  message: string;
  type: string;
  priority: string;
  status: string;
  userEmail: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    senderEmail: string;
    timestamp: string;
  }>;
  tags: string[];
  assignedTo: string | null;
  resolvedAt: string | null;
}

function AdminDashboard({ user, isSigningOut = false, authReady = true, accessToken = null }: AdminDashboardProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Load saved preferences from localStorage
  const loadSavedPreferences = () => {
    try {
      const saved = localStorage.getItem('admin_user_table_preferences');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load user table preferences:', error);
    }
    return {
      sortBy: 'created_at',
      sortOrder: 'desc',
      filterRole: 'all',
      filterPlan: 'all',
      filterStatus: 'all',
      filterActivity: 'all',
    };
  };

  const savedPrefs = loadSavedPreferences();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(savedPrefs.filterRole);
  const [filterPlan, setFilterPlan] = useState(savedPrefs.filterPlan);
  const [filterStatus, setFilterStatus] = useState(savedPrefs.filterStatus);
  const [filterActivity, setFilterActivity] = useState(savedPrefs.filterActivity);
  const [sortBy, setSortBy] = useState(savedPrefs.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(savedPrefs.sortOrder);
  
  // Save preferences whenever they change
  useEffect(() => {
    const preferences = {
      sortBy,
      sortOrder,
      filterRole,
      filterPlan,
      filterStatus,
      filterActivity,
    };
    localStorage.setItem('admin_user_table_preferences', JSON.stringify(preferences));
  }, [sortBy, sortOrder, filterRole, filterPlan, filterStatus, filterActivity]);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newMessage, setNewMessage] = useState({ title: '', content: '', type: 'announcement' });
  const [newPassword, setNewPassword] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [seedingData, setSeedingData] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [subscriptionDebugVisible, setSubscriptionDebugVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  
  // Track which tabs have been loaded (for lazy loading)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['users'])); // Users tab loads initially

  // Get subscription context
  const { 
    subscriptionData, 
    isProUser, 
    canAccessOperations, 
    isCreatorOrHigher, 
    refreshSubscriptions 
  } = useCloudSubscription();

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  // Support ticket state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportStats, setSupportStats] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDetails | null>(null);
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [ticketTypeFilter, setTicketTypeFilter] = useState('all');
  const [ticketSortBy, setTicketSortBy] = useState('updatedAt');
  
  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailType, setTestEmailType] = useState('simple');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    error?: string;
  } | null>(null);
  const [emailSystemStatus, setEmailSystemStatus] = useState<{
    loading: boolean;
    configured: boolean;
    error?: string;
    fromEmail?: string;
    fromName?: string;
    isDefaultFromEmail?: boolean;
    warning?: string;
  }>({ loading: false, configured: false });
  const [ticketSortOrder, setTicketSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState('');
  const [assigneeUpdate, setAssigneeUpdate] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Bulk actions state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
  const [showBulkRoleDialog, setShowBulkRoleDialog] = useState(false);
  const [bulkRole, setBulkRole] = useState('user');

  // Subscription management state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionSearchTerm, setSubscriptionSearchTerm] = useState('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('all');
  const [subscriptionPlanFilter, setSubscriptionPlanFilter] = useState('all');
  
  // Subscription action modals
  const [showSubscriptionAction, setShowSubscriptionAction] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [subscriptionAction, setSubscriptionAction] = useState<'cancel' | 'changePlan' | 'changeStatus' | 'restore' | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newBillingPeriod, setNewBillingPeriod] = useState('monthly');
  const [cancelReason, setCancelReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [immediateCancel, setImmediateCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Data refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Debug: Log whenever supportTickets changes
  useEffect(() => {
    console.log('🎫 Support tickets state updated:', {
      count: supportTickets.length,
      tickets: supportTickets,
      stats: supportStats
    });
  }, [supportTickets, supportStats]);

  // Handle tab changes and load data lazily
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    
    // Load data for this tab if it hasn't been loaded yet
    if (!loadedTabs.has(newTab)) {
      console.log(`🔄 Loading data for tab: ${newTab}`);
      loadTabData(newTab);
      setLoadedTabs(prev => new Set([...prev, newTab]));
    }
  };

  useEffect(() => {
    if (!isSigningOut && authReady) {
      // Add a small delay to ensure authentication is fully established
      const delay = accessToken ? 300 : 800;
      const timeoutId = setTimeout(() => {
        console.log('🔄 Admin: Starting delayed admin data load (auth ready, token available:', !!accessToken, ')');
        // Only load the active tab's data initially
        loadTabData(activeTab);
      }, delay);
      
      // Set up interval for periodic refreshes - only refresh the active tab
      const interval = setInterval(() => {
        if (!isSigningOut && authReady) {
          console.log(`🔄 Refreshing active tab: ${activeTab}`);
          loadTabData(activeTab);
        }
      }, 30000);
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(interval);
      };
    } else if (!authReady) {
      console.log('🔄 Admin: Waiting for auth to be ready...');
    }
  }, [isSigningOut, authReady, accessToken, activeTab]);

  // Load data for a specific tab
  const loadTabData = async (tabName: string) => {
    if (isSigningOut) {
      console.log('🔄 Skipping tab data load because user is signing out');
      return;
    }

    setIsRefreshing(true);

    try {
      // Get access token
      let finalAccessToken: string | undefined = accessToken || undefined;
      
      if (!finalAccessToken) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          finalAccessToken = session?.access_token;
        } catch (sessionError) {
          if (!isSigningOut) {
            console.warn('🔄 Admin: Session error:', sessionError);
          }
        }
      }

      if (!finalAccessToken) {
        console.warn('❌ No access token available');
        return;
      }

      console.log(`🔄 Loading data for tab: ${tabName}`);

      // Define endpoint based on tab
      let endpoint: any = null;
      
      switch (tabName) {
        case 'users':
          endpoint = {
            name: 'users',
            url: `${serverUrl}/admin/users?_t=${Date.now()}`,
            setter: (data: any) => {
              setUsers(data.users || []);
              console.log('🔧 Admin: Users data received, count:', (data.users || []).length);
            }
          };
          break;
          
        case 'support':
          endpoint = {
            name: 'support',
            url: `${serverUrl}/support/admin/all?adminEmail=${user?.email}&_t=${Date.now()}`,
            setter: (data: any) => {
              console.log('🎫 Support tickets data received:', data);
              setSupportTickets(data.tickets || []);
              setSupportStats(data.stats || null);
            }
          };
          break;
          
        case 'notifications':
          endpoint = {
            name: 'notifications',
            url: `${serverUrl}/admin/notifications?_t=${Date.now()}`,
            setter: (data: any) => {
              setNotifications(data.notifications || []);
            }
          };
          break;
          
        case 'subscriptions':
          endpoint = {
            name: 'subscriptions',
            url: `${serverUrl}/admin/subscriptions?_t=${Date.now()}`,
            setter: (data: any) => {
              setSubscriptions(data.subscriptions || []);
            }
          };
          break;
          
        case 'function-test':
          // Check email system status when tab is loaded
          console.log('📧 Checking email system status...');
          checkEmailSystemStatus();
          setIsRefreshing(false);
          return;
          
        default:
          // For other tabs (founder-calls, jobs, marketing-leads, admin-users), don't load anything
          console.log(`ℹ️ Tab "${tabName}" doesn't require server data`);
          setIsRefreshing(false);
          return;
      }

      if (endpoint) {
        const response = await fetch(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${finalAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Successfully loaded ${endpoint.name}:`, data);
          endpoint.setter(data);
        } else {
          console.error(`❌ Failed to load ${endpoint.name}:`, response.status, response.statusText);
        }
      }

      setLastRefreshTime(new Date());
    } catch (error) {
      console.error(`❌ Error loading tab data for ${tabName}:`, error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    // Don't load data if signing out
    if (isSigningOut) {
      console.log('🔄 Skipping admin data load because user is signing out');
      return;
    }

    // Set loading state
    setIsRefreshing(true);

    try {
      console.log('🔄 Loading admin data...');
      
      // Use provided access token or fallback to session retrieval
      let finalAccessToken: string | undefined = accessToken || undefined;
      
      if (finalAccessToken) {
        console.log('🔄 Admin: Using provided access token');
      } else {
        console.log('🔄 Admin: No provided token, attempting session retrieval');
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          finalAccessToken = session?.access_token;
          
          if (finalAccessToken) {
            console.log('🔄 Admin: Access token obtained from session');
          }
        } catch (sessionError) {
          if (!isSigningOut) {
            console.warn('🔄 Admin: Session error:', sessionError);
          }
        }
      }

      if (!finalAccessToken) {
        if (!isSigningOut) {
          console.warn('❌ No access token available for admin data loading');
          // Set default empty data and allow admin interface to work
          setUsers([]);
          setNotifications([]);
          setSupportTickets([]);
          setSupportStats(null);
        }
        return;
      }

      console.log('🔄 Admin data loading with access token:', finalAccessToken ? `${finalAccessToken.substring(0, 20)}...` : 'none');

      // Remove AbortController to prevent AbortError issues
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Set timeout for logging only
      timeoutId = setTimeout(() => {
        if (!isSigningOut) {
          console.log('⏰ Admin data fetch is taking longer than expected...');
        }
      }, 8000);

      try {
        const endpoints = [
          {
            name: 'users',
            url: `${serverUrl}/admin/users?_t=${Date.now()}`,
            setter: setUsers,
            defaultValue: []
          },
          {
            name: 'notifications', 
            url: `${serverUrl}/admin/notifications?_t=${Date.now()}`,
            setter: setNotifications,
            defaultValue: []
          },
          {
            name: 'support',
            url: `${serverUrl}/support/admin/all?adminEmail=${user?.email}&_t=${Date.now()}`,
            setter: (data: any) => {
              console.log('🎫 Support tickets data received:', data);
              console.log('🎫 Tickets array:', data.tickets);
              console.log('🎫 Tickets count:', data.tickets?.length);
              console.log('🎫 Stats:', data.stats);
              setSupportTickets(data.tickets || []);
              setSupportStats(data.stats || null);
            },
            defaultValue: { tickets: [], stats: null }
          },
          {
            name: 'subscriptions',
            url: `${serverUrl}/admin/subscriptions?_t=${Date.now()}`,
            setter: setSubscriptions,
            defaultValue: []
          }
        ];

        console.log('🎫 Support tickets endpoint URL:', endpoints.find(e => e.name === 'support')?.url);

        // Make requests without AbortController to prevent AbortErrors
        const responses = await Promise.allSettled(
          endpoints.map(endpoint => 
            fetch(endpoint.url, {
              headers: { 
                'Authorization': `Bearer ${finalAccessToken}`,
                'Content-Type': 'application/json'
              }
              // Removed signal: controller.signal to prevent AbortErrors
            })
          )
        );

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Process each response
        for (let i = 0; i < endpoints.length; i++) {
          const endpoint = endpoints[i];
          const response = responses[i];

          try {
            if (response.status === 'fulfilled' && response.value.ok) {
              const data = await response.value.json();
              console.log(`✅ Successfully loaded ${endpoint.name}:`, data);
              
              if (endpoint.name === 'users') {
                endpoint.setter(data.users || []);
                console.log('🔧 Admin: Users data received, count:', (data.users || []).length);
                console.log('🔧 Admin: Sample user data:', data.users?.[0]);
                console.log('🔧 Admin: First 3 users last_login data:', data.users?.slice(0, 3).map((u: any) => ({ 
                  email: u.email, 
                  last_login: u.last_login,
                  login_count_this_month: u.login_count_this_month 
                })));
              } else if (endpoint.name === 'notifications') {
                endpoint.setter(data.notifications || []);
              } else if (endpoint.name === 'support') {
                endpoint.setter(data);
              } else if (endpoint.name === 'subscriptions') {
                console.log('🔧 Admin: Raw subscription data received:', data);
                console.log('🔧 Admin: Subscriptions array:', data.subscriptions);
                console.log('🔧 Admin: Setting subscriptions with length:', (data.subscriptions || []).length);
                endpoint.setter(data.subscriptions || []);
              }
            } else {
              const errorInfo = response.status === 'fulfilled' ? 
                { status: response.value.status, statusText: response.value.statusText } : 
                response.reason;
              
              console.log(`ℹ️ Failed to load ${endpoint.name}:`, errorInfo);
              
              // Try to get detailed error from response
              if (response.status === 'fulfilled' && response.value.status) {
                try {
                  const errorData = await response.value.text();
                  console.log(`ℹ️ ${endpoint.name} error details:`, errorData);
                } catch (e) {
                  console.log(`ℹ️ Could not read ${endpoint.name} error details`);
                }
              }
              
              // Set default value and continue
              if (endpoint.name === 'support') {
                setSupportTickets([]);
                setSupportStats(null);
              } else {
                endpoint.setter([]);
              }
            }
          } catch (parseError: any) {
            if (parseError.name !== 'AbortError' && !isSigningOut) {
              console.error(`❌ Error processing ${endpoint.name} response:`, parseError);
            }
            if (endpoint.name === 'support') {
              setSupportTickets([]);
              setSupportStats(null);
            } else {
              endpoint.setter([]);
            }
          }
        }

        console.log('✅ Admin data loading completed');
        
        // Update last refresh time
        setLastRefreshTime(new Date());

      } catch (fetchError: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Only log errors if not an abort error and not signing out
        if (fetchError.name !== 'AbortError' && !isSigningOut) {
          console.error('❌ Network error during admin data fetch:', fetchError);
        }
        
        // Set default empty data instead of failing completely
        setUsers([]);
        setNotifications([]);
        setSupportTickets([]);
        setSupportStats(null);
        setSubscriptions([]);
        
        // Only show warning if it's not an abort error and not signing out
        if (fetchError.name !== 'AbortError' && !isSigningOut) {
          console.warn('Network timeout or error - admin interface will work with limited data');
          // Don't show error toast to avoid spamming user
        }
      }

    } catch (error) {
      if (!isSigningOut) {
        console.error('❌ Error loading admin data:', error);
        // Don't show error toast - just log and continue with empty data
      }
      
      // Set default empty data - admin interface should still work
      setUsers([]);
      setNotifications([]);
      setSupportTickets([]);
      setSupportStats(null);
      setSubscriptions([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const seedSampleData = async () => {
    if (seedingData) return;
    
    try {
      setSeedingData(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.warn('❌ No access token available for seeding');
        return;
      }

      const seedResponse = await fetch(
        `${serverUrl}/admin/seed/all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (seedResponse.ok) {
        const seedData = await seedResponse.json();
        console.log('✅ Admin sample data seeded successfully:', seedData.results);
      }

      await loadAdminData();
    } catch (error) {
      console.error('❌ Error seeding admin data:', error);
    } finally {
      setSeedingData(false);
    }
  };

  const clearDemoData = async () => {
    if (clearingData) return;
    
    try {
      setClearingData(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.warn('❌ No access token available for clearing');
        return;
      }

      const clearResponse = await fetch(
        `${serverUrl}/admin/clear-demo-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (clearResponse.ok) {
        const clearData = await clearResponse.json();
        console.log('✅ Admin demo data cleared successfully:', clearData.cleared);
      }

      await loadAdminData();
    } catch (error) {
      console.error('❌ Error clearing admin data:', error);
    } finally {
      setClearingData(false);
    }
  };

  const handleUserClick = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(
        `${serverUrl}/admin/users/${userId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData.user);
        setShowUserDetails(true);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  // View user data - opens a detailed view of the user's account
  const handleImpersonateUser = async (userId: string, userEmail: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      // Store admin session info BEFORE impersonating
      const adminSessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user_id: session.user.id,
        user_email: session.user.email,
      };
      localStorage.setItem('admin_session_backup', JSON.stringify(adminSessionData));
      localStorage.setItem('admin_impersonation_active', 'true');

      toast.loading(`Switching to ${userEmail}...`);

      // Call backend to get impersonation session
      const response = await fetch(
        `${serverUrl}/admin/impersonate/${userId}`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to impersonate user');
      }

      const data = await response.json();
      
      // Extract the token from the magic link
      const url = new URL(data.authLink);
      const token = url.searchParams.get('token');
      
      if (!token) {
        throw new Error('No auth token received');
      }

      // Verify the token with Supabase (this logs us in as the user)
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink'
      });

      if (verifyError) {
        throw new Error(`Failed to verify token: ${verifyError.message}`);
      }

      toast.success(`Now viewing as ${userEmail}`);
      
      // Reload to apply the new session
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (error) {
      console.error('Error impersonating user:', error);
      toast.error('Failed to switch to user account');
      
      // Clean up on error
      localStorage.removeItem('admin_session_backup');
      localStorage.removeItem('admin_impersonation_active');
    }
  };

  // Check email system status
  const checkEmailSystemStatus = async () => {
    setEmailSystemStatus({ loading: true, configured: false });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setEmailSystemStatus({ 
          loading: false, 
          configured: false, 
          error: 'Not authenticated' 
        });
        return;
      }

      // Try to get system status from the backend
      const response = await fetch(
        `${serverUrl}/admin/email-system-status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      
      setEmailSystemStatus({
        loading: false,
        configured: data.configured || false,
        error: data.error,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        isDefaultFromEmail: data.isDefaultFromEmail,
        warning: data.warning,
      });
    } catch (error: any) {
      console.error('Error checking email system status:', error);
      setEmailSystemStatus({
        loading: false,
        configured: false,
        error: error.message,
      });
    }
  };

  // Test email handler
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || sendingTestEmail) return;

    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${serverUrl}/admin/test-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmailAddress,
            testType: testEmailType,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setTestEmailResult({
          success: true,
          message: '✅ Test email sent successfully! Check your inbox.',
          details: {
            testType: data.testType,
            timestamp: data.timestamp,
          },
        });
        toast.success('Test email sent!');
      } else {
        // More detailed error message
        let errorMsg = data.error || 'Unknown error';
        if (data.details) {
          errorMsg += `\n\nDetails: ${data.details}`;
        }
        
        setTestEmailResult({
          success: false,
          message: '❌ Failed to send test email',
          error: errorMsg,
        });
        toast.error('Failed to send test email');
        
        // Log full error for debugging
        console.error('Test email error details:', {
          error: data.error,
          details: data.details,
          response: data,
        });
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      setTestEmailResult({
        success: false,
        message: '❌ Error sending test email',
        error: error.message || 'Network error',
      });
      toast.error('Error sending test email');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    
    console.log('🔧 AdminDashboard: Sign out initiated');
    
    // Set local signing out state
    setSigningOut(true);
    
    // Clear ALL storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Storage clear error (non-blocking):', e);
    }
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('🔧 AdminDashboard: Supabase sign out error (non-blocking):', error);
    }
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Hard reload to root
    console.log('🔧 AdminDashboard: Reloading to complete sign out');
    window.location.href = '/';
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'created_at' || field === 'last_activity' ? 'desc' : 'asc');
    }
  };

  const processedUsers = React.useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      
      // Filter by plan
      const userPlan = user.billing_info?.plan_type || 'free';
      const matchesPlan = filterPlan === 'all' || userPlan === filterPlan;
      
      // Filter by status
      const isActive = user.is_active !== false;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && isActive) ||
                           (filterStatus === 'inactive' && !isActive);
      
      // Filter by activity (last login)
      let matchesActivity = true;
      if (filterActivity !== 'all') {
        const now = new Date();
        const lastLogin = user.last_login ? new Date(user.last_login) : null;
        
        if (filterActivity === 'today' && lastLogin) {
          matchesActivity = lastLogin.toDateString() === now.toDateString();
        } else if (filterActivity === 'week' && lastLogin) {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesActivity = lastLogin >= weekAgo;
        } else if (filterActivity === 'month' && lastLogin) {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesActivity = lastLogin >= monthAgo;
        } else if (filterActivity === 'never') {
          matchesActivity = !lastLogin;
        }
      }
      
      return matchesSearch && matchesRole && matchesPlan && matchesStatus && matchesActivity;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'last_activity':
          aValue = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          bValue = b.last_activity ? new Date(b.last_activity).getTime() : 0;
          break;
        case 'business':
          aValue = (a.business_info?.business_name || '').toLowerCase();
          bValue = (b.business_info?.business_name || '').toLowerCase();
          break;
        case 'last_login':
          aValue = a.last_login ? new Date(a.last_login).getTime() : 0;
          bValue = b.last_login ? new Date(b.last_login).getTime() : 0;
          break;
        case 'login_count_this_month':
          aValue = a.login_count_this_month || 0;
          bValue = b.login_count_this_month || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, filterRole, filterPlan, filterStatus, filterActivity, sortBy, sortOrder]);

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filterRole !== 'all') count++;
    if (filterPlan !== 'all') count++;
    if (filterStatus !== 'all') count++;
    if (filterActivity !== 'all') count++;
    if (searchTerm) count++;
    return count;
  }, [filterRole, filterPlan, filterStatus, filterActivity, searchTerm]);

  const stats = React.useMemo(() => ({
    totalUsers: users.length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    newUsersToday: users.filter(u => {
      const today = new Date().toDateString();
      return new Date(u.created_at).toDateString() === today;
    }).length,
    unreadNotifications: notifications.filter(n => !n.read).length
  }), [users, notifications]);

  const handleTicketClick = async (ticketId: string) => {
    try {
      setLoadingTickets(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Authentication required. Please sign in again.');
        return;
      }

      console.log('📩 Fetching ticket details:', ticketId);
      const response = await fetch(`${serverUrl}/support/ticket/${ticketId}`, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📩 Response status:', response.status);

      if (response.ok) {
        const ticketData = await response.json();
        console.log('📩 Ticket data received:', ticketData);
        
        if (ticketData.success && ticketData.ticket) {
          setSelectedTicket(ticketData.ticket);
          setShowTicketDetails(true);
          setTicketStatusUpdate(ticketData.ticket.status);
          setAssigneeUpdate(ticketData.ticket.assignedTo || '');
          toast.success('Ticket loaded successfully');
        } else {
          toast.error('Failed to load ticket: ' + (ticketData.error || 'Invalid response'));
          console.error('Invalid ticket data:', ticketData);
        }
      } else {
        const errorText = await response.text();
        toast.error('Failed to load ticket: ' + response.statusText);
        console.error('Failed to load ticket:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toast.error('Error loading ticket details');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleTicketReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      console.log('💬 Sending reply to ticket:', selectedTicket.id);
      const response = await fetch(`${serverUrl}/support/ticket/${selectedTicket.id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: replyMessage,
          senderEmail: user?.email,
          isAdmin: true
        })
      });

      console.log('💬 Reply response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReplyMessage('');
          toast.success('Reply sent successfully');
          await handleTicketClick(selectedTicket.id);
          await loadAdminData();
        } else {
          toast.error('Failed to send reply: ' + (data.error || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        toast.error('Failed to send reply');
        console.error('Reply error:', errorText);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Error sending reply');
    }
  };

  const handleTicketStatusChange = async () => {
    if (!selectedTicket || !ticketStatusUpdate) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      console.log('🔄 Updating ticket status:', selectedTicket.id, 'to', ticketStatusUpdate);
      const response = await fetch(`${serverUrl}/support/ticket/${selectedTicket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: ticketStatusUpdate,
          adminEmail: user?.email
        })
      });

      console.log('🔄 Status update response:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Status updated successfully');
          await handleTicketClick(selectedTicket.id);
          await loadAdminData();
        } else {
          toast.error('Failed to update status: ' + (data.error || 'Unknown error'));
        }
      } else {
        const errorText = await response.text();
        toast.error('Failed to update status');
        console.error('Status update error:', errorText);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Error updating status');
    }
  };

  const generateTestTickets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const response = await fetch(`${serverUrl}/support/admin/generate-test-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-admin-email': user?.email
        },
        body: JSON.stringify({ count: 25 })
      });

      if (response.ok) {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error generating test tickets:', error);
    }
  };

  const ticketsByStatus = React.useMemo(() => {
    const statuses = ['open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'];
    const organized: Record<string, SupportTicket[]> = {};
    
    statuses.forEach(status => {
      organized[status] = supportTickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                              ticket.userEmail.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                              ticket.id.toLowerCase().includes(ticketSearchTerm.toLowerCase());
        const matchesPriority = ticketPriorityFilter === 'all' || ticket.priority === ticketPriorityFilter;
        const matchesType = ticketTypeFilter === 'all' || ticket.type === ticketTypeFilter;
        return ticket.status === status && matchesSearch && matchesPriority && matchesType;
      }).sort((a, b) => {
        const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });
    
    return organized;
  }, [supportTickets, ticketSearchTerm, ticketPriorityFilter, ticketTypeFilter]);

  const userTicketCounts = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const counts: Record<string, number> = {};
    supportTickets.forEach(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      if (ticketDate >= thirtyDaysAgo) {
        counts[ticket.userEmail] = (counts[ticket.userEmail] || 0) + 1;
      }
    });
    
    return counts;
  }, [supportTickets]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'waiting-for-user': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Account deactivation functionality
  const handleUserDeactivation = async (userId: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.warn('❌ No access token available for user deactivation');
        return;
      }

      const response = await fetch(
        `${serverUrl}/admin/users/${userId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            is_active: !isActive,
            admin_email: user?.email
          })
        }
      );

      console.log('🔍 Status update response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: `${serverUrl}/admin/users/${userId}/status`
      });

      if (response.ok) {
        console.log(`✅ User ${isActive ? 'deactivated' : 'activated'} successfully`);
        await loadAdminData(); // Refresh the user list
        toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update user status:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: `${serverUrl}/admin/users/${userId}/status`,
          userId,
          requestBody: { is_active: !isActive, admin_email: user?.email }
        });
        toast.error(`Failed to update user status: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      toast.error(`Error updating user status: ${error.message}`);
    }
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedUserIds.length === processedUsers.filter(u => u.role !== 'admin').length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(processedUsers.filter(u => u.role !== 'admin').map(u => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;

    if (!confirm(`Are you sure you want to deactivate ${selectedUserIds.length} users?`)) {
      return;
    }

    setBulkActionInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('❌ Bulk deactivate: No access token available');
        toast.error('No access token available');
        return;
      }

      console.log('🔧 Bulk deactivate: Calling endpoint:', `${serverUrl}/admin/users/bulk-deactivate`);
      console.log('🔧 Bulk deactivate: User IDs:', selectedUserIds);

      const response = await fetch(
        `${serverUrl}/admin/users/bulk-deactivate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userIds: selectedUserIds })
        }
      );

      console.log('🔧 Bulk deactivate: Response status:', response.status);
      const responseText = await response.text();
      console.log('🔧 Bulk deactivate: Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        toast.success(`Deactivated ${result.successCount} out of ${result.totalCount} users`);
        setSelectedUserIds([]);
        await loadAdminData();
      } else {
        console.error('❌ Bulk deactivate failed:', responseText);
        toast.error(`Failed to deactivate users: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Error bulk deactivating users:', error);
      toast.error(`Error deactivating users: ${error.message}`);
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUserIds.length === 0) return;

    if (!confirm(`Are you sure you want to activate ${selectedUserIds.length} users?`)) {
      return;
    }

    setBulkActionInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('❌ Bulk activate: No access token available');
        toast.error('No access token available');
        return;
      }

      console.log('🔧 Bulk activate: Calling endpoint:', `${serverUrl}/admin/users/bulk-activate`);
      console.log('🔧 Bulk activate: User IDs:', selectedUserIds);

      const response = await fetch(
        `${serverUrl}/admin/users/bulk-activate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userIds: selectedUserIds })
        }
      );

      console.log('🔧 Bulk activate: Response status:', response.status);
      const responseText = await response.text();
      console.log('🔧 Bulk activate: Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        toast.success(`Activated ${result.successCount} out of ${result.totalCount} users`);
        setSelectedUserIds([]);
        await loadAdminData();
      } else {
        console.error('❌ Bulk activate failed:', responseText);
        toast.error(`Failed to activate users: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Error bulk activating users:', error);
      toast.error(`Error activating users: ${error.message}`);
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;

    if (!confirm(`⚠️ WARNING: Are you sure you want to permanently delete ${selectedUserIds.length} users? This action cannot be undone.`)) {
      return;
    }

    setBulkActionInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('❌ Bulk delete: No access token available');
        toast.error('No access token available');
        return;
      }

      console.log('🔧 Bulk delete: Calling endpoint:', `${serverUrl}/admin/users/bulk-delete`);
      console.log('🔧 Bulk delete: User IDs:', selectedUserIds);

      const response = await fetch(
        `${serverUrl}/admin/users/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userIds: selectedUserIds })
        }
      );

      console.log('🔧 Bulk delete: Response status:', response.status);
      const responseText = await response.text();
      console.log('🔧 Bulk delete: Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        toast.success(`Deleted ${result.successCount} out of ${result.totalCount} users`);
        setSelectedUserIds([]);
        await loadAdminData();
      } else {
        console.error('❌ Bulk delete failed:', responseText);
        toast.error(`Failed to delete users: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Error bulk deleting users:', error);
      toast.error(`Error deleting users: ${error.message}`);
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkRoleUpdate = async () => {
    if (selectedUserIds.length === 0) return;

    setBulkActionInProgress(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('❌ Bulk role update: No access token available');
        toast.error('No access token available');
        return;
      }

      console.log('🔧 Bulk role update: Calling endpoint:', `${serverUrl}/admin/users/bulk-role-update`);
      console.log('🔧 Bulk role update: User IDs:', selectedUserIds, 'Role:', bulkRole);

      const response = await fetch(
        `${serverUrl}/admin/users/bulk-role-update`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userIds: selectedUserIds, role: bulkRole })
        }
      );

      console.log('🔧 Bulk role update: Response status:', response.status);
      const responseText = await response.text();
      console.log('🔧 Bulk role update: Response body:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        toast.success(`Updated role for ${result.successCount} out of ${result.totalCount} users`);
        setSelectedUserIds([]);
        setShowBulkRoleDialog(false);
        await loadAdminData();
      } else {
        console.error('❌ Bulk role update failed:', responseText);
        toast.error(`Failed to update user roles: ${responseText}`);
      }
    } catch (error) {
      console.error('❌ Error bulk updating roles:', error);
      toast.error(`Error updating roles: ${error.message}`);
    } finally {
      setBulkActionInProgress(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedUserIds.length === 0) return;

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
    const csvContent = [
      ['Name', 'Email', 'Role', 'Plan', 'Status', 'Created At', 'Last Activity'].join(','),
      ...selectedUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.billing_info?.plan_type || 'Free',
        user.is_active === false ? 'Deactivated' : 'Active',
        new Date(user.created_at).toLocaleDateString(),
        user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedUserIds.length} users`);
  };

  // Subscription management handlers
  const handleSubscriptionAction = (subscription: any, action: 'cancel' | 'changePlan' | 'changeStatus' | 'restore') => {
    setSelectedSubscription(subscription);
    setSubscriptionAction(action);
    setNewPlan(subscription.plan || 'creator');
    setNewStatus(subscription.status || 'active');
    setNewBillingPeriod(subscription.billing_period || 'monthly');
    setCancelReason('');
    setAdminNote('');
    setImmediateCancel(false);
    setShowSubscriptionAction(true);
  };

  const executeSubscriptionAction = async () => {
    if (!selectedSubscription || !subscriptionAction) return;

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('No access token available');
        return;
      }

      let response;
      let endpoint = '';
      let body = {};

      switch (subscriptionAction) {
        case 'cancel':
          endpoint = `${serverUrl}/admin/subscriptions/${selectedSubscription.user_id}/cancel`;
          body = {
            reason: cancelReason,
            adminNote,
            immediateCancel
          };
          break;

        case 'changePlan':
          endpoint = `${serverUrl}/admin/subscriptions/${selectedSubscription.user_id}/plan`;
          body = {
            plan: newPlan,
            billingPeriod: newBillingPeriod,
            adminNote
          };
          break;

        case 'changeStatus':
          endpoint = `${serverUrl}/admin/subscriptions/${selectedSubscription.user_id}/status`;
          body = {
            status: newStatus,
            adminNote
          };
          break;

        case 'restore':
          endpoint = `${serverUrl}/admin/subscriptions/${selectedSubscription.user_id}/restore`;
          body = {
            plan: newPlan,
            adminNote
          };
          break;
      }

      response = await fetch(endpoint, {
        method: subscriptionAction === 'cancel' || subscriptionAction === 'restore' ? 'POST' : 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Action completed successfully');
        setShowSubscriptionAction(false);
        await loadAdminData(); // Refresh subscription data
      } else {
        toast.error(result.error || 'Action failed');
      }

    } catch (error) {
      console.error('Subscription action error:', error);
      toast.error('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionButtonText = () => {
    switch (subscriptionAction) {
      case 'cancel': return 'Cancel Subscription';
      case 'changePlan': return 'Change Plan';
      case 'changeStatus': return 'Change Status';
      case 'restore': return 'Restore Subscription';
      default: return 'Confirm';
    }
  };

  // Helper functions for billing display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getBillingStatusColor = (status: string, isPastDue: boolean) => {
    if (isPastDue) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'trialing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'past_due': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'canceled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPlanTypeColor = (planType: string) => {
    switch (planType) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'enterprise': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage users and oversee the Cofounder platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastRefreshTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Updated: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
              <Button 
                onClick={loadAdminData} 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-red-200 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                disabled={signingOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {signingOut ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="max-w-7xl mx-auto px-6 py-8"
        style={{
          paddingBottom: isMobile && isIOSApp ? 'max(env(safe-area-inset-bottom, 0px) + 120px, 120px)' : undefined
        }}
      >
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.adminUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                New Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.newUsersToday}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.unreadNotifications}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className={`${
            isMobile 
              ? 'flex w-full overflow-x-auto bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg scrollbar-hide gap-1 p-1' 
              : 'grid w-full grid-cols-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg'
          }`}>
            <TabsTrigger value="users" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              {isMobile ? 'Users' : 'User Management'}
            </TabsTrigger>
            <TabsTrigger value="support" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              {isMobile ? 'Support' : 'Support Tickets'} {supportStats?.open > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">{supportStats.open}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="founder-calls" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              <Calendar className="w-4 h-4 mr-1" />
              {isMobile ? 'Calls' : 'Founder Calls'}
            </TabsTrigger>
            <TabsTrigger value="jobs" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              {isMobile ? 'Jobs' : 'Job Applications'}
            </TabsTrigger>
            <TabsTrigger value="notifications" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              {isMobile ? 'Notifs' : 'Notifications'} {stats.unreadNotifications > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{stats.unreadNotifications}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              <CreditCard className="w-4 h-4 mr-1" />
              {isMobile ? 'Billing' : 'Subscriptions'}
            </TabsTrigger>
            <TabsTrigger value="cpa-roadmap" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              <Calculator className="w-4 h-4 mr-1" />
              {isMobile ? 'CPA' : 'CPA Roadmap'}
            </TabsTrigger>
            <TabsTrigger value="function-test" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              <Mail className="w-4 h-4 mr-1" />
              {isMobile ? 'Email' : 'Email Testing'}
            </TabsTrigger>
            <TabsTrigger value="support-chat" className={isMobile ? 'flex-shrink-0 whitespace-nowrap text-xs px-3' : ''}>
              <MessageSquare className="w-4 h-4 mr-1" />
              {isMobile ? 'Chat' : 'Live Chat'}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Filters Section */}
            <div 
              className="border border-border rounded-[var(--radius-lg)]"
              style={{ 
                padding: 'var(--spacing-4)',
                background: 'var(--card)',
              }}
            >
              <div className="flex items-center gap-[var(--spacing-2)] mb-[var(--spacing-3)]">
                <Filter className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                  Filters & Search
                </span>
                {activeFiltersCount > 0 && (
                  <Badge 
                    className="ml-1"
                    style={{ 
                      background: 'var(--primary)',
                      color: 'white',
                    }}
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRole('all');
                    setFilterPlan('all');
                    setFilterStatus('all');
                    setFilterActivity('all');
                  }}
                  className="ml-auto text-sm hover:underline"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-[var(--spacing-3)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Plans" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterActivity} onValueChange={setFilterActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="never">Never Logged In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-[var(--spacing-3)] flex items-center gap-[var(--spacing-2)] text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <span>Showing {processedUsers.length} of {users.length} users</span>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedUserIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-indigo-900 dark:text-indigo-100">
                      {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUserIds([])}
                      className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkActivate}
                      disabled={bulkActionInProgress}
                      className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <Power className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDeactivate}
                      disabled={bulkActionInProgress}
                      className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Deactivate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkRoleDialog(true)}
                      disabled={bulkActionInProgress}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Change Role
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkExport}
                      className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkActionInProgress}
                      className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle>Platform Users</CardTitle>
                <CardDescription>
                  Manage all users on the Cofounder platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {processedUsers.length > 0 ? (
                  <div className={isMobile ? 'overflow-x-auto -mx-6 px-6' : ''}>
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length === processedUsers.filter(u => u.role !== 'admin').length && processedUsers.filter(u => u.role !== 'admin').length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            User {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
                          onClick={() => handleSort('role')}
                        >
                          <div className="flex items-center gap-2">
                            Role {getSortIcon('role')}
                          </div>
                        </TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Next Bill</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
                          onClick={() => handleSort('last_login')}
                        >
                          <div className="flex items-center gap-2">
                            Last Login {getSortIcon('last_login')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
                          onClick={() => handleSort('login_count_this_month')}
                        >
                          <div className="flex items-center gap-2">
                            Logins/Mo {getSortIcon('login_count_this_month')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors select-none"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-2">
                            Joined {getSortIcon('created_at')}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedUsers.map((user) => {
                        const billing = user.billing_info;
                        const isDeactivated = user.is_active === false;
                        
                        return (
                          <TableRow key={user.id} className={isDeactivated ? 'opacity-60' : ''}>
                            <TableCell>
                              {user.role !== 'admin' && (
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.includes(user.id)}
                                  onChange={() => handleSelectUser(user.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar>
                                    <AvatarFallback>
                                      {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {isDeactivated && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                      <Ban className="w-2 h-2 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {user.name}
                                    {isDeactivated && (
                                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs">
                                        Deactivated
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {billing ? (
                                <Badge className={getPlanTypeColor(billing.plan_type)}>
                                  {billing.plan_type.charAt(0).toUpperCase() + billing.plan_type.slice(1)}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                                  Free
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {billing && billing.monthly_amount > 0 ? (
                                <div className="font-medium text-green-600">
                                  {formatCurrency(billing.monthly_amount)}
                                </div>
                              ) : (
                                <div className="text-gray-500">$0</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {billing && billing.next_billing_date ? (
                                <div className={`text-sm ${billing.is_past_due ? 'text-red-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {formatDate(billing.next_billing_date)}
                                  {billing.is_past_due && (
                                    <div className="text-xs text-red-500">Overdue</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-500">—</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {billing ? (
                                <Badge className={getBillingStatusColor(billing.subscription_status, billing.is_past_due)}>
                                  {billing.is_past_due ? 'Past Due' : billing.subscription_status.charAt(0).toUpperCase() + billing.subscription_status.slice(1)}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                                  Free User
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.last_login ? (
                                  <>
                                    {new Date(user.last_login).toLocaleDateString()}
                                    <div className="text-xs text-gray-500">
                                      {new Date(user.last_login).toLocaleTimeString()}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-gray-400">Never</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <Badge className={user.login_count_this_month && user.login_count_this_month > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'}>
                                  {user.login_count_this_month || 0}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(user.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleUserClick(user.id)}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleImpersonateUser(user.id, user.email)}
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
                                  title="Log in as this user"
                                >
                                  <User className="w-4 h-4" />
                                </Button>
                                {user.role !== 'admin' && (
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUserDeactivation(user.id, user.is_active !== false)}
                                    className={isDeactivated 
                                      ? 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/20' 
                                      : 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20'
                                    }
                                    title={isDeactivated ? 'Activate User' : 'Deactivate User'}
                                  >
                                    {isDeactivated ? (
                                      <Power className="w-4 h-4" />
                                    ) : (
                                      <UserX className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                ) : (
                  <div 
                    className="text-center" 
                    style={{ padding: 'var(--spacing-12) var(--spacing-4)' }}
                  >
                    <Users 
                      className="mx-auto mb-[var(--spacing-4)]" 
                      style={{ 
                        width: '64px', 
                        height: '64px',
                        color: 'var(--muted-foreground)',
                        opacity: 0.5,
                      }} 
                    />
                    <h3 
                      className="mb-[var(--spacing-2)]" 
                      style={{ 
                        fontSize: '1.125rem',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                      }}
                    >
                      No Users Found
                    </h3>
                    <p 
                      className="mb-[var(--spacing-4)]" 
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {activeFiltersCount > 0 
                        ? `No users match your current ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''}.`
                        : 'No users found in the system.'
                      }
                    </p>
                    {activeFiltersCount > 0 && (
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterRole('all');
                          setFilterPlan('all');
                          setFilterStatus('all');
                          setFilterActivity('all');
                        }}
                        variant="outline"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="support" className="space-y-6">
            {supportStats && (
              <div className="grid md:grid-cols-5 gap-4 mb-6">
                <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Open</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{supportStats.open}</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-400">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{supportStats['in-progress']}</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Waiting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{supportStats['waiting-for-user']}</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Resolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{supportStats.resolved}</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600 dark:text-gray-400">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{supportStats.total}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={ticketSearchTerm}
                    onChange={(e) => setTicketSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="waiting-for-user">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ticketPriorityFilter} onValueChange={setTicketPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={generateTestTickets}
                variant="outline" 
                size="sm"
                className="border-green-200 dark:border-green-700 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <Database className="w-4 h-4 mr-2" />
                Generate Test Data
              </Button>
            </div>

            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  Manage and resolve support tickets from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supportTickets.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      {['open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'].map((status) => {
                        const statusTickets = ticketsByStatus[status] || [];
                        const statusColors = {
                          'open': 'border-red-200 bg-red-50 dark:bg-red-900/10',
                          'in-progress': 'border-blue-200 bg-blue-50 dark:bg-blue-900/10',
                          'waiting-for-user': 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10',
                          'resolved': 'border-green-200 bg-green-50 dark:bg-green-900/10',
                          'closed': 'border-gray-200 bg-gray-50 dark:bg-gray-700/10'
                        };
                        const statusIcons = {
                          'open': AlertCircle,
                          'in-progress': Clock,
                          'waiting-for-user': Clock3,
                          'resolved': CheckCircle,
                          'closed': Archive
                        };
                        const StatusIcon = statusIcons[status] || AlertCircle;
                        
                        return (
                          <Card key={status} className={`${statusColors[status]} border-2`}>
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-sm">
                                <StatusIcon className="w-4 h-4" />
                                <span className="capitalize">{status.replace('-', ' ')}</span>
                                <Badge className="ml-auto text-xs">{statusTickets.length}</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                              {statusTickets.length > 0 ? statusTickets.map((ticket) => {
                                const ticketCount = userTicketCounts[ticket.userEmail] || 0;
                                const isTroubleMaker = ticketCount >= 3;
                                
                                return (
                                  <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer hover:shadow-md transition-all"
                                    onClick={() => handleTicketClick(ticket.id)}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                                          <p className="text-xs text-gray-500 truncate">
                                            ID: {ticket.id.split('_')[1]}
                                          </p>
                                        </div>
                                        <Badge className={`ml-2 text-xs ${getPriorityColor(ticket.priority)}`}>
                                          {ticket.priority}
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="truncate flex-1">{ticket.userEmail}</span>
                                        {isTroubleMaker && (
                                          <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs">
                                            {ticketCount} tickets (30d)
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1">
                                          <MessageCircle className="w-3 h-3 text-gray-400" />
                                          <span>{ticket.messageCount}</span>
                                        </div>
                                        <span className="text-gray-500">
                                          {new Date(ticket.updatedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      
                                      <div className="text-xs capitalize text-gray-500">
                                        {ticket.type.replace('-', ' ')}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              }) : (
                                <div className="text-center py-8 text-gray-500">
                                  <div className="text-sm">No {status.replace('-', ' ')} tickets</div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                      No Support Tickets Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {supportTickets.length === 0 
                        ? "No support tickets have been created yet." 
                        : "No tickets match your current search criteria."
                      }
                    </p>
                    {supportTickets.length === 0 && (
                      <Button 
                        onClick={generateTestTickets}
                        variant="outline"
                        className="border-green-200 dark:border-green-700 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Generate Test Tickets
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Details Modal */}
            <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedTicket ? getPriorityColor(selectedTicket.priority) : 'bg-gray-100'}`}>
                      {selectedTicket?.priority === 'urgent' ? <AlertTriangle className="w-5 h-5" /> :
                       selectedTicket?.priority === 'high' ? <AlertCircle className="w-5 h-5" /> :
                       <HelpCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div>{selectedTicket?.subject}</div>
                      <div className="text-sm text-gray-500 font-normal">
                        Ticket #{selectedTicket?.id.split('_')[1]} • {selectedTicket?.userEmail}
                      </div>
                    </div>
                    <Badge className={selectedTicket ? getStatusColor(selectedTicket.status) : ''}>
                      {selectedTicket?.status.replace('-', ' ')}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    View and manage support ticket details, including messages, status updates, and resolution history.
                  </DialogDescription>
                </DialogHeader>
                
                {selectedTicket && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <Label className="text-xs text-gray-500">Type</Label>
                        <div className="font-medium capitalize">{selectedTicket.type.replace('-', ' ')}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Priority</Label>
                        <div className="font-medium capitalize">{selectedTicket.priority}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Created</Label>
                        <div className="font-medium">{new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Last Update</Label>
                        <div className="font-medium">{new Date(selectedTicket.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="ticket-status">Update Status</Label>
                        <div className="flex gap-2 mt-2">
                          <Select value={ticketStatusUpdate} onValueChange={setTicketStatusUpdate}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="waiting-for-user">Waiting for User</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleTicketStatusChange}
                            disabled={ticketStatusUpdate === selectedTicket.status}
                            size="sm"
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Conversation</Label>
                      <div className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
                        {selectedTicket.messages.map((message) => (
                          <div key={message.id} className={`p-3 rounded-lg ${
                            message.sender === 'admin' 
                              ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' 
                              : message.sender === 'system'
                              ? 'bg-gray-50 dark:bg-gray-800/50 mx-4 text-center'
                              : 'bg-gray-50 dark:bg-gray-800/50 mr-8'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {message.sender === 'admin' ? 'A' : message.sender === 'system' ? 'S' : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">
                                  {message.sender === 'admin' ? 'Admin' : 
                                   message.sender === 'system' ? 'System' : 'User'}
                                </span>
                                {message.sender !== 'system' && (
                                  <span className="text-xs text-gray-500">
                                    {message.senderEmail}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm whitespace-pre-wrap">
                              {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="reply-message">Admin Reply</Label>
                      <Textarea
                        id="reply-message"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply to the user..."
                        rows={4}
                      />
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleTicketReply}
                          disabled={!replyMessage.trim()}
                          className="flex-1"
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          Send Reply
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowTicketDetails(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Job Applications Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <AdminJobApplications />
          </TabsContent>

          {/* Support Chat Tab */}
          <TabsContent value="support-chat" className="space-y-6">
            <SupportChatManager />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle>Admin Notifications</CardTitle>
                <CardDescription>
                  Stay updated on platform activity and user requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length > 0 ? notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        notification.read 
                          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'help_request' ? 'bg-red-100 text-red-600' :
                            notification.type === 'community_post' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {notification.type === 'help_request' ? <AlertTriangle className="w-4 h-4" /> :
                             notification.type === 'community_post' ? <MessageCircle className="w-4 h-4" /> :
                             <Bell className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-200">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                        No Notifications
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        All caught up! No new notifications to review.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Subscription Management</h2>
                  <p className="text-muted-foreground">Monitor and manage all user subscriptions</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      console.log('🔧 Admin: Manual subscription sync triggered');
                      try {
                        const response = await fetch(`${serverUrl}/admin/sync-all-subscriptions`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || publicAnonKey}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ adminAction: true })
                        });
                        
                        const result = await response.json();
                        console.log('🔧 Admin: Sync result:', result);
                        
                        if (response.ok) {
                          toast.success('Subscription sync completed');
                          await loadAdminData(); // Refresh the data
                        } else {
                          toast.error(`Sync failed: ${result.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('🔧 Admin: Sync error:', error);
                        toast.error('Sync failed');
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync All Subscriptions
                  </Button>
                  <Button
                    onClick={() => setSubscriptionDebugVisible(!subscriptionDebugVisible)}
                    variant={subscriptionDebugVisible ? "default" : "outline"}
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {subscriptionDebugVisible ? 'Hide' : 'Show'} Debug Panel
                  </Button>
                </div>
              </div>
              
              {subscriptionDebugVisible && (
                <Card>
                  <CardContent className="p-6">
                    <SubscriptionDebugPanel user={user} />
                  </CardContent>
                </Card>
              )}

              {/* Subscription Filters and Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search subscriptions..."
                          value={subscriptionSearchTerm}
                          onChange={(e) => setSubscriptionSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                          <SelectItem value="past_due">Past Due</SelectItem>
                          <SelectItem value="trialing">Trialing</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={subscriptionPlanFilter} onValueChange={setSubscriptionPlanFilter}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Plans</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="creator">Creator</SelectItem>
                          <SelectItem value="builder">Builder</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Subscriptions Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    All User Subscriptions ({subscriptions.filter(sub => {
                      const matchesSearch = 
                        sub.user_email?.toLowerCase().includes(subscriptionSearchTerm.toLowerCase()) ||
                        sub.user_name?.toLowerCase().includes(subscriptionSearchTerm.toLowerCase()) ||
                        sub.id?.toLowerCase().includes(subscriptionSearchTerm.toLowerCase());
                      const matchesStatus = subscriptionStatusFilter === 'all' || sub.status === subscriptionStatusFilter;
                      const matchesPlan = subscriptionPlanFilter === 'all' || sub.plan === subscriptionPlanFilter;
                      return matchesSearch && matchesStatus && matchesPlan;
                    }).length} total)
                  </CardTitle>
                  <CardDescription>
                    View and manage all user subscriptions in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                        No Subscriptions Found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No subscription data found in the database.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => {
                            console.log('🔧 Debug: Current subscriptions state:', subscriptions);
                            console.log('🔧 Debug: Subscriptions length:', subscriptions.length);
                            console.log('🔧 Debug: Type of subscriptions:', typeof subscriptions);
                            console.log('🔧 Debug: Is array?', Array.isArray(subscriptions));
                            toast.info('Check console for subscription debug info');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Debug State
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              const { data: { session } } = await supabase.auth.getSession();
                              const accessToken = session?.access_token;
                              
                              const response = await fetch(`${serverUrl}/admin/subscriptions`, {
                                headers: {
                                  'Authorization': `Bearer ${accessToken}`,
                                  'Content-Type': 'application/json'
                                }
                              });
                              
                              const result = await response.json();
                              console.log('🔧 Manual subscription fetch result:', result);
                              toast.info('Check console for manual fetch results');
                            } catch (error) {
                              console.error('🔧 Manual subscription fetch error:', error);
                              toast.error('Manual fetch failed - check console');
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Manual Fetch
                        </Button>
                        <Button
                          onClick={() => {
                            console.log('🔧 Forcing admin data reload...');
                            loadAdminData();
                            toast.info('Reloading admin data...');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Reload
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Billing</TableHead>
                            <TableHead>Period End</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptions
                            .filter(sub => {
                              const matchesSearch = 
                                sub.user_email?.toLowerCase().includes(subscriptionSearchTerm.toLowerCase()) ||
                                sub.user_name?.toLowerCase().includes(subscriptionSearchTerm.toLowerCase()) ||
                                sub.id?.toLowerCase().includes(subscriptionSearchTerm.toLowerCase());
                              const matchesStatus = subscriptionStatusFilter === 'all' || sub.status === subscriptionStatusFilter;
                              const matchesPlan = subscriptionPlanFilter === 'all' || sub.plan === subscriptionPlanFilter;
                              return matchesSearch && matchesStatus && matchesPlan;
                            })
                            .map((subscription) => (
                              <TableRow key={subscription.id || subscription.user_id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {subscription.user_name?.charAt(0)?.toUpperCase() || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {subscription.user_name || 'Unknown User'}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {subscription.user_email || 'Unknown Email'}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getPlanTypeColor(subscription.plan)}>
                                    {subscription.plan?.charAt(0)?.toUpperCase() + subscription.plan?.slice(1) || 'Free'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getBillingStatusColor(subscription.status, false)}>
                                    {subscription.status?.charAt(0)?.toUpperCase() + subscription.status?.slice(1) || 'Unknown'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {subscription.billing_period || 'Monthly'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {subscription.current_period_end ? 
                                      formatDate(subscription.current_period_end) : 
                                      'No end date'
                                    }
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {subscription.source || 'Unknown'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log('🔍 Subscription details:', subscription);
                                        toast.info('Check console for subscription details');
                                      }}
                                      title="View Details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    
                                    {/* Change Plan Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSubscriptionAction(subscription, 'changePlan')}
                                      title="Change Plan"
                                      className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    {/* Change Status Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSubscriptionAction(subscription, 'changeStatus')}
                                      title="Change Status"
                                      className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>

                                    {/* Cancel/Restore Button */}
                                    {subscription.status === 'canceled' ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSubscriptionAction(subscription, 'restore')}
                                        title="Restore Subscription"
                                        className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSubscriptionAction(subscription, 'cancel')}
                                        title="Cancel Subscription"
                                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Admin User Subscription Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Admin Subscription Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Status</p>
                        <Badge variant={subscriptionData?.status === 'subscribed' ? 'default' : 'secondary'}>
                          {subscriptionData?.status || 'Free'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Plan</p>
                        <Badge variant="outline">
                          {subscriptionData?.plan || 'Free'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Can Access Operations</p>
                        <Badge variant={canAccessOperations ? 'default' : 'secondary'}>
                          {canAccessOperations ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Is Creator+</p>
                        <Badge variant={isCreatorOrHigher ? 'default' : 'secondary'}>
                          {isCreatorOrHigher ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          console.log('🔧 Admin: Force subscription refresh');
                          await refreshSubscriptions();
                          toast.success('Subscription data refreshed');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Force Refresh
                      </Button>
                      
                      <Button
                        onClick={() => {
                          console.log('🔧 Admin: Current subscription state:', {
                            subscriptionData,
                            canAccessOperations,
                            isCreatorOrHigher,
                            isProUser,
                            userId: user?.id
                          });
                          toast.info('Check console for detailed subscription state');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Terminal className="h-4 w-4 mr-2" />
                        Debug to Console
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch(`${serverUrl}/admin/fix-subscription-state`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || publicAnonKey}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ 
                                userId: user.id,
                                forceStatus: 'subscribed',
                                forcePlan: 'creator'
                              })
                            });
                            
                            const result = await response.json();
                            console.log('🔧 Admin: Fix result:', result);
                            
                            if (response.ok) {
                              await refreshSubscriptions();
                              toast.success('Subscription state fixed');
                            } else {
                              toast.error(`Fix failed: ${result.error || 'Unknown error'}`);
                            }
                          } catch (error) {
                            console.error('🔧 Admin: Fix error:', error);
                            toast.error('Fix failed');
                          }
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Force Fix State
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Action Modal */}
              <Dialog open={showSubscriptionAction} onOpenChange={setShowSubscriptionAction}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {subscriptionAction === 'cancel' && 'Cancel Subscription'}
                      {subscriptionAction === 'changePlan' && 'Change Subscription Plan'}
                      {subscriptionAction === 'changeStatus' && 'Change Subscription Status'}
                      {subscriptionAction === 'restore' && 'Restore Subscription'}
                    </DialogTitle>
                    <DialogDescription>
                      Managing subscription for {selectedSubscription?.user_name} ({selectedSubscription?.user_email})
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {subscriptionAction === 'cancel' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="cancelReason">Cancellation Reason</Label>
                          <Select value={cancelReason} onValueChange={setCancelReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin_decision">Admin Decision</SelectItem>
                              <SelectItem value="user_request">User Request</SelectItem>
                              <SelectItem value="policy_violation">Policy Violation</SelectItem>
                              <SelectItem value="payment_issues">Payment Issues</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="immediateCancel"
                            checked={immediateCancel}
                            onChange={(e) => setImmediateCancel(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="immediateCancel">Cancel immediately (vs. end of billing period)</Label>
                        </div>
                      </>
                    )}

                    {subscriptionAction === 'changePlan' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="newPlan">New Plan</Label>
                          <Select value={newPlan} onValueChange={setNewPlan}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="creator">Creator</SelectItem>
                              <SelectItem value="builder">Builder</SelectItem>
                              <SelectItem value="studio">Studio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newBillingPeriod">Billing Period</Label>
                          <Select value={newBillingPeriod} onValueChange={setNewBillingPeriod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select billing period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {subscriptionAction === 'changeStatus' && (
                      <div className="space-y-2">
                        <Label htmlFor="newStatus">New Status</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                            <SelectItem value="past_due">Past Due</SelectItem>
                            <SelectItem value="trialing">Trialing</SelectItem>
                            <SelectItem value="incomplete">Incomplete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {subscriptionAction === 'restore' && (
                      <div className="space-y-2">
                        <Label htmlFor="restorePlan">Restore to Plan</Label>
                        <Select value={newPlan} onValueChange={setNewPlan}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="creator">Creator</SelectItem>
                            <SelectItem value="builder">Builder</SelectItem>
                            <SelectItem value="studio">Studio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="adminNote">Admin Note (Optional)</Label>
                      <Textarea
                        id="adminNote"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add a note about this action..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowSubscriptionAction(false)}
                        disabled={actionLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={executeSubscriptionAction}
                        disabled={actionLoading || (subscriptionAction === 'cancel' && !cancelReason)}
                        variant={subscriptionAction === 'cancel' ? 'destructive' : 'default'}
                      >
                        {actionLoading ? 'Processing...' : getActionButtonText()}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Founder Calls Tab */}
          <TabsContent value="founder-calls" className="space-y-6">
            <FounderCallsAdmin />
          </TabsContent>

          {/* CPA Roadmap Tab */}
          <TabsContent value="cpa-roadmap" className="space-y-6">
            <CPAServicesAutomation />
          </TabsContent>

          {/* GPT-5.1 Function Test Tab */}
          <TabsContent value="function-test" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Testing & Debugging
                </CardTitle>
                <CardDescription>Test email delivery system and debug email issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* System Status Section */}
                <div className="border border-border rounded-[var(--radius-lg)] p-4 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Email System Status
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={checkEmailSystemStatus}
                      disabled={emailSystemStatus.loading}
                      className="h-8"
                    >
                      {emailSystemStatus.loading ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Check Status
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-white/50 dark:bg-gray-950/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">SendGrid API Key</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {emailSystemStatus.configured ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-700 dark:text-green-300">Configured</span>
                          </>
                        ) : emailSystemStatus.error ? (
                          <>
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm text-red-700 dark:text-red-300">Not Configured</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-muted-foreground">Unknown</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* FROM Email Status */}
                    {emailSystemStatus.configured && (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-white/50 dark:bg-gray-950/50">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">From Email Address</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!emailSystemStatus.isDefaultFromEmail ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-green-700 dark:text-green-300">{emailSystemStatus.fromEmail}</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                <span className="text-sm text-orange-700 dark:text-orange-300">Not Set</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {emailSystemStatus.isDefaultFromEmail && (
                          <div className="p-3 rounded-[var(--radius-md)] bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                            <p className="text-sm text-orange-900 dark:text-orange-100">
                              <strong>⚠️ Sender Verification Required!</strong>
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                              <strong>Step 1:</strong> Go to <a href="https://app.sendgrid.com/settings/sender_auth/senders" target="_blank" rel="noopener noreferrer" className="underline font-medium">SendGrid Sender Authentication</a>
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                              <strong>Step 2:</strong> Click "Create New Sender" and verify your email address
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                              <strong>Step 3:</strong> Set SENDGRID_FROM_EMAIL to your verified email (e.g., hello@cofounderplus.com)
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                              <strong>Step 4:</strong> Optionally set SENDGRID_FROM_NAME (e.g., "Cofounder+")
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {emailSystemStatus.error && (
                      <div className="p-3 rounded-[var(--radius-md)] bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-orange-900 dark:text-orange-100">
                          <strong>Action Required:</strong> Please configure your SendGrid API key in the environment variables.
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Get your API key from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="underline">SendGrid Dashboard</a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Email Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Test Email Address</Label>
                    <Input
                      id="test-email"
                      type="email"
                      placeholder="your@email.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the email address where you want to receive the test email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-type">Email Type</Label>
                    <Select
                      value={testEmailType}
                      onValueChange={setTestEmailType}
                    >
                      <SelectTrigger className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple Test Email</SelectItem>
                        <SelectItem value="confirmation">Booking Confirmation</SelectItem>
                        <SelectItem value="cancelled">Payment Cancelled</SelectItem>
                        <SelectItem value="reminder">Call Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choose which email template to test
                    </p>
                  </div>

                  <Button
                    onClick={handleSendTestEmail}
                    disabled={sendingTestEmail || !testEmailAddress}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {sendingTestEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </div>

                {/* Results Display */}
                {testEmailResult && (
                  <div className={`p-4 rounded-[var(--radius-lg)] border ${
                    testEmailResult.success 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      {testEmailResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-2">
                        <p className={testEmailResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                          {testEmailResult.message}
                        </p>
                        {testEmailResult.success && testEmailResult.details && (
                          <div className="text-sm space-y-1 text-green-800 dark:text-green-200">
                            <p><strong>Type:</strong> {testEmailResult.details.testType}</p>
                            <p><strong>Sent to:</strong> {testEmailAddress}</p>
                            <p><strong>Time:</strong> {new Date(testEmailResult.details.timestamp).toLocaleString()}</p>
                          </div>
                        )}
                        {!testEmailResult.success && testEmailResult.error && (
                          <div className="text-sm text-red-800 dark:text-red-200 font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
                            {testEmailResult.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Email System Info */}
                <div className="space-y-4">
                  {/* Setup Instructions (if not configured) */}
                  {!emailSystemStatus.configured && emailSystemStatus.error && (
                    <div className="border border-orange-200 dark:border-orange-800 rounded-[var(--radius-lg)] p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
                      <h4 className="flex items-center gap-2 mb-3 text-orange-900 dark:text-orange-100">
                        <Zap className="w-4 h-4" />
                        SendGrid Setup Required
                      </h4>
                      <div className="text-sm space-y-3 text-orange-800 dark:text-orange-200">
                        <p><strong>Step 1:</strong> Go to <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">SendGrid API Keys</a></p>
                        <p><strong>Step 2:</strong> Create a new API key with "Mail Send" permissions</p>
                        <p><strong>Step 3:</strong> Copy the API key (starts with "SG.") and add it to SENDGRID_API_KEY</p>
                        <p><strong>Step 4:</strong> Go to <a href="https://app.sendgrid.com/settings/sender_auth/senders" target="_blank" rel="noopener noreferrer" className="underline font-medium">Sender Authentication</a></p>
                        <p><strong>Step 5:</strong> Click "Create New Sender" and verify your email address</p>
                        <p><strong>Step 6:</strong> Set SENDGRID_FROM_EMAIL to your verified email address</p>
                        <p><strong>Step 7:</strong> Optionally set SENDGRID_FROM_NAME to your brand name</p>
                      </div>
                    </div>
                  )}

                  {/* Debugging Tips */}
                  <div className="border border-border rounded-[var(--radius-lg)] p-4 bg-blue-50/50 dark:bg-blue-900/10">
                    <h4 className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-4 h-4" />
                      Debugging Tips
                    </h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• <strong>Check spam folder:</strong> Test emails often end up in spam/junk</li>
                      <li>• <strong>Verify API key:</strong> Make sure it starts with "SG." and has Mail Send permissions</li>
                      <li>• <strong>Check server logs:</strong> Look at the console for detailed error messages</li>
                      <li>• <strong>Verify sender identity:</strong> The from email must be verified in SendGrid's <a href="https://app.sendgrid.com/settings/sender_auth/senders" target="_blank" rel="noopener noreferrer" className="underline">Sender Authentication</a></li>
                      <li>• <strong>Set SENDGRID_FROM_EMAIL:</strong> Use your verified sender email address</li>
                      <li>• <strong>Test different providers:</strong> Try Gmail, Outlook, and other providers</li>
                      <li>• <strong>Wait a minute:</strong> Email delivery can take 30-60 seconds</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bulk Role Update Dialog */}
      <Dialog open={showBulkRoleDialog} onOpenChange={setShowBulkRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {selectedUserIds.length} Users</DialogTitle>
            <DialogDescription>
              Select the new role to assign to the selected users. Admin users cannot have their role changed via bulk actions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkRoleDialog(false)}
              disabled={bulkActionInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkRoleUpdate}
              disabled={bulkActionInProgress}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {bulkActionInProgress ? 'Updating...' : 'Update Roles'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;