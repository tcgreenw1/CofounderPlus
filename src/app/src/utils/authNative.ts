import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { SignInWithApple, SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
import { supabase } from './supabase/client';

const IOS_GOOGLE_CLIENT_ID =
  '351315533657-8qa1oht700d288cml4v3f6lf86gg0r3i.apps.googleusercontent.com';
const WEB_GOOGLE_CLIENT_ID =
  '529555872449-5trn6gnj5ujnvkg2u1r0tvi1q38imnr7.apps.googleusercontent.com';
const IOS_REDIRECT_URI = 'cofounderplus://auth/callback';


/* ---------------------------------------------------
   APPLE — WEB SIGN-IN (browser only)
---------------------------------------------------- */
export async function signInWithAppleWeb(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🍎 Starting web Apple OAuth...');

    const redirectUrl =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.origin}/auth/callback`
        : 'https://www.cofounderplus.com/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: redirectUrl },
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign in with Apple' };
  }
}

export async function signInWithApple(): Promise<{ success: boolean; error?: string }> {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  if (isNative && platform === 'ios') return signInWithAppleNative();
  return signInWithAppleWeb();
}


/* ---------------------------------------------------
   GOOGLE — WEB SIGN-IN
---------------------------------------------------- */
export async function signInWithGoogleWeb(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔵 Starting web Google OAuth...');

    const redirectUrl =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.origin}/auth/callback`
        : 'https://www.cofounderplus.com/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/* ---------------------------------------------------
   GOOGLE — ROUTER
---------------------------------------------------- */
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  if (isNative && platform === 'ios') return signInWithGoogleNative();
  if (isNative) return signInWithGoogleInApp();
  return signInWithGoogleWeb();
}
