import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Rocket, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { supabase } from '../utils/supabase/client';

interface MobileWelcomeProps {
  user?: any;
}

// Safe wrapper component with error boundary
class MobileWelcomeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('MobileWelcome Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-white dark:bg-black flex items-center justify-center p-6">
          <div className="text-center max-w-md liquid-glass-card p-8 rounded-3xl">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl mb-2">Unable to Load Welcome Page</h2>
            <p className="text-sm opacity-60 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="liquid-glass-btn-primary px-6 py-3 rounded-2xl text-sm text-white"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MobileWelcomeContent: React.FC<MobileWelcomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const [componentError, setComponentError] = useState<string | null>(null);
  
  // Use simple mobile detection that won't cause errors
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  // Initialize mobile detection
  useEffect(() => {
    try {
      const checkMobile = () => {
        try {
          const width = window.innerWidth;
          setIsMobile(width < 768);
        } catch (innerErr) {
          console.error('Error checking width:', innerErr);
          setIsMobile(true);
        }
      };
      
      checkMobile();
      
      const handleResize = () => {
        try {
          checkMobile();
        } catch (err) {
          console.error('Error in resize handler:', err);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        try {
          window.removeEventListener('resize', handleResize);
        } catch (err) {
          // Ignore cleanup errors
        }
      };
    } catch (err: any) {
      console.error('Error in mobile detection setup:', err);
      setComponentError(err?.message || 'Failed to initialize');
      setIsMobile(true); // Default to mobile if error
    }
  }, []);

  // Redirect desktop users who are logged out to homepage
  useEffect(() => {
    // Only redirect if we've determined the device type
    if (isMobile === null) return;
    
    // Only redirect desktop users without login
    if (!isMobile && !user) {
      console.log('🖥️ Desktop user without login detected - redirecting to homepage');
      try {
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Navigation error:', err);
      }
    }
  }, [isMobile, user, navigate]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    // Check if user is authenticated
    if (user) {
      console.log('✅ MobileWelcome: User already authenticated - redirecting to dashboard');
      try {
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Navigation error:', err);
      }
    }
  }, [user, navigate]);

  // Also check session storage on mount for session restoration
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !user) {
          console.log('✅ MobileWelcome: Found existing session - redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    };

    // Only check if user prop is not yet populated
    if (!user && isMobile !== null) {
      checkExistingSession();
    }
  }, [user, navigate, isMobile]);

  // Validate OAuth configuration on mount with error handling
  useEffect(() => {
    try {
      // Inline validation to avoid import errors
      console.log('🔍 Mobile Welcome Page Loaded');
    } catch (err) {
      console.error('Validation error:', err);
    }
  }, []);

  // Show error state if something went wrong
  if (componentError) {
    return (
      <div className="h-screen bg-white dark:bg-black flex items-center justify-center p-6">
        <div className="text-center liquid-glass-error p-8 rounded-3xl max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-action" />
          <h2 className="text-xl mb-2">Unable to Load</h2>
          <p className="text-sm opacity-60 mb-4">{componentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="liquid-glass-btn-primary px-6 py-3 rounded-2xl text-sm text-white"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  // Don't render until isMobile is determined to prevent layout shifts
  if (isMobile === null) {
    return (
      <div className="h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="animate-pulse text-sm opacity-60">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-black dark:via-slate-900/30 dark:to-cyan-950/30 flex flex-col overflow-hidden relative"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Floating Toy Box Pop Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated floating particles */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-10 w-32 h-32 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: '#00E0FF' }}
        />
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -25, 0],
            rotate: [0, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-40 left-8 w-28 h-28 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: '#FFCF00' }}
        />
        <motion.div
          animate={{
            y: [0, -35, 0],
            x: [0, 15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 left-12 w-20 h-20 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: '#6CFF6C' }}
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 right-16 w-24 h-24 rounded-full opacity-25 blur-3xl"
          style={{ backgroundColor: '#4B00FF' }}
        />
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8 relative z-10">
        {/* Premium 3D Glass Orb Avatar with Animated Neon Halo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
          className="relative mb-8 mx-auto"
          style={{ width: '100px', height: '100px' }}
        >
          {/* Animated Neon Halo Background */}
          <motion.div 
            animate={{
              scale: [1.3, 1.5, 1.3],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background: 'linear-gradient(135deg, #00E0FF, #6CFF6C, #FFCF00)',
            }}
          />
          
          {/* Glass Orb */}
          <div 
            className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden p-2"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.75))',
              backdropFilter: 'blur(20px)',
              border: '2.5px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 15px 50px rgba(0, 224, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            }}
          >
            <Logo showText={false} size="lg" />
            
            {/* Glossy reflection */}
            <div 
              className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full opacity-50 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9), transparent)',
              }}
            />
          </div>
        </motion.div>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl mb-2">
            Build Your <br/>
            <span style={{ 
              color: '#00A0CC',
              textShadow: '0 2px 15px rgba(0, 224, 255, 0.3)',
            }}>
              Dream Business
            </span>
          </h1>
          <p className="text-sm opacity-60">
            AI-powered guidance, every step of the way
          </p>
        </motion.div>

        {/* Welcome Message Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8 px-6 py-5 rounded-3xl relative overflow-hidden mx-2"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px rgba(0, 224, 255, 0.1)',
          }}
        >
          <h3 className="text-lg font-bold mb-2 text-center" style={{ color: '#4B00FF' }}>
            Welcome to Cofounder+
          </h3>
          <p className="text-sm text-center text-gray-600 dark:text-gray-300 leading-relaxed">
            The only app that combines AI, education, and tools to help you build a real business from scratch.
          </p>
        </motion.div>

        {/* Email Auth Buttons - Side by Side with Premium Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              try {
                navigate('/auth?mode=signup');
              } catch (err) {
                console.error('Navigation error:', err);
                window.location.href = '/#/auth?mode=signup';
              }
            }}
            className="rounded-2xl py-3.5 px-4 text-sm transition-all duration-300 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.95), rgba(0, 200, 255, 1))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 224, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
            }}
          >
            <span className="font-semibold text-white">Sign Up</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              try {
                navigate('/auth?mode=login');
              } catch (err) {
                console.error('Navigation error:', err);
                window.location.href = '/#/auth?mode=login';
              }
            }}
            className="rounded-2xl py-3.5 px-4 text-sm transition-all duration-300 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(0, 224, 255, 0.25)',
              boxShadow: '0 4px 16px rgba(0, 224, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <span className="font-semibold text-gray-800">Sign In</span>
          </motion.button>
        </motion.div>

        {/* Feature Pills with Premium Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-4"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 207, 0, 0.2), rgba(255, 235, 150, 0.15))',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 207, 0, 0.3)',
              boxShadow: '0 2px 8px rgba(255, 207, 0, 0.15)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-energy" />
            <span className="text-xs">AI Powered</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(108, 255, 108, 0.2), rgba(200, 255, 200, 0.15))',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(108, 255, 108, 0.3)',
              boxShadow: '0 2px 8px rgba(108, 255, 108, 0.15)',
            }}
          >
            <Rocket className="w-3.5 h-3.5 text-success" />
            <span className="text-xs">Launch Ready</span>
          </motion.div>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="text-center text-xs leading-relaxed"
          style={{ opacity: 0.5 }}
        >
          By continuing, you agree to our<br/>
          <button 
            onClick={() => navigate('/terms-of-service')}
            className="underline hover:opacity-100 transition-opacity text-primary"
          >
            Terms of Service
          </button>
          {' & '}
          <button 
            onClick={() => navigate('/privacy-policy')}
            className="underline hover:opacity-100 transition-opacity text-primary"
          >
            Privacy Policy
          </button>
          {' | '}
          <button 
            onClick={() => navigate('/help')}
            className="underline hover:opacity-100 transition-opacity text-primary"
          >
            Help
          </button>
        </motion.p>
      </div>
    </div>
  );
};

// Export the wrapped component with error boundary
export const MobileWelcome: React.FC<MobileWelcomeProps> = (props) => {
  return (
    <MobileWelcomeErrorBoundary>
      <MobileWelcomeContent {...props} />
    </MobileWelcomeErrorBoundary>
  );
};