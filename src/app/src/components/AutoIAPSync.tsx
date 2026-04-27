/**
 * AutoIAPSync - Automatic In-App Purchase Subscription Sync
 * 
 * This component automatically restores and syncs iOS IAP subscriptions on app startup.
 * Fixes the issue where Apple shows an active subscription but the app shows free plan.
 * 
 * How it works:
 * 1. Runs once when user logs in (on native iOS only)
 * 2. Checks for active Apple subscriptions using restorePurchases()
 * 3. Syncs any found subscriptions with backend
 * 4. Updates user's subscription status in database
 * 5. Shows toast notification if subscription was restored
 */

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { isIAPAvailable, restorePurchases, getActiveSubscriptions } from '../utils/iapManager';
import { toast } from 'sonner@2.0.3';

interface AutoIAPSyncProps {
  userId?: string;
  userEmail?: string;
  onSyncComplete?: (success: boolean) => void;
}

export function AutoIAPSync({ userId, userEmail, onSyncComplete }: AutoIAPSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasSyncedRef.current) {
      console.log('📱 Auto IAP Sync: Already synced this session, skipping');
      return;
    }

    // Only run on iOS native platform
    if (!isIAPAvailable()) {
      console.log('📱 Auto IAP Sync: Not on iOS, skipping');
      return;
    }

    // Only run if user is logged in
    if (!userId || !userEmail) {
      console.log('📱 Auto IAP Sync: No user ID, skipping');
      return;
    }

    // Mark as synced to prevent multiple runs
    hasSyncedRef.current = true;

    // Start auto-sync after a short delay to not interfere with login flow
    const timeoutId = setTimeout(() => {
      autoSyncSubscription();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [userId, userEmail]);

  const autoSyncSubscription = async () => {
    if (isSyncing) {
      console.log('📱 Auto IAP Sync: Already syncing, skipping');
      return;
    }

    setIsSyncing(true);
    console.log('📱 Auto IAP Sync: Starting automatic subscription sync...');

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !session?.user?.id) {
        console.log('📱 Auto IAP Sync: Not authenticated, skipping');
        setIsSyncing(false);
        return;
      }

      // Try to get active subscriptions first (faster check)
      console.log('📱 Auto IAP Sync: Checking for active subscriptions...');
      const activeSubscriptions = await getActiveSubscriptions();
      
      if (activeSubscriptions.length === 0) {
        console.log('📱 Auto IAP Sync: No active subscriptions found');
        setIsSyncing(false);
        if (onSyncComplete) onSyncComplete(false);
        return;
      }

      console.log('📱 Auto IAP Sync: Found active subscriptions:', activeSubscriptions);

      // Restore purchases to get receipt data
      console.log('📱 Auto IAP Sync: Restoring purchases to get receipts...');
      const restoreResult = await restorePurchases();
      
      if (!restoreResult.success || !restoreResult.transactions || restoreResult.transactions.length === 0) {
        console.log('📱 Auto IAP Sync: No transactions to restore');
        setIsSyncing(false);
        if (onSyncComplete) onSyncComplete(false);
        return;
      }

      console.log(`📱 Auto IAP Sync: Found ${restoreResult.transactions.length} transaction(s) to sync`);

      // Sync the first active transaction with backend
      const transaction = restoreResult.transactions[0];
      console.log('📱 Auto IAP Sync: Syncing transaction:', {
        productId: transaction.productId,
        transactionId: transaction.transactionId
      });

      const syncResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/iap/validate-receipt`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receipt: transaction.receipt,
            productId: transaction.productId,
            transactionId: transaction.transactionId,
            userId: session.user.id,
          }),
        }
      );

      const syncData = await syncResponse.json();

      if (!syncResponse.ok || !syncData.success) {
        console.error('📱 Auto IAP Sync: Failed to sync:', syncData);
        setIsSyncing(false);
        if (onSyncComplete) onSyncComplete(false);
        return;
      }

      console.log('✅ Auto IAP Sync: Subscription synced successfully!');
      
      // Show success notification
      toast.success('Subscription Restored', {
        description: 'Your Apple subscription has been synced with your account',
        duration: 5000
      });
      
      if (onSyncComplete) onSyncComplete(true);

    } catch (error: any) {
      console.error('📱 Auto IAP Sync: Error:', error);
      // Don't show error toast for auto-sync - fail silently
      if (onSyncComplete) onSyncComplete(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // This component doesn't render anything
  return null;
}
