import React, { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TwoFactorChallengeProps {
  onSuccess?: (user: any) => void;
  onCancel?: () => void;
}

export function TwoFactorChallenge({ onSuccess, onCancel }: TwoFactorChallengeProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get the list of MFA factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;

      const totpFactor = factors?.totp?.[0];
      
      if (!totpFactor) {
        throw new Error('No 2FA factor found. Please contact support.');
      }

      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: code
      });

      if (verifyError) throw verifyError;

      toast.success('Verification successful!');
      
      if (onSuccess && data?.user) {
        onSuccess(data.user);
      }
    } catch (err: any) {
      console.error('2FA verification error:', err);
      
      if (err.message?.includes('Invalid TOTP')) {
        setError('Invalid verification code. Please try again.');
      } else {
        setError(err.message || 'Verification failed');
      }
      
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(0, 224, 255, 0.1)' }}>
            <Shield className="w-5 h-5" style={{ color: '#00E0FF' }} />
          </div>
          <div>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
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

        <div className="space-y-2">
          <Label htmlFor="2fa-code">Verification Code</Label>
          <Input
            id="2fa-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={handleKeyPress}
            placeholder="000000"
            className="text-center text-2xl font-mono tracking-widest"
            autoFocus
          />
          <p className="text-sm opacity-60">
            Open your authenticator app and enter the 6-digit code
          </p>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
            className="flex-1"
            style={{ backgroundColor: '#00E0FF', color: '#000000' }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </div>

        <div className="text-center text-sm opacity-60">
          <p>Don't have access to your authenticator app?</p>
          <button
            onClick={() => toast.info('Please contact support for assistance')}
            className="hover:underline mt-1"
            style={{ color: '#00E0FF' }}
          >
            Contact Support
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
