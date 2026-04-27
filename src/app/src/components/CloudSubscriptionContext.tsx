import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

interface CloudSubscription {
  id: string;
  userId: string;
  status: string;
  plan?: string;
  customer?: string;
  current_period_start?: number;
  current_period_end?: number;
  items?: any[];
  metadata?: Record<string, any>;
  savedAt: string;
  lastUpdated: string;
  syncedAt?: string;
  type?: 'main' | 'seat' | 'addon';
  seatCount?: number;
  pricePerSeat?: number;
  totalMonthlyCost?: number;
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

interface CloudSubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  seatData: SeatData | null;
  allSubscriptions: CloudSubscription[];
  isLoading: boolean;
  refreshSubscriptions: () => Promise<void>;
  saveSubscription: (subscription: Partial<CloudSubscription>) => Promise<void>;
  removeSubscription: (subscriptionId: string) => Promise<void>;
  isProUser: boolean;
  planDisplayName: string;
  canAccessOperations: boolean;
  isCreatorOrHigher: boolean;
  getRemainingTime: () => string | null;
  lastRefresh: Date | null;
  refreshCount: number;
  hasActiveSeats: boolean;
  totalSeats: number;
  totalMonthlyCost: number;
  hasError: boolean;
}

const CloudSubscriptionContext = createContext<CloudSubscriptionContextType | undefined>(undefined);

interface CloudSubscriptionProviderProps {
  children: React.ReactNode;
  user: any;
  isSigningOut?: boolean;
  authReady: boolean;
  accessToken: string | null;
}

