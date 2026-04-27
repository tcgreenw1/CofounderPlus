/**
 * ManualSubscriptionRefresh - Component to manually force refresh subscription data
 * Useful when webhooks haven't processed yet or subscription state is stale
 */
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ManualSubscriptionRefresh() {
  const { refreshSubscriptions, subscriptionData, isLoading, lastRefresh } = useCloudSubscription();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Manual refresh: Starting subscription data refresh...');
      
      // Emit manual sync event
      window.dispatchEvent(new CustomEvent('manual-subscription-sync', {
        detail: { source: 'manual-button', timestamp: Date.now() }
      }));
      
      await refreshSubscriptions();
      
      toast.success('Subscription data refreshed successfully');
      console.log('✅ Manual refresh: Complete');
    } catch (error) {
      console.error('❌ Manual refresh: Failed:', error);
      toast.error('Failed to refresh subscription data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCurrentStatus = () => {
    if (!subscriptionData) {
      return {
        icon: AlertCircle,
        color: 'text-gray-500',
        text: 'No subscription data'
      };
    }
    
    if (subscriptionData.status === 'subscribed' || subscriptionData.status === 'trial') {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        text: `Active - ${subscriptionData.plan || 'Unknown'} plan`
      };
    }
    
    return {
      icon: XCircle,
      color: 'text-gray-600',
      text: 'Free plan'
    };
  };

  const status = getCurrentStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Subscription Status
        </CardTitle>
        <CardDescription>
          Manually refresh your subscription data from Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <div className="flex-1">
            <p className="font-medium">{status.text}</p>
            {lastRefresh && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last synced: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Subscription Data'}
        </Button>

        {/* Instructions */}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p className="font-medium">When to use this:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Just completed a payment and status hasn't updated</li>
            <li>Changed your plan but it's not reflecting</li>
            <li>Cancelled subscription but still showing as active</li>
          </ul>
          <p className="text-xs mt-3">
            💡 <strong>Tip:</strong> It can take 1-2 minutes for Stripe webhooks to process. 
            Try refreshing after waiting a moment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
