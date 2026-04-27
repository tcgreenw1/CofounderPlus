import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SubscriptionData {
  status: 'free' | 'trial' | 'subscribed';
  plan: string;
  trial: any;
  subscription: any;
  stripeCustomerId: string | null;
  userLimits?: {
    currentUserCount: number;
    maxUsers: number;
    addOnSeats: number;
    addOnMonthlyCost: number;
    canAddUsers: boolean;
    subscriptionPlan: string;
  };
}

interface SeatData {
  seatCount: number;
  subscriptionId: string | null;
  stripeCustomerId: string | null;
  priceId: string | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  seatPricePerMonth: number;
  totalMonthlyCost: number;
  lastSynced: string;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  seatData: SeatData | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  refreshSeatData: () => Promise<void>;
  forceRefreshSubscription: () => Promise<void>; // Add forced refresh method
  isProUser: boolean;
  planDisplayName: string;
  canAccessOperations: boolean;
  isCreatorOrHigher: boolean;
  getRemainingTime: () => string | null;
  lastRefresh: Date | null; // Add timestamp for debugging
  refreshCount: number; // Add refresh counter for debugging
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
  user: any;
  isSigningOut?: boolean;
  authReady?: boolean;
  accessToken?: string | null;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ 
  children, 
  user,
  isSigningOut = false,
  authReady = true,
  accessToken = null
}) => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [seatData, setSeatData] = useState<SeatData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9`;

  // Enhanced setSeatData that also saves to localStorage
  const updateSeatData = (newSeatData: SeatData | null) => {
    setSeatData(newSeatData);
    
    if (typeof window !== 'undefined' && user?.id) {
      try {
        if (newSeatData) {
          localStorage.setItem(`seatData_${user.id}`, JSON.stringify(newSeatData));
          console.log('🪑 SubscriptionContext: Saved seat data to localStorage');
        } else {
          localStorage.removeItem(`seatData_${user.id}`);
          console.log('🪑 SubscriptionContext: Removed seat data from localStorage');
        }
      } catch (error) {
        console.warn('🪑 SubscriptionContext: Failed to save seat data to localStorage:', error);
      }
    }
  };

  const refreshSubscription = async (forceRefresh = false) => {
    if (!user?.id) {
      console.log('🔔 SubscriptionContext: No user ID, clearing subscription data');
      setSubscriptionData(null);
      return;
    }

    // Don't make API calls if we're signing out
    if (isSigningOut) {
      console.log('🔔 SubscriptionContext: Skipping refresh because user is signing out');
      return;
    }

    // Prevent concurrent refreshes unless forced
    if (isLoading && !forceRefresh) {
      console.log('🔔 SubscriptionContext: Refresh already in progress, skipping');
      return;
    }

    setIsLoading(true);
    setRefreshCount(prev => prev + 1);
    const refreshId = Math.random().toString(36).substr(2, 9);
    
    console.log(`🔔 SubscriptionContext: Starting refresh #${refreshCount + 1} (${refreshId}) for user:`, user.id);
    console.log(`🔔 Force refresh:`, forceRefresh);

    try {
      // Enhanced JWT token validation and refresh logic
      let finalAccessToken: string | undefined = accessToken || undefined;
      let tokenRefreshed = false;
      
      // First, validate the current token if we have one
      if (finalAccessToken) {
        console.log(`🔔 SubscriptionContext: Validating provided access token (${refreshId})`);
        
        try {
          // Check if token is valid by parsing JWT (basic validation)
          const tokenParts = finalAccessToken.split('.');
          if (tokenParts.length !== 3) {
            console.warn(`🔔 SubscriptionContext: Invalid JWT format, token has ${tokenParts.length} parts`);
            finalAccessToken = undefined;
          } else {
            // Parse JWT payload to check expiration
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < currentTime) {
              console.warn(`🔔 SubscriptionContext: JWT token expired (exp: ${payload.exp}, now: ${currentTime})`);
              finalAccessToken = undefined;
            } else {
              console.log(`🔔 SubscriptionContext: JWT token is valid (expires: ${new Date(payload.exp * 1000).toISOString()})`);
            }
          }
        } catch (jwtError: any) {
          console.warn(`🔔 SubscriptionContext: JWT validation error:`, jwtError.message);
          finalAccessToken = undefined;
        }
      }
      
      // If no valid token, get fresh session
      if (!finalAccessToken) {
        console.log(`🔔 SubscriptionContext: Getting fresh session for token (${refreshId})`);
        
        try {
          const sessionResult = await supabase.auth.getSession();
          const newToken = sessionResult.data.session?.access_token;
          
          if (newToken) {
            console.log(`🔔 SubscriptionContext: Fresh access token obtained (${refreshId})`);
            finalAccessToken = newToken;
            tokenRefreshed = true;
          } else {
            console.warn(`🔔 SubscriptionContext: No session available (${refreshId})`);
          }
        } catch (sessionError: any) {
          if (!isSigningOut) {
            console.warn(`🔔 SubscriptionContext: Session refresh error (${refreshId}):`, sessionError.message);
          }
        }
      }
      
      // If no access token and not signing out, set fallback data but don't error
      if (!finalAccessToken && !isSigningOut) {
        console.warn(`🔔 SubscriptionContext: No access token available (${refreshId}), using fallback`);
        
        // Set free plan as fallback instead of throwing error
        const fallbackData = {
          status: 'free' as const,
          plan: 'free',
          trial: null,
          subscription: null,
          stripeCustomerId: null
        };
        
        setSubscriptionData(fallbackData);
        setLastRefresh(new Date());
        console.log(`🔔 SubscriptionContext: Set fallback data due to no access token (${refreshId})`);
        return;
      }
      
      // If signing out, just return early
      if (!finalAccessToken && isSigningOut) {
        console.log(`🔔 SubscriptionContext: No access token during sign out, exiting gracefully (${refreshId})`);
        return;
      }
      
      const requestUrl = `${serverUrl}/subscription/status`;
      console.log(`🔔 SubscriptionContext: Making request to:`, requestUrl);
      
      // Add email parameter for fallback search and cache-busting for forced refresh
      const params = new URLSearchParams();
      if (user.email) {
        params.append('email', user.email);
        console.log(`🔔 SubscriptionContext: Including email for fallback search: ${user.email}`);
      }
      if (forceRefresh) {
        params.append('t', Date.now().toString());
      }
      
      const finalUrl = params.toString() ? `${requestUrl}?${params.toString()}` : requestUrl;
      
      const response = await fetch(finalUrl, {
        headers: {
          'Authorization': `Bearer ${finalAccessToken || publicAnonKey}`,
          'x-user-id': user.id,
        }
      });

      console.log(`🔔 SubscriptionContext: Response status:`, response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(`🔔 SubscriptionContext: Subscription data received:`, data);
        
        // Check if server is in fallback mode due to KV store issues
        if (data.fallbackMode || data.kvStoreUnavailable) {
          console.warn(`🔔 SubscriptionContext: Server running in fallback mode due to KV store issues`);
        }
        
        // Transform the new API response to match expected format
        // Status should reflect the subscription state properly
        let statusValue: 'free' | 'trial' | 'subscribed' = 'free';
        if (data.isActive && data.plan !== 'free') {
          // If they have an active paid plan, status should be 'subscribed'
          statusValue = 'subscribed';
        } else if (data.isActive && data.plan === 'free') {
          statusValue = 'free';
        }
        
        const transformedData = {
          status: statusValue,
          plan: data.plan || 'free',
          trial: null, // New API doesn't have trial info yet
          subscription: data.isActive ? { 
            plan: data.plan, 
            billing: data.billing,
            source: data.source 
          } : null,
          stripeCustomerId: data.stripeCustomerId || null,
          userLimits: null // Will be filled by other API calls if needed
        };
        
        // Additional validation logging
        console.log(`🔔 SubscriptionContext: Transformed status: ${transformedData.status}`);
        console.log(`🔔 SubscriptionContext: Transformed plan: ${transformedData.plan}`);
        console.log(`🔔 SubscriptionContext: Data source: ${data.source}`);
        console.log(`🔔 SubscriptionContext: Has active subscription: ${transformedData.subscription ? 'yes' : 'no'}`);
        
        setSubscriptionData(transformedData);
        setLastRefresh(new Date());
        console.log(`🔔 SubscriptionContext: Subscription data updated successfully (${refreshId})`);
      } else {
        const errorText = await response.text();
        
        // Enhanced JWT error handling
        if (response.status === 401) {
          console.warn(`🔔 SubscriptionContext: 401 Unauthorized - JWT token issue (${refreshId})`);
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message === 'Invalid JWT') {
              console.warn(`🔔 SubscriptionContext: Invalid JWT detected, attempting token refresh (${refreshId})`);
              
              // If we haven't already tried refreshing the token, try it now
              if (!tokenRefreshed) {
                console.log(`🔔 SubscriptionContext: Attempting emergency token refresh (${refreshId})`);
                
                try {
                  const refreshResult = await supabase.auth.refreshSession();
                  
                  if (refreshResult.data.session?.access_token) {
                    console.log(`🔔 SubscriptionContext: Emergency token refresh successful, retrying request (${refreshId})`);
                    
                    // Retry the request with new token
                    const retryResponse = await fetch(finalUrl, {
                      headers: {
                        'Authorization': `Bearer ${refreshResult.data.session.access_token}`,
                        'x-user-id': user.id,
                      }
                    });
                    
                    if (retryResponse.ok) {
                      const retryData = await retryResponse.json();
                      console.log(`🔔 SubscriptionContext: Retry successful with refreshed token (${refreshId})`);
                      
                      // Process the successful response (copy the success logic)
                      let statusValue: 'free' | 'trial' | 'subscribed' = 'free';
                      if (retryData.isActive && retryData.plan !== 'free') {
                        statusValue = 'subscribed';
                      }
                      
                      const transformedData = {
                        status: statusValue,
                        plan: retryData.plan || 'free',
                        trial: null,
                        subscription: retryData.isActive ? { 
                          plan: retryData.plan, 
                          billing: retryData.billing,
                          source: retryData.source 
                        } : null,
                        stripeCustomerId: retryData.stripeCustomerId || null,
                        userLimits: null
                      };
                      
                      setSubscriptionData(transformedData);
                      setLastRefresh(new Date());
                      console.log(`🔔 SubscriptionContext: Token refresh retry successful (${refreshId})`);
                      return; // Exit successfully
                    }
                  }
                } catch (refreshError: any) {
                  console.warn(`🔔 SubscriptionContext: Token refresh failed (${refreshId}):`, refreshError.message);
                }
              }
            }
          } catch (parseError) {
            console.warn(`🔔 SubscriptionContext: Could not parse error response (${refreshId}):`, errorText);
          }
        }
        
        console.error(`🔔 SubscriptionContext: Failed to load subscription data (${refreshId}):`, errorText);
        
        // Set free plan as fallback
        const fallbackData = {
          status: 'free' as const,
          plan: 'free',
          trial: null,
          subscription: null,
          stripeCustomerId: null
        };
        
        setSubscriptionData(fallbackData);
        setLastRefresh(new Date());
        console.log(`🔔 SubscriptionContext: Set fallback data (${refreshId}):`, fallbackData);
      }
    } catch (error) {
      // Don't log errors if we're signing out - they're expected
      if (!isSigningOut) {
        console.error(`🔔 SubscriptionContext: Error loading subscription data (${refreshId}):`, error);
      } else {
        console.log(`🔔 SubscriptionContext: Suppressing error during sign out (${refreshId}):`, error.message);
      }
      
      // Set free plan as fallback
      const fallbackData = {
        status: 'free' as const,
        plan: 'free',
        trial: null,
        subscription: null,
        stripeCustomerId: null
      };
      
      setSubscriptionData(fallbackData);
      setLastRefresh(new Date());
      if (!isSigningOut) {
        console.log(`🔔 SubscriptionContext: Set fallback data after error (${refreshId}):`, fallbackData);
      }
    } finally {
      setIsLoading(false);
      console.log(`🔔 SubscriptionContext: Refresh completed (${refreshId})`);
    }
  };

  // Add forced refresh method that bypasses caching and concurrent checks
  const forceRefreshSubscription = async () => {
    console.log('🔔 SubscriptionContext: FORCE REFRESH TRIGGERED');
    await refreshSubscription(true);
  };

  // Seat data refresh function
  const refreshSeatData = async () => {
    if (!user?.id) {
      console.log('🪑 SubscriptionContext: No user ID, clearing seat data');
      updateSeatData(null);
      return;
    }

    // Don't make API calls if we're signing out
    if (isSigningOut) {
      console.log('🪑 SubscriptionContext: Skipping seat refresh because user is signing out');
      return;
    }

    console.log('🪑 SubscriptionContext: Starting seat data refresh for user:', user.id);

    try {
      // Get fresh access token
      let finalAccessToken: string | undefined = accessToken || undefined;
      
      if (!finalAccessToken) {
        const sessionResult = await supabase.auth.getSession();
        finalAccessToken = sessionResult.data.session?.access_token;
      }

      if (!finalAccessToken) {
        console.warn('🪑 SubscriptionContext: No access token available for seat data');
        return;
      }

      const response = await fetch(
        `${serverUrl}/seat-data/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${finalAccessToken}`,
            'x-user-id': user.id,
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('🪑 SubscriptionContext: Seat data received:', result);
        
        if (result.success && result.seatData) {
          updateSeatData(result.seatData);
          console.log('🪑 SubscriptionContext: Seat data updated successfully');
          
          // Emit event for components that need to know about seat updates
          const seatUpdateEvent = new CustomEvent('seat-data-updated', {
            detail: { seatData: result.seatData }
          });
          window.dispatchEvent(seatUpdateEvent);
        } else {
          console.log('🪑 SubscriptionContext: No seat data or unsuccessful response');
          updateSeatData(null);
        }
      } else {
        const errorText = await response.text();
        console.warn('🪑 SubscriptionContext: Seat data refresh failed:', response.status, errorText);
        
        // Don't clear seat data on error, just log it
        if (response.status !== 404) {
          console.warn('🪑 SubscriptionContext: Non-404 error, keeping existing seat data');
        }
      }

    } catch (error: any) {
      console.error('🪑 SubscriptionContext: Error refreshing seat data:', error);
    }
  };

  // Load seat data from localStorage when user changes
  useEffect(() => {
    if (user?.id && !isSigningOut) {
      try {
        const stored = localStorage.getItem(`seatData_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🪑 SubscriptionContext: Loaded seat data from localStorage for user:', user.id, parsed);
          setSeatData(parsed);
        } else {
          console.log('🪑 SubscriptionContext: No stored seat data found for user:', user.id);
        }
      } catch (error) {
        console.warn('🪑 SubscriptionContext: Failed to load seat data from localStorage:', error);
      }
    } else if (!user?.id || isSigningOut) {
      setSeatData(null);
      // Clear all stored seat data when signing out
      if (typeof window !== 'undefined') {
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('seatData_')) {
              localStorage.removeItem(key);
            }
          });
          console.log('🪑 SubscriptionContext: Cleared all stored seat data');
        } catch (error) {
          console.warn('🪑 SubscriptionContext: Failed to clear stored seat data:', error);
        }
      }
    }
  }, [user?.id, isSigningOut]);

  // Load subscription data when user changes - with authentication readiness check
  useEffect(() => {
    console.log('🔔 SubscriptionContext: User effect triggered, user ID:', user?.id, 'isSigningOut:', isSigningOut, 'authReady:', authReady, 'hasToken:', !!accessToken);
    
    if (user?.id && !isSigningOut && authReady) {
      // Add a small delay to ensure authentication is fully established, but shorter if we already have a token
      const delay = accessToken ? 200 : 500;
      const timeoutId = setTimeout(() => {
        console.log('🔔 SubscriptionContext: Starting delayed subscription refresh (auth ready, token available:', !!accessToken, ')');
        refreshSubscription();
        // Also refresh seat data
        setTimeout(() => {
          refreshSeatData();
        }, 500); // Slight delay after subscription refresh
      }, delay);
      
      return () => {
        clearTimeout(timeoutId);
      };
    } else if (!user?.id || isSigningOut) {
      setSubscriptionData(null);
      updateSeatData(null);
      setLastRefresh(null);
      setRefreshCount(0);
    } else if (!authReady) {
      console.log('🔔 SubscriptionContext: Waiting for auth to be ready...');
    }
  }, [user?.id, isSigningOut, authReady, accessToken]);

  // Automatic token validation and refresh before expiration
  useEffect(() => {
    if (!user?.id || isSigningOut || !accessToken) return;

    const validateAndRefreshToken = async () => {
      try {
        // Parse JWT to check expiration
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = payload.exp - currentTime;
          
          // If token expires in less than 5 minutes, refresh it
          if (timeUntilExpiry < 300) {
            console.log('🔔 SubscriptionContext: Token expires soon, triggering refresh');
            
            try {
              const refreshResult = await supabase.auth.refreshSession();
              if (refreshResult.data.session?.access_token) {
                console.log('🔔 SubscriptionContext: Token refreshed proactively');
                // The token refresh event will trigger subscription refresh
              }
            } catch (refreshError: any) {
              console.warn('🔔 SubscriptionContext: Proactive token refresh failed:', refreshError.message);
            }
          }
        }
      } catch (error: any) {
        console.warn('🔔 SubscriptionContext: Token validation error:', error.message);
      }
    };

    // Check token validity every 2 minutes
    const interval = setInterval(validateAndRefreshToken, 2 * 60 * 1000);
    
    // Also check immediately
    validateAndRefreshToken();

    return () => clearInterval(interval);
  }, [user?.id, isSigningOut, accessToken]);

  // Listen for token refresh events and update immediately
  useEffect(() => {
    const handleTokenRefresh = (event: any) => {
      const { newToken, user: refreshedUser, timestamp } = event.detail;
      console.log('🔔 SubscriptionContext: Auth token refreshed event received:', { 
        hasNewToken: !!newToken, 
        userEmail: refreshedUser?.email,
        timestamp: new Date(timestamp).toISOString()
      });
      
      // If this is for our current user, trigger a subscription refresh with the new token
      if (refreshedUser?.id === user?.id && newToken) {
        console.log('🔔 SubscriptionContext: Token refresh for current user, triggering subscription refresh');
        
        // Update the access token being used
        // Note: The App component should handle setAccessToken, but we can trigger a refresh
        setTimeout(() => {
          forceRefreshSubscription();
        }, 100); // Small delay to ensure token is updated in context
      }
    };

    window.addEventListener('auth-token-refreshed', handleTokenRefresh);
    
    return () => {
      window.removeEventListener('auth-token-refreshed', handleTokenRefresh);
    };
  }, [user?.id]);

  // Listen for subscription override events and payment success events
  useEffect(() => {
    if (!user?.id || isSigningOut) return;

    const handleOverrideApplied = (event: any) => {
      console.log('🔔 SubscriptionContext: Override applied event received:', event.detail);
      forceRefreshSubscription();
    };

    const handleOverrideCleared = () => {
      console.log('🔔 SubscriptionContext: Override cleared event received');
      forceRefreshSubscription();
    };

    const handleForceRefresh = () => {
      console.log('🔔 SubscriptionContext: Force refresh event received');
      forceRefreshSubscription();
    };

    const handlePaymentSuccess = (event: any) => {
      console.log('🔔 SubscriptionContext: Payment success event received:', event.detail);
      console.log('🔔 SubscriptionContext: SINGLE refresh only - refresh loops disabled');
      
      // Only do ONE immediate refresh to prevent infinite loops
      forceRefreshSubscription();
      
      // DISABLED: Multiple delayed refreshes that cause refresh loops
      console.log('🔔 SubscriptionContext: Payment success handling complete - no automatic refresh loops');
    };

    const handleSubscriptionChange = (event: any) => {
      console.log('🔔 SubscriptionContext: Subscription change event received:', event.detail);
      console.log('🔔 SubscriptionContext: Refreshing subscription data after detected change...');
      forceRefreshSubscription();
    };

    // Listen for various subscription-related events
    window.addEventListener('subscription-override-applied', handleOverrideApplied);
    window.addEventListener('subscription-override-cleared', handleOverrideCleared);
    window.addEventListener('force-subscription-refresh', handleForceRefresh);
    window.addEventListener('stripe-payment-success', handlePaymentSuccess);
    window.addEventListener('subscription-updated', handleSubscriptionChange);
    window.addEventListener('stripe-checkout-success', handlePaymentSuccess); // Alternative event name

    return () => {
      window.removeEventListener('subscription-override-applied', handleOverrideApplied);
      window.removeEventListener('subscription-override-cleared', handleOverrideCleared);
      window.removeEventListener('force-subscription-refresh', handleForceRefresh);
      window.removeEventListener('stripe-payment-success', handlePaymentSuccess);
      window.removeEventListener('subscription-updated', handleSubscriptionChange);
      window.removeEventListener('stripe-checkout-success', handlePaymentSuccess);
    };
  }, [user?.id, isSigningOut]);

  // Computed values with additional logging
  const isProUser = subscriptionData ? 
    (subscriptionData.status === 'trial' || subscriptionData.status === 'subscribed') : false;

  const planDisplayName = subscriptionData ? 
    getPlanDisplayName(subscriptionData.plan, subscriptionData.status) : 'Free';

  const canAccessOperations = subscriptionData ? 
    (subscriptionData.status === 'trial' || 
     subscriptionData.status === 'subscribed' ||
     subscriptionData.plan === 'creator' ||
     subscriptionData.plan === 'builder' ||
     subscriptionData.plan === 'studio') : false;

  const isCreatorOrHigher = subscriptionData ? 
    (subscriptionData.plan === 'creator' ||
     subscriptionData.plan === 'builder' ||
     subscriptionData.plan === 'studio' ||
     subscriptionData.status === 'trial' ||
     subscriptionData.status === 'subscribed') : false;

  // Listen for seat sync events
  useEffect(() => {
    if (!user?.id || isSigningOut) return;

    const handleSeatSync = (event: any) => {
      console.log('🪑 SubscriptionContext: Seat sync event received:', event.detail);
      refreshSeatData();
    };

    const handleManualSeatSync = (event: any) => {
      console.log('🪑 SubscriptionContext: Manual seat sync event received:', event.detail);
      if (event.detail?.seatData) {
        updateSeatData(event.detail.seatData);
      } else {
        refreshSeatData();
      }
    };

    window.addEventListener('seat-sync-completed', handleSeatSync);
    window.addEventListener('manual-seat-sync', handleManualSeatSync);
    
    return () => {
      window.removeEventListener('seat-sync-completed', handleSeatSync);
      window.removeEventListener('manual-seat-sync', handleManualSeatSync);
    };
  }, [user?.id, isSigningOut]);

  // Log computed values for debugging
  useEffect(() => {
    console.log('🔔 SubscriptionContext: Computed values updated:', {
      isProUser,
      planDisplayName,
      canAccessOperations,
      isCreatorOrHigher,
      subscriptionData,
      seatData,
      lastRefresh: lastRefresh?.toISOString(),
      refreshCount
    });
  }, [subscriptionData, seatData, isProUser, planDisplayName, canAccessOperations, isCreatorOrHigher, lastRefresh, refreshCount]);

  const getRemainingTime = (): string | null => {
    if (subscriptionData?.status === 'trial' && subscriptionData?.trial?.ends_at) {
      const now = new Date().getTime();
      const endTime = new Date(subscriptionData.trial.ends_at).getTime();
      const timeDiff = endTime - now;

      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          return `${days} day${days > 1 ? 's' : ''} left`;
        } else if (hours > 0) {
          return `${hours}h ${minutes}m left`;
        } else {
          return `${minutes}m left`;
        }
      } else {
        return 'Trial expired';
      }
    }
    return null;
  };

  const value: SubscriptionContextType = {
    subscriptionData,
    seatData,
    isLoading,
    refreshSubscription: () => refreshSubscription(false),
    refreshSeatData,
    forceRefreshSubscription,
    isProUser,
    planDisplayName,
    canAccessOperations,
    isCreatorOrHigher,
    getRemainingTime,
    lastRefresh,
    refreshCount
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Helper function to get display name for plans
function getPlanDisplayName(plan: string, status: string): string {
  if (status === 'trial') {
    return 'Free Trial';
  }
  
  switch (plan) {
    case 'creator':
      return 'Creator';
    case 'builder':
      return 'Builder';
    case 'studio':
      return 'Studio';
    case 'free':
    default:
      return 'Starter (Free)';
  }
}