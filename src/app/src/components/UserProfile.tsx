import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MobileCustomizationSettings } from './MobileCustomizationSettings';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { EmailChangeSettings } from './EmailChangeSettings';

import { useIsMobile } from './ui/use-mobile';
import { 
  User, 
  Settings, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Edit3,
  Mail,
  Calendar,
  ArrowLeft,
  CreditCard,
  Crown,
  Star,
  Gift,
  Zap,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Clock,
  Trash2,
  Plus,
  Info,
  Sparkles,
  TrendingUp,
  Users,
  Cable,
  Zap
} from 'lucide-react';

interface UserProfileProps {
  user: any;
  userData?: any;
  onBack?: () => void;
}

interface SubscriptionData {
  status: 'free' | 'trial' | 'subscribed';
  plan: string;
  trial: any;
  subscription: any;
  stripeCustomerId: string | null;
}

export function UserProfile({ user, userData, onBack }: UserProfileProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Get subscription data from context
  const { 
    subscriptionData, 
    refreshSubscriptions, 
    seatData, 
    subscriptionLoading 
  } = useCloudSubscription();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.name || user?.user_metadata?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Force refresh subscription data when UserProfile mounts or subscription tab is clicked
  useEffect(() => {
    // Only refresh if we have a user and subscription data seems stale
    if (user && subscriptionData) {
      console.log('🔄 UserProfile: Checking if subscription data needs refresh', {
        currentPlan: subscriptionData.plan,
        status: subscriptionData.status
      });
    }
  }, [user, subscriptionData]);

  // Add manual refresh handler
  const handleForceRefresh = async () => {
    console.log('🔄 UserProfile: Manual subscription refresh triggered');
    await refreshSubscriptions();
  };

  // Load seat data when component mounts (trigger refresh if not already loaded)
  useEffect(() => {
    if (user?.id && !seatData) {
      console.log('👤 UserProfile: No seat data, triggering refresh');
      refreshSubscriptions();
    }
  }, [user?.id, seatData, refreshSubscriptions]);

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<string>('creator'); // Default to creator plan
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  // Server URL
  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9`;

  // Subscription plans
  const plans = [
    {
      id: 'free',
      name: 'Starter',
      monthlyPrice: 0,
      annualPrice: 0,
      interval: 'month',
      icon: Sparkles,
      color: 'from-gray-500 to-gray-600',
      features: [
        '1 active roadmap',
        'University, Notes, Dream Board',
        'Ops read only',
        '200 AI tasks per month',
        'Skip Marketplace visible, locked',
        'Community support'
      ]
    },
    {
      id: 'creator',
      name: 'Creator',
      monthlyPrice: 15,
      annualPrice: 9,
      interval: 'month',
      icon: Zap,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Solo Builder',
      features: [
        '2 active roadmaps',
        'Ops write for Sales and Marketing',
        '1,000 AI tasks per month',
        'Unlock Skip Marketplace',
        'Basic automations',
        'Email support'
      ]
    },
    {
      id: 'builder',
      name: 'Builder',
      monthlyPrice: 49,
      annualPrice: 39,
      interval: 'month',
      icon: Crown,
      color: 'from-purple-600 to-pink-600',
      badge: 'Most Popular',
      features: [
        '4 active roadmaps',
        'Ops write for all areas',
        'Accounting sync read (QuickBooks/Xero)',
        'Bank data read for balance and transactions',
        '3,000 AI tasks per month',
        'Webhooks',
        'Priority support'
      ]
    },
    {
      id: 'studio',
      name: 'Studio',
      monthlyPrice: 199,
      annualPrice: 149,
      interval: 'month',
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      badge: 'Small Teams',
      features: [
        '8 active roadmaps',
        '3 seats included (+$12 per extra seat)',
        'Full automations and API access',
        'Accounting + bank read',
        '10,000 AI tasks per month',
        'SLA support'
      ]
    }
  ];

  const getDisplayPrice = (plan: any) => {
    if (plan.monthlyPrice === 0) return 'Free';
    
    if (billingPeriod === 'annual' && plan.id !== 'free') {
      return `$${plan.annualPrice}/month`;
    }
    
    return `$${plan.monthlyPrice}/${plan.interval}`;
  };

  const getCurrentPlanPrice = () => {
    const currentPlan = getCurrentPlanDetails();
    if (currentPlan.monthlyPrice === 0) return 0;
    
    return billingPeriod === 'annual' && currentPlan.id !== 'free' 
      ? currentPlan.annualPrice 
      : currentPlan.monthlyPrice;
  };

  const getSavings = (plan: any) => {
    if (plan.monthlyPrice === 0 || billingPeriod === 'monthly') return null;
    
    const monthlyCost = plan.monthlyPrice;
    const annualCost = plan.annualPrice;
    const savings = monthlyCost - annualCost;
    
    return `Save $${savings}/month`;
  };

  // Real-time countdown for trial
  useEffect(() => {
    if (subscriptionData?.status === 'trial' && subscriptionData?.trial?.ends_at) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const endTime = new Date(subscriptionData.trial.ends_at).getTime();
        const timeDiff = endTime - now;

        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

          if (days > 0) {
            setTimeRemaining(`${days} day${days > 1 ? 's' : ''} left`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m left`);
          } else {
            setTimeRemaining(`${minutes}m ${seconds}s left`);
          }
        } else {
          setTimeRemaining('Trial expired');
          clearInterval(interval);
          // Use subscription context refresh instead
          refreshSubscriptions();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [subscriptionData?.trial?.ends_at, refreshSubscriptions]);

  // Remove unused payment methods functions that were causing errors
  // const loadPaymentMethods = async () => {
  //   try {
  //     const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
  //     
  //     const response = await fetch(`${serverUrl}/stripe/payment-methods/${user.id}`, {
  //       headers: {
  //         'Authorization': `Bearer ${accessToken || publicAnonKey}`,
  //       }
  //     });
  //
  //     if (response.ok) {
  //       const data = await response.json();
  //       setPaymentMethods(data.payment_methods || []);
  //     } else {
  //       console.error('Failed to load payment methods');
  //     }
  //   } catch (error) {
  //     console.error('Error loading payment methods:', error);
  //   }
  // };

  const handleStartTrial = async () => {
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe/start-trial`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: displayName || user.user_metadata?.name,
          plan: 'standard'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('7-day free trial started successfully!');
        setShowTrialDialog(false);
        await refreshSubscriptions();
      } else {
        setError(data.error || 'Failed to start trial');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      setError('Failed to start trial. Please try again.');
    }
  };

  const handleUpgradePlan = (planId?: string) => {
    // Navigate to PricingPage instead of opening modal directly
    // This gives users a full view of all plans and features before upgrading
    navigate('/pricing', {
      state: {
        selectedPlan: planId || upgradeTargetPlan,
        returnTo: '/profile'
      }
    });
  };

  const handleCancelSubscription = async () => {
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Subscription cancelled successfully. You will retain access until the end of your billing period.');
        setShowCancelDialog(false);
        await refreshSubscriptions();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription. Please try again.');
    }
  };

  const handleManageBilling = async () => {
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe/create-customer-portal/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to Stripe customer portal
        window.location.href = data.portalUrl;
      } else {
        setError(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      setError('Failed to open billing portal. Please try again.');
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Payment method removed successfully.');
        // Remove the call to loadPaymentMethods since it's commented out
        // await loadPaymentMethods();
      } else {
        setError(data.error || 'Failed to remove payment method');
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      setError('Failed to remove payment method. Please try again.');
    }
  };

  // Helper to get subscription data with fallback
  const getSubscriptionDataWithFallback = () => {
    if (!subscriptionData || loadingTimeout) {
      return {
        status: 'free' as const,
        plan: 'free',
        trial: null,
        subscription: null,
        stripeCustomerId: null
      };
    }
    return subscriptionData;
  };
  
  // Safe subscription data with fallback
  const safeSubscriptionData = getSubscriptionDataWithFallback();

  const getCurrentPlanDetails = () => {
    const subData = safeSubscriptionData;
    if (!subData || subData.status === 'free') {
      console.log('🔄 UserProfile: Using fallback plan data (free)');
      return plans[0]; // Default to free/starter
    }
    
    // Map server plan names to our display plan names
    let planId = safeSubscriptionData.plan;
    if (planId === 'free') planId = 'free'; // Keep as is
    if (planId === 'standard') planId = 'creator'; // Map old standard to new creator
    
    console.log('🔄 UserProfile getCurrentPlanDetails:', {
      originalPlan: safeSubscriptionData.plan,
      mappedPlanId: planId,
      status: safeSubscriptionData.status,
      source: safeSubscriptionData.subscription?.source || 'unknown'
    });
    
    // For trial users, show the trial plan
    if (safeSubscriptionData.status === 'trial') {
      const basePlan = plans.find(plan => plan.id === planId) || plans[1];
      const timeRemaining = getRemainingTime();
      return {
        ...basePlan,
        name: `${basePlan.name} (Free Trial)`,
        badge: timeRemaining || `${safeSubscriptionData.trial?.days_remaining || 0} days left`
      };
    }
    
    // Find the plan details
    const foundPlan = plans.find(plan => plan.id === planId) || plans[0];
    console.log('🔄 UserProfile getCurrentPlanDetails result:', foundPlan);
    
    return foundPlan;
  };

  const shouldShowTrialButton = () => {
    return safeSubscriptionData.status === 'free' && !safeSubscriptionData.trial;
  };

  const updateProfile = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 UserProfile: Updating display name to:', displayName);
      
      const { data, error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });

      console.log('🔄 UserProfile: Update response:', { data, error });

      if (error) {
        console.error('❌ UserProfile: Update error:', error);
        throw error;
      }

      console.log('✅ UserProfile: Profile updated successfully');
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      // Force reload user metadata after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('❌ UserProfile: Update exception:', err);
      
      // Better error message for JSON parsing errors
      let errorMessage = err.message || 'Failed to update profile';
      if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
        errorMessage = 'Unable to update profile. Please try again or contact support if the issue persists.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleIntegrationsNavigate = () => {
    navigate('/integrations');
  };

  // Add timeout mechanism for loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!subscriptionData && subscriptionLoading) {
        console.warn('⚠️ UserProfile: Subscription data loading timeout - showing profile anyway');
        setLoadingTimeout(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [subscriptionData, subscriptionLoading]);

  // Show loading state only briefly, then show profile with fallback data
  if (!subscriptionData && subscriptionLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading subscription data...</p>
              <p className="text-xs text-muted-foreground mt-2">This shouldn't take long...</p>
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
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and security settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="profile" className={isMobile ? "flex flex-col items-center gap-1 py-2 text-xs" : "flex items-center gap-2"}>
              <User className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
              <span className={isMobile ? "text-xs" : ""}>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="customization" className={isMobile ? "flex flex-col items-center gap-1 py-2 text-xs" : "flex items-center gap-2"}>
              <Settings className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
              <span className={isMobile ? "text-xs" : ""}>Customization</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6">
              {/* Profile Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {getInitials(displayName || user?.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">
                          {displayName || 'User'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {user?.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={userData?.role === 'admin' ? 'default' : 'secondary'}>
                      {userData?.role || 'User'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account Created</Label>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Verified</Label>
                      <div className="flex items-center gap-2 text-sm">
                        {user?.email_confirmed_at ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400">Not verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      To change your email, please contact support or use your auth provider settings.
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={updateProfile} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(userData?.name || user?.user_metadata?.name || '');
                          setError(null);
                          setSuccess(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Email Change Settings - NEW */}
              <EmailChangeSettings user={user} />

              {/* Account Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>
                    Overview of your account security and features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Prominent Integrations Button */}
                    <Button 
                      variant="outline" 
                      size={isMobile ? "default" : "lg"}
                      className={`w-full ${isMobile ? 'p-4' : 'p-6'} h-auto cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-950 dark:hover:to-indigo-950 border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 group`}
                      onClick={handleIntegrationsNavigate}
                    >
                      <div className={`flex items-center ${isMobile ? 'justify-start gap-3' : 'justify-between'} w-full`}>
                        <div className="flex items-center gap-3">
                          <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                            <Cable className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
                          </div>
                          <div className="text-left">
                            <div className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-purple-700 dark:text-purple-300`}>
                              Integrations
                            </div>
                            {!isMobile && (
                              <div className="text-sm text-muted-foreground">
                                Connect external tools and services
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className={`${isMobile ? 'h-4 w-4 ml-auto' : 'h-5 w-5'} text-purple-500 group-hover:translate-x-1 transition-transform duration-200`} />
                      </div>
                    </Button>

                    {/* Smaller account info items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-500" />
                          <span>Two-Factor Auth</span>
                        </div>
                        <Badge variant="secondary">View in Security</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-gray-500" />
                          <span>Account Type</span>
                        </div>
                        <Badge variant={userData?.role === 'admin' ? 'default' : 'secondary'}>
                          {userData?.role || 'User'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customization">
            <MobileCustomizationSettings user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// OLD TABS REMOVED - NOW IN SETTINGSPAGE.TSX
/*
          <TabsContent value="subscription">
            <div className="space-y-6">
              {/* Subscription Overview Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          Subscription
                        </CardTitle>
                        <CardDescription>
                          Manage your subscription and payment methods
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {/* Plan trumps status - if plan is studio, show as active Studio subscription */}
                        {safeSubscriptionData.plan === 'studio' ? 'Studio Plan' :
                         safeSubscriptionData.plan === 'creator' ? 'Creator Plan' :
                         safeSubscriptionData.status === 'trial' ? `${getCurrentPlanDetails().name} (Trial)` : 
                         safeSubscriptionData.status === 'subscribed' ? getCurrentPlanDetails().name :
                         'Starter (Free)'}
                        <span className="text-sm font-normal text-muted-foreground">
                          {safeSubscriptionData.plan === 'studio' ? '/month' :
                           safeSubscriptionData.status === 'trial' ? ` (${timeRemaining})` : 
                           safeSubscriptionData.status === 'free' ? '' :
                           `/${getCurrentPlanDetails().interval === 'one-time' ? 'minimum to start' : getCurrentPlanDetails().interval}`}
                        </span>
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {/* Force Studio pricing if plan is studio */}
                        {safeSubscriptionData.plan === 'studio' ? '$29/month' :
                         safeSubscriptionData.plan === 'creator' ? '$9/month' :
                         safeSubscriptionData.status === 'trial' ? `${timeRemaining || getRemainingTime() || 'Trial'}` : 
                         safeSubscriptionData.status === 'free' ? '$0/month' :
                         safeSubscriptionData.status === 'subscribed' ? `${getCurrentPlanPrice()}/${getCurrentPlanDetails().interval}` :
                         '$0/month'}
                      </div>
                      {subscriptionData.status === 'trial' && subscriptionData.trial?.ends_at && (
                        <p className="text-sm text-muted-foreground">
                          Trial ends: {formatDate(safeSubscriptionData.trial.ends_at)}
                        </p>
                      )}
                      {/* Show billing info for active plans */}
                      {(subscriptionData.plan === 'studio' || subscriptionData.plan === 'creator' || subscriptionData.status === 'subscribed') && subscriptionData.subscription?.current_period_end && (
                        <p className="text-sm text-muted-foreground">
                          Next billing: {formatDate(safeSubscriptionData.subscription.current_period_end)}
                        </p>
                      )}

                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Plan Features</h4>
                      <ul className="space-y-2">
                        {/* Show plan-specific features based on actual plan */}
                        {(safeSubscriptionData.plan === 'studio' ? 
                          [
                            "Unlimited businesses",
                            "Advanced roadmap features", 
                            "Priority support",
                            "Advanced analytics",
                            "Team collaboration",
                            "Custom integrations"
                          ] : safeSubscriptionData.plan === 'creator' ?
                          [
                            "Up to 3 businesses",
                            "Full roadmap access",
                            "Email support",
                            "Basic analytics",
                            "Export capabilities"
                          ] : getCurrentPlanDetails().features
                        ).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Quick Actions</h4>
                      <div className="space-y-2">
                        {/* Don't show trial button if already on paid plan */}
                        {shouldShowTrialButton() && subscriptionData.plan !== 'studio' && subscriptionData.plan !== 'creator' && (
                          <Button
                            onClick={handleStartTrial}
                            disabled={subscriptionLoading}
                            className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            {subscriptionLoading ? 'Starting Trial...' : 'Start 7-Day Free Trial'}
                          </Button>
                        )}
                        {/* Show upgrade if on creator plan to upgrade to studio */}
                        {subscriptionData.plan === 'creator' && (
                          <Button
                            onClick={handleUpgradePlan}
                            className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to Studio
                          </Button>
                        )}
                        {/* Show upgrade if on free plan */}
                        {(!subscriptionData.plan || subscriptionData.plan === 'starter') && (
                          <Button
                            onClick={handleUpgradePlan}
                            className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade Plan
                          </Button>
                        )}
                        {/* Show cancel for any paid plan */}
                        {(subscriptionData.plan === 'studio' || subscriptionData.plan === 'creator' || subscriptionData.status === 'subscribed') && (
                          <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(true)}
                            className="w-full justify-start"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        )}
                        {/* Manage Billing button for paid customers */}
                        {(subscriptionData.plan === 'studio' || subscriptionData.plan === 'creator' || subscriptionData.status === 'subscribed') && subscriptionData.stripeCustomerId && (
                          <Button
                            variant="outline"
                            onClick={handleManageBilling}
                            className="w-full justify-start"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Manage Billing
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Stripe Subscription Sync - reads from Stripe and updates database */}
              <EnhancedStripeSubscriptionSync 
                userId={user.id} 
                userEmail={user.email}
                onSyncComplete={() => {
                  console.log('✅ Subscription sync completed, refreshing...');
                  refreshSubscriptions();
                }}
              />

              {/* Seat Information */}
              <SeatInformation user={user} />

              {/* Team Invitation - only show if user has seat subscriptions */}
              {seatData && seatData.seatCount > 0 && (
                <TeamInvitation user={user} seatData={seatData} />
              )}

              {/* Billing & Payment section - remove payment methods since they're not implemented */}
              {subscriptionData.status !== 'free' && (
                <Card className="glass-morphism">
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>
                      View your current subscription billing details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Payment methods are managed through Stripe</p>
                      <p className="text-sm mt-2">Billing and payment details are handled securely through our payment processor</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Plan Comparison */}
              <Card className="glass-morphism">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Explore Other Plans</CardTitle>
                      <CardDescription>
                        Compare features and pricing across all available plans
                      </CardDescription>
                    </div>
                    
                    {/* Billing Toggle */}
                    <div className="flex items-center gap-4">
                      <span className={billingPeriod === 'monthly' ? 'font-medium' : 'text-muted-foreground text-sm'}>
                        Monthly
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                        className="relative"
                      >
                        <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          billingPeriod === 'annual' ? 'bg-primary' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 transform ${
                            billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`} />
                        </div>
                      </Button>
                      <span className={billingPeriod === 'annual' ? 'font-medium' : 'text-muted-foreground text-sm'}>
                        Annual
                      </span>
                      {billingPeriod === 'annual' && (
                        <Badge variant="secondary" className="ml-2">
                          Save up to $50/month
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {billingPeriod === 'monthly' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        💡 Switch to annual billing to save money and get better value
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative p-6 border rounded-lg transition-all duration-200 hover:shadow-md ${
                          plan.id === subscriptionData.plan
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                            : 'hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {plan.badge && (
                          <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                            {plan.badge}
                          </Badge>
                        )}
                        {plan.id === subscriptionData.plan && (
                          <Badge className="absolute -top-2 right-4 bg-green-500 text-white">
                            Current Plan
                          </Badge>
                        )}
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center`}>
                            {React.createElement(plan.icon, { className: "w-6 h-6 text-white" })}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                            <div className="text-2xl font-bold">
                              {getDisplayPrice(plan)}
                            </div>
                            {billingPeriod === 'annual' && plan.monthlyPrice > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Billed annually (${plan.annualPrice * 12}/year)
                              </div>
                            )}
                            {getSavings(plan) && (
                              <div className="text-sm text-green-600 font-medium">
                                {getSavings(plan)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h4 className="font-medium mb-3 text-muted-foreground">What's included:</h4>
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {plan.id !== subscriptionData.plan && (
                          <Button
                            className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white border-0`}
                            onClick={() => handleUpgradePlan(plan.id)}
                            disabled={subscriptionLoading}
                          >
                            {plan.monthlyPrice === 0 ? 'Current Plan' : 'Upgrade to ' + plan.name}
                          </Button>
                        )}
                        
                        {plan.id === subscriptionData.plan && (
                          <div className="w-full p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                            <span className="text-sm text-green-700 dark:text-green-300 font-medium">Your Current Plan</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Support & Help */}
              <Card className="glass-morphism">
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>
                    Get support with your subscription and billing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Info className="w-5 h-5 text-blue-600" />
                      <div>
                        <Label className="text-sm font-medium">Billing Questions</Label>
                        <p className="text-xs text-muted-foreground">
                          Contact our billing support team
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <div>
                        <Label className="text-sm font-medium">Feature Requests</Label>
                        <p className="text-xs text-muted-foreground">
                          Suggest new features or improvements
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <div>
                        <Label className="text-sm font-medium">Account Help</Label>
                        <p className="text-xs text-muted-foreground">
                          Get help with your account settings
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Upgrade Plan Dialog - disabled since we use the payment modal */}
              <Dialog open={false} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                    <DialogDescription>
                      Choose a new plan to upgrade your subscription immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {plans.filter(plan => plan.id !== subscriptionData.plan && plan.id !== 'free' && plan.id !== 'standard_trial').map((plan) => (
                      <div key={plan.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center`} >
                              {React.createElement(plan.icon, { className: "w-5 h-5 text-white" })}
                            </div>
                            <div>
                              <div className="font-semibold">{plan.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {getDisplayPrice(plan)}
                              </div>
                            </div>
                          </div>
                          <Button
                            className={`bg-gradient-to-r ${plan.color} hover:opacity-90 text-white border-0`}
                            onClick={() => handleUpgradePlan(plan.id)}
                            disabled={subscriptionLoading}
                            size="sm"
                          >
                            {subscriptionLoading ? 'Upgrading...' : plan.id === 'enterprise' ? 'Contact' : 'Upgrade'}
                          </Button>
                        </div>
                      </div>
                    ))}

                  </div>
                </DialogContent>
              </Dialog>

              {/* Cancel Subscription Dialog */}
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel your subscription? You'll lose access to premium features.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/20 dark:border-yellow-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">What happens next?</h4>
                          <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                            <li>• {subscriptionData.status === 'trial' ? 'Your free trial will end immediately' : 'You\'ll keep access until your billing period ends'}</li>
                            <li>• You'll lose access to Business OS features</li>
                            <li>• Your data will be preserved but limited</li>
                            <li>• You can reactivate anytime</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Subscription
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        disabled={subscriptionLoading}
                      >
                        {subscriptionLoading ? 'Canceling...' : 'Yes, Cancel'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Upgrade Payment Modal */}
              <UpgradePaymentModal
                open={showUpgradeDialog}
                onOpenChange={setShowUpgradeDialog}
                user={user}
                currentPlan={safeSubscriptionData.status === 'trial' ? 'trial' : safeSubscriptionData.plan}
                defaultPlan={upgradeTargetPlan}
                billingPeriod={billingPeriod}
                onSuccess={() => {
                  refreshSubscriptions();
                  setSuccess('Successfully upgraded! Welcome to your new plan.');
                }}
              />

              {/* Global Alert Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

*/