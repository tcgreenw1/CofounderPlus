import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useSubscription } from './SubscriptionContext';
import { 
  Crown, 
  Star, 
  Zap, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Check,
  Loader2,
  X
} from 'lucide-react';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: 'creator' | 'builder' | 'studio';
  billingPeriod: 'monthly' | 'annual';
  user: any;
}

const planDetails = {
  creator: {
    name: 'Creator',
    icon: Zap,
    businesses: 2,
    features: ['Full Operations Access', '2 Businesses', 'Community Access', 'Basic Support'],
    monthlyPrice: 15,
    annualPrice: 9
  },
  builder: {
    name: 'Builder',
    icon: Crown,
    businesses: 4,
    features: ['Everything in Creator', '4 Businesses', 'Priority Support', 'Advanced Analytics'],
    monthlyPrice: 49,
    annualPrice: 39
  },
  studio: {
    name: 'Studio',
    icon: Star,
    businesses: 8,
    features: ['Everything in Builder', '8 Businesses', 'White-label Options', 'Dedicated Support'],
    monthlyPrice: 199,
    annualPrice: 149
  }
};

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  billingPeriod,
  user
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { forceRefreshSubscription } = useSubscription();
  
  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;
  const plan = planDetails[selectedPlan];
  const price = billingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const savings = billingPeriod === 'annual' ? ((plan.monthlyPrice * 12) - (plan.annualPrice * 12)) : 0;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      console.log('🛒 Starting Stripe Checkout for:', {
        plan: selectedPlan,
        billingPeriod,
        price,
        user: user.email
      });

      // Create Stripe Checkout Session
      const response = await fetch(`${serverUrl}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
          plan: selectedPlan,
          billingPeriod,
          successUrl: `${window.location.origin}/subscription-success`,
          cancelUrl: `${window.location.origin}/subscription-cancel`
        })
      });

      const data = await response.json();
      console.log('🛒 Checkout session response:', data);

      if (response.ok && data.success && data.sessionUrl) {
        // Mark that checkout is starting
        sessionStorage.setItem('stripe_checkout_started', Date.now().toString());
        sessionStorage.setItem('stripe_checkout_user', user.email);
        sessionStorage.setItem('stripe_checkout_plan', selectedPlan);
        
        // Redirect to Stripe Checkout
        console.log('🛒 Redirecting to Stripe Checkout:', data.sessionUrl);
        window.location.href = data.sessionUrl;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('🛒 Checkout error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = plan.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            Upgrade to {plan.name}
          </DialogTitle>
          <DialogDescription>
            Complete your upgrade to {plan.name} plan and unlock all the features your business needs to grow.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Plan Summary */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-semibold">{plan.name} Plan</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${price}</div>
                  <div className="text-sm text-muted-foreground">
                    /{billingPeriod === 'annual' ? 'month' : 'month'}
                  </div>
                </div>
              </div>
              
              {billingPeriod === 'annual' && savings > 0 && (
                <Badge className="mb-3 bg-green-100 text-green-800">
                  Save ${savings}/year
                </Badge>
              )}
              
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-medium">Supported Payment Methods</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs">Cards</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Smartphone className="w-4 h-4" />
                <span className="text-xs">Apple Pay</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Wallet className="w-4 h-4" />
                <span className="text-xs">Google Pay</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <X className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ${price}/{billingPeriod === 'annual' ? 'mo' : 'mo'}
                </>
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-center text-muted-foreground">
            🔒 Secure payment powered by Stripe. Your payment information is encrypted and secure.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};