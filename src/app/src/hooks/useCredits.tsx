/**
 * useCredits Hook
 * Manages AI credit balance and deduction across the app
 * Optimized with caching to prevent slow navigation loads
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export interface CreditInfo {
  credits: number;
  plan: 'free' | 'creator' | 'builder';
  maxCredits: number;
  isLoading: boolean;
}

const PLAN_CREDITS = {
  free: 500,
  creator: 5000,
  builder: 20000,
  studio: 150000
};

// Global cache to prevent multiple simultaneous fetches
let globalCreditCache: CreditInfo | null = null;
let lastFetchTime: number = 0;
let ongoingFetch: Promise<void> | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export function useCredits() {
  // Initialize with cached data if available
  const [creditInfo, setCreditInfo] = useState<CreditInfo>(() => {
    if (globalCreditCache) {
      return globalCreditCache;
    }
    return {
      credits: 0,
      plan: 'free',
      maxCredits: 50,
      isLoading: true
    };
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch credit balance with caching
  const fetchCredits = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Use cache if it's fresh and we're not forcing a refresh
    if (!forceRefresh && globalCreditCache && (now - lastFetchTime) < CACHE_DURATION) {
      if (isMounted.current) {
        setCreditInfo(globalCreditCache);
      }
      return;
    }

    // If there's already an ongoing fetch, wait for it
    if (ongoingFetch) {
      await ongoingFetch;
      if (isMounted.current && globalCreditCache) {
        setCreditInfo(globalCreditCache);
      }
      return;
    }

    // Start a new fetch
    ongoingFetch = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          const defaultInfo = { credits: 0, plan: 'free' as const, maxCredits: 50, isLoading: false };
          globalCreditCache = defaultInfo;
          lastFetchTime = now;
          if (isMounted.current) {
            setCreditInfo(defaultInfo);
          }
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/balance`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const newInfo = {
            credits: data.credits || 0,
            plan: data.plan || 'free',
            maxCredits: PLAN_CREDITS[data.plan as keyof typeof PLAN_CREDITS] || 50,
            isLoading: false
          };
          globalCreditCache = newInfo;
          lastFetchTime = now;
          if (isMounted.current) {
            setCreditInfo(newInfo);
          }
        } else {
          const defaultInfo = { credits: 0, plan: 'free' as const, maxCredits: 50, isLoading: false };
          globalCreditCache = defaultInfo;
          lastFetchTime = now;
          if (isMounted.current) {
            setCreditInfo(defaultInfo);
          }
        }
      } catch (error) {
        // Silently fail - credits are optional
        const defaultInfo = { credits: 0, plan: 'free' as const, maxCredits: 50, isLoading: false };
        globalCreditCache = defaultInfo;
        lastFetchTime = now;
        if (isMounted.current) {
          setCreditInfo(defaultInfo);
        }
      } finally {
        ongoingFetch = null;
      }
    })();

    await ongoingFetch;
  }, []);

  // Deduct credits for AI action
  const deductCredits = useCallback(async (
    amount: number = 1,
    action: string = 'AI Action'
  ): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to use AI features');
        return false;
      }

      // Check if user has enough credits
      if (creditInfo.credits < amount) {
        toast.error(
          `Insufficient credits. You need ${amount} credit${amount > 1 ? 's' : ''} but only have ${creditInfo.credits}.`,
          {
            duration: 5000,
            action: {
              label: 'Upgrade',
              onClick: () => {
                window.location.href = '/settings?tab=plan';
              }
            }
          }
        );
        return false;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/credits/deduct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            amount,
            action 
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Update local and global state
        const newInfo = {
          ...creditInfo,
          credits: data.remainingCredits
        };
        globalCreditCache = newInfo;
        lastFetchTime = Date.now();
        if (isMounted.current) {
          setCreditInfo(newInfo);
        }

        // Show toast for low credits
        if (data.remainingCredits <= 10 && data.remainingCredits > 0) {
          toast.warning(`Low credits: ${data.remainingCredits} remaining`, {
            action: {
              label: 'Upgrade',
              onClick: () => {
                window.location.href = '/settings?tab=plan';
              }
            }
          });
        }

        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to deduct credits' }));
        toast.error(errorData.error || 'Failed to deduct credits');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error deducting credits:', error);
      toast.error('Error processing credits');
      return false;
    }
  }, [creditInfo]);

  // Check if user has enough credits before action
  const checkCredits = useCallback((
    amount: number = 1,
    showToast: boolean = true
  ): boolean => {
    if (creditInfo.credits < amount) {
      if (showToast) {
        toast.error(
          `Insufficient credits. You need ${amount} credit${amount > 1 ? 's' : ''} but only have ${creditInfo.credits}.`,
          {
            duration: 5000,
            action: {
              label: 'Upgrade',
              onClick: () => {
                window.location.href = '/settings?tab=plan';
              }
            }
          }
        );
      }
      return false;
    }
    return true;
  }, [creditInfo.credits]);

  // Refresh credits (force refresh)
  const refreshCredits = useCallback(() => {
    fetchCredits(true);
  }, [fetchCredits]);

  useEffect(() => {
    fetchCredits(false); // Use cache if available
  }, [fetchCredits]);

  return {
    ...creditInfo,
    deductCredits,
    checkCredits,
    refreshCredits
  };
}