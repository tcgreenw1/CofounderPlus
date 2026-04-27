import React, { useEffect, useCallback } from 'react';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface StripeSubscriptionSyncerProps {
  user: any;
  isSigningOut?: boolean;
}

export const StripeSubscriptionSyncer: React.FC<StripeSubscriptionSyncerProps> = ({
  user,
  isSigningOut = false
}) => {
  const { saveSubscription, refreshSubscriptions } = useCloudSubscription();

  // Handle Stripe webhook events that affect subscriptions
  const handleStripeWebhookEvent = useCallback(async (eventData: any) => {
    if (!user?.id || isSigningOut) {
      console.log('🔄 STRIPE SYNC: Skipping - no user or signing out');
      return;
    }

    try {
      console.log('🔄 STRIPE SYNC: Processing webhook event:', eventData.type);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('🔄 STRIPE SYNC: No access token available');
        return;
      }

      // Extract subscription data from the webhook event
      let subscriptionData = null;
      let customerId = null;

      switch (eventData.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          subscriptionData = eventData.data.object;
          customerId = subscriptionData.customer;
          break;
        
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          if (eventData.data.object.subscription) {
            // We'll need to fetch the subscription details
            customerId = eventData.data.object.customer;
            const subscriptionId = eventData.data.object.subscription;
            
            // For now, we'll trigger a refresh instead of trying to reconstruct the subscription
            console.log('🔄 STRIPE SYNC: Invoice event detected, triggering refresh');
            await refreshSubscriptions();
            return;
          }
          break;
        
        default:
          console.log('🔄 STRIPE SYNC: Unhandled event type:', eventData.type);
          return;
      }

      if (!subscriptionData || !customerId) {
        console.log('🔄 STRIPE SYNC: No subscription data to sync');
        return;
      }

      // Send to our subscription management endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/subscriptions/sync-stripe-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscriptionData,
          customerId,
          eventType: eventData.type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ STRIPE SYNC: Subscription synced successfully:', result.subscriptionId);
        
        // Refresh local subscription data
        await refreshSubscriptions();
      } else {
        console.error('❌ STRIPE SYNC: Sync failed:', result.error);
      }

    } catch (error: any) {
      console.error('❌ STRIPE SYNC: Error processing webhook event:', error);
    }
  }, [user?.id, isSigningOut, saveSubscription, refreshSubscriptions]);

  // Convert Stripe subscription to our format
  const convertStripeSubscription = useCallback((stripeSubscription: any) => {
    // Determine subscription type based on items
    let type: 'main' | 'seat' | 'addon' = 'main';
    let seatCount = 0;
    let pricePerSeat = 0;
    let totalMonthlyCost = 0;

    if (stripeSubscription.items?.data) {
      for (const item of stripeSubscription.items.data) {
        const price = item.price;
        const quantity = item.quantity || 1;
        
        // Check if this is a seat subscription (typically $12/month = 1200 cents)
        if (price.unit_amount === 1200 || 
            price.nickname?.toLowerCase().includes('seat') ||
            price.nickname?.toLowerCase().includes('addon')) {
          type = 'seat';
          seatCount += quantity;
          pricePerSeat = price.unit_amount / 100;
          totalMonthlyCost += (price.unit_amount * quantity) / 100;
        } else {
          // Main subscription
          totalMonthlyCost += (price.unit_amount * quantity) / 100;
        }
      }
    }

    return {
      id: stripeSubscription.id,
      userId: user.id,
      status: stripeSubscription.status,
      plan: stripeSubscription.metadata?.plan || 'unknown',
      customer: stripeSubscription.customer,
      current_period_start: stripeSubscription.current_period_start,
      current_period_end: stripeSubscription.current_period_end,
      items: stripeSubscription.items?.data || [],
      metadata: stripeSubscription.metadata || {},
      type,
      seatCount: seatCount || undefined,
      pricePerSeat: pricePerSeat || undefined,
      totalMonthlyCost: totalMonthlyCost || undefined,
    };
  }, [user?.id]);

  // Listen for Stripe webhook events
  useEffect(() => {
    const handleWebhookEvent = (event: CustomEvent) => {
      console.log('🔄 STRIPE SYNC: Received webhook event:', event.detail);
      handleStripeWebhookEvent(event.detail);
    };

    // Listen for webhook events from the WebhookSyncManager
    window.addEventListener('stripe-webhook-received', handleWebhookEvent as EventListener);

    return () => {
      window.removeEventListener('stripe-webhook-received', handleWebhookEvent as EventListener);
    };
  }, [handleStripeWebhookEvent]);

  // Listen for manual sync requests
  useEffect(() => {
    const handleManualSync = async () => {
      console.log('🔄 STRIPE SYNC: Manual sync requested');
      await refreshSubscriptions();
    };

    window.addEventListener('manual-stripe-sync', handleManualSync);

    return () => {
      window.removeEventListener('manual-stripe-sync', handleManualSync);
    };
  }, [refreshSubscriptions]);

  // This component doesn't render anything - it just handles sync events
  return null;
};