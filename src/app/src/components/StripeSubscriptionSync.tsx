import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface StripeSubscriptionSyncProps {
  userId: string;
  onSyncComplete?: () => void;
}

export function StripeSubscriptionSync({ userId, onSyncComplete }: StripeSubscriptionSyncProps) {
  const [issyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    subscription?: any;
  } | null>(null);

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

      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9`;
      
      console.log('🔄 Syncing subscription from Stripe...');
      
      const response = await fetch(`${serverUrl}/stripe-sync/sync-subscription/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSyncResult({
          success: true,
          message: data.message || 'Successfully synced subscription from Stripe',
          subscription: data.subscription
        });

        console.log('✅ Subscription synced successfully:', data);

        // Dispatch event to trigger refresh in SubscriptionContext
        window.dispatchEvent(new CustomEvent('subscription-updated', {
          detail: { subscription: data.subscription }
        }));

        // Call callback if provided
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Failed to sync subscription'
        });
        console.error('❌ Sync failed:', data);
      }

    } catch (error: any) {
      console.error('❌ Error syncing subscription:', error);
      setSyncResult({
        success: false,
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="mb-2">Sync Subscription from Stripe</h3>
          <p className="text-sm text-muted-foreground">
            If you've recently upgraded or your subscription isn't showing correctly, click below to sync your subscription status from Stripe.
          </p>
        </div>

        <Button
          onClick={syncSubscription}
          disabled={issyncing}
          className="w-full"
        >
          {issyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync from Stripe
            </>
          )}
        </Button>

        {syncResult && (
          <Alert variant={syncResult.success ? 'default' : 'destructive'}>
            {syncResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {syncResult.message}
              {syncResult.subscription && (
                <div className="mt-2 text-sm">
                  <p>Plan: {syncResult.subscription.plan}</p>
                  <p>Status: {syncResult.subscription.status}</p>
                  {syncResult.subscription.billing && (
                    <p>Billing: {syncResult.subscription.billing}</p>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
