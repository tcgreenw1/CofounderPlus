import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator, 
  DropdownMenuLabel 
} from './ui/dropdown-menu';
import { useBusiness } from './BusinessContext';
import { useTheme } from './ThemeProvider';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { useLayoutState } from './LayoutStateManager';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useSupportNotifications } from '../hooks/useSupportNotifications';
import { Logo } from './Logo';
import { BusinessSwitcher } from './BusinessSwitcher';
import { AccountSwitcher } from './AccountSwitcher';
import { CreditDisplay } from './CreditDisplay';
import { NavLoadingOverlay } from './NavLoadingOverlay';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import {
  Home,
  Briefcase,
  Sparkles,
  StickyNote,
  CheckSquare,
  MessageCircle,
  Code,
  Package,
  Megaphone,
  TrendingUp,
  CreditCard,
  Users,
  GraduationCap,
  Target,
  Calendar,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
  Plug2,
  Bell,
  Settings,
  HelpCircle,
  Database,
  LogOut,
  Building2,
  AlertTriangle,
  DollarSign,
  UserCheck,
  Bot,
  LayoutGrid
} from 'lucide-react';

interface DesktopLayoutProps {
  user: any;
  customServerAvailable?: boolean;
  children?: React.ReactNode;
  isLandscapeMode?: boolean;
}

