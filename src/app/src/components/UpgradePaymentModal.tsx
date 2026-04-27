/**
 * UpgradePaymentModal - Handles plan upgrades with Stripe Checkout
 * Uses CloudSubscriptionContext for subscription management
 * @version 2.0.0 - Fixed subscription context integration
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Lock, 
  Crown, 
  Star, 
  Zap,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface UpgradePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  currentPlan?: string;
  defaultPlan?: string; // Add support for default plan selection
  billingPeriod?: 'monthly' | 'annual'; // Add billing period prop
  onSuccess?: () => void;
}

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  interval: string;
  icon: any;
  color: string;
  badge?: string;
  popular?: boolean;
  features: string[];
}

const plans: Plan[] = [
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
    popular: true,
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

export function UpgradePaymentModal({ 
  open, 
  onOpenChange, 
  user, 
  currentPlan = 'trial', 
  defaultPlan = 'builder', // Change default to builder (most popular)
  billingPeriod = 'monthly', // Change default to monthly for better UX
  onSuccess 
}: UpgradePaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan); // Use defaultPlan properly
  const [currentBillingPeriod, setCurrentBillingPeriod] = useState(billingPeriod); // Add state for billing period

  // Update selectedPlan when defaultPlan changes
  useEffect(() => {
    console.log('🛒 UpgradePaymentModal: defaultPlan changed to:', defaultPlan);
    setSelectedPlan(defaultPlan);
  }, [defaultPlan]);

  // Update billing period when prop changes
  useEffect(() => {
    console.log('🛒 UpgradePaymentModal: billingPeriod changed to:', billingPeriod);
    setCurrentBillingPeriod(billingPeriod);
  }, [billingPeriod]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Payment form state - now hidden but kept for compatibility
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [billingZip, setBillingZip] = useState('');

  // Get subscription context to refresh data after upgrade
  const { refreshSubscriptions } = useCloudSubscription();

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9`;

  const selectedPlanDetails = plans.find(plan => plan.id === selectedPlan);

  const getDisplayPrice = (plan: Plan) => {
    return currentBillingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  };

  const getDisplayTotal = (plan: Plan) => {
    const monthlyPrice = currentBillingPeriod === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    return currentBillingPeriod === 'annual' ? monthlyPrice * 12 : monthlyPrice;
  };

  const getSavings = (plan: Plan) => {
    if (currentBillingPeriod === 'monthly') return null;
    const monthlyCost = plan.monthlyPrice;
    const annualCost = plan.annualPrice;
    const savings = (monthlyCost - annualCost) * 12;
    return `Save ${savings}/year`;
  };

  // Reset form when modal opens and auto-redirect
  useEffect(() => {
    if (open) {
      console.log('🛒 UpgradePaymentModal: Opening with defaultPlan:', defaultPlan);
      setSelectedPlan(defaultPlan);
      setError(null);
      setSuccess(null);
      setCardNumber('');
      setExpiryDate('');
      setCvc('');
      setCardName('');
      setBillingZip('');
      
      // Remove auto-redirect to allow users to choose billing period
      // const timer = setTimeout(() => {
      //   handleUpgrade();
      // }, 500); // Small delay to let the modal render
      
      // return () => clearTimeout(timer);
    }
  }, [open, defaultPlan]);

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setCvc(value);
    }
  };

  const validatePaymentForm = () => {
    // No validation needed since payment is handled by Stripe Checkout
    return true;
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      console.log('🛒 Creating Stripe Checkout session for upgrade...');
      
      const response = await fetch(`${serverUrl}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.name || user.user_metadata?.full_name || user.email,
          plan: selectedPlan,
          billingPeriod: currentBillingPeriod,
          successUrl: `${window.location.origin}/subscription-success?plan=${selectedPlan}`,
          cancelUrl: `${window.location.origin}/subscription-cancel`
        })
      });

      const data = await response.json();
      
      console.log('🛒 Checkout session response:', data);

      if (response.ok && data.success && data.sessionUrl) {
        console.log('🛒 Redirecting to Stripe Checkout:', data.sessionUrl);
        // Close modal and redirect to Stripe Checkout
        onOpenChange(false);
        window.location.href = data.sessionUrl;
      } else {
        console.error('🛒 Checkout session creation failed:', data);
        setError(data.error || 'Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('🛒 Error creating checkout session:', error);
      setError('Payment system error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Remove the paymentStep logic since it's not defined
    setError(null);
  };

  const getFinalTotal = () => {
    if (!selectedPlanDetails) return 0;
    const subtotal = getDisplayTotal(selectedPlanDetails);
    const processingFee = Math.round((subtotal * 0.029 + 0.30) * 100) / 100;
    return subtotal + processingFee;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {loading ? 'Processing Payment' : 'Upgrade Your Plan'}
          </DialogTitle>
          <DialogDescription>
            {loading ? 'Please wait while we process your payment...' : 'Select your plan and enter payment details to upgrade'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Processing your payment...</h3>
              <p className="text-muted-foreground">This may take a few seconds</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-2">
            {/* Left Column - Plan Selection */}
            <div className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Choose Your Plan</h3>
                
                {/* Plan Selection Dropdown */}
                <div className="space-y-4">
                  <Label className="text-base">Select Plan</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex items-center gap-3 py-1">
                            {React.createElement(plan.icon, { className: "h-5 w-5" })}
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-muted-foreground">
                              ${plan.monthlyPrice}/{plan.interval}
                            </span>
                            {plan.popular && (
                              <Badge variant="secondary" className="text-xs">Most Popular</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Plan Details */}
                {selectedPlanDetails && (
                  <Card className="glass-morphism">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-r ${selectedPlanDetails.color} rounded-xl flex items-center justify-center`}>
                          {React.createElement(selectedPlanDetails.icon, { className: "w-7 h-7 text-white" })}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            {selectedPlanDetails.name}
                            {selectedPlanDetails.badge && (
                              <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                {selectedPlanDetails.badge}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-base mt-1">
                            ${getDisplayPrice(selectedPlanDetails)}/{selectedPlanDetails.interval}
                            {billingPeriod === 'annual' && (
                              <span className="text-green-600 ml-2 font-medium">
                                (Save ${(selectedPlanDetails.monthlyPrice - selectedPlanDetails.annualPrice) * 12}/year)
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base">What's included:</h4>
                        <ul className="space-y-2">
                          {selectedPlanDetails.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Summary */}
                {selectedPlanDetails && (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-xl">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center text-base">
                        <span className="font-medium">{selectedPlanDetails.name} Plan ({billingPeriod})</span>
                        <span className="font-semibold">${getDisplayTotal(selectedPlanDetails).toFixed(2)}</span>
                      </div>
                      {billingPeriod === 'annual' && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Annual discount</span>
                          <span className="font-medium">-${((selectedPlanDetails.monthlyPrice - selectedPlanDetails.annualPrice) * 12).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Processing fee (2.9% + $0.30)</span>
                        <span>${(Math.round((getDisplayTotal(selectedPlanDetails) * 0.029 + 0.30) * 100) / 100).toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-primary">${getFinalTotal().toFixed(2)}</span>
                      </div>
                      {billingPeriod === 'annual' && (
                        <div className="text-sm text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
                          Billed annually • ${getDisplayPrice(selectedPlanDetails)}/month
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Right Column - Payment Form */}
            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Lock className="h-5 w-5" />
                    Secure Checkout
                  </CardTitle>
                  <CardDescription className="text-base">
                    🍎 Apple Pay, Google Pay, and all major credit cards accepted
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ✨ <strong>New Checkout Experience:</strong> Click "Continue to Payment" to open Stripe's secure checkout with Apple Pay, Google Pay, and all payment methods.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="cardNumber" className="text-base">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="font-mono h-12 text-base"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Payment details will be entered securely on Stripe's checkout page</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="expiry" className="text-base">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        className="font-mono h-12 text-base"
                        disabled
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="cvc" className="text-base">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        value={cvc}
                        onChange={handleCvcChange}
                        className="font-mono h-12 text-base"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="cardName" className="text-base">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="h-12 text-base"
                      disabled
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="billingZip" className="text-base">Billing ZIP Code</Label>
                    <Input
                      id="billingZip"
                      placeholder="12345"
                      value={billingZip}
                      onChange={(e) => setBillingZip(e.target.value)}
                      className="h-12 text-base"
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12 px-8 text-base">
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpgrade} 
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 px-8 text-base font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Opening Stripe Checkout...
                    </>
                  ) : (
                    <>
                      Continue to Payment <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 mt-6">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}