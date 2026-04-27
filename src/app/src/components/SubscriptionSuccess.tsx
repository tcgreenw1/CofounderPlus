import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, Sparkles, Crown, Star, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshSubscriptions } = useCloudSubscription();
  const [loading, setLoading] = useState(true);
  
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan') || 'creator';
  
  const planDetails = {
    creator: {
      name: 'Creator',
      icon: Zap,
      color: 'from-blue-600 to-cyan-600',
      features: ['2 active businesses', 'Business OS access', 'Basic automation', 'Email support']
    },
    builder: {
      name: 'Builder', 
      icon: Crown,
      color: 'from-purple-600 to-pink-600',
      features: ['4 active businesses', 'Full Business OS', 'Advanced automation', 'Priority support']
    },
    studio: {
      name: 'Studio',
      icon: Star,
      color: 'from-yellow-500 to-orange-500', 
      features: ['8 active businesses', '3 team seats', 'Full API access', 'SLA support']
    }
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.creator;
  const PlanIcon = selectedPlan.icon;

  useEffect(() => {
    // Force refresh subscription status after successful payment
    const refreshSubscription = async () => {
      try {
        console.log('🎉 Payment successful! Refreshing subscription status...');
        
        // First, sync the subscription from the Stripe session
        if (sessionId) {
          try {
            const { data: { session: authSession } } = await supabase.auth.getSession();
            if (authSession?.access_token) {
              console.log('🔄 Syncing subscription from Stripe session:', sessionId);
              
              const syncResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/stripe-session/sync-from-session`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${authSession.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ sessionId })
                }
              );

              if (syncResponse.ok) {
                const syncResult = await syncResponse.json();
                console.log('✅ Subscription synced from Stripe:', syncResult);
              } else {
                console.error('⚠️ Failed to sync from Stripe session, will try refresh');
              }
            }
          } catch (syncError) {
            console.error('⚠️ Error syncing from Stripe session:', syncError);
          }
        }
        
        // Emit payment success event for other components to listen
        const paymentSuccessEvent = new CustomEvent('stripe-payment-success', {
          detail: { sessionId, plan, timestamp: Date.now() }
        });
        window.dispatchEvent(paymentSuccessEvent);
        console.log('🎉 Payment success event emitted for session:', sessionId);
        
        // Emit subscription sync event for CloudSubscriptionContext
        const subscriptionSyncEvent = new CustomEvent('manual-subscription-sync', {
          detail: { sessionId, plan, timestamp: Date.now() }
        });
        window.dispatchEvent(subscriptionSyncEvent);
        
        await refreshSubscriptions();
        
        // Wait a bit and refresh again to ensure Stripe webhooks have processed
        setTimeout(async () => {
          await refreshSubscriptions();
          console.log('🎉 Subscription refresh complete');
          
          // Emit another sync event after webhook processing delay
          window.dispatchEvent(new CustomEvent('manual-subscription-sync', {
            detail: { sessionId, plan, source: 'payment-success', timestamp: Date.now() }
          }));
          
          // Emit subscription updated event
          const subscriptionUpdatedEvent = new CustomEvent('subscription-updated', {
            detail: { sessionId, plan, source: 'payment-success', timestamp: Date.now() }
          });
          window.dispatchEvent(subscriptionUpdatedEvent);
          console.log('🎉 Subscription updated event emitted');
          
          setLoading(false);
        }, 3000); // Increased to 3 seconds to give more time for webhook processing
      } catch (error) {
        console.error('Error refreshing subscription:', error);
        // Don't stay loading forever if refresh fails
        setLoading(false);
      }
    };

    if (sessionId) {
      refreshSubscription();
    } else {
      // If no session ID, don't wait for refresh
      setLoading(false);
    }
  }, [refreshSubscriptions, sessionId]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1 
            }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              🎉 Payment Successful!
            </CardTitle>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Welcome to your new {selectedPlan.name} plan
            </p>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Plan Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-r ${selectedPlan.color} flex items-center justify-center mb-4`}>
              <PlanIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{selectedPlan.name} Plan</h2>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Sparkles className="w-3 h-3 mr-1" />
              Active Now
            </Badge>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-center text-lg">What's now unlocked:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedPlan.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Session Info */}
          {sessionId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Transaction ID: {sessionId.substring(0, 20)}...
              </p>
            </motion.div>
          )}

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center pt-4"
          >
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
            >
              Continue to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="pt-6 border-t text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🍎 Payment processed securely by Stripe
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Questions? Contact support anytime
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}