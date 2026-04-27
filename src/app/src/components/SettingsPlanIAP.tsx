/**
 * SettingsPlanIAP - Inline IAP Plan Selector for Settings Page
 * Renders plan cards dynamically and handles IAP purchases
 * Uses design system CSS variables
 * UPDATED: Fixed pricing hierarchy to comply with Apple App Store guidelines
 * - Billed amount is now the MOST prominent pricing element
 * - Calculated pricing (monthly equivalent) is subordinate
 */
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Check, Crown, Zap, Sparkles, Loader2, Star, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { isIAPAvailable, purchaseProduct, restorePurchases, initializeIAP, IAP_PRODUCT_IDS } from '../utils/iapManager';

interface Plan {
  id: string;
  productId: string;
  name: string;
  planTitle: string; // Full title of the auto-renewing subscription
  subscriptionLength: string; // e.g., "1 month" or "1 year (12 months)"
  price: number;
  period: 'monthly' | 'annual';
  billedAmount: string; // MOST PROMINENT - actual amount charged (e.g., "$179/year")
  calculatedPrice?: string; // SUBORDINATE - monthly equivalent for annual plans (e.g., "$14.92/mo")
  saveAmount?: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
  unavailable?: boolean;
  unavailableReason?: string;
}

const plans: Plan[] = [
  // Launch (Creator) Monthly
  {
    id: 'creator_monthly',
    productId: IAP_PRODUCT_IDS.LAUNCH_MONTHLY,
    name: 'Launch',
    planTitle: 'Launch Monthly Subscription',
    subscriptionLength: '1 month',
    price: 19,
    period: 'monthly',
    billedAmount: '$19.00/month',
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      'Up to 2 businesses',
      '5k credits/month'
    ]
  },
  // Launch (Creator) Annual
  {
    id: 'creator_annual',
    productId: IAP_PRODUCT_IDS.LAUNCH_ANNUAL,
    name: 'Launch',
    planTitle: 'Launch Annual Subscription',
    subscriptionLength: '1 year (12 months)',
    price: 179,
    period: 'annual',
    billedAmount: '$179.00/year',
    calculatedPrice: '$14.92/month',
    saveAmount: 'Save 21%',
    icon: <Sparkles className="w-6 h-6" />,
    popular: true,
    features: [
      'Up to 2 businesses',
      '5k credits/month'
    ]
  },
  // Grow (Builder) Monthly
  {
    id: 'builder_monthly',
    productId: IAP_PRODUCT_IDS.GROW_MONTHLY,
    name: 'Grow',
    planTitle: 'Grow Monthly Subscription',
    subscriptionLength: '1 month',
    price: 49,
    period: 'monthly',
    billedAmount: '$49.00/month',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Up to 10 businesses',
      '20k credits/month'
    ]
  },
  // Grow (Builder) Annual
  {
    id: 'builder_annual',
    productId: IAP_PRODUCT_IDS.GROW_ANNUAL,
    name: 'Grow',
    planTitle: 'Grow Annual Subscription',
    subscriptionLength: '1 year (12 months)',
    price: 450,
    period: 'annual',
    billedAmount: '$450.00/year',
    calculatedPrice: '$37.50/month',
    saveAmount: 'Save 23%',
    icon: <Zap className="w-6 h-6" />,
    popular: true,
    features: [
      'Up to 10 businesses',
      '20k credits/month'
    ]
  },
  // Scale (Studio) Monthly
  {
    id: 'studio_monthly',
    productId: IAP_PRODUCT_IDS.SCALE_MONTHLY,
    name: 'Scale',
    planTitle: 'Scale Monthly Subscription',
    subscriptionLength: '1 month',
    price: 199,
    period: 'monthly',
    billedAmount: '$199.00/month',
    icon: <Star className="w-6 h-6" />,
    features: [
      'Up to 50 businesses',
      '150k credits/month'
    ]
  },
  // Scale (Studio) Annual - UNAVAILABLE (over $999)
  {
    id: 'studio_annual',
    productId: IAP_PRODUCT_IDS.SCALE_ANNUAL,
    name: 'Scale',
    planTitle: 'Scale Annual Subscription',
    subscriptionLength: '1 year (12 months)',
    price: 1908,
    period: 'annual',
    billedAmount: '$1,908.00/year',
    calculatedPrice: '$159/month',
    saveAmount: 'Save 20%',
    icon: <Star className="w-6 h-6" />,
    unavailable: true,
    unavailableReason: 'The Scale annual plan ($1,908/year) exceeds Apple\'s $999.99 limit for in-app purchases. Please choose monthly billing at $199/month, or contact support@cofounderplus.com to set up annual billing directly.',
    features: [
      'Up to 50 businesses',
      '150k credits/month'
    ]
  }
];

