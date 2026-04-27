/**
 * Stripe Sync Utilities
 * Helper functions for syncing Stripe subscription data
 */

import { projectId } from './supabase/info';
import { supabase } from './supabase/client';

/**
 * Auto-sync subscription data from Stripe
 * This function is called after successful payment to ensure subscription data is up to date
 */
export async function autoSyncSubscription(userId: string): Promise<void> {
  try {
    console.log('🔄 Auto-syncing subscription for user:', userId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No session found for subscription sync');
      return;
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe/sync-subscription`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Subscription synced successfully:', data);
    } else {
      console.error('❌ Failed to sync subscription:', response.status);
    }
  } catch (error) {
    console.error('❌ Error syncing subscription:', error);
  }
}

/**
 * Manual subscription refresh
 * Forces a refresh of subscription data from Stripe
 */
export async function manualSyncSubscription(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No session found for manual sync');
      return false;
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe/sync-subscription`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      console.log('✅ Manual subscription sync successful');
      return true;
    } else {
      console.error('❌ Manual subscription sync failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error in manual subscription sync:', error);
    return false;
  }
}
