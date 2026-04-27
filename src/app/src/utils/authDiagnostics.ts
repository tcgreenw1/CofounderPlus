/**
 * Auth Diagnostics Utility
 * Helper functions for diagnosing authentication issues
 */

import { supabase } from './supabase/client';

/**
 * Run comprehensive authentication diagnostics
 * Checks session status, token validity, and auth configuration
 */
export async function runAuthDiagnostics(): Promise<void> {
  console.log('🔍 Running auth diagnostics...');

  try {
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else if (session) {
      console.log('✅ Active session found:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });
    } else {
      console.log('ℹ️ No active session');
    }

    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User error:', userError);
    } else if (user) {
      console.log('✅ User authenticated:', {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at ? 'Yes' : 'No'
      });
    } else {
      console.log('ℹ️ No authenticated user');
    }

    console.log('✅ Auth diagnostics complete');
  } catch (error) {
    console.error('❌ Auth diagnostics failed:', error);
  }
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
}

/**
 * Get current session info
 */
export async function getSessionInfo() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
