import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, 
  User, Smartphone, ArrowRight, Shield 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';

interface PhoneSignupCompletionProps {
  user: any;
  onComplete?: () => void;
}

export function PhoneSignupCompletion({ user, onComplete }: PhoneSignupCompletionProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: user?.user_metadata?.name || user?.user_metadata?.full_name || ''
  });

  // Check if user signed up via phone and needs completion
  const needsCompletion = () => {
    const isPhoneUser = user?.app_metadata?.provider === 'phone' || user?.phone;
    const hasEmail = user?.email && user.email !== '';
    const profileCompleted = user?.user_metadata?.profile_completed === true;
    
    // Don't show if profile is already marked as completed (even if skipped)
    if (profileCompleted) {
      return false;
    }
    
    // Show completion form if user signed up with phone but doesn't have email
    return isPhoneUser && !hasEmail;
  };

  // Don't render if user doesn't need completion
  if (!needsCompletion()) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('PhoneSignupCompletion: Updating user profile...');
      
      // Step 1: Always update email and profile data first (this is most important)
      console.log('PhoneSignupCompletion: Updating email and profile data...');
      const { error: profileError } = await supabase.auth.updateUser({
        email: formData.email,
        data: {
          name: formData.name.trim(),
          full_name: formData.name.trim(),
          phone_verified: true,
          profile_completed: true
        }
      });

      if (profileError) {
        console.error('PhoneSignupCompletion: Profile update error:', profileError);
        
        if (profileError.message.includes('email already registered')) {
          setError('This email is already registered. Please use a different email or sign in with your existing account.');
        } else {
          setError(`Failed to update profile: ${profileError.message}`);
        }
        return;
      }

      console.log('PhoneSignupCompletion: Email and profile updated successfully');

      // Step 2: Try to update password separately (optional)
      if (formData.password && formData.password.trim() !== '') {
        console.log('PhoneSignupCompletion: Attempting password update...');
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (passwordError) {
          console.warn('PhoneSignupCompletion: Password update failed (non-critical):', passwordError.message);
          // Don't show error to user - password can be set later
        } else {
          console.log('PhoneSignupCompletion: Password updated successfully');
        }
      }

      // Step 3: Try to create user profile on server if available (optional)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ac1075a9/user/complete-profile`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                email: formData.email,
                name: formData.name.trim(),
                phone: user.phone,
                provider: 'phone'
              })
            }
          );

          if (!response.ok) {
            console.warn('PhoneSignupCompletion: Server profile creation failed, but auth update succeeded');
          } else {
            console.log('PhoneSignupCompletion: Server profile created successfully');
          }
        }
      } catch (serverError) {
        console.warn('PhoneSignupCompletion: Server not available, but auth update succeeded');
      }

      console.log('PhoneSignupCompletion: Profile completion successful');
      setSuccess('Profile completed successfully! Welcome to Cofounder!');
      
      toast.success('Welcome to Cofounder! Your account is now complete.');

      // Force refresh the user session to get updated user data
      console.log('PhoneSignupCompletion: Refreshing user session...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.warn('PhoneSignupCompletion: Session refresh failed, proceeding anyway:', refreshError.message);
      } else {
        console.log('PhoneSignupCompletion: Session refreshed successfully');
      }

      // Navigate to dashboard - use window.location for a fresh reload with updated auth state
      setTimeout(() => {
        console.log('PhoneSignupCompletion: Redirecting to dashboard...');
        if (onComplete) {
          onComplete();
        } else {
          // Use window.location.href to force a full page reload and refresh auth state
          window.location.href = '/dashboard';
        }
      }, 1500);

    } catch (error: any) {
      console.error('PhoneSignupCompletion: Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('PhoneSignupCompletion: User skipping profile completion...');
    
    try {
      // Mark profile as completed (skipped) so component doesn't show again
      const { error } = await supabase.auth.updateUser({
        data: {
          profile_completed: true,
          profile_skipped: true,
          phone_verified: true,
          name: formData.name || user?.user_metadata?.name || 'User'
        }
      });

      if (error) {
        console.error('PhoneSignupCompletion: Skip update error:', error);
      } else {
        console.log('PhoneSignupCompletion: Profile marked as completed (skipped)');
      }
    } catch (error) {
      console.error('PhoneSignupCompletion: Skip error:', error);
    }

    // Show notification and navigate
    toast.info('You can complete your profile later in settings');
    
    // Force page reload to refresh user state
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        window.location.href = '/dashboard';
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background flex items-center justify-center p-4">
      {/* Gentle meteor shower */}
      <div className="shooting-star" style={{ animationDelay: '8s', animationDuration: '5.2s', top: '25%' }}></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md mx-auto w-full"
      >
        <Card className="glass-morphism border border-white/30 dark:border-gray-700/30">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-center">
              You've successfully verified your phone! Now let's secure your account with an email and password.
            </CardDescription>

            <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Smartphone className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Phone verified: {user.phone}
              </span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>

          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="pl-10"
                    placeholder="Enter your email"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Used for account recovery and important notifications
                </p>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="pl-10 pr-10"
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="pl-10"
                    placeholder="Confirm your password"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Completing Profile...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Complete Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              {/* Skip Button */}
              <Button 
                type="button"
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="w-full"
              >
                Skip for now (complete later in settings)
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Why do we need this?</p>
                  <ul className="space-y-1">
                    <li>• Email for account recovery and security</li>
                    <li>• Password protects your business data</li>
                    <li>• Required for full platform features</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default PhoneSignupCompletion;