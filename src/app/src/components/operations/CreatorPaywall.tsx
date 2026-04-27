import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { upgradeToCreator } from '../../utils/directStripeCheckout';
import { toast } from 'sonner@2.0.3';
import { 
  Crown, 
  Lock, 
  Star, 
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Package,
  Megaphone,
  ShoppingCart,
  CreditCard,
  UserCheck,
  Check,
  X,
  Loader2
} from 'lucide-react';

interface CreatorPaywallProps {
  isCreatorOrHigher: boolean;
  operationType: 'product' | 'marketing' | 'sales' | 'finance' | 'hr';
  onUpgrade?: () => void; // Make optional since we'll handle direct checkout
  user?: any; // Add user prop for direct checkout
  children: React.ReactNode;
}

const operationConfig = {
  product: {
    title: 'Product Operations',
    icon: Package,
    description: 'Advanced product development, roadmapping, and lifecycle management',
    color: 'from-blue-500 to-indigo-500'
  },
  marketing: {
    title: 'Marketing Operations',
    icon: Megaphone,
    description: 'Comprehensive campaign management, lead generation, and growth optimization',
    color: 'from-green-500 to-emerald-500'
  },
  sales: {
    title: 'Sales Operations',
    icon: ShoppingCart,
    description: 'Advanced pipeline management, deal tracking, and revenue optimization',
    color: 'from-orange-500 to-red-500'
  },
  finance: {
    title: 'Finance Operations',
    icon: CreditCard,
    description: 'Complete financial planning, budgeting, and cash flow management',
    color: 'from-purple-500 to-pink-500'
  },
  hr: {
    title: 'Human Resources',
    icon: UserCheck,
    description: 'Comprehensive team management, hiring, and culture building',
    color: 'from-cyan-500 to-blue-500'
  }
};

const creatorFeatures = [
  'Advanced templates and workflows',
  'Data analytics and insights',
  'Automation tools',
  'Priority support',
  'Custom integrations',
  'Team collaboration features'
];

const planComparison = [
  { feature: 'Basic roadmap access', free: true, creator: true },
  { feature: 'Operations tools access', free: true, creator: true },
  { feature: 'Basic templates', free: true, creator: true },
  { feature: 'Advanced templates', free: false, creator: true },
  { feature: 'Analytics & insights', free: false, creator: true },
  { feature: 'Automation workflows', free: false, creator: true },
  { feature: 'Team collaboration', free: false, creator: true },
  { feature: 'Priority support', free: false, creator: true },
  { feature: 'Custom integrations', free: false, creator: true },
];

export const CreatorPaywall: React.FC<CreatorPaywallProps> = ({
  isCreatorOrHigher,
  operationType,
  onUpgrade,
  user,
  children
}) => {
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const config = operationConfig[operationType];
  const IconComponent = config.icon;

  // Handle direct upgrade to Creator plan
  const handleDirectUpgrade = async () => {
    if (!user) {
      toast.error('Please log in to upgrade your plan');
      return;
    }

    try {
      setUpgrading(true);
      console.log('🚀 CreatorPaywall: Starting direct upgrade to Creator...');
      
      // Use direct checkout - defaults to monthly billing
      await upgradeToCreator(user, 'monthly');
      
      // If we get here, checkout creation failed (redirect should happen)
      console.log('🚀 CreatorPaywall: Checkout redirect should have happened');
      
    } catch (error) {
      console.error('🚀 CreatorPaywall: Upgrade failed:', error);
      setUpgrading(false);
      toast.error('Failed to start checkout process. Please try again.');
      
      // Fallback to traditional modal if provided
      if (onUpgrade) {
        console.log('🚀 CreatorPaywall: Falling back to traditional upgrade flow');
        onUpgrade();
      }
    }
  };

  // If user has Creator plan or higher, show full content
  if (isCreatorOrHigher) {
    return <>{children}</>;
  }

  // If user is on free plan, show preview with upgrade prompt
  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Gradient overlay for preview effect */}
        <div className="relative">
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-white/95 dark:to-gray-900/95 pointer-events-none" />
          
          {/* Upgrade prompt overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-6">
            <Card className="glass-morphism border border-white/20 dark:border-gray-700/20 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${config.color}`} />
              
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.color} mx-auto flex items-center justify-center text-white`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                      Unlock Full {config.title}
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Creator
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {config.description}
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-6 max-w-md mx-auto">
                    {creatorFeatures.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                        $15
                        <span className="text-lg font-normal text-purple-700 dark:text-purple-300">/month</span>
                      </div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        Creator Plan - Everything you need to scale
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleDirectUpgrade}
                      disabled={upgrading}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
                    >
                      {upgrading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Opening Checkout...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Creator
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex-1 border-purple-200 dark:border-purple-700"
                      onClick={() => setShowPlanComparison(true)}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Compare Plans
                    </Button>
                  </div>

                  {/* Benefits */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Zap className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        10x Faster
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        Advanced automation
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Target className="w-5 h-5 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-900 dark:text-green-100">
                        Better Results
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        Data-driven insights
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        Scale Ready
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        Team collaboration
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Plan Comparison Modal */}
      <Dialog open={showPlanComparison} onOpenChange={setShowPlanComparison}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              Compare Plans
            </DialogTitle>
            <DialogDescription>
              Choose the plan that's right for your business needs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Plan Headers */}
            <div className="grid grid-cols-3 gap-4">
              <div></div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Starter</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Free</p>
                <p className="text-sm text-gray-500">Forever</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">Creator</h3>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">$15</p>
                <p className="text-sm text-purple-600">per month</p>
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="space-y-3">
              {planComparison.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="text-sm text-gray-700 dark:text-gray-300">{item.feature}</div>
                  <div className="text-center">
                    {item.free ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </div>
                  <div className="text-center">
                    {item.creator ? (
                      <Check className="w-5 h-5 text-purple-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" disabled>
                Current Plan
              </Button>
              <Button 
                onClick={() => {
                  setShowPlanComparison(false);
                  handleDirectUpgrade();
                }}
                disabled={upgrading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};