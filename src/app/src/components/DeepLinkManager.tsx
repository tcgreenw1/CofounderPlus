import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../utils/supabase/client';

/**
 * Manages deep links (OAuth callbacks, Plaid, etc.) inside the React Router context.
 * This replaces the old useDeepLinkHandler hook to allow for proper navigation.
 */
export const DeepLinkManager: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    console.log('🔗 DeepLinkManager: Registering listener...');

    const listener = CapacitorApp.addListener('appUrlOpen', async (event: { url: string }) => {
      console.log('🔗 DeepLinkManager: Deep link received:', event.url);

      try {
        // 1. Close the in-app browser if open (non-blocking)
        Browser.close().catch(e => console.log('🔗 Browser close ignored:', e));

        const url = new URL(event.url);

        // 2. Handle Supabase Auth Callback
        if (event.url.includes('auth/callback')) {
            console.log('🔗 Auth callback detected');
            console.log('🔗 Full URL:', event.url);
            console.log('🔗 Search params:', url.search);
            console.log('🔗 Hash:', url.hash);
            
            // IMPORTANT: Navigate to a loading screen first so user doesn't see blank white screen
            // This will show the AuthCallback component while we process the OAuth
            const searchString = url.search || '';
            const hashString = url.hash || '';
            navigate(`/auth/callback${searchString}${hashString}`, { replace: true });
            
            // Small delay to let the AuthCallback component render
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check for errors
            const error = url.searchParams.get('error');
            const errorDesc = url.searchParams.get('error_description');
            if (error) {
                console.error('🔗 Auth error from provider:', error, errorDesc);
                
                // Navigate to auth page with error
                setTimeout(() => {
                  navigate('/auth?error=' + encodeURIComponent(errorDesc || error), { replace: true });
                }, 500);
                return;
            }

            // Extract code (PKCE flow)
            const code = url.searchParams.get('code');
            
            if (code) {
                console.log('🔗 PKCE code found - exchanging for session...');
                console.log('🔗 Code (truncated):', code.substring(0, 20) + '...');
                
                // Add visual feedback while processing
                const processingToast = document.createElement('div');
                processingToast.style.cssText = `
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  background: var(--background);
                  color: var(--foreground);
                  padding: 24px;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                  z-index: 10000;
                  text-align: center;
                  font-family: var(--font-sans);
                `;
                processingToast.innerHTML = `
                  <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                    Completing Sign In...
                  </div>
                  <div style="font-size: 14px; color: var(--muted-foreground);">
                    Please wait a moment
                  </div>
                `;
                document.body.appendChild(processingToast);
                
                try {
                  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                  
                  // Remove toast
                  processingToast.remove();
                  
                  if (exchangeError) {
                      console.error('🔗 Exchange error:', exchangeError);
                      
                      // Navigate to auth with error
                      setTimeout(() => {
                        navigate('/auth?error=' + encodeURIComponent(exchangeError.message), { replace: true });
                      }, 500);
                      return;
                  }
                  
                  if (data?.session) {
                      console.log('✅ Exchange success! User:', data.user?.email);
                      console.log('✅ Provider:', data.user?.app_metadata?.provider || data.user?.identities?.[0]?.provider);
                      console.log('💾 Session access_token length:', data.session.access_token?.length || 0);
                      console.log('💾 Session refresh_token length:', data.session.refresh_token?.length || 0);
                      
                      // CRITICAL: Wait longer to ensure session is fully stored in all storage mechanisms
                      console.log('⏳ Waiting for session to persist across all storage...');
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      // CRITICAL: Verify the session was actually persisted in storage
                      const { data: { session: storedSession } } = await supabase.auth.getSession();
                      if (storedSession) {
                          console.log('✅ Session successfully persisted in storage!');
                          console.log('✅ Stored session user:', storedSession.user?.email);
                          
                          // Dispatch success event BEFORE navigation
                          window.dispatchEvent(new Event('oauth-login-success'));
                          
                          // Small delay before navigation to ensure event handlers complete
                          await new Promise(resolve => setTimeout(resolve, 300));
                          
                          // Navigate to dashboard with replace to prevent back button issues
                          console.log('🔗 Navigating to dashboard...');
                          navigate('/dashboard', { replace: true });
                          
                      } else {
                          console.error('❌ WARNING: Session not found in storage after exchange!');
                          console.error('❌ This indicates a storage persistence issue');
                          
                          // Try one more time after a longer delay
                          console.log('🔄 Retrying session check after 2s delay...');
                          await new Promise(resolve => setTimeout(resolve, 2000));
                          
                          const { data: { session: retrySession } } = await supabase.auth.getSession();
                          if (retrySession) {
                              console.log('✅ Session found on retry!');
                              window.dispatchEvent(new Event('oauth-login-success'));
                              navigate('/dashboard', { replace: true });
                          } else {
                              console.error('❌ Session still not found after retry');
                              navigate('/auth?error=' + encodeURIComponent('Session could not be saved. Please try again.'), { replace: true });
                          }
                      }
                      
                  } else {
                      console.error('❌ Exchange returned no session');
                      navigate('/auth?error=' + encodeURIComponent('Authentication failed - no session created'), { replace: true });
                  }
                } catch (exchangeErr: any) {
                  processingToast.remove();
                  console.error('❌ Exception during exchange:', exchangeErr);
                  navigate('/auth?error=' + encodeURIComponent(exchangeErr.message || 'Authentication failed'), { replace: true });
                }
            } else {
                // Implicit flow or existing session check
                console.log('🔗 No code found - checking for implicit flow or existing session...');
                
                if (url.hash) {
                    console.log('🔗 Hash params found:', url.hash);
                    // Wait for Supabase to auto-process hash
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Check for session
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    console.log('✅ Session found! User:', session.user?.email);
                    console.log('✅ Provider:', session.user?.app_metadata?.provider || session.user?.identities?.[0]?.provider);
                    
                    // Dispatch success event
                    window.dispatchEvent(new Event('oauth-login-success'));
                    
                    // Navigate to dashboard
                    console.log('🔗 Navigating to dashboard...');
                    await new Promise(resolve => setTimeout(resolve, 300));
                    navigate('/dashboard', { replace: true });
                    
                } else {
                    console.error('❌ No session found after deep link callback');
                    console.log('🔍 Debug - URL:', event.url);
                    navigate('/auth?error=' + encodeURIComponent('No session created. Please try again.'), { replace: true });
                }
            }
            return;
        }

        // 3. Handle Plaid OAuth callback
        if (url.pathname.includes('plaid-oauth-callback') || url.host === 'plaid-oauth-callback') {
           console.log('🏦 Plaid callback detected');
           const financeUrl = `/operations/finance?${url.searchParams.toString()}`;
           navigate(financeUrl, { replace: true });
           return;
        }

        // 4. Generic app open (home)
        if (url.pathname === '//' || url.host === '' || event.url === 'cofounderplus://') {
           // Just ensure we are on a valid page
           console.log('🔗 Generic open');
        }

      } catch (error: any) {
        console.error('🔗 Error handling deep link:', error);
        alert('Error opening link: ' + error.message);
      }
    });

    return () => {
      listener.remove();
      console.log('🔗 DeepLinkManager: Listener removed');
    };
  }, [navigate]);

  return null;
};