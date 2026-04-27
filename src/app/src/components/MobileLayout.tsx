import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from './ThemeProvider';
import { useBusiness } from './BusinessContext';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { useNotifications } from '../contexts/NotificationContext';
import { MotivationButton } from './MotivationButton';
import { Logo } from './Logo';
import { BusinessSwitcher } from './BusinessSwitcher';
import { MobileUpgradeModal } from './MobileUpgradeModal';
import { CreditsDisplay } from './CreditsDisplay';
import { useSupportNotifications } from '../hooks/useSupportNotifications';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { isWeb } from '../utils/platformDetection';

import { 
  Home, ChevronDown, Menu, Settings, Bell, HelpCircle, LogOut, Crown,
  User, Sun, Moon, AlertTriangle, Building2, Sparkles, Briefcase, Package,
  Megaphone, DollarSign, CreditCard, UserCheck, GraduationCap, MapPin,
  StickyNote, CheckSquare, Users, TrendingUp, MessageCircle, Code, RefreshCw, Calendar, LayoutGrid
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { VisuallyHidden } from './ui/visually-hidden';
import { NavLoadingOverlay } from './NavLoadingOverlay';

interface MobileLayoutProps {
  user: any;
  customServerAvailable?: boolean;
  children?: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  isMoreButton?: boolean;
}

// Beta Testing Card Component - Expandable on Click
const BetaTestingCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        padding: 'var(--spacing-2)',
        margin: 'var(--spacing-2) 0',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--primary-soft)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <AlertTriangle 
          className="w-4 h-4 flex-shrink-0" 
          style={{ color: '#FFCF00' }} 
        />
        <div style={{ 
          flex: 1,
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          fontSize: '0.875rem'
        }}>
          Beta Testing
        </div>
        <ChevronDown 
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200" 
          style={{ 
            color: 'var(--muted-foreground)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </div>

      {isExpanded && (
        <div style={{ 
          marginTop: 'var(--spacing-2)',
          paddingTop: 'var(--spacing-2)',
          borderTop: '1px solid var(--border)',
        }}>
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
      )}
    </div>
  );
};

