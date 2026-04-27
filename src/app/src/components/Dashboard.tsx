import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useBusiness } from './BusinessContext';
import { useTheme } from './ThemeProvider';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { useDebounceResize } from '../utils/reactHelpers';
import { getUserFirstName, getUserInitials, getUserDisplayName } from '../utils/userUtils';
import { isIOS } from '../utils/platformDetection';

import { BusinessManagement } from './BusinessManagement';
import { BusinessSwitcher } from './BusinessSwitcher';
import { BusinessCreationModal } from './BusinessCreationModal';
import SupportButton from './SupportButton';
import { getTopGoal, getDreams } from '../utils/dreamBoardApi';
import { NumberOneGoalWidget } from './NumberOneGoalWidget';
import { ImportantNotesWidget } from './ImportantNotesWidget';
import { GettingStartedChecklist } from './GettingStartedChecklist';
import { DashboardWidgetCustomizer, AVAILABLE_WIDGETS } from './DashboardWidgetCustomizer';
import { QuickStatsWidget } from './QuickStatsWidget';
import { RecentTransactionsWidget } from './RecentTransactionsWidget';
import { TeamOverviewWidget } from './TeamOverviewWidget';
import { RoadmapProgressWidget } from './RoadmapProgressWidget';
import { BusinessHealthScoreWidget } from './BusinessHealthScoreWidget';
import { IndustryBenchmarkWidget } from './IndustryBenchmarkWidget';
import { CofounderDashboardAssistant } from './CofounderDashboardAssistant';
import { CofounderValueDashboard } from './CofounderValueDashboard';
import { CofounderRecommendations } from './CofounderRecommendations';
import { AutomationReportsWidget } from './AutomationReportsWidget';
import { DashboardCEOWidgets } from './DashboardCEOWidgets';

