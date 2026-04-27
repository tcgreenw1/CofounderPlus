import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Plaid OAuth Redirect Handler
 * 
 * This page is shown when Plaid redirects back after OAuth authentication.
 * 
 * Flow:
 * 1. User clicks "Connect Bank" in iOS app
 * 2. Plaid opens Safari for OAuth
 * 3. Bank authenticates user
 * 4. Bank redirects to: https://www.cofounderplus.com/plaid-oauth-redirect?oauth_state_id=...
 * 5. This page detects if it's in a mobile browser or app webview
 * 6. Redirects back to app using: cofounderplus://plaid-oauth-callback?...
 * 7. App receives deep link and Plaid Link SDK continues
 */
export function PlaidOAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'detecting' | 'redirecting' | 'complete' | 'error'>('detecting');
  const [message, setMessage] = useState('Processing bank authentication...');

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('🏦 Plaid OAuth Redirect Handler');
        console.log('🏦 Current URL:', window.location.href);
        console.log('🏦 Search params:', window.location.search);
        
        // Get all OAuth parameters from URL
        const params = new URLSearchParams(window.location.search);
        const oauth_state_id = params.get('oauth_state_id');
        
        console.log('🏦 OAuth State ID:', oauth_state_id);
        console.log('🏦 All params:', Array.from(params.entries()));

        // Check if we're in a Capacitor app or mobile browser
        const isMobileApp = Capacitor.isNativePlatform();
        const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        console.log('🏦 Is Capacitor App:', isMobileApp);
        console.log('🏦 Is Mobile Browser:', isMobileBrowser);

        if (isMobileApp) {
          // We're in the app webview - redirect to Finance page with params
          // The Plaid Link SDK will detect the OAuth completion
          console.log('🏦 In app webview - redirecting to Finance page');
          setStatus('redirecting');
          setMessage('Authentication successful! Returning to app...');
          
          // Navigate to finance page, Plaid will detect the OAuth state
          setTimeout(() => {
            navigate(`/operations/finance?${params.toString()}`, { replace: true });
          }, 1000);
          
        } else if (isMobileBrowser) {
          // We're in Safari/Chrome mobile browser - need to deep link back to app
          console.log('🏦 In mobile browser - attempting deep link to app');
          setStatus('redirecting');
          setMessage('Redirecting back to app...');
          
          // Construct deep link URL with all OAuth parameters
          const deepLink = `cofounderplus://plaid-oauth-callback?${params.toString()}`;
          console.log('🏦 Deep link:', deepLink);
          
          // Try to open the app
          window.location.href = deepLink;
          
          // Give it 2 seconds, then show fallback
          setTimeout(() => {
            setStatus('error');
            setMessage('Unable to return to app automatically. Please open the Cofounder app manually.');
          }, 2000);
          
        } else {
          // We're on desktop - redirect to Finance page normally
          console.log('🏦 On desktop - redirecting to Finance page');
          setStatus('redirecting');
          setMessage('Redirecting...');
          
          setTimeout(() => {
            navigate(`/operations/finance?${params.toString()}`, { replace: true });
          }, 500);
        }

      } catch (error) {
        console.error('🏦 OAuth redirect error:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
      }
    };

    handleRedirect();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          {status === 'detecting' || status === 'redirecting' ? (
            <div className="flex justify-center mb-4">
              <LoadingSpinner size="large" />
            </div>
          ) : status === 'complete' ? (
            <div className="text-6xl mb-4">✅</div>
          ) : (
            <div className="text-6xl mb-4">⚠️</div>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
          {status === 'detecting' && 'Processing...'}
          {status === 'redirecting' && 'Almost Done!'}
          {status === 'complete' && 'Success!'}
          {status === 'error' && 'Action Required'}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>

        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                window.location.href = 'cofounderplus://';
              }}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Open Cofounder App
            </button>
            <button
              onClick={() => navigate('/operations/finance')}
              className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors"
            >
              Continue in Browser
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Powered by Plaid - Bank-level security
          </p>
        </div>
      </div>
    </div>
  );
}
