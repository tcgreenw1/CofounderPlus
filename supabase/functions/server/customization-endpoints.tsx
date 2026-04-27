import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
          { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' }
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

    return c.json({
      success: true,
      message: 'Preferences saved successfully',
      preferences
    });

  } catch (error: any) {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Delete preferences from KV store
    const preferencesKey = `customization_preferences:${userId}`;
    await kv.del(preferencesKey);

    return c.json({
      success: true,
      message: 'Preferences reset to default'
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to reset preferences'
    }, 500);
  }
});

// Save a specific customization key-value pair (used by onboarding tour)
customizationRoutes.post('/customization/save', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { userId, key, value } = body;

    // Verify the authenticated user matches the userId in the request
    if (userId !== user.id) {
      return c.json({ success: false, error: 'User ID mismatch' }, 403);
    }

    if (!key) {
      return c.json({ success: false, error: 'Key is required' }, 400);
    }

    // Save to KV store with user-specific key
    const kvKey = `user_setting:${userId}:${key}`;
    await kv.set(kvKey, JSON.stringify(value));

    return c.json({
      success: true,
      message: 'Setting saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving customization:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to save setting'
    }, 500);
  }
});

// Get a specific customization key-value pair (used by onboarding tour)
customizationRoutes.get('/customization/get', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = c.req.query('userId');
    const key = c.req.query('key');

    // Verify the authenticated user matches the userId in the request
    if (userId !== user.id) {
      return c.json({ success: false, error: 'User ID mismatch' }, 403);
    }

    if (!key) {
      return c.json({ success: false, error: 'Key is required' }, 400);
    }

    // Get from KV store with user-specific key
    const kvKey = `user_setting:${userId}:${key}`;
    const valueStr = await kv.get(kvKey);

    if (!valueStr) {
      return c.json({
        success: true,
        value: null
      });
    }

    const value = JSON.parse(valueStr);

    return c.json({
      success: true,
      value
    });

  } catch (error: any) {
    console.error('Error getting customization:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get setting'
    }, 500);
  }
});

// Get desktop navigation preferences
customizationRoutes.get('/nav-customize/get-desktop', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Get desktop nav from KV store
    const desktopNavKey = `desktop_nav_preferences:${userId}`;
    const navOptionsStr = await kv.get(desktopNavKey);

    // Return default if none exist - NEW STRUCTURE
    if (!navOptionsStr) {
      const defaultOptions = ['dashboard', 'sales', 'finance', 'marketing', 'product', 'hr', 'notes', 'calendar'];
      return c.json({
        success: true,
        navOptions: defaultOptions
      });
    }

    return c.json({
      success: true,
      navOptions: JSON.parse(navOptionsStr)
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to get desktop nav preferences'
    }, 500);
  }
});

// Save desktop navigation preferences
customizationRoutes.post('/nav-customize/save-desktop', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const { navOptions } = body;

    if (!navOptions || !Array.isArray(navOptions)) {
      return c.json({ 
        success: false, 
        error: 'Invalid navOptions array' 
      }, 400);
    }

    // Save to KV store
    const desktopNavKey = `desktop_nav_preferences:${userId}`;
    await kv.set(desktopNavKey, JSON.stringify(navOptions));

    return c.json({
      success: true,
      message: 'Desktop navigation saved successfully',
      navOptions
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to save desktop nav preferences'
    }, 500);
  }
});

// Reset desktop navigation to defaults
customizationRoutes.post('/nav-customize/reset-desktop', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // NEW STRUCTURE defaults
    const defaultOptions = ['dashboard', 'sales', 'finance', 'marketing', 'product', 'hr', 'notes', 'calendar'];
    
    // Save defaults to KV store
    const desktopNavKey = `desktop_nav_preferences:${userId}`;
    await kv.set(desktopNavKey, JSON.stringify(defaultOptions));

    return c.json({
      success: true,
      message: 'Desktop navigation reset to defaults',
      navOptions: defaultOptions
    });

  } catch (error: any) {
    return c.json({
      success: false,
      error: error.message || 'Failed to reset desktop nav preferences'
    }, 500);
  }
});

