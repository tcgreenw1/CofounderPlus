/**
 * Example implementation showing how to use all email authentication components together
 * 
 * This is a reference implementation - you can integrate these components
 * into your existing AuthPage, SettingsPage, etc.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { EmailAuthWithVerification } from './EmailAuthWithVerification';
import { TwoFactorChallenge } from './TwoFactorChallenge';
import { TwoFactorAuth } from './TwoFactorAuth';
import { EmailVerificationBanner, EmailVerifiedSuccess } from './EmailVerificationBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function EmailAuthExample() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        setNeeds2FA(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setNeeds2FA(false);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
      } else if (event === 'MFA_CHALLENGE_VERIFIED') {
        setUser(session?.user || null);
        setNeeds2FA(false);
      }

      // Check if coming from email verification
      const params = new URLSearchParams(window.location.search);
      if (params.get('type') === 'email' && event === 'SIGNED_IN') {
        setJustVerified(true);
        setTimeout(() => setJustVerified(false), 5000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
      }
      
      setUser(session?.user || null);
    } catch (err) {
      console.error('Error checking session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (authenticatedUser: any) => {
    console.log('User authenticated:', authenticatedUser);
    
    // Check if user has MFA enabled
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const has2FA = factors?.totp?.some(f => f.status === 'verified');
      
      if (has2FA) {
        setNeeds2FA(true);
      } else {
        setUser(authenticatedUser);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error checking MFA:', err);
      setUser(authenticatedUser);
      navigate('/dashboard');
    }
  };

  const handle2FASuccess = (authenticatedUser: any) => {
    console.log('2FA verified:', authenticatedUser);
    setUser(authenticatedUser);
    setNeeds2FA(false);
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNeeds2FA(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#00E0FF' }}></div>
          <p className="opacity-60">Loading...</p>
        </div>
      </div>
    );
  }

  // Show 2FA challenge if needed
  if (needs2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <TwoFactorChallenge 
          onSuccess={handle2FASuccess}
          onCancel={() => {
            setNeeds2FA(false);
            handleSignOut();
          }}
        />
      </div>
    );
  }

  // Show authenticated user dashboard
  if (user) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back!</h1>
              <p className="opacity-60 mt-1">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Email verification banner */}
          {justVerified && <EmailVerifiedSuccess />}
          <EmailVerificationBanner user={user} />

          {/* Settings tabs */}
          <Tabs defaultValue="security" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="space-y-6">
              <TwoFactorAuth user={user} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password or reset it if forgotten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm opacity-60">
                    Use the "Forgot password?" link on the sign-in page to reset your password.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm opacity-60">Email</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm opacity-60">Name</label>
                    <p className="font-medium">{user.user_metadata?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm opacity-60">Account Created</label>
                    <p className="font-medium">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm opacity-60">Email Verified</label>
                    <p className="font-medium">
                      {user.email_confirmed_at || user.confirmed_at ? (
                        <span className="text-green-600">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-600">⚠ Not verified</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Example info */}
          <Card>
            <CardHeader>
              <CardTitle>Example Implementation</CardTitle>
              <CardDescription>
                This page demonstrates all email authentication components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h3 className="font-medium mb-2">Features Demonstrated:</h3>
                <ul className="text-sm space-y-1 opacity-80">
                  <li>✓ Email/password authentication</li>
                  <li>✓ Email verification banner</li>
                  <li>✓ Two-factor authentication (2FA)</li>
                  <li>✓ Session management</li>
                  <li>✓ Auth state listeners</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <h3 className="font-medium mb-2">Integration Tips:</h3>
                <ul className="text-sm space-y-1 opacity-80">
                  <li>• Use <code className="px-1 py-0.5 bg-black/10 rounded">EmailVerificationBanner</code> in your main layout</li>
                  <li>• Add <code className="px-1 py-0.5 bg-black/10 rounded">TwoFactorAuth</code> to your Security Settings</li>
                  <li>• Check for 2FA after sign in and show <code className="px-1 py-0.5 bg-black/10 rounded">TwoFactorChallenge</code></li>
                  <li>• Listen to auth state changes for automatic updates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show sign in/sign up form
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Cofounder</h1>
          <p className="opacity-60">Email Authentication Example</p>
        </div>
        
        <EmailAuthWithVerification 
          onSuccess={handleAuthSuccess}
          redirectTo="/dashboard"
        />

        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
          <p className="text-sm opacity-80">
            This is a demo of the email authentication system.
            <br />
            Try signing up, password reset, and 2FA features!
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailAuthExample;
