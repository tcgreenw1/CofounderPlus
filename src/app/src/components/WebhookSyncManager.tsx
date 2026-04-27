import React, { useEffect, useState } from 'react';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface WebhookSyncManagerProps {
  user: any;
}

export const WebhookSyncManager: React.FC<WebhookSyncManagerProps> = ({ user }) => {
  const { refreshSubscriptions } = useCloudSubscription();
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Enhanced webhook sync function with retry logic
  const syncWebhookData = async (options: { 
    showToast?: boolean; 
    maxRetries?: number;
    source?: string;
  } = {}) => {
    const { showToast = false, maxRetries = 3, source = 'manual' } = options;
    
    if (syncInProgress) {
      console.log('🔄 WebhookSyncManager: Sync already in progress, skipping');
      return;
    }

    if (!user?.id) {
      console.log('ℹ️ WebhookSyncManager: No user ID available for sync');
      return;
    }

    setSyncInProgress(true);
    setLastSyncAttempt(new Date());

    try {
      console.log(`🔄 WebhookSyncManager: Starting webhook sync (${source})...`);
      
      if (showToast) {
        toast.loading('Syncing subscription status...', { id: 'webhook-sync' });
      }

      // Step 1: Force refresh subscription data
      await refreshSubscriptions();
      
      // Step 2: Trigger webhook processing on server if available
      try {
        // Get current session for proper authorization
        const { data: { session } } = await supabase.auth.getSession();
        const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${publicAnonKey}`;
        
        const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9`;
        const syncUrl = `${serverUrl}/webhook/sync-user`;
        
        const response = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            source,
            timestamp: Date.now()
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`🔄 WebhookSyncManager: Server sync response:`, result);
          
          // Wait a moment then refresh subscription again
          setTimeout(async () => {
            await refreshSubscriptions();
            console.log(`🔄 WebhookSyncManager: Post-sync refresh completed`);
          }, 1000);
          
        } else {
          console.log(`ℹ️ WebhookSyncManager: Server sync failed:`, response.status);
        }
      } catch (serverError: any) {
        console.log(`ℹ️ WebhookSyncManager: Server sync error:`, serverError.message);
        // Continue anyway - the subscription refresh above might be enough
      }

      if (showToast) {
        toast.success('Subscription status synced!', { id: 'webhook-sync' });
      }

      console.log(`🔄 WebhookSyncManager: Webhook sync completed (${source})`);
      
    } catch (error: any) {
      console.error(`🔄 WebhookSyncManager: Sync error (${source}):`, error);
      
      if (showToast) {
        toast.error('Failed to sync subscription status', { id: 'webhook-sync' });
      }
    } finally {
      setSyncInProgress(false);
    }
  };

  // Listen for manual sync requests
  useEffect(() => {
    const handleManualSync = (event: any) => {
      console.log('🔄 WebhookSyncManager: Manual sync requested');
      syncWebhookData({ showToast: true, source: 'manual-request' });
    };

    const handlePaymentSuccess = (event: any) => {
      console.log('🔄 WebhookSyncManager: Payment success detected, syncing webhook data');
      // Wait a moment for Stripe webhook to potentially process
      setTimeout(() => {
        syncWebhookData({ showToast: false, source: 'payment-success' });
      }, 2000);
    };

    window.addEventListener('manual-webhook-sync', handleManualSync);
    window.addEventListener('stripe-payment-success', handlePaymentSuccess);
    window.addEventListener('stripe-checkout-success', handlePaymentSuccess);

    return () => {
      window.removeEventListener('manual-webhook-sync', handleManualSync);
      window.removeEventListener('stripe-payment-success', handlePaymentSuccess);
      window.removeEventListener('stripe-checkout-success', handlePaymentSuccess);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // syncWebhookData is intentionally not in deps to prevent infinite loop

  // Expose sync function globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).manualWebhookSync = () => {
        console.log('🔄 WebhookSyncManager: Manual sync triggered from console');
        syncWebhookData({ showToast: true, source: 'console' });
      };
    }
  }, []);

  return null; // This component only handles side effects
};