/**
 * MobileUpgradeModal - In-App Purchase modal for mobile users
 * Shows pricing plans and handles IAP flow for iOS/Android
 * Supports both PRODUCTION and TEST/SANDBOX modes
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Crown, Zap, Sparkles, Loader2, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { isIAPAvailable, purchaseProduct, restorePurchases, initializeIAP, IAP_PRODUCT_IDS } from '../utils/iapManager';

interface MobileUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  onUpgradeSuccess?: () => void;
  testMode?: boolean; // NEW: Enable test/sandbox mode
}

interface Plan {
  id: string;
  productId: string;
  name: string;
  price: number;
  period: 'monthly' | 'annual';
  displayPrice: string;
  saveAmount?: string;
  color: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'creator_monthly',
    productId: IAP_PRODUCT_IDS.LAUNCH_MONTHLY,
    name: 'Launch',
    price: 19,
    period: 'monthly',
    displayPrice: '$19/mo',
    color: '#00E0FF',
    icon: <Sparkles className="w-6 h-6" />,
    popular: true,
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
    price: 49,
    period: 'monthly',
    displayPrice: '$49/mo',
    color: '#6CFF6C',
    icon: <Zap className="w-6 h-6" />,
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
    price: 199,
    period: 'monthly',
    displayPrice: '$199/mo',
    color: '#FFCF00',
    icon: <Star className="w-6 h-6" />,
    features: [
      'Up to 50 businesses',
      '150k credits/month'
    ]
  }
];

export function MobileUpgradeModal({ isOpen, onClose, currentPlan = 'free', onUpgradeSuccess, testMode }: MobileUpgradeModalProps) {
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [iapReady, setIapReady] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);

  // Initialize IAP when modal opens
  useEffect(() => {
    if (isOpen && isIAPAvailable()) {
      console.log('🔧 IAP: Modal opened, initializing...');
      setIapReady(false);
      setIapError(null);
      
      initializeIAP()
        .then(() => {
          console.log('✅ IAP: Initialization successful, ready for purchases');
          setIapReady(true);
        })
        .catch((error) => {
          console.error('❌ IAP: Initialization failed:', error);
          
          // Provide helpful error message based on cordova-plugin-purchase errors
          let userMessage = 'Failed to initialize in-app purchases';
          
          if (error.message?.includes('cordova-plugin-purchase not loaded')) {
            userMessage = 'In-app purchases are not available. Please ensure you are using a native iOS build with cordova-plugin-purchase installed.';
          } else if (error.message?.includes('Not running on iOS native platform')) {
            userMessage = 'In-app purchases are only available on iOS. Please upgrade on desktop at cofounderplus.com';
          } else if (error.message?.includes('CdvPurchase')) {
            userMessage = 'StoreKit plugin not loaded. Please ensure you are running the app on a physical iOS device or App Store build.';
          } else if (error.message?.includes('Store object not available')) {
            userMessage = 'Unable to connect to App Store. Please check your network connection and try again.';
          } else if (error.message) {
            // Show the actual error message for debugging
            userMessage = `IAP Error: ${error.message}`;
          }
          
          setIapError(userMessage);
          setIapReady(false);
          
          // Show toast notification
          toast.error('In-App Purchases Unavailable', {
            description: userMessage,
            duration: 6000,
          });
        });
    } else if (!isOpen) {
      // Reset state when modal closes
      setIapReady(false);
      setIapError(null);
    } else if (isOpen && !isIAPAvailable()) {
      // Not on iOS - show helpful message
      console.log('⚠️ IAP: Not available (not on iOS)');
      setIapError('In-app purchases are only available on iOS. Please upgrade on desktop at cofounderplus.com');
    }
  }, [isOpen]);

  // Filter plans based on selected billing period and iOS restrictions
  const filteredPlans = plans.filter(plan => {
    // Filter by billing period
    if (plan.period !== billingPeriod) return false;
    
    // For iOS users: Disable Scale annual plan (Apple's $999.99 IAP limit)
    // Scale annual = $159/mo * 12 = $1,908/year (exceeds Apple's limit)
    if (isIAPAvailable() && plan.id === 'studio_annual') {
      console.log('💳 IAP: Filtering out Scale annual plan for iOS (exceeds Apple $999.99 limit)');
      return false;
    }
    
    return true;
  });

  const handlePurchase = async (plan: Plan) => {
    setProcessing(true);
    setSelectedPlan(plan.id);

    try {
      console.log('🛒 IAP: Starting purchase flow for plan:', plan.id, plan.productId);
      
      // Check if IAP is available
      if (!isIAPAvailable()) {
        const platform = (window as any).Capacitor?.getPlatform() || 'unknown';
        const isNative = (window as any).Capacitor?.isNativePlatform() || false;
        const userAgent = navigator.userAgent;
        
        console.error('❌ IAP: Not available!', {
          platform,
          isNative,
          userAgent,
          capacitorExists: !!(window as any).Capacitor
        });
        
        toast.error('IAP Not Available', {
          description: `Platform: ${platform}, Native: ${isNative}. Please contact support if you're seeing this in the iOS app.`,
          duration: 8000
        });
        setProcessing(false);
        setSelectedPlan(null);
        return;
      }

      // Purchase the product
      console.log('🛒 IAP: Purchasing product:', plan.productId);
      const purchaseResult = await purchaseProduct(plan.productId);
      
      if (!purchaseResult.success) {
        throw new Error(purchaseResult.error || 'Purchase failed');
      }

      console.log('✅ IAP: Purchase successful, syncing with backend...');

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // Sync purchase with backend - use native IAP receipt
      const syncResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/iap/validate-receipt`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receipt: purchaseResult.transaction?.receipt,
            productId: purchaseResult.transaction?.productId,
            transactionId: purchaseResult.transaction?.transactionId,
            userId: session.user.id,
          }),
        }
      );

      const syncData = await syncResponse.json();

      if (!syncResponse.ok || !syncData.success) {
        console.error('❌ IAP: Failed to sync purchase with backend:', syncData);
        throw new Error(syncData.error || 'Failed to sync purchase with backend');
      }

      console.log('✅ IAP: Purchase synced successfully with backend');
      
      toast.success('Purchase Successful!', {
        description: `You've been upgraded to ${plan.name}!`,
        duration: 5000
      });
      
      if (onUpgradeSuccess) {
        onUpgradeSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('❌ IAP Error:', error);
      toast.error('Purchase Failed', {
        description: error.message || 'Please try again later',
        duration: 5000
      });
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    setProcessing(true);
    
    try {
      console.log('🔄 IAP: Restoring purchases...')
      
      // Check if IAP is available
      if (!isIAPAvailable()) {
        throw new Error('In-App Purchases are not available on this device');
      }

      // Restore purchases using native IAP
      const restoreResult = await restorePurchases();
      
      if (!restoreResult.success || !restoreResult.transactions) {
        throw new Error(restoreResult.error || 'No purchases found to restore');
      }

      console.log('✅ IAP: Purchases restored, syncing with backend...');

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // Check if user has active transactions
      if (restoreResult.transactions.length === 0) {
        toast.info('No Active Subscriptions', {
          description: 'No active subscriptions found to restore',
          duration: 5000
        });
        return;
      }

      // Get the first transaction to restore
      const transaction = restoreResult.transactions[0];
      console.log('📦 IAP: Restoring transaction:', transaction.productId);

      // Validate receipt with backend
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
        console.error('❌ IAP: Failed to sync restored purchase:', syncData);
        throw new Error(syncData.error || 'Failed to sync restored purchase');
      }

      toast.success('Purchases Restored!', {
        description: 'Your subscription has been restored',
        duration: 5000
      });
      
      if (onUpgradeSuccess) {
        onUpgradeSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('❌ IAP Restore Error:', error);
      toast.error('Restore Failed', {
        description: error.message || 'No purchases found to restore',
        duration: 5000
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 border-2 border-[#4B00FF] [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b-2 border-[#FFCF00]" style={{ backgroundColor: testMode ? '#FF6B00' : '#4B00FF' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFCF00' }}>
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-white text-xl">Upgrade Your Plan</DialogTitle>
                  {testMode && (
                    <Badge 
                      className="px-2 py-1 text-xs font-bold animate-pulse"
                      style={{ backgroundColor: '#FFCF00', color: '#000' }}
                    >
                      TEST MODE ⚠️
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-white/90 text-sm">
                  {testMode ? 'Testing with Sandbox RevenueCat API' : 'Choose the perfect plan for your business'}
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              disabled={processing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Current Plan Badge */}
          {currentPlan !== 'free' && (
            <div className="text-center">
              <Badge 
                className="px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: '#4B00FF', color: 'white' }}
              >
                Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Badge>
            </div>
          )}

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-gray-700 shadow-md text-[#4B00FF]'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all relative ${
                billingPeriod === 'annual'
                  ? 'bg-white dark:bg-gray-700 shadow-md text-[#4B00FF]'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Annual
              <span 
                className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: '#6CFF6C', color: '#000' }}
              >
                SAVE
              </span>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="space-y-4">
            {/* Show IAP initialization status */}
            {isIAPAvailable() && !iapReady && !iapError && (
              <div className="text-center py-4 px-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Initializing In-App Purchases...
                </p>
              </div>
            )}
            
            {/* Show IAP error */}
            {iapError && (
              <div className="text-center py-4 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Error:</strong> {iapError}
                </p>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => {
                      setIapError(null);
                      setIapReady(false);
                      initializeIAP()
                        .then(() => {
                          console.log('✅ IAP: Retry successful');
                          setIapReady(true);
                        })
                        .catch((error) => {
                          console.error('❌ IAP: Retry failed:', error);
                          setIapError(error.message || 'Failed to initialize IAP');
                        });
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline font-medium"
                  >
                    Retry IAP
                  </button>
                  <span className="text-xs text-gray-400">•</span>
                  <button 
                    onClick={() => {
                      // Open web pricing page in browser
                      window.open('https://www.cofounderplus.com/#/pricing', '_blank');
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium"
                  >
                    Use Web Payment Instead
                  </button>
                </div>
              </div>
            )}
            
            {filteredPlans.map((plan, index) => {
              const isProcessingThisPlan = processing && selectedPlan === plan.id;
              const isCurrentPlan = currentPlan.toLowerCase() === plan.name.toLowerCase();
              const isGrowPlan = plan.name === 'Grow';
              const isDisabled = processing || isCurrentPlan || (isIAPAvailable() && !iapReady);
              
              return (
                <React.Fragment key={plan.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    {plan.popular && (
                      <div 
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white z-10"
                        style={{ backgroundColor: plan.color }}
                      >
                        BEST VALUE
                      </div>
                    )}
                    
                    <div 
                      className={`border-2 rounded-2xl overflow-hidden transition-all ${
                        plan.popular ? 'shadow-lg' : ''
                      } ${isCurrentPlan ? 'opacity-60' : ''}`}
                      style={{ borderColor: plan.color }}
                    >
                      {/* Content */}
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                            >
                              {plan.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{plan.name}</h3>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {plan.period === 'annual' ? 'Billed Annually' : 'Billed Monthly'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-2xl" style={{ color: plan.color }}>
                              {plan.displayPrice}
                            </div>
                            {plan.saveAmount && (
                              <div className="text-xs font-semibold text-green-600">
                                {plan.saveAmount}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-2 mb-4">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Check className="w-4 h-4 flex-shrink-0" style={{ color: plan.color }} />
                              <span className="text-sm text-gray-800 dark:text-gray-200">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* CTA Button */}
                        <Button
                          className="w-full h-12 rounded-xl font-bold text-white bouncy-button"
                          style={{ backgroundColor: plan.color, color: plan.color === '#6CFF6C' ? '#000' : '#fff' }}
                          onClick={() => handlePurchase(plan)}
                          disabled={isDisabled}
                        >
                          {isProcessingThisPlan ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isCurrentPlan ? (
                            'Current Plan'
                          ) : (
                            <>
                              Upgrade to {plan.name}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>

                  {/* iOS Scale Annual Info - Show after Grow plan */}
                  {isGrowPlan && isIAPAvailable() && billingPeriod === 'annual' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Annual billing for the Scale plan is not available due to Apple's $999.99 in-app purchase limit. For annual Scale billing, please use monthly billing or contact support@cofounderplus.com.
                      </p>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Restore Purchases */}
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              onClick={handleRestorePurchases}
              disabled={processing}
              className="w-full text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2 font-medium"
            >
              {processing && !selectedPlan ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                'Restore Purchases'
              )}
            </button>
          </div>

          {/* Cancel Subscription - Apple IAP Instructions */}
          <div className="pt-2">
            <button
              onClick={() => {
                toast.info('Cancel Apple Subscription', {
                  description: 'To cancel your subscription, go to Settings > [your name] > Subscriptions on your iOS device, then select Cofounder and tap Cancel Subscription.',
                  duration: 10000
                });
              }}
              disabled={processing}
              className="w-full text-sm text-red-600 hover:text-red-700 transition-colors py-2"
            >
              Cancel Subscription
            </button>
          </div>

          {/* Terms */}
          <div className="text-xs text-center text-gray-600 dark:text-gray-400 space-y-1">
            <p>Payment will be charged to your App Store or Google Play account</p>
            <p>Subscription automatically renews unless auto-renew is turned off</p>
            <p className="pt-2 font-semibold text-gray-700 dark:text-gray-300">To cancel, manage your subscription in iOS/Android Settings</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}