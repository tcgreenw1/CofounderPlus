import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, CheckCircle2, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/clipboard';

interface TwoFactorAuthProps {
  user: any;
  onComplete?: () => void;
}

export function TwoFactorAuth({ user, onComplete }: TwoFactorAuthProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'check' | 'enroll' | 'verify' | 'enabled'>('check');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if 2FA is already enabled
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error checking 2FA status:', error);
        setError('Failed to check 2FA status');
        return;
      }

      const totpFactor = data?.totp?.[0];
      if (totpFactor && totpFactor.status === 'verified') {
        setIsEnabled(true);
        setStep('enabled');
      } else {
        setStep('check');
      }
    } catch (err: any) {
      console.error('Error checking 2FA:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const enrollTwoFactor = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: user?.email || 'Cofounder Account'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('verify');
    } catch (err: any) {
      console.error('Error enrolling 2FA:', err);
      setError(err.message || 'Failed to enroll 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Get the challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: secret
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: secret,
        challengeId: challengeData.id,
        code: verifyCode
      });

      if (error) throw error;

      setIsEnabled(true);
      setStep('enabled');
      toast.success('Two-factor authentication enabled successfully!');
      
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      console.error('Error verifying 2FA:', err);
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id
        });

        if (error) throw error;

        setIsEnabled(false);
        setStep('check');
        toast.success('Two-factor authentication disabled');
      }
    } catch (err: any) {
      console.error('Error disabling 2FA:', err);
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    const success = await copyToClipboard(secret);
    if (success) {
      setCopied(true);
      toast.success('Secret key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(0, 224, 255, 0.1)' }}>
            <Shield className="w-5 h-5" style={{ color: '#00E0FF' }} />
          </div>
          <div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Check status */}
        {step === 'check' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border">
              <h3 className="font-medium mb-2">Secure Your Account</h3>
              <p className="text-sm opacity-70 mb-4">
                Two-factor authentication (2FA) adds an extra layer of security by requiring a verification code from your authenticator app when signing in.
              </p>
              <ul className="text-sm opacity-70 space-y-2 mb-4">
                <li>✓ Protects against unauthorized access</li>
                <li>✓ Works with Google Authenticator, Authy, or similar apps</li>
                <li>✓ Required for high-security features</li>
              </ul>
            </div>

            <Button
              onClick={enrollTwoFactor}
              disabled={isLoading}
              className="w-full"
              style={{ backgroundColor: '#00E0FF', color: '#000000' }}
            >
              {isLoading ? 'Loading...' : 'Enable Two-Factor Authentication'}
            </Button>
          </div>
        )}

        {/* Step 2: Enroll - Show QR code */}
        {step === 'verify' && (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </AlertDescription>
            </Alert>

            <div className="flex justify-center p-4 bg-white rounded-xl">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>

            <div className="space-y-2">
              <Label>Or enter this code manually:</Label>
              <div className="flex gap-2">
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={copySecret}
                  variant="outline"
                  size="icon"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-code">Enter 6-digit verification code</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('check')}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={verifyTwoFactor}
                disabled={isLoading || verifyCode.length !== 6}
                className="flex-1"
                style={{ backgroundColor: '#00E0FF', color: '#000000' }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Enabled */}
        {step === 'enabled' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" style={{ color: '#00E0FF' }} />
              <AlertDescription>
                Two-factor authentication is <strong>enabled</strong> and protecting your account
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-xl border">
              <h3 className="font-medium mb-2">Your Account is Secured</h3>
              <p className="text-sm opacity-70 mb-4">
                You'll need to enter a verification code from your authenticator app each time you sign in.
              </p>
              <p className="text-sm opacity-70">
                <strong>Important:</strong> Make sure you don't lose access to your authenticator app, or you may be locked out of your account.
              </p>
            </div>

            <Button
              onClick={disableTwoFactor}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}