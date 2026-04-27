/**
 * Platform Detection Utilities for Capacitor
 * 
 * Use these to detect if the app is running:
 * - As a native iOS/Android app (via Capacitor)
 * - In a web browser
 * - On a specific mobile OS
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if app is running as a native mobile app (via Capacitor)
 * Returns true if running on iOS or Android via Capacitor
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if app is running in a web browser
 */
export const isWeb = (): boolean => {
  return !isNativeApp();
};

/**
 * Check if running on iOS (native app)
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform();
};

/**
 * Check if running on Android (native app)
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Get the current platform name
 * Returns: 'ios' | 'android' | 'web'
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Check if app has native capabilities
 * (useful for conditionally showing features that require native APIs)
 */
export const hasNativeCapabilities = (): boolean => {
  return isNativeApp();
};

/**
 * Get safe area insets for notched devices (iPhone X+)
 * Returns CSS safe-area-inset values
 */
export const getSafeAreaInsets = () => {
  return {
    top: 'env(safe-area-inset-top)',
    right: 'env(safe-area-inset-right)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
  };
};

/**
 * Check if Apple In-App Purchase should be used
 * Returns true only for iOS native app
 */
export const shouldUseAppleIAP = (): boolean => {
  return isIOS();
};

/**
 * Check if Stripe should be used for payments
 * Returns true for web or Android
 */
export const shouldUseStripe = (): boolean => {
  return !isIOS();
};

/**
 * Get payment provider for current platform
 * Returns: 'apple_iap' | 'stripe'
 */
export const getPaymentProvider = (): 'apple_iap' | 'stripe' => {
  return shouldUseAppleIAP() ? 'apple_iap' : 'stripe';
};

/**
 * Example usage:
 * 
 * if (isNativeApp()) {
 *   // Show native-specific UI
 *   // Use native APIs (Camera, Biometrics, etc.)
 * }
 * 
 * if (isIOS()) {
 *   // iOS-specific styling
 * }
 * 
 * if (isWeb()) {
 *   // Web-specific features (like URL sharing)
 * }
 * 
 * if (shouldUseAppleIAP()) {
 *   // Show Apple IAP payment flow
 * } else {
 *   // Show Stripe payment flow
 * }
 */