import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EmailVerificationBannerProps {
  user: any;
  onVerified?: () => void;
}

export function EmailVerificationBanner({ user, onVerified }: EmailVerificationBannerProps) {
  const [isVerified, setIsVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const checkVerificationStatus = () => {
    if (!user) return;
    
    // Check if email is confirmed
    // In Supabase, confirmed_at field indicates if email is verified
    const emailConfirmed = user.email_confirmed_at || user.confirmed_at;
    setIsVerified(!!emailConfirmed);
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }

    // Prevent spam - 60 second cooldown
    if (countdown > 0) {
      toast.error(`Please wait ${countdown} seconds before resending`);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setLastSentAt(new Date());
      setCountdown(60); // 60 second cooldown
      toast.success('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      console.error('Error resending verification email:', err);
      
      if (err.message?.includes('Email rate limit exceeded')) {
        toast.error('Too many requests. Please try again in a few minutes.');
        setCountdown(300); // 5 minute cooldown for rate limit
      } else {
        toast.error(err.message || 'Failed to send verification email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show banner if email is verified
  if (isVerified) {
    return null;
  }

  return (
    <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">Email not verified</p>
                <p className="text-sm opacity-90">
                  Please check your inbox at <strong>{user?.email}</strong> and click the verification link.
                </p>
                {lastSentAt && (
                  <p className="text-xs opacity-75">
                    Last sent: {lastSentAt.toLocaleTimeString()}
                  </p>
                )}
              </div>
              
              <Button
                onClick={resendVerificationEmail}
                disabled={isLoading || countdown > 0}
                size="sm"
                variant="outline"
                className="shrink-0 border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-400 dark:hover:bg-yellow-950"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend (${countdown}s)`
                ) : (
                  <>
                    <Mail className="mr-2 h-3 w-3" />
                    Resend Email
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

/**
 * Compact version for use in navigation/header
 */
export function EmailVerificationBadge({ user }: { user: any }) {
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    if (!user) return;
    const emailConfirmed = user.email_confirmed_at || user.confirmed_at;
    setIsVerified(!!emailConfirmed);
  }, [user]);

  if (isVerified) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-800">
      <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
        Email not verified
      </span>
    </div>
  );
}

/**
 * Success message after verification
 */
export function EmailVerifiedSuccess() {
  return (
    <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <p className="font-medium">Email verified successfully! 🎉</p>
          <p className="text-sm opacity-90 mt-1">
            Your account is now fully activated. You can access all features.
          </p>
        </AlertDescription>
      </div>
    </Alert>
  );
}
