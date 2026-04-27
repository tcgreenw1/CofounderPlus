import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { 
  CreditCard, 
  Crown, 
  Zap, 
  Star, 
  Sparkles,
  TrendingUp,
  Gift,
  CheckCircle,
  ArrowRight,
  Calendar,
  DollarSign
} from 'lucide-react';

interface SubscriptionStatusWidgetProps {
  user: any;
  className?: string;
}

export function SubscriptionStatusWidget({ user, className }: SubscriptionStatusWidgetProps) {
  const navigate = useNavigate();
  const { subscriptionData, isLoading } = useCloudSubscription();

  const planIcons = {
    starter: Sparkles,
    creator: Zap,
    builder: Crown,
    studio: Star
  };

  const planColors = {
    starter: 'from-gray-500 to-gray-600',
    creator: 'from-blue-600 to-cyan-600',
    builder: 'from-purple-600 to-pink-600',
    studio: 'from-yellow-500 to-orange-500'
  };

  const getCurrentPlan = () => {
    if (!subscriptionData || subscriptionData.status === 'free') {
      return {
        id: 'starter',
        name: 'Starter',
        price: 'Free',
        icon: Sparkles,
        color: 'from-gray-500 to-gray-600'
      };
    }
    
    let planId = subscriptionData.plan;
    if (planId === 'standard') planId = 'creator'; // Legacy mapping
    
    const planNames = {
      starter: 'Starter',
      creator: 'Creator',
      builder: 'Builder',
      studio: 'Studio'
    };

    const planPrices = {
      starter: 'Free',
      creator: '$15/month',
      builder: '$49/month',
      studio: '$199/month'
    };

    return {
      id: planId,
      name: planNames[planId] || 'Unknown',
      price: planPrices[planId] || 'Unknown',
      icon: planIcons[planId] || Sparkles,
      color: planColors[planId] || 'from-gray-500 to-gray-600'
    };
  };

  const currentPlan = getCurrentPlan();
  const isSubscribed = subscriptionData?.status !== 'free';
  const isTrial = subscriptionData?.status === 'trial';

  if (isLoading) {
    return (
      <Card className={`glass-morphism ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div>
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`glass-morphism hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${currentPlan.color} rounded-xl flex items-center justify-center`}>
              {React.createElement(currentPlan.icon, { className: "w-5 h-5 text-white" })}
            </div>
            <div>
              <CardTitle className="text-lg">
                {isTrial ? `${currentPlan.name} Trial` : currentPlan.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                {currentPlan.price}
                {isTrial && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Trial
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          {isSubscribed && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {isTrial && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Calendar className="w-4 h-4" />
                <span>Free trial active</span>
              </div>
            </div>
          )}
          
          {!isSubscribed && !isTrial && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mb-2">
                <Gift className="w-4 h-4" />
                <span>Start your free trial</span>
              </div>
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/subscription-dashboard');
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Gift className="w-3 h-3 mr-2" />
                7-Day Free Trial
              </Button>
            </div>
          )}
          
          {currentPlan.id !== 'studio' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/subscription-dashboard');
              }}
              className="w-full"
            >
              <TrendingUp className="w-3 h-3 mr-2" />
              Upgrade Plan
              <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/subscription-dashboard');
            }}
            className="w-full text-xs"
          >
            Manage Subscription
            <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}