import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Mail, 
  Shield, 
  Loader2,
  ArrowLeft,
  RefreshCw,
  Clock
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Email2FAChallengeProps {
  email: string;
  onSuccess: (tempToken: string) => void;
  onBack: () => void;
}

export function Email2FAChallenge({ email, onSuccess, onBack }: Email2FAChallengeProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Send code on mount
  useEffect(() => {
    sendCode();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCode = async () => {
    setSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/send-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to send 2FA code:', data);
        throw new Error(data.error || data.message || 'Failed to send code');
      }

      console.log('✅ 2FA code sent successfully');
      toast.success('Verification code sent to your email!');
      setCountdown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Send code error:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/verify-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Invalid code');
      }

      // Code verified! We now have a session token from Supabase OTP
      toast.success('✅ Verified! Signing you in...');
      
      // Pass the session token to the success handler
      onSuccess(data.tempToken);
    } catch (error: any) {
      console.error('Verify code error:', error);
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-background)' }}>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-accent))',
              }}
            >
              <Mail className="w-8 h-8" style={{ color: 'white' }} />
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription className="mt-2">
                We've sent a 6-digit verification code to
                <br />
                <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>{email}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert style={{ 
            borderColor: 'var(--color-primary-soft)', 
            background: 'var(--color-primary-soft)',
          }}>
            <Shield className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            <AlertDescription style={{ color: 'var(--color-foreground)' }}>
              <strong>Security Check:</strong> Enter the code from Supabase to verify your identity and complete sign in.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              onKeyPress={handleKeyPress}
              maxLength={6}
              className="font-mono text-2xl tracking-widest text-center h-14"
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-center" style={{ color: 'var(--color-muted-foreground)' }}>
              Enter the 6-digit code from your email
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full h-12 text-lg hover:opacity-90 transition-opacity"
            style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-accent))',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Verify & Sign In
              </>
            )}
          </Button>

          <div className="flex flex-col items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Didn't receive the code?</p>
            <Button
              onClick={sendCode}
              disabled={sending || countdown > 0}
              variant="outline"
              size="sm"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-center pt-2" style={{ color: 'var(--color-muted-foreground)' }}>
            <p>The code expires in 1 hour (Supabase default)</p>
            <p className="mt-1">Check your spam folder if you don't see it</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}