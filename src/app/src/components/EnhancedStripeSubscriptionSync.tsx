import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  CreditCard,
  ExternalLink,
  Clock,
  DollarSign,
  Calendar,
  Info
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useCloudSubscription } from './CloudSubscriptionContext';

interface EnhancedStripeSubscriptionSyncProps {
  userId: string;
  userEmail?: string;
  onSyncComplete?: () => void;
}

interface StripeCustomer {
  id: string;
  email: string;
  created: number;
}

interface StripeSubscription {
  id: string;
  status: string;
  plan?: any;
  items?: any;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end?: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  subscription?: {
    id: string;
    status: string;
    plan: string;
    billing: string;
    customerId: string;
    currentPeriodEnd: string;
  };
  totalSubscriptions?: number;
  activeSubscriptions?: number;
  stripeCustomer?: StripeCustomer;
  stripeSubscriptions?: StripeSubscription[];
  databaseUpdated?: boolean;
}

export function EnhancedStripeSubscriptionSync({ 
  userId, 
  userEmail,
  onSyncComplete 
}: EnhancedStripeSubscriptionSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // IMPORTANT: Using CloudSubscriptionContext (not SubscriptionContext)
  const { refreshSubscriptions } = useCloudSubscription();

  const syncSubscription = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSyncResult({
          success: false,
          message: 'Not authenticated. Please log in again.'
        });
        return;
      }

      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;
      
      console.log('🔄 ENHANCED SYNC: Starting comprehensive Stripe sync...');
      console.log('📧 User email:', userEmail);
      console.log('🆔 User ID:', userId);
      console.log('🔑 Project ID:', projectId);
      console.log('🌐 Server URL:', serverUrl);
      
      // First, test if the direct test endpoint works
      console.log('🧪 Step 1: Testing direct endpoint...');
      try {
        const testResponse = await fetch(`${serverUrl}/stripe-supabase-sync-test-direct`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const testData = await testResponse.json();
        console.log('✅ Direct test endpoint response:', testData);
      } catch (error) {
        console.error('❌ Direct test endpoint failed:', error);
      }
      
      // Test the mounted sub-route test endpoint
      console.log('🧪 Step 2: Testing mounted sub-route test endpoint...');
      try {
        const subTestResponse = await fetch(`${serverUrl}/stripe-supabase-sync/test`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const subTestData = await subTestResponse.json();
        console.log('✅ Sub-route test endpoint response:', subTestData);
      } catch (error) {
        console.error('❌ Sub-route test endpoint failed:', error);
      }
      
      // Now call the actual auto-sync endpoint
      console.log('🎯 Step 3: Calling auto-sync endpoint...');
      const fullUrl = `${serverUrl}/stripe-supabase-sync/auto-sync`;
      console.log('🌐 Full auto-sync URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ ENHANCED SYNC: Success!', data);
        
        setSyncResult({
          success: true,
          message: data.message || 'Successfully synced subscription from Stripe and updated database',
          subscription: data.subscription,
          totalSubscriptions: data.totalSubscriptions,
          activeSubscriptions: data.activeSubscriptions,
          stripeCustomer: data.stripeCustomer,
          stripeSubscriptions: data.stripeSubscriptions,
          databaseUpdated: true
        });

        console.log('📝 Database has been updated with Stripe data');
        console.log('📊 Subscription details:', data.subscription);

        // Dispatch event to trigger refresh in SubscriptionContext
        window.dispatchEvent(new CustomEvent('subscription-updated', {
          detail: { subscription: data.subscription }
        }));

        // Force refresh the subscription context
        setTimeout(() => {
          if (refreshSubscriptions) {
            refreshSubscriptions();
          }
        }, 500);

        // Call callback if provided
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        console.error('❌ ENHANCED SYNC: Failed', data);
        setSyncResult({
          success: false,
          message: data.error || data.message || 'Failed to sync subscription',
          stripeCustomer: data.stripeCustomer,
          stripeSubscriptions: data.stripeSubscriptions,
        });
      }

    } catch (error: any) {
      console.error('❌ ENHANCED SYNC: Error', error);
      setSyncResult({
        success: false,
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (timestamp: number | string) => {
    try {
      const date = typeof timestamp === 'number' 
        ? new Date(timestamp * 1000) 
        : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'creator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'builder':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'studio':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'canceled':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'past_due':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Sync from Stripe
                <Badge variant="outline" className="text-xs">Live Data</Badge>
              </CardTitle>
              <CardDescription>
                Read subscription from Stripe and update database
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">What this does:</p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>1. Fetches your subscription directly from Stripe's servers</li>
              <li>2. Detects your plan (Creator/Builder/Studio) and billing period</li>
              <li>3. Updates the database with the latest information</li>
              <li>4. Unlocks paywalls if you have an active subscription</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={syncSubscription}
          disabled={isSyncing}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          size="lg"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing from Stripe...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Subscription from Stripe
            </>
          )}
        </Button>

        {syncResult && (
          <div className="space-y-4">
            <Alert variant={syncResult.success ? 'default' : 'destructive'}>
              {syncResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className="space-y-2">
                <p className="font-semibold">{syncResult.message}</p>
                
                {syncResult.databaseUpdated && (
                  <div className="flex items-center gap-2 text-sm mt-2 text-green-700 dark:text-green-300">
                    <Database className="w-4 h-4" />
                    <span>Database updated successfully</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Subscription Details */}
            {syncResult.subscription && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                    <CheckCircle2 className="w-5 h-5" />
                    Active Subscription Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Plan</p>
                      <Badge className={getPlanBadgeColor(syncResult.subscription.plan)}>
                        {syncResult.subscription.plan.charAt(0).toUpperCase() + 
                         syncResult.subscription.plan.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge className={getStatusBadgeColor(syncResult.subscription.status)}>
                        {syncResult.subscription.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Billing</p>
                      <p className="font-medium">
                        {syncResult.subscription.billing === 'monthly' ? 'Monthly' : 
                         syncResult.subscription.billing === 'annual' ? 'Annual' : 
                         syncResult.subscription.billing}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Subscription ID</p>
                      <p className="text-xs font-mono truncate">
                        {syncResult.subscription.id}
                      </p>
                    </div>
                  </div>

                  {syncResult.subscription.currentPeriodEnd && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Next billing:</span>
                        <span className="font-medium">
                          {formatDate(syncResult.subscription.currentPeriodEnd)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      ✅ This subscription has been saved to the database
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paywalls should now unlock. If not, try refreshing the page.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stripe Customer Details */}
            {syncResult.stripeCustomer && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full"
                >
                  {showDetails ? 'Hide' : 'Show'} Stripe Details
                </Button>

                {showDetails && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Stripe Customer
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer ID:</span>
                            <span className="font-mono text-xs">{syncResult.stripeCustomer.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{syncResult.stripeCustomer.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatDate(syncResult.stripeCustomer.created)}</span>
                          </div>
                        </div>
                      </div>

                      {syncResult.stripeSubscriptions && syncResult.stripeSubscriptions.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-semibold mb-2">
                              Stripe Subscriptions ({syncResult.stripeSubscriptions.length})
                            </h4>
                            <div className="space-y-2">
                              {syncResult.stripeSubscriptions.map((sub, idx) => (
                                <div 
                                  key={sub.id} 
                                  className="p-3 border rounded-lg bg-background space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <Badge className={getStatusBadgeColor(sub.status)}>
                                      {sub.status}
                                    </Badge>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {sub.id}
                                    </span>
                                  </div>
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Period:</span>
                                      <span className="text-xs">
                                        {formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}
                                      </span>
                                    </div>
                                    {sub.cancel_at_period_end && (
                                      <div className="text-orange-600 dark:text-orange-400 text-xs">
                                        ⚠️ Cancels at period end
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {syncResult.totalSubscriptions !== undefined && (
                        <>
                          <Separator />
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Subscriptions:</span>
                              <span className="font-medium">{syncResult.totalSubscriptions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Active Subscriptions:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {syncResult.activeSubscriptions}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* No subscription found */}
            {syncResult.success === false && syncResult.stripeCustomer && (
              <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        No Active Subscription Found
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        We found your Stripe customer account, but no active subscriptions.
                      </p>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = '/pricing'}
                          className="border-orange-300 dark:border-orange-700"
                        >
                          View Plans & Pricing
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
