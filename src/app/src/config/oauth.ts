/**
 * OAuth Configuration
 * 
 * This file manages OAuth redirect URLs for both development and production.
 * 
 * IMPORTANT SUPABASE SETUP REQUIRED:
 * 1. Go to: https://supabase.com/dashboard/project/rvwduromkqfzplwnmijl/settings/general
 * 2. Change "Site URL" from localhost:3000 to localhost:5173 (or your production domain)
 * 3. Add redirect URLs (see /OAUTH_LOCALHOST_3000_FIX.md)
 * 
 * THEN update PRODUCTION_DOMAIN below with your deployed website URL.
 */

import { Capacitor } from '@capacitor/core';

// Production domain for Cofounder app
export const PRODUCTION_DOMAIN = 'https://www.cofounderplus.com';

// Deep link scheme for native mobile app
export const DEEP_LINK_SCHEME = 'cofounderplus';

/**
 * IMPORTANT: If you see errors with localhost:3000, read /OAUTH_LOCALHOST_3000_FIX.md
 * The issue is in Supabase Dashboard settings, not this code.
 */

/**
 * Gets the appropriate OAuth redirect URL based on environment
 * 
 * For localhost (development):
 *   - Uses http://localhost:5173/auth/callback
 * 
 * For native mobile app:
 *   - Uses cofounderplus://auth/callback (deep link)
 * 
 * For production (deployed web):
 *   - Uses https://your-production-domain.com/auth/callback
 */
export function getOAuthRedirectUrl(): string {
  // Check if running as native mobile app
  const isNativeApp = Capacitor.isNativePlatform();
  
  if (isNativeApp) {
    // Use deep link for native apps
    return `${DEEP_LINK_SCHEME}://auth/callback`;
  }
  
  // Web-based redirects
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    return `${window.location.origin}/auth/callback`;
  }
  
  return `${PRODUCTION_DOMAIN}/auth/callback`;
}

/**
 * Validates that the OAuth configuration is properly set up
 * Logs warnings to console if production domain is not configured
 */
export function validateOAuthConfig(): void {
  // Check if running on an unexpected port
  const currentPort = window.location.port;
  const currentOrigin = window.location.origin;
  
  console.log('🔍 OAuth Configuration Check:');
  console.log(`   Current URL: ${currentOrigin}`);
  console.log(`   Expected Supabase Site URL: ${currentOrigin}`);
  console.log('');
  
  // Warn about port 3000 (common issue)
  if (currentPort === '3000') {
    console.warn('⚠️  WARNING: You are on port 3000');
    console.warn('   If OAuth fails, your Supabase Site URL might be set to localhost:3000');
    console.warn('   But your app might be running on a different port (e.g., 5173)');
    console.warn('   Fix: See /OAUTH_LOCALHOST_3000_FIX.md');
    console.warn('');
  }
  
  // Warn about production domain not configured
  if (PRODUCTION_DOMAIN === 'https://your-production-domain.com') {
    console.warn('⚠️  OAuth Configuration Warning:');
    console.warn('   PRODUCTION_DOMAIN is not configured in /src/config/oauth.ts');
    console.warn('   OAuth will not work on mobile devices or production deployments');
    console.warn('   Please update PRODUCTION_DOMAIN with your actual website URL');
    console.warn('');
    console.warn('   CRITICAL: Also check Supabase Dashboard settings:');
    console.warn('   1. Site URL: https://supabase.com/dashboard/project/rvwduromkqfzplwnmijl/settings/general');
    console.warn('   2. Should be: ' + currentOrigin + ' (for local testing)');
    console.warn('   3. Or your production domain (for deployed app)');
    console.warn('');
    console.warn('   See /OAUTH_LOCALHOST_3000_FIX.md for detailed instructions');
  }
  
  // Check for localhost:5173 specifically
  if (currentOrigin === 'http://localhost:5173' || currentOrigin === 'http://127.0.0.1:5173') {
    console.log('✅ Running on Vite dev server (port 5173)');
    console.log('   Make sure Supabase Site URL is set to: http://localhost:5173');
    console.log('   Dashboard: https://supabase.com/dashboard/project/rvwduromkqfzplwnmijl/settings/general');
    console.log('');
  }
}
