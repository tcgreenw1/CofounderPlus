/**
 * BillingRedirect - Handles automatic sign-in from mobile app billing portal
 * 
 * Flow:
 * 1. Mobile app opens: https://www.cofounderplus.com/billing-redirect?token=SESSION_TOKEN
 * 2. This component reads the token
 * 3. Sets up Supabase session
 * 4. Redirects to /pricing
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function BillingRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const handleBillingRedirect = async () => {
      try {
        // Get the access token and refresh token from URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          console.error('❌ Missing authentication tokens in URL');
          setStatus('error');
          setMessage('Invalid link. Please try again from the app.');
          toast.error('Invalid authentication link');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
          return;
        }

        console.log('🔐 Found authentication tokens, setting up session...');
        setMessage('Authenticating...');

        // Set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('❌ Session setup error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          toast.error('Failed to sign in');
          
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
          return;
        }

        if (data?.session) {
          console.log('✅ Session established successfully');
          setStatus('success');
          setMessage('Signed in! Redirecting to billing...');
          toast.success('Successfully signed in');

          // Small delay to show success state, then redirect to pricing
          setTimeout(() => {
            navigate('/pricing');
          }, 1000);
        } else {
          console.error('❌ No session data returned');
          setStatus('error');
          setMessage('Something went wrong. Please try again.');
          
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Billing redirect error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        toast.error('Failed to sign in');
        
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    handleBillingRedirect();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00E0FF]/10 via-[#FFCF00]/10 to-[#FF4F4F]/10 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'loading' && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {status === 'loading' && 'Setting up your session...'}
            {status === 'success' && 'Welcome back!'}
            {status === 'error' && 'Oops!'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {/* Loading dots */}
          {status === 'loading' && (
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}

          {/* Manual navigation for errors */}
          {status === 'error' && (
            <button
              onClick={() => navigate('/auth')}
              className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
