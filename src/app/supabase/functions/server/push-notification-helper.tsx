/**
 * Push Notification Helper
 * Sends iOS push notifications when in-app notifications are created
 */

import * as kv from './kv_cache.tsx';

const APNS_KEY = Deno.env.get('APPLE_PUSH_NOTIFICATION_KEY');
const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID');
const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID');
const APNS_BUNDLE_ID = Deno.env.get('APNS_BUNDLE_ID') || 'com.cofounder.app';
const APNS_ENVIRONMENT = Deno.env.get('APNS_ENVIRONMENT') || 'sandbox';

/**
 * Send push notification to user
 * This is called automatically when an in-app notification is created
 */
export async function sendPushNotification(params: {
  userId: string;
  title: string;
  message: string;
  category?: string;
  data?: any;
  badge?: number;
}) {
  const { userId, title, message, category, data, badge } = params;

  try {
    console.log(`📱 Push: Sending notification to user ${userId}: "${title}"`);

    // Check user's notification preferences
    const preferencesKey = `user:${userId}:notification_preferences`;
    const preferences = await kv.get(preferencesKey);

    // If notifications are disabled globally, skip
    if (preferences && preferences.enabled === false) {
      console.log(`⏭️ Push: Notifications disabled for user ${userId}`);
      return { success: true, sent: false, reason: 'disabled' };
    }

    // Check category-specific preferences
    if (preferences && category) {
      const categoryKey = getCategoryPreferenceKey(category);
      if (categoryKey && preferences[categoryKey] === false) {
        console.log(`⏭️ Push: ${category} notifications disabled for user ${userId}`);
        return { success: true, sent: false, reason: `category_${category}_disabled` };
      }
    }

    // Get user's devices
    const userDevicesKey = `user:${userId}:devices`;
    const deviceIds = await kv.get(userDevicesKey) || [];

    if (deviceIds.length === 0) {
      console.log(`⚠️ Push: No devices registered for user ${userId}`);
      return { success: true, sent: false, reason: 'no_devices' };
    }

    // Send to all devices
    const results = [];
    for (const deviceId of deviceIds) {
      const deviceKey = `device:${userId}:${deviceId}`;
      const device = await kv.get(deviceKey);

      if (!device || !device.enabled) {
        console.log(`⏭️ Push: Device ${deviceId} disabled or not found`);
        continue;
      }

      try {
        await sendAPNS({
          deviceToken: device.deviceToken,
          title,
          message,
          category,
          data,
          badge: preferences?.badgeEnabled !== false ? badge : undefined,
          sound: preferences?.soundEnabled !== false ? 'default' : undefined
        });

        results.push({ deviceId, success: true });
        console.log(`✅ Push: Sent to device ${deviceId}`);
      } catch (error) {
        console.error(`❌ Push: Failed to send to device ${deviceId}:`, error);
        results.push({ deviceId, success: false, error: error.message });
      }
    }

    const sentCount = results.filter(r => r.success).length;
    console.log(`✅ Push: Sent to ${sentCount}/${results.length} devices`);

    return {
      success: true,
      sent: sentCount > 0,
      results,
      sentCount,
      totalDevices: results.length
    };

  } catch (error) {
    console.error('❌ Push: Send error:', error);
    return {
      success: false,
      sent: false,
      error: error.message
    };
  }
}

/**
 * Map notification category to preference key
 */
function getCategoryPreferenceKey(category: string): string | null {
  const mapping = {
    'team_invitation': 'teamInvitations',
    'cofounder_notification': 'cofounderUpdates',
    'automation_run': 'automationResults',
    'automation_completed': 'automationResults',
    'roadmap_refresh': 'automationResults',
    'task': 'taskReminders',
    'deadline': 'deadlineAlerts',
    'marketing': 'marketingInsights',
    'finance': 'financeAlerts',
    'sales': 'salesUpdates',
    'operations': 'operationsNotifications',
    'support_ticket': 'supportTickets',
    'support_urgent': 'supportTickets',
    'general': 'cofounderUpdates'
  };
  
  return mapping[category] || null;
}

/**
 * Send APNS notification
 */
async function sendAPNS(payload: {
  deviceToken: string;
  title: string;
  message: string;
  category?: string;
  data?: any;
  badge?: number;
  sound?: string;
}) {
  if (!APNS_KEY) {
    console.log('ℹ️ Push: APPLE_PUSH_NOTIFICATION_KEY not configured, notification logged but not sent');
    console.log('📱 Push would send:', {
      title: payload.title,
      message: payload.message,
      category: payload.category,
      badge: payload.badge
    });
    return; // Don't fail if APNS not configured
  }

  if (!APNS_KEY_ID || !APNS_TEAM_ID) {
    console.warn('⚠️ Push: APNS_KEY_ID or APNS_TEAM_ID not configured');
    return;
  }

  // Construct APNS payload
  const apnsPayload = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.message
      },
      badge: payload.badge,
      sound: payload.sound || 'default',
      category: payload.category,
      'mutable-content': 1,
      'content-available': 1
    },
    data: payload.data || {}
  };

  // Use APNS HTTP/2 API
  const isProduction = APNS_ENVIRONMENT === 'production';
  const apnsUrl = isProduction
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com';

  try {
    console.log(`📱 Push: Sending to ${isProduction ? 'production' : 'sandbox'} environment`);
    
    // Generate JWT token for APNS authentication
    const jwtToken = await generateAPNSJWT();
    
    // Make HTTP/2 request to APNS
    const response = await fetch(`${apnsUrl}/3/device/${payload.deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwtToken}`,
        'apns-topic': APNS_BUNDLE_ID,
        'apns-priority': '10',
        'apns-push-type': 'alert',
        'apns-expiration': '0',
        'content-type': 'application/json'
      },
      body: JSON.stringify(apnsPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Push: Send failed with status ${response.status}:`, errorText);
      throw new Error(`APNS request failed: ${response.status} - ${errorText}`);
    }

    console.log(`✅ Push: Successfully sent notification (status ${response.status})`);
    
  } catch (error) {
    console.error('❌ Push: Send failed:', error);
    throw error;
  }
}

/**
 * Generate JWT token for APNS authentication
 */
async function generateAPNSJWT(): Promise<string> {
  // JWT header
  const header = {
    alg: 'ES256',
    kid: APNS_KEY_ID
  };

  // JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: APNS_TEAM_ID,
    iat: now
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const privateKey = await importAPNSPrivateKey(APNS_KEY!);

  // Sign the token
  const encoder = new TextEncoder();
  const data = encoder.encode(unsignedToken);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    data
  );

  // Encode signature
  const encodedSignature = base64UrlEncode(signature);

  return `${unsignedToken}.${encodedSignature}`;
}

/**
 * Import APNS private key from PEM format
 */
async function importAPNSPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM header/footer and whitespace
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  // Decode base64
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  // Import the key
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}