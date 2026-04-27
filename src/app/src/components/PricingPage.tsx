/**
 * PricingPage - Displays pricing plans and handles upgrade flow
 * @version 2.0.0 - Integrated with UpgradePaymentModal
 */
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { createDirectStripeCheckout } from '../utils/directStripeCheckout';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { isIAPAvailable } from '../utils/iapManager';
import { 
  CheckCircle, 
  Zap, 
  Crown, 
  Star, 
  Users, 
  Coins, 
  ArrowRight,
  Plus,
  Sparkles,
  Check,
  ArrowLeft,
  Loader2,
  X,
  Calendar
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  icon: any;
  color: string;
  badge?: string;
  popular?: boolean;
  description: string;
  features: string[];
  limits: {
    roadmaps: number | string;
    seats?: number | string;
    aiTasks: number | string;
    support: string;
  };
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    period: 'Free',
    icon: Sparkles,
    color: 'from-gray-500 to-gray-600',
    description: 'Get Started',
    features: [
      '1 business',
      'Limited tools & dashboards',
      '10 AI messages/month'
    ],
    limits: {
      roadmaps: 1,
      aiTasks: 10,
      support: 'Community'
    }
  },
  {
    id: 'creator',
    name: 'Launch',
    monthlyPrice: 19,
    annualPrice: 14.92,
    period: 'month',
    icon: Zap,
    color: '#00E0FF',
    badge: 'Solo Founders',
    description: 'Solo founders validating ideas — friction-free entry',
    features: [
      'Up to 2 businesses',
      'Full Business OS',
      '5k credits/month'
    ],
    limits: {
      roadmaps: 2,
      aiTasks: 500,
      support: 'Email'
    }
  },
  {
    id: 'builder',
    name: 'Grow',
    monthlyPrice: 49,
    annualPrice: 37.50,
    period: 'month',
    icon: Crown,
    color: '#6CFF6C',
    badge: 'Most Popular',
    popular: true,
    description: 'People actually running operations',
    features: [
      'Up to 10 businesses',
      'Unlimited integrations',
      '20k credits/month'
    ],
    limits: {
      roadmaps: 5,
      aiTasks: '2,000',
      support: 'Priority'
    }
  },
  {
    id: 'studio',
    name: 'Scale',
    monthlyPrice: 199,
    annualPrice: 159,
    period: 'month',
    icon: Star,
    color: '#FFCF00',
    badge: 'Small Teams',
    description: 'Agencies, studios, or startups running multiple ventures',
    features: [
      'Up to 50 businesses',
      '150k credits/month'
    ],
    limits: {
      roadmaps: 10,
      aiTasks: 10000,
      support: 'Executive'
    }
  }
];

const skipMarketplaceExamples = [
  { task: 'EIN and basic filings', credits: 79 },
  { task: 'One-page site and checkout', credits: 149 },
  { task: 'Edit 5 short videos', credits: 49 },
  { task: 'Lead list + 20 cold DMs', credits: 19 },
  { task: 'Set up Stripe Tax', credits: 39 }
];

const addOns = [
  { name: 'Extra AI tasks', price: 10, unit: 'per 1,000' },
  { name: 'Extra roadmaps', price: 10, unit: 'each per month' },
  { name: 'Extra seats on Studio', price: 12, unit: 'per seat' }
];

const faqs = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. Plans are month to month. Annual plans pro-rate at renewal.'
  },
  {
    question: 'Do unused AI tasks roll over?',
    answer: 'No. They reset monthly. Buy task packs if you need bursts.'
  },
  {
    question: 'Do credits roll over?',
    answer: 'Yes. Skip credits roll over for 12 months.'
  },
  {
    question: 'Do you take a cut of my sales?',
    answer: 'No. Your revenue is yours. Skip tasks and plans are fixed price.'
  },
  {
    question: 'Is my data safe?',
    answer: 'Yes. You connect your own Stripe and accounting. We read data with your permission.'
  }
];

