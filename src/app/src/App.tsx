import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Capacitor } from '@capacitor/core';
import { supabase } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { isAdminUser, shouldSkipRedirect, isEntryPage } from './utils/authUtils';
import { getUserDisplayName } from './utils/userUtils';
import { DeepLinkManager } from './components/DeepLinkManager';
import { initializeIAP } from './utils/iapManager';
import { runAuthDiagnostics } from './utils/authDiagnostics';
import { initializePushNotifications } from './utils/pushNotifications';

// Essential components
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeColorReplacer } from './components/ThemeColorReplacer';
import { BusinessProvider } from './components/BusinessContext';
import { CloudSubscriptionProvider } from './components/CloudSubscriptionContext';
import { MotivationProvider } from './components/MotivationProvider';
// REMOVED: StreakProvider - no longer using streaks
import { AppContent } from './components/AppContent';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { AdminImpersonationBanner } from './components/AdminImpersonationBanner';
import { PersistentSubscriptionOverride } from './components/PersistentSubscriptionOverride';
import { SubscriptionStatusMonitor } from './components/SubscriptionStatusMonitor';
import { StripeAdminOverride } from './components/StripeAdminOverride';
import { PaymentSuccessDetector } from './components/PaymentSuccessDetector';
import { WebhookSyncManager } from './components/WebhookSyncManager';
import { CofounderAIBusinessUpdateFix } from './components/CofounderAIBusinessUpdateFix';
import { BusinessNameUpdateFix } from './components/BusinessNameUpdateFix';
import { ZeroBusinessHandler } from './components/ZeroBusinessHandler';
import { SubscriptionProvider } from './components/SubscriptionContext';
import { RoadmapProvider } from './contexts/RoadmapContext';
import { IAPAutoRestore } from './components/IAPAutoRestore';
import { NotificationProvider } from './contexts/NotificationContext';

