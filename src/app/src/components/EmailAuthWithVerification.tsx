import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Mail, Lock, User, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EmailAuthWithVerificationProps {
  onSuccess?: (user: any) => void;
  redirectTo?: string;
}

export function EmailAuthWithVerification({ onSuccess, redirectTo = '/dashboard' }: EmailAuthWithVerificationProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
        }
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setNeedsVerification(true);
        setSuccess(`Verification email sent to ${email}. Please check your inbox and click the link to verify your account.`);
        toast.success('Please check your email to verify your account');
      } else if (data.session) {
        setSuccess('Account created successfully!');
        toast.success('Welcome to Cofounder!');
        if (onSuccess) {
          onSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account');
      toast.error(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      setSuccess('Signed in successfully!');
      toast.success('Welcome back!');
      
      if (onSuccess) {
        onSuccess(data.user);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      if (err.message?.includes('Email not confirmed')) {
        setNeedsVerification(true);
        setError('Please verify your email address before signing in. Check your inbox for the verification link.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else {
        setError(err.message || 'Failed to sign in');
      }
      
      toast.error(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      setSuccess('Password reset email sent! Please check your inbox.');
      toast.success('Password reset email sent');
      
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email');
      toast.error(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
        }
      });

      if (error) throw error;

      setSuccess('Verification email resent! Please check your inbox.');
      toast.success('Verification email resent');
    } catch (err: any) {
      console.error('Resend verification error:', err);
      setError(err.message || 'Failed to resend verification email');
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" style={{ color: '#00E0FF' }} />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowForgotPassword(false)}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={isLoading}
              className="flex-1"
              style={{ backgroundColor: '#00E0FF', color: '#000000' }}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (needsVerification) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" style={{ color: '#00E0FF' }} />
            <AlertDescription>
              Please check your inbox at <strong>{email}</strong> and click the verification link to activate your account.
            </AlertDescription>
          </Alert>

          <div className="p-4 rounded-xl border space-y-2">
            <p className="text-sm opacity-70">
              <strong>Didn't receive the email?</strong>
            </p>
            <ul className="text-sm opacity-70 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>
          </div>

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" style={{ color: '#00E0FF' }} />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={resendVerificationEmail}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>
            <Button
              onClick={() => {
                setNeedsVerification(false);
                setIsLogin(true);
              }}
              variant="ghost"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
        <CardDescription>
          {isLogin 
            ? 'Welcome back! Sign in to your account' 
            : 'Get started with Cofounder today'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" style={{ color: '#00E0FF' }} />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="pl-10"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? 'Enter your password' : 'Min. 8 characters'}
              className="pl-10"
            />
          </div>
        </div>

        {isLogin && (
          <button
            onClick={() => {
              setResetEmail(email);
              setShowForgotPassword(true);
            }}
            className="text-sm opacity-70 hover:opacity-100 transition-opacity"
            style={{ color: '#00E0FF' }}
          >
            Forgot password?
          </button>
        )}

        <Button
          onClick={isLogin ? handleSignIn : handleSignUp}
          disabled={isLoading}
          className="w-full"
          style={{ backgroundColor: '#00E0FF', color: '#000000' }}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLogin ? 'Sign In' : 'Create Account'}
        </Button>

        <div className="text-center text-sm">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="font-medium hover:underline"
                style={{ color: '#00E0FF' }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="font-medium hover:underline"
                style={{ color: '#00E0FF' }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}