import { 
  Moon, Sun, Settings, Bell, Search, TrendingUp, Target, 
  Zap, Users, Building, DollarSign, BarChart3, PieChart, Calendar,
  Package, Megaphone, CreditCard, UserCheck, FileText,
  MapPin, Rocket, Crown, Award, Gift, Star, ChevronRight, Plus,
  Activity, Eye, ArrowUp, Clock, CheckCircle2, AlertTriangle,
  Lightbulb, MessageSquare, HelpCircle, Menu, X, Home, Building2,
  LogOut, Wifi, WifiOff, RefreshCw, Server, User, Shield,
  Check, Database, Sparkles, Briefcase, GraduationCap, MessageCircle, LayoutGrid
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface DashboardProps {
  user: any;
  customServerAvailable?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, customServerAvailable = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { 
    selectedBusiness, 
    userBusinesses, 
    setSelectedBusiness,
    isLoading, 
    hasLoadingError, 
    retryBusinessLoad, 
    isServerAvailable, 
    serverErrorMessage 
  } = useBusiness();
  
  // Mobile-first approach - start with closed sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showBusinessSwitcher, setShowBusinessSwitcher] = useState(false);
  const [showWidgetCustomizer, setShowWidgetCustomizer] = useState(false);
  const [showCofounderDashboard, setShowCofounderDashboard] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>([
    'number-one-goal',
    'important-notes'
  ]);

  const [isMobile, setIsMobile] = useState(false);

  console.log('Dashboard: Rendering for user:', user?.email, 'Business:', selectedBusiness?.name, 'CustomServer:', customServerAvailable, 'BusinessServer:', isServerAvailable);

  // Helper function to check if user is admin (same logic as App.tsx)
  const isAdminUser = (user: any): boolean => {
    return user?.email === 'tylerg@cofounderplus.com' || user?.email === 'admin@cofounderplus.com';
  };

  // Check if mobile screen with debounced resize
  useDebounceResize(() => {
    setIsMobile(window.innerWidth < 768);
    // Auto-close sidebar on mobile, auto-open on desktop
    setSidebarOpen(window.innerWidth >= 768);
  }, 150);

  // Load widget preferences from server
  useEffect(() => {
    const loadWidgetPreferences = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        console.log('📊 Loading widget preferences...');

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/dashboard/widgets`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📊 Widget preferences response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Widget preferences loaded:', data);
          if (data.success && data.widgets) {
            setActiveWidgets(data.widgets);
          }
        } else {
          const errorData = await response.json();
          console.error('📊 Failed to load widget preferences:', errorData);
        }
      } catch (error: any) {
        // Network errors are common when offline or during development
        if (error?.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
          console.error('📊 Error loading widget preferences:', error);
        }
        // Continue with defaults
      }
    };

    loadWidgetPreferences();
  }, [user?.id]);

  // Load desktop navigation preferences
  const [desktopNavOptions, setDesktopNavOptions] = useState<string[]>([
    'dashboard', 'operations-hub', 'cofounder-agi', 'notes'
  ]);

  useEffect(() => {
    const loadDesktopNav = async () => {
      if (isMobile) return; // Only load for desktop

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (!accessToken) return;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/nav-customize/get-desktop`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.navOptions) {
            setDesktopNavOptions(data.navOptions);
          } else {
            // Use defaults if no saved preferences
            console.log('Using default desktop nav options');
          }
        } else {
          console.warn('Could not load desktop nav, using defaults');
        }
      } catch (error: any) {
        // Network errors are common when offline or during development
        if (error?.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
          console.error('Error loading desktop nav:', error);
        }
        // Continue with defaults - don't break the app
      }
    };

    loadDesktopNav();

    // Listen for updates
    const handleNavUpdate = (event: any) => {
      if (event.detail) {
        setDesktopNavOptions(event.detail);
      }
    };

    window.addEventListener('desktopNavUpdated', handleNavUpdate);
    
    return () => {
      window.removeEventListener('desktopNavUpdated', handleNavUpdate);
    };
  }, [isMobile, user?.id]);

  // Build navigation items dynamically based on desktop preferences
  const buildNavigationItems = () => {
    const allNavOptions = {
      'dashboard': { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: Home, 
        path: '/dashboard',
        active: true
      },
      'operations-hub': { 
        id: 'operations-hub', 
        label: 'Business OS', 
        icon: LayoutGrid,
        path: '/operations',
        submenu: [
          { label: 'Product', path: '/operations/product', icon: Package },
          { label: 'Marketing', path: '/operations/marketing', icon: Megaphone },
          { label: 'Sales', path: '/operations/sales', icon: DollarSign },
          { label: 'Finance', path: '/operations/finance', icon: CreditCard },
          { label: 'Human Resources', path: '/operations/hr', icon: UserCheck }
        ]
      },
      'cofounder-agi': { 
        id: 'cofounder-agi', 
        label: 'Roadmap', 
        icon: Sparkles, 
        path: '/roadmap'
      },
      'notes': { 
        id: 'notes', 
        label: 'Notes', 
        icon: FileText, 
        path: '/notes'
      },
      'cofounder-chat': { 
        id: 'cofounder-chat', 
        label: 'Chat', 
        icon: MessageCircle, 
        path: '/cofounder-ai'
      },
      'product': { 
        id: 'product', 
        label: 'Product', 
        icon: Package, 
        path: '/operations/product'
      },
      'marketing': { 
        id: 'marketing', 
        label: 'Marketing', 
        icon: Megaphone, 
        path: '/operations/marketing'
      },
      'sales': { 
        id: 'sales', 
        label: 'Sales', 
        icon: TrendingUp, 
        path: '/operations/sales'
      },
      'finance': { 
        id: 'finance', 
        label: 'Finance', 
        icon: CreditCard, 
        path: '/operations/finance'
      },
      'hr': { 
        id: 'hr', 
        label: 'HR', 
        icon: Users, 
        path: '/operations/hr'
      },
      'team': { 
        id: 'team', 
        label: 'Team', 
        icon: Users, 
        path: '/settings?tab=team'
      },
      'university': { 
        id: 'university', 
        label: 'University', 
        icon: GraduationCap, 
        path: '/university'
      },
      'dream-board': { 
        id: 'dream-board', 
        label: 'Dream Board', 
        icon: Sparkles, 
        path: '/dream-board'
      },
      'hubspot': { 
        id: 'hubspot', 
        label: 'Hubspot', 
        icon: Briefcase, 
        path: '/hubspot'
      },
      'salesforce': { 
        id: 'salesforce', 
        label: 'Salesforce', 
        icon: Briefcase, 
        path: '/salesforce'
      },
      'cofounder-settings': {
        id: 'cofounder-settings',
        label: 'Cofounder Settings',
        icon: Settings,
        path: '/cofounder-settings'
      }
    };

    // On desktop, use customized navigation
    if (!isMobile) {
      return desktopNavOptions
        .map(optionId => allNavOptions[optionId as keyof typeof allNavOptions])
        .filter(Boolean);
    }

    // On mobile, use default navigation (or could also be customizable)
    return [
      allNavOptions.dashboard,
      allNavOptions['operations-hub'],
      allNavOptions['cofounder-agi'],
      allNavOptions.notes
    ];
  };

  const navigationItems = buildNavigationItems();

  // State for finance data
  const [financeData, setFinanceData] = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  
  // State for #1 goal from Dream Board
  const [numberOneGoal, setNumberOneGoal] = useState<any>(null);

  // Fetch finance data for selected business
  useEffect(() => {
    const fetchFinanceData = async () => {
      if (!selectedBusiness || !customServerAvailable || !isServerAvailable) {
        console.log('Dashboard: Skipping finance fetch -', { 
          hasBusinessId: !!selectedBusiness, 
          customServerAvailable, 
          isServerAvailable 
        });
        return;
      }

      try {
        setFinanceLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('Dashboard: No session available for finance fetch');
          return;
        }

        console.log('Dashboard: Fetching finance data for business:', selectedBusiness.id);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/data?businessId=${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard: Finance data loaded successfully:', {
            transactions: data.transactions?.length || 0,
            invoices: data.invoices?.length || 0,
            budgets: data.budgets?.length || 0
          });
          setFinanceData(data);
        } else {
          const errorText = await response.text();
          console.error('Dashboard: Finance data fetch failed:', response.status, errorText);
        }
      } catch (error: any) {
        // Network errors are common when offline or during development
        if (error?.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
          console.error('Error fetching finance data:', error);
        }
      } finally {
        setFinanceLoading(false);
      }
    };

    fetchFinanceData();
  }, [selectedBusiness, customServerAvailable, isServerAvailable]);

  // Load #1 goal from Dream Board using database API
  useEffect(() => {
    const loadNumberOneGoal = async () => {
      if (!user?.id) return;

      try {
        console.log('🎯 Dashboard: Loading #1 goal for user:', user.id);
        
        // Get current session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        // Get the #1 goal ID from the database (pass selectedBusiness?.id as the 2nd param)
        // Check API first, then localStorage as backup
        let goalId = await getTopGoal(user.id, selectedBusiness?.id, accessToken);
        
        if (!goalId) {
           // Fallback to localStorage if API returns null (e.g. offline or potential sync delay)
           const localGoalId = localStorage.getItem(`cofounder_number_one_goal_${user.id}`);
           if (localGoalId) {
             console.log('🎯 Dashboard: Using localStorage fallback for #1 goal:', localGoalId);
             goalId = localGoalId;
           }
        }
        
        if (goalId) {
          // Get all dreams to find the goal dream
          const dreams = await getDreams(user.id, selectedBusiness?.id, accessToken);
          const goalDream = dreams.find(dream => dream.id === goalId);
          
          if (goalDream) {
            console.log('🎯 Dashboard: Found #1 goal:', goalDream.title);
            setNumberOneGoal(goalDream);
          } else {
            console.log('🎯 Dashboard: #1 goal ID found but dream not found in current context:', goalId);
            // This happens if the goal belongs to a different business or context
            setNumberOneGoal(null);
          }
        } else {
          console.log('🎯 Dashboard: No #1 goal set');
          setNumberOneGoal(null);
        }
        
      } catch (error: any) {
        console.error('🎯 Dashboard: Error loading #1 goal:', error);
        setNumberOneGoal(null);
      }
    };

    loadNumberOneGoal();
    
    // Refresh when page becomes visible (user returns from Dream Board)
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log('🎯 Dashboard: Page visible, refreshing #1 goal...');
        loadNumberOneGoal();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for custom events from the Dream Board when goals are updated
    const handleGoalUpdate = () => {
      console.log('🎯 Dashboard: Goal update event received, refreshing...');
      loadNumberOneGoal();
    };
    
    window.addEventListener('goalUpdated', handleGoalUpdate);
    // Also listen for storage events (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('cofounder_number_one_goal')) {
        console.log('🎯 Dashboard: Storage event received, refreshing...');
        loadNumberOneGoal();
      }
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('goalUpdated', handleGoalUpdate);
      window.removeEventListener('storage', handleGoalUpdate);
    };
  }, [user?.id, selectedBusiness?.id]);

  // Calculate user stats based on real data including finance
  const getUserStats = () => {
    const businessCount = userBusinesses.length;
    
    // Calculate revenue from finance transactions if available
    let totalRevenue = 0;
    if (financeData?.transactions) {
      totalRevenue = financeData.transactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    }
    
    // Fallback to business revenue if no finance data
    if (totalRevenue === 0) {
      totalRevenue = userBusinesses.reduce((sum, business) => {
        return sum + (business.revenue || 0);
      }, 0);
    }

    const totalEmployees = userBusinesses.reduce((sum, business) => {
      return sum + (business.employees || 0);
    }, 0);
    
    const accountCreated = new Date(user?.created_at || Date.now());
    const daysSinceCreation = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate expenses
    let totalExpenses = 0;
    if (financeData?.transactions) {
      totalExpenses = financeData.transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    }

    // Calculate pending invoices
    let pendingInvoices = 0;
    if (financeData?.invoices) {
      pendingInvoices = financeData.invoices
        .filter((inv: any) => inv.status === 'pending')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    }

    return {
      businessCount,
      totalRevenue,
      totalExpenses,
      pendingInvoices,
      totalEmployees,
      daysSinceCreation
    };
  };

  const userStats = getUserStats();

  const quickStats = [
    {
      title: 'Total Revenue',
      value: userStats.totalRevenue > 0 ? `${userStats.totalRevenue.toLocaleString()}` : '$0',
      change: null,
      trend: 'neutral',
      icon: DollarSign,
      color: 'text-green-600',
      actionLabel: 'Manage Income',
      actionPath: '/operations/finance',
      actionDescription: 'Add or edit revenue transactions'
    },
    {
      title: 'Total Expenses',
      value: userStats.totalExpenses > 0 ? `${userStats.totalExpenses.toLocaleString()}` : '$0',
      change: null,
      trend: 'neutral',
      icon: CreditCard,
      color: 'text-red-600',
      actionLabel: 'Manage Expenses',
      actionPath: '/operations/finance',
      actionDescription: 'Add or edit expense transactions'
    },
    {
      title: 'Pending Invoices',
      value: userStats.pendingInvoices > 0 ? `${userStats.pendingInvoices.toLocaleString()}` : '$0',
      change: null,
      trend: 'neutral',
      icon: FileText,
      color: 'text-orange-600',
      actionLabel: 'Manage Invoices',
      actionPath: '/operations/finance',
      actionDescription: 'Create and manage invoices'
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    // Close mobile sidebar after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSubmenuNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSignOut = async () => {
    console.log('🔧 Dashboard: Sign out initiated');
    
    // Step 1: Set signing out flag BEFORE any other operations
    // This ensures we show loading screen even if reload happens
    try {
      localStorage.setItem('cofounder_signing_out', 'true');
    } catch (e) {
      // If localStorage fails, continue anyway
    }
    
    // Step 2: Show loading overlay immediately
    const overlay = document.createElement('div');
    overlay.id = 'signout-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 20px;
    `;
    overlay.innerHTML = `
      <div style="width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #00E0FF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div style="color: #374151; font-size: 16px; font-weight: 600;">Signing out...</div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(overlay);
    
    // Step 3: Small delay to ensure overlay is visible (prevents flicker)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 4: Clear storage
    try {
      localStorage.clear();
      sessionStorage.clear();
      // Re-set the signing out flag
      localStorage.setItem('cofounder_signing_out', 'true');
    } catch (e) {
      console.error('Storage clear error:', e);
    }
    
    // Step 5: Sign out from Supabase (non-blocking)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('🔧 Dashboard: Supabase sign out error (non-blocking):', error);
    }
    
    // Step 6: Reload to home with hash router
    console.log('🔧 Dashboard: Reloading to complete sign out');
    window.location.href = '/#/';
  };

  const handleProfileNavigate = () => {
    navigate('/profile');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSettingsNavigate = () => {
    navigate('/settings');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleCreateBusiness = () => {
    console.log('Dashboard: Opening business creation modal');
    setShowBusinessModal(true);
  };

  const handleBusinessSwitchAction = () => {
    console.log('Dashboard: Opening business switcher');
    setShowBusinessSwitcher(true);
  };

  const handleGetSupport = () => {
    console.log('Dashboard: Opening support dialog');
    setShowSupportModal(true);
  };

  const handleRetryConnection = async () => {
    console.log('Dashboard: Retrying business load...');
    try {
      await retryBusinessLoad();
    } catch (error) {
      console.error('Dashboard: Retry failed:', error);
    }
  };

  const handleDiagnosticNavigation = () => {
    navigate('/database-diagnostic');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const formatBusinessAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  // Render widget component dynamically based on widget ID
  const renderWidget = (widgetId: string) => {
    // Only block widgets if we have a TEMPORARY business ID (which means we're in a transitional state)
    // Don't block if business is just null/undefined - let widgets handle that themselves
    if (selectedBusiness?.id?.startsWith('temp-')) {
      return null;
    }

    switch (widgetId) {
      case 'number-one-goal':
        return <NumberOneGoalWidget key={widgetId} goal={numberOneGoal} />;
      case 'important-notes':
        return <ImportantNotesWidget key={widgetId} businessId={selectedBusiness?.id || ''} />;
      case 'recent-transactions':
        return (
          <RecentTransactionsWidget 
            key={widgetId}
            businessId={selectedBusiness?.id || ''}
            maxItems={isMobile ? 3 : 5}
          />
        );
      case 'team-overview':
        return (
          <TeamOverviewWidget 
            key={widgetId}
            businessId={selectedBusiness?.id || ''}
            userId={user.id}
          />
        );
      case 'roadmap-progress':
        return <RoadmapProgressWidget key={widgetId} businessId={selectedBusiness?.id || ''} />;
      case 'business-health-score':
        return <BusinessHealthScoreWidget key={widgetId} businessId={selectedBusiness?.id || ''} />;
      case 'industry-benchmarks':
        return <IndustryBenchmarkWidget key={widgetId} businessId={selectedBusiness?.id || ''} />;
      case 'automation-reports':
        return (
          <AutomationReportsWidget 
            key={widgetId} 
            category="general" 
            categoryColor="var(--primary)"
            maxResults={5}
          />
        );
      default:
        return null;
    }
  };

  // Sidebar content component for reuse
  const SidebarContent = ({ onNavigate }: { onNavigate?: (path: string) => void }) => (
    <>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center inspire-glow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent inspire-glow">
              Cofounder
            </span>
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 h-8 w-8"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* User Info - Always show on mobile drawer */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-200/50 dark:border-blue-700/50 inspire-glow">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-blue-500 text-white">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
              {getUserDisplayName(user)}
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {userStats.businessCount} {userStats.businessCount === 1 ? 'Business' : 'Businesses'}
          </div>
          
          {/* Enhanced Server Status Indicator */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {customServerAvailable && isServerAvailable ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                </>
              ) : customServerAvailable && !isServerAvailable ? (
                <>
                  <WifiOff className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-orange-600 dark:text-orange-400">Partial</span>
                </>
              ) : (
                <>
                  <Server className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600 dark:text-red-400">Offline</span>
                </>
              )}
            </div>
            
            {(!customServerAvailable || !isServerAvailable) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate ? onNavigate('/database-diagnostic') : handleDiagnosticNavigation()}
                className="p-1 h-6 text-xs"
                title="Run Diagnostics"
              >
                <Database className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <div key={item.id}>
            <Button
              variant={item.active ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 px-3 ${
                item.active ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : ''
              }`}
              onClick={() => onNavigate ? onNavigate(item.path) : handleNavigate(item.path)}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.submenu && <ChevronRight className="w-4 h-4" />}
            </Button>
            
            {/* Submenu - Always show when active */}
            {item.submenu && item.active && (
              <div className="ml-6 mt-2 space-y-1">
                {item.submenu.map((subItem) => (
                  <Button
                    key={subItem.path}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => onNavigate ? onNavigate(subItem.path) : handleSubmenuNavigate(subItem.path)}
                  >
                    <subItem.icon className="w-3 h-3" />
                    {subItem.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Separator */}
        <Separator className="my-4" />

        {/* Profile & Security / Diagnostics Section */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3"
            onClick={() => onNavigate ? onNavigate('/profile') : handleProfileNavigate()}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Profile & Security</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3"
            onClick={() => onNavigate ? onNavigate('/settings') : handleSettingsNavigate()}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Settings</span>
          </Button>
        </div>
      </nav>

      {/* Business Count */}
      {userBusinesses.length > 0 && (
        <div className="p-4 border-t border-white/20 dark:border-gray-700/20">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Your Businesses
          </h4>
          <div className="space-y-2">
            {userBusinesses.slice(0, 3).map((business) => (
              <div
                key={business.id}
                className={`p-2 rounded-lg text-sm ${
                  selectedBusiness?.id === business.id 
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="font-medium truncate">{business.name}</div>
                <div className="text-xs opacity-70">
                  {business.industry === 'Industry to be determined' || business.industry === 'to-be-determined' 
                    ? 'Industry pending' 
                    : business.industry || 'General'
                  }
                </div>
              </div>
            ))}
            {userBusinesses.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{userBusinesses.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div 
      className="min-h-full w-full bg-transparent relative"
      style={{
        paddingBottom: isMobile && isIOS() ? 'max(env(safe-area-inset-bottom, 0px) + 200px, 200px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)'
      }}
    >
      {/* Floating Toy Box Pop Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -40, 0],
            x: [0, 30, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-40 h-40 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#00E0FF' }}
        />
        <motion.div
          animate={{
            y: [0, 50, 0],
            x: [0, -35, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-40 left-20 w-36 h-36 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#FFCF00' }}
        />
        <motion.div
          animate={{
            y: [0, -45, 0],
            x: [0, 20, 0],
            rotate: [0, -360],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 left-32 w-28 h-28 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#6CFF6C' }}
        />
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -25, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 right-32 w-32 h-32 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: '#4B00FF' }}
        />
      </div>
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Premium Liquid Glass Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="liquid-glass-card border-b-0 px-3 sm:px-6 py-4 sm:py-5 mb-4"
          style={{
            borderRadius: '0 0 24px 24px',
            boxShadow: '0 8px 32px rgba(0, 224, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <motion.h1 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-xl sm:text-3xl font-semibold truncate"
                  style={{
                    color: 'var(--primary)',
                    textShadow: '0 2px 10px rgba(0, 224, 255, 0.15)',
                  }}
                >
                  Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate"
                >
                  Welcome back, {getUserFirstName(user)}!{isMobile ? '' : ` ${selectedBusiness ? `Currently managing ${selectedBusiness.name}.` : ''}`}
                </motion.p>
              </div>
            </div>
            
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center gap-2 sm:gap-4 flex-shrink-0"
            >
              <div className="hidden sm:block">
                <BusinessSwitcher />
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleTheme} 
                    title="Toggle Dark Mode"
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0 liquid-glass-nav hover:liquid-glass-warning rounded-xl"
                  >
                    {theme === 'light' ? <Moon className="w-3 h-3 sm:w-4 sm:h-4" /> : <Sun className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowWidgetCustomizer(true)}
                    title="Customize Dashboard"
                    className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 p-0 liquid-glass-nav hover:liquid-glass-info rounded-xl"
                  >
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.header>
        
        {/* Main Dashboard Content */}
        <main className="px-3 sm:px-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
          {/* Server Status Alert with Premium Glass */}
          {(!customServerAvailable || !isServerAvailable) && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Alert 
                className="liquid-glass-warning rounded-2xl border-2"
                style={{
                  boxShadow: '0 4px 16px rgba(255, 207, 0, 0.15)',
                }}
              >
                <Server className="h-4 w-4 text-energy" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div>
                    <span className="font-medium">
                      {!customServerAvailable ? 'Database offline:' : 'Limited connectivity:'}
                    </span>{' '}
                    {!customServerAvailable
                      ? 'Business features unavailable until server connection is restored.'
                      : serverErrorMessage || 'Some features may be unavailable.'
                    }
                  </div>
                  <div className="flex gap-2">
                    {customServerAvailable && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRetryConnection}
                          className="flex items-center gap-2 liquid-glass-btn-primary text-white border-0"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Customize Dashboard Button - Mobile Only */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-end"
            >
              <Button
                onClick={() => setShowWidgetCustomizer(true)}
                size="sm"
                className="gap-2"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderRadius: 'var(--radius)',
                  padding: 'var(--spacing-2) var(--spacing-3)'
                }}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-sm">Customize Dashboard</span>
              </Button>
            </motion.div>
          )}

          {/* CEO Overview Widgets - Business Metrics */}
          {selectedBusiness?.id && !selectedBusiness.id.startsWith('temp-') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <DashboardCEOWidgets 
                businessId={selectedBusiness.id} 
                userId={user.id}
              />
            </motion.div>
          )}

          {/* Dashboard Widgets Grid - 3 columns on desktop */}
          <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {/* Render active widgets dynamically */}
            {activeWidgets.map(widgetId => renderWidget(widgetId))}
          </div>

          {/* Business Status Alert */}
          {userBusinesses.length === 0 && !isLoading && (
            <Card className="glass-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">
                      {!customServerAvailable ? 'Working in offline mode' : 'Ready to Start Your Journey?'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {!customServerAvailable
                        ? 'Create your first business to get started. Limited features available offline.'
                        : 'Create your first business and start building your entrepreneurial journey.'
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={handleCreateBusiness} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create First Business
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Modals */}
      <BusinessCreationModal
        isOpen={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        onBusinessCreated={(business) => {
          console.log('Dashboard: New business created:', business);
          setShowBusinessModal(false);
        }}
      />

      {/* Support Modal */}
      <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get Help & Support</DialogTitle>
            <DialogDescription>
              Need assistance getting started? Here are some helpful resources.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setShowSupportModal(false);
                handleNavigate('/roadmap');
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View Business Roadmap
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setShowSupportModal(false);
                handleNavigate('/community');
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              Join Community
            </Button>
            <SupportButton />
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Customizer Modal */}
      <DashboardWidgetCustomizer
        isOpen={showWidgetCustomizer}
        onClose={() => setShowWidgetCustomizer(false)}
        activeWidgets={activeWidgets}
        onWidgetsChange={setActiveWidgets}
      />
    </div>
  );
};

export default Dashboard;