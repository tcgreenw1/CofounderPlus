import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { autoSyncSubscription } from '../utils/stripeSync';

interface PaymentSuccessDetectorProps {
  user: any;
}

export const PaymentSuccessDetector: React.FC<PaymentSuccessDetectorProps> = ({ user }) => {
  const location = useLocation();
  const { refreshSubscriptions } = useCloudSubscription();

  useEffect(() => {
    if (!user?.id) return;

    // Check if we're on a success page
    const isSuccessPage = location.pathname.includes('success') || 
                         location.pathname.includes('subscription-success');
    
    // Check for Stripe success parameters
    const urlParams = new URLSearchParams(location.search);
    const sessionId = urlParams.get('session_id');
    const paymentStatus = urlParams.get('payment_status');
    
    if (isSuccessPage && sessionId) {
      console.log('🎉 PaymentSuccessDetector: Payment success detected!', {
        path: location.pathname,
        sessionId,
        paymentStatus,
        user: user.email
      });
      
      // Emit payment success event
      const paymentSuccessEvent = new CustomEvent('stripe-payment-success', {
        detail: { 
          sessionId, 
          paymentStatus, 
          path: location.pathname,
          user: user.email,
          userId: user.id,
          timestamp: Date.now() 
        }
      });
      window.dispatchEvent(paymentSuccessEvent);
      
      // Auto-sync subscription from Stripe
      console.log('🎉 PaymentSuccessDetector: Syncing subscription from Stripe after payment');
      setTimeout(async () => {
        const syncResult = await autoSyncSubscription();
        if (syncResult.success) {
          console.log('✅ PaymentSuccessDetector: Subscription synced successfully');
        } else {
          console.warn('⚠️ PaymentSuccessDetector: Sync failed, falling back to regular refresh');
          refreshSubscriptions();
        }
      }, 2000); // 2 second delay to ensure Stripe webhook has processed
      
      console.log('🎉 PaymentSuccessDetector: Payment success handling complete');
    }
    
    // Also detect if we're coming from a Stripe redirect
    const referrer = document.referrer;
    if (referrer && referrer.includes('checkout.stripe.com')) {
      console.log('🎉 PaymentSuccessDetector: Detected return from Stripe checkout!');
      
      // Emit a generic checkout return event
      const checkoutReturnEvent = new CustomEvent('stripe-checkout-return', {
        detail: { 
          referrer,
          path: location.pathname,
          user: user.email,
          userId: user.id,
          timestamp: Date.now() 
        }
      });
      window.dispatchEvent(checkoutReturnEvent);
      
      // Do a cautious refresh
      setTimeout(() => {
        console.log('🎉 PaymentSuccessDetector: Refreshing subscription after Stripe return');
        refreshSubscriptions();
      }, 1000);
    }
    
  }, [location, user]); // Removed refreshSubscriptions from deps to prevent infinite loop

  // Also monitor for browser storage events that might indicate payment completion
  useEffect(() => {
    if (!user?.id) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('stripe') && e.newValue) {
        console.log('🎉 PaymentSuccessDetector: Stripe-related storage change detected:', e.key);
        
        setTimeout(() => {
          refreshSubscriptions();
        }, 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]); // Removed refreshSubscriptions from deps to prevent infinite loop

  // Monitor for focus events (user returning to tab after payment)
  useEffect(() => {
    if (!user?.id) return;

    let lastPaymentAttempt = 0;

    const handleFocus = () => {
      const now = Date.now();
      
      // Only trigger if it's been more than 30 seconds since last attempt
      // and if we might have just returned from a payment flow
      if (now - lastPaymentAttempt > 30000) {
        const hasStripeInHistory = window.location.href.includes('session_id') ||
                                  document.referrer.includes('stripe.com') ||
                                  sessionStorage.getItem('stripe_checkout_started');
        
        if (hasStripeInHistory) {
          console.log('🎉 PaymentSuccessDetector: Focus event after potential payment, refreshing subscription');
          lastPaymentAttempt = now;
          
          setTimeout(() => {
            refreshSubscriptions();
          }, 500);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]); // Removed refreshSubscriptions from deps to prevent infinite loop

  return null; // This component only handles side effects
};

export default PaymentSuccessDetector;