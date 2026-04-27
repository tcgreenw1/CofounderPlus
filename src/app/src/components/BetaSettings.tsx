import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Lock,
  Unlock,
  Zap,
  Crown,
  Rocket,
  Star,
  Check,
  AlertTriangle,
  Loader2,
  Smartphone,
  Mail,
  Send
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { MobileUpgradeModal } from './MobileUpgradeModal';
import { useCloudSubscription } from './CloudSubscriptionContext';

interface BetaSettingsProps {
  user: any;
}

interface PlanOption {
  id: string;
  name: string;
  displayName: string;
  icon: any;
  color: string;
  description: string;
  features: string[];
}

const BETA_PASSWORD = 'cofounder2025'; // You can change this to whatever you want

export function BetaSettings({ user }: BetaSettingsProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [showIOSUpgradeModal, setShowIOSUpgradeModal] = useState(false);
  const [sendingTestInvite, setSendingTestInvite] = useState(false);
  const { refreshSubscriptions } = useCloudSubscription();

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

  const plans: PlanOption[] = [
    {
      id: 'free',
      name: 'free',
      displayName: 'Free / Starter',
      icon: Star,
      color: '#999999',
      description: 'Basic features for getting started',
      features: [
        '1 Business',
        'Basic Roadmap',
        'Limited AI Chats',
        'Community Support'
      ]
    },
    {
      id: 'creator',
      name: 'creator',
      displayName: 'Creator',
      icon: Zap,
      color: '#4B00FF',
      description: 'For solo entrepreneurs and creators',
      features: [
        '3 Businesses',
        'Advanced Roadmaps',
        'Unlimited AI Chats',
        'Priority Support',
        'Finance Operations',
        'Product Management'
      ]
    },
    {
      id: 'builder',
      name: 'builder',
      displayName: 'Builder',
      icon: Rocket,
      color: '#00E0FF',
      description: 'For teams building together',
      features: [
        '5 Businesses',
        'Team Collaboration (2 seats)',
        'All Creator Features',
        'HR Operations',
        'Sales & Marketing Tools',
        'Advanced Analytics'
      ]
    },
    {
      id: 'studio',
      name: 'studio',
      displayName: 'Studio',
      icon: Crown,
      color: '#FFCF00',
      description: 'For agencies and studios',
      features: [
        'Unlimited Businesses',
        'Team Collaboration (3 seats)',
        'All Builder Features',
        'White-label Options',
        'API Access',
        'Dedicated Support'
      ]
    }
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === BETA_PASSWORD) {
      setIsUnlocked(true);
      setShowPasswordDialog(false);
      toast.success('BETA mode unlocked!');
    } else {
      toast.error('Incorrect password');
      setPassword('');
    }
  };

  const handleChangePlan = async (planId: string) => {
    setLoading(true);
    
    try {
      console.log(`🧪 BETA: Changing plan to ${planId}`);
      console.log(`🧪 BETA: Plan ID type:`, typeof planId, `Value: "${planId}"`);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be signed in');
        setLoading(false);
        return;
      }

      const accessToken = session.access_token;
      
      // Use the main AI server for beta endpoints (373d8b09)
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/beta/change-plan`;
      
      console.log('═══════════════════════════════════════════════');
      console.log('🧪 BETA: Plan Change Request');
      console.log('═══════════════════════════════════════════════');
      console.log('Target Plan:', planId);
      console.log('Project ID:', projectId);
      console.log('User ID:', user.id);
      console.log('Access Token Length:', accessToken?.length || 0);
      console.log('URL:', url);
      
      // Log the request body
      const requestBody = {
        userId: user.id,
        plan: planId
      };
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('═══════════════════════════════════════════════');
      
      let response;
      
      try {
        console.log(`\n🔄 Attempting: ${url}`);
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('✓ Fetch succeeded');
        console.log('  Status:', response.status, response.statusText);
        console.log('  Headers:', Object.fromEntries(response.headers.entries()));
        
      } catch (err: any) {
        console.error(`✗ Fetch failed for URL: ${url}`);
        console.error('  Error type:', err.name);
        console.error('  Error message:', err.message);
        console.error('  Full error:', err);
        
        const errorMessage = `Network error: ${err.message}. This could be a CORS issue or the function isn't deployed.`;
        
        console.error('\n═══════════════════════════════════════════════');
        console.error('❌ BETA ENDPOINT FAILURE');
        console.error('═══════════════════════════════════════════════');
        console.error('Error:', errorMessage);
        console.error('');
        console.error('📋 Debugging Steps:');
        console.error('1. Deploy the server function to Supabase');
        console.error('2. Check Supabase dashboard > Edge Functions');
        console.error('3. Look for CORS errors in Network tab');
        console.error('═══════════════════════════════════════════════');
        throw new Error(errorMessage);
      }
      
      if (!response) {
        throw new Error('BETA endpoints are not responding. The server function needs to be deployed.');
      }
      
      console.log('\n✅ Successfully connected to:', url);

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('🧪 BETA: Raw response:', responseText);
      console.log('🧪 BETA: Response status:', response.status);
      console.log('🧪 BETA: Response OK?:', response.ok);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🧪 BETA: Parsed response:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('🧪 BETA: Failed to parse response as JSON:', parseError);
        console.error('🧪 BETA: Response text:', responseText);
        throw new Error(`Invalid server response: ${responseText.substring(0, 100)}`);
      }

      console.log('\n═══════════════════════════════════════════════');
      console.log('🧪 BETA: Response Analysis');
      console.log('═══════════════════════════════════════════════');
      console.log('response.ok:', response.ok);
      console.log('data.success:', data.success);
      console.log('data.error:', data.error);
      console.log('data.subscriptionData:', data.subscriptionData);
      console.log('═══════════════════════════════════════════════');

      if (response.ok && data.success) {
        console.log('🧪 BETA: Plan change successful!', data);
        console.log('🧪 BETA: New subscription data:', data.subscriptionData);
        
        toast.success(`Plan changed to ${planId.toUpperCase()}!`, {
          description: 'Refreshing to apply changes...',
          duration: 2000
        });
        
        // Don't clear localStorage - let the fresh data override it on reload
        console.log('🧪 BETA: Keeping localStorage intact for smooth transition');
        
        // Wait a bit for KV store to be fully consistent
        setTimeout(() => {
          console.log('🧪 BETA: Reloading page to fetch fresh subscription data');
          window.location.reload();
        }, 2000); // Increased to 2 seconds for KV store consistency
      } else {
        console.error('🧪 BETA: Plan change failed!');
        console.error('  Response status:', response.status);
        console.error('  Response data:', data);
        toast.error(data.error || 'Failed to change plan', {
          description: `Status: ${response.status}. Check console for details.`
        });
        setLoading(false);
      }

    } catch (error: any) {
      console.error('🧪 BETA: Error changing plan:', error);
      
      // Show helpful error message
      if (error.message?.includes('not responding') || error.message?.includes('Failed to fetch')) {
        toast.error('Server not responding', {
          description: 'The BETA feature needs to be deployed. Check console for details.',
          duration: 5000
        });
        console.error('═══════════════════════════════════════════════');
        console.error('🧪 BETA DEPLOYMENT REQUIRED');
        console.error('═══════════════════════════════════════════════');
        console.error('The server function needs to be deployed to Supabase.');
        console.error('');
        console.error('📋 Quick Fix:');
        console.error('1. Run: supabase functions deploy server');
        console.error('2. Open: test-server-live.html to verify');
        console.error('3. Try again in the app');
        console.error('');
        console.error('📚 Full Guide: BETA_FAILED_TO_FETCH_FIX.md');
        console.error('═══════════════════════════════════════════════');
      } else {
        toast.error('Failed to change plan', {
          description: error.message || 'Unknown error occurred'
        });
      }
      
      setLoading(false);
    }
  };

  const handleTestInvitation = async () => {
    const testEmail = 'tcgreenw@gmail.com';
    setSendingTestInvite(true);

    try {
      console.log('🧪 BETA: Sending test invitation to:', testEmail);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/beta/test-invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: testEmail,
            name: 'Test User'
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send test invitation: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🧪 BETA: Test invitation result:', result);

      if (result.success) {
        toast.success(`📧 Test invitation email sent to ${testEmail}!`, {
          description: 'Check the email to verify invitation system is working.',
          duration: 5000
        });
      } else {
        throw new Error(result.error || 'Failed to send test invitation');
      }

    } catch (error: any) {
      console.error('🧪 BETA: Error sending test invitation:', error);
      toast.error('Failed to send test invitation', {
        description: error.message || 'Unknown error occurred'
      });
    } finally {
      setSendingTestInvite(false);
    }
  };

  if (!isUnlocked) {
    return (
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-[#4B00FF]" />
              <DialogTitle>BETA Access Required</DialogTitle>
            </div>
            <DialogDescription>
              Enter the BETA password to access testing features
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="beta-password">Password</Label>
              <Input
                id="beta-password"
                type="password"
                placeholder="Enter BETA password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4 text-[#FFCF00]" />
              <AlertDescription>
                This area is for testing only. Changes made here will affect your actual account.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#4B00FF] hover:bg-[#4B00FF]/90"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unlock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      {/* BETA Header */}
      <Card className="border-[#4B00FF]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#4B00FF]/10">
                <Zap className="h-5 w-5 text-[#4B00FF]" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  BETA Testing Mode
                  <Badge variant="outline" className="border-[#4B00FF] text-[#4B00FF]">
                    Active
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Test different subscription plans instantly
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsUnlocked(false);
                setShowPasswordDialog(true);
                setPassword('');
              }}
            >
              <Lock className="h-4 w-4 mr-2" />
              Lock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4 text-[#FFCF00]" />
            <AlertDescription>
              <strong>Warning:</strong> These changes affect your actual account. Use only for testing. The page will reload after changing plans.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Plan Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          
          return (
            <Card 
              key={plan.id}
              className="relative overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: plan.color }}
              />
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${plan.color}20` }}
                    >
                      <Icon 
                        className="h-6 w-6"
                        style={{ color: plan.color }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-[#6CFF6C] flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleChangePlan(plan.name)}
                  disabled={loading}
                  className="w-full"
                  style={{
                    backgroundColor: plan.color,
                    color: plan.id === 'studio' ? '#000000' : '#FFFFFF'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      Switch to {plan.displayName}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Click on any plan above to instantly switch to that subscription tier</p>
          <p>• Your account will be updated in the database immediately</p>
          <p>• The page will reload automatically to apply changes</p>
          <p>• All features of the selected plan will be available</p>
          <p>• Use this to test different subscription levels</p>
        </CardContent>
      </Card>

      {/* iOS IAP Testing Card */}
      <Card className="border-[#FF6B00]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#FF6B00]/10">
              <Smartphone className="h-5 w-5 text-[#FF6B00]" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                iOS In-App Purchase Testing
                <Badge 
                  variant="outline" 
                  className="border-[#FF6B00] text-[#FF6B00] animate-pulse"
                >
                  SANDBOX
                </Badge>
              </CardTitle>
              <CardDescription>
                Test iOS IAP with Apple Sandbox Environment
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-[#FF6B00] bg-[#FF6B00]/10">
            <AlertTriangle className="h-4 w-4 text-[#FF6B00]" />
            <AlertDescription>
              <strong>Test Mode:</strong> This uses Apple's Sandbox environment for testing. 
              Purchases will NOT charge real money. Testing requires a sandbox test account configured in iOS Settings.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">What this tests:</p>
            <p>✓ Full iOS IAP flow with native StoreKit integration</p>
            <p>✓ Purchase dialog, payment processing, and subscription activation</p>
            <p>✓ Backend receipt validation with /iap/validate-receipt endpoint</p>
            <p>✓ ALL production code paths in sandbox environment</p>
            <p className="pt-2 font-semibold text-foreground">Requirements:</p>
            <p>⚠️ Must be on an iOS device or simulator</p>
            <p>⚠️ Sandbox test account configured in iOS Settings</p>
            <p>⚠️ Products must exist in App Store Connect sandbox</p>
          </div>

          <Button
            onClick={() => setShowIOSUpgradeModal(true)}
            className="w-full h-12"
            style={{ backgroundColor: '#FF6B00', color: '#FFFFFF' }}
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Test iOS IAP Flow (Sandbox)
          </Button>

          <div className="pt-2 text-xs text-center text-muted-foreground">
            <p>After successful testing, production will work identically with real API key</p>
          </div>
        </CardContent>
      </Card>

      {/* Test Invitation Email Card */}
      <Card style={{ borderColor: 'var(--color-success)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-success-bg)' }}>
              <Mail className="h-5 w-5" style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Test Invitation Email
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: 'var(--color-success)',
                    color: 'var(--color-success)'
                  }}
                >
                  EMAIL TEST
                </Badge>
              </CardTitle>
              <CardDescription>
                Test the invitation email system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert style={{ 
            borderColor: 'var(--color-info)', 
            backgroundColor: 'var(--color-info-bg)' 
          }}>
            <Mail className="h-4 w-4" style={{ color: 'var(--color-info)' }} />
            <AlertDescription>
              <strong>Test Mode:</strong> This will send a real invitation email to tcgreenw@gmail.com. 
              Use this to verify that invitation emails are working correctly.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            <p style={{ color: 'var(--color-foreground)' }}>What this tests:</p>
            <p>✓ Email delivery via Supabase email service</p>
            <p>✓ Invitation email template rendering</p>
            <p>✓ Invitation link generation</p>
            <p>✓ Full email flow without checking user existence</p>
          </div>

          <Button
            onClick={handleTestInvitation}
            disabled={sendingTestInvite}
            className="w-full h-12"
            style={{ 
              backgroundColor: 'var(--color-success)', 
              color: 'var(--color-on-success)' 
            }}
          >
            {sendingTestInvite ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send Test Invitation to tcgreenw@gmail.com
              </>
            )}
          </Button>

          <div className="pt-2 text-xs text-center" style={{ color: 'var(--color-muted-foreground)' }}>
            <p>Check inbox and spam folder for the invitation email</p>
          </div>
        </CardContent>
      </Card>

      {/* iOS Upgrade Modal - Opened in TEST MODE */}
      <MobileUpgradeModal
        isOpen={showIOSUpgradeModal}
        onClose={() => setShowIOSUpgradeModal(false)}
        currentPlan="free"
        testMode={true}
        onUpgradeSuccess={async () => {
          console.log('🎉 IAP: Purchase successful! Refreshing subscription data...');
          toast.success('Purchase Successful!', {
            description: 'Refreshing your subscription status...',
            duration: 3000
          });
          
          // Wait a bit for the backend to fully process
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Refresh subscription data from the server
          try {
            await refreshSubscriptions();
            console.log('✅ IAP: Subscription data refreshed successfully');
            toast.success('Subscription Activated!', {
              description: 'Your upgraded plan is now active.',
              duration: 3000
            });
          } catch (error) {
            console.error('❌ IAP: Failed to refresh subscription data:', error);
            toast.error('Please refresh the page', {
              description: 'Your purchase was successful but we need to reload subscription data.',
              duration: 5000
            });
          }
        }}
      />
    </div>
  );
}