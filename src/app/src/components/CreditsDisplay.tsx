import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, AlertTriangle, TrendingUp, Calendar, DollarSign, Settings } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { getCreditsSummary, CreditsSummary } from '../utils/creditsApi';
import { useBusiness } from './BusinessContext';
import { useCloudSubscription } from './CloudSubscriptionContext';

interface CreditsDisplayProps {
  variant?: 'compact' | 'detailed' | 'inline';
  showUpgrade?: boolean;
  className?: string;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ 
  variant = 'compact',
  showUpgrade = true,
  className = ''
}) => {
  const [creditsSummary, setCreditsSummary] = useState<CreditsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedBusiness } = useBusiness();
  const { subscriptionData } = useCloudSubscription();

  useEffect(() => {
    loadCreditsSummary();
  }, [selectedBusiness?.id]);

  const loadCreditsSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await getCreditsSummary(selectedBusiness?.id);
      setCreditsSummary(summary);
    } catch (err) {
      console.error('Failed to load credits summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 bg-primary/20 rounded animate-pulse" />
        <div className="h-4 w-16 bg-primary/20 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !creditsSummary) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Credits unavailable
      </div>
    );
  }

  const {
    remainingCredits,
    monthlyUsage,
    dailyUsage,
    subscriptionLimits,
    subscriptionPlan,
    overageCostPerCredit,
  } = creditsSummary;

  const monthlyPercentage = Math.min(100, (monthlyUsage / subscriptionLimits.monthlyCredits) * 100);
  const dailyPercentage = Math.min(100, (dailyUsage / subscriptionLimits.dailyCredits) * 100);
  
  const isNearLimit = monthlyPercentage > 80 || dailyPercentage > 80;
  const isOverLimit = subscriptionLimits.overage;

  // Inline variant for headers/toolbars
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Zap className={`w-4 h-4 ${isOverLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-500' : 'text-primary'}`} />
          <span className="text-sm font-medium">
            {remainingCredits}
          </span>
        </div>
        <Badge 
          variant={isOverLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
          className="text-xs"
        >
          {subscriptionPlan}
        </Badge>
      </div>
    );
  }

  // Compact variant for sidebars/small spaces
  if (variant === 'compact') {
    return (
      <Card className={`p-3 glass-morphism ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isOverLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-500' : 'text-primary'}`} />
            <span className="text-sm font-medium">Credits</span>
          </div>
          <Badge 
            variant={isOverLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {subscriptionPlan}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-medium ${isOverLimit ? 'text-destructive' : ''}`}>
              {remainingCredits}
            </span>
          </div>
          
          <Progress 
            value={monthlyPercentage} 
            className="h-2"
          />
          
          <div className="text-xs text-muted-foreground">
            {monthlyUsage} / {subscriptionLimits.monthlyCredits} this month
          </div>
          
          {isOverLimit && overageCostPerCredit && (
            <div className="text-xs text-destructive">
              Overage: ${(overageCostPerCredit * (monthlyUsage - subscriptionLimits.monthlyCredits)).toFixed(2)}
            </div>
          )}
        </div>
        
        {showUpgrade && (isNearLimit || isOverLimit) && (
          <Button 
            size="sm" 
            className="w-full mt-2"
            variant={isOverLimit ? 'default' : 'outline'}
          >
            <Settings className="w-3 h-3 mr-1" />
            {isOverLimit ? 'Upgrade Plan' : 'Manage'}
          </Button>
        )}
      </Card>
    );
  }

  // Detailed variant for dedicated pages/sections
  return (
    <Card className={`p-4 glass-morphism ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${isOverLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-500' : 'text-primary'}`} />
          <h3 className="font-semibold">AI Credits</h3>
        </div>
        <Badge 
          variant={isOverLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
          className="text-sm"
        >
          {subscriptionPlan} Plan
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <div className="text-sm font-medium flex items-center gap-1">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Monthly Usage
          </div>
          <div className="text-2xl font-bold">
            {monthlyUsage}
            <span className="text-sm font-normal text-muted-foreground">
              / {subscriptionLimits.monthlyCredits}
            </span>
          </div>
          <Progress value={monthlyPercentage} className="h-2" />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Today's Usage
          </div>
          <div className="text-2xl font-bold">
            {dailyUsage}
            <span className="text-sm font-normal text-muted-foreground">
              / {subscriptionLimits.dailyCredits}
            </span>
          </div>
          <Progress value={dailyPercentage} className="h-2" />
        </div>
      </div>

      {/* Status indicators */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Credits Remaining</span>
          <span className={`font-medium ${isOverLimit ? 'text-destructive' : 'text-primary'}`}>
            {remainingCredits}
          </span>
        </div>
        
        {isOverLimit && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <div className="flex-1">
              <div className="text-sm font-medium text-destructive">
                Usage Limit Exceeded
              </div>
              <div className="text-xs text-destructive/80">
                Overage charges: ${(overageCostPerCredit * (monthlyUsage - subscriptionLimits.monthlyCredits)).toFixed(2)}
              </div>
            </div>
          </div>
        )}
        
        {isNearLimit && !isOverLimit && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <div className="text-sm text-yellow-600">
              Approaching credit limit - consider upgrading
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showUpgrade && (
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open('/usage-history', '_blank')}
          >
            View History
          </Button>
          {(isNearLimit || isOverLimit) && (
            <Button 
              size="sm"
              className="flex-1"
              variant={isOverLimit ? 'default' : 'outline'}
            >
              <Settings className="w-3 h-3 mr-1" />
              Upgrade Plan
            </Button>
          )}
        </div>
      )}

      {/* Cost breakdown */}
      {overageCostPerCredit && (
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Overage rate:</span>
            <span className="font-medium">${overageCostPerCredit.toFixed(3)} per credit</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CreditsDisplay;