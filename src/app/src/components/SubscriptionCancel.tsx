import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function SubscriptionCancel() {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate('/pricing');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleContactSupport = () => {
    // You can implement your support contact method here
    window.location.href = 'mailto:support@cofounderplus.com';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950 dark:via-orange-950 dark:to-yellow-950 flex items-center justify-center p-4">
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
            className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6"
          >
            <XCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Payment Cancelled
            </CardTitle>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              No worries! Your subscription upgrade was cancelled.
            </p>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                What happened?
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                You cancelled the payment process before completing your subscription upgrade. 
                No charges were made to your payment method.
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Your current plan
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You're still on your current plan with all existing features available. 
                You can upgrade anytime from your dashboard.
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleTryAgain}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                className="px-6 py-3 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            <div className="text-center">
              <Button
                onClick={handleContactSupport}
                variant="ghost"
                className="text-sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Need help? Contact Support
              </Button>
            </div>
          </motion.div>

          {/* Common Reasons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-center">Common reasons for cancellation:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-1">💳 Payment method issue</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Card declined or needs verification
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-1">🤔 Need more time to decide</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Compare plans or discuss with team
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-1">❓ Have questions</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Want to learn more about features
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-1">🔧 Technical issues</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Browser or connectivity problems
                </p>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="pt-6 border-t text-center space-y-2"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 You can always upgrade later from Settings → Subscription
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              30-day money-back guarantee on all plans
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}