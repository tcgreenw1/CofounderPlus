/**
 * Cofounder Settings Endpoints
 * Handles saving and loading Cofounder AGI configuration and notification preferences
 * Version: 1.0
 */

import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const cofounderSettingsRouter = new Hono();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

/**
 * POST /settings/cofounder/save
 * Save Cofounder AGI settings for a business
 */
cofounderSettingsRouter.post('/settings/cofounder/save', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const { businessId, settings } = await c.req.json();

    if (!businessId || !settings) {
      console.error('❌ Missing required fields:', { businessId, settings: !!settings });
      return c.json({ 
        success: false, 
        error: 'businessId and settings are required' 
      }, 400);
    }

    // Save settings to KV store
    const settingsKey = `business:${user.id}:${businessId}:cofounder_settings`;
    const settingsJson = JSON.stringify(settings);
    
    console.log(`💾 Saving Cofounder settings:`, {
      key: settingsKey,
      userId: user.id,
      businessId,
      settingsSize: settingsJson.length,
      agiEnabled: settings.agiEnabled,
      automationsCount: settings.automations?.length || 0
    });

    await kv.set(settingsKey, settingsJson);

    // Verify the save by reading it back
    const verification = await kv.get(settingsKey);
    if (!verification) {
      console.error('❌ Failed to verify settings save');
      throw new Error('Settings save verification failed');
    }

    console.log(`✅ Cofounder settings saved and verified for user ${user.id}, business ${businessId}`);

    return c.json({
      success: true,
      message: 'Cofounder settings saved successfully',
      timestamp: settings.updatedAt
    });

  } catch (error: any) {
    console.error('❌ Error saving Cofounder settings:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to save Cofounder settings'
    }, 500);
  }
});

/**
 * GET /settings/cofounder/load
 * Load Cofounder AGI settings for a business
 */
cofounderSettingsRouter.get('/settings/cofounder/load', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    // Use ANON_KEY for user token validation
    const authClient = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return c.json({ success: false, error: 'Authentication failed' }, 401);
    }

    const businessId = c.req.query('businessId');

    if (!businessId) {
      console.error('❌ No businessId provided in query');
      return c.json({ 
        success: false, 
        error: 'businessId is required' 
      }, 400);
    }

    // Load settings from KV store
    const settingsKey = `business:${user.id}:${businessId}:cofounder_settings`;
    
    console.log(`📥 Loading Cofounder settings:`, {
      key: settingsKey,
      userId: user.id,
      businessId
    });

    const settingsData = await kv.get(settingsKey);
    
    let settings = null;
    if (settingsData && typeof settingsData === 'string') {
      settings = JSON.parse(settingsData);
      console.log(`✅ Loaded settings from KV store (parsed from string)`);
    } else if (settingsData) {
      settings = settingsData;
      console.log(`✅ Loaded settings from KV store (direct object)`);
    } else {
      console.log(`ℹ️ No existing settings found, returning defaults`);
    }

    const defaultSettings = {
      agiEnabled: false,
      automations: [],
      notificationPreferences: {
        general: true,
        task: true,
        deadline: true,
        insight: true,
        warning: true,
        achievement: true,
      }
    };

    return c.json({
      success: true,
      settings: settings || defaultSettings,
      isDefault: !settings
    });

  } catch (error: any) {
    console.error('❌ Error loading Cofounder settings:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to load Cofounder settings'
    }, 500);
  }
});

export default cofounderSettingsRouter;
