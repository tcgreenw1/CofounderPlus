/**
 * SubscriptionPurchaseScreen - Apple Compliant Subscription Purchase Flow
 * Displays all required information per Apple's App Store guidelines:
 * - Title of auto-renewing subscription
 * - Length of subscription
 * - Price of subscription (billed amount most prominent)
 * - Functional links to Privacy Policy and Terms of Use
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Sparkles, Loader2, Star, AlertCircle, ExternalLink, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { isIAPAvailable, purchaseProduct, IAP_PRODUCT_IDS } from '../utils/iapManager';

interface SubscriptionOption {
  id: string;
  productId: string;
  name: string;
  planTitle: string; // Title of the auto-renewing subscription
  subscriptionLength: string; // Length of subscription
  billedAmount: string; // The MOST PROMINENT price (actual billed amount)
  billedAmountNumeric: number;
  calculatedPrice?: string; // SUBORDINATE pricing information (monthly equivalent)
  saveAmount?: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  popular?: boolean;
}

const monthlySubscriptions: SubscriptionOption[] = [
  {
    id: 'creator_monthly',
    productId: IAP_PRODUCT_IDS.LAUNCH_MONTHLY,
    name: 'Launch',
    planTitle: 'Launch Monthly Subscription',
    subscriptionLength: '1 month',
    billedAmount: '$19.00',
    billedAmountNumeric: 19.00,
    icon: <Sparkles className="w-6 h-6" />,
    color: '#00E0FF',
    features: [
      'Up to 2 businesses',
      'Full Business OS',
      '5k credits/month',
      'Email Support',
      'Mobile & Web Access'
    ]
  },
  {
    id: 'builder_monthly',
    productId: IAP_PRODUCT_IDS.GROW_MONTHLY,
    name: 'Grow',
    planTitle: 'Grow Monthly Subscription',
    subscriptionLength: '1 month',
    billedAmount: '$49.00',
    billedAmountNumeric: 49.00,
    icon: <Zap className="w-6 h-6" />,
    color: '#6CFF6C',
    popular: true,
    features: [
      'Up to 10 businesses',
      'Unlimited integrations',
      '20k credits/month',
      'Priority Support',
      'Team Collaboration'
    ]
  },
  {
    id: 'studio_monthly',
    productId: IAP_PRODUCT_IDS.SCALE_MONTHLY,
    name: 'Scale',
    planTitle: 'Scale Monthly Subscription',
    subscriptionLength: '1 month',
    billedAmount: '$199.00',
    billedAmountNumeric: 199.00,
    icon: <Star className="w-6 h-6" />,
    color: '#FFCF00',
    features: [
      'Up to 50 businesses',
      '150k credits/month',
      'Executive Support'
    ]
  }
];

const annualSubscriptions: SubscriptionOption[] = [
  {
    id: 'creator_annual',
    productId: IAP_PRODUCT_IDS.LAUNCH_ANNUAL,
    name: 'Launch',
    planTitle: 'Launch Annual Subscription',
    subscriptionLength: '1 year (12 months)',
    billedAmount: '$179.00',
    billedAmountNumeric: 179.00,
    calculatedPrice: '$14.92/month',
    saveAmount: 'Save 21% vs monthly',
    icon: <Sparkles className="w-6 h-6" />,
    color: '#00E0FF',
    features: [
      'Up to 2 businesses',
      'Full Business OS',
      '5k credits/month',
      'Email Support',
      'Mobile & Web Access'
    ]
  },
  {
    id: 'builder_annual',
    productId: IAP_PRODUCT_IDS.GROW_ANNUAL,
    name: 'Grow',
    planTitle: 'Grow Annual Subscription',
    subscriptionLength: '1 year (12 months)',
    billedAmount: '$450.00',
    billedAmountNumeric: 450.00,
    calculatedPrice: '$37.50/month',
    saveAmount: 'Save 23% vs monthly',
    icon: <Zap className="w-6 h-6" />,
    color: '#6CFF6C',
    popular: true,
    features: [
      'Up to 10 businesses',
      'Unlimited integrations',
      '20k credits/month',
      'Priority Support',
      'Team Collaboration'
    ]
  },
  {
    id: 'studio_annual',
    productId: IAP_PRODUCT_IDS.SCALE_ANNUAL,
    name: 'Scale',
    planTitle: 'Scale Annual Subscription',
    subscriptionLength: '1 year (12 months)',
    billedAmount: '$1,908.00',
    billedAmountNumeric: 1908.00,
    calculatedPrice: '$159/month',
    saveAmount: 'Save 20% vs monthly',
    icon: <Star className="w-6 h-6" />,
    color: '#FFCF00',
    features: [
      'Up to 50 businesses',
      '150k credits/month',
      'Executive Support'
    ]
  }
];

interface SubscriptionPurchaseScreenProps {
  onClose?: () => void;
  preselectedPlan?: string;
}

export function SubscriptionPurchaseScreen({ onClose, preselectedPlan }: SubscriptionPurchaseScreenProps) {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionOption | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const subscriptions = billingPeriod === 'annual' ? annualSubscriptions : monthlySubscriptions;

  const handleSelectPlan = (plan: SubscriptionOption) => {
    setSelectedPlan(plan);
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;

    setProcessing(true);

    try {
      console.log(`🛒 Purchasing subscription: ${selectedPlan.planTitle}`);
      console.log(`🛒 Product ID: ${selectedPlan.productId}`);
      console.log(`🛒 Billed Amount: ${selectedPlan.billedAmount}`);
      console.log(`🛒 Subscription Length: ${selectedPlan.subscriptionLength}`);

      // Validate product ID
      if (!selectedPlan.productId || selectedPlan.productId === 'undefined') {
        throw new Error(`Product ID is undefined for ${selectedPlan.name}`);
      }

      // Check IAP availability
      if (!isIAPAvailable()) {
        throw new Error('In-app purchases are not available on this device.');
      }

      // Show loading toast
      toast.loading('Processing purchase...', {
        id: 'purchase-loading',
        description: 'Please complete the purchase in the App Store dialog',
      });

      const result = await purchaseProduct(selectedPlan.productId);

      // Dismiss loading toast
      toast.dismiss('purchase-loading');

      if (result.success) {
        console.log('✅ Purchase successful:', result);

        toast.success('Subscription Activated!', {
          description: `Welcome to ${selectedPlan.name}! Your subscription is now active.`,
          duration: 5000,
        });

        // Close and reload
        setTimeout(() => {
          if (onClose) onClose();
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);

      // Dismiss loading toast
      toast.dismiss('purchase-loading');

      // Don't show error toast if user cancelled
      if (!error.message?.includes('cancelled') && !error.message?.includes('canceled')) {
        toast.error('Purchase Failed', {
          description: error.message || 'Could not complete purchase. Please try again.',
          duration: 5000,
        });
      }

      setShowConfirmation(false);
    } finally {
      setProcessing(false);
    }
  };

  if (showConfirmation && selectedPlan) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-2xl mx-auto liquid-glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Confirm Subscription</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmation(false)}
                disabled={processing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscription Details - Apple Required Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedPlan.color}20`, color: selectedPlan.color }}
                >
                  {selectedPlan.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedPlan.planTitle}</h3>
                  <p className="text-sm text-muted-foreground">Auto-renewing subscription</p>
                </div>
              </div>

              <Separator />

              {/* PRICE - BILLED AMOUNT (MOST PROMINENT) */}
              <div className="bg-muted/30 rounded-lg p-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">You will be charged</p>
                <p className="text-5xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {selectedPlan.billedAmount}
                </p>
                <p className="text-lg font-semibold text-muted-foreground">
                  per {selectedPlan.subscriptionLength}
                </p>
                {/* Calculated price is SUBORDINATE */}
                {selectedPlan.calculatedPrice && (
                  <p className="text-xs text-muted-foreground mt-3">
                    ({selectedPlan.calculatedPrice})
                  </p>
                )}
                {selectedPlan.saveAmount && (
                  <Badge variant="secondary" className="mt-2">
                    {selectedPlan.saveAmount}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Subscription Length */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subscription Length:</span>
                <span className="font-semibold">{selectedPlan.subscriptionLength}</span>
              </div>

              {/* Auto-Renewal Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This subscription automatically renews every {selectedPlan.subscriptionLength.toLowerCase()} unless cancelled at least 24 hours before the end of the current period. You will be charged {selectedPlan.billedAmount} at the start of each billing period. You can cancel anytime in your iOS Settings under Subscriptions.
                </AlertDescription>
              </Alert>

              {/* Features */}
              <div className="space-y-2">
                <p className="font-medium">Included Features:</p>
                <ul className="space-y-1.5">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* REQUIRED LINKS - Privacy Policy and Terms of Use */}
              <div className="space-y-3 text-center">
                <p className="text-xs text-muted-foreground">
                  By subscribing, you agree to our terms and privacy policy
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // For iOS native app, open in system browser with full URL
                      if (window.location.protocol === 'capacitor:') {
                        window.open('https://www.cofounderplus.com/privacy-policy', '_blank');
                      } else {
                        // For web, use in-app navigation
                        window.open('/privacy-policy', '_blank');
                      }
                    }}
                  >
                    Privacy Policy
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // For iOS native app, open in system browser with full URL
                      if (window.location.protocol === 'capacitor:') {
                        window.open('https://www.cofounderplus.com/terms-of-service', '_blank');
                      } else {
                        // For web, use in-app navigation
                        window.open('/terms-of-service', '_blank');
                      }
                    }}
                  >
                    Terms of Use (EULA)
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmation(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmPurchase}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Subscribe for ${selectedPlan.billedAmount}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Plan Selection Screen
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          {onClose && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <h1 className="text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select a subscription that fits your business needs
          </p>
        </div>

        {/* Billing Period Toggle */}
        <Card className="liquid-glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === 'annual' ? 'default' : 'outline'}
                onClick={() => setBillingPeriod('annual')}
              >
                Annual
                {billingPeriod === 'annual' && (
                  <Badge variant="secondary" className="ml-2">Save up to 23%</Badge>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scale Annual Warning for iOS */}
        {billingPeriod === 'annual' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> The Scale plan annual subscription ($1,908/year) is not available for in-app purchase due to Apple's $999.99 limit on in-app purchases. The Scale plan is available with monthly billing at $199/month, or contact us at support@cofounderplus.com to set up annual billing directly.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptions.map((plan) => (
            <Card
              key={plan.id}
              className={`liquid-glass-card ${plan.popular ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-3 right-3">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center space-y-4">
                <div
                  className="w-14 h-14 rounded-lg mx-auto flex items-center justify-center"
                  style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                >
                  {plan.icon}
                </div>
                <CardTitle>{plan.name}</CardTitle>
                
                {/* BILLED AMOUNT (MOST PROMINENT) */}
                <div className="space-y-1">
                  <p className="text-4xl font-bold">{plan.billedAmount}</p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    per {plan.subscriptionLength}
                  </p>
                  {/* Calculated price is SUBORDINATE */}
                  {plan.calculatedPrice && (
                    <p className="text-xs text-muted-foreground">
                      ({plan.calculatedPrice})
                    </p>
                  )}
                  {plan.saveAmount && (
                    <Badge variant="secondary" className="mt-2">
                      {plan.saveAmount}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                >
                  Select Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Required Links Footer */}
        <Card className="liquid-glass-card">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              All subscriptions automatically renew unless cancelled. Manage your subscription in iOS Settings.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/privacy-policy')}
              >
                Privacy Policy
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/terms-of-service')}
              >
                Terms of Use (EULA)
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}