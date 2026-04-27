import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
  UserCheck
} from 'lucide-react';

interface OperationsGateWrapperProps {
  isProUser: boolean;
  operationType: 'product' | 'marketing' | 'sales' | 'finance' | 'hr';
  onUpgrade: () => void;
  children: React.ReactNode;
}

const operationConfig = {
  product: {
    title: 'Product Operations',
    icon: Package,
    description: 'Product development, roadmapping, and lifecycle management',
    demoTitle: 'Product Development Dashboard',
    demoDescription: 'Build and ship products customers love with data-driven insights.',
    features: ['Product Roadmap Builder', 'Feature Prioritization Matrix', 'User Story Templates', 'Launch Checklists'],
    color: 'from-blue-500 to-indigo-500'
  },
  marketing: {
    title: 'Marketing Operations',
    icon: Megaphone,
    description: 'Campaign management, lead generation, and growth optimization',
    demoTitle: 'Marketing Campaign Hub',
    demoDescription: 'Scale your reach and convert leads with proven frameworks.',
    features: ['Campaign Templates', 'Content Calendar', 'Lead Scoring', 'A/B Testing Tools'],
    color: 'from-green-500 to-emerald-500'
  },
  sales: {
    title: 'Sales Operations',
    icon: ShoppingCart,
    description: 'Pipeline management, deal tracking, and revenue optimization',
    demoTitle: 'Sales Pipeline Manager',
    demoDescription: 'Close more deals with systematic sales processes.',
    features: ['CRM Integration', 'Sales Scripts', 'Deal Tracking', 'Revenue Analytics'],
    color: 'from-orange-500 to-red-500'
  },
  finance: {
    title: 'Finance Operations',
    icon: CreditCard,
    description: 'Financial planning, budgeting, and cash flow management',
    demoTitle: 'Financial Control Center',
    demoDescription: 'Manage cash flow and make informed financial decisions.',
    features: ['Budget Planning', 'Expense Tracking', 'Financial Reports', 'Investor Dashboards'],
    color: 'from-purple-500 to-pink-500'
  },
  hr: {
    title: 'Human Resources',
    icon: UserCheck,
    description: 'Team management, hiring, and culture building',
    demoTitle: 'People Operations Center',
    demoDescription: 'Build and manage high-performing teams.',
    features: ['Hiring Workflows', 'Performance Reviews', 'Team Building', 'Culture Metrics'],
    color: 'from-cyan-500 to-blue-500'
  }
};

export const OperationsGateWrapper: React.FC<OperationsGateWrapperProps> = ({
  isProUser,
  operationType,
  onUpgrade,
  children
}) => {
  const config = operationConfig[operationType];
  const IconComponent = config.icon;

  // If user is Pro, show full content
  if (isProUser) {
    return <>{children}</>;
  }

  // If user is Free, show demo card with upgrade button
  return (
    <div className="space-y-6 p-6">
      {/* Demo Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-morphism border border-white/20 dark:border-gray-700/20 overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${config.color}`} />
          
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${config.color} text-white`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {config.title}
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {config.description}
                  </p>
                </div>
              </div>
              
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Demo Preview */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <div className="mb-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.color} mx-auto flex items-center justify-center text-white`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {config.demoTitle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {config.demoDescription}
                  </p>
                  
                  {/* Feature List */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {config.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upgrade Section */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      Unlock Full {config.title}
                    </h4>
                  </div>
                  
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                    Get access to advanced tools, templates, and automation features designed to scale your business operations.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={onUpgrade}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex-1 border-purple-200 dark:border-purple-700"
                      onClick={() => {
                        // Show features comparison or pricing
                        console.log('Show pricing comparison');
                      }}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Compare Plans
                    </Button>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    10x Faster
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Pre-built templates
                  </div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Target className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-900 dark:text-green-100">
                    Proven Systems
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    Battle-tested workflows
                  </div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Scale Ready
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    Automation tools
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};