// Memoized to prevent navigation menu from unmounting during page transitions
export const MobileLayout: React.FC<MobileLayoutProps> = React.memo(({ 
  user, 
  customServerAvailable = true, 
  children 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { 
    selectedBusiness, 
    userBusinesses, 
    isServerAvailable,
    switchBusiness,
    refreshBusinesses
  } = useBusiness();
  const { subscriptionData, planDisplayName } = useCloudSubscription();
  const { unreadCount } = useNotifications();
  
  // Support ticket notifications
  const { unreadCount: supportUnreadCount } = useSupportNotifications(user?.id);
  
  const [businessSwitcherOpen, setBusinessSwitcherOpen] = useState(false);
  const [operationsMenuOpen, setOperationsMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customNavItems, setCustomNavItems] = useState<NavItem[]>([]);
  const [navItemsLoaded, setNavItemsLoaded] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  // Ref for main content area to control scroll position
  const mainContentRef = useRef<HTMLElement>(null);

  // Scroll to top when route changes (iOS mobile fix)
  useEffect(() => {
    // Scroll the main content area to top whenever the route changes
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
      console.log('📱 MobileLayout: Scrolled to top after route change to', location.pathname);
    }
  }, [location.pathname]);

  // Check if user is on Builder or Studio plan (hide upgrade button for these plans)
  const shouldShowUpgrade = !['builder', 'studio'].includes(subscriptionData?.plan?.toLowerCase() || '');
  
  // Check if user should see upgrade in profile menu (show for everyone except Scale/studio plan)
  const shouldShowProfileUpgrade = !['studio', 'scale', 'studio_monthly', 'studio_annual'].includes(subscriptionData?.plan?.toLowerCase() || '');
  
  // Determine current page
  const currentPath = location.pathname;
  const isDashboard = currentPath === '/dashboard' || currentPath === '/';
  const isOperations = currentPath.startsWith('/operations');
  const isFinance = currentPath === '/operations/finance';
  const isRoadmap = currentPath === '/roadmap';
  const isMastery = currentPath === '/mastery-agi' || currentPath === '/mastery';
  const isCommunity = currentPath === '/community';
  const isNotes = currentPath === '/notes';
  const isCofounder = currentPath === '/cofounder';
  const isSettings = currentPath === '/settings' || currentPath.startsWith('/settings');
  const isCalendar = currentPath === '/calendar' || currentPath.startsWith('/calendar');
  
  // Check if on AI chat pages (these have their own custom headers)
  // Exclude /cofounder-settings from AI pages
  const isAIPage = !currentPath.startsWith('/cofounder-settings') && (currentPath === '/cofounder-ai' || currentPath === '/cofounder' || currentPath === '/ai' || currentPath.startsWith('/cofounder-ai') || currentPath.startsWith('/cofounder'));

  // Calculate dynamic padding based on page type
  // Standard header height: env(safe-area-inset-top) + 44px + var(--spacing-3) + var(--spacing-3) + var(--spacing-2)
  // Operations pages have submenu, so content starts lower - need MORE padding to account for submenu height
  // Settings page has no submenu - use standard padding
  const getContentPaddingTop = () => {
    if (isAIPage) return 0;
    
    // Operations pages now use standard padding (submenu removed)
    // Standard pages (Dashboard, Notes, Settings, Operations, etc.)
    return 'calc(env(safe-area-inset-top, 0px) + 44px + var(--spacing-3) + var(--spacing-3) + var(--spacing-2))';
  };

  // Add transparent header class for native iOS and testing
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const isTesting = window.location.hostname.includes('localhost') || 
                      window.location.hostname.includes('127.0.0.1') ||
                      process.env.NODE_ENV === 'development';
    
    if (isNative || isTesting) {
      document.body.classList.add('native-transparent-header');
      console.log('📱 Added transparent header class for', isNative ? 'native platform' : 'testing');
    }
    
    return () => {
      document.body.classList.remove('native-transparent-header');
    };
  }, []);

  // Load navigation customization - show loading animation until server confirms settings
  useEffect(() => {
    // Skip if already loaded to prevent re-running on every navigation
    if (navItemsLoaded) return;
    
    const loadCustomNavigation = async () => {
      try {
        // Load from localStorage FIRST to populate customNavItems
        // (but don't mark as loaded yet - we need server confirmation)
        try {
          const stored = localStorage.getItem('navCustomization');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('✅ MobileLayout: Loaded nav from localStorage (showing animation while fetching):', parsed);
              setCustomNavItems(parsed);
            }
          }
        } catch (storageErr) {
          console.error('⚠️ MobileLayout: Error reading localStorage:', storageErr);
        }

        // Fetch from API to get confirmed settings
        if (user?.id) {
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token || publicAnonKey;
          const url = `${serverUrl}/nav-customize/get`;
          
          try {
            const response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              
              if (data.success && data.navItems && Array.isArray(data.navItems)) {
                console.log('✅ MobileLayout: Confirmed nav from API:', data.navItems);
                setCustomNavItems(data.navItems);
                // Update localStorage for next time
                localStorage.setItem('navCustomization', JSON.stringify(data.navItems));
              }
            }
          } catch (err) {
            console.log('⚠️ MobileLayout: Nav fetch failed (using defaults):', err);
          }
        }
        
        // Mark as loaded after API call completes (or fails)
        setNavItemsLoaded(true);
        
      } catch (err: any) {
        console.error('📱 MobileLayout: Error loading nav preferences:', err);
        // Ensure nav is marked as loaded even on error
        setNavItemsLoaded(true);
      }
    };

    if (user?.id) {
      loadCustomNavigation();
    } else {
      // If no user yet, mark as loaded immediately to prevent glitch
      setNavItemsLoaded(true);
    }
  }, [user?.id]);

  // Listen for customization updates
  useEffect(() => {
    const handleNavUpdate = (event: CustomEvent) => {
      console.log('🎨 Nav customization updated:', event.detail);
      setCustomNavItems(event.detail);
    };

    const handleNavReset = () => {
      console.log('🎨 Nav customization reset');
      setCustomNavItems([]);
      // Also check localStorage
      try {
        const stored = localStorage.getItem('navCustomization');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomNavItems(parsed);
          }
        }
      } catch (err) {
        console.error('Error reading navCustomization from localStorage:', err);
      }
    };

    window.addEventListener('navCustomizationUpdated', handleNavUpdate as EventListener);
    window.addEventListener('navCustomizationReset', handleNavReset as EventListener);

    return () => {
      window.removeEventListener('navCustomizationUpdated', handleNavUpdate as EventListener);
      window.removeEventListener('navCustomizationReset', handleNavReset as EventListener);
    };
  }, []);

  // Helper function to check if user is admin
  const isAdminUser = (user: any): boolean => {
    const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
    const userEmail = user?.email;
    const isAdmin = adminEmails.includes(userEmail);
    
    // Debug logging for admin detection in Mobile Layout
    console.log('Mobile Layout Admin Check:', {
      userEmail,
      adminEmails,
      isAdmin,
      userObject: user
    });
    
    return isAdmin;
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const name = user?.user_metadata?.name || user?.email || 'User';
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Helper function to get user display name
  const getUserDisplayName = (user: any) => {
    if (!user) return 'User';
    return user?.user_metadata?.name || user?.email || 'User';
  };

  // Handle upgrade - different behavior for browser vs native app
  const handleUpgradeClick = () => {
    // If in browser (not native app), go to /pricing page
    // If in native app, go to /upgrade page
    if (isWeb()) {
      navigate('/pricing');
    } else {
      navigate('/upgrade');
    }
  };

  // Icon mapping
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'bot': Sparkles, // IMPORTANT: Cofounder AGI should ALWAYS be Sparkles, NEVER Brain
      'sparkles': Sparkles,
      'home': Home,
      'briefcase': Briefcase,
      'package': Package,
      'trending-up': TrendingUp,
      'megaphone': Megaphone,
      'users': Users,
      'map': MapPin,
      'sticky-note': StickyNote,
      'check-square': CheckSquare,
      'user': User,
      'users-2': Users,
      'credit-card': CreditCard,
      'graduation-cap': GraduationCap,
      'shield': AlertTriangle,
      'settings': Settings,
      'calendar': Calendar,
      'menu': Menu,
      'sun-moon': theme === 'dark' ? Sun : Moon,
      'life-buoy': HelpCircle,
      'message-circle': MessageCircle,
      'code': Code,
      'layout-grid': LayoutGrid,
    };
    return iconMap[iconName] || Menu;
  };

  // Default navigation items - New structure
  const defaultBottomNavItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'home', 
      path: '/dashboard'
    },
    { 
      id: 'sales', 
      label: 'Sales', 
      icon: 'trending-up', 
      path: '/operations/sales'
    },
    { 
      id: 'finance', 
      label: 'Finance', 
      icon: 'credit-card', 
      path: '/operations/finance'
    },
    { 
      id: 'marketing', 
      label: 'Marketing', 
      icon: 'megaphone', 
      path: '/operations/marketing'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: 'settings',
      path: '/settings'
    }
  ];

  // Use custom nav items if available, otherwise use defaults
  // Filter out the "More" button
  const navItemsToRender = navItemsLoaded && customNavItems.length > 0 
    ? customNavItems.filter(item => !item.isMoreButton)
    : defaultBottomNavItems.filter(item => !item.isMoreButton);

  // Convert nav items to bottom nav format with active state
  const bottomNavItems = navItemsToRender.map((item) => {
    const IconComponent = getIconComponent(item.icon);
    let isActive = false;
    
    // Determine if this item is active based on current path
    if (item.path) {
      if (item.path === '/cofounder-ai' || item.path === '/cofounder') {
        isActive = isCofounder || isAIPage;
      } else if (item.path === '/operations') {
        isActive = isOperations;
      } else if (item.path === '/roadmap') {
        isActive = isRoadmap;
      } else if (item.path === '/notes') {
        isActive = isNotes;
      } else if (item.path === '/settings') {
        isActive = isSettings;
      } else if (item.path === '/calendar') {
        isActive = isCalendar;
      } else if (item.path === '/profile' || item.path?.startsWith('/profile')) {
        isActive = currentPath.startsWith('/profile');
      } else if (item.path === '/dashboard') {
        isActive = isDashboard;
      } else {
        isActive = currentPath === item.path || currentPath.startsWith(item.path);
      }
    }

    return {
      id: item.id,
      label: item.label,
      icon: IconComponent,
      path: item.path || '#',
      active: isActive,
      isMoreButton: item.isMoreButton
    };
  });

  const handleNavigate = (path: string, isMoreButton?: boolean, itemId?: string) => {
    // PERFORMANCE FIX: Removed console.logs that run on every navigation
    
    // Special handling for theme toggle
    if (itemId === 'theme-toggle' || path === 'theme-toggle') {
      toggleTheme();
      return;
    }
    
    if (path === '#') {
      if (isMoreButton) {
        setMoreMenuOpen(true);
      }
      return;
    }
    
    try {
      navigate(path);
    } catch (error) {
      // Fallback to window.location for HashRouter
      window.location.hash = path;
    }
  };

  const handleSignOut = async () => {
    console.log('🔧 MobileLayout: Sign out initiated');
    
    // Step 1: Show loading overlay immediately
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
    
    // Step 2: Small delay to ensure overlay is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Sign out from Supabase first
    try {
      await supabase.auth.signOut();
      console.log('🔧 MobileLayout: Supabase sign out successful');
    } catch (error) {
      console.error('🔧 MobileLayout: Supabase sign out error:', error);
    }
    
    // Step 4: Clear storage after sign out
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🔧 MobileLayout: Storage cleared');
    } catch (e) {
      console.error('Storage clear error:', e);
    }
    
    // Step 5: Wait a moment for sign out to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 6: Detect if mobile and redirect appropriately
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isMobileApp = isMobileDevice || isStandalone;
    
    console.log('🔧 MobileLayout: Redirecting...', { isMobileApp });
    
    if (isMobileApp) {
      // Mobile app - go directly to mobile-welcome
      window.location.href = '/#/mobile-welcome';
    } else {
      // Browser - go to main landing page
      window.location.href = 'https://cofounderplus.com';
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 MobileLayout: Refresh button clicked');
    setIsRefreshing(true);
    
    try {
      // Refresh businesses from the server
      await refreshBusinesses();
      console.log('✅ MobileLayout: Businesses refreshed successfully');
    } catch (error) {
      console.error('❌ MobileLayout: Error refreshing businesses:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Mobile Top Header
  const MobileHeader = () => (
    <div 
      className="mobile-header bg-background border-b border-border shadow-sm"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top, 0px)', // Use iOS safe area for status bar
        paddingLeft: 'var(--spacing-4)',
        paddingRight: 'var(--spacing-4)',
        flexShrink: 0,
        backgroundColor: 'var(--background)', // FORCE SOLID WHITE BACKGROUND
        backdropFilter: 'none', // Remove any transparency effects
        WebkitBackdropFilter: 'none', // Remove any transparency effects for Safari
      }}
    >
      <div 
        style={{
          paddingTop: 'var(--spacing-3)',
          paddingBottom: 'var(--spacing-2)',
        }}
      >
        {/* Header row: Profile Avatar (left), Logo (center), Motivation Button (right) */}
        <div 
          className="flex items-center justify-between"
          style={{
            minHeight: '44px',
            gap: 'var(--spacing-3)',
          }}
        >
          {/* User Avatar - left side, larger with dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div style={{ position: 'relative' }}>
                <Avatar 
                  className="cursor-pointer border-2 border-blue-200 dark:border-blue-800"
                  style={{
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                  }}
                >
                  <AvatarFallback className="text-base bg-blue-500 text-white font-semibold">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                {/* iOS-style notification badge */}
                {unreadCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      backgroundColor: '#FF3B30',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                      border: '2px solid var(--background)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-64 p-3 border-0"
              style={{
                background: 'var(--background)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: 'none'
              }}
            >
              {/* Header - Toy Box Pop styling */}
              <DropdownMenuLabel 
                className="p-3 mb-2 border-b-2 border-[#FFCF00] rounded-lg" 
                style={{ 
                  backgroundColor: '#4B00FF',
                  boxShadow: '0 4px 12px rgba(75, 0, 255, 0.3)'
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-white" style={{ backgroundColor: '#4B00FF' }}>
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

              {/* Menu Items - Toy Box Pop styling with Apple Glass */}
              <div className="space-y-1">
                {/* Business Switcher Dropdown - at top */}
                <div className="mb-2">
                  <BusinessSwitcher />
                </div>

                {/* AI Credits Display - Toy Box Pop Styling */}
                <div 
                  className="p-3 mb-2 rounded-xl"
                  style={{
                    background: 'rgba(75, 0, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(75, 0, 255, 0.2)',
                  }}
                >
                  <CreditsDisplay variant="inline" showUpgrade={false} />
                </div>

                <DropdownMenuSeparator style={{ backgroundColor: '#FFCF00', height: '2px', margin: '8px 0' }} />

                {/* Upgrade Button - Only for free/creator tiers */}
                {shouldShowProfileUpgrade && (
                  <>
                    <DropdownMenuItem 
                      className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                      onClick={() => {
                        // Navigate to Settings Plan tab for IAP
                        navigate('/settings?tab=plan');
                      }}
                      style={{ 
                        backgroundColor: '#FFCF00',
                        color: '#000',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(255, 207, 0, 0.3)'
                      }}
                    >
                      <Crown className="w-4 h-4 mr-3" />
                      <span className="font-bold">Upgrade Plan</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ backgroundColor: '#FFCF00', height: '2px', margin: '8px 0' }} />
                  </>
                )}

                {/* Product */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/operations/product')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(155, 123, 255, 0.1)'
                  }}
                >
                  <Package className="w-4 h-4 mr-3" style={{ color: '#9b7bff' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Product</span>
                </DropdownMenuItem>

                {/* HR */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/operations/hr')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 79, 79, 0.1)'
                  }}
                >
                  <Users className="w-4 h-4 mr-3" style={{ color: '#FF4F4F' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>HR</span>
                </DropdownMenuItem>

                {/* Notes */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/notes')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(108, 255, 108, 0.1)'
                  }}
                >
                  <StickyNote className="w-4 h-4 mr-3" style={{ color: '#6CFF6C' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Notes</span>
                </DropdownMenuItem>

                {/* Calendar */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/calendar')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 224, 255, 0.1)'
                  }}
                >
                  <Calendar className="w-4 h-4 mr-3" style={{ color: '#00E0FF' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Calendar</span>
                </DropdownMenuItem>

                {/* Roadmap */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/roadmap')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(75, 0, 255, 0.1)'
                  }}
                >
                  <MapPin className="w-4 h-4 mr-3" style={{ color: '#4B00FF' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Roadmap</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator style={{ backgroundColor: '#FFCF00', height: '2px', margin: '8px 0' }} />

                {/* Settings */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/settings')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(75, 0, 255, 0.1)'
                  }}
                >
                  <Settings className="w-4 h-4 mr-3" style={{ color: '#4B00FF' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Settings</span>
                </DropdownMenuItem>

                {/* Notifications */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/notifications')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 224, 255, 0.1)'
                  }}
                >
                  <Bell className="w-4 h-4 mr-3" style={{ color: '#00E0FF' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Notifications</span>
                </DropdownMenuItem>

                {/* Support */}
                <DropdownMenuItem 
                  className="cursor-pointer p-3 mb-1 rounded-xl bouncy-button focus:bg-transparent"
                  onClick={() => navigate('/support')}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(108, 255, 108, 0.1)'
                  }}
                >
                  <HelpCircle className="w-4 h-4 mr-3" style={{ color: '#6CFF6C' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Support</span>
                </DropdownMenuItem>

                {/* Beta Testing Warning - Expandable */}
                <BetaTestingCard />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logo - center, clickable to go to dashboard */}
          <div 
            className="flex-1 flex items-center justify-center cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <Logo size="md" showText={false} />
          </div>

          {/* Right side - Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            style={{
              width: '40px',
              height: '40px',
              flexShrink: 0,
              borderRadius: 'var(--radius-lg)',
              padding: 0,
            }}
            title="Refresh page"
          >
            <RefreshCw 
              className="w-5 h-5"
              style={{ 
                color: 'var(--foreground)',
              }} 
            />
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  const MobileBottomNav = () => {
    // Show loading overlay if nav items haven't loaded yet
    if (!navItemsLoaded) {
      return <NavLoadingOverlay isMobile={true} />;
    }

    return (
      <div 
        className="mobile-nav-bar pointer-events-auto bg-background border-t border-border"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingBottom: 'max(var(--spacing-2), env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'var(--spacing-2)',
          paddingRight: 'var(--spacing-2)',
          paddingTop: 'var(--spacing-2)',
          flexShrink: 0,
          backgroundColor: 'var(--background)', // FORCE SOLID WHITE BACKGROUND
          backdropFilter: 'none', // Remove any transparency effects
          WebkitBackdropFilter: 'none', // Remove any transparency effects for Safari
        }}
      >
        {navItemsLoaded && (
          <div 
            className="flex items-center justify-around gap-1 bg-white dark:bg-gray-900 rounded-2xl px-2 py-2"
            style={{ boxShadow: 'none' }}
          >
            {bottomNavItems.map((item) => (
              <button
                key={item.id}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 flex-1 transition-all duration-300 rounded-xl bouncy-button ${
                  item.active 
                    ? (item.id === 'operations' ? 'text-orange-600 bg-orange-500/10' : 'text-primary bg-primary/10')
                    : 'text-gray-600 dark:text-gray-400 hover:bg-accent/5'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNavigate(item.path, item.isMoreButton, item.id);
                }}
                type="button"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: 'none'
                }}
              >
                <item.icon className={`w-7 h-7 ${item.active ? (item.id === 'operations' ? 'text-orange-600' : 'text-primary') : ''}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Business Switcher Sheet Content
  const BusinessSwitcherSheet = () => (
    <div className="h-full flex flex-col">
      {/* Header with gradient */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-200/30 dark:border-blue-700/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Your Businesses</h3>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {userBusinesses.length} {userBusinesses.length === 1 ? 'business' : 'businesses'} available
            </p>
          </div>
        </div>
      </div>
      
      {/* Business list with better styling */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {userBusinesses.map((business) => (
          <div
            key={business.id}
            className={`p-4 rounded-xl transition-all duration-200 relative ${
              selectedBusiness?.id === business.id
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 border-2 border-blue-200 dark:border-blue-600 shadow-md'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm'
            }`}
          >
            {/* Main business card - clickable area */}
            <div 
              className="cursor-pointer"
              onClick={() => {
                if (business.id !== selectedBusiness?.id) {
                  switchBusiness(business.id);
                }
                setBusinessSwitcherOpen(false);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${
                      selectedBusiness?.id === business.id 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {business.name}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                    {business.industry || 'General Business'}
                  </p>
                  {business.revenue && (
                    <div className="text-xs font-medium text-green-600 dark:text-green-400">
                      ${business.revenue.toLocaleString()} revenue
                    </div>
                  )}
                </div>
                {selectedBusiness?.id === business.id && (
                  <div className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                    Active
                  </div>
                )}
              </div>
            </div>

            {/* Edit button - absolute positioned at bottom right */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-2 right-2 h-8 px-3 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              onClick={(e) => {
                e.stopPropagation();
                setBusinessSwitcherOpen(false);
                navigate(`/business-management?edit=${business.id}`);
              }}
            >
              <Settings className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
          </div>
        ))}
      </div>
      
      {/* Footer with action button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <Button 
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg"
          onClick={() => {
            setBusinessSwitcherOpen(false);
            navigate('/business-management');
          }}
        >
          <Settings className="w-4 h-4" />
          <span>Manage Businesses</span>
        </Button>
      </div>
    </div>
  );

  // More Menu Sheet Content
  const MoreMenuSheet = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3" style={{ backgroundColor: 'rgba(75, 0, 255, 0.08)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center" 
            style={{ backgroundColor: '#4B00FF' }}
          >
            <Menu className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">More Options</h3>
            <p className="text-xs text-muted-foreground">
              Additional features and settings
            </p>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {/* Business Switcher */}
        <button
          className="w-full p-3 rounded-xl bg-card border-2 hover:border-primary/30 transition-all duration-200 text-left bouncy-button"
          style={{ borderColor: 'rgba(75, 0, 255, 0.2)' }}
          onClick={() => {
            setMoreMenuOpen(false);
            setBusinessSwitcherOpen(true);
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: '#4B00FF' }}
            >
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Switch Business</h4>
              <p className="text-sm text-muted-foreground truncate">
                {selectedBusiness?.name || 'Select a business'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>

        {/* Cofounder AGI */}
        <button
          className="w-full p-3 rounded-xl bg-card border-2 hover:border-primary/30 transition-all duration-200 text-left bouncy-button"
          style={{ borderColor: 'rgba(0, 224, 255, 0.2)' }}
          onClick={() => {
            setMoreMenuOpen(false);
            navigate('/cofounder-ai');
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: '#4B00FF' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Roadmap</h4>
              <p className="text-sm text-muted-foreground">AI-powered business assistant</p>
            </div>
          </div>
        </button>

        {/* University */}
        <button
          className="w-full p-3 rounded-xl bg-card border-2 hover:border-primary/30 transition-all duration-200 text-left bouncy-button"
          style={{ borderColor: 'rgba(255, 207, 0, 0.3)' }}
          onClick={() => {
            setMoreMenuOpen(false);
            navigate('/temp-university');
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: '#FFCF00' }}
            >
              <GraduationCap className="w-5 h-5 text-black" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">University</h4>
              <p className="text-sm text-muted-foreground">Learn and grow your business</p>
            </div>
          </div>
        </button>

        {/* Support */}
        <button
          className="w-full p-3 rounded-xl bg-card border-2 hover:border-primary/30 transition-all duration-200 text-left bouncy-button"
          style={{ borderColor: 'rgba(108, 255, 108, 0.3)' }}
          onClick={() => {
            setMoreMenuOpen(false);
            navigate('/support');
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: '#6CFF6C' }}
            >
              <HelpCircle className="w-5 h-5 text-black" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Support</h4>
              <p className="text-sm text-muted-foreground">Get help when you need it</p>
            </div>
          </div>
        </button>

        {/* Profile */}
        <button
          className="w-full p-3 rounded-xl bg-card border-2 hover:border-primary/30 transition-all duration-200 text-left bouncy-button"
          style={{ borderColor: 'rgba(75, 0, 255, 0.2)' }}
          onClick={() => {
            setMoreMenuOpen(false);
            navigate('/profile');
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: '#4B00FF' }}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Profile</h4>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
          </div>
        </button>

        {/* Notifications */}
        <button
          className="w-full p-3 rounded-xl bg-card border-2 hover:border-primary/30 transition-all duration-200 text-left bouncy-button"
          style={{ borderColor: 'rgba(0, 224, 255, 0.3)' }}
          onClick={() => {
            setMoreMenuOpen(false);
            navigate('/notifications');
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: '#00E0FF' }}
            >
              <Bell className="w-5 h-5 text-black" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Notifications</h4>
              <p className="text-sm text-muted-foreground">Team collaboration updates</p>
            </div>
          </div>
        </button>

        {/* Toggle Dark/Light Mode */}
        <button
          className="w-full p-3 rounded-xl bg-card border-2 hover:border-primary/30 transition-all duration-200 text-left bouncy-button"
          style={{ borderColor: 'rgba(255, 207, 0, 0.3)' }}
          onClick={() => {
            toggleTheme();
            // Don't close menu immediately so user sees the theme change
            setTimeout(() => setMoreMenuOpen(false), 300);
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center" 
              style={{ backgroundColor: '#FFCF00' }}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-black" />
              ) : (
                <Moon className="w-5 h-5 text-black" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </h4>
              <p className="text-sm text-muted-foreground">
                Switch to {theme === 'dark' ? 'light' : 'dark'} theme
              </p>
            </div>
          </div>
        </button>
      </div>
      
      {/* Footer with sign out */}
      <div className="p-3 border-t bg-muted/30 border-border">
        <button 
          className="w-full text-white font-medium rounded-xl h-11 flex items-center justify-center gap-2 shadow-md transition-all duration-200 bouncy-button"
          style={{ backgroundColor: '#FF4F4F' }}
          onClick={() => {
            setMoreMenuOpen(false);
            handleSignOut();
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="mobile-layout bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Shooting stars for ambiance */}
      <div className="shooting-star" style={{ animationDelay: '12s', animationDuration: '4s', top: '25%' }}></div>
      <div className="shooting-star" style={{ animationDelay: '45s', animationDuration: '5s', top: '65%' }}></div>

      {/* Hide standard mobile header on AI pages (they have their own custom headers) */}
      {!isAIPage && <MobileHeader />}

      {/* Page Content - Fills remaining space with padding to avoid overlap */}
      <main 
        ref={mainContentRef}
        className="flex-1 overflow-y-auto bg-transparent"
        style={{
          paddingTop: getContentPaddingTop(),
          paddingBottom: isAIPage ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 60px + var(--spacing-8))', // Include iOS safe area at bottom + healthy margin
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
        }}
      >
        {children}
      </main>

      {/* Hide bottom nav on AI pages (they have their own top nav) */}
      {!isAIPage && <MobileBottomNav />}

      {/* More Menu Sheet */}
      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] mobile-sheet mobile-fade-in"
        >
          <VisuallyHidden>
            <SheetTitle>More Options</SheetTitle>
            <SheetDescription>Access additional features and settings</SheetDescription>
          </VisuallyHidden>
          <MoreMenuSheet />
        </SheetContent>
      </Sheet>

      {/* Business Switcher Sheet */}
      <Sheet open={businessSwitcherOpen} onOpenChange={setBusinessSwitcherOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] mobile-sheet mobile-fade-in"
        >
          <VisuallyHidden>
            <SheetTitle>Switch Business</SheetTitle>
            <SheetDescription>Select a different business to work on</SheetDescription>
          </VisuallyHidden>
          <BusinessSwitcherSheet />
        </SheetContent>
      </Sheet>

      {/* Mobile Upgrade Modal */}
      <MobileUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={planDisplayName.toLowerCase()}
        onUpgradeSuccess={() => {
          setUpgradeModalOpen(false);
          // Refresh subscription data if needed
        }}
      />
    </div>
  );
});