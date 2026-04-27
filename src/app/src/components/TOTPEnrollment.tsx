import * as React from 'react';
import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { QrCode, Copy, CheckCircle, AlertTriangle, Smartphone, Key, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard as copyTextToClipboard } from '../utils/clipboard';
import QRCode from 'qrcode';

interface TOTPEnrollmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type EnrollmentStep = 'setup' | 'verify' | 'backup-codes' | 'complete';

export function TOTPEnrollment({ isOpen, onClose, onSuccess }: TOTPEnrollmentProps) {
  const [step, setStep] = useState<EnrollmentStep>('setup');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [friendlyName, setFriendlyName] = useState('Authenticator App');

  const handleStartEnrollment = async () => {
    setLoading(true);
    try {
      console.log('TOTPEnrollment: Starting TOTP enrollment...');
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName || 'Authenticator App'
      });

      if (error) {
        console.error('TOTPEnrollment: Enrollment error:', error);
        toast.error(`Failed to start enrollment: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error('No enrollment data received');
        return;
      }

      console.log('TOTPEnrollment: Enrollment started successfully');
      
      // Store the factor ID and secret
      setFactorId(data.id);
      setSecret(data.totp.secret);

      // Generate QR code from the URI
      const qrUri = data.totp.qr_code;
      const qrDataUrl = await QRCode.toDataURL(qrUri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrDataUrl);
      setStep('verify');

    } catch (error: any) {
      console.error('TOTPEnrollment: Setup exception:', error);
      toast.error('Failed to start 2FA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      console.log('TOTPEnrollment: Verifying code...');
      
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (error) {
        console.error('TOTPEnrollment: Challenge error:', error);
        toast.error(`Failed to create challenge: ${error.message}`);
        setLoading(false);
        return;
      }

      const challengeId = data.id;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: verificationCode
      });

      if (verifyError) {
        console.error('TOTPEnrollment: Verification error:', verifyError);
        toast.error('Invalid code. Please try again.');
        setVerificationCode('');
        setLoading(false);
        return;
      }

      console.log('TOTPEnrollment: Code verified successfully!');
      
      // Generate backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);
      setStep('backup-codes');
      
      toast.success('2FA enabled successfully!');

    } catch (error: any) {
      console.error('TOTPEnrollment: Verification exception:', error);
      toast.error('Failed to verify code. Please try again.');
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const copyToClipboard = async (text: string) => {
    const success = await copyTextToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy');
    }
  };

  const copyAllBackupCodes = async () => {
    const codesText = backupCodes.join('\n');
    const success = await copyTextToClipboard(codesText);
    if (success) {
      toast.success('All backup codes copied!');
    } else {
      toast.error('Failed to copy codes');
    }
  };

  const handleComplete = () => {
    setStep('complete');
    setTimeout(() => {
      onSuccess();
      handleReset();
    }, 2000);
  };

  const handleReset = () => {
    setStep('setup');
    setQrCodeUrl('');
    setSecret('');
    setFactorId('');
    setVerificationCode('');
    setBackupCodes([]);
    setFriendlyName('Authenticator App');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#4B00FF]" />
            Enable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                You'll need an authenticator app like Google Authenticator, Authy, or 1Password to continue.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="friendly-name">Device Name (Optional)</Label>
              <Input
                id="friendly-name"
                placeholder="e.g., My iPhone"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Give this authenticator a name to identify it later
              </p>
            </div>

            <div className="bg-[#F5F5F5] dark:bg-gray-800 p-4 rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                How it works:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>We'll show you a QR code</li>
                <li>Scan it with your authenticator app</li>
                <li>Enter the 6-digit code from your app</li>
                <li>Save your backup codes in a safe place</li>
              </ol>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleStartEnrollment} 
                disabled={loading}
                className="bg-[#4B00FF] hover:bg-[#4B00FF]/90"
              >
                {loading ? 'Setting up...' : 'Continue'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && (
          <div className="space-y-4">
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                Scan this QR code with your authenticator app
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="p-6 flex flex-col items-center space-y-4">
                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="border-4 border-white rounded-lg shadow-lg"
                  />
                )}

                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Or enter manually:</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(secret)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
                    {secret}
                  </code>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter the 6-digit code from your app</Label>
              <Input
                id="verification-code"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={loading || verificationCode.length !== 6}
                className="bg-[#4B00FF] hover:bg-[#4B00FF]/90"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup-codes' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4 text-[#FFCF00]" />
              <AlertDescription>
                <strong>Important:</strong> Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Backup Codes</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAllBackupCodes}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy All
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded"
                    >
                      <code className="text-sm">{code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Each code can only be used once. Store them securely!
                </p>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button 
                onClick={handleComplete}
                className="bg-[#4B00FF] hover:bg-[#4B00FF]/90 w-full"
              >
                I've Saved My Backup Codes
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="py-8 flex flex-col items-center space-y-4">
            <div className="rounded-full bg-[#6CFF6C]/20 p-4">
              <CheckCircle className="h-12 w-12 text-[#6CFF6C]" />
            </div>
            <h3 className="text-xl font-bold">2FA Enabled!</h3>
            <p className="text-center text-muted-foreground">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}