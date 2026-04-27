import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Shield, 
  Key, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  QrCode,
  Copy,
  Trash2,
  ArrowLeft,
  RefreshCw,
  Lock,
  Unlock,
  Info,
  Phone,
  Mail,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { TOTPEnrollment } from './TOTPEnrollment';
import { Email2FASettings } from './Email2FASettings';

interface SecuritySettingsProps {
  user: any;
  onBack?: () => void;
}

interface MFAStatus {
  hasMFA: boolean;
  isRequired: boolean;
  factors?: any[];
  error?: string;
  hasEmail2FA?: boolean;
}

interface AuthMethod {
  id: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export function SecuritySettings({ user, onBack }: SecuritySettingsProps) {
  const [loading, setLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ hasMFA: false, isRequired: false });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mfaSupported, setMfaSupported] = useState(false);
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([]);
  
  // Account deletion states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Phone MFA states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [setupMfaMode, setSetupMfaMode] = useState<'none' | 'phone' | 'totp'>('none');
  const [mfaRequired, setMfaRequired] = useState(false);
  
  // Load MFA status and auth methods on component mount
  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    setLoading(true);
    try {
      console.log('SecuritySettings: Loading security status...');
      
      // Load auth methods
      await loadAuthMethods();
      
      // Load MFA status
      await loadMFAStatus();
      
    } catch (error) {
      console.error('SecuritySettings: Error loading security status:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAuthMethods = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('SecuritySettings: Error getting user for auth methods:', error);
        return;
      }

      // Parse identities to get auth methods
      const methods: AuthMethod[] = [];
      
      if (currentUser?.identities) {
        currentUser.identities.forEach((identity: any) => {
          // Use identity_id (UUID) for unlinking, not the id field
          methods.push({
            id: identity.identity_id || identity.id, // Use identity_id which is the proper UUID
            provider: identity.provider,
            created_at: identity.created_at,
            updated_at: identity.updated_at
          });
        });
      }

      console.log('SecuritySettings: Auth methods loaded:', methods);
      setAuthMethods(methods);
      
    } catch (error) {
      console.error('SecuritySettings: Error loading auth methods:', error);
    }
  };

  const loadMFAStatus = async () => {
    try {
      console.log('SecuritySettings: Checking MFA availability...');
      
      // Check if MFA is supported and configured
      const { data: { user: currentUser, session }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('SecuritySettings: Error getting user:', error);
        setMfaStatus({ 
          hasMFA: false, 
          isRequired: false, 
          error: 'Unable to check MFA status' 
        });
        return;
      }

      // Check for Email 2FA
      let hasEmail2FA = false;
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          const email2FAResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/status`,
            {
              headers: {
                'Authorization': `Bearer ${currentSession.access_token}`,
              },
            }
          );
          
          if (email2FAResponse.ok) {
            const email2FAData = await email2FAResponse.json();
            hasEmail2FA = email2FAData.enabled || false;
            console.log('SecuritySettings: Email 2FA status:', hasEmail2FA);
          }
        }
      } catch (email2FAError) {
        console.log('SecuritySettings: Could not check Email 2FA status:', email2FAError);
      }

      // Try to get MFA factors - this will fail gracefully if MFA isn't configured
      try {
        const { data: factors, error: mfaError } = await supabase.auth.mfa.listFactors();
        
        if (mfaError) {
          // MFA not configured at project level
          console.log('SecuritySettings: MFA not available:', mfaError.message);
          setMfaSupported(false);
          setMfaStatus({ 
            hasMFA: hasEmail2FA, // Use email 2FA status
            isRequired: false,
            hasEmail2FA: hasEmail2FA,
            error: 'MFA is not configured for this project'
          });
        } else {
          // MFA is available
          console.log('SecuritySettings: MFA factors loaded:', factors);
          const hasTOTP = factors.totp?.length > 0;
          setMfaSupported(true);
          setMfaStatus({
            hasMFA: hasTOTP || hasEmail2FA, // Combined status
            isRequired: false,
            factors: factors.totp || [],
            hasEmail2FA: hasEmail2FA,
            error: null
          });
        }
      } catch (mfaCheckError) {
        console.log('SecuritySettings: MFA check failed, assuming not supported:', mfaCheckError);
        setMfaSupported(false);
        setMfaStatus({ 
          hasMFA: hasEmail2FA, // Use email 2FA status even if TOTP fails
          isRequired: false,
          hasEmail2FA: hasEmail2FA,
          error: 'MFA functionality is not available'
        });
      }
      
    } catch (error) {
      console.error('SecuritySettings: Error loading MFA status:', error);
      setMfaStatus({ 
        hasMFA: false, 
        isRequired: false, 
        error: 'Failed to load security status' 
      });
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      console.log('SecuritySettings: Updating password...');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setShowPasswordChange(false);
      }
    } catch (error) {
      console.error('SecuritySettings: Password change error:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogleAccount = async () => {
    try {
      console.log('SecuritySettings: Linking Google account...');
      
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/settings?tab=security`,
          scopes: 'email profile'
        }
      });

      if (error) {
        console.error('SecuritySettings: Google linking error:', error);
        
        // Check if it's a policy/configuration error
        if (error.message.includes('policy') || error.message.includes('blocked') || error.message.includes('Access blocked')) {
          toast.error(
            'Google OAuth needs configuration. Please configure Google OAuth in your Supabase dashboard under Authentication > Providers > Google.',
            { duration: 8000 }
          );
          console.error('CONFIGURATION NEEDED: Go to Supabase Dashboard > Authentication > Providers > Google and configure OAuth properly');
        } else {
          toast.error(`Failed to link Google account: ${error.message}`);
        }
      } else {
        // Successful linking will redirect
        toast.success('Redirecting to Google...');
      }
    } catch (error: any) {
      console.error('SecuritySettings: Google linking exception:', error);
      
      // Provide helpful error message
      if (error.message?.includes('policy') || error.message?.includes('blocked')) {
        toast.error(
          'Google OAuth configuration required. Check browser console for setup instructions.',
          { duration: 8000 }
        );
      } else {
        toast.error('Google account linking is temporarily unavailable');
      }
    }
  };

  const handleUnlinkAccount = async (identityId: string, provider: string) => {
    if (authMethods.length <= 1) {
      toast.error('Cannot remove your only sign-in method. Add another method first.');
      return;
    }

    try {
      console.log('SecuritySettings: Unlinking account:', provider, 'with ID:', identityId);
      
      const { error } = await supabase.auth.unlinkIdentity({
        identity_id: identityId
      } as any);

      if (error) {
        console.error('SecuritySettings: Unlink error:', error);
        toast.error(`Failed to unlink ${provider} account: ${error.message}`);
      } else {
        toast.success(`${provider} account unlinked successfully`);
        await loadAuthMethods(); // Refresh the list
      }
    } catch (error: any) {
      console.error('SecuritySettings: Unlink exception:', error);
      toast.error(`Failed to unlink ${provider} account`);
    }
  };

  const handlePhoneMFASetup = async () => {
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    // Auto-format US numbers: if 10 digits, assume US (+1)
    let formattedPhone = phoneNumber.trim();
    
    // Remove any non-digit characters for validation
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    
    // If exactly 10 digits, assume US number and add +1
    if (digitsOnly.length === 10) {
      formattedPhone = `+1${digitsOnly}`;
      console.log('SecuritySettings: Auto-formatted US number:', formattedPhone);
      setPhoneNumber(formattedPhone);
      // Small delay to let the UI update
      await new Promise(resolve => setTimeout(resolve, 100));
    } else if (!formattedPhone.startsWith('+')) {
      toast.error('Phone number must be in international format. US numbers can be 10 digits (e.g., 1234567890) or include +1. International numbers need country code (+[country][number]).');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formattedPhone)) {
      toast.error('Invalid phone format. Please use international format (+1234567890).');
      return;
    }

    setLoading(true);
    try {
      console.log('SecuritySettings: Setting up phone MFA with:', formattedPhone);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error('SecuritySettings: Phone MFA setup error:', error);
        toast.error(`Failed to send verification code: ${error.message}`);
      } else {
        setPhoneOtpSent(true);
        toast.success('Verification code sent! Check your phone.');
      }
    } catch (error: any) {
      console.error('SecuritySettings: Phone MFA setup exception:', error);
      toast.error('Phone verification is temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to normalize phone number input
  const handlePhoneNumberChange = (value: string) => {
    let normalizedValue = value.trim();
    
    // Remove any non-digit characters for US number detection
    const digitsOnly = normalizedValue.replace(/\D/g, '');
    
    // If exactly 10 digits and doesn't start with +, assume US number
    if (digitsOnly.length === 10 && !normalizedValue.startsWith('+')) {
      normalizedValue = `+1${digitsOnly}`;
    }
    
    setPhoneNumber(normalizedValue);
  };

  const handlePhoneMFAVerify = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: phoneOtp,
        type: 'sms'
      });

      if (error) {
        toast.error(`Verification failed: ${error.message}`);
      } else {
        toast.success('Phone number verified and linked!');
        setSetupMfaMode('none');
        setPhoneNumber('');
        setPhoneOtp('');
        setPhoneOtpSent(false);
        await loadAuthMethods();
      }
    } catch (error: any) {
      toast.error('Phone verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (user?.email_confirmed_at) score += 20;
    if (mfaStatus.hasMFA || mfaRequired) score += 30;
    if (authMethods.length > 1) score += 25; // Multiple auth methods
    if (user?.last_sign_in_at) score += 15;
    if (authMethods.some(m => m.provider === 'google')) score += 10; // Google auth adds security
    return Math.min(100, score);
  };

  const securityScore = getSecurityScore();

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'phone': return 'Phone';
      case 'email': return 'Email';
      default: return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      );
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const handleDisableTOTP = async (factorId: string) => {
    setLoading(true);
    try {
      console.log('SecuritySettings: Disabling TOTP factor:', factorId);
      
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorId
      });

      if (error) {
        console.error('SecuritySettings: Unenroll error:', error);
        toast.error(`Failed to disable 2FA: ${error.message}`);
      } else {
        toast.success('Two-factor authentication disabled');
        await loadMFAStatus(); // Refresh status
      }
    } catch (error: any) {
      console.error('SecuritySettings: Disable 2FA exception:', error);
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    // Validate confirmation text
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('SecuritySettings: Starting account deletion...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be signed in to delete your account');
        setIsDeleting(false);
        return;
      }

      const accessToken = session.access_token;
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;
      
      const response = await fetch(`${serverUrl}/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Get response text first to debug
      const responseText = await response.text();
      console.log('SecuritySettings: Raw response:', responseText);
      console.log('SecuritySettings: Response status:', response.status);
      console.log('SecuritySettings: Response URL:', response.url);
      
      // Handle 404 specifically
      if (response.status === 404) {
        console.error('SecuritySettings: Delete account endpoint not found (404)');
        toast.error('Account deletion feature is currently unavailable. The server endpoint needs to be deployed. Please contact support.');
        setIsDeleting(false);
        setDeleteConfirmation('');
        setShowDeleteDialog(false);
        return;
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('SecuritySettings: JSON parse error:', parseError);
        console.error('SecuritySettings: Response was:', responseText);
        
        // Provide more specific error message for 404
        if (responseText.includes('404')) {
          toast.error('Account deletion endpoint not found. Please ensure the server is deployed.');
        } else {
          toast.error('Server returned invalid response. Please try again.');
        }
        setIsDeleting(false);
        setDeleteConfirmation('');
        setShowDeleteDialog(false);
        return;
      }

      if (response.ok && data.success) {
        toast.success('Account deleted successfully. You will be signed out.');
        
        // Sign out and redirect to home page
        setTimeout(async () => {
          await supabase.auth.signOut();
          window.location.href = '/';
        }, 1500);
      } else {
        console.error('Account deletion failed:', data);
        toast.error(data.error || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
        setDeleteConfirmation('');
      }
    } catch (error) {
      console.error('SecuritySettings: Account deletion error:', error);
      toast.error('Failed to delete account. Please try again.');
      setIsDeleting(false);
      setDeleteConfirmation('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-foreground" />
              Security Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account security and authentication settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                Your account security status and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Security Score</h3>
                  <p className="text-sm text-muted-foreground">
                    Overall security rating for your account
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {securityScore}%
                  </div>
                  <Badge variant={securityScore >= 75 ? 'default' : securityScore >= 50 ? 'secondary' : 'destructive'}>
                    {securityScore >= 75 ? 'Strong' : securityScore >= 50 ? 'Good' : 'Weak'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  {user?.email_confirmed_at ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">Email Verified</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email_confirmed_at ? 'Confirmed' : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  {mfaStatus.hasMFA ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">Two-Factor Auth</p>
                    <p className="text-xs text-muted-foreground">
                      {mfaStatus.hasMFA ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  {user?.last_sign_in_at ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-medium">Recent Activity</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.last_sign_in_at ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email-based Two-Factor Authentication */}
          <Email2FASettings user={user} />

          {/* Password Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Management
              </CardTitle>
              <CardDescription>
                Update your account password for enhanced security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showPasswordChange ? (
                <div className="space-y-4">
                  <Alert>
                    <Unlock className="h-4 w-4" />
                    <AlertDescription>
                      Regularly updating your password helps keep your account secure.
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={() => setShowPasswordChange(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handlePasswordChange} disabled={loading}>
                      Update Password
                    </Button>
                    <Button variant="outline" onClick={() => setShowPasswordChange(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Basic information about your account and security status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">{user?.email}</span>
                    {user?.email_confirmed_at ? (
                      <Badge variant="default" className="text-xs">Verified</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Unverified</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Account Created</Label>
                  <p className="text-sm mt-1">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>

                <div>
                  <Label>Last Sign In</Label>
                  <p className="text-sm mt-1">
                    {user?.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleString() 
                      : 'Never'
                    }
                  </p>
                </div>

                <div>
                  <Label>MFA Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm">
                      {mfaSupported ? (mfaStatus.hasMFA ? 'Enabled' : 'Disabled') : 'Not Available'}
                    </span>
                    {mfaSupported ? (
                      mfaStatus.hasMFA ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">Not Configured</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Authentication Methods
              </CardTitle>
              <CardDescription>
                Manage the different ways you can sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {authMethods.map((method) => (
                  <div key={method.id} className="flex items-center gap-2 p-3 border rounded-lg">
                    {getProviderIcon(method.provider)}
                    <div>
                      <p className="font-medium">{getProviderDisplayName(method.provider)}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.created_at ? new Date(method.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlinkAccount(method.id, method.provider)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {!authMethods.some(method => method.provider === 'google') && (
                  <Button onClick={handleLinkGoogleAccount}>
                    <Settings className="h-4 w-4 mr-2" />
                    Link Google Account
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delete Account - DANGER ZONE */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="bg-red-50 dark:bg-red-950/30">
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Account deletion is permanent and cannot be undone. All your data, businesses, settings, and information will be permanently deleted.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium text-red-600 dark:text-red-400">What will be deleted:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Your user account and profile</li>
                  <li>All businesses you've created</li>
                  <li>All roadmap progress and data</li>
                  <li>All notes and documents</li>
                  <li>All subscription and billing information</li>
                  <li>All settings and preferences</li>
                </ul>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Final Warning:</strong> All your data will be permanently deleted. This includes:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>All businesses and projects</li>
                  <li>All progress and roadmaps</li>
                  <li>All notes and documents</li>
                  <li>All subscription data</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="delete-confirmation"
                placeholder="Type DELETE"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                disabled={isDeleting}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleAccountDeletion}
              disabled={isDeleting || deleteConfirmation !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Permanently Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}