// Simplified status bar component - ONLY for admin users - now inside Router context
const AdminStatusBar: React.FC<{
  authError: string | null;
  user: any;
  isSigningOut: boolean;
  setIsSigningOut: (value: boolean) => void;
  setUser: (user: any) => void;
  setAccessToken: (token: string | null) => void;
  setAuthError: (error: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  accessToken: string | null;
}> = ({ authError, user, isSigningOut, setIsSigningOut, setUser, setAccessToken, setAuthError, setAuthReady, accessToken }) => {
  const navigate = useNavigate();
  const [showPersistentOverride, setShowPersistentOverride] = useState(false);
  const [showStatusMonitor, setShowStatusMonitor] = useState(false);
  const [showStripeOverride, setShowStripeOverride] = useState(false);
  const [showBusinessUpdateFix, setShowBusinessUpdateFix] = useState(false);
  const [showNewBusinessFix, setShowNewBusinessFix] = useState(false);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleDiagnosticClick = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('🔧 AdminStatusBar: Navigating to /database-diagnostic');
    navigate('/database-diagnostic');
  }, [navigate]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Enhanced navigation handler with debugging
  const handleNavigation = useCallback((path: string, label: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🔧 AdminStatusBar: Navigating to ${path} (${label})`);
      console.log(`🔧 AdminStatusBar: Current location:`, window.location.pathname);
      console.log(`🔧 AdminStatusBar: User:`, user?.email);
      console.log(`🔧 AdminStatusBar: Navigate function:`, typeof navigate);
      try {
        navigate(path);
        console.log(`🔧 AdminStatusBar: Navigation call completed for ${path}`);
        // Add a timeout to check if navigation actually worked
        setTimeout(() => {
          console.log(`🔧 AdminStatusBar: After navigation - Current location:`, window.location.pathname);
          if (window.location.pathname !== path) {
            console.log(`ℹ️ AdminStatusBar: Navigation result - Expected: ${path}, Actual: ${window.location.pathname}`);
          }
        }, 100);
      } catch (error) {
        console.error(`❌ AdminStatusBar: Navigation failed for ${path}:`, error);
        // Fallback navigation
        console.log(`🔧 AdminStatusBar: Trying fallback navigation to ${path}`);
        window.location.href = path;
      }
    };
  }, [navigate]);

  // Enhanced state toggle handler with debugging
  const handleToggle = useCallback((currentState: boolean, setState: (value: boolean) => void, label: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`🔧 AdminStatusBar: Toggling ${label} from ${currentState} to ${!currentState}`);
      setState(!currentState);
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    
    console.log('🚪 App: Sign out initiated');
    
    // Step 1: Set state to show loading screen via React (not DOM manipulation)
    setIsSigningOut(true);
    
    // Step 2: Clear ALL storage immediately - no need for timestamps or flags
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🔧 App: Cleared all storage');
    } catch (e) {
      console.error('Storage clear error (non-blocking):', e);
    }
    
    // Step 3: Sign out from Supabase
    try {
      await supabase.auth.signOut();
      console.log('🔧 App: Supabase sign out complete');
    } catch (error) {
      console.error('🔧 App: Supabase sign out error (non-blocking):', error);
    }
    
    // Step 4: Small delay for UX (show spinner briefly)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 5: Hard reload to root - clears all state
    console.log('🔧 App: Reloading to complete sign out');
    window.location.href = '/';
  }, [isSigningOut, setIsSigningOut]);

  // Error Status - only show if authentication is completely broken
  if (authError) {
    return (
      <div className="bg-red-500 text-white px-4 py-2 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <span>⚠️ Authentication error: {authError}</span>
          <button
            onClick={handleRetry}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Success Status for authenticated admin users
  if (user) {
    return (
      <>
        <div className="bg-green-500 text-white px-4 py-1 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <span>✅ Logged in as {getUserDisplayName(user)}</span>
            <button 
              onClick={handleDiagnosticClick}
              className="underline hover:no-underline text-green-100 cursor-pointer"
              type="button"
            >
              Diagnostics
            </button>

            <button 
              onClick={handleToggle(showPersistentOverride, setShowPersistentOverride, 'Persistent Override')}
              className="underline hover:no-underline text-green-100 cursor-pointer"
              type="button"
            >
              Persistent Override
            </button>
            <button 
              onClick={handleToggle(showStatusMonitor, setShowStatusMonitor, 'Status Monitor')}
              className="underline hover:no-underline text-green-100 cursor-pointer"
              type="button"
            >
              Status Monitor
            </button>
            <button 
              onClick={handleToggle(showStripeOverride, setShowStripeOverride, 'Stripe Override')}
              className="underline hover:no-underline text-green-100 cursor-pointer"
              type="button"
            >
              Stripe Override
            </button>
            <button 
              onClick={handleNavigation('/quiz-diagnostic', 'Quiz Debug')}
              className="underline hover:no-underline text-green-100 cursor-pointer"
              type="button"
            >
              Quiz Debug
            </button>



            <button 
              onClick={handleNavigation('/stripe-webhook-manager', 'Webhook Manager')}
              className="underline hover:no-underline text-green-100 cursor-pointer"
              type="button"
            >
              Webhook Manager
            </button>
            <button 
              onClick={handleNavigation('/subscription-dashboard', 'Subscription Dashboard')}
              className="underline hover:no-underline text-blue-100 cursor-pointer bg-blue-600/20 px-2 py-1 rounded border border-blue-400/30 hover:bg-blue-600/30 transition-colors font-semibold"
              type="button"
              title="Main subscription management dashboard - Your subscription cards are here!"
            >
              💳 Subscription Dashboard
            </button>

            <button 
              onClick={handleNavigation('/billing', 'User Billing Portal')}
              className="underline hover:no-underline text-yellow-100 cursor-pointer bg-yellow-600/20 px-2 py-1 rounded border border-yellow-400/30 hover:bg-yellow-600/30 transition-colors"
              type="button"
              title="Create and test new subscriptions"
            >
              💳 Billing Portal
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🪑 Direct navigation to seat subscription test');
                window.location.href = '/billing';
              }}
              className="underline hover:no-underline text-purple-100 cursor-pointer bg-purple-600/20 px-2 py-1 rounded border border-purple-400/30 hover:bg-purple-600/30 transition-colors"
              type="button"
              title="Test simple seat subscriptions page"
            >
              🪑 Seat Subscriptions
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 AdminStatusBar: Manual webhook sync triggered');
                const syncEvent = new CustomEvent('manual-webhook-sync');
                window.dispatchEvent(syncEvent);
              }}
              className="underline hover:no-underline text-yellow-100 cursor-pointer bg-yellow-600/20 px-2 py-1 rounded border border-yellow-400/30 hover:bg-yellow-600/30 transition-colors"
              type="button"
              title="Manually sync webhook data with Stripe"
            >
              🔄 Sync Webhook
            </button>
            <button 
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 AdminStatusBar: Running KV Store diagnostic...');
                try {
                  // Get current session for authorization
                  const { data: { session } } = await supabase.auth.getSession();
                  const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;
                  
                  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/kv-diagnostic`, {
                    headers: {
                      'Authorization': authHeader
                    }
                  });
                  const result = await response.json();
                  console.log('🔧 KV Store Diagnostic Results:', result);
                  if (result.success) {
                    alert(`✅ KV Store OK (${result.totalTime})`);
                  } else {
                    alert(`❌ KV Store Issues:\n${JSON.stringify(result.tests, null, 2)}`);
                  }
                } catch (error: any) {
                  console.error('🔧 KV Store diagnostic failed:', error);
                  alert(`❌ KV Store Diagnostic Failed: ${error.message}`);
                }
              }}
              className="underline hover:no-underline text-red-100 cursor-pointer bg-red-600/20 px-2 py-1 rounded border border-red-400/30 hover:bg-red-600/30 transition-colors"
              type="button"
              title="Test KV Store connectivity"
            >
              🔧 KV Test
            </button>

            <button 
              onClick={handleToggle(showBusinessUpdateFix, setShowBusinessUpdateFix, 'Business Update Fix')}
              className="underline hover:no-underline text-orange-100 cursor-pointer bg-orange-600/20 px-2 py-1 rounded border border-orange-400/30 hover:bg-orange-600/30 transition-colors"
              type="button"
              title="Fix CofounderAI business name change issues"
            >
              🤖 AI Fix
            </button>
            <button 
              onClick={handleToggle(showNewBusinessFix, setShowNewBusinessFix, 'New Business Fix')}
              className="underline hover:no-underline text-red-100 cursor-pointer bg-red-600/20 px-2 py-1 rounded border border-red-400/30 hover:bg-red-600/30 transition-colors"
              type="button"
              title="Complete fix for business name updates"
            >
              🏢 COMPLETE FIX
            </button>
            <button 
              onClick={handleNavigation('/assistant-sync', 'Assistant Sync')}
              className="underline hover:no-underline text-blue-100 cursor-pointer bg-blue-600/20 px-2 py-1 rounded border border-blue-400/30 hover:bg-blue-600/30 transition-colors"
              type="button"
              title="Sync OpenAI Assistant with latest AI functions"
            >
              🧠 Assistant Sync
            </button>
            <button 
              onClick={handleNavigation('/university', 'University')}
              className="underline hover:no-underline text-green-100 cursor-pointer bg-green-600/20 px-2 py-1 rounded border border-green-400/30 hover:bg-green-600/30 transition-colors"
              type="button"
              title="Go to new University page"
            >
              🎓 University
            </button>
            <button 
              onClick={handleNavigation('/paywall-test', 'Paywall Test')}
              className="underline hover:no-underline text-purple-100 cursor-pointer bg-purple-600/20 px-2 py-1 rounded border border-purple-400/30 hover:bg-purple-600/30 transition-colors"
              type="button"
              title="Test paywall system with all operations limits"
            >
              🚫 Paywall Test
            </button>
            <button 
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Confirm before running migration
                const confirmed = window.confirm(
                  '🚀 Credits 10x Migration\n\n' +
                  'This will multiply all user credits by 10x to match the new pricing:\n' +
                  '• Write functions: 10 credits\n' +
                  '• Read functions: 2 credits\n' +
                  '• Regular messages: 1 credit\n\n' +
                  'Users with >10,000 credits will be skipped (assumed already migrated).\n\n' +
                  'Continue?'
                );
                
                if (!confirmed) return;
                
                setMigrationRunning(true);
                setMigrationResult(null);
                console.log('🚀 ADMIN: Starting Credits 10x Migration...');
                
                try {
                  // Get current session for authorization
                  const { data: { session } } = await supabase.auth.getSession();
                  const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;
                  
                  console.log('🔑 ADMIN: Using auth token:', session?.access_token ? 'User token' : 'Public anon key');
                  
                  const response = await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits-10x-migration`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json',
                      },
                    }
                  );

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
                  }

                  setMigrationResult(data);
                  console.log('✅ Credits 10x Migration completed:', data);
                  
                  alert(
                    `✅ Migration Successful!\n\n` +
                    `Migrated Users: ${data.migratedCount}\n` +
                    `Skipped Users: ${data.skippedCount}\n\n` +
                    `Check console for detailed log.`
                  );
                  
                  if (data.migrationLog) {
                    console.log('📋 Migration Log:', data.migrationLog);
                  }
                } catch (error: any) {
                  console.error('❌ Credits 10x Migration failed:', error);
                  setMigrationResult({ error: error.message });
                  alert(`❌ Migration Failed!\n\n${error.message}\n\nCheck console for details.`);
                } finally {
                  setMigrationRunning(false);
                }
              }}
              disabled={migrationRunning}
              style={{
                background: migrationRunning 
                  ? 'var(--color-muted)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                cursor: migrationRunning ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: migrationRunning ? 0.6 : 1,
                fontWeight: 'var(--font-weight-semibold)',
              }}
              type="button"
              title="Run credits 10x migration for new pricing model"
            >
              {migrationRunning ? '⏳ Migrating...' : '💫 Credits 10x Migration'}
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 AdminStatusBar: Sign Out button clicked!');
                handleSignOut();
              }}
              disabled={isSigningOut}
              className="underline hover:no-underline text-green-100 disabled:opacity-50 cursor-pointer font-semibold bg-red-600/20 px-2 py-1 rounded border border-red-400/30 hover:bg-red-600/30 transition-colors"
              type="button"
              title="Click to sign out"
            >
              {isSigningOut ? '🔄 Signing out...' : '🚪 Sign Out'}
            </button>
          </div>
        </div>
        {showPersistentOverride && (
          <div className="fixed top-16 right-4 z-50 max-w-4xl w-full">
            <PersistentSubscriptionOverride user={user} isSigningOut={isSigningOut} />
          </div>
        )}
        {showStatusMonitor && (
          <div className="fixed top-16 right-4 z-50 max-w-4xl w-full">
            <SubscriptionStatusMonitor user={user} isSigningOut={isSigningOut} />
          </div>
        )}
        {showStripeOverride && (
          <div className="fixed top-16 right-4 z-50 max-w-4xl w-full">
            <StripeAdminOverride user={user} isSigningOut={isSigningOut} />
          </div>
        )}
        {showBusinessUpdateFix && (
          <div className="fixed top-16 right-4 z-50 max-w-4xl w-full">
            <CofounderAIBusinessUpdateFix />
          </div>
        )}
        {showNewBusinessFix && (
          <div className="fixed top-16 right-4 z-50 max-w-4xl w-full">
            <BusinessNameUpdateFix />
          </div>
        )}
      </>
    );
  }

  return null;
};

// Simplified auth handler with better timeout management
const AuthRedirectHandler: React.FC<{ 
  user: any; 
  setUser: (user: any) => void; 
  setAuthError: (error: string | null) => void;
  isSigningOut?: boolean;
  setAuthReady: (ready: boolean) => void;
  setAccessToken: (token: string | null) => void;
}> = ({ user, setUser, setAuthError, isSigningOut = false, setAuthReady, setAccessToken }) => {
  const navigate = useNavigate();

  // Simplified admin redirect function for debugging
  const forceAdminRedirect = useCallback(() => {
    if (user && isAdminUser(user)) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // Add to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).forceAdminRedirect = forceAdminRedirect;
      (window as any).debugAdminCheck = () => {
        console.log('🔧 DEBUG: Current user admin status:', {
          user,
          isAdmin: isAdminUser(user),
          currentPath: window.location.pathname
        });
      };
    }
  }, [user, forceAdminRedirect]);

  // Enhanced auth state change handler with better sign out handling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let mounted = true;
    
    // IMMEDIATE admin check and redirect on mount (but not during sign out)
    if (user && isAdminUser(user) && !isSigningOut) {
      console.log('🔧 AuthRedirectHandler: ⚡ ADMIN USER DETECTED ON MOUNT!');
      navigate('/admin', { replace: true });
      return;
    }

    // Define OAuth listener at effect level for proper cleanup
    // REMOVED: Logic moved to DeepLinkManager for better navigation handling
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip ALL processing during sign out to prevent race conditions
        if (!mounted || isSigningOut) {
          console.log('🔧 AuthRedirectHandler: Skipping auth event during sign out:', event);
          return;
        }
        
        console.log('🔧 AuthRedirectHandler: Processing auth event:', event, 'Session user:', session?.user?.email);
        
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('🔧 AuthRedirectHandler: User signed in:', session.user.email);
            console.log('🔧 AuthRedirectHandler: Access token available:', !!session.access_token);
            setUser(session.user);
            setAccessToken(session.access_token || null);
            setAuthError(null);
            
            // Track login for analytics
            if (session.access_token) {
              console.log('🔧 AuthRedirectHandler: Calling track-login endpoint for user:', session.user.email);
              fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/track-login`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(res => res.json())
              .then(data => console.log('✅ Track-login response:', data))
              .catch(err => console.log('❌ Login tracking failed (non-blocking):', err));
            }
            
            // Set auth as ready after a short delay to ensure session is processed
            setTimeout(() => {
              if (mounted && !isSigningOut) {
                console.log('🔧 AuthRedirectHandler: Setting auth ready after sign in');
                setAuthReady(true);
              }
            }, 200);
            
            // Check admin status immediately
            const isAdmin = isAdminUser(session.user);
            
            if (isAdmin) {
              console.log('🔧 AuthRedirectHandler: ⚡ ADMIN SIGNED IN - FORCING IMMEDIATE REDIRECT!');
              navigate('/admin', { replace: true });
            } else {
              // Use timeout to prevent immediate navigation conflicts for regular users
              timeoutId = setTimeout(() => {
                if (!mounted || isSigningOut) return;
                
                const currentPath = window.location.pathname;
                
                // Check if we're on an entry page (should redirect)
                const isEntryPageCheck = isEntryPage(currentPath);
                const shouldSkip = shouldSkipRedirect(currentPath);
                
                if (isEntryPageCheck && !shouldSkip) {
                  console.log('🔧 AuthRedirectHandler: Regular user, navigating to roadmap...');
                  navigate('/roadmap', { replace: true });
                } else {
                  console.log('🔧 AuthRedirectHandler: Skipping redirect, user is on app page:', currentPath);
                }
              }, 100);
            }
            
          } else if (event === 'SIGNED_OUT') {
            console.log('🔧 AuthRedirectHandler: SIGNED_OUT event received');
            
            // Only clear state if we're not already in the middle of signing out
            // (to prevent race conditions with manual sign out)
            if (!isSigningOut) {
              console.log('🔧 AuthRedirectHandler: Clearing state due to external sign out');
              setUser(null);
              setAccessToken(null);
              setAuthError(null);
            } else {
              console.log('🔧 AuthRedirectHandler: Skipping state clear - manual sign out in progress');
            }
            
            // Navigation is handled by the sign out handler, not here
            console.log('🔧 AuthRedirectHandler: SIGNED_OUT event processed');
            
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Only process token refresh if not signing out
            if (!isSigningOut) {
              console.log('🔧 AuthRedirectHandler: Token refreshed for:', session.user.email);
              console.log('🔧 AuthRedirectHandler: New access token available:', !!session.access_token);
              setUser(session.user);
              setAccessToken(session.access_token || null);
              
              // Emit event to notify SubscriptionContext of token refresh
              const tokenRefreshEvent = new CustomEvent('auth-token-refreshed', {
                detail: { 
                  newToken: session.access_token,
                  user: session.user,
                  timestamp: Date.now()
                }
              });
              window.dispatchEvent(tokenRefreshEvent);
              
              // Check if admin after token refresh
              if (isAdminUser(session.user)) {
                const currentPath = window.location.pathname;
                if (!currentPath.startsWith('/admin')) {
                  console.log('🔧 AuthRedirectHandler: Admin token refreshed but not on admin page, redirecting...');
                  navigate('/admin', { replace: true });
                }
              }
            } else {
              console.log('🔧 AuthRedirectHandler: Ignoring token refresh during sign out');
            }
          }
        } catch (error) {
          console.error('🔧 AuthRedirectHandler: Error in auth state change:', error);
          if (mounted && !isSigningOut) {
            setAuthError(`Auth error: ${error.message}`);
          }
        }
      }
    );

    return () => {
      mounted = false;
      console.log('🔧 AuthRedirectHandler: Cleaning up auth listener');
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      subscription?.unsubscribe();
    };
  }, [navigate, setUser, setAuthError, user, isSigningOut, setAccessToken, setAuthReady]);

  return null; // This component only handles side effects
};

