import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import {
  HelpCircle, Mail, Lock, User, Eye, EyeOff, AlertCircle,
  CheckCircle, Heart, ChevronLeft, Phone, Smartphone, ArrowRight
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { Email2FAChallenge } from './Email2FAChallenge';
import { Logo } from './Logo';

interface EnhancedAuthPageProps {
  authError?: string | null;
  supabaseAvailable?: boolean;
  customServerAvailable?: boolean;
}

type AuthMode = 'login' | 'signup' | 'phone-login' | 'phone-verify';

// Feature flags - set to true when Google/Phone auth are ready
const ENABLE_GOOGLE_AUTH = false; // DISABLED - hiding Google auth button
const ENABLE_PHONE_AUTH = false;
const ENABLE_APPLE_AUTH = false; // DISABLED FOR APP STORE APPROVAL - Apple requires working Sign In implementation

function EnhancedAuthPage({
  authError,
  supabaseAvailable = true,
  customServerAvailable = true
}: EnhancedAuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // Check URL params and state immediately to set initial mode
  const getInitialMode = (): AuthMode => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    
    if (mode === 'login') {
      return 'login';
    } else if (mode === 'signup') {
      return 'signup';
    } else if (location.state?.mode === 'login') {
      return 'login';
    }
    return 'signup'; // Default to signup
  };
  
  const [authMode, setAuthMode] = useState<AuthMode>(getInitialMode());
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'otp'>('email');
  
  // Email 2FA state
  const [showEmail2FA, setShowEmail2FA] = useState(false);
  const [email2FAEmail, setEmail2FAEmail] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  
  // Phone auth specific
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneSession, setPhoneSession] = useState<any>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if iOS (mobile or tablet)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Check if iOS mobile specifically (not iPad)
  const isIOSMobile = /iPhone|iPod/.test(navigator.userAgent);
  
  // Show Google auth only on non-iOS devices
  const showGoogleAuth = ENABLE_GOOGLE_AUTH && !isIOS;
  // Show Apple auth on all devices EXCEPT iOS mobile (iPhone/iPod)
  const showAppleAuth = ENABLE_APPLE_AUTH && !isIOSMobile;

  // Handle URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    const fromQuestionnaire = searchParams.get('from') === 'questionnaire';
    const verified = searchParams.get('verified');
    
    // Check if this is a password reset flow
    if (mode === 'reset-password' && verified === 'true') {
      console.log('EnhancedAuth: Password reset mode detected');
      setShowPasswordReset(true);
      return;
    }
    
    if (mode === 'login') {
      setAuthMode('login');
    } else if (mode === 'signup' || fromQuestionnaire) {
      setAuthMode('signup');
    } else if (location.state?.mode === 'login') {
      setAuthMode('login');
    } else {
      setAuthMode('signup');
    }
  }, [location.search, location.state]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Show service unavailable message if Supabase Auth is down
  if (!supabaseAvailable) {
    return (
      <div className="min-h-screen starry-background transition-all duration-300" style={{ background: '#FFFFFF' }}>
        <div className="shooting-star" style={{ animationDelay: '8s', animationDuration: '5.5s', top: '30%' }}></div>
        
        <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg sm:text-2xl font-bold hover:opacity-80"
            style={{ color: '#4B00FF' }}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-button border-2 transition-all duration-300"
            style={{ borderColor: '#00E0FF' }}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
              style={{ background: '#FF4F4F' }}
            >
              <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: '#FF4F4F' }}
            >
              Authentication Unavailable
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              Our authentication system is temporarily unavailable.
              Please try again later or explore our public features.
            </p>

            <div className="glass-morphism rounded-2xl p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                While we fix this issue, you can still:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/questionnaire')}
                  className="bouncy-button w-full px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-300 text-sm font-medium"
                  style={{ backgroundColor: '#00E0FF', color: '#FFFFFF' }}
                >
                  Try the Business Questionnaire
                </button>
                <button
                  onClick={() => navigate('/help-demo')}
                  className="bouncy-button w-full px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-300 text-sm font-medium"
                  style={{ backgroundColor: '#4B00FF', color: '#FFFFFF' }}
                >
                  Explore Help System Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('EnhancedAuth: Attempting Google Sign In...');
      
      // Import the smart Google Sign In function (handles native vs web automatically)
      const { signInWithGoogle } = await import('../utils/authNative');
      
      const result = await signInWithGoogle();
      
      if (!result.success) {
        console.error('EnhancedAuth: Google Sign In failed:', result.error);
        setError(result.error || 'Google sign-in failed');
        setLoading(false);
      }
      // Note: Successful auth will either redirect (web) or update session (native)
      // The session change will be detected by the auth state listener
    } catch (error: any) {
      console.error('EnhancedAuth: Google Sign In exception:', error);
      setError('Google sign-in is temporarily unavailable. Please try email/password.');
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🍎 EnhancedAuth: Attempting Apple OAuth...');
      console.log('🔗 Redirect URL:', `${window.location.origin}//auth/callback`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}//auth/callback`
        }
      });

      if (error) {
        console.error('❌ EnhancedAuth: Apple OAuth error:', error);
        setError(`Apple sign-in failed: ${error.message}`);
      } else {
        console.log('✅ EnhancedAuth: Apple OAuth initiated, waiting for redirect...');
      }
      // Note: Successful OAuth will redirect, so no need to handle success here
    } catch (error: any) {
      console.error('❌ EnhancedAuth: Apple OAuth exception:', error);
      setError('Apple sign-in is temporarily unavailable. Please try email/password.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    if (!formData.phone) {
      setError('Please enter your phone number');
      return;
    }

    // Auto-format US numbers: if 10 digits, assume US (+1)
    let formattedPhone = formData.phone.trim();
    
    // Remove any non-digit characters for validation
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    
    // If exactly 10 digits, assume US number and add +1
    if (digitsOnly.length === 10) {
      formattedPhone = `+1${digitsOnly}`;
      console.log('EnhancedAuth: Auto-formatted US number:', formattedPhone);
      // Update the form data to show the formatted number
      setFormData({ ...formData, phone: formattedPhone });
    } else if (!formattedPhone.startsWith('+')) {
      // If it doesn't start with + and isn't 10 digits, show error
      setError('Please enter a valid phone number. US numbers: 1234567890 or +11234567890. International: +[country code][number]');
      return;
    }

    // Enhanced phone validation for international format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formattedPhone)) {
      setError('Please enter a valid phone number in international format (+1234567890)');
      return;
    }

    // Check if phone number is too short or too long
    if (formattedPhone.length < 10 || formattedPhone.length > 16) {
      setError('Phone number must be between 10-16 digits including country code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('EnhancedAuth: Attempting phone OTP for:', formattedPhone);
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error('EnhancedAuth: Phone OTP error:', error);
        
        // Enhanced error handling for common SMS issues
        let userFriendlyMessage = `SMS sign-in failed: ${error.message}`;
        
        if (error.message.includes('Phone authentication is disabled')) {
          userFriendlyMessage = 'Phone authentication is not enabled. Please contact support or use email/password.';
        } else if (error.message.includes('SMS provider not configured')) {
          userFriendlyMessage = 'SMS service is not configured. Please contact support or use email/password.';
        } else if (error.message.includes('Invalid phone number')) {
          userFriendlyMessage = 'Invalid phone number format. Use international format: +[country code][number]';
        } else if (error.message.includes('Rate limit exceeded')) {
          userFriendlyMessage = 'Too many SMS requests. Please wait a few minutes before trying again.';
        } else if (error.message.includes('Phone number not allowed')) {
          userFriendlyMessage = 'This phone number is not allowed. Please try a different number or contact support.';
        }
        
        setError(userFriendlyMessage);
      } else {
        console.log('EnhancedAuth: Phone OTP sent successfully');
        setPhoneSession(data.session);
        setAuthMode('phone-verify');
        setSuccess('SMS sent! Please check your phone for the verification code.');
        setResendCooldown(60); // 60 second cooldown
        
        // Update form data with the formatted number
        setFormData({ ...formData, phone: formattedPhone });
      }
    } catch (error: any) {
      console.error('EnhancedAuth: Phone OTP exception:', error);
      setError('SMS sign-in is temporarily unavailable. Please try email/password or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerify = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('EnhancedAuth: Verifying phone OTP...');
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formData.phone,
        token: phoneOtp,
        type: 'sms'
      });

      if (error) {
        console.error('EnhancedAuth: Phone verification error:', error);
        setError(`Verification failed: ${error.message}`);
      } else {
        console.log('EnhancedAuth: Phone verification successful');
        setSuccess('Phone verified! Signing you in...');
        
        // Navigate after successful verification
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      }
    } catch (error: any) {
      console.error('EnhancedAuth: Phone verification exception:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formData.phone,
      });

      if (error) {
        setError(`Failed to resend code: ${error.message}`);
      } else {
        setSuccess('New verification code sent!');
        setResendCooldown(60);
      }
    } catch (error: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const emailToReset = resetEmail || formData.email;
    
    if (!emailToReset) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 EnhancedAuth: Sending password reset email to:', emailToReset);
      
      // This sends an email with BOTH a link AND a 6-digit code
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        console.error('❌ EnhancedAuth: Password reset error:', error);
        toast.error(`Failed to send reset email: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ EnhancedAuth: Password reset email sent successfully');
      toast.success('Reset email sent! Check your email for a 6-digit code.');
      
      // Keep the email and move to OTP step
      setResetEmail(emailToReset);
      setResetStep('otp');
      
    } catch (error: any) {
      console.error('❌ EnhancedAuth: Password reset exception:', error);
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (!resetOtp || resetOtp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter your new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 EnhancedAuth: Verifying reset OTP and updating password...');
      
      // First verify the OTP - this will create a session
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: resetOtp,
        type: 'recovery'
      });

      if (verifyError) {
        console.error('❌ EnhancedAuth: OTP verification error:', verifyError);
        setError(`Invalid or expired code: ${verifyError.message}`);
        setLoading(false);
        return;
      }

      if (!verifyData.session) {
        console.error('❌ EnhancedAuth: No session after OTP verification');
        setError('Verification failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('✅ EnhancedAuth: OTP verified, updating password...');

      // Now update the password using the session
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('❌ EnhancedAuth: Password update error:', updateError);
        setError(`Failed to update password: ${updateError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ EnhancedAuth: Password updated successfully!');
      setSuccess('Password updated successfully! Redirecting...');
      toast.success('Password reset complete!');
      
      // Close dialog and reset state
      setShowForgotPassword(false);
      setResetEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResetStep('email');
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ EnhancedAuth: Reset verification exception:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('EnhancedAuth: Updating password...');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('EnhancedAuth: Password update error:', error);
        setError(`Failed to update password: ${error.message}`);
      } else {
        console.log('EnhancedAuth: Password updated successfully');
        setSuccess('Password updated successfully! Redirecting to dashboard...');
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      }
    } catch (error: any) {
      console.error('EnhancedAuth: Password update exception:', error);
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('EnhancedAuth: Email/password submission started', {
      authMode,
      email: formData.email
    });

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'login') {
        // STEP 1: Check if email 2FA is enabled for this email (without validating password yet)
        console.log('EnhancedAuth: Checking if email 2FA is enabled...');
        const check2FAResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/check-enabled`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: formData.email }),
          }
        );

        let is2FAEnabled = false;
        if (check2FAResponse.ok) {
          const checkData = await check2FAResponse.json();
          is2FAEnabled = checkData.enabled;
          console.log('EnhancedAuth: 2FA enabled status:', is2FAEnabled);
        }

        // STEP 2: Validate the email/password combination
        console.log('EnhancedAuth: Attempting password validation...');
        
        let loginData = null;
        let loginError = null;

        try {
          const result = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
          loginData = result.data;
          loginError = result.error;
        } catch (err: any) {
          console.error('EnhancedAuth: Exception during signInWithPassword:', err);
          loginError = { message: err.message || 'Unknown error' } as any;
        }

        // Fallback for AuthRetryableFetchError (network/client issues)
        if (loginError && (loginError.message.includes('Failed to fetch') || loginError.name === 'AuthRetryableFetchError')) {
           console.log('EnhancedAuth: Client fetch failed, trying direct fetch fallback...');
           try {
             const authResponse = await fetch(`https://${projectId}.supabase.co/auth/v1/token?grant_type=password`, {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'apikey': publicAnonKey,
                 'Authorization': `Bearer ${publicAnonKey}`
               },
               body: JSON.stringify({
                 email: formData.email,
                 password: formData.password
               })
             });
             
             if (authResponse.ok) {
               const data = await authResponse.json();
               // Manually set session
               const { error: sessionError } = await supabase.auth.setSession({
                 access_token: data.access_token,
                 refresh_token: data.refresh_token
               });
               
               if (!sessionError) {
                 loginError = null;
                 loginData = { user: data.user, session: data };
                 console.log('EnhancedAuth: Direct fetch fallback successful!');
               } else {
                 console.error('EnhancedAuth: Failed to set session from fallback:', sessionError);
               }
             } else {
               // If fallback fails, we try to extract useful error info
               try {
                 const errData = await authResponse.json();
                 console.error('EnhancedAuth: Direct fetch fallback also failed:', errData);
                 if (authResponse.status === 400) {
                   loginError = { message: errData.error_description || errData.msg || 'Invalid login credentials' } as any;
                 }
               } catch (e) {
                 // Ignore JSON parse error on error response
               }
             }
           } catch (fallbackErr) {
             console.error('EnhancedAuth: Direct fetch fallback exception:', fallbackErr);
           }
        }

        if (loginError) {
          // Log as info instead of error for invalid credentials (expected user error, not system error)
          if (loginError.message.includes('Invalid login credentials')) {
            console.log('EnhancedAuth: Invalid credentials provided by user');
            setError('Invalid email or password. Please check your credentials and try again.');
          } else {
            console.error('EnhancedAuth: Unexpected login error:', loginError);
            setError(`Sign in failed: ${loginError.message}`);
          }
          setLoading(false);
          return;
        }

        // STEP 3: If 2FA is enabled, sign out temporarily and require 2FA verification
        if (is2FAEnabled) {
          console.log('EnhancedAuth: Password valid, 2FA enabled - signing out and sending code...');
          await supabase.auth.signOut();

          // Send the 2FA code
          const sendCodeResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/send-code`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: formData.email }),
            }
          );

          if (!sendCodeResponse.ok) {
            const errorData = await sendCodeResponse.json();
            console.error('EnhancedAuth: Failed to send 2FA code:', errorData);
            setError('Failed to send verification code. Please try again.');
            setLoading(false);
            return;
          }

          console.log('EnhancedAuth: ✅ 2FA code sent, showing challenge...');
          setEmail2FAEmail(formData.email);
          setShowEmail2FA(true);
          setLoading(false);
          return;
        }

        // STEP 4: No 2FA - login is complete
        console.log('EnhancedAuth: No 2FA required, login successful!');
        setSuccess('Successfully signed in! Redirecting...');
        
        setTimeout(() => {
          const searchParams = new URLSearchParams(location.search);
          const fromValue = searchParams.get('from');
          
          if (fromValue === 'industry-selection') {
            navigate('/business-name?from=signup', { replace: true });
          } else if (fromValue === 'business-name') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 1000);
      } else {
        // Sign up new user
        if (!formData.name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }

        // Use custom server for signup if available
        if (customServerAvailable) {
          console.log('EnhancedAuth: Using custom server for signup...');
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name.trim()
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('EnhancedAuth: Custom server signup error:', errorText);
            
            if (errorText.includes('A user with this email address has already been registered')) {
              setError('');
              setSuccess('Account found! Attempting to sign you in...');
              
              setTimeout(async () => {
                try {
                  console.log('EnhancedAuth: Auto-signin for existing user...');
                  const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                  });

                  if (signInError) {
                    console.error('EnhancedAuth: Auto-signin error:', signInError);
                    if (signInError.message.includes('Invalid login credentials')) {
                      setSuccess('');
                      setError('An account with this email already exists, but the password doesn\'t match. Please use the correct password or reset it.');
                      setAuthMode('login');
                    } else {
                      setSuccess('');
                      setError(`Sign in failed: ${signInError.message}`);
                    }
                    setLoading(false);
                  } else {
                    console.log('EnhancedAuth: Auto-signin successful');
                    setSuccess('Successfully signed in to your existing account! Redirecting...');
                    setTimeout(() => {
                      navigate('/dashboard', { replace: true });
                    }, 1000);
                    setLoading(false);
                  }
                } catch (autoSignInError) {
                  console.error('EnhancedAuth: Auto-signin exception:', autoSignInError);
                  setSuccess('');
                  setError('Account exists but automatic sign-in failed. Please try signing in manually.');
                  setAuthMode('login');
                }
              }, 1000);
              return;
            } else {
              throw new Error(errorText);
            }
          }
        } else {
          // Fallback to direct Supabase signup
          console.log('EnhancedAuth: Custom server unavailable, using direct Supabase signup...');
          const { data, error: signupError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                name: formData.name.trim()
              }
            }
          });

          if (signupError) {
            console.error('EnhancedAuth: Direct Supabase signup error:', signupError);
            if (signupError.message.includes('User already registered')) {
              setError('');
              setSuccess('Account found! Please sign in instead.');
              setAuthMode('login');
              return;
            } else {
              throw new Error(signupError.message);
            }
          }
        }

        console.log('EnhancedAuth: Signup successful, attempting auto-signin...');
        setSuccess('Account created successfully! Signing you in...');
        
        // Sign in the newly created user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('EnhancedAuth: Post-signup signin error:', signInError);
          setSuccess('');
          setError(`Account created but sign in failed: ${signInError.message}. Please try signing in manually.`);
          setAuthMode('login');
          return;
        }

        console.log('EnhancedAuth: Post-signup signin successful');
        setTimeout(() => {
          const searchParams = new URLSearchParams(location.search);
          const fromValue = searchParams.get('from');
          const fromQuestionnaire = fromValue === 'questionnaire';
          const fromIndustrySelection = fromValue === 'industry-selection';
          const hasExistingBusiness = localStorage.getItem('questionnaire_has_business') === 'true';
          const selectedIndustry = localStorage.getItem('selectedIndustry');
          
          if (fromQuestionnaire && hasExistingBusiness) {
            localStorage.removeItem('questionnaire_has_business');
            navigate('/business-info?from=signup', { replace: true });
          } else if (fromIndustrySelection || selectedIndustry) {
            navigate('/business-name?from=signup', { replace: true });
          } else if (fromValue === 'business-name') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('EnhancedAuth: General error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (!loading) {
      if (authMode === 'phone-verify') {
        setAuthMode('phone-login');
        setPhoneOtp('');
        setPhoneSession(null);
        setError('');
        setSuccess('');
      } else if (authMode === 'phone-login') {
        setAuthMode('signup');
        setFormData({ ...formData, phone: '' });
        setError('');
        setSuccess('');
      } else {
        navigate('/');
      }
    }
  };

  const renderAuthModeButtons = () => {
    if (authMode === 'phone-login' || authMode === 'phone-verify') {
      return null; // Don't show mode switching in phone flows
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-center space-x-2 text-sm sm:text-base">
          <span className="text-gray-600">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            disabled={loading}
            className="font-bold disabled:opacity-50 transition-colors"
            style={{ color: '#00A0CC' }}
          >
            {authMode === 'login' ? 'Sign up' : 'Sign in'}
          </motion.button>
        </div>
        
        {/* Quick admin account button - hidden for production */}
        {/* {authMode === 'signup' && formData.email === 'admin@cofounderplus.com' && (
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/signup`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
                  body: JSON.stringify({ email: formData.email, password: formData.password, name: formData.name })
                });
                const txt = await res.text();
                if (res.ok || txt.includes('already been registered')) {
                  setSuccess('Admin account ready! Logging you in...');
                  setTimeout(async () => {
                    const { error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
                    if (!error) navigate('/dashboard');
                    else { setSuccess(''); setError('Please try logging in manually.'); setAuthMode('login'); }
                    setLoading(false);
                  }, 1000);
                } else { setError(txt); setLoading(false); }
              } catch (e: any) { setError(e.message); setLoading(false); }
            }}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
          >
            ⚡ Quick Create Admin
          </button>
        )} */}
        
        {/* Admin setup buttons hidden - not needed for production */}
        {/* <div className="text-center pt-2 space-x-4">
          <button
            type="button"
            onClick={async () => {
              if (creatingAdmin) return;
              setCreatingAdmin(true);
              setError('');
              try {
                const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/signup`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
                  body: JSON.stringify({ email: 'admin@cofounderplus.com', password: 'Corbett-6!', name: 'Admin' })
                });
                const txt = await res.text();
                if (res.ok || txt.includes('already been registered')) {
                  setSuccess('Admin ready! Fill in credentials above and sign in.');
                  setAuthMode('login');
                  setFormData({ email: 'admin@cofounderplus.com', password: 'Corbett-6!', name: 'Admin', phoneNumber: '' });
                } else {
                  setError(txt);
                }
              } catch (e: any) {
                setError(e.message);
              } finally {
                setCreatingAdmin(false);
              }
            }}
            disabled={loading || creatingAdmin}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          >
            {creatingAdmin ? '...' : '🔧 Setup Admin'}
          </button>
          
          <button
            type="button"
            onClick={async () => {
              if (creatingAdmin) return;
              setCreatingAdmin(true);
              setError('');
              try {
                const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/admin/reset-password`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
                  body: JSON.stringify({ email: 'admin@cofounderplus.com', newPassword: 'Corbett-6!' })
                });
                const txt = await res.text();
                if (res.ok) {
                  setSuccess('Admin password reset to Corbett-6! - You can now sign in.');
                  setAuthMode('login');
                  setFormData({ email: 'admin@cofounderplus.com', password: 'Corbett-6!', name: 'Admin', phoneNumber: '' });
                } else {
                  setError(txt);
                }
              } catch (e: any) {
                setError(e.message);
              } finally {
                setCreatingAdmin(false);
              }
            }}
            disabled={loading || creatingAdmin}
            className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
          >
            {creatingAdmin ? '...' : '🔑 Reset Admin Password'}
          </button>
        </div> */}
      </div>
    );
  };

  const renderPhoneLogin = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <Smartphone className="w-12 h-12 mx-auto mb-4 text-blue-600" />
        <h2 className="text-xl font-bold mb-2">Sign in with Phone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We'll send you a verification code via SMS
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="1234567890 or +11234567890"
              className="pl-10 sm:pl-12"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            US: Just enter 10 digits (auto +1). International: +[country code][number]
          </p>
        </div>

        <Button
          onClick={handlePhoneSignIn}
          disabled={loading || !formData.phone}
          className="bouncy-button w-full border-2"
          style={{
            backgroundColor: '#00E0FF',
            borderColor: '#4B00FF',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(0, 224, 255, 0.3)'
          }}
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
          >
            Back to email sign in
          </button>
        </div>
      </div>
    </div>
  );

  const renderPhoneVerify = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <Smartphone className="w-12 h-12 mx-auto mb-4 text-green-600" />
        <h2 className="text-xl font-bold mb-2">Enter Verification Code</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a 6-digit code to {formData.phone}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="phone-otp">Verification Code *</Label>
          <Input
            id="phone-otp"
            value={phoneOtp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPhoneOtp(value);
              if (error) setError('');
            }}
            placeholder="123456"
            className="text-center text-lg tracking-wider"
            disabled={loading}
            maxLength={6}
          />
        </div>

        <Button
          onClick={handlePhoneVerify}
          disabled={loading || phoneOtp.length !== 6}
          className="bouncy-button w-full border-2"
          style={{
            backgroundColor: '#6CFF6C',
            borderColor: '#00E0FF',
            color: '#000000',
            boxShadow: '0 4px 16px rgba(108, 255, 108, 0.3)'
          }}
        >
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </Button>

        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive a code?
          </div>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || loading}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasswordResetForm = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: '#4B00FF' }} />
        <h2 className="text-xl font-bold mb-2">Set New Password</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your new password below
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="new-password">New Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter new password"
              className="pl-10 sm:pl-12 pr-10"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Confirm new password"
              className="pl-10 sm:pl-12"
              disabled={loading}
            />
          </div>
        </div>

        <Button
          onClick={handleUpdatePassword}
          disabled={loading || !newPassword || !confirmPassword}
          className="bouncy-button w-full border-2"
          style={{
            backgroundColor: '#6CFF6C',
            borderColor: '#00E0FF',
            color: '#000000',
            boxShadow: '0 4px 16px rgba(108, 255, 108, 0.3)'
          }}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </div>
  );

  const renderEmailPasswordForm = () => (
    <form onSubmit={handleEmailPasswordAuth} className="space-y-4 sm:space-y-6">
      {/* Full Name Field - Only for Signup */}
      {authMode === 'signup' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Label htmlFor="name">Full Name *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required={authMode === 'signup'}
              disabled={loading}
              className="pl-10 sm:pl-12"
              placeholder="Enter your full name"
            />
          </div>
        </motion.div>
      )}

      {/* Email Field */}
      <div>
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={loading}
            className="pl-10 sm:pl-12"
            placeholder="Enter your email"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={loading}
            className="pl-10 sm:pl-12 pr-10 sm:pr-12"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
        {authMode === 'signup' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Password must be at least 6 characters long
          </p>
        )}
        {authMode === 'login' && (
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
              className={`text-sm font-semibold transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                color: '#00A0CC',
                textShadow: '0 0 10px rgba(0, 224, 255, 0.3)',
              }}
            >
              Forgot password?
            </motion.button>
          </div>
        )}
      </div>

      {/* Premium Glass CTA Button */}
      <motion.button
        whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full py-3 sm:py-4 md:py-5 rounded-2xl font-bold text-base sm:text-lg text-white transition-all duration-300 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #00E0FF, #0099CC)',
          boxShadow: '0 12px 40px rgba(0, 224, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Glossy reflection overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
          }}
        />
        
        <div className="relative z-10">
          {loading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{authMode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
            </div>
          ) : (
            authMode === 'login' ? 'Sign In' : 'Create Account'
          )}
        </div>
      </motion.button>
    </form>
  );

  // Show Email 2FA challenge if needed
  if (showEmail2FA) {
    return (
      <Email2FAChallenge
        email={email2FAEmail}
        onSuccess={async (tempToken: string) => {
          // After 2FA verification, validate the temp token and complete login
          console.log('EnhancedAuth: 2FA verified, validating temp token...');
          
          try {
            // Validate the temp token with the server
            const validateResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/email-2fa/complete-login`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: formData.email,
                  tempToken: tempToken,
                }),
              }
            );

            if (!validateResponse.ok) {
              const errorData = await validateResponse.json();
              console.error('EnhancedAuth: Temp token validation failed:', errorData);
              toast.error('Verification failed. Please try signing in again.');
              setShowEmail2FA(false);
              return;
            }

            console.log('EnhancedAuth: Temp token validated, completing sign in...');

            // Now complete the actual sign in
            const { data, error } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            });

            if (error) {
              console.error('EnhancedAuth: Login error after 2FA:', error);
              toast.error('Sign in failed after verification');
              setShowEmail2FA(false);
              return;
            }

            console.log('EnhancedAuth: Login successful after 2FA, redirecting...');
            toast.success('Successfully signed in!');
          
            setTimeout(() => {
              const searchParams = new URLSearchParams(location.search);
              const fromValue = searchParams.get('from');
              const fromQuestionnaire = fromValue === 'questionnaire';
              const fromIndustrySelection = fromValue === 'industry-selection';
              const hasExistingBusiness = localStorage.getItem('questionnaire_has_business') === 'true';
              const selectedIndustry = localStorage.getItem('selectedIndustry');

              if (fromQuestionnaire && hasExistingBusiness) {
                navigate('/dashboard', { replace: true });
              } else if (fromQuestionnaire && !hasExistingBusiness) {
                if (selectedIndustry) {
                  navigate('/business-name?from=signup', { replace: true });
                } else {
                  navigate('/industry-selection?from=signup', { replace: true });
                }
              } else if (fromIndustrySelection) {
                navigate('/business-name?from=signup', { replace: true });
              } else {
                navigate('/dashboard', { replace: true });
              }
            }, 500);
          } catch (error: any) {
            console.error('EnhancedAuth: 2FA completion error:', error);
            toast.error('An error occurred during sign in. Please try again.');
            setShowEmail2FA(false);
          }
        }}
        onBack={() => {
          setShowEmail2FA(false);
          setEmail2FAEmail('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden transition-all duration-300">
      {/* Extended Background for iOS Bounce/Overscroll */}
      <div 
        className="fixed inset-0 w-full pointer-events-none z-0 app-extended-background"
        style={{
          height: '200vh',
          top: '-50vh',
        }}
      />

      {/* Floating Toy-Box Pop Particles Background */}
      <div className="fixed inset-0 w-full pointer-events-none z-0 overflow-hidden" style={{ height: '120vh', top: '-10vh' }}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: [
                'linear-gradient(135deg, #00E0FF, #0099CC)',
                'linear-gradient(135deg, #6CFF6C, #00CC66)',
                'linear-gradient(135deg, #FFCF00, #FF9900)',
                'linear-gradient(135deg, #00E0FF, #00CC99)',
              ][i % 4],
              filter: 'blur(40px)',
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Warning about limited features if custom server is down */}
      {!customServerAvailable && (
        <div className="relative z-20 px-4 py-2 text-center text-sm" style={{ backgroundColor: '#FFCF00', color: '#000000' }}>
          ⚠️ Some features may be limited - connecting with reduced functionality
        </div>
      )}

      {/* Main Content */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6"
        style={{
          paddingTop: isIOS && isMobile ? '0' : 'var(--spacing-8)',
          paddingBottom: isIOS && isMobile ? '0' : 'var(--spacing-8)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-lg mx-auto w-full"
        >
          {/* Premium 3D Glass Orb Avatar with Halo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.4 }}
            className="relative mb-6 sm:mb-10 mx-auto"
            style={{ width: isMobile ? '80px' : '120px', height: isMobile ? '80px' : '120px' }}
          >
            {/* Neon Halo Background */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-60"
              style={{
                background: 'linear-gradient(135deg, #00E0FF, #00CC99, #FFCF00)',
                transform: 'scale(1.4)',
              }}
            />
            
            {/* Glass Orb */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden p-3"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
                backdropFilter: 'blur(20px)',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 60px rgba(0, 224, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              }}
            >
              <Logo showText={false} size={isMobile ? 'md' : 'lg'} />
              
              {/* Glossy reflection */}
              <div
                className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full opacity-50 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9), transparent)',
                }}
              />
            </div>
          </motion.div>

          {/* Welcome Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 text-center"
            style={{
              color: '#00A0CC',
              textShadow: '0 2px 10px rgba(0, 224, 255, 0.2)',
            }}
          >
            {showPasswordReset ? 'Reset Your Password' :
             authMode === 'phone-login' ? 'Phone Sign In' :
             authMode === 'phone-verify' ? 'Verify Phone' :
             authMode === 'login' ? 'Welcome Back!' : 'Get Started'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-10 text-center"
          >
            {showPasswordReset ? 'Enter your new password below' :
             authMode === 'phone-login' ? 'Sign in with your phone number' :
             authMode === 'phone-verify' ? 'Enter the code we sent you' :
             authMode === 'login' ? 'Sign in to continue your journey' : 'Start your path to $1M net worth'}
          </motion.p>

          {/* Premium Frosted Glass Authentication Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative rounded-3xl p-6 sm:p-10"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
              backdropFilter: 'blur(30px) saturate(180%)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 30px 90px rgba(0, 160, 200, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            }}
          >
            {/* Inner glow halo */}
            <div
              className="absolute inset-0 rounded-3xl opacity-40 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at top, rgba(0, 224, 255, 0.15), transparent 70%)',
              }}
            />

            <div className="relative z-10">
            {/* Auth Error from Props */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-start space-x-3"
                style={{
                  backgroundColor: 'rgba(255, 79, 79, 0.1)',
                  border: '2px solid rgba(255, 79, 79, 0.3)'
                }}
              >
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF4F4F' }} />
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#FF4F4F' }}>{authError}</p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-start space-x-3"
                style={{
                  backgroundColor: 'rgba(255, 79, 79, 0.1)',
                  border: '2px solid rgba(255, 79, 79, 0.3)'
                }}
              >
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF4F4F' }} />
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#FF4F4F' }}>{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-start space-x-3"
                style={{
                  backgroundColor: 'rgba(108, 255, 108, 0.1)',
                  border: '2px solid rgba(108, 255, 108, 0.3)'
                }}
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: '#6CFF6C' }} />
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#6CFF6C' }}>{success}</p>
              </motion.div>
            )}

            {/* Render appropriate form based on auth mode */}
            {showPasswordReset ? renderPasswordResetForm() :
             authMode === 'phone-login' ? renderPhoneLogin() :
             authMode === 'phone-verify' ? renderPhoneVerify() :
             (
              <>
                {/* Social Authentication Options */}
                {(showGoogleAuth || ENABLE_PHONE_AUTH || showAppleAuth) && (authMode === 'login' || authMode === 'signup') && (
                  <div className="mb-5 sm:mb-8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    {/* Google and Apple Sign In - Side by Side */}
                    {(showGoogleAuth || showAppleAuth) && (
                      <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {/* Google Sign In - Premium Frosted Glass */}
                        {showGoogleAuth && (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              maxWidth: '220px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-3)',
                              padding: 'var(--spacing-3) var(--spacing-4)',
                              borderRadius: 'var(--radius-2xl)',
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
                              backdropFilter: 'blur(20px)',
                              border: '2px solid rgba(66, 133, 244, 0.3)',
                              boxShadow: '0 8px 32px rgba(66, 133, 244, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8))',
                                border: '1px solid rgba(66, 133, 244, 0.2)',
                                boxShadow: '0 4px 16px rgba(66, 133, 244, 0.15)',
                              }}
                            >
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                            <span className="flex-1 text-left font-semibold text-gray-800 text-sm sm:text-base">Google</span>
                          </motion.button>
                        )}

                        {/* Apple Sign In - Premium Frosted Glass */}
                        {showAppleAuth && (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleAppleSignIn}
                            disabled={loading}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              maxWidth: '220px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-3)',
                              padding: 'var(--spacing-3) var(--spacing-4)',
                              borderRadius: 'var(--radius-2xl)',
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
                              backdropFilter: 'blur(20px)',
                              border: '2px solid rgba(0, 0, 0, 0.2)',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8))',
                                border: '1px solid rgba(0, 0, 0, 0.15)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                              }}
                            >
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                              </svg>
                            </div>
                            <span className="flex-1 text-left font-semibold text-gray-800 text-sm sm:text-base">Apple</span>
                          </motion.button>
                        )}
                      </div>
                    )}

                    {/* Phone Sign In */}
                    {ENABLE_PHONE_AUTH && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAuthMode('phone-login')}
                        disabled={loading}
                        className="w-full flex items-center justify-center space-x-2 h-12 border-2"
                      >
                        <Phone className="w-5 h-5" />
                        <span>Continue with Phone</span>
                      </Button>
                    )}

                    {/* Premium Glowing Separator with Glass Pill */}
                    {((showGoogleAuth) || ENABLE_PHONE_AUTH || (showAppleAuth)) && (
                      <div className="relative py-3 sm:py-4 my-1 sm:my-2">
                        <div
                          className="absolute inset-0 flex items-center"
                          style={{
                            background: 'linear-gradient(90deg, transparent, rgba(0, 224, 255, 0.3), transparent)',
                            height: '2px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                          }}
                        />
                        <div className="relative flex justify-center">
                          <span
                            className="px-5 py-2 rounded-full text-sm font-medium"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
                              backdropFilter: 'blur(15px)',
                              border: '1px solid rgba(0, 224, 255, 0.3)',
                              color: '#00A0CC',
                              boxShadow: '0 4px 16px rgba(0, 224, 255, 0.2)',
                            }}
                          >
                            or
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Email/Password Form */}
                {renderEmailPasswordForm()}
              </>
            )}

            {/* Mode switching */}
            <div className="mt-6">
              {renderAuthModeButtons()}
            </div>

            {/* Terms and Privacy */}
            {authMode === 'signup' && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="/terms-of-service" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </p>
            )}
            </div>
          </motion.div>

          {/* Premium Glass Pill Back Button */}
          <div className="mt-8">
            <motion.button
              onClick={handleGoBack}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(0, 224, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 224, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                color: '#00A0CC',
              }}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Dialog - OTP-based reset */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          setResetStep('email');
          setResetEmail('');
          setResetOtp('');
          setNewPassword('');
          setConfirmPassword('');
          setError('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{resetStep === 'email' ? 'Reset Password' : 'Enter Reset Code'}</DialogTitle>
            <DialogDescription>
              {resetStep === 'email'
                ? "Enter your email and we'll send you a 6-digit code"
                : `We sent a code to ${resetEmail}`}
            </DialogDescription>
          </DialogHeader>
          
          {resetStep === 'email' ? (
            <>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail || formData.email}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="flex-1"
                  style={{
                    backgroundColor: '#4B00FF',
                    color: '#FFFFFF'
                  }}
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="reset-otp">6-Digit Code</Label>
                  <Input
                    id="reset-otp"
                    value={resetOtp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\\D/g, '').slice(0, 6);
                      setResetOtp(value);
                      if (error) setError('');
                    }}
                    placeholder="123456"
                    className="text-center text-lg tracking-wider"
                    disabled={loading}
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Check your email for the 6-digit code
                  </p>
                </div>

                <div>
                  <Label htmlFor="new-password-dialog">New Password</Label>
                  <Input
                    id="new-password-dialog"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password-dialog">Confirm Password</Label>
                  <Input
                    id="confirm-password-dialog"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setResetStep('email')}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyResetOtp}
                  disabled={loading || resetOtp.length !== 6 || !newPassword || !confirmPassword}
                  className="flex-1"
                  style={{
                    backgroundColor: '#6CFF6C',
                    color: '#000000'
                  }}
                >
                  {loading ? 'Updating...' : 'Reset Password'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EnhancedAuthPage;
