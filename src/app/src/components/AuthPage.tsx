import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { Moon, Sun, HelpCircle, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Heart, ChevronLeft } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getOAuthRedirectUrl, validateOAuthConfig } from '../config/oauth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Email2FAChallenge } from './Email2FAChallenge';

interface AuthPageProps {
  authError?: string | null;
  supabaseAvailable?: boolean; // This is now specifically for Supabase Auth
  customServerAvailable?: boolean; // This is for custom server features
}

function AuthPage({ 
  authError, 
  supabaseAvailable = true,
  customServerAvailable = true 
}: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  // 2FA state
  const [show2FAChallenge, setShow2FAChallenge] = useState(false);
  const [pendingLoginEmail, setPendingLoginEmail] = useState('');
  const [pendingLoginPassword, setPendingLoginPassword] = useState('');

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Validate OAuth configuration on mount
  useEffect(() => {
    validateOAuthConfig();
  }, []);

  // Check URL parameters and query string to determine login vs signup mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    const fromQuestionnaire = searchParams.get('from') === 'questionnaire';
    
    console.log('AuthPage: URL params:', { mode, fromQuestionnaire, search: location.search });
    
    // If mode is explicitly set to 'login', show login form
    if (mode === 'login') {
      setIsLogin(true);
    }
    // If mode is explicitly set to 'signup' or coming from questionnaire, show signup form
    else if (mode === 'signup' || fromQuestionnaire) {
      setIsLogin(false);
    }
    // If coming from a login button/link (no mode specified), show login form
    else if (location.state?.mode === 'login') {
      setIsLogin(true);
    }
    // Default to signup for new users
    else {
      setIsLogin(false);
    }
  }, [location.search, location.state]);

  // Show service unavailable message ONLY if Supabase Auth is down
  if (!supabaseAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background-light transition-all duration-300">
        {/* Gentle meteor for error state */}
        <div className="shooting-star" style={{ animationDelay: '8s', animationDuration: '5.5s', top: '30%' }}></div>
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
          <motion.button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        {/* Service unavailable message */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Authentication Unavailable
            </h1>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              Our authentication system is temporarily unavailable. 
              Please try again later or explore our public features.
            </p>

            <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg rounded-2xl border border-white/30 dark:border-gray-700/30 p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                While we fix this issue, you can still:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/questionnaire')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all duration-300 text-sm font-medium"
                >
                  Try the Business Questionnaire
                </button>
                <button
                  onClick={() => navigate('/help-demo')}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-blue-500/20 text-blue-800 dark:bg-purple-500/20 dark:text-purple-300 rounded-xl hover:bg-blue-500/30 dark:hover:bg-purple-500/30 transition-all duration-300 text-sm font-medium"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('AuthPage: Form submission started', { isLogin, email: formData.email });

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
      if (isLogin) {
        console.log('AuthPage: Attempting login...');
        
        // STEP 1: Validate credentials first by attempting sign in
        console.log('AuthPage: Validating credentials...');
        const { data: credentialCheck, error: credentialError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (credentialError) {
          console.error('AuthPage: Credential validation error:', credentialError);
          if (credentialError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else {
            setError(`Sign in failed: ${credentialError.message}`);
          }
          setLoading(false);
          return;
        }

        // STEP 2: Credentials are valid - now check if 2FA is enabled
        console.log('AuthPage: Credentials valid, checking 2FA status...');
        const user2FAEnabled = credentialCheck.user?.user_metadata?.email_2fa_enabled === true;
        
        if (user2FAEnabled) {
          // 2FA is enabled - sign out immediately and show 2FA challenge
          console.log('AuthPage: 2FA is enabled, signing out and showing challenge...');
          await supabase.auth.signOut();
          setPendingLoginEmail(formData.email);
          setPendingLoginPassword(formData.password);
          setShow2FAChallenge(true);
          setLoading(false);
          return;
        }

        // STEP 3: No 2FA required - user is already signed in from credential check
        console.log('AuthPage: No 2FA required, login successful...');
        setSuccess('Successfully signed in! Redirecting...');
        
        // Use React Router navigate instead of window.location.href
        setTimeout(() => {
          // Check various onboarding flows for login
          const searchParams = new URLSearchParams(location.search);
          const fromValue = searchParams.get('from');
          const fromIndustrySelection = fromValue === 'industry-selection';
          
          if (fromIndustrySelection) {
            // User came from industry selection, redirect to business-name generator
            navigate('/business-name?from=signup', { replace: true });
          } else if (fromValue === 'business-name') {
            // User came from business name selection, go to dashboard
            navigate('/dashboard', { replace: true });
          } else {
            // Normal flow to dashboard
            navigate('/dashboard', { replace: true });
          }
        }, 1000);
      } else {
        console.log('AuthPage: Attempting signup...');
        // Sign up new user
        if (!formData.name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }

        // Use custom server for signup only if available, otherwise use direct Supabase
        if (customServerAvailable) {
          console.log('AuthPage: Using custom server for signup...');
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
            console.error('AuthPage: Custom server signup error:', errorText);
            
            // Handle specific error: user already exists
            if (errorText.includes('A user with this email address has already been registered')) {
              setError('');
              setSuccess('Account found! Attempting to sign you in...');
              
              // Automatically try to sign in the existing user
              setTimeout(async () => {
                try {
                  console.log('AuthPage: Auto-signin for existing user...');
                  const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                  });

                  if (signInError) {
                    console.error('AuthPage: Auto-signin error:', signInError);
                    if (signInError.message.includes('Invalid login credentials')) {
                      setSuccess('');
                      setError('An account with this email already exists, but the password doesn\'t match. Please use the correct password or reset it.');
                      setIsLogin(true); // Switch to login mode
                    } else {
                      setSuccess('');
                      setError(`Sign in failed: ${signInError.message}`);
                    }
                    setLoading(false);
                  } else {
                    console.log('AuthPage: Auto-signin successful');
                    setSuccess('Successfully signed in to your existing account! Redirecting...');
                    setTimeout(() => {
                      navigate('/dashboard', { replace: true });
                    }, 1000);
                    setLoading(false);
                  }
                } catch (autoSignInError) {
                  console.error('AuthPage: Auto-signin exception:', autoSignInError);
                  setSuccess('');
                  setError('Account exists but automatic sign-in failed. Please try signing in manually.');
                  setIsLogin(true);
                }
              }, 1000);
              return;
            } else {
              throw new Error(errorText);
            }
          }
        } else {
          console.log('AuthPage: Custom server unavailable, using direct Supabase signup...');
          // Fallback to direct Supabase signup when custom server is down
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
            console.error('AuthPage: Direct Supabase signup error:', signupError);
            if (signupError.message.includes('User already registered')) {
              setError('');
              setSuccess('Account found! Please sign in instead.');
              setIsLogin(true);
              return;
            } else {
              throw new Error(signupError.message);
            }
          }
        }

        console.log('AuthPage: Signup successful, attempting auto-signin...');
        setSuccess('Account created successfully! Signing you in...');
        
        // Sign in the newly created user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('AuthPage: Post-signup signin error:', signInError);
          setSuccess('');
          setError(`Account created but sign in failed: ${signInError.message}. Please try signing in manually.`);
          setIsLogin(true);
          return;
        }

        console.log('AuthPage: Post-signup signin successful');
        setTimeout(() => {
          // Check various onboarding flows
          const searchParams = new URLSearchParams(location.search);
          const fromValue = searchParams.get('from');
          const fromQuestionnaire = fromValue === 'questionnaire';
          const fromIndustrySelection = fromValue === 'industry-selection';
          const hasExistingBusiness = localStorage.getItem('questionnaire_has_business') === 'true';
          const selectedIndustry = localStorage.getItem('selectedIndustry');
          
          console.log('AuthPage: Signup redirect logic:', { 
            fromQuestionnaire, 
            fromIndustrySelection, 
            hasExistingBusiness, 
            selectedIndustry,
            fromValue
          });
          
          if (fromQuestionnaire && hasExistingBusiness) {
            // User has existing business, collect their business details
            localStorage.removeItem('questionnaire_has_business');
            navigate('/business-info?from=signup', { replace: true });
          } else if (fromIndustrySelection || selectedIndustry) {
            // User selected an industry through the questionnaire flow and needs to go to business name generator
            console.log('AuthPage: Redirecting to business name generator for industry selection');
            navigate('/business-name?from=signup', { replace: true });
          } else if (fromValue === 'business-name') {
            // User came from business name selection, they should now have all the data to create business
            // But since business creation is handled in BusinessNameGenerator, just go to dashboard
            navigate('/dashboard', { replace: true });
          } else {
            // Normal flow to dashboard - but this might be new users who need business setup
            console.log('AuthPage: Normal flow - redirecting to dashboard');
            navigate('/dashboard', { replace: true });
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('AuthPage: General error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ ...formData, name: '' }); // Clear name when switching modes
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) throw error;

      setSuccess('Password reset email sent! Please check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (!loading) {
      navigate('/');
    }
  };

  const handleHelpClick = () => {
    setShowHelpDialog(true);
  };
  
  // Handle 2FA success - log the user in
  const handle2FASuccess = async (tempToken: string) => {
    console.log('AuthPage: 2FA success, logging user in...');
    try {
      setLoading(true);
      
      // Now actually sign in with password since they passed 2FA
      const { data, error } = await supabase.auth.signInWithPassword({
        email: pendingLoginEmail,
        password: pendingLoginPassword,
      });

      if (error) {
        console.error('AuthPage: Post-2FA login error:', error);
        setError(`Sign in failed: ${error.message}`);
        setShow2FAChallenge(false);
        setLoading(false);
        return;
      }

      console.log('AuthPage: Post-2FA login successful, redirecting...');
      setSuccess('Successfully signed in! Redirecting...');
      setShow2FAChallenge(false);
      
      setTimeout(() => {
        const searchParams = new URLSearchParams(location.search);
        const fromValue = searchParams.get('from');
        const fromIndustrySelection = fromValue === 'industry-selection';
        
        if (fromIndustrySelection) {
          navigate('/business-name?from=signup', { replace: true });
        } else if (fromValue === 'business-name') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 1000);
    } catch (error: any) {
      console.error('AuthPage: Post-2FA error:', error);
      setError(error.message || 'Login failed after 2FA verification');
      setShow2FAChallenge(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle going back from 2FA screen
  const handle2FABack = () => {
    setShow2FAChallenge(false);
    setPendingLoginEmail('');
    setPendingLoginPassword('');
    setLoading(false);
  };

  const helpContent = {
    auth: {
      title: "Getting Started with Cofounder",
      description: "Creating your account is the first step towards building your $1M business. We're here to support you every step of the way.",
      tips: [
        {
          title: "Why create an account?",
          description: "Your account saves your progress through the business-building process and gives you access to personalized roadmaps, community support, and tracking tools."
        },
        {
          title: "What happens after I sign up?",
          description: "You'll get immediate access to your personalized dashboard with a step-by-step roadmap based on your questionnaire responses."
        },
        {
          title: "Is my information secure?",
          description: "Yes! We use enterprise-grade security to protect your data. Your business ideas and personal information are completely safe with us."
        },
        {
          title: "What if I need help later?",
          description: "Every page has help buttons, we have an active community, and you can always reach out to our support team."
        }
      ]
    }
  };

  return (
    <div 
      className="min-h-screen starry-background-light transition-all duration-300"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))'
          : 'linear-gradient(to bottom right, rgb(248, 250, 252), rgb(226, 232, 240), rgb(241, 245, 249))'
      }}
    >
      {/* Gentle meteor */}
      <div className="shooting-star" style={{ animationDelay: '2s', animationDuration: '4.5s' }}></div>
      <div className="shooting-star" style={{ animationDelay: '5s', animationDuration: '5s', top: '60%' }}></div>

      {/* Warning about limited features if custom server is down */}
      {!customServerAvailable && (
        <div className="relative z-20 bg-yellow-500 text-white px-4 py-2 text-center text-sm">
          ⚠️ Some features may be limited - connecting with reduced functionality
        </div>
      )}

      {/* Header - Removed theme toggle and back button from top per user request */}
      <div className="relative z-10 px-4 sm:px-6 pt-6 sm:pt-6 pb-2 mobile-safe-area">
        {/* Empty header space for consistent padding */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md mx-auto w-full"
        >
          {/* Logo Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-lg ring-2 ring-blue-500/20 dark:ring-blue-400/30 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-600 dark:to-slate-700"
          >
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </motion.div>

          {/* Title and Description */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-center text-slate-800 dark:text-slate-100">
            {isLogin ? 'Welcome Back!' : 'Get Started'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 text-center px-2">
            {isLogin ? 'Sign in to continue your journey' : 'Start your path to $1M net worth'}
          </p>

          {/* Auth Form Card */}
          <div className="glass-morphism rounded-2xl border border-white/30 dark:border-slate-700/60 p-6 sm:p-8 shadow-xl bg-white/90 dark:bg-slate-800/95">
            {/* Auth Error from Props */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3"
              >
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm leading-relaxed">{authError}</p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3"
              >
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start space-x-3"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm leading-relaxed">{success}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Full Name Field - Only for Signup */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-slate-700 dark:text-slate-100">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required={!isLogin}
                      disabled={loading}
                      className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-white dark:bg-slate-700 backdrop-blur-lg border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:outline-none transition-all duration-300 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      } ${error && !formData.name.trim() && !isLogin ? 'border-red-300 dark:border-red-600' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-slate-700 dark:text-slate-100">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-white dark:bg-slate-700 backdrop-blur-lg border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:outline-none transition-all duration-300 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    } ${error && !formData.email ? 'border-red-300 dark:border-red-600' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-slate-700 dark:text-slate-100">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-white dark:bg-slate-700 backdrop-blur-lg border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:outline-none transition-all duration-300 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    } ${error && formData.password.length < 6 ? 'border-red-300 dark:border-red-600' : ''}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                    Password must be at least 6 characters long
                  </p>
                )}
                {isLogin && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={loading}
                      className={`text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-3 sm:py-4 px-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading && (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span className="text-sm sm:text-base">
                  {loading 
                    ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                    : (isLogin ? 'Sign In' : 'Create Account')
                  }
                </span>
              </motion.button>
            </form>

            {/* OAuth Buttons Removed - App Store Compliance */}
            {/* All OAuth sign-in options (Google, Apple) have been completely removed from the code */}
            {/* to ensure App Store approval. Users must sign up with email/password. */}

            {/* Mode Switch */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-200">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  disabled={loading}
                  className={`ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-semibold transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLogin ? 'Sign up here' : 'Sign in here'}
                </button>
              </p>
            </div>

            {/* Help Button */}
            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                onClick={handleHelpClick}
                disabled={loading}
                className={`text-xs sm:text-sm text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Need help? Click here
              </button>
            </div>
          </div>

          {/* Back Button for Mobile - Below the form */}
          <div className="mt-6">
            <motion.button
              onClick={handleGoBack}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-500 dark:border-slate-600 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-base">Back</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>{helpContent.auth.title}</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              {helpContent.auth.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {helpContent.auth.tips.map((tip, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowHelpDialog(false)} variant="outline">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Reset Your Password</span>
            </DialogTitle>
            <DialogDescription className="text-left">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Error Message in Dialog */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm">{error}</p>
              </motion.div>
            )}

            {/* Success Message in Dialog */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start space-x-3"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">{success}</p>
              </motion.div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-100">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:outline-none transition-all duration-300 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  placeholder="Enter your email address"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setError('');
                setSuccess('');
              }} 
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleForgotPassword}
              disabled={loading || !resetEmail}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Challenge Dialog */}
      {show2FAChallenge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4">
            <Email2FAChallenge 
              email={pendingLoginEmail}
              onSuccess={handle2FASuccess}
              onBack={handle2FABack}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AuthPage;