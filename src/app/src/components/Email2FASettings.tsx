import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { 
  Mail, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface Email2FASettingsProps {
  user: any;
}

export function Email2FASettings({ user }: Email2FASettingsProps) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isAppleUser, setIsAppleUser] = useState(false);

  // Load 2FA status on mount
  useEffect(() => {
    checkAuthProvider();
    loadStatus();
  }, []);

  // Check if user signed in with Apple
  const checkAuthProvider = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.identities) {
        const hasAppleAuth = currentUser.identities.some(
          (identity: any) => identity.provider === 'apple'
        );
        setIsAppleUser(hasAppleAuth);
      }
    } catch (error) {
      console.error('Failed to check auth provider:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/status`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    }
  };

  const handleToggle = async (newValue: boolean) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to manage 2FA settings');
        return;
      }

      const endpoint = newValue ? 'enable' : 'disable';
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${endpoint} 2FA`);
      }

      setEnabled(newValue);
      toast.success(newValue ? 'Email 2FA enabled successfully!' : 'Email 2FA disabled');
    } catch (error: any) {
      console.error('Toggle 2FA error:', error);
      toast.error(error.message || 'Failed to update 2FA settings');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Email Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security by requiring a code sent to your email when signing in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Apple Sign In Notice */}
        {isAppleUser && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Apple Sign In Detected:</strong> Email 2FA is not available for Apple-authenticated accounts. Your account is already secured through Apple's authentication system.
            </AlertDescription>
          </Alert>
        )}

        {!isAppleUser && (
          <>
            {/* Enable/Disable Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-5 border rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {enabled ? (
                    <Lock className="h-4 w-4 text-green-600" />
                  ) : (
                    <Unlock className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="font-medium">
                    {enabled ? 'Email 2FA Enabled' : 'Email 2FA Disabled'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {enabled 
                    ? 'You\'ll receive a code via email when signing in'
                    : 'Enable to require email verification codes at login'}
                </p>
              </div>
              <div className="flex items-center justify-end sm:justify-start">
                <Switch
                  checked={enabled}
                  onCheckedChange={handleToggle}
                  disabled={loading}
                />
              </div>
            </div>
          </>
        )}

        {/* Status Alert */}
        {!isAppleUser && (
          <>
            {enabled ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Protected:</strong> Your account is secured with email 2FA. You'll receive a verification code at <strong>{user?.email}</strong> when signing in.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>Not Protected:</strong> Enable email 2FA to add an extra security layer to your account.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Info Section */}
        {!isAppleUser && (
          <div className="text-sm text-muted-foreground space-y-2 pt-2">
            <p className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>How it works:</strong> When you sign in, we'll send a verification code to your email. Enter this code to complete your login.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Email delivery:</strong> Codes are sent using SendGrid and expire after 10 minutes.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Security tip:</strong> Never share your verification codes with anyone, including support staff.
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}