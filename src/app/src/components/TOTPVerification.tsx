import * as React from 'react';
import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Key, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TOTPVerificationProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function TOTPVerification({ email, onSuccess, onBack }: TOTPVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const handleVerifyTOTP = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      console.log('TOTPVerification: Getting MFA factors...');
      
      // Get the user's MFA factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('TOTPVerification: Error getting factors:', factorsError);
        toast.error('Failed to verify. Please try again.');
        setLoading(false);
        return;
      }

      const totpFactors = factors?.totp || [];
      if (totpFactors.length === 0) {
        toast.error('No 2FA method found. Please contact support.');
        setLoading(false);
        return;
      }

      const factorId = totpFactors[0].id;
      console.log('TOTPVerification: Creating challenge for factor:', factorId);

      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (challengeError) {
        console.error('TOTPVerification: Challenge error:', challengeError);
        toast.error('Failed to create verification challenge');
        setLoading(false);
        return;
      }

      const challengeId = challengeData.id;
      console.log('TOTPVerification: Verifying code...');

      // Verify the code
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: code
      });

      if (verifyError) {
        console.error('TOTPVerification: Verification error:', verifyError);
        toast.error('Invalid code. Please try again.');
        setCode('');
        setLoading(false);
        return;
      }

      console.log('TOTPVerification: Verification successful!');
      toast.success('Verification successful!');
      onSuccess();

    } catch (error: any) {
      console.error('TOTPVerification: Verification exception:', error);
      toast.error('Failed to verify code. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackupCode = async () => {
    if (!backupCode) {
      toast.error('Please enter a backup code');
      return;
    }

    setLoading(true);
    try {
      // Note: Supabase doesn't have built-in backup code support
      // This would need to be implemented in your server
      // For now, we'll show a message
      toast.error('Backup code verification requires server setup. Please use your authenticator app or contact support.');
      
    } catch (error: any) {
      console.error('TOTPVerification: Backup code error:', error);
      toast.error('Failed to verify backup code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-[#4B00FF]" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Enter the 6-digit code from your authenticator app for <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!useBackupCode ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="totp-code">Authentication Code</Label>
              <Input
                id="totp-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.length === 6) {
                    handleVerifyTOTP();
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                Open your authenticator app to get your code
              </p>
            </div>

            <Button 
              onClick={handleVerifyTOTP}
              disabled={loading || code.length !== 6}
              className="w-full bg-[#4B00FF] hover:bg-[#4B00FF]/90"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setUseBackupCode(true)}
              className="w-full"
            >
              <Key className="h-4 w-4 mr-2" />
              Use Backup Code
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4 text-[#FFCF00]" />
              <AlertDescription>
                Backup codes can only be used once. Make sure to save your remaining codes.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="backup-code">Backup Code</Label>
              <Input
                id="backup-code"
                placeholder="XXXXXXXX"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                className="text-center tracking-wider"
                autoFocus
              />
            </div>

            <Button 
              onClick={handleVerifyBackupCode}
              disabled={loading || !backupCode}
              className="w-full bg-[#4B00FF] hover:bg-[#4B00FF]/90"
            >
              {loading ? 'Verifying...' : 'Verify Backup Code'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setUseBackupCode(false);
                setBackupCode('');
              }}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Authenticator Code
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign In
        </Button>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Lost your device? Contact support to regain access to your account.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
