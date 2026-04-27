import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { AlertTriangle, Lock, TrendingUp, Calendar, Zap, ExternalLink } from 'lucide-react';
import { useCloudSubscription } from '../CloudSubscriptionContext';
import { useBusiness } from '../BusinessContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';
import { useIsMobile } from '../ui/use-mobile';
import { toast } from 'sonner@2.0.3';

// Define operation limits per subscription plan
// NOTE: Operations pages are ONLY paywalled for free users
export const OPERATION_LIMITS = {
  free: {
    products: 1,
    campaigns: 1,
    deals: 1,
    leads: 10,
    transactions: 5,
    budgets: 1,
    aiMessages: 10,
    bankBalance: true
  },
  creator: {
    products: 999999,
    campaigns: 999999,
    deals: 999999,
    leads: 999999,
    transactions: 999999,
    budgets: 999999,
    aiMessages: 500,
    bankBalance: true
  },
  builder: {
    products: 999999,
    campaigns: 999999,
    deals: 999999,
    leads: 999999,
    transactions: 999999,
    budgets: 999999,
    aiMessages: 2000,
    bankBalance: true
  },
  studio: {
    products: 999999,
    campaigns: 999999,
    deals: 999999,
    leads: 999999,
    transactions: 999999,
    budgets: 999999,
    aiMessages: 999999,
    bankBalance: true
  }
};

export interface OperationUsage {
  products: number;
  campaigns: number;
  deals: number;
  leads: number;
  transactions: number;
  budgets: number;
  aiMessages: number;
  monthYear: string; // Format: "2024-01"
  businessId: string;
}

interface OperationsPaywallProps {
  operationType: keyof Omit<OperationUsage, 'monthYear' | 'businessId'>;
  onUpgrade?: () => void;
  children?: React.ReactNode;
}

