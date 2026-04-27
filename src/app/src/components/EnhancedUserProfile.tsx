import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { CreditCard, Users, Calendar, DollarSign, AlertCircle, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

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

interface EnhancedUserProfileProps {
  user: any;
  isSigningOut?: boolean;
}

export const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({ 
  user, 
  isSigningOut = false 
}) => {
  const {
    allSubscriptions,
    isLoading,
    refreshSubscriptions,
    removeSubscription,
    totalSeats,
    totalMonthlyCost,
    hasActiveSeats
  } = useCloudSubscription();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Enhanced refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscriptions();
      toast.success('Subscription data refreshed');
    } catch (error) {
      toast.error('Failed to refresh subscription data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to cancel subscriptions');
        return;
      }

      // Call Stripe API to cancel the subscription
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Subscription cancelled successfully');
        await refreshSubscriptions();
      } else {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(`Failed to cancel subscription: ${error.message}`);
    }
  };

  // Remove subscription from our system (for cancelled/expired ones)
  const handleRemoveSubscription = async (subscriptionId: string) => {
    try {
      await removeSubscription(subscriptionId);
      toast.success('Subscription removed from your account');
    } catch (error) {
      toast.error('Failed to remove subscription');
    }
  };

  // Create checkout for additional seats
  const handleAddSeats = async (seatCount: number = 1) => {
    setIsCreatingCheckout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to purchase seats');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/create-seat-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.name || user.email,
          seatQuantity: seatCount,
          successUrl: `${window.location.origin}/profile?seat_success=true`,
          cancelUrl: `${window.location.origin}/profile?seat_cancelled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const result = await response.json();
      
      if (result.success && result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating seat checkout:', error);
      toast.error(`Failed to create checkout: ${error.message}`);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  // Format date helper
  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return 'Unknown';
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Format currency helper
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trialing': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'past_due': return 'destructive';
      default: return 'outline';
    }
  };

  if (isSigningOut) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Signing out...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage your subscriptions, seats, and billing
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading || isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Seats</p>
                <p className="text-2xl font-bold">{totalSeats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold">${totalMonthlyCost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">
                  {allSubscriptions.filter(sub => sub.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Subscriptions</CardTitle>
          <CardDescription>
            All your active and inactive subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading subscriptions...</p>
            </div>
          ) : allSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allSubscriptions.map((subscription, index) => (
                <Card key={subscription.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {subscription.type === 'seat' ? 'Team Seats' : 
                             subscription.plan ? `${subscription.plan} Plan` : 
                             'Subscription'}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(subscription.status)}>
                            {subscription.status}
                          </Badge>
                          {subscription.type && (
                            <Badge variant="outline">
                              {subscription.type}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Subscription ID</p>
                            <p className="font-mono text-xs">{subscription.id}</p>
                          </div>
                          
                          {subscription.seatCount && (
                            <div>
                              <p className="text-muted-foreground">Seats</p>
                              <p className="font-medium">{subscription.seatCount}</p>
                            </div>
                          )}
                          
                          {subscription.totalMonthlyCost && (
                            <div>
                              <p className="text-muted-foreground">Monthly Cost</p>
                              <p className="font-medium">${subscription.totalMonthlyCost}</p>
                            </div>
                          )}
                          
                          {subscription.current_period_end && (
                            <div>
                              <p className="text-muted-foreground">Next Billing</p>
                              <p className="font-medium">
                                {formatDate(subscription.current_period_end)}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-muted-foreground">Last Updated</p>
                            <p className="font-medium">
                              {formatDate(subscription.lastUpdated)}
                            </p>
                          </div>
                          
                          {subscription.customer && (
                            <div>
                              <p className="text-muted-foreground">Customer ID</p>
                              <p className="font-mono text-xs">{subscription.customer}</p>
                            </div>
                          )}
                        </div>

                        {subscription.metadata && Object.keys(subscription.metadata).length > 0 && (
                          <div>
                            <p className="text-muted-foreground text-sm mb-1">Metadata</p>
                            <div className="bg-muted p-2 rounded text-xs font-mono">
                              {JSON.stringify(subscription.metadata, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {subscription.status === 'active' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel your subscription immediately. You will lose access 
                                  to premium features at the end of your current billing period.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelSubscription(subscription.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancel Subscription
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        {(subscription.status === 'cancelled' || subscription.status === 'incomplete_expired') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Subscription?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove this cancelled subscription from your account. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveSubscription(subscription.id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      {hasActiveSeats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Monthly Cost</p>
                  <p className="text-2xl font-bold">${totalMonthlyCost}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Team Seats</p>
                  <p className="text-2xl font-bold">{totalSeats}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <p>• Each additional seat costs $12/month</p>
                <p>• Billing occurs monthly on your subscription anniversary</p>
                <p>• You can add or remove seats at any time</p>
                <p>• Prorated charges apply for mid-cycle changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};