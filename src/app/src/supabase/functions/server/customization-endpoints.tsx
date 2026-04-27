import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const customizationRoutes = new Hono();

// Get user's customization preferences
customizationRoutes.get('/customization/preferences', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error in get preferences:', authError);
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Get preferences from KV store
    const preferencesKey = `customization_preferences:${userId}`;
    const preferences = await kv.get(preferencesKey);

    // Return default preferences if none exist
    if (!preferences) {
      const defaultPreferences = {
        navItems: [
          { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
          { id: 'operations', label: 'Operations', icon: 'briefcase', path: '/operations' },
          { id: 'roadmap', label: 'Roadmap', icon: 'sparkles', path: '/roadmap' },
          { id: 'notes', label: 'Notes', icon: 'sticky-note', path: '/notes' },
          { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/calendar' }
        ],
        updatedAt: new Date().toISOString()
      };

      return c.json({
        success: true,
        preferences: defaultPreferences
      });
    }

    return c.json({
      success: true,
      preferences: JSON.parse(preferences)
    });

  } catch (error: any) {
    console.error('Error getting customization preferences:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get preferences'
    }, 500);
  }
});

// Save user's customization preferences
customizationRoutes.post('/customization/preferences', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error in save preferences:', authError);
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const { navItems } = body;

    if (!navItems || !Array.isArray(navItems)) {
      return c.json({ 
        success: false, 
        error: 'Invalid navItems array' 
      }, 400);
    }

    // Validate max 7 items
    if (navItems.length > 7) {
      return c.json({ 
        success: false, 
        error: 'Maximum 7 nav items allowed' 
      }, 400);
    }

    const preferences = {
      navItems,
      updatedAt: new Date().toISOString()
    };

    // Save to KV store
    const preferencesKey = `customization_preferences:${userId}`;
    await kv.set(preferencesKey, JSON.stringify(preferences));

    console.log(`✅ Saved customization preferences for user ${userId}:`, preferences);

    return c.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences
    });

  } catch (error: any) {
    console.error('Error saving customization preferences:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to save preferences'
    }, 500);
  }
});

// Reset preferences to default
customizationRoutes.post('/customization/reset', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization token required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error in reset preferences:', authError);
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Delete preferences from KV store
    const preferencesKey = `customization_preferences:${userId}`;
    await kv.del(preferencesKey);

    console.log(`✅ Reset customization preferences for user ${userId}`);

    return c.json({
      success: true,
      message: 'Preferences reset to default'
    });

  } catch (error: any) {
    console.error('Error resetting customization preferences:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to reset preferences'
    }, 500);
  }
});

export default customizationRoutes;