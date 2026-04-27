/**
 * iOS Push Notification Registration
 * Handles proper APNS registration flow for iOS devices
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { projectId } from './supabase/info';
import { getSupabaseClient } from './supabase/client';

export interface PushNotificationStatus {
  isRegistered: boolean;
  token?: string;
  permissionGranted: boolean;
  error?: string;
}

/**
 * Initialize and register for push notifications on iOS
 * This MUST be called for the app to appear in Settings → Notifications
 */
export async function initializePushNotifications(): Promise<PushNotificationStatus> {
  // Only run on native iOS
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    console.log('⏭️ Push notifications: Not on iOS, skipping');
    return {
      isRegistered: false,
      permissionGranted: false,
      error: 'Not running on iOS'
    };
  }

  console.log('🔔 Initializing iOS push notifications...');

  try {
    // Step 1: Check current permission status
    const permStatus = await PushNotifications.checkPermissions();
    console.log('📋 Current permission status:', permStatus.receive);

    // Step 2: Request permissions (this shows the iOS popup)
    // CRITICAL: This is required for app to appear in Settings → Notifications
    let finalPermStatus = permStatus;
    
    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      console.log('🔔 Requesting push notification permissions...');
      finalPermStatus = await PushNotifications.requestPermissions();
      console.log('✅ Permission result:', finalPermStatus.receive);
    }

    // Step 3: Register with APNS if permission granted
    // CRITICAL: Must call register() after requestPermissions()
    if (finalPermStatus.receive === 'granted') {
      console.log('📝 Registering device with APNS...');
      
      // Set up listeners BEFORE calling register()
      await setupPushNotificationListeners();
      
      // Register with Apple Push Notification Service
      await PushNotifications.register();
      
      console.log('✅ Push notification registration initiated');
      
      return {
        isRegistered: true,
        permissionGranted: true
      };
    } else {
      console.warn('⚠️ Push notification permission denied or not available');
      return {
        isRegistered: false,
        permissionGranted: false,
        error: 'Permission denied'
      };
    }
  } catch (error) {
    console.error('❌ Push notification initialization failed:', error);
    return {
      isRegistered: false,
      permissionGranted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Setup push notification event listeners
 */
async function setupPushNotificationListeners() {
  // Listen for successful registration
  await PushNotifications.addListener('registration', async (token) => {
    console.log('✅ APNS Registration successful! Token:', token.value);
    
    // Send token to backend
    await sendTokenToBackend(token.value);
  });

  // Listen for registration errors
  await PushNotifications.addListener('registrationError', (error: any) => {
    console.error('❌ APNS Registration error:', error);
  });

  // Listen for push notifications received
  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📨 Push notification received:', notification);
  });

  // Listen for push notification actions
  await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('👆 Push notification action:', notification);
  });
}

/**
 * Send device token to backend for storage
 */
async function sendTokenToBackend(token: string): Promise<void> {
  try {
    const { data: { session } } = await getSupabaseClient().auth.getSession();
    
    if (!session?.access_token) {
      console.warn('⚠️ No active session, cannot register device token');
      return;
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/push/register-device`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceToken: token,
          platform: 'ios'
        })
      }
    );

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Device token registered with backend');
    } else {
      console.error('❌ Failed to register device token:', data.error);
    }
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
  }
}

/**
 * Check if push notifications are available and registered
 */
export async function checkPushNotificationStatus(): Promise<PushNotificationStatus> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return {
      isRegistered: false,
      permissionGranted: false,
      error: 'Not running on iOS'
    };
  }

  try {
    const permStatus = await PushNotifications.checkPermissions();
    
    return {
      isRegistered: permStatus.receive === 'granted',
      permissionGranted: permStatus.receive === 'granted'
    };
  } catch (error) {
    return {
      isRegistered: false,
      permissionGranted: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Request permission again if previously denied
 */
export async function requestPushPermissionAgain(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return false;
  }

  try {
    const result = await PushNotifications.requestPermissions();
    
    if (result.receive === 'granted') {
      // Setup listeners and register
      await setupPushNotificationListeners();
      await PushNotifications.register();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to request permissions:', error);
    return false;
  }
}
