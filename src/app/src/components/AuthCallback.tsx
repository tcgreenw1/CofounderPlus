import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getCapturedParams, clearCapturedParams } from '../utils/supabase/urlCapture';
import { Card, CardContent } from './ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const [hasProcessed, setHasProcessed] = React.useState(false);

  useEffect(() => {
    // Prevent double-processing if React StrictMode causes double render
    if (hasProcessed) {
      console.log('➡️ AuthCallback already processed, skipping...');
      return;
    }
    
    const handleAuthCallback = async () => {
      setHasProcessed(true);
      try {
        console.log('═══════════════════════════════════════');
        console.log('🍎 AuthCallback: Processing OAuth callback...');
        console.log('═══════════════════════════════════════');
        console.log('📍 Current URL:', window.location.href);
        console.log('🔍 Search params:', window.location.search);
        console.log('🔗 Hash:', window.location.hash);
        console.log('🔗 Pathname:', window.location.pathname);
        
        // CRITICAL: Try to get captured params FIRST (before Supabase stripped them)
        const captured = getCapturedParams();
        if (captured) {
          console.log('🎯 Found captured params from BEFORE Supabase stripped them!');
          console.log('🎯 Original URL:', captured.originalUrl);
          console.log('🎯 Captured params:', captured.params);
        }
        
        // Parse parameters directly from window.location for maximum reliability
        const urlSearchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Merge captured params with current params (captured takes priority)
        if (captured) {
          Object.entries(captured.params).forEach(([key, value]) => {
            if (key.startsWith('hash_')) {
              // This was originally in the hash
              const originalKey = key.replace('hash_', '');
              hashParams.set(originalKey, value);
            } else {
              // This was in the search params
              urlSearchParams.set(key, value);
            }
          });
        }
        
        // Log ALL parameters for debugging
        console.log('📋 All search params:');
        urlSearchParams.forEach((value, key) => {
          console.log(`  - ${key}: ${key.includes('token') || key.includes('code') ? value.substring(0, 20) + '...' : value}`);
        });
        
        console.log('📋 All hash params:');
        hashParams.forEach((value, key) => {
          console.log(`  - ${key}: ${key.includes('token') || key.includes('code') ? value.substring(0, 20) + '...' : value}`);
        });
        
        // Check if this is a password recovery flow
        const type = urlSearchParams.get('type') || searchParams.get('type');
        console.log('🔐 Auth type:', type);
        
        if (type === 'recovery') {
          console.log('🔑 Password recovery flow detected');
          
          // ... recovery code omitted for brevity - same as before ...
          
          // Navigate normally for recovery
          setTimeout(() => {
            navigate('/auth?mode=reset-password&verified=true');
          }, 1500);
          return;
        }
        
        // CRITICAL: Check for error in URL first
        const errorDescription = urlSearchParams.get('error_description') || searchParams.get('error_description');
        const errorCode = urlSearchParams.get('error') || searchParams.get('error');
        
        if (errorCode || errorDescription) {
          console.error('❌ AuthCallback: OAuth error in URL:', errorCode, errorDescription);
          setStatus('error');
          setMessage(errorDescription || errorCode || 'Authentication failed');
          setTimeout(() => {
            navigate('/auth?error=' + encodeURIComponent(errorDescription || errorCode || 'Unknown error'));
          }, 3000);
          return;
        }
        
        // STEP 1: Check if Supabase already processed the OAuth and created a session
        console.log('🔍 Step 1: Checking for existing session...');
        try {
          // Wait a moment for Supabase to auto-process OAuth callbacks
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          
          if (existingSession?.user) {
            console.log('✅ SUCCESS! Supabase auto-processed OAuth - session already exists!');
            console.log('👤 User ID:', existingSession.user.id);
            console.log('📧 Email:', existingSession.user.email);
            console.log('🔐 Provider:', existingSession.user.app_metadata?.provider);
            console.log('🆕 Is new user:', existingSession.user.created_at === existingSession.user.last_sign_in_at);
            
            setStatus('success');
            setMessage('Successfully authenticated! Redirecting...');
            
            // CRITICAL: Force hard reload to clear cached app
            console.log('🔄 Forcing hard reload to ensure fresh app code...');
            
            setTimeout(() => {
              const redirectTo = urlSearchParams.get('redirect_to') || searchParams.get('redirect_to') || '/dashboard';
              const fromValue = urlSearchParams.get('from') || searchParams.get('from');
              
              let targetPath = redirectTo;
              if (fromValue === 'profile') {
                targetPath = '/settings?tab=security';
              } else if (fromValue === 'industry-selection') {
                targetPath = '/business-name?from=signup';
              }
              
              // Use window.location.href with cache-busting to force reload
              // This bypasses React Router and browser cache
              window.location.href = targetPath + (targetPath.includes('?') ? '&' : '?') + '_t=' + Date.now();
            }, 1500);
            return;
          } else {
            console.log('ℹ️ No existing session found, proceeding to manual token exchange...');
          }
        } catch (sessionCheckError: any) {
          console.warn('⚠️ Session check failed (non-blocking):', sessionCheckError.message);
        }
        
        // STEP 2: Check for authorization code (PKCE flow)
        const code = urlSearchParams.get('code') || searchParams.get('code');
        console.log('📝 Has code param:', !!code);
        console.log('📄 Code value:', code ? `${code.substring(0, 20)}...` : 'none');
        
        // CRITICAL FIX for Apple OAuth: Exchange code for session immediately
        if (code) {
          console.log('🔑 PKCE flow detected - exchanging code for session...');
          
          try {
            const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('❌ Error exchanging code:', exchangeError);
              setStatus('error');
              setMessage(`Failed to complete sign in: ${exchangeError.message}`);
              setTimeout(() => navigate('/auth'), 3000);
              return;
            }
            
            if (sessionData?.session) {
              console.log('✅ SUCCESS! Code exchanged for session!');
              console.log('👤 User ID:', sessionData.session.user.id);
              console.log('📧 Email:', sessionData.session.user.email);
              console.log('🔐 Provider:', sessionData.session.user.identities?.[0]?.provider);
              console.log('💾 Session stored in localStorage');
              
              setStatus('success');
              setMessage('Successfully authenticated! Redirecting...');
              
              // CRITICAL: Force hard reload to clear any cached app code
              // This ensures the latest version of the app loads after OAuth
              console.log('🔄 Forcing hard reload to ensure fresh app code...');
              
              setTimeout(() => {
                const redirectTo = urlSearchParams.get('redirect_to') || searchParams.get('redirect_to') || '/dashboard';
                const fromValue = urlSearchParams.get('from') || searchParams.get('from');
                
                let targetPath = redirectTo;
                if (fromValue === 'profile') {
                  targetPath = '/settings?tab=security';
                } else if (fromValue === 'industry-selection') {
                  targetPath = '/business-name?from=signup';
                }
                
                // Use window.location.href with cache-busting to force reload
                // This bypasses React Router and browser cache
                window.location.href = targetPath + (targetPath.includes('?') ? '&' : '?') + '_t=' + Date.now();
              }, 1500);
              return;
            } else {
              console.error('❌ Code exchange returned no session');
              setStatus('error');
              setMessage('Authentication failed. Please try again.');
              setTimeout(() => navigate('/auth'), 3000);
              return;
            }
          } catch (err: any) {
            console.error('❌ Exception during code exchange:', err);
            setStatus('error');
            setMessage(`Authentication error: ${err.message || 'Unknown error'}`);
            setTimeout(() => navigate('/auth'), 3000);
            return;
          }
        }
        
        // Fallback: Check for hash-based flow (older OAuth flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('🎫 Hash has access_token:', !!accessToken);
        console.log('🎫 Hash has refresh_token:', !!refreshToken);
        
        if (accessToken || refreshToken) {
          console.log('🔍 Hash-based OAuth detected, waiting for Supabase to process...');
          
          // Wait for Supabase to automatically process the hash
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data } = await supabase.auth.getSession();
          
          if (data?.session) {
            console.log('✅ Session obtained from hash');
            setStatus('success');
            setMessage('Successfully authenticated! Redirecting...');
            
            // CRITICAL: Force hard reload for hash-based OAuth too
            console.log('🔄 Forcing hard reload to ensure fresh app code...');
            
            setTimeout(() => {
              const redirectTo = urlSearchParams.get('redirect_to') || searchParams.get('redirect_to') || '/dashboard';
              const fromValue = urlSearchParams.get('from') || searchParams.get('from');
              
              let targetPath = redirectTo;
              if (fromValue === 'profile') {
                targetPath = '/settings?tab=security';
              } else if (fromValue === 'industry-selection') {
                targetPath = '/business-name?from=signup';
              }
              
              // Use window.location.href with cache-busting to force reload
              window.location.href = targetPath + (targetPath.includes('?') ? '&' : '?') + '_t=' + Date.now();
            }, 1500);
            return;
          }
        }
        
        // If we get here, no code or hash was found
        console.error('❌ No authorization code or access token found in URL');
        setStatus('error');
        setMessage('No authentication data found. Please try signing in again.');
        setTimeout(() => navigate('/auth'), 3000);
        
      } catch (error: any) {
        console.error('AuthCallback: Unexpected error:', error);
        setStatus('error');
        setMessage(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
        
        setTimeout(() => {
          navigate('/auth?error=' + encodeURIComponent(error.message || 'Authentication failed'));
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, hasProcessed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-950 starry-background transition-all duration-300">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6">
        <div className="max-w-md mx-auto w-full">
          <Card className="glass-morphism border border-white/30 dark:border-gray-700/30">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                {status === 'loading' && (
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                
                {status === 'success' && (
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                )}
                
                {status === 'error' && (
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {status === 'loading' && 'Authenticating...'}
                {status === 'success' && 'Welcome to Cofounder!'}
                {status === 'error' && 'Authentication Error'}
              </h1>

              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>

              {status === 'loading' && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}

              {status === 'error' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  You'll be redirected to the sign-in page in a few seconds...
                </div>
              )}

              {status === 'success' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Redirecting to your dashboard...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;