export function PricingPage({ onSelectPlan }: { onSelectPlan?: (planId: string, billingPeriod?: 'monthly' | 'annual') => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { subscriptionData, isLoading, refreshSubscriptions } = useCloudSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  // Check if user is on iOS
  useEffect(() => {
    const isIOS = isIAPAvailable();
    setIsIOSDevice(isIOS);
    console.log('💳 PricingPage: iOS device detected:', isIOS);
  }, []);

  // Get user data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  // Determine current plan
  const currentPlan = subscriptionData?.plan || 'starter';
  const isCurrentlySubscribed = subscriptionData?.status === 'subscribed';
  
  // Helper to check if this is the user's current plan
  const isCurrentPlan = (planId: string) => {
    return currentPlan === planId && isCurrentlySubscribed;
  };
  
  // Helper to handle cancellation
  const handleCancelPlan = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to cancel your subscription');
      return;
    }

    try {
      setProcessingPlan(planId);
      console.log('❌ Canceling subscription for plan:', planId);

      // Check if user is on Apple IAP
      const isAppleUser = subscriptionData?.platform === 'apple' || subscriptionData?.platform === 'ios';
      
      if (isAppleUser) {
        // Show Apple cancellation instructions
        toast.info('Cancel Apple Subscription', {
          description: 'To cancel your subscription, go to Settings > [your name] > Subscriptions on your iOS device, then select Cofounder and tap Cancel Subscription.',
          duration: 10000
        });
        setProcessingPlan(null);
        return;
      }

      // For Stripe users, show contact support message
      toast.info('Cancel Subscription', {
        description: 'To cancel your subscription, please contact our support team at support@cofounderplus.com or use the chat support. We\'ll process your cancellation request immediately.',
        duration: 10000
      });
      setProcessingPlan(null);
    } catch (error: any) {
      console.error('❌ Cancel Error:', error);
      toast.error('Unable to process cancellation', {
        description: 'Please contact support@cofounderplus.com to cancel your subscription.'
      });
      setProcessingPlan(null);
    }
  };
  
  // Helper to determine button text and behavior
  const getButtonConfig = (planId: string) => {
    if (isCurrentPlan(planId)) {
      return {
        text: 'Cancel Plan',
        variant: 'destructive' as const,
        disabled: false,
        icon: X,
        onClick: () => handleCancelPlan(planId)
      };
    }
    
    if (planId === 'starter') {
      return {
        text: isCurrentlySubscribed ? 'Downgrade' : 'Get Started',
        variant: 'outline' as const,
        disabled: false,
        icon: ArrowRight,
        onClick: null
      };
    }
    
    return {
      text: isCurrentlySubscribed ? 'Switch Plan' : 'Get Started',
      variant: 'default' as const,
      disabled: false,
      icon: ArrowRight,
      onClick: null
    };
  };
  
  const getDisplayPrice = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return 'Free';
    
    if (billingPeriod === 'annual' && plan.id !== 'starter') {
      return `$${plan.annualPrice}/mo`;
    }
    
    return `$${plan.monthlyPrice}/mo`;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0 || billingPeriod === 'monthly') return null;
    
    const monthlyCost = plan.monthlyPrice;
    const annualCost = plan.annualPrice;
    const yearlyMonthlyCost = monthlyCost * 12;
    const yearlyAnnualCost = annualCost * 12;
    const savingsPercent = Math.round(((yearlyMonthlyCost - yearlyAnnualCost) / yearlyMonthlyCost) * 100);
    
    return `Save ${savingsPercent}%`;
  };

  const getBillingNote = (plan: PricingPlan) => {
    if (plan.monthlyPrice === 0) return null;
    
    if (billingPeriod === 'annual') {
      return `$${plan.annualPrice * 12}/year`;
    } else {
      return `Monthly billing`;
    }
  };



  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Back Button - if navigated from profile */}
      {location.state?.returnTo && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(location.state.returnTo)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {location.state.returnTo === '/profile' ? 'Profile' : 'Previous Page'}
          </Button>
        </div>
      )}

      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        {/* Animated background elements - hide on mobile */}
        <div className="absolute inset-0 overflow-hidden hidden md:block">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full opacity-20"
              style={{
                background: ['#00E0FF', '#FFCF00', '#FF4F4F', '#6CFF6C', '#4B00FF'][i],
                left: `${20 * i}%`,
                top: `${10 + (i % 2) * 20}%`
              }}
              animate={{
                y: [0, -20, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          ))}
        </div>

        {/* Header content */}
        <div className="relative z-10 px-4 text-center pt-4 md:pt-8 pb-6 md:pb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-block mb-3 md:mb-4"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full bg-[#00E0FF] opacity-20 blur-xl"
              />
              <div className="relative bg-white dark:bg-gray-800 rounded-full p-3 md:p-4 border-4 border-[#00E0FF]">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-[#00E0FF]" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-gray-900 dark:text-white px-2"
          >
            Pricing that grows with you
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm md:text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6 md:mb-8 px-4"
          >
            Choose the plan that fits your business needs
          </motion.p>
          
          {/* Billing Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8 px-4">
            <div className="flex items-center gap-3">
              <span className={`text-sm md:text-base ${billingPeriod === 'monthly' ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                Monthly
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative"
              >
                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                  billingPeriod === 'annual' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div 
                    className="w-5 h-5 rounded-full transition-transform duration-200 transform mt-0.5"
                    style={{
                      backgroundColor: 'var(--background)',
                      transform: billingPeriod === 'annual' ? 'translateX(1.5rem)' : 'translateX(0.125rem)'
                    }}
                  />
                </div>
              </Button>
              <span className={`text-sm md:text-base ${billingPeriod === 'annual' ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                Annual
              </span>
            </div>
            {billingPeriod === 'annual' && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                Save up to $50/mo
              </Badge>
            )}
          </div>
          
          {billingPeriod === 'monthly' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 md:p-4 mb-6 md:mb-8 max-w-md mx-auto mx-4">
              <p className="text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
                Switch to annual billing to save money and get better value
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-3 md:px-4">
        {/* Current Subscription Info - Show if user has active subscription */}
        {isCurrentlySubscribed && subscriptionData?.subscription && (
          <Card className="mb-6 glass-morphism border-2" style={{ borderColor: 'var(--success)' }}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--success-soft)' }}
                  >
                    <CheckCircle className="w-6 h-6" style={{ color: 'var(--success)' }} />
                  </div>
                  <div>
                    <CardTitle style={{ color: 'var(--foreground)' }}>
                      Active Subscription
                    </CardTitle>
                    <CardDescription style={{ color: 'var(--muted-foreground)' }}>
                      {subscriptionData.plan 
                        ? `${
                            subscriptionData.plan === 'creator' ? 'Launch' :
                            subscriptionData.plan === 'builder' ? 'Grow' :
                            subscriptionData.plan === 'studio' ? 'Scale' :
                            subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1)
                          } Plan` 
                        : 'Current Plan'}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: 'var(--success)',
                    color: 'var(--success-foreground)'
                  }}
                >
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptionData.subscription.current_period_start && subscriptionData.subscription.current_period_end && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Current Period Started
                      </span>
                    </div>
                    <p style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {new Date(subscriptionData.subscription.current_period_start * 1000).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Renews On
                      </span>
                    </div>
                    <p style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {new Date(subscriptionData.subscription.current_period_end * 1000).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* iOS Scale Annual Warning */}
        {isIOSDevice && billingPeriod === 'annual' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6 max-w-3xl mx-auto"
          >
            <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
              <strong>iOS Users:</strong> Annual billing for the Scale plan is not available through the iOS app due to Apple's $999.99 limit on in-app purchases. Please choose monthly billing for Scale, or contact us at support@cofounderplus.com to set up annual billing directly.
            </p>
          </motion.div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {plans.filter(plan => plan.id !== 'starter').map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const buttonConfig = getButtonConfig(plan.id);
            
            // Disable Scale annual on iOS
            const isScaleAnnualOnIOS = plan.id === 'studio' && billingPeriod === 'annual' && isIOSDevice;
            const isButtonDisabled = buttonConfig.disabled || isLoading || processingPlan === plan.id || isScaleAnnualOnIOS;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden ${
                  isCurrent 
                    ? 'ring-2 ring-green-500 shadow-lg md:scale-105 bg-green-50/50 dark:bg-green-900/20' 
                    : plan.popular 
                    ? 'ring-2 ring-primary shadow-lg md:scale-105' 
                    : ''
                } ${isScaleAnnualOnIOS ? 'opacity-75' : ''} glass-morphism transition-all duration-200`}
              >
                {isCurrent && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                      Current Plan
                    </Badge>
                  </div>
                )}
                {plan.popular && !isCurrent && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 whitespace-nowrap">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
              
              <CardHeader className={`text-center pb-3 ${isCurrent || plan.popular ? 'pt-10' : 'pt-4'}`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 ${typeof plan.color === 'string' && plan.color.startsWith('#') ? '' : `bg-gradient-to-r ${plan.color}`} rounded-lg mx-auto mb-3 flex items-center justify-center`}
                  style={typeof plan.color === 'string' && plan.color.startsWith('#') ? { 
                    backgroundColor: `${plan.color}40`, 
                    color: 'var(--foreground)', // Use foreground color instead of plan color for better dark mode visibility
                    border: `2px solid ${plan.color}60` 
                  } : {}}
                >
                  {React.createElement(plan.icon, { className: "w-5 h-5 md:w-6 md:h-6", style: typeof plan.color === 'string' && plan.color.startsWith('#') ? { color: 'var(--foreground)' } : {} })}
                </div>
                
                <CardTitle className="text-xl md:text-2xl">{plan.name}</CardTitle>
                <div className="space-y-0.5">
                  <div className="text-2xl md:text-3xl font-bold">{getDisplayPrice(plan)}</div>
                  {getBillingNote(plan) && (
                    <div className="text-[10px] md:text-xs text-muted-foreground">{getBillingNote(plan)}</div>
                  )}
                  {getSavings(plan) && (
                    <div className="text-xs md:text-sm text-green-600 font-medium">{getSavings(plan)}</div>
                  )}
                </div>
                <CardDescription className="text-xs md:text-sm px-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3 pb-4">
                <ul className="space-y-1.5 md:space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs md:text-sm">
                      <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full text-sm ${
                    isCurrent 
                      ? '' 
                      : plan.popular && !isCurrent 
                      ? 'bg-primary' 
                      : ''
                  }`}
                  variant={buttonConfig.variant}
                  disabled={isButtonDisabled}
                  onClick={async () => {
                    // Use custom onClick if provided (e.g., for cancel button)
                    if (buttonConfig.onClick) {
                      buttonConfig.onClick();
                      return;
                    }
                    
                    if (!buttonConfig.disabled) {
                      // If onSelectPlan callback is provided, use it (for external integrations)
                      if (onSelectPlan) {
                        onSelectPlan(plan.id, billingPeriod);
                      } else {
                        // Pricing page is viewed in browser, go directly to Stripe checkout
                        // (Apple modal only needed in iOS app context, not on web)
                        if (plan.id !== 'starter' && user) {
                          try {
                            setProcessingPlan(plan.id);
                            console.log('🚀 PricingPage: Creating Stripe checkout for plan:', plan.id, 'billing period:', billingPeriod);
                            
                            await createDirectStripeCheckout({
                              planId: plan.id as 'creator' | 'builder' | 'studio',
                              billingPeriod,
                              user,
                              successUrl: `${window.location.origin}/profile?upgrade=success`,
                              cancelUrl: `${window.location.origin}/pricing`
                            });
                          } catch (error) {
                            console.error('🚀 PricingPage: Failed to create checkout:', error);
                            toast.error('Failed to create checkout session. Please try again.');
                            setProcessingPlan(null);
                          }
                        }
                      }
                    }
                  }}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isCurrent ? 'Canceling...' : 'Redirecting...'}
                    </>
                  ) : (
                    <>
                      {buttonConfig.text}
                      {React.createElement(buttonConfig.icon, { className: "w-3.5 h-3.5 md:w-4 md:h-4 ml-2" })}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}