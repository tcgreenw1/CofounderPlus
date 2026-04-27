import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { AppleExternalPurchaseModal } from './AppleExternalPurchaseModal';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useIsMobile } from './ui/use-mobile';
import { isIOS, isWeb } from '../utils/platformDetection';
import { 
  CreditCard, 
  Calendar, 
  DollarSign,
  ExternalLink,
  Receipt,
  Settings,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Sparkles,
  Crown,
  Star,
  Zap
} from 'lucide-react';

interface UserBillingPortalProps {
  user: any;
  onBack?: () => void;
}

export function UserBillingPortal({ user, onBack }: UserBillingPortalProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [pendingPortalUrl, setPendingPortalUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();
  const isWebBrowser = isWeb();
  
  const { 
    subscriptionData, 
    seatData,
    isLoading: subscriptionLoading, 
    refreshSubscriptions,
    planDisplayName,
    getRemainingTime 
  } = useCloudSubscription();

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  // Plan configurations for display
  const planConfigs = {
    free: {
      name: 'Starter',
      icon: Sparkles,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      price: 'Free',
      features: ['1 active roadmap', 'University access', 'Notes & Dream Board', '200 AI tasks/month']
    },
    creator: {
      name: 'Creator',
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      price: '$15/month',
      features: ['2 active roadmaps', 'Sales & Marketing ops', '1,000 AI tasks/month', 'Skip Marketplace']
    },
    builder: {
      name: 'Builder',
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      price: '$49/month',
      features: ['4 active roadmaps', 'All operations', 'Bank/accounting sync', '3,000 AI tasks/month']
    },
    studio: {
      name: 'Studio',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      price: '$199/month',
      features: ['8 active roadmaps', '3 seats included', 'Full API access', '10,000 AI tasks/month']
    }
  };

  const getCurrentPlanConfig = () => {
    const planKey = subscriptionData?.plan || 'free';
    return planConfigs[planKey as keyof typeof planConfigs] || planConfigs.free;
  };

  const handleManageBilling = async () => {
    // MOBILE WEB BROWSER: Route to /pricing instead of external portal
    if (isMobile && isWebBrowser) {
      console.log('📱 Mobile web browser detected - routing to /pricing');
      navigate('/pricing');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No active session. Please sign in again.');
        toast.error('Session expired. Please sign in again.');
        setIsLoading(false);
        return;
      }

      const accessToken = session.access_token;
      const refreshToken = session.refresh_token;

      // iOS APP: Create billing redirect URL that auto-signs in and goes to /pricing
      if (isIOSApp && !isWebBrowser) {
        console.log('📱 iOS app detected - creating auto-login billing URL');
        
        // Create URL with session tokens for automatic sign-in
        const billingUrl = `https://www.cofounderplus.com/billing-redirect?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
        
        console.log('🔗 Generated billing redirect URL (tokens hidden for security)');
        
        // Show Apple modal first, then open our website with auto-login
        setPendingPortalUrl(billingUrl);
        setShowAppleModal(true);
        setIsLoading(false);
        return;
      }

      // DESKTOP/WEB: Open Stripe customer portal
      console.log('🌐 Desktop/web detected - opening Stripe billing portal');
      
      const response = await fetch(`${serverUrl}/stripe/create-customer-portal/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = data.portalUrl;
      } else {
        setError(data.error || 'Failed to open billing portal');
        toast.error(data.error || 'Failed to open billing portal');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      setError('Failed to open billing portal. Please try again.');
      toast.error('Failed to open billing portal. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAppleModalCancel = () => {
    console.log('🚫 User cancelled Apple external purchase modal');
    setShowAppleModal(false);
    setPendingPortalUrl(null);
  };

  const handleAppleModalContinue = () => {
    console.log('✅ User confirmed Apple external purchase modal, opening portal:', pendingPortalUrl);
    setShowAppleModal(false);
    
    if (pendingPortalUrl) {
      // CRITICAL: Use window.location.href to open external link on iOS
      // window.open() doesn't work reliably on mobile browsers
      console.log('🌐 Redirecting to Stripe billing portal...');
      window.location.href = pendingPortalUrl;
      setPendingPortalUrl(null);
    } else {
      console.error('❌ No pending portal URL to open');
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const currentPlan = getCurrentPlanConfig();
  const IconComponent = currentPlan.icon;

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading billing information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your subscription, billing, and payment methods
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentPlan.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${currentPlan.color}`} />
                </div>
                Current Plan: {currentPlan.name}
                {subscriptionData?.status === 'trial' && (
                  <Badge variant="outline" className="text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Trial
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {subscriptionData?.status === 'trial' 
                  ? `Free trial - ${getRemainingTime() || 'Ending soon'}`
                  : 'Your active subscription plan'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{currentPlan.price}</span>
                </div>
                <Badge variant={subscriptionData?.status === 'active' ? 'default' : 'secondary'}>
                  {subscriptionData?.status === 'active' ? 'Active' : 
                   subscriptionData?.status === 'trial' ? 'Trial' : 
                   subscriptionData?.status || 'Free'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Plan Features:</h4>
                <ul className="space-y-1">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {seatData && seatData.seats_included > 1 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Team Seats:</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{seatData.seats_used || 0} / {seatData.seats_included} seats used</span>
                      {seatData.additional_seats && seatData.additional_seats > 0 && (
                        <Badge variant="outline">
                          +{seatData.additional_seats} extra seats
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                {subscriptionData?.status === 'free' || subscriptionData?.status === 'trial' ? (
                  <Button onClick={handleUpgrade} className="flex-1">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleManageBilling} disabled={isLoading} className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      {isLoading ? 'Opening...' : 'Manage Billing'}
                    </Button>
                    <Button variant="outline" onClick={handleUpgrade}>
                      <Crown className="h-4 w-4 mr-2" />
                      Change Plan
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          {subscriptionData?.status === 'active' && subscriptionData?.stripeCustomerId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Access your billing history, payment methods, and invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Billing Period</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">
                        {subscriptionData.subscription?.billing_period || 'Monthly'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer ID</label>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">
                        {subscriptionData.stripeCustomerId}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleManageBilling} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isLoading ? 'Opening Billing Portal...' : 'Open Billing Portal'}
                </Button>

                <div className="text-xs text-muted-foreground">
                  The billing portal allows you to update payment methods, download invoices, 
                  view billing history, and manage your subscription settings.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common billing and subscription tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/pricing')}
                  className="p-6 h-auto justify-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Crown className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">View All Plans</div>
                      <div className="text-sm text-muted-foreground">
                        Compare features and pricing
                      </div>
                    </div>
                  </div>
                </Button>

                {subscriptionData?.status === 'active' && (
                  <Button 
                    variant="outline" 
                    onClick={handleManageBilling}
                    disabled={isLoading}
                    className="p-6 h-auto justify-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Receipt className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Download Invoices</div>
                        <div className="text-sm text-muted-foreground">
                          Access your billing history
                        </div>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apple External Purchase Compliance Modal */}
      <AppleExternalPurchaseModal 
        isOpen={showAppleModal}
        onClose={handleAppleModalCancel}
        onContinue={handleAppleModalContinue}
      />
    </div>
  );
}