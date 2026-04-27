/**
 * IAPAutoRestore - Automatically restores IAP purchases on app launch
 * Ensures users who have purchased subscriptions see their correct plan
 */
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { isIAPAvailable, initializeIAP, restorePurchases } from '../utils/iapManager';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface IAPAutoRestoreProps {
  user: any;
}

export function IAPAutoRestore({ user }: IAPAutoRestoreProps) {
  const hasRestored = useRef(false);

  useEffect(() => {
    // Only run once per app session
    if (hasRestored.current || !user?.id) {
      return;
    }

    // Only run on iOS native platform
    if (!isIAPAvailable()) {
      console.log('📱 IAP Auto-Restore: Not available (not on iOS native)');
      return;
    }

    const autoRestoreAndSync = async () => {
      try {
        console.log('📱 IAP Auto-Restore: Starting automatic purchase restoration...');
        hasRestored.current = true;

        // Initialize IAP
        await initializeIAP();
        console.log('📱 IAP Auto-Restore: IAP initialized');

        // Restore purchases from Apple
        const restoreResult = await restorePurchases();
        
        if (!restoreResult.success) {
          console.log('📱 IAP Auto-Restore: No purchases to restore');
          return;
        }

        if (!restoreResult.transactions || restoreResult.transactions.length === 0) {
          console.log('📱 IAP Auto-Restore: No active transactions found');
          return;
        }

        console.log(`📱 IAP Auto-Restore: Found ${restoreResult.transactions.length} transaction(s)`);

        // Get access token for backend validation
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('📱 IAP Auto-Restore: No access token available');
          return;
        }

        // Validate each transaction with backend
        for (const transaction of restoreResult.transactions) {
          try {
            console.log(`📱 IAP Auto-Restore: Validating ${transaction.productId}...`);

            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/apple-iap/validate`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  receipt: transaction.receipt,
                  productId: transaction.productId,
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              console.log('✅ IAP Auto-Restore: Purchase validated successfully:', data);
            } else {
              const errorText = await response.text();
              console.warn(`⚠️ IAP Auto-Restore: Validation failed for ${transaction.productId}:`, errorText);
            }
          } catch (error) {
            console.error(`❌ IAP Auto-Restore: Error validating ${transaction.productId}:`, error);
          }
        }

        console.log('✅ IAP Auto-Restore: Auto-restore complete');
        
        // Dispatch event to trigger subscription refresh
        window.dispatchEvent(new Event('iap-restore-complete'));
      } catch (error: any) {
        console.error('❌ IAP Auto-Restore: Failed:', error);
        // Don't show error to user - this is a silent background operation
      }
    };

    // Run after a short delay to avoid blocking app startup
    const timer = setTimeout(() => {
      autoRestoreAndSync();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  // This component doesn't render anything
  return null;
}