// Memoized to prevent navigation menu from unmounting during page transitions
export const DesktopLayout: React.FC<DesktopLayoutProps> = React.memo(({ 
  user, 
  customServerAvailable = true, 
  children,
  isLandscapeMode = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { 
    selectedBusiness, 
    userBusinesses, 
    isServerAvailable 
  } = useBusiness();
  const { subscriptionData } = useCloudSubscription();
  
  // Use global layout state to prevent flickering across route changes
  const { 
    desktopNavOptions, 
    desktopNavLoaded, 
    sidebarOpen: globalSidebarOpen,
    operationsExpanded,
    setDesktopNavOptions, 
    setDesktopNavLoaded,
    setSidebarOpen: setGlobalSidebarOpen,
    setOperationsExpanded
  } = useLayoutState();

  // Local sidebar state (landscape mode override)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // If in landscape mode, always start collapsed
    if (isLandscapeMode) {
      return false;
    }
    return globalSidebarOpen;
  });
  
  const [pendingNotificationCount, setPendingNotificationCount] = useState(0);
  
  // Support ticket notifications
  const { unreadCount: supportUnreadCount } = useSupportNotifications(user?.id);

  useEffect(() => {
    // Only load once per user session - using global state
    if (desktopNavLoaded && user?.id) return;

    const loadDesktopNav = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (!accessToken) {
          setDesktopNavLoaded(true);
          return;
        }

        // Fetch nav customization and show loading animation until complete
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/nav-customize/get-desktop`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.navOptions && Array.isArray(data.navOptions)) {
              console.log('✅ DesktopLayout: Loaded nav options:', data.navOptions);
              setDesktopNavOptions(data.navOptions);
            }
          } else {
            console.log('ℹ️ DesktopLayout: Using default nav (server returned non-OK)');
          }
        } catch (error) {
          // Silently use defaults
          console.log('ℹ️ DesktopLayout: Using default nav (server unavailable)');
        }
        
        // Mark as loaded after fetch completes (or fails)
        setDesktopNavLoaded(true);
      } catch (error) {
        // Silently use defaults
        console.log('ℹ️ DesktopLayout: Using default nav');
        setDesktopNavLoaded(true);
      }
    };

    loadDesktopNav();
  }, [user?.id, desktopNavLoaded, setDesktopNavOptions, setDesktopNavLoaded]);

  // Separate effect for listening to updates - this doesn't cause re-renders
  useEffect(() => {
    const handleNavUpdate = (event: any) => {
      if (event.detail && Array.isArray(event.detail)) {
        console.log('🔄 DesktopLayout: Nav updated via event:', event.detail);
        setDesktopNavOptions(event.detail);
      }
    };

    window.addEventListener('desktopNavUpdated', handleNavUpdate);
    
    return () => {
      window.removeEventListener('desktopNavUpdated', handleNavUpdate);
    };
  }, []);

  // Poll for notifications
  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          // User not logged in - this is expected, don't log errors
          setPendingNotificationCount(0);
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/notifications/list`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Count both 'pending' (team invitations) and 'unread' (cofounder notifications)
          const unread = (data.notifications || []).filter((n: any) => n.status === 'pending' || n.status === 'unread');
          setPendingNotificationCount(unread.length);
        } else if (response.status === 401) {
          // Session expired - expected, don't log error
          setPendingNotificationCount(0);
        } else {
          // Only log unexpected errors (not 401/403/503 which are expected)
          // 503 = Service Unavailable (server temporarily down or overloaded)
          if (response.status !== 403 && response.status !== 503) {
            console.error('Unexpected notification response:', response.status, response.statusText);
          }
          // Gracefully set count to 0 for any non-OK response
          setPendingNotificationCount(0);
        }
      } catch (error: any) {
        // Network errors are common when offline or during development
        // Only log if it's not a basic network failure
        if (error?.message && !error.message.includes('Failed to fetch') && !error.message.includes('NetworkError')) {
          console.error('Failed to load notification count:', error);
          console.error('Notification error details:', {
            message: error?.message,
            name: error?.name,
            stack: error?.stack
          });
        }
        // Gracefully set count to 0 on any error
        setPendingNotificationCount(0);
      }
    };

    if (user) {
      loadNotificationCount();
      const interval = setInterval(loadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sync local sidebar state with global state (but not in landscape mode)
  React.useEffect(() => {
    if (!isLandscapeMode) {
      setGlobalSidebarOpen(sidebarOpen);
    }
  }, [sidebarOpen, isLandscapeMode, setGlobalSidebarOpen]);

  // Keep sidebar collapsed in landscape mode
  React.useEffect(() => {
    if (isLandscapeMode && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isLandscapeMode]);

  // Check if user is on Free, Launch, or Creator plan (only show upgrade button for these plans)
  const shouldShowUpgrade = ['free', 'launch', 'creator'].includes(subscriptionData?.plan?.toLowerCase() || '');

  // Determine current page
  const currentPath = location.pathname;
  const isDashboard = currentPath === '/dashboard' || currentPath === '/';
  const isOperations = currentPath.startsWith('/operations');
  const isRoadmap = currentPath === '/roadmap';
  const isCommunity = currentPath === '/community';
  const isNotes = currentPath === '/notes';
  const isDreams = currentPath === '/dream-board';
  const isCalendar = currentPath === '/calendar';
  const isUniversity = currentPath === '/university' || currentPath === '/temp-university';
  const isCofounder = currentPath === '/cofounder';
  const isIntegrations = currentPath === '/integrations';
  const isNotifications = currentPath === '/notifications';
  const isSettings = currentPath === '/settings' || currentPath.startsWith('/settings');
  const isSupport = currentPath === '/support' || currentPath.startsWith('/support');

  // Auto-expand operations if we're on an operations page
  React.useEffect(() => {
    if (isOperations && !operationsExpanded) {
      setOperationsExpanded(true);
    }
  }, [isOperations, operationsExpanded, setOperationsExpanded]);

  // Helper function to check if user is admin
  const isAdminUser = (user: any): boolean => {
    const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
    const userEmail = user?.email;
    const isAdmin = adminEmails.includes(userEmail);
    
    // Debug logging for admin detection in Desktop Layout
    console.log('Desktop Layout Admin Check:', {
      userEmail,
      adminEmails,
      isAdmin,
      userObject: user
    });
    
    return isAdmin;
  };

  // Desktop navigation items - memoized to prevent unnecessary re-renders
  const navigationItems = useMemo(() => {
    const allNavOptions: Record<string, any> = {
      'dashboard': { 
        id: 'dashboard', 
        label: 'Dashboard', 
        icon: Home, 
        path: '/dashboard',
        active: isDashboard
      },
      'operations-hub': { 
        id: 'operations', 
        label: 'Business OS', 
        icon: LayoutGrid,
        path: '/operations',
        active: isOperations,
        submenu: [
          { label: 'Operations', path: '/operations/department', icon: Briefcase, color: '#EA580C' },
          { label: 'Product', path: '/operations/product', icon: Package, color: '#9333EA' },
          { label: 'Marketing', path: '/operations/marketing', icon: Megaphone, color: '#6CFF6C' },
          { label: 'Sales', path: '/operations/sales', icon: DollarSign, color: '#FFCF00' },
          { label: 'Finance', path: '/operations/finance', icon: CreditCard, color: '#00E0FF' },
          { label: 'HR', path: '/operations/hr', icon: UserCheck, color: '#FF4F4F' }
        ]
      },
      'cofounder-agi': { 
        id: 'roadmap', 
        label: 'Roadmap', 
        icon: Sparkles, 
        path: '/roadmap',
        active: isRoadmap
      },
      'notes': { 
        id: 'notes', 
        label: 'Notes', 
        icon: StickyNote, 
        path: '/notes',
        active: isNotes
      },
      'todos': { 
        id: 'todos', 
        label: 'Tasks', 
        icon: CheckSquare, 
        path: '/todos',
        active: currentPath === '/todos'
      },
      'cofounder-chat': { 
        id: 'cofounder-chat', 
        label: 'Chat', 
        icon: MessageCircle, 
        path: '/cofounder-ai',
        active: currentPath === '/cofounder-ai'
      },
      'cofounder-make': { 
        id: 'cofounder-make', 
        label: 'Develop', 
        icon: Code, 
        path: '/cofounder-make',
        active: currentPath === '/cofounder-make'
      },
      'task-automations': { 
        id: 'task-automations', 
        label: 'Task Automations', 
        icon: Bot, 
        path: '/task-automations',
        active: currentPath === '/task-automations'
      },
      'product': { 
        id: 'product', 
        label: 'Product', 
        icon: Package, 
        path: '/operations/product',
        active: currentPath === '/operations/product'
      },
      'marketing': { 
        id: 'marketing', 
        label: 'Marketing', 
        icon: Megaphone, 
        path: '/operations/marketing',
        active: currentPath === '/operations/marketing'
      },
      'sales': { 
        id: 'sales', 
        label: 'Sales', 
        icon: TrendingUp, 
        path: '/operations/sales',
        active: currentPath === '/operations/sales'
      },
      'finance': { 
        id: 'finance', 
        label: 'Finance', 
        icon: CreditCard, 
        path: '/operations/finance',
        active: currentPath === '/operations/finance'
      },
      'hr': { 
        id: 'hr', 
        label: 'HR', 
        icon: Users, 
        path: '/operations/hr',
        active: currentPath === '/operations/hr'
      },
      'team': { 
        id: 'team', 
        label: 'Team', 
        icon: Users, 
        path: '/settings?tab=team',
        active: currentPath === '/settings' && location.search.includes('tab=team')
      },
      'university': { 
        id: 'university', 
        label: 'University', 
        icon: GraduationCap, 
        path: '/university',
        active: isUniversity
      },
      'dream-board': { 
        id: 'dream-board', 
        label: 'Dream Board', 
        icon: Target, 
        path: '/dream-board',
        active: isDreams
      },
      'calendar': { 
        id: 'calendar', 
        label: 'Calendar', 
        icon: Calendar, 
        path: '/calendar',
        active: isCalendar
      },
      'hubspot': { 
        id: 'hubspot', 
        label: 'Hubspot', 
        icon: Briefcase, 
        path: '/hubspot',
        active: currentPath === '/hubspot'
      },
      'salesforce': { 
        id: 'salesforce', 
        label: 'Salesforce', 
        icon: Briefcase, 
        path: '/salesforce',
        active: currentPath === '/salesforce'
      },
      'cofounder-settings': { 
        id: 'cofounder-settings', 
        label: 'Cofounder Settings', 
        icon: Settings, 
        path: '/cofounder-settings',
        active: currentPath === '/cofounder-settings'
      }
    };

    // Build navigation from desktopNavOptions
    return desktopNavOptions
      .map(optionId => allNavOptions[optionId])
      .filter(Boolean);
  }, [desktopNavOptions, currentPath, isDashboard, isOperations, isRoadmap, isNotes, isUniversity, isDreams, isCalendar, location.search]);

  // Calculate user stats - memoized to prevent recalculation on every render
  const userStats = useMemo(() => {
    const businessCount = userBusinesses.length;
    const totalRevenue = userBusinesses.reduce((sum, business) => sum + (business.revenue || 0), 0);
    const totalEmployees = userBusinesses.reduce((sum, business) => sum + (business.employees || 0), 0);
    return { businessCount, totalRevenue, totalEmployees };
  }, [userBusinesses]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleSubmenuNavigate = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    console.log('🔧 DesktopLayout: Sign out initiated');
    
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
      console.error('🔧 DesktopLayout: Supabase sign out error (non-blocking):', error);
    }
    
    // Step 6: Reload to home with hash router
    console.log('🔧 DesktopLayout: Reloading to complete sign out');
    window.location.href = '/#/';
  };

  const handleProfileNavigate = () => {
    navigate('/profile');
  };

  const handleSettingsNavigate = () => {
    navigate('/settings');
  };

  const handleDiagnosticNavigation = () => {
    navigate('/database-diagnostic');
  };

  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get user initials for dropdown
  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const name = user?.user_metadata?.name || user?.email || 'User';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get user display name for dropdown
  const getUserDisplayName = (user: any) => {
    if (!user) return 'User';
    return user?.user_metadata?.name || user?.email || 'User';
  };

  // Desktop Sidebar Content
  const DesktopSidebarContent = () => (
    <div className="flex flex-col h-full" style={{ position: 'relative' }}>
      {/* Show loading overlay if desktop nav hasn't loaded yet */}
      {!desktopNavLoaded && <NavLoadingOverlay isMobile={false} />}
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Logo size="sm" showText={false} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 h-8 w-8 bouncy-button liquid-glass-nav"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* User Info & Account/Business Switcher */}
        <div className="space-y-3">
          {/* Account Switcher */}
          <AccountSwitcher 
            user={user} 
            onOrganizationChanged={() => window.location.reload()} 
          />

          {/* User Info - Display only (not clickable) */}
          <div
            className="w-full p-3 rounded-xl transition-all duration-200 liquid-glass-card"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold">
                  {getInitials(user?.user_metadata?.name || user?.email || 'User')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                  {user?.user_metadata?.name || user?.email || 'User'}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {userBusinesses.length} {userBusinesses.length === 1 ? 'Business' : 'Businesses'}
                </div>
              </div>
            </div>
          </div>

          {/* Business Switcher */}
          {selectedBusiness && (
            <div className="p-3 rounded-xl liquid-glass-card">
              <BusinessSwitcher />
            </div>
          )}

          {/* Beta Testing Warning - Compact with Hover */}
          <div 
            className="relative group"
            style={{
              padding: 'var(--spacing-2)',
              margin: 'var(--spacing-2) 0',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <AlertTriangle 
                className="w-4 h-4 flex-shrink-0" 
                style={{ color: '#FFCF00' }} 
              />
              <div style={{ 
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                fontSize: '0.875rem'
              }}>
                Beta Testing
              </div>
            </div>

            {/* Hover Tooltip */}
            <div 
              className="absolute left-0 right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              style={{
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ 
                fontSize: '0.75rem',
                lineHeight: '1.4',
                color: 'var(--muted-foreground)',
                marginBottom: 'var(--spacing-2)'
              }}>
                This app is in beta. If you experience issues, please report them—we'll fix them ASAP!
              </div>
              <div style={{ 
                fontSize: '0.7rem',
                lineHeight: '1.3',
                color: 'var(--muted-foreground)',
                fontStyle: 'italic'
              }}>
                Too many issues but love the app? Contact support to join our contact list for when beta has fewer issues.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Area (Nav + Bottom Menu) */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden nav-scroll">
        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
          <div key={item.id}>
            <Button
              variant={item.active ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 px-3 bouncy-button ${
                item.active ? 'liquid-glass-nav' : ''
              }`}
              style={item.active ? { 
                backgroundColor: item.id === 'operations' ? 'rgba(234, 88, 12, 0.1)' : 'var(--sidebar-accent)',
                color: item.id === 'operations' ? '#EA580C' : 'var(--primary)',
                borderColor: item.id === 'operations' ? 'rgba(234, 88, 12, 0.2)' : 'var(--sidebar-border)'
              } : undefined}
              onClick={() => {
                if (item.id === 'operations') {
                  // Toggle operations submenu instead of navigating
                  setOperationsExpanded(!operationsExpanded);
                } else {
                  handleNavigate(item.path);
                }
              }}
            >
              {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1 text-left">{item.label}</span>
              {item.comingSoon && (
                <Badge style={{ backgroundColor: '#FFCF00', color: '#000' }} className="border-0 text-[10px] px-1.5 py-0.5">
                  Beta
                </Badge>
              )}
              {item.submenu && (
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                  (item.id === 'operations' && operationsExpanded) || (item.id !== 'operations' && item.active) ? 'rotate-90' : ''
                }`} />
              )}
            </Button>
            
            {/* Submenu - Show when expanded (operations) or active (others) */}
            {item.submenu && ((item.id === 'operations' && operationsExpanded) || (item.id !== 'operations' && item.active)) && (
              <div className="ml-6 mt-2 space-y-1">
                {item.submenu.map((subItem) => {
                  const isActive = currentPath === subItem.path;
                  const hexToRgb = (hex: string) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16)
                    } : { r: 0, g: 224, b: 255 };
                  };
                  const rgb = hexToRgb(subItem.color);
                  
                  return (
                    <motion.div
                      key={subItem.path}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className={`w-full justify-start gap-2 text-sm whitespace-nowrap overflow-hidden bouncy-button ${
                          isActive ? 'liquid-glass-nav shadow-lg' : ''
                        }`}
                        style={isActive ? { 
                          backgroundColor: `${subItem.color}20`,
                          color: theme === 'dark' ? subItem.color : subItem.color,
                          borderColor: `${subItem.color}40`,
                          boxShadow: `0 4px 12px ${subItem.color}30`
                        } : undefined}
                        onClick={() => handleSubmenuNavigate(subItem.path)}
                      >
                        <subItem.icon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{subItem.label}</span>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        </nav>

        {/* Spacer pushes bottom section down if there's space */}
        <div className="flex-1" />

        {/* Bottom section with Profile, Admin tools, and Sign Out */}
        <div className="p-4 border-t border-white/20 dark:border-gray-700/20 space-y-2">
        {/* Upgrade Button - Hidden for Builder and Studio plans */}
        {shouldShowUpgrade && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="default"
              className="w-full justify-start gap-3 px-3 bouncy-button text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ backgroundColor: '#FFCF00', color: '#000' }}
              onClick={() => navigate('/pricing')}
            >
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Crown className="w-4 h-4 flex-shrink-0" />
              </motion.div>
              <span className="flex-1 text-left">Upgrade Plan</span>
            </Button>
          </motion.div>
        )}
        
        {/* Credits Display */}
        <div style={{ padding: '0 var(--spacing-3) var(--spacing-3)' }}>
          <CreditDisplay variant="compact" showUpgrade={false} />
        </div>

        {/* Integrations */}
        <Button
          variant={isIntegrations ? "secondary" : "ghost"}
          className={`w-full justify-start gap-3 px-3 bouncy-button ${isIntegrations ? 'liquid-glass-nav' : ''}`}
          style={isIntegrations ? { 
            backgroundColor: 'var(--sidebar-accent)',
            color: 'var(--primary)',
            borderColor: 'var(--sidebar-border)'
          } : undefined}
          onClick={() => navigate('/integrations')}
        >
          <Plug2 className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Integrations</span>
        </Button>
        
        {/* Notifications */}
        <Button
          variant={isNotifications ? "secondary" : "ghost"}
          className={`w-full justify-start gap-3 px-3 bouncy-button relative ${isNotifications ? 'liquid-glass-nav' : ''}`}
          style={isNotifications ? { 
            backgroundColor: 'var(--sidebar-accent)',
            color: 'var(--primary)',
            borderColor: 'var(--sidebar-border)'
          } : undefined}
          onClick={() => navigate('/notifications')}
        >
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Notifications</span>
          {pendingNotificationCount > 0 && (
            <Badge 
              className="h-5 min-w-[20px] px-1 flex items-center justify-center" 
              style={{ backgroundColor: '#FF4F4F', color: '#fff' }}
            >
              {pendingNotificationCount}
            </Badge>
          )}
        </Button>
        
        {/* Settings */}
        <Button
          variant={isSettings ? "secondary" : "ghost"}
          className={`w-full justify-start gap-3 px-3 bouncy-button ${isSettings ? 'liquid-glass-nav' : ''}`}
          style={isSettings ? { 
            backgroundColor: 'var(--sidebar-accent)',
            color: 'var(--primary)',
            borderColor: 'var(--sidebar-border)'
          } : undefined}
          onClick={handleSettingsNavigate}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </Button>
        
        {/* Support */}
        <Button
          variant={isSupport ? "secondary" : "ghost"}
          className={`w-full justify-start gap-3 px-3 bouncy-button ${isSupport ? 'liquid-glass-nav' : ''}`}
          style={isSupport ? { 
            backgroundColor: 'var(--sidebar-accent)',
            color: 'var(--primary)',
            borderColor: 'var(--sidebar-border)'
          } : undefined}
          onClick={() => navigate('/support')}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Support</span>
          {supportUnreadCount > 0 && (
            <Badge 
              className="h-5 min-w-[20px] px-1 flex items-center justify-center" 
              style={{ backgroundColor: '#6CFF6C', color: '#000' }}
            >
              {supportUnreadCount}
            </Badge>
          )}
        </Button>
        
        {/* System Status - only show for admin users */}
        {isAdminUser(user) && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 bouncy-button"
            onClick={handleDiagnosticNavigation}
          >
            <Database className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">System Status</span>
            {(!customServerAvailable || !isServerAvailable) && (
              <AlertTriangle className="w-3 h-3" style={{ color: '#FFCF00' }} />
            )}
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 bouncy-button hover:bg-red-50 dark:hover:bg-red-900/20"
          style={{ color: '#FF4F4F' }}
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Sign Out</span>
        </Button>
      </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-r border-white/30 dark:border-gray-700/30 transition-all duration-300 z-30 ${
        sidebarOpen ? 'w-52' : 'w-16'
      }`}>
        {sidebarOpen ? (
          <DesktopSidebarContent />
        ) : (
          /* Collapsed sidebar */
          <div className="flex flex-col h-full p-2">
            <div className={isLandscapeMode ? "space-y-1" : "space-y-4 p-2"}>
              {/* Hamburger expand button - hide in landscape mode */}
              {!isLandscapeMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 h-10 w-10"
                  title="Expand Menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}

              {/* Business Management button - below hamburger */}
              {!isLandscapeMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/business-management')}
                  className="p-2 h-10 w-10"
                  title="Business Management"
                >
                  <Building2 className="w-5 h-5" />
                </Button>
              )}
              
              {/* Profile button for landscape mode - opens dropdown like mobile */}
              {isLandscapeMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 h-8 w-8 shadow-none"
                      title="Profile Menu"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-64 p-2 bg-white dark:bg-gray-900 border-2 border-[#4B00FF]"
                  >
                    <DropdownMenuLabel className="p-3 border-b-2 border-[#FFCF00]" style={{ backgroundColor: '#4B00FF' }}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-white">
                          <AvatarFallback className="text-sm text-white font-bold">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate">
                            {getUserDisplayName(user)}
                          </p>
                          <p className="text-xs text-white/90 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <div className="py-2">
                      <div className="px-3 pb-2">
                        <BusinessSwitcher />
                      </div>

                      <DropdownMenuSeparator style={{ backgroundColor: '#FFCF00', height: '2px' }} />

                      <DropdownMenuItem 
                        className="cursor-pointer p-3 rounded-lg"
                        onClick={() => navigate('/settings')}
                      >
                        <Settings className="w-4 h-4 mr-3" style={{ color: '#4B00FF' }} />
                        <span className="font-semibold">Settings</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        className="cursor-pointer p-3 rounded-lg"
                        onClick={() => navigate('/support')}
                      >
                        <HelpCircle className="w-4 h-4 mr-3" style={{ color: '#6CFF6C' }} />
                        <span className="font-semibold">Support</span>
                      </DropdownMenuItem>

                      {shouldShowUpgrade && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-2">
                          <DropdownMenuItem 
                            className="cursor-pointer p-4 rounded-xl font-bold focus:bg-transparent"
                            onClick={() => navigate('/pricing')}
                            style={{ 
                              background: 'linear-gradient(135deg, #FFCF00 0%, #FF4F4F 50%, #4B00FF 100%)',
                              boxShadow: '0 4px 15px rgba(255, 207, 0, 0.4)'
                            }}
                          >
                            <Crown className="w-5 h-5 mr-3 text-white" />
                            <span className="font-bold text-gray-900">Upgrade Plan</span>
                          </DropdownMenuItem>
                        </motion.div>
                      )}
                    </div>

                    <DropdownMenuSeparator style={{ backgroundColor: '#FF4F4F', height: '2px' }} />
                    <DropdownMenuItem 
                      className="cursor-pointer p-3 rounded-lg text-white mt-2 font-bold"
                      onClick={handleSignOut}
                      style={{ backgroundColor: '#FF4F4F' }}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="font-bold">Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Collapsed nav icons - remove shadows and tighten spacing in landscape */}
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={item.active ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    if (item.id === 'operations') {
                      // When collapsed, navigate to operations hub instead of expanding
                      handleNavigate(item.path);
                    } else {
                      handleNavigate(item.path);
                    }
                  }}
                  className={`p-1.5 ${isLandscapeMode ? 'h-7 w-7' : 'h-10 w-10'} ${isLandscapeMode ? 'shadow-none' : ''} bouncy-button`}
                  style={item.active ? { 
                    backgroundColor: 'var(--sidebar-accent)',
                    color: 'var(--primary)',
                    borderColor: 'var(--sidebar-border)'
                  } : undefined}
                  title={item.label}
                >
                  {item.icon && <item.icon className={isLandscapeMode ? 'w-4 h-4' : 'w-5 h-5'} />}
                </Button>
              ))}
            </div>

            {/* Spacer and bottom buttons - hide in landscape mode */}
            {!isLandscapeMode && (
              <>
                <div className="flex-1" />
                <div className="space-y-2 border-t border-white/20 dark:border-gray-700/20 pt-2 px-2">
                  {/* Upgrade Plan - Hidden for Builder and Studio plans */}
                  {shouldShowUpgrade && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/pricing')}
                      className="p-2 h-10 w-10"
                      style={{ color: '#FFCF00' }}
                      title="Upgrade Plan"
                    >
                      <Crown className="w-5 h-5" />
                    </Button>
                  )}
                  
                  {/* Credits Display */}
                  <div style={{ padding: 'var(--spacing-2)' }}>
                    <CreditDisplay variant="inline" showUpgrade={false} />
                  </div>

                  {/* Integrations */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/integrations')}
                    className="p-2 h-10 w-10"
                    title="Integrations"
                  >
                    <Plug2 className="w-5 h-5" />
                  </Button>
                  
                  {/* Notifications */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/notifications')}
                    className="p-2 h-10 w-10 relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {pendingNotificationCount > 0 && (
                      <div 
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: '#FF4F4F' }}
                      >
                        {pendingNotificationCount}
                      </div>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSettingsNavigate}
                    className="p-2 h-10 w-10"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/support')}
                    className="p-2 h-10 w-10 relative"
                    title="Support"
                  >
                    <HelpCircle className="w-5 h-5" />
                    {supportUnreadCount > 0 && (
                      <div 
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                        style={{ backgroundColor: '#6CFF6C' }}
                      >
                        {supportUnreadCount}
                      </div>
                    )}
                  </Button>
                  
                  {isAdminUser(user) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDiagnosticNavigation}
                      className="p-2 h-10 w-10 relative"
                      title="System Status"
                    >
                      <Database className="w-5 h-5" />
                      {(!customServerAvailable || !isServerAvailable) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="p-2 h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area - extends behind sidebar for glass effect */}
      <div className={`transition-all duration-300 min-h-screen`} style={{
        paddingLeft: sidebarOpen ? 'var(--spacing-sidebar-open, 13rem)' : 'var(--spacing-sidebar-closed, 4rem)',
        paddingBottom: 'var(--spacing-8)' // Healthy margin at bottom for scrolling
      }}>
        {children}
      </div>
    </>
  );
});

export default DesktopLayout;