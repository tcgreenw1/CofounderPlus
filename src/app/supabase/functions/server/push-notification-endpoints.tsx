/**
 * Apple Push Notification Service (APNS) Endpoints
 * Handles iOS push notification registration and delivery
 */

import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_cache.tsx';

const app = new Hono();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const APNS_KEY = Deno.env.get('APPLE_PUSH_NOTIFICATION_KEY');
const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID');
const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID');
const APNS_BUNDLE_ID = Deno.env.get('APNS_BUNDLE_ID');
const APNS_ENVIRONMENT = Deno.env.get('APNS_ENVIRONMENT') || 'sandbox';

/**
 * Register device token for push notifications
 * POST /make-server-373d8b09/push/register
 */
app.post('/make-server-373d8b09/push/register', async (c) => {
  console.log('📱 APNS: Register device token');
  
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { deviceToken, deviceId, deviceModel } = await c.req.json();

    if (!deviceToken) {
      return c.json({ success: false, error: 'Device token required' }, 400);
    }

    // Store device token in KV store
    const deviceKey = `device:${user.id}:${deviceId || deviceToken}`;
    await kv.set(deviceKey, {
      userId: user.id,
      deviceToken,
      deviceId: deviceId || deviceToken,
      deviceModel: deviceModel || 'iPhone',
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      platform: 'ios',
      enabled: true
    });

    // Also maintain a list of all device tokens for this user
    const userDevicesKey = `user:${user.id}:devices`;
    const existingDevices = await kv.get(userDevicesKey) || [];
    
    if (!existingDevices.includes(deviceId || deviceToken)) {
      existingDevices.push(deviceId || deviceToken);
      await kv.set(userDevicesKey, existingDevices);
    }

    console.log(`✅ APNS: Registered device ${deviceId} for user ${user.id}`);

    return c.json({
      success: true,
      message: 'Device registered for push notifications',
      deviceId: deviceId || deviceToken
    });

  } catch (error) {
    console.error('❌ APNS: Registration error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to register device'
    }, 500);
  }
});

/**
 * Unregister device token
 * POST /make-server-373d8b09/push/unregister
 */
app.post('/make-server-373d8b09/push/unregister', async (c) => {
  console.log('📱 APNS: Unregister device token');
  
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { deviceId } = await c.req.json();

    if (!deviceId) {
      return c.json({ success: false, error: 'Device ID required' }, 400);
    }

    // Remove device from KV store
    const deviceKey = `device:${user.id}:${deviceId}`;
    await kv.del(deviceKey);

    // Remove from user's device list
    const userDevicesKey = `user:${user.id}:devices`;
    const existingDevices = await kv.get(userDevicesKey) || [];
    const updatedDevices = existingDevices.filter(d => d !== deviceId);
    await kv.set(userDevicesKey, updatedDevices);

    console.log(`✅ APNS: Unregistered device ${deviceId} for user ${user.id}`);

    return c.json({
      success: true,
      message: 'Device unregistered from push notifications'
    });

  } catch (error) {
    console.error('❌ APNS: Unregistration error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to unregister device'
    }, 500);
  }
});

/**
 * Update notification preferences
 * POST /make-server-373d8b09/push/preferences
 */