export const CloudSubscriptionProvider: React.FC<CloudSubscriptionProviderProps> = ({
  children,
  user,
  isSigningOut = false,
  authReady,
  accessToken
}) => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [seatData, setSeatData] = useState<SeatData | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<CloudSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Enhanced utility function for API calls with token refresh
  const makeAuthorizedRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!user?.id) {
      console.log('🌤️ CLOUD SUB: No user available for request');
      throw new Error('No authenticated user available');
    }

    // Try to get fresh token if we don't have one
    let currentToken = accessToken;
    if (!currentToken) {
      console.log('🌤️ CLOUD SUB: No access token, attempting to get fresh session...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          currentToken = session.access_token;
          console.log('🌤️ CLOUD SUB: Retrieved fresh access token from session');
        } else {
          console.log('🌤️ CLOUD SUB: No valid session available, falling back to localStorage');
          // Fall back to localStorage immediately if no token
          return null;
        }
      } catch (sessionError) {
        console.error('🌤️ CLOUD SUB: Failed to get fresh session:', sessionError);
        // Fall back to localStorage on session error
        return null;
      }
    }

    console.log(`🌤️ CLOUD SUB: Making request to ${endpoint}`);

    const makeRequest = async (token: string) => {
      return fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/subscriptions/${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
    };

    let response = await makeRequest(currentToken);

    // Handle 401 errors by attempting token refresh
    if (response.status === 401) {
      console.log('🌤️ CLOUD SUB: Got 401, attempting token refresh...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token && session.access_token !== currentToken) {
          console.log('🌤️ CLOUD SUB: Got refreshed token, retrying request...');
          // Retry with fresh token
          response = await makeRequest(session.access_token);
        } else {
          // No fresh token available, read error and fall back
          const errorText = await response.text();
          console.log(`🌤️ CLOUD SUB: 401 error and no fresh token available, falling back to localStorage:`, errorText);
          return null; // Signal to use localStorage fallback
        }
      } catch (refreshError) {
        console.error('🌤️ CLOUD SUB: Token refresh failed:', refreshError);
        // Read error text only if we haven't read it already
        try {
          const errorText = await response.text();
          console.log(`🌤️ CLOUD SUB: Authentication error, falling back to localStorage:`, errorText);
        } catch (readError) {
          console.log('🌤️ CLOUD SUB: Could not read error text, falling back to localStorage');
        }
        return null; // Signal to use localStorage fallback
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🌤️ CLOUD SUB: Request failed (${response.status}):`, errorText);
      throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }, [user?.id, accessToken, projectId]);

  // Load all subscriptions from cloud database
  const loadSubscriptionsFromCloud = useCallback(async () => {
    if (!user?.id || isSigningOut) {
      console.log('🌤️ CLOUD SUB: Skipping cloud load - no user or signing out');
      return;
    }

    try {
      console.log(`🌤️ CLOUD SUB: Loading subscriptions from cloud for user ${user.id}`);
      const result = await makeAuthorizedRequest('user-subscriptions');
      
      // If result is null, it means authentication failed and we should use localStorage
      if (result === null) {
        console.log('🌤️ CLOUD SUB: Authentication failed, using localStorage fallback');
        return await loadFromLocalStorage();
      }
      
      if (result && result.success) {
        const cloudSubscriptions = result.subscriptions || [];
        console.log(`🌤️ CLOUD SUB: Loaded ${cloudSubscriptions.length} subscriptions from cloud`);
        console.log('🌤️ CLOUD SUB: Raw subscription data:', JSON.stringify(cloudSubscriptions, null, 2));
        
        setAllSubscriptions(cloudSubscriptions);
        
        // Convert cloud subscriptions to legacy format for compatibility
        const legacyData = convertToLegacyFormat(cloudSubscriptions);
        console.log('🌤️ CLOUD SUB: Converted legacy data:', legacyData);
        
        // Always set subscription data, even if null (to clear old data)
        if (legacyData.subscription) {
          console.log('🌤️ CLOUD SUB: Setting subscription data:', legacyData.subscription);
          setSubscriptionData(legacyData.subscription);
        } else {
          // No subscription found, set to free plan
          console.log('🌤️ CLOUD SUB: No subscription found, setting to free plan');
          setSubscriptionData({
            status: 'free',
            plan: 'free',
            trial: null,
            subscription: null,
            stripeCustomerId: null
          });
        }
        
        // Set or clear seat data
        if (legacyData.seats) {
          setSeatData(legacyData.seats);
        } else {
          setSeatData(null);
        }
        
        // Also persist to localStorage as backup
        if (user.id) {
          localStorage.setItem(`cloudSubscriptions_${user.id}`, JSON.stringify(cloudSubscriptions));
          if (legacyData.subscription) {
            localStorage.setItem(`subscriptionData_${user.id}`, JSON.stringify(legacyData.subscription));
          } else {
            // Remove old cached subscription data if no subscription exists
            localStorage.removeItem(`subscriptionData_${user.id}`);
          }
          if (legacyData.seats) {
            localStorage.setItem(`seatData_${user.id}`, JSON.stringify(legacyData.seats));
          } else {
            localStorage.removeItem(`seatData_${user.id}`);
          }
        }
        
        return cloudSubscriptions;
      } else {
        console.warn('🌤️ CLOUD SUB: Failed to load subscriptions:', result?.error);
        return await loadFromLocalStorage();
      }
    } catch (error: any) {
      // PERFORMANCE FIX: This is a non-blocking error - we have localStorage fallback
      console.log('🌤️ CLOUD SUB: Cloud load failed, using localStorage fallback (non-critical):', error.message || error);
      return await loadFromLocalStorage();
    }

    // Helper function to load from localStorage
    async function loadFromLocalStorage() {
      if (user.id) {
        try {
          const storedCloudSubs = localStorage.getItem(`cloudSubscriptions_${user.id}`);
          const storedLegacySub = localStorage.getItem(`subscriptionData_${user.id}`);
          const storedSeatData = localStorage.getItem(`seatData_${user.id}`);
          
          if (storedCloudSubs) {
            const cloudSubs = JSON.parse(storedCloudSubs);
            console.log(`🌤️ CLOUD SUB: Loaded ${cloudSubs.length} subscriptions from localStorage fallback`);
            setAllSubscriptions(cloudSubs);
            return cloudSubs;
          }
          
          if (storedLegacySub) {
            setSubscriptionData(JSON.parse(storedLegacySub));
          }
          
          if (storedSeatData) {
            setSeatData(JSON.parse(storedSeatData));
          }
        } catch (parseError) {
          console.error('🌤️ CLOUD SUB: Error parsing localStorage fallback:', parseError);
        }
      }
      
      return [];
    }
  }, [user?.id, isSigningOut, makeAuthorizedRequest]);

  // Save subscription to cloud database
  const saveSubscription = useCallback(async (subscription: Partial<CloudSubscription>) => {
    if (!user?.id || isSigningOut) {
      console.log('🌤️ CLOUD SUB: Skipping save - no user or signing out');
      return;
    }

    try {
      console.log(`🌤️ CLOUD SUB: Saving subscription to cloud:`, subscription.id);
      
      const result = await makeAuthorizedRequest('save-subscription', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
      });

      // If result is null, authentication failed - skip cloud save
      if (result === null) {
        console.log('🌤️ CLOUD SUB: Authentication failed, skipping cloud save');
        return;
      }

      if (result && result.success) {
        console.log(`✅ CLOUD SUB: Subscription saved successfully:`, subscription.id);
        
        // Refresh subscriptions after saving
        await loadSubscriptionsFromCloud();
      } else {
        console.error('❌ CLOUD SUB: Failed to save subscription:', result?.error);
      }
    } catch (error: any) {
      console.error('❌ CLOUD SUB: Error saving subscription:', error);
    }
  }, [user?.id, isSigningOut, makeAuthorizedRequest, loadSubscriptionsFromCloud]);

  // Remove subscription from cloud database
  const removeSubscription = useCallback(async (subscriptionId: string) => {
    if (!user?.id || isSigningOut) {
      console.log('🌤️ CLOUD SUB: Skipping remove - no user or signing out');
      return;
    }

    try {
      console.log(`🌤️ CLOUD SUB: Removing subscription from cloud:`, subscriptionId);
      
      const result = await makeAuthorizedRequest(`remove-subscription/${subscriptionId}`, {
        method: 'DELETE',
      });

      // If result is null, authentication failed - skip cloud remove
      if (result === null) {
        console.log('🌤️ CLOUD SUB: Authentication failed, skipping cloud remove');
        return;
      }

      if (result && result.success) {
        console.log(`✅ CLOUD SUB: Subscription removed successfully:`, subscriptionId);
        
        // Refresh subscriptions after removal
        await loadSubscriptionsFromCloud();
      } else {
        console.error('❌ CLOUD SUB: Failed to remove subscription:', result?.error);
      }
    } catch (error: any) {
      console.error('❌ CLOUD SUB: Error removing subscription:', error);
    }
  }, [user?.id, isSigningOut, makeAuthorizedRequest, loadSubscriptionsFromCloud]);

  // Convert cloud subscriptions to legacy format for compatibility
  const convertToLegacyFormat = useCallback((cloudSubscriptions: CloudSubscription[]) => {
    // Include active, trialing, AND canceled subscriptions to handle free plan
    const relevantSubscriptions = cloudSubscriptions.filter(sub => 
      sub.status === 'active' || sub.status === 'trialing' || sub.status === 'canceled'
    );

    let legacySubscription: SubscriptionData | null = null;
    let legacySeats: SeatData | null = null;

    // Find main subscription (including canceled ones for free plan)
    const mainSub = relevantSubscriptions.find(sub => sub.type !== 'seat' && sub.type !== 'addon');
    if (mainSub) {
      legacySubscription = {
        status: mainSub.status === 'active' ? 'subscribed' : 
               mainSub.status === 'trialing' ? 'trial' : 'free',
        plan: mainSub.plan || 'free',
        trial: mainSub.status === 'trialing' ? mainSub : null,
        subscription: mainSub,
        stripeCustomerId: mainSub.customer || null,
      };
    }

    // Find seat subscriptions (only active/trialing)
    const seatSubs = relevantSubscriptions.filter(sub => 
      (sub.type === 'seat' || sub.seatCount) && 
      (sub.status === 'active' || sub.status === 'trialing')
    );
    if (seatSubs.length > 0) {
      const totalSeats = seatSubs.reduce((sum, sub) => sum + (sub.seatCount || 0), 0);
      const totalCost = seatSubs.reduce((sum, sub) => sum + (sub.totalMonthlyCost || 0), 0);
      const latestSeat = seatSubs.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )[0];

      legacySeats = {
        seatCount: totalSeats,
        subscriptionId: latestSeat.id,
        stripeCustomerId: latestSeat.customer || null,
        priceId: latestSeat.items?.[0]?.price?.id || null,
        status: latestSeat.status,
        currentPeriodStart: latestSeat.current_period_start ? 
          new Date(latestSeat.current_period_start * 1000).toISOString() : null,
        currentPeriodEnd: latestSeat.current_period_end ? 
          new Date(latestSeat.current_period_end * 1000).toISOString() : null,
        seatPricePerMonth: latestSeat.pricePerSeat || 12,
        totalMonthlyCost: totalCost,
        lastSynced: latestSeat.lastUpdated,
      };
    }

    return {
      subscription: legacySubscription,
      seats: legacySeats,
    };
  }, []);

  // Refresh all subscription data with timeout protection - NON-BLOCKING
  const refreshSubscriptions = useCallback(async () => {
    if (!user?.id || isSigningOut) {
      console.log('🌤️ CLOUD SUB: Skipping refresh - no user or signing out');
      setIsLoading(false);
      return;
    }

    // DON'T SET LOADING TRUE - this blocks the UI and causes layout shifts!
    // Only update the refresh metadata
    setRefreshCount(prev => prev + 1);
    setLastRefresh(new Date());

    try {
      console.log(`🌤️ CLOUD SUB: Refreshing subscription data in background for user ${user.id}`);
      await loadSubscriptionsFromCloud();
      console.log(`🌤️ CLOUD SUB: Background refresh completed successfully`);
    } catch (error: any) {
      console.error('🌤️ CLOUD SUB: Error during refresh:', error);
      // Set fallback data on error only if we have no data
      if (!subscriptionData) {
        setSubscriptionData({
          status: 'free',
          plan: 'free',
          trial: null,
          subscription: null,
          stripeCustomerId: null
        });
      }
      setHasError(true);
    } finally {
      // Ensure loading is always false
      setIsLoading(false);
    }
  }, [user?.id, isSigningOut, loadSubscriptionsFromCloud, subscriptionData]);

  // Clear data on sign out
  useEffect(() => {
    if (isSigningOut || !user?.id) {
      console.log('🌤️ CLOUD SUB: Clearing subscription data due to sign out or no user');
      setSubscriptionData(null);
      setSeatData(null);
      setAllSubscriptions([]);
      setIsLoading(false);
      setLastRefresh(null);
      setRefreshCount(0);
      setHasError(false);
    }
  }, [isSigningOut, user?.id]);

  // PERFORMANCE FIX: Track if we've loaded for this user to prevent duplicate loads
  const loadedForUserRef = React.useRef<string | null>(null);
  
  // Load data when auth is ready and user is available - with timeout protection and caching
  useEffect(() => {
    if (authReady && user?.id && !isSigningOut) {
      // CRITICAL FIX: Check if we already loaded for this user to prevent re-renders
      if (loadedForUserRef.current === user.id) {
        console.log(`🌤️ CLOUD SUB: Already loaded for user ${user.id}, skipping to prevent re-render`);
        setIsLoading(false);
        return;
      }
      
      // Check if we already have data for this user - if so, skip the API call
      // Only refresh if we have no data at all
      if (subscriptionData !== null && allSubscriptions.length > 0) {
        console.log(`🌤️ CLOUD SUB: Already have subscription data cached, skipping refresh`);
        loadedForUserRef.current = user.id;
        setIsLoading(false);
        return;
      }
      
      console.log(`🌤️ CLOUD SUB: Auth ready, loading subscriptions for ${user.id}`);
      
      // Mark as loaded for this user
      loadedForUserRef.current = user.id;
      
      // Set loading to false immediately to prevent blocking UI
      // We'll load in background and update when ready
      setIsLoading(false);
      
      // Load in background without blocking
      const loadInBackground = async () => {
        try {
          await refreshSubscriptions();
        } catch (error) {
          console.error('🌤️ CLOUD SUB: Background load failed:', error);
        }
      };
      
      loadInBackground();
    }
  }, [authReady, user?.id, isSigningOut]); // subscriptionData not in deps to avoid loops

  // Listen for external subscription sync events
  useEffect(() => {
    const handleSubscriptionSync = async (event: CustomEvent) => {
      console.log('🌤️ CLOUD SUB: Subscription sync event received:', event.detail);
      if (event.detail?.userId === user?.id) {
        await refreshSubscriptions();
      }
    };

    const handleManualSync = async () => {
      console.log('🌤️ CLOUD SUB: Manual sync triggered');
      await refreshSubscriptions();
    };

    window.addEventListener('subscription-synced', handleSubscriptionSync as EventListener);
    window.addEventListener('manual-subscription-sync', handleManualSync);

    return () => {
      window.removeEventListener('subscription-synced', handleSubscriptionSync as EventListener);
      window.removeEventListener('manual-subscription-sync', handleManualSync);
    };
  }, [user?.id]); // Keep minimal deps to avoid infinite re-renders - handlers use latest refreshSubscriptions via closure

  // Computed values
  const isProUser = useMemo(() => {
    return subscriptionData?.status === 'subscribed' || subscriptionData?.status === 'trial';
  }, [subscriptionData?.status]);

  const planDisplayName = useMemo(() => {
    if (!subscriptionData) return 'Free';
    if (subscriptionData.status === 'trial') return 'Trial';
    if (subscriptionData.plan === 'creator') return 'Launch'; // Map creator to Launch
    if (subscriptionData.plan === 'builder') return 'Grow'; // Map builder to Grow
    if (subscriptionData.plan === 'studio') return 'Scale'; // Map studio to Scale
    return 'Free';
  }, [subscriptionData]);

  const canAccessOperations = useMemo(() => {
    return isProUser;
  }, [isProUser]);

  const isCreatorOrHigher = useMemo(() => {
    return isProUser && subscriptionData?.plan !== 'free';
  }, [isProUser, subscriptionData?.plan]);

  const hasActiveSeats = useMemo(() => {
    return allSubscriptions.some(sub => 
      (sub.type === 'seat' || sub.seatCount) && 
      (sub.status === 'active' || sub.status === 'trialing')
    );
  }, [allSubscriptions]);

  const totalSeats = useMemo(() => {
    return allSubscriptions
      .filter(sub => (sub.type === 'seat' || sub.seatCount) && sub.status === 'active')
      .reduce((sum, sub) => sum + (sub.seatCount || 0), 0);
  }, [allSubscriptions]);

  const totalMonthlyCost = useMemo(() => {
    return allSubscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + (sub.totalMonthlyCost || 0), 0);
  }, [allSubscriptions]);

  const getRemainingTime = useCallback(() => {
    if (!subscriptionData?.subscription) return null;
    
    const currentPeriodEnd = subscriptionData.subscription.current_period_end;
    if (!currentPeriodEnd) return null;
    
    const endDate = new Date(currentPeriodEnd * 1000);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days > 1) return `${days} days remaining`;
    if (days === 1) return '1 day remaining';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return `${hours} hours remaining`;
  }, [subscriptionData?.subscription]);

  const contextValue: CloudSubscriptionContextType = {
    subscriptionData,
    seatData,
    allSubscriptions,
    isLoading,
    refreshSubscriptions,
    saveSubscription,
    removeSubscription,
    isProUser,
    planDisplayName,
    canAccessOperations,
    isCreatorOrHigher,
    getRemainingTime,
    lastRefresh,
    refreshCount,
    hasActiveSeats,
    totalSeats,
    totalMonthlyCost,
    hasError,
  };

  return (
    <CloudSubscriptionContext.Provider value={contextValue}>
      {children}
    </CloudSubscriptionContext.Provider>
  );
};

export const useCloudSubscription = () => {
  const context = useContext(CloudSubscriptionContext);
  if (context === undefined) {
    throw new Error('useCloudSubscription must be used within a CloudSubscriptionProvider');
  }
  return context;
};