// Cofounder AI Navigation Optimization
customizationRoutes.post('/nav-customize/cofounder-optimize', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const { currentOptions, availableOptions } = body;

    console.log('🤖 Cofounder optimizing navigation for user:', userId);

    // Get user's business data to understand their needs
    const businessKey = `selected_business:${userId}`;
    const selectedBusinessStr = await kv.get(businessKey);
    let businessContext = '';
    
    if (selectedBusinessStr) {
      try {
        const selectedBusiness = JSON.parse(selectedBusinessStr);
        const businessDataKey = `business:${userId}:${selectedBusiness.id}`;
        const businessDataStr = await kv.get(businessDataKey);
        
        if (businessDataStr) {
          const businessData = JSON.parse(businessDataStr);
          businessContext = `Business: ${businessData.name}, Industry: ${businessData.industry || 'Not specified'}`;
        }
      } catch (e) {
        console.log('Could not parse business data');
      }
    }

    // Get user activity data to understand usage patterns
    const userActivityKeys = await kv.getByPrefix(`user_activity:${userId}:`);
    let activityContext = '';
    if (userActivityKeys && userActivityKeys.length > 0) {
      activityContext = `User has ${userActivityKeys.length} activity records`;
    }

    // Call OpenAI to get intelligent recommendations
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        input: [
          {
            role: 'system',
            content: `You are Cofounder, an intelligent business assistant helping optimize a user's navigation experience in a business management app.

The app has these main areas:
- Dashboard: Overview and quick access
- Operations Hub: Central hub with submenu for Product, Marketing, Sales, Finance, HR
- Cofounder AGI: Roadmap and strategic planning tool
- Notes: Note-taking and documentation
- Cofounder Chat: AI chat assistant
- Task Automations: Automate repetitive tasks
- Calendar: Schedule and events
- Product, Marketing, Sales, Finance, HR: Individual operation pages
- Team: Team management
- University: Learning resources
- Dream Board: Goals and vision
- Hubspot, Salesforce: CRM integrations

Based on the user's context, recommend the optimal 5-7 navigation items that would be most useful.

Return ONLY a JSON object with this structure:
{
  "recommendedOptions": ["id1", "id2", "id3", ...],
  "reasoning": "Brief explanation of why these pages were selected"
}`
          },
          {
            role: 'user',
            content: `User Context:
${businessContext || 'No business context available'}
${activityContext || 'No activity data available'}

Currently Selected: ${currentOptions.join(', ')}

Available Options:
${availableOptions.map((opt: any) => `- ${opt.id}: ${opt.label}`).join('\\n')}

Please recommend the best 5-7 navigation pages for this user's desktop sidebar. Consider:
1. Essential pages everyone needs (Dashboard, Operations Hub)
2. Pages relevant to their business type
3. Workflow efficiency
4. Most commonly used features

Return recommendations as JSON.`
          }
        ],
        max_output_tokens: 500,
        temperature: 0.3
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return c.json({ error: 'Failed to get Cofounder recommendations' }, 500);
    }

    const openaiData = await openaiResponse.json();
    
    const responseText =
      openaiData.output_text ??
      openaiData?.output?.[0]?.content?.[0]?.text ??
      null;
    
    if (!responseText) {
      return c.json({ error: 'No recommendations received' }, 400);
    }

    console.log('🤖 Cofounder response:', responseText);

    // Parse the JSON response
    let recommendations;
    try {
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Cofounder response:', parseError);
      
      // Fallback to intelligent defaults
      recommendations = {
        recommendedOptions: ['dashboard', 'operations-hub', 'cofounder-agi', 'notes', 'calendar', 'cofounder-chat'],
        reasoning: 'Selected core pages for business management and productivity'
      };
    }

    if (!recommendations.recommendedOptions || !Array.isArray(recommendations.recommendedOptions)) {
      return c.json({ error: 'Invalid recommendations format' }, 400);
    }

    // Ensure recommended options are valid
    const validOptionIds = availableOptions.map((opt: any) => opt.id);
    const validRecommendations = recommendations.recommendedOptions.filter((id: string) => 
      validOptionIds.includes(id)
    );

    console.log('✅ Cofounder recommendations:', validRecommendations);

    return c.json({
      success: true,
      recommendedOptions: validRecommendations,
      reasoning: recommendations.reasoning || 'Optimized for your workflow',
      tokensUsed: openaiData.usage?.total_tokens || 0
    });

  } catch (error: any) {
    console.error('Cofounder optimization error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to optimize navigation'
    }, 500);
  }
});