export const OperationsPaywall: React.FC<OperationsPaywallProps> = ({
  operationType,
  onUpgrade,
  children
}) => {
  const { subscription, subscriptionStatus } = useCloudSubscription();
  const { selectedBusiness } = useBusiness();
  const isMobile = useIsMobile();
  const [usage, setUsage] = useState<OperationUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  // Get current month key
  const currentMonthKey = new Date().toISOString().slice(0, 7); // "2024-01"

  // Get subscription tier
  const getSubscriptionTier = () => {
    if (!subscription || subscriptionStatus !== 'active') return 'free';
    
    // Normalize the plan name to lowercase - check both planName and plan properties
    const planName = (subscription.planName || subscription.plan || '').toLowerCase().trim();
    
    // Map known plan names to tier keys
    const validTiers = ['free', 'creator', 'builder', 'studio'];
    
    // Return the plan if it's valid, otherwise default to free
    return validTiers.includes(planName) ? planName : 'free';
  };

  const tier = getSubscriptionTier();
  const limits = OPERATION_LIMITS[tier as keyof typeof OPERATION_LIMITS];
  const currentLimit = limits[operationType];

  // Load usage data - client-side with server fallback
  useEffect(() => {
    const loadUsage = async () => {
      if (!selectedBusiness?.id) {
        setLoading(false);
        return;
      }

      const defaultUsage = {
        products: 0,
        campaigns: 0,
        deals: 0,
        leads: 0,
        transactions: 0,
        budgets: 0,
        aiMessages: 0,
        monthYear: currentMonthKey,
        businessId: selectedBusiness.id
      };

      try {
        // First, try to load from localStorage (immediate)
        const localUsageKey = `operations_usage_${selectedBusiness.id}_${currentMonthKey}`;
        const localUsage = localStorage.getItem(localUsageKey);
        
        if (localUsage) {
          const parsedUsage = JSON.parse(localUsage);
          console.log(`📊 OperationsPaywall: Loaded usage from localStorage:`, parsedUsage);
          setUsage(parsedUsage);
        } else {
          console.log(`📊 OperationsPaywall: No local usage data, using defaults`);
          setUsage(defaultUsage);
        }

        // Clear any previous errors since we have fallback data
        setError(null);

        // Optionally try to sync with server in background (non-blocking)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            console.log(`📊 OperationsPaywall: Attempting background server sync for ${selectedBusiness.id}`);
            
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/operations-usage/${selectedBusiness.id}/${currentMonthKey}`,
              {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              }
            );

            if (response.ok) {
              const serverUsage = await response.json();
              console.log(`📊 OperationsPaywall: Server sync successful:`, serverUsage);
              
              // Update with server data and save to localStorage
              setUsage(serverUsage);
              localStorage.setItem(localUsageKey, JSON.stringify(serverUsage));
            } else {
              console.log(`📊 OperationsPaywall: Server sync failed (${response.status}), continuing with local data`);
            }
          }
        } catch (serverError) {
          console.log(`📊 OperationsPaywall: Server sync error (non-critical):`, serverError.message);
          // Don't show error - we already have fallback data
        }

      } catch (localError: any) {
        console.warn('📊 OperationsPaywall: Error with local storage, using defaults:', localError.message);
        setUsage(defaultUsage);
        setError(null); // Don't show errors for storage issues
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [selectedBusiness?.id, currentMonthKey]);

  // Check if limit is reached
  const isLimitReached = () => {
    if (!usage || !currentLimit) return false;
    if (typeof currentLimit === 'boolean') return false; // bankBalance is always allowed
    return usage[operationType] >= currentLimit;
  };

  // Get usage percentage
  const getUsagePercentage = () => {
    if (!usage || !currentLimit || typeof currentLimit === 'boolean') return 0;
    return Math.min((usage[operationType] / currentLimit) * 100, 100);
  };

  // Get next tier suggestion
  const getNextTier = () => {
    const tiers = ['free', 'creator', 'builder', 'studio'];
    const currentIndex = tiers.indexOf(tier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  // Handle billing portal redirect
  const handleManageBilling = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setIsBillingLoading(true);
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe/create-customer-portal/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = data.portalUrl;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setIsBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">Loading usage data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Error loading usage data: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user has reached their limit, show paywall
  if (isLimitReached()) {
    const nextTier = getNextTier();
    const nextTierLimits = nextTier ? OPERATION_LIMITS[nextTier as keyof typeof OPERATION_LIMITS] : null;
    const nextTierLimit = nextTierLimits?.[operationType];

    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-amber-100">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-amber-800">
            {operationType.charAt(0).toUpperCase() + operationType.slice(1)} Limit Reached
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isMobile && (
            <>
              <div className="text-center space-y-2">
                <p className="text-amber-700">
                  You've reached your monthly limit of <strong>{currentLimit}</strong> {operationType} 
                  for your <Badge variant="outline" className="capitalize">{tier}</Badge> plan.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                  <Calendar className="w-4 h-4" />
                  <span>Limits reset on the 1st of each month</span>
                </div>
              </div>

              <div className="bg-white/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-amber-700">Current Usage</span>
                  <span className="text-sm text-amber-600">
                    {usage?.[operationType] || 0} / {currentLimit} {operationType}
                  </span>
                </div>
                <Progress value={getUsagePercentage()} className="h-2" />
              </div>
            </>
          )}
          
          {isMobile && (
            <Button 
              onClick={handleManageBilling} 
              disabled={isBillingLoading}
              variant="outline"
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isBillingLoading ? 'Opening Billing Portal...' : 'Open Billing Portal'}
            </Button>
          )}

          {!isMobile && nextTier && nextTierLimit && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700 capitalize">
                  Upgrade to {nextTier}
                </span>
              </div>
              <p className="text-sm text-blue-600 mb-3">
                Get <strong>{nextTierLimit}</strong> {operationType} per month 
                {typeof nextTierLimit === 'number' && typeof currentLimit === 'number' && 
                  ` (${nextTierLimit - currentLimit} more than your current plan)`
                }
              </p>
              <Button 
                onClick={onUpgrade}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          )}

          {!nextTier && (
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-700 font-medium">
                You're already on our highest tier! 🎉
              </p>
              <p className="text-sm text-purple-600 mt-1">
                Contact support if you need higher limits.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show usage indicator if close to limit
  const usagePercentage = getUsagePercentage();
  const showUsageWarning = usagePercentage >= 80 && typeof currentLimit === 'number';

  return (
    <div className="space-y-4">
      {showUsageWarning && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    Approaching {operationType} limit
                  </p>
                  <p className="text-sm text-yellow-600">
                    {usage?.[operationType] || 0} / {currentLimit} used this month
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Progress value={usagePercentage} className="w-24 h-2 mb-1" />
                <span className="text-xs text-yellow-600">{Math.round(usagePercentage)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {children}
    </div>
  );
};

// Hook to increment usage - client-side with optional server sync
export const useOperationsUsage = () => {
  const { selectedBusiness } = useBusiness();
  const { subscriptionData } = useCloudSubscription();

  // Get subscription tier for limits
  const getSubscriptionTier = useCallback(() => {
    if (!subscriptionData || subscriptionData.status !== 'subscribed') return 'free';
    
    // Normalize the plan name to lowercase
    const planName = (subscriptionData.plan || '').toLowerCase().trim();
    
    // Map known plan names to tier keys
    const validTiers = ['free', 'creator', 'builder', 'studio'];
    
    // Return the plan if it's valid, otherwise default to free
    return validTiers.includes(planName) ? planName : 'free';
  }, [subscriptionData]);

  const incrementUsage = useCallback(async (operationType: keyof Omit<OperationUsage, 'monthYear' | 'businessId'>) => {
    if (!selectedBusiness?.id) {
      console.warn('📊 useOperationsUsage: No business selected for usage increment');
      return { success: false, error: 'No business selected' };
    }

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const localUsageKey = `operations_usage_${selectedBusiness.id}_${currentMonthKey}`;

    try {
      // Get current usage from localStorage
      const currentUsageStr = localStorage.getItem(localUsageKey);
      const currentUsage = currentUsageStr ? JSON.parse(currentUsageStr) : {
        products: 0,
        campaigns: 0,
        deals: 0,
        leads: 0,
        transactions: 0,
        budgets: 0,
        aiMessages: 0,
        monthYear: currentMonthKey,
        businessId: selectedBusiness.id
      };

      // Check limits before incrementing
      const tier = getSubscriptionTier();
      const limits = OPERATION_LIMITS[tier as keyof typeof OPERATION_LIMITS];
      const currentLimit = limits[operationType];

      if (typeof currentLimit === 'number' && currentUsage[operationType] >= currentLimit) {
        console.warn(`📊 useOperationsUsage: Limit exceeded for ${operationType} (${currentUsage[operationType]}/${currentLimit})`);
        return { 
          success: false, 
          error: 'Limit exceeded',
          usage: currentUsage[operationType],
          limit: currentLimit,
          tier
        };
      }

      // Increment usage locally
      const updatedUsage = {
        ...currentUsage,
        [operationType]: currentUsage[operationType] + 1
      };

      // Save to localStorage immediately
      localStorage.setItem(localUsageKey, JSON.stringify(updatedUsage));
      console.log(`📊 useOperationsUsage: Incremented ${operationType} locally: ${updatedUsage[operationType]}`);

      // Try to sync with server in background (non-blocking)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/operations-usage/increment`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                businessId: selectedBusiness.id,
                operationType,
                monthYear: currentMonthKey
              })
            }
          );

          if (response.ok) {
            console.log(`📊 useOperationsUsage: Server sync successful for ${operationType}`);
          } else {
            console.log(`📊 useOperationsUsage: Server sync failed but local increment succeeded`);
          }
        }
      } catch (serverError) {
        console.log(`📊 useOperationsUsage: Server sync error (non-critical):`, serverError);
      }

      return { 
        success: true, 
        usage: updatedUsage[operationType],
        limit: currentLimit,
        tier
      };

    } catch (error: any) {
      console.error('📊 useOperationsUsage: Error incrementing usage:', error);
      return { success: false, error: error.message };
    }
  }, [selectedBusiness, getSubscriptionTier]);

  const checkLimit = useCallback(async (operationType: keyof Omit<OperationUsage, 'monthYear' | 'businessId'>) => {
    if (!selectedBusiness?.id) {
      return { allowed: false, usage: 0, limit: 0, tier: 'free' };
    }

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const localUsageKey = `operations_usage_${selectedBusiness.id}_${currentMonthKey}`;

    try {
      // Get current usage from localStorage
      const currentUsageStr = localStorage.getItem(localUsageKey);
      const currentUsage = currentUsageStr ? JSON.parse(currentUsageStr) : {
        products: 0,
        campaigns: 0,
        deals: 0,
        leads: 0,
        transactions: 0,
        budgets: 0,
        aiMessages: 0,
        monthYear: currentMonthKey,
        businessId: selectedBusiness.id
      };

      const tier = getSubscriptionTier();
      const limits = OPERATION_LIMITS[tier as keyof typeof OPERATION_LIMITS];
      const currentLimit = limits[operationType];
      const currentUsageCount = currentUsage[operationType] || 0;

      const allowed = typeof currentLimit === 'boolean' || 
                     (typeof currentLimit === 'number' && currentUsageCount < currentLimit);

      console.log(`📊 useOperationsUsage: Limit check for ${operationType}: ${currentUsageCount}/${currentLimit} (${allowed ? 'allowed' : 'blocked'})`);

      return {
        allowed,
        usage: currentUsageCount,
        limit: currentLimit,
        tier
      };

    } catch (error: any) {
      console.error('📊 useOperationsUsage: Error checking limit:', error);
      return { allowed: false, usage: 0, limit: 0, tier: 'free' };
    }
  }, [selectedBusiness, getSubscriptionTier]);

  return { incrementUsage, checkLimit };
};

export default OperationsPaywall;