/**
 * Direct Stripe Checkout Utilities
 * Helper functions for creating and managing direct Stripe checkout sessions
 */

import { projectId } from './supabase/info';
import { supabase } from './supabase/client';

/**
 * Creates a direct Stripe checkout session for a subscription
 * @param priceId - The Stripe price ID for the subscription
 * @param userId - Optional user ID (will be fetched from session if not provided)
 * @returns The checkout session URL
 */
export async function createDirectStripeCheckout(
  priceId: string,
  userId?: string
): Promise<string | null> {
  try {
    console.log('🛒 Creating direct Stripe checkout session...', { priceId, userId });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No session found for checkout');
      throw new Error('Please sign in to continue');
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          priceId,
          userId: userId || session.user.id
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create checkout session:', error);
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    console.log('✅ Checkout session created:', data);
    
    return data.url || data.sessionUrl || null;
  } catch (error) {
    console.error('❌ Error creating direct checkout:', error);
    throw error;
  }
}

/**
 * Creates a Stripe customer portal session for managing subscriptions
 * @returns The customer portal URL
 */
export async function createStripePortalSession(): Promise<string | null> {
  try {
    console.log('🔧 Creating Stripe customer portal session...');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('❌ No session found for portal');
      throw new Error('Please sign in to continue');
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/stripe/create-portal-session`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create portal session:', error);
      throw new Error('Failed to create portal session');
    }

    const data = await response.json();
    console.log('✅ Portal session created:', data);
    
    return data.url || null;
  } catch (error) {
    console.error('❌ Error creating portal session:', error);
    throw error;
  }
}
