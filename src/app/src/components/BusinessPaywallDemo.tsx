import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { BusinessLimitPaywall } from './BusinessLimitPaywall';
import { 
  Building2, 
  Plus, 
  Crown, 
  Zap, 
  Star, 
  Sparkles,
  CheckCircle,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { 
  canCreateMoreBusinesses, 
  getSubscriptionTierInfo,
  getBusinessLimitMessage 
} from '../utils/subscriptionLimits';

export const BusinessPaywallDemo: React.FC = () => {
  const navigate = useNavigate();
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedTier, setSelectedTier] = useState('starter');
  const [currentBusinessCount, setCurrentBusinessCount] = useState(1);

  // Simulate different subscription tiers for testing
  const tiers = [
    { id: 'starter', name: 'Free (Starter)', businesses: 1, icon: Sparkles, color: 'from-gray-500 to-gray-600' },
    { id: 'creator', name: 'Creator', businesses: 2, icon: Star, color: 'from-blue-500 to-blue-600' },
    { id: 'builder', name: 'Builder', businesses: 4, icon: Zap, color: 'from-purple-500 to-purple-600' },
    { id: 'studio', name: 'Studio', businesses: 8, icon: Crown, color: 'from-amber-500 to-amber-600' }
  ];

  const businessCounts = [1, 2, 3, 4, 5, 8, 10];

  const canCreate = canCreateMoreBusinesses(currentBusinessCount, selectedTier);
  const tierInfo = getSubscriptionTierInfo(selectedTier);
  const limitMessage = getBusinessLimitMessage(currentBusinessCount, selectedTier);

  const handleCreateBusiness = () => {
    if (!canCreate) {
      setShowPaywall(true);
    } else {
      // Simulate business creation
      setCurrentBusinessCount(prev => prev + 1);
    }
  };

  const handleUpgrade = (tier: string) => {
    console.log('BusinessPaywallDemo: Upgrading to:', tier);
    setShowPaywall(false);
    
    // Navigate to pricing page with target plan
    navigate('/pricing', { 
      state: { 
        targetPlan: tier,
        returnTo: '/business-paywall-demo',
        upgradeReason: 'business_limit_demo'
      }
    });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background starry-background">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2 glass-morphism hover:bg-white/20 dark:hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-4 inspire-glow flex items-center justify-center gap-3">
            <Building2 className="w-8 h-8" />
            Business Limit Paywall Demo
          </h1>
          <p className="text-muted-foreground">
            Test the business creation limits and paywall functionality across different subscription tiers
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-8 glass-morphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentBusinessCount}</div>
                <div className="text-sm text-muted-foreground">Current Businesses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{tierInfo.limits.businesses}</div>
                <div className="text-sm text-muted-foreground">Business Limit</div>
              </div>
              <div className="text-center">
                <Badge 
                  variant={canCreate ? "default" : "destructive"}
                  className="text-sm px-3 py-1"
                >
                  {canCreate ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Can Create
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Limit Reached
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tier Selection */}
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="text-lg">Select Subscription Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tiers.map((tier) => {
                  const TierIcon = tier.icon;
                  const isSelected = selectedTier === tier.id;
                  
                  return (
                    <Button
                      key={tier.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full justify-start ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedTier(tier.id)}
                    >
                      <div className={`w-6 h-6 rounded bg-gradient-to-r ${tier.color} flex items-center justify-center mr-3`}>
                        <TierIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{tier.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {tier.businesses} {tier.businesses === 1 ? 'business' : 'businesses'}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Business Count Selection */}
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="text-lg">Current Business Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {businessCounts.map((count) => (
                  <Button
                    key={count}
                    variant={currentBusinessCount === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentBusinessCount(count)}
                    className={currentBusinessCount === count ? 'ring-2 ring-blue-500' : ''}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline" className="text-xs">
                  Simulating {currentBusinessCount} existing businesses
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Limit Status */}
        {!canCreate && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              {limitMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <div className="text-center mb-8">
          <Button
            onClick={handleCreateBusiness}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Business
          </Button>
        </div>

        {/* Explanation */}
        <Card className="glass-morphism">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <strong>Business Limit Check:</strong> When a user tries to create a new business, the system checks their current subscription plan and existing business count.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <strong>Paywall Trigger:</strong> If the user has reached their limit, the Business Limit Paywall is displayed with upgrade options.
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <strong>Upgrade Flow:</strong> Users can choose from available subscription tiers that allow more businesses, and are directed to the payment flow.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Limit Paywall */}
        <BusinessLimitPaywall
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          currentBusinessCount={currentBusinessCount}
          currentTier={selectedTier}
          onUpgrade={handleUpgrade}
        />
      </div>
    </div>
  );
};

export default BusinessPaywallDemo;