// Cofounder AI Mobile Navigation Optimization
customizationRoutes.post('/nav-customize/cofounder-optimize-mobile', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const { currentItems, availableItems } = body;

    console.log('🤖 Cofounder optimizing mobile navigation for user:', userId);

    // Get user's business data to understand their needs
    const businessKey = `selected_business:${userId}`;
    const selectedBusinessStr = await kv.get(businessKey);
    let businessContext = '';
    
    if (selectedBusinessStr) {
      try {
        const selectedBusiness = JSON.parse(selectedBusinessStr);
        const businessDataKey = `business:${userId}:${selectedBusiness.id}`;
        const businessDataStr = await kv.get(businessDataKey);
        
        if (businessDataStr) {
          const businessData = JSON.parse(businessDataStr);
          businessContext = `Business: ${businessData.name}, Industry: ${businessData.industry || 'Not specified'}`;
        }
      } catch (e) {
        console.log('Could not parse business data');
      }
    }

    // Call OpenAI to get intelligent recommendations
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        input: [
          {
            role: 'system',
            content: `You are Cofounder, an intelligent business assistant helping optimize a user's mobile navigation experience.

The mobile navigation has limited space (max 7 items) and should prioritize the most frequently needed features for on-the-go access.

Available navigation items include:
- Dashboard: Quick overview
- Cofounder Chat: AI assistant chat
- Task Automations: Automate tasks
- Cofounder AGI: Roadmap and strategy
- Operations: Business operations hub
- Calendar: Schedule management
- Products, Sales, Marketing, HR: Individual operation pages
- Notes: Quick note-taking
- Settings, Profile: Account management
- HubSpot, Salesforce: CRM integrations
- University: Learning resources

Based on the user's context, recommend 5-7 navigation items optimal for mobile use, prioritizing frequently accessed features and mobile-friendly workflows.

Return ONLY a JSON object with this structure:
{
  "recommendedItems": [
    {"id": "dashboard", "label": "Dashboard", "icon": "home", "path": "/dashboard"},
    ...
  ],
  "reasoning": "Brief explanation of why these items were selected for mobile"
}`
          },
          {
            role: 'user',
            content: `User Context:
${businessContext || 'No business context available'}

Currently Selected Mobile Items: ${currentItems.map((i: any) => i.label).join(', ')}

Available Items:
${availableItems.map((item: any) => `- ${item.id}: ${item.label} (icon: ${item.icon})`).join('\\n')}

Please recommend 5-7 optimal navigation items for mobile. Consider:
1. Mobile-friendly features (quick access, on-the-go needs)
2. Essential items for business management
3. Items relevant to their business type
4. Space constraints (max 7 items)

Return recommendations as JSON matching the exact structure of the available items.`
          }
        ],
        max_output_tokens: 600,
        temperature: 0.3
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return c.json({ error: 'Failed to get Cofounder recommendations' }, 500);
    }

    const openaiData = await openaiResponse.json();
    
    const responseText =
      openaiData.output_text ??
      openaiData?.output?.[0]?.content?.[0]?.text ??
      null;
    
    if (!responseText) {
      return c.json({ error: 'No recommendations received' }, 400);
    }

    console.log('🤖 Cofounder mobile response:', responseText);

    // Parse the JSON response
    let recommendations;
    try {
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Cofounder response:', parseError);
      
      // Fallback to mobile-optimized defaults
      recommendations = {
        recommendedItems: [
          { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard' },
          { id: 'operations', label: 'Operations', icon: 'briefcase', path: '/operations' },
          { id: 'roadmap', label: 'Roadmap', icon: 'sparkles', path: '/roadmap' },
          { id: 'notes', label: 'Notes', icon: 'sticky-note', path: '/notes' },
          { id: 'calendar', label: 'Calendar', icon: 'calendar', path: '/calendar' }
        ],
        reasoning: 'Selected mobile-optimized pages for quick access and productivity'
      };
    }

    if (!recommendations.recommendedItems || !Array.isArray(recommendations.recommendedItems)) {
      return c.json({ error: 'Invalid recommendations format' }, 400);
    }

    // Ensure recommended items are valid and properly formatted
    const validItemIds = availableItems.map((item: any) => item.id);
    const validRecommendations = recommendations.recommendedItems.filter((item: any) => 
      validItemIds.includes(item.id)
    );

    // Limit to 7 items max
    const limitedRecommendations = validRecommendations.slice(0, 7);

    console.log('✅ Cofounder mobile recommendations:', limitedRecommendations);

    return c.json({
      success: true,
      recommendedItems: limitedRecommendations,
      reasoning: recommendations.reasoning || 'Optimized for mobile workflow',
      tokensUsed: openaiData.usage?.total_tokens || 0
    });

  } catch (error: any) {
    console.error('Cofounder mobile optimization error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to optimize mobile navigation'
    }, 500);
  }
});

// Get finance show dreams preference
customizationRoutes.get('/user-preferences/finance-show-dreams', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    
    // Get preference from KV store
    const key = `finance_show_dreams:${userId}`;
    const valueStr = await kv.get(key);

    // Default to true if no preference exists
    const showDreams = valueStr ? JSON.parse(valueStr) : true;

    return c.json({
      success: true,
      showDreams
    });

  } catch (error: any) {
    console.error('Error getting finance show dreams preference:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get preference'
    }, 500);
  }
});

// Save finance show dreams preference
customizationRoutes.post('/user-preferences/finance-show-dreams', async (c) => {
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
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const { showDreams } = body;

    if (showDreams === undefined || typeof showDreams !== 'boolean') {
      return c.json({ 
        success: false, 
        error: 'showDreams boolean value is required' 
      }, 400);
    }

    // Save to KV store
    const key = `finance_show_dreams:${userId}`;
    await kv.set(key, JSON.stringify(showDreams));

    return c.json({
      success: true,
      message: 'Preference saved successfully',
      showDreams
    });

  } catch (error: any) {
    console.error('Error saving finance show dreams preference:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to save preference'
    }, 500);
  }
});

export default customizationRoutes;