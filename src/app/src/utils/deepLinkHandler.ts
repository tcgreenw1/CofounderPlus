import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabase/client';

/**
 * Deep Link Handler for iOS/Android
 * 
 * Handles custom URL scheme callbacks from OAuth providers like Plaid
 * Format: cofounderplus://plaid-oauth-callback?params...
 */

export function useDeepLinkHandler() {
  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    console.log('🔗 Setting up deep link handler...');

    // Listen for app URL open events (deep links)
    const listener = CapacitorApp.addListener('appUrlOpen', async (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);

      try {
        const url = new URL(event.url);
        
        // Handle Supabase Auth Callback (Google/Apple)
        // cofounderplus://auth/callback?code=...
        if (event.url.includes('auth/callback')) {
            console.log('🔗 Auth callback detected!');
            
            // Close the in-app browser if it's still open
            try {
              // Don't await this - let it happen in background to not block auth flow
              Browser.close().catch(e => console.log('🔗 Browser close error (harmless):', e));
            } catch (e) {
              console.log('🔗 Browser close error (harmless):', e);
            }

            const code = url.searchParams.get('code');
            
            if (code) {
                console.log('🔗 Exchanging OAuth code for session...');
                
                // Exchange code
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                
                if (error) {
                    console.error('🔗 ❌ Auth exchange error:', error);
                    alert('Authentication failed: ' + error.message);
                } else {
                    console.log('🔗 ✅ Auth exchange success for user:', data.user?.email);
                    
                    // Notify user via simple alert for feedback (optional, helps debugging)
                    // alert('Signed in! Redirecting...');

                    // 1. Emit custom event for any React listeners
                    window.dispatchEvent(new Event('oauth-login-success'));
                    
                    // 2. Force navigation after small delay to allow storage to settle
                    setTimeout(() => {
                        console.log('🔗 🔄 navigating to dashboard...');
                        // Use replace to replace current history entry
                        window.location.replace('/dashboard');
                        // Fallback reload if router doesn't pick it up
                        setTimeout(() => window.location.reload(), 500);
                    }, 1000); 
                }
            } else {
                console.log('🔗 ⚠️ No code found in auth callback');
                // Check for hash fragment just in case
                if (url.hash) {
                    console.log('🔗 Found hash, attempting session setup from URL...');
                    const { data, error } = await supabase.auth.getSession();
                    if (!error && data.session) {
                         console.log('🔗 ✅ Session found via hash/URL');
                         window.location.href = '/dashboard';
                    }
                }
            }
            return;
        }

        // Handle Plaid OAuth callback
        if (url.pathname === '//plaid-oauth-callback' || url.host === 'plaid-oauth-callback') {
          console.log('🏦 Plaid OAuth callback detected!');
          console.log('🏦 Full URL:', event.url);
          console.log('🏦 URL params:', url.searchParams.toString());
          
          // Extract OAuth parameters
          const oauth_state_id = url.searchParams.get('oauth_state_id');
          console.log('🏦 OAuth State ID:', oauth_state_id);
          
          // Navigate to Finance page with OAuth parameters
          // The Plaid Link SDK will detect the OAuth completion and continue
          if (typeof window !== 'undefined' && window.location) {
            const financeUrl = `/operations/finance?${url.searchParams.toString()}`;
            console.log('🏦 Navigating to:', financeUrl);
            window.location.href = financeUrl;
          }
        }
        
        // Handle generic deep link to open app
        if (url.pathname === '//' || url.host === '' || event.url === 'cofounderplus://') {
          console.log('🔗 Generic app open - going to dashboard');
          if (typeof window !== 'undefined' && window.location) {
            window.location.href = '/dashboard';
          }
        }
        
      } catch (error) {
        console.error('🔗 Error parsing deep link:', error);
      }
    });

    console.log('🔗 ✅ Deep link handler registered');

    // Cleanup listener on unmount
    return () => {
      listener.remove();
      console.log('🔗 Deep link handler removed');
    };
  }, []);
}

/**
 * Hook to handle Plaid-specific deep links
 * Use this in components that use PlaidLink
 */
export function usePlaidDeepLinkHandler(onCallback?: (params: URLSearchParams) => void) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listener = CapacitorApp.addListener('appUrlOpen', (event: { url: string }) => {
      try {
        const url = new URL(event.url);
        
        if (url.pathname === '//plaid-oauth-callback' || url.host === 'plaid-oauth-callback') {
          console.log('🏦 Plaid OAuth callback - extracting parameters');
          
          const params = url.searchParams;
          
          // Log all parameters for debugging
          for (const [key, value] of params.entries()) {
            console.log(`🏦 ${key}:`, value);
          }
          
          // Call optional callback with parameters
          if (onCallback) {
            onCallback(params);
          }
        }
      } catch (error) {
        console.error('🏦 Error handling Plaid deep link:', error);
      }
    });

    return () => {
      listener.remove();
    };
  }, [onCallback]);
}