app.post('/make-server-373d8b09/push/preferences', async (c) => {
  console.log('📱 APNS: Update notification preferences');
  
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const preferences = await c.req.json();

    // Store notification preferences
    const preferencesKey = `user:${user.id}:notification_preferences`;
    await kv.set(preferencesKey, {
      ...preferences,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ APNS: Updated preferences for user ${user.id}`);

    return c.json({
      success: true,
      message: 'Notification preferences updated',
      preferences
    });

  } catch (error) {
    console.error('❌ APNS: Preferences update error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to update preferences'
    }, 500);
  }
});

/**
 * Get notification preferences
 * GET /make-server-373d8b09/push/preferences
 */
app.get('/make-server-373d8b09/push/preferences', async (c) => {
  console.log('📱 APNS: Get notification preferences');
  
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const preferencesKey = `user:${user.id}:notification_preferences`;
    const preferences = await kv.get(preferencesKey) || {
      // Default preferences (all enabled)
      enabled: true,
      teamInvitations: true,
      cofounderUpdates: true,
      automationResults: true,
      taskReminders: true,
      deadlineAlerts: true,
      marketingInsights: true,
      financeAlerts: true,
      salesUpdates: true,
      operationsNotifications: true,
      soundEnabled: true,
      badgeEnabled: true,
      alertStyle: 'banner'
    };

    return c.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('❌ APNS: Get preferences error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get preferences'
    }, 500);
  }
});

/**
 * Diagnostic endpoint to check APNS configuration
 * GET /make-server-373d8b09/push/diagnostic
 */
app.get('/make-server-373d8b09/push/diagnostic', async (c) => {
  console.log('🔍 APNS: Running diagnostic check');
  
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Check environment variables
    const config = {
      APNS_KEY: APNS_KEY ? `Configured (${APNS_KEY.substring(0, 50)}...)` : 'NOT CONFIGURED',
      APNS_KEY_ID: APNS_KEY_ID || 'NOT CONFIGURED',
      APNS_TEAM_ID: APNS_TEAM_ID || 'NOT CONFIGURED',
      APNS_BUNDLE_ID: APNS_BUNDLE_ID || 'NOT CONFIGURED',
      APNS_ENVIRONMENT: APNS_ENVIRONMENT
    };

    // Check registered devices
    const userDevicesKey = `user:${user.id}:devices`;
    const deviceIds = await kv.get(userDevicesKey) || [];
    
    const devices = [];
    for (const deviceId of deviceIds) {
      const deviceKey = `device:${user.id}:${deviceId}`;
      const device = await kv.get(deviceKey);
      if (device) {
        devices.push({
          deviceId: device.deviceId,
          deviceModel: device.deviceModel,
          enabled: device.enabled,
          registeredAt: device.registeredAt,
          deviceToken: device.deviceToken ? `${device.deviceToken.substring(0, 20)}...` : 'none'
        });
      }
    }

    // Get notification preferences
    const preferencesKey = `user:${user.id}:notification_preferences`;
    const preferences = await kv.get(preferencesKey);

    // Test JWT generation
    let jwtTest = { success: false, error: 'Not attempted' };
    if (APNS_KEY && APNS_KEY_ID && APNS_TEAM_ID) {
      try {
        const testJwt = await generateAPNSJWT();
        jwtTest = { 
          success: true, 
          token: `${testJwt.substring(0, 50)}...`,
          length: testJwt.length 
        };
      } catch (error) {
        jwtTest = { success: false, error: error.message };
      }
    }

    const diagnostic = {
      success: true,
      timestamp: new Date().toISOString(),
      userId: user.id,
      configuration: config,
      configurationStatus: {
        allVariablesSet: !!(APNS_KEY && APNS_KEY_ID && APNS_TEAM_ID && APNS_BUNDLE_ID),
        readyToSend: !!(APNS_KEY && APNS_KEY_ID && APNS_TEAM_ID)
      },
      jwtGeneration: jwtTest,
      devices: {
        count: devices.length,
        devices: devices
      },
      preferences: preferences || 'Using defaults',
      recommendations: []
    };

    // Add recommendations
    if (!APNS_KEY) {
      diagnostic.recommendations.push('Set APPLE_PUSH_NOTIFICATION_KEY environment variable with your .p8 key file contents');
    }
    if (!APNS_KEY_ID) {
      diagnostic.recommendations.push('Set APNS_KEY_ID environment variable (10-character key ID from Apple)');
    }
    if (!APNS_TEAM_ID) {
      diagnostic.recommendations.push('Set APNS_TEAM_ID environment variable (10-character team ID from Apple)');
    }
    if (devices.length === 0) {
      diagnostic.recommendations.push('No devices registered. Make sure your iOS app calls the /push/register endpoint');
    }
    if (!jwtTest.success) {
      diagnostic.recommendations.push(`JWT generation failed: ${jwtTest.error}`);
    }

    console.log('✅ APNS: Diagnostic complete', {
      ready: diagnostic.configurationStatus.readyToSend,
      devices: devices.length,
      issues: diagnostic.recommendations.length
    });

    return c.json(diagnostic);

  } catch (error) {
    console.error('❌ APNS: Diagnostic error:', error);
    return c.json({
      success: false,
      error: error.message || 'Diagnostic failed'
    }, 500);
  }
});

/**
 * Send push notification to specific user
 * POST /make-server-373d8b09/push/send
 * Internal use only - called by other endpoints
 */
app.post('/make-server-373d8b09/push/send', async (c) => {
  console.log('📱 APNS: Send push notification');
  
  try {
    const { 
      userId, 
      title, 
      message, 
      category, 
      data,
      badge,
      sound = 'default'
    } = await c.req.json();

    if (!userId || !title || !message) {
      return c.json({ 
        success: false, 
        error: 'userId, title, and message are required' 
      }, 400);
    }

    // Check user's notification preferences
    const preferencesKey = `user:${userId}:notification_preferences`;
    const preferences = await kv.get(preferencesKey);

    // If notifications are disabled globally, skip
    if (preferences && preferences.enabled === false) {
      console.log(`⏭️ APNS: Notifications disabled for user ${userId}`);
      return c.json({
        success: true,
        message: 'Notification skipped - user disabled notifications',
        sent: false
      });
    }

    // Check category-specific preferences
    if (preferences && category) {
      const categoryKey = getCategoryPreferenceKey(category);
      if (categoryKey && preferences[categoryKey] === false) {
        console.log(`⏭️ APNS: ${category} notifications disabled for user ${userId}`);
        return c.json({
          success: true,
          message: `Notification skipped - ${category} disabled`,
          sent: false
        });
      }
    }

    // Get user's devices
    const userDevicesKey = `user:${userId}:devices`;
    const deviceIds = await kv.get(userDevicesKey) || [];

    if (deviceIds.length === 0) {
      console.log(`⚠️ APNS: No devices registered for user ${userId}`);
      return c.json({
        success: true,
        message: 'No devices to send to',
        sent: false
      });
    }

    // Send to all devices
    const results = [];
    for (const deviceId of deviceIds) {
      const deviceKey = `device:${userId}:${deviceId}`;
      const device = await kv.get(deviceKey);

      if (!device || !device.enabled) {
        console.log(`⏭️ APNS: Device ${deviceId} disabled or not found`);
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
          sound: preferences?.soundEnabled !== false ? sound : undefined
        });

        results.push({ deviceId, success: true });
        console.log(`✅ APNS: Sent to device ${deviceId}`);
      } catch (error) {
        console.error(`❌ APNS: Failed to send to device ${deviceId}:`, error);
        results.push({ deviceId, success: false, error: error.message });
      }
    }

    return c.json({
      success: true,
      message: `Sent to ${results.filter(r => r.success).length}/${results.length} devices`,
      results,
      sent: results.some(r => r.success)
    });

  } catch (error) {
    console.error('❌ APNS: Send error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to send notification'
    }, 500);
  }
});

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
    'support_urgent': 'supportTickets'
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
    console.warn('⚠️ APNS: APPLE_PUSH_NOTIFICATION_KEY not configured, skipping actual send');
    return; // Don't fail if APNS not configured
  }

  if (!APNS_KEY_ID || !APNS_TEAM_ID) {
    console.warn('⚠️ APNS: APNS_KEY_ID or APNS_TEAM_ID not configured');
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
    console.log(`📱 APNS: Sending to ${isProduction ? 'production' : 'sandbox'} environment`);
    
    // Generate JWT token for APNS authentication
    const jwtToken = await generateAPNSJWT();
    
    // Make HTTP/2 request to APNS
    const response = await fetch(`${apnsUrl}/3/device/${payload.deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwtToken}`,
        'apns-topic': APNS_BUNDLE_ID || 'com.cofounder.app',
        'apns-priority': '10',
        'apns-push-type': 'alert',
        'apns-expiration': '0',
        'content-type': 'application/json'
      },
      body: JSON.stringify(apnsPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ APNS: Send failed with status ${response.status}:`, errorText);
      throw new Error(`APNS request failed: ${response.status} - ${errorText}`);
    }

    console.log(`✅ APNS: Successfully sent notification (status ${response.status})`);
    
  } catch (error) {
    console.error('❌ APNS: Send failed:', error);
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

export { app as pushNotificationApp };