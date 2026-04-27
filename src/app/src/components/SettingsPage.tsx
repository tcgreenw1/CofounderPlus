import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { SecuritySettings } from './SecuritySettings';
import { TeamManagement } from './TeamManagement';
import { BetaSettings } from './BetaSettings';
import { PricingPage } from './PricingPage';
import { AppleExternalPurchaseModal } from './AppleExternalPurchaseModal';
import { MobileUpgradeModal } from './MobileUpgradeModal';
import { MobileCustomizationSettings } from './MobileCustomizationSettings';
import { DesktopNavCustomization } from './DesktopNavCustomization';
import { SettingsPlanIAP } from './SettingsPlanIAP';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { CreditDisplay } from './CreditDisplay';
import { CreditPurchase } from './CreditPurchase';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useIsMobile } from './ui/use-mobile';
import { isIOS, isWeb } from '../utils/platformDetection';
import { 
  Users, 
  CreditCard, 
  Shield, 
  Zap, 
  ArrowLeft,
  Settings as SettingsIcon,
  ExternalLink,
  Crown,
  User,
  Palette,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Edit3,
  Cable,
  ArrowRight,
  Monitor,
  Smartphone,
  Bot,
  Sparkles,
  LogOut
} from 'lucide-react';

interface SettingsPageProps {
  user: any;
  userData?: any;
  onBack?: () => void;
}