// Main App Content Wrapper
const AppWrapper: React.FC<{
  user: any;
  userData: any;
  authError: string | null;
  setUser: (user: any) => void;
  setAuthError: (error: string | null) => void;
  isSigningOut: boolean;
  setIsSigningOut: (value: boolean) => void;
  authReady: boolean;
  setAuthReady: (ready: boolean) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}> = ({ user, userData, authError, setUser, setAuthError, isSigningOut, setIsSigningOut, authReady, setAuthReady, accessToken, setAccessToken }) => {
  return (
    <div className="starry-background transition-all duration-300">
      {/* Extended Background for iOS Bounce/Overscroll */}
      <div 
        className="fixed inset-0 w-full pointer-events-none z-0 app-extended-background"
        style={{
          height: '200vh',
          top: '-50vh',
        }}
      />

      {/* Main Container with scrolling enabled */}
      <div 
        className="fixed inset-0 w-full h-full overflow-hidden"
        style={{ zIndex: 1 }}
      >
        {/* Natural meteor shower - Moved inside scrollable container */}
        <div className="shooting-star" style={{ animationDelay: '15s', animationDuration: '4.8s', top: '20%' }}></div>
        <div className="shooting-star" style={{ animationDelay: '62s', animationDuration: '5.5s', top: '45%' }}></div>
        <div className="shooting-star" style={{ animationDelay: '98s', animationDuration: '4.2s', top: '70%' }}></div>
        
        {/* Deep Link Manager - Handles OAuth redirects inside Router context */}
        <DeepLinkManager />

        {/* Auth redirect handler */}
        <AuthRedirectHandler user={user} setUser={setUser} setAuthError={setAuthError} isSigningOut={isSigningOut} setAuthReady={setAuthReady} setAccessToken={setAccessToken} />
        
        {/* Admin Status Bar - only show for admin users */}
        {isAdminUser(user) && (
          <div className="relative z-20">
            <AdminStatusBar 
              authError={authError}
              user={user}
              isSigningOut={isSigningOut}
              setIsSigningOut={setIsSigningOut}
              setUser={setUser}
              setAccessToken={setAccessToken}
              setAuthError={setAuthError}
              setAuthReady={setAuthReady}
              accessToken={accessToken}
            />
          </div>
        )}
        
        <div className="relative z-10 h-full overflow-y-auto -webkit-overflow-scrolling-touch">
          {/* Admin Impersonation Banner - Shows when admin is viewing as another user */}
          <AdminImpersonationBanner />
          
          <CloudSubscriptionProvider user={user} isSigningOut={isSigningOut} authReady={authReady} accessToken={accessToken}>
            <BusinessProvider user={user} supabaseAvailable={true}>
              <NotificationProvider businessId={user?.id}>
                {/* Payment success detector - monitors for payment completion */}
                <PaymentSuccessDetector user={user} />
                
                {/* Webhook sync manager - handles proper webhook synchronization */}
                <WebhookSyncManager user={user} />
                
                {/* IAP Auto-Restore - automatically syncs IAP purchases on app launch */}
                <IAPAutoRestore user={user} />
                
                {/* Zero Business Handler - auto-retries and redirects if user has no businesses */}
                <ZeroBusinessHandler user={user}>
                  <AppContent 
                    user={user} 
                    userData={userData} 
                    authError={authError}
                    supabaseAvailable={true} // Always true for now to simplify
                    customServerAvailable={true} // Always true for now to simplify
                    isSigningOut={isSigningOut}
                    authReady={authReady}
                    accessToken={accessToken}
                  />
                </ZeroBusinessHandler>
              </NotificationProvider>
            </BusinessProvider>
          </CloudSubscriptionProvider>
        </div>
      </div>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // DEBUG: Start with false to bypass loading screen and see if app renders
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [customServerAvailable, setCustomServerAvailable] = useState(true);

  // Debug logging for render
  console.log('App: Render - isInitialLoad:', isInitialLoad, 'User:', user?.email);

  // Add global error handler to catch runtime errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Suppress benign errors that are common with Radix UI and don't affect functionality
      const benignErrors = [
        'ResizeObserver loop',
        'Unknown runtime error', // Generic runtime errors from events.mjs (often benign)
        'events.mjs',  // Errors from events.mjs are usually benign Radix UI warnings
        'async_hooks.mjs' // Async hooks errors are typically benign
      ];
      
      if (benignErrors.some(err => event.message?.includes(err) || event.filename?.includes(err))) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      // Build error object with all available information
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      };

      // Check if the error object has any meaningful properties
      const hasContent = Object.values(errorInfo).some(val => 
        val !== undefined && val !== null && val !== ''
      );

      if (!hasContent) {
        // Empty error - log diagnostic information
        console.warn('⚠️ Empty Error Event Detected:', {
          eventType: event.type,
          eventKeys: Object.keys(event),
          eventConstructor: event.constructor?.name,
          timestamp: new Date().toISOString(),
          // Log a sample of event properties (might reveal hidden info)
          rawEvent: {
            isTrusted: event.isTrusted,
            bubbles: event.bubbles,
            cancelable: event.cancelable,
            defaultPrevented: event.defaultPrevented,
          }
        });
        // Don't spam console with empty errors
        event.preventDefault();
        return;
      }
      
      console.error('🔴 Global Error Handler:', errorInfo);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Extract meaningful information from rejection
      const reason = event.reason;
      
      // Check if reason has any content
      if (!reason || (typeof reason === 'object' && Object.keys(reason).length === 0)) {
        console.warn('⚠️ Empty Promise Rejection Detected:', {
          hasReason: !!reason,
          reasonType: typeof reason,
          timestamp: new Date().toISOString()
        });
        event.preventDefault();
        return;
      }

      console.error('🔴 Unhandled Promise Rejection:', {
        reason: reason,
        reasonString: String(reason),
        reasonStack: reason?.stack,
        promise: event.promise
      });
    };

    window.addEventListener('error', handleError, true); // Use capture phase
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Apply saved color theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('colorTheme');
    if (savedTheme === 'pink') {
      document.documentElement.classList.add('theme-pink');
    } else {
      document.documentElement.classList.remove('theme-pink');
    }
  }, []);

  // Restored Initialization Logic
  
  // Aggressive timeout to prevent hanging - reduced to 1 second for speed
  useEffect(() => {
    if (isInitialLoad) {
      const forceLoadTimeout = setTimeout(() => {
        console.log('⚠️ App: Force completing initialization (1s timeout)');
        setIsInitialLoad(false);
        setAuthReady(true);
      }, 1000); // Reduced to 1 second for maximum speed

      return () => clearTimeout(forceLoadTimeout);
    }
  }, [isInitialLoad]);

  // Simplified initialization with better error handling
  useEffect(() => {
    let mounted = true;
    let initTimeout: NodeJS.Timeout;

    const initializeApp = async () => {
      try {
        console.log('App: Starting fast initialization...');
        
        // PERFORMANCE: Set a much shorter timeout for initialization (500ms instead of 2000ms)
        initTimeout = setTimeout(() => {
          if (mounted) {
            console.log('App: Fast initialization timeout - completing');
            setIsInitialLoad(false);
            setAuthReady(true);
          }
        }, 500);
        
        // Simple session check without race conditions
        let result;
        try {
          result = await supabase.auth.getSession();
        } catch (sessionError: any) {
          console.warn('App: Session check failed (non-blocking):', sessionError.message);
          result = { data: { session: null }, error: sessionError };
        }
        
        if (!mounted) return;

        if (result && typeof result === 'object' && 'data' in result) {
          const { data: { session }, error } = result as any;
          
          if (error) {
            console.log('App: Session error (non-blocking):', error.message);
            // Don't set authError - just continue without user
            setAccessToken(null);
            setAuthReady(true);
          } else if (session?.user) {
            console.log('App: Found user:', session.user.email);
            setUser(session.user);
            setAccessToken(session.access_token || null);
            setAuthError(null);
            // Mark auth as ready IMMEDIATELY - no delay!
            setAuthReady(true);
          } else {
            console.log('App: No session');
            setAuthError(null);
            setAccessToken(null);
            // Auth is ready IMMEDIATELY - no delay!
            setAuthReady(true);
          }
        }
        
      } catch (error: any) {
        console.error('App: Init error:', error);
        if (mounted) {
          // Only set auth error for actual authentication errors, not timeouts
          if (!error.message?.includes('timeout')) {
            console.warn('App: Non-timeout error during init:', error.message);
            // Don't set error state for init issues - just continue
          }
        }
      } finally {
        if (mounted) {
          console.log('App: Initialization complete');
          clearTimeout(initTimeout);
          setIsInitialLoad(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, []);

  // Native iOS IAP initialization - AFTER React mount AND native platform confirmation
  useEffect(() => {
    const initIAP = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          console.log("🔵 Native IAP: Initializing via Manager...");
          await initializeIAP();
          console.log("🟢 Native IAP: Initialized successfully via Manager");
        } catch (err) {
          console.error("🔴 Native IAP: Initialization error:", err);
        }
      } else {
        console.log("🟡 Native IAP: Web environment detected, skipping initialization");
      }
    };

    initIAP();
  }, []);

  // Initialize push notifications
  useEffect(() => {
    const initPushNotifications = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          console.log("🔵 Native Push Notifications: Initializing...");
          await initializePushNotifications();
          console.log("🟢 Native Push Notifications: Initialized successfully");
        } catch (err) {
          console.error("🔴 Native Push Notifications: Initialization error:", err);
        }
      } else {
        console.log("🟡 Native Push Notifications: Web environment detected, skipping initialization");
      }
    };

    initPushNotifications();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        {isSigningOut ? (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px',
            zIndex: 99999
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#00E0FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              color: '#374151',
              fontSize: '16px',
              fontWeight: 600
            }}>Signing out...</div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : isInitialLoad ? (
          <LoadingScreen />
        ) : (
          <>
            <ThemeColorReplacer />
            <SubscriptionProvider>
              <MotivationProvider>
                <RoadmapProvider>
                  <Router>
                    <AppWrapper 
                      user={user}
                      userData={null}
                      authError={authError}
                      setUser={setUser}
                      setAuthError={setAuthError}
                      isSigningOut={isSigningOut}
                      setIsSigningOut={setIsSigningOut}
                      authReady={authReady}
                      setAuthReady={setAuthReady}
                      accessToken={accessToken}
                      setAccessToken={setAccessToken}
                    />
                  </Router>
                </RoadmapProvider>
              </MotivationProvider>
            </SubscriptionProvider>
          </>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;