export function SettingsPlanIAP() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [iapReady, setIapReady] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Platform detection
  const isIOSApp = Capacitor.getPlatform() === 'ios';
  const isMobile = window.innerWidth < 768;

  // Initialize IAP on component mount
  useEffect(() => {
    if (isIAPAvailable()) {
      console.log('🔧 IAP: Initializing for Settings Plan tab...');
      initializeIAP()
        .then(() => {
          console.log('✅ IAP: Initialization successful');
          setIapReady(true);
        })
        .catch((error) => {
          console.error('❌ IAP: Initialization failed:', error);
          setIapReady(false);
          toast.error('In-App Purchases Unavailable', {
            description: 'Could not initialize purchases. Please try again later.',
            duration: 6000,
          });
        });
    } else {
      console.log('⚠️ IAP: Not available (not on iOS)');
      setIapReady(false);
    }
  }, []);

  // Listen for billing period changes
  useEffect(() => {
    const handleBillingPeriodChange = (event: CustomEvent<'monthly' | 'annual'>) => {
      console.log('📱 Billing period changed to:', event.detail);
      setBillingPeriod(event.detail);
    };

    window.addEventListener('iapBillingPeriodChanged', handleBillingPeriodChange as EventListener);

    return () => {
      window.removeEventListener('iapBillingPeriodChanged', handleBillingPeriodChange as EventListener);
    };
  }, []);

  // Listen for restore purchases
  useEffect(() => {
    const handleRestorePurchases = async () => {
      console.log('📱 Restore purchases triggered');
      await handleRestore();
    };

    window.addEventListener('iapRestorePurchases', handleRestorePurchases as EventListener);

    return () => {
      window.removeEventListener('iapRestorePurchases', handleRestorePurchases as EventListener);
    };
  }, []);

  const handlePurchase = async (plan: Plan) => {
    if (plan.unavailable) {
      toast.error('Plan Unavailable', {
        description: plan.unavailableReason,
        duration: 6000,
      });
      return;
    }

    if (!iapReady) {
      toast.error('Not Ready', {
        description: 'In-app purchases are still initializing. Please wait...',
        duration: 3000,
      });
      return;
    }

    setProcessing(true);
    setSelectedPlan(plan.id);

    try {
      console.log(`🛒 Purchasing plan: ${plan.name} (${plan.period})`);
      console.log(`🛒 Product ID: ${plan.productId}`);
      console.log(`🛒 IAP Available: ${isIAPAvailable()}`);
      console.log(`🛒 IAP Ready State: ${iapReady}`);
      
      // Validate product ID
      if (!plan.productId || plan.productId === 'undefined') {
        throw new Error(`Product ID is undefined for ${plan.name} ${plan.period}`);
      }

      // Check IAP availability again
      if (!isIAPAvailable()) {
        throw new Error('In-app purchases are not available on this device. Please upgrade on desktop at cofounderplus.com');
      }
      
      // Show a loading toast to give user feedback
      toast.loading('Processing purchase...', {
        id: 'purchase-loading',
        description: 'Please wait while we process your subscription',
      });
      
      console.log(`🛒 Calling purchaseProduct with ID: ${plan.productId}`);
      const result = await purchaseProduct(plan.productId);
      
      // Dismiss loading toast
      toast.dismiss('purchase-loading');
      
      console.log(`🛒 Purchase result:`, result);
      
      if (result.success) {
        console.log('✅ Purchase successful:', result);
        
        toast.success('Upgrade Successful!', {
          description: `Welcome to ${plan.name}! Your subscription is now active.`,
          duration: 5000,
        });
        
        // Reload to reflect new subscription
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Dismiss loading toast if still showing
      toast.dismiss('purchase-loading');
      
      // Don't show error toast if user cancelled
      if (!error.message?.includes('cancelled') && !error.message?.includes('canceled')) {
        toast.error('Purchase Failed', {
          description: error.message || 'Could not complete purchase. Please try again.',
          duration: 5000,
        });
      }
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);

    try {
      console.log('🔄 Restoring purchases...');
      
      const result = await restorePurchases();
      
      if (result.success) {
        console.log('✅ Restore successful:', result);
        
        toast.success('Purchases Restored', {
          description: 'Your previous purchases have been restored successfully.',
          duration: 3000,
        });
        
        // Reload to reflect restored subscription
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || 'Restore failed');
      }
    } catch (error: any) {
      console.error('❌ Restore failed:', error);
      
      toast.error('Restore Failed', {
        description: error.message || 'Could not restore purchases. Please try again.',
        duration: 5000,
      });
    } finally {
      setRestoring(false);
    }
  };

  // Filter plans by billing period
  const filteredPlans = plans.filter(plan => plan.period === billingPeriod);

  if (!iapReady) {
    return (
      <Card className="liquid-glass-card text-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ 
            borderColor: 'var(--muted)',
            borderTopColor: 'var(--primary)'
          }}></div>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Initializing in-app purchases...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Period Toggle */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="billing-toggle" className="text-base">
                Billing Period
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose between monthly and annual billing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span 
                className="text-sm transition-colors"
                style={{ 
                  color: billingPeriod === 'monthly' ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: billingPeriod === 'monthly' ? '600' : '400'
                }}
              >
                Monthly
              </span>
              <Switch
                id="billing-toggle"
                checked={billingPeriod === 'annual'}
                onCheckedChange={(checked) => setBillingPeriod(checked ? 'annual' : 'monthly')}
              />
              <span 
                className="text-sm transition-colors"
                style={{ 
                  color: billingPeriod === 'annual' ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: billingPeriod === 'annual' ? '600' : '400'
                }}
              >
                Annual
              </span>
              {billingPeriod === 'annual' && (
                <Badge 
                  className="ml-2"
                  style={{
                    backgroundColor: 'var(--success)',
                    color: 'var(--success-foreground)'
                  }}
                >
                  Save up to 23%
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative overflow-hidden transition-all hover:shadow-lg liquid-glass-card ${
              plan.unavailable ? 'opacity-70' : ''
            }`}
            style={{
              borderColor: plan.popular && !plan.unavailable ? 'var(--primary)' : 'var(--border)',
              borderWidth: plan.popular && !plan.unavailable ? '2px' : '1px'
            }}
          >
            {plan.popular && !plan.unavailable && (
              <div 
                className="absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)'
                }}
              >
                BEST VALUE
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: plan.name === 'Launch' ? 'var(--primary)' :
                                     plan.name === 'Grow' ? 'var(--success)' :
                                     'var(--energy)',
                      color: 'white'
                    }}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline gap-2">
                      <CardDescription className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                        {plan.billedAmount}
                      </CardDescription>
                      {plan.calculatedPrice && (
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          ({plan.calculatedPrice})
                        </span>
                      )}
                    </div>
                    {plan.saveAmount && !plan.unavailable && (
                      <Badge 
                        className="mt-1"
                        style={{
                          backgroundColor: 'var(--success)',
                          color: 'var(--success-foreground)'
                        }}
                      >
                        {plan.saveAmount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Auto-Renewal Notice */}
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <p><strong>Subscription:</strong> {plan.planTitle}</p>
                <p><strong>Length:</strong> {plan.subscriptionLength}</p>
                {plan.id !== 'studio_annual' && (
                  <p className="mt-1">Auto-renews unless cancelled 24 hours before period ends. Manage in iOS Settings.</p>
                )}
              </div>

              <Separator />

              {/* Unavailable Warning */}
              {plan.unavailable && (
                <Alert className="liquid-glass-warning border" style={{ borderColor: 'var(--energy)' }}>
                  <AlertCircle className="h-4 w-4" style={{ color: 'var(--energy)' }} />
                  <AlertDescription style={{ color: 'var(--foreground)' }}>
                    {plan.unavailableReason}
                  </AlertDescription>
                </Alert>
              )}

              {/* Features List */}
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Terms of Use Link for iOS Mobile */}
              {isMobile && isIOSApp && (
                <div className="text-center" style={{ paddingTop: 'var(--spacing-2)' }}>
                  <a 
                    href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs inline-flex items-center gap-1"
                    style={{ 
                      color: 'var(--primary)',
                      textDecoration: 'underline'
                    }}
                  >
                    Terms of Use (EULA)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              
              {/* Purchase Button */}
              <Button
                onClick={() => handlePurchase(plan)}
                disabled={plan.unavailable || (processing && selectedPlan === plan.id)}
                className="w-full font-semibold transition-all"
                style={{
                  backgroundColor: plan.unavailable 
                    ? 'var(--muted)' 
                    : '#000000',
                  color: plan.unavailable ? 'var(--muted-foreground)' : '#FFFFFF',
                  cursor: plan.unavailable ? 'not-allowed' : 'pointer',
                  fontWeight: 'var(--font-weight-bold)'
                }}
              >
                {processing && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : plan.unavailable ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Unavailable
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* REQUIRED LINKS - Privacy Policy and Terms of Use (EULA) */}
      <Card className="liquid-glass-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              By subscribing, you agree to our Terms of Use and Privacy Policy
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Button
                variant="link"
                size="sm"
                className="text-sm"
                onClick={() => {
                  // For iOS native app, open in system browser with full URL
                  if (window.location.protocol === 'capacitor:') {
                    window.open('https://www.cofounderplus.com/privacy-policy', '_blank');
                  } else {
                    // For web, use in-app navigation
                    window.open('/privacy-policy', '_blank');
                  }
                }}
                style={{ color: 'var(--primary)' }}
              >
                Privacy Policy
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-sm"
                onClick={() => {
                  // For iOS native app, open in system browser with full URL
                  if (window.location.protocol === 'capacitor:') {
                    window.open('https://www.cofounderplus.com/terms-of-service', '_blank');
                  } else {
                    // For web, use in-app navigation
                    window.open('/terms-of-service', '_blank');
                  }
                }}
                style={{ color: 'var(--primary)' }}
              >
                Terms of Use (EULA)
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <Separator />
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                disabled={restoring}
                className="text-sm"
              >
                {restoring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  'Restore Purchases'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}