export function SettingsPage({ user, userData, onBack }: SettingsPageProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
  // Get subscription data from CloudSubscriptionContext (handles iOS IAP correctly)
  const { subscriptionData, planDisplayName } = useCloudSubscription();
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.name || user?.user_metadata?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email change state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;
  
  // Detect if we're in iOS native app vs web browser
  const isIOSApp = isIOS();
  const isWebBrowser = isWeb();

  // Sync activeTab with URL parameter
  React.useEffect(() => {
    const tab = searchParams.get('tab') || 'profile';
    setActiveTab(tab);
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleIntegrationsNavigate = () => {
    navigate('/integrations');
  };

  // Apple Modal handlers
  const handleAppleModalCancel = () => {
    setShowAppleModal(false);
  };

  const handleAppleModalContinue = () => {
    setShowAppleModal(false);
    // User has acknowledged Apple's policy, proceed with upgrade flow
    setUpgradeModalOpen(true);
  };

  const updateProfile = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 SettingsPage: Updating display name to:', displayName);
      console.log('🔄 SettingsPage: Server URL:', serverUrl);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log('🔄 SettingsPage: Access token available:', !!accessToken);
      console.log('🔄 SettingsPage: Access token length:', accessToken?.length || 0);

      if (!accessToken) {
        throw new Error('Not authenticated - no access token');
      }

      const requestUrl = `${serverUrl}/user/profile`;
      console.log('🔄 SettingsPage: Making request to:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: displayName,
        }),
      });

      console.log('🔄 SettingsPage: Response status:', response.status);
      console.log('🔄 SettingsPage: Response ok:', response.ok);
      console.log('🔄 SettingsPage: Response status text:', response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SettingsPage: Profile updated successfully', data);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        
        // Reload to show updated name
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error('❌ SettingsPage: Error response:', errorText);
        console.error('❌ SettingsPage: Response status:', response.status);
        console.error('❌ SettingsPage: Response status text:', response.statusText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error('❌ SettingsPage: Parsed error data:', errorData);
        } catch {
          errorData = { error: errorText };
        }
        
        const errorMessage = errorData.error || errorData.message || 'Failed to update profile';
        const errorCode = errorData.errorCode ? ` (Code: ${errorData.errorCode})` : '';
        throw new Error(errorMessage + errorCode);
      }
    } catch (err: any) {
      console.error('❌ SettingsPage: Update exception:', err);
      console.error('❌ SettingsPage: Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const changeEmail = async () => {
    setIsChangingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      console.log('🔄 SettingsPage: Changing email to:', newEmail);
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${serverUrl}/user/email`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
        }),
      });

      console.log('🔄 SettingsPage: Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SettingsPage: Email updated successfully', data);
        
        // Check if verification is required
        if (data.requiresVerification) {
          setEmailSuccess('📧 Verification email sent! Please check your NEW email inbox and click the verification link to complete the email change.');
        } else {
          setEmailSuccess('Email updated successfully!');
        }
        
        setIsEditingEmail(false);
        setNewEmail('');
        
        // Reload to show updated email
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error('❌ SettingsPage: Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || errorData.message || 'Failed to update email');
      }
    } catch (err: any) {
      console.error('❌ SettingsPage: Update exception:', err);
      setEmailError(err.message || 'An error occurred while updating your email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleSignOut = async () => {
    console.log('🚪 SettingsPage: Sign out initiated');
    
    // Step 1: Sign out from Supabase
    try {
      await supabase.auth.signOut();
      console.log('✅ SettingsPage: Supabase sign out successful');
    } catch (error) {
      console.error('❌ SettingsPage: Supabase sign out error:', error);
    }
    
    // Step 2: Clear storage
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ SettingsPage: Storage cleared');
    } catch (e) {
      console.error('Storage clear error:', e);
    }
    
    // Step 3: Redirect
    window.location.href = '/';
  };

  return (
    <div 
      className="bg-background starry-background"
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
      }}
    >
      <div 
        className="max-w-7xl mx-auto"
        style={{
          paddingTop: isMobile && isIOSApp ? 'calc(env(safe-area-inset-top, 0px) + var(--spacing-4))' : isMobile ? 'calc(env(safe-area-inset-top, 0px) + 70px)' : 'var(--spacing-4)',
          paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom, 0px) + 120px, 120px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
          paddingLeft: 'var(--spacing-4)',
          paddingRight: 'var(--spacing-4)',
        }}
      >
        {/* Header - Improved spacing */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <Button
            variant="ghost"
            onClick={() => onBack ? onBack() : navigate(-1)}
            className="hover:bg-accent"
            style={{
              marginBottom: 'var(--spacing-4)',
              padding: 'var(--spacing-2) var(--spacing-3)',
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="relative">
            {/* Liquid Glass Header Card - Consistent padding */}
            <div 
              className="relative overflow-hidden backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 shadow-lg"
              style={{
                borderRadius: 'var(--radius-2xl)',
                padding: 'var(--spacing-5)',
              }}
            >
              {/* Subtle animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-blue-50/50 dark:from-cyan-950/30 dark:via-transparent dark:to-blue-950/30 animate-pulse" style={{ animationDuration: '3s' }} />
              
              {/* Floating particles */}
              <div className="absolute top-2 right-4 w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--primary)', opacity: 0.3, animationDelay: '0s', animationDuration: '2s' }} />
              <div className="absolute top-8 right-12 w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--primary)', opacity: 0.3, animationDelay: '0.3s', animationDuration: '2.5s' }} />
              <div className="absolute bottom-4 left-8 w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--primary)', opacity: 0.3, animationDelay: '0.6s', animationDuration: '2.2s' }} />
              
              <div className="relative flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
                <div className="flex items-center justify-between" style={{ gap: 'var(--spacing-4)' }}>
                  <div className="flex items-center" style={{ gap: 'var(--spacing-4)' }}>
                    {/* Icon Container with liquid glass effect */}
                    <div className="relative">
                      <div 
                        className="backdrop-blur-md bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-900/30 border border-white/40 dark:border-gray-700/40 shadow-xl flex items-center justify-center"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: 'var(--radius-2xl)',
                        }}
                      >
                        <SettingsIcon className="w-7 h-7" style={{ color: 'var(--primary)' }} strokeWidth={2} />
                      </div>
                      {/* Glow effect */}
                      <div className="absolute inset-0 blur-xl -z-10" style={{ backgroundColor: 'var(--primary)', opacity: 0.2, borderRadius: 'var(--radius-2xl)' }} />
                    </div>
                    
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                        Settings
                      </h1>
                      <p className="text-sm text-muted-foreground" style={{ marginTop: 'var(--spacing-1)' }}>
                        Manage your account settings and preferences
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cofounder Settings Button - Stacked below on mobile for better fit */}
                <Button
                  onClick={() => navigate('/cofounder-settings')}
                  variant="default"
                  size="lg"
                  className="flex items-center transition-all hover:scale-105 hover:shadow-xl w-full sm:w-auto group"
                  style={{
                    gap: 'var(--spacing-2)',
                    padding: 'var(--spacing-3) var(--spacing-6)',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    border: '2px solid var(--primary)',
                    color: 'var(--primary-foreground)',
                    fontWeight: 'var(--font-weight-bold)',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 224, 255, 0.3)',
                  }}
                >
                  <Bot className="size-5 group-hover:animate-pulse" />
                  <span>Configure Cofounder Automation</span>
                  <Sparkles className="size-5 group-hover:animate-pulse" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <TabsList className={`grid w-full ${isMobile && isIOSApp ? 'grid-cols-5' : 'grid-cols-6'} lg:w-auto`}>
            <TabsTrigger value="profile">
              Profile
            </TabsTrigger>
            <TabsTrigger value="customization">
              Custom
            </TabsTrigger>
            <TabsTrigger value="team">
              Team
            </TabsTrigger>
            <TabsTrigger value="plan">
              Plan
            </TabsTrigger>
            <TabsTrigger value="security">
              Security
            </TabsTrigger>
            {!(isMobile && isIOSApp) && (
              <TabsTrigger value="beta">
                BETA
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
              {/* Profile Overview Card - Fixed overflow and spacing */}
              <Card style={{ borderRadius: 'var(--radius-2xl)' }}>
                <CardHeader style={{ padding: 'var(--spacing-5)' }}>
                  <div className="flex items-center justify-between" style={{ gap: 'var(--spacing-4)' }}>
                    <div className="flex items-center" style={{ gap: 'var(--spacing-4)', minWidth: 0, flex: 1 }}>
                      <Avatar className="h-16 w-16" style={{ flexShrink: 0 }}>
                        <AvatarFallback className="text-lg">
                          {getInitials(displayName || user?.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <CardTitle className="text-xl" style={{ marginBottom: 'var(--spacing-1)' }}>
                          {displayName || 'User'}
                        </CardTitle>
                        <CardDescription className="flex items-center" style={{ gap: 'var(--spacing-2)', minWidth: 0 }}>
                          <Mail className="h-4 w-4" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.email}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={userData?.role === 'admin' ? 'default' : 'secondary'} style={{ flexShrink: 0 }}>
                      {userData?.role || 'User'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent style={{ padding: 'var(--spacing-5)', paddingTop: 0 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      <Label>Account Created</Label>
                      <div className="flex items-center text-sm text-muted-foreground" style={{ gap: 'var(--spacing-2)' }}>
                        <Calendar className="h-4 w-4" style={{ flexShrink: 0 }} />
                        {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      <Label>Email Verified</Label>
                      <div className="flex items-center text-sm" style={{ gap: 'var(--spacing-2)' }}>
                        {user?.email_confirmed_at ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" style={{ flexShrink: 0 }} />
                            <span className="text-green-600 dark:text-green-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-orange-500" style={{ flexShrink: 0 }} />
                            <span className="text-orange-600 dark:text-orange-400">Not verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Profile Card - Improved spacing */}
              <Card style={{ borderRadius: 'var(--radius-2xl)' }}>
                <CardHeader style={{ padding: 'var(--spacing-5)' }}>
                  <div className="flex items-center justify-between" style={{ gap: 'var(--spacing-4)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <CardTitle style={{ marginBottom: 'var(--spacing-1)' }}>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information and email address
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          borderRadius: 'var(--radius-lg)',
                          flexShrink: 0,
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent style={{ padding: 'var(--spacing-5)', paddingTop: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your display name"
                    />
                  </div>

                  {/* Current Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Current Email Address</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* New Email - Show when editing */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Label htmlFor="new-email">New Email Address (Optional)</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Leave blank to keep current email"
                      />
                      <p className="text-xs text-muted-foreground">
                        If you change your email, a verification email will be sent to your new address.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons - Show when editing */}
                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={async () => {
                          // Save both display name and email if provided
                          setIsLoading(true);
                          setError(null);
                          setSuccess(null);
                          setEmailError(null);
                          setEmailSuccess(null);

                          try {
                            // Update display name
                            await updateProfile();
                            
                            // Update email if new one provided
                            if (newEmail && newEmail.trim() !== '' && newEmail !== user?.email) {
                              await changeEmail();
                            }
                            
                            // Success! Exit edit mode
                            setIsEditing(false);
                            setNewEmail('');
                          } catch (err) {
                            // Errors are handled by individual functions
                            console.error('Error saving profile:', err);
                          } finally {
                            setIsLoading(false);
                          }
                        }} 
                        disabled={isLoading || isChangingEmail}
                      >
                        {isLoading || isChangingEmail ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(userData?.name || user?.user_metadata?.name || '');
                          setNewEmail('');
                          setError(null);
                          setSuccess(null);
                          setEmailError(null);
                          setEmailSuccess(null);
                        }}
                        disabled={isLoading || isChangingEmail}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Status Messages */}
                  {error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  {emailError && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{emailError}</AlertDescription>
                    </Alert>
                  )}

                  {emailSuccess && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-300">
                        {emailSuccess} Please check your inbox to verify your new email.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Account Status Card - REMOVED per user request */}
              
              {/* Sign Out Button */}
              <div className="pt-2 pb-6">
                <Button 
                  variant="destructive" 
                  className="w-full h-12 text-base font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  onClick={handleSignOut}
                  style={{
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    backgroundColor: '#ef4444', // Red-500
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </div>
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Version 1.0.0 • Cofounder OS
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customization">
            {isMobile ? (
              <MobileCustomizationSettings user={user} />
            ) : (
              <DesktopNavCustomization user={user} />
            )}
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement user={user} />
          </TabsContent>

          <TabsContent value="plan">
            {/* 
              IN-APP PURCHASE INTEGRATED:
              - Mobile iOS users: IAP plan selector with monthly/annual toggle
              - Desktop users: Full PricingPage
              - Mobile web: Full PricingPage
            */}
            {isMobile && isIOSApp ? (
              // iOS Native App - Inline IAP Plan Selector
              <div className="space-y-6">
                {/* AI Credits Card */}
                <CreditDisplay variant="full" showUpgrade={true} />

                {/* Credit Purchase Component */}
                <CreditPurchase isIOSApp={true} />

                {/* Current Plan Card */}
                <Card className="border-2" style={{ borderColor: 'var(--energy)' }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-6 h-6" style={{ color: 'var(--energy)' }} />
                      Your Current Plan
                    </CardTitle>
                    <CardDescription>
                      {planDisplayName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 207, 0, 0.1)' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{planDisplayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscriptionData?.status === 'trial' ? 'Trial' : subscriptionData?.status === 'subscribed' ? 'Active' : 'Active'}
                          </p>
                          {/* Subscription Period Dates */}
                          {subscriptionData?.subscription?.current_period_start && subscriptionData?.subscription?.current_period_end && (
                            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                              <div className="flex items-center gap-2 text-sm mb-1">
                                <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                                <span style={{ color: 'var(--muted-foreground)' }}>Billing Period</span>
                              </div>
                              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                                <strong>Started:</strong> {new Date(subscriptionData.subscription.current_period_start * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                                <strong>Renews:</strong> {new Date(subscriptionData.subscription.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" style={{ backgroundColor: 'var(--energy)', color: 'var(--energy-foreground)' }}>
                          {subscriptionData?.status === 'trial' ? 'Trial' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* IAP Plan Selector Component */}
                <SettingsPlanIAP />
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Purchases are securely processed through the App Store
                  </p>
                </div>
              </div>
            ) : (
              // Desktop OR Mobile Web Browser - Show full PricingPage with billing management
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                {/* AI Credits Card */}
                <CreditDisplay variant="full" showUpgrade={true} />
                
                {/* Credit Purchase Component */}
                <CreditPurchase isIOSApp={false} />
                
                <PricingPage />
              </div>
            )}
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings user={user} />
          </TabsContent>

          <TabsContent value="beta">
            <BetaSettings user={user} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Apple External Purchase Compliance Modal */}
      <AppleExternalPurchaseModal 
        isOpen={showAppleModal}
        onClose={handleAppleModalCancel}
        onContinue={handleAppleModalContinue}
      />

      {/* Mobile Upgrade Modal for iOS IAP */}
      <MobileUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={user?.app_metadata?.subscription?.plan || 'free'}
        onUpgradeSuccess={() => {
          setUpgradeModalOpen(false);
        }}
      />
    </div>
  );
}