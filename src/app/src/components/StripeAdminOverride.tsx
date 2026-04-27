import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { 
  Crown, 
  Zap, 
  Star, 
  Sparkles,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  CreditCard,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface StripeAdminOverrideProps {
  user: any;
  isSigningOut?: boolean;
}

interface OverrideStatus {
  hasOverride: boolean;
  subscriptionData: any;
  customerId: string;
}

export function StripeAdminOverride({ user, isSigningOut = false }: StripeAdminOverrideProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('builder');
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('annual');
  const [overrideStatus, setOverrideStatus] = useState<OverrideStatus | null>(null);
  const [allOverrides, setAllOverrides] = useState<any[]>([]);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9`;

  const plans = [
    { id: 'creator', name: 'Creator', icon: Zap, color: 'from-blue-600 to-cyan-600', monthlyPrice: 15, annualPrice: 9 },
    { id: 'builder', name: 'Builder', icon: Crown, color: 'from-purple-600 to-pink-600', monthlyPrice: 49, annualPrice: 39 },
    { id: 'studio', name: 'Studio', icon: Star, color: 'from-yellow-500 to-orange-500', monthlyPrice: 199, annualPrice: 149 }
  ];

  // Load override status on mount
  useEffect(() => {
    if (user?.id && !isSigningOut) {
      loadOverrideStatus();
      loadAllOverrides();
    }
  }, [user?.id, isSigningOut]);

  const loadOverrideStatus = async () => {
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe-admin/override-status/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOverrideStatus(data);
      } else {
        console.warn('Failed to load override status');
      }
    } catch (error) {
      console.error('Error loading override status:', error);
    }
  };

  const loadAllOverrides = async () => {
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe-admin/list-overrides`, {
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllOverrides(data.overrides || []);
      } else {
        console.warn('Failed to load all overrides');
      }
    } catch (error) {
      console.error('Error loading all overrides:', error);
    }
  };

  const applyStripeOverride = async () => {
    if (!user?.id || !user?.email) {
      setError('User ID and email are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe-admin/apply-stripe-override`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.name || user.email,
          plan: selectedPlan,
          billingPeriod: selectedBilling
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(`✅ Successfully created ${selectedPlan} ${selectedBilling} subscription in Stripe!`);
        await loadOverrideStatus();
        await loadAllOverrides();
        
        // Trigger subscription refresh
        window.dispatchEvent(new CustomEvent('subscription-override-applied', {
          detail: { plan: selectedPlan, billing: selectedBilling }
        }));
      } else {
        setError(`Failed to apply override: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setError(`Error applying override: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeStripeOverride = async () => {
    if (!user?.id || !user?.email) {
      setError('User ID and email are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe-admin/remove-stripe-override`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ Successfully removed subscription override from Stripe!');
        await loadOverrideStatus();
        await loadAllOverrides();
        
        // Trigger subscription refresh
        window.dispatchEvent(new CustomEvent('subscription-override-cleared'));
      } else {
        setError(`Failed to remove override: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setError(`Error removing override: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadOverrideStatus(),
        loadAllOverrides()
      ]);
      setMessage('✅ Status refreshed');
    } catch (error) {
      setError('Failed to refresh status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSigningOut) {
    return null;
  }

  const getPlanInfo = (planId: string) => {
    return plans.find(p => p.id === planId) || plans[0];
  };

  const selectedPlanInfo = getPlanInfo(selectedPlan);
  const selectedPrice = selectedBilling === 'annual' ? selectedPlanInfo.annualPrice : selectedPlanInfo.monthlyPrice;

  return (
    <Card className="w-full max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur border shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Real Stripe Subscription Override</CardTitle>
              <CardDescription>
                Creates actual Stripe subscriptions that persist naturally
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Current Status for {user?.email}
          </h3>
          
          {overrideStatus ? (
            <div className="p-4 border rounded-lg bg-muted/50">
              {overrideStatus.hasOverride ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">
                        Active Stripe Override: {overrideStatus.subscriptionData?.plan?.toUpperCase() || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Customer ID: {overrideStatus.customerId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Subscription ID: {overrideStatus.subscriptionData?.subscriptionId}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-gray-500" />
                  <div className="text-muted-foreground">No active Stripe override</div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <div className="text-muted-foreground">Loading status...</div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Apply Override */}
        <div className="space-y-4">
          <h3 className="font-semibold">Apply New Stripe Override</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center gap-2">
                        <plan.icon className="w-4 h-4" />
                        {plan.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Period</label>
              <Select value={selectedBilling} onValueChange={(value: 'monthly' | 'annual') => setSelectedBilling(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select billing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedPlanInfo.name} Plan</div>
                <div className="text-sm text-muted-foreground">
                  ${selectedPrice}/{selectedBilling === 'annual' ? 'month (billed annually)' : 'month'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${selectedPrice}</div>
                <div className="text-xs text-muted-foreground">per month</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={applyStripeOverride}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Create Stripe Subscription
            </Button>

            {overrideStatus?.hasOverride && (
              <Button 
                variant="destructive"
                onClick={removeStripeOverride}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Cancel Stripe Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* All Active Overrides */}
        {allOverrides.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold">All Active Stripe Overrides ({allOverrides.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {allOverrides.map((override, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-muted/30 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">User: {override.userId}</div>
                        <div className="text-muted-foreground">
                          Plan: {override.plan} ({override.billingPeriod})
                        </div>
                      </div>
                      <Badge variant="outline">
                        {override.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <strong>How it works:</strong> This creates real Stripe subscriptions that persist naturally. 
          No local overrides needed - the subscription data comes directly from Stripe and will remain 
          until the subscription is canceled or expires.
        </div>
      </CardContent>
    </Card>
  );
}