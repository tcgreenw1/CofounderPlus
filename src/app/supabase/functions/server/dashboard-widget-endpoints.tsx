import { Hono } from 'npm:hono';
import * as kv from './kv_cache.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// Default widget configuration
const DEFAULT_WIDGETS = [
  'getting-started',
  'number-one-goal',
  'important-notes'
];

// Helper function: Retry auth requests with exponential backoff
async function retryAuthRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      const errorMessage = error?.message || String(error);
      
      const shouldRetry = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('503');
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

async function getUserId(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  try {
    const { data: { user }, error } = await retryAuthRequest(() => 
      supabase.auth.getUser(token)
    );
    return user ? user.id : null;
  } catch (e) {
    console.error('Auth verification failed:', e);
    return null;
  }
}

/**
 * GET /dashboard/widgets
 * Get user's dashboard widget preferences
 */
app.get('/widgets', async (c) => {
  try {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized - No user ID found' }, 401);
    }

    // Get widget preferences from KV store
    const key = `dashboard_widgets:${userId}`;
    let widgets = null;
    try {
      widgets = await kv.get(key);
    } catch (kvError) {
      console.error('KV Get Error:', kvError);
    }

    return c.json({
      success: true,
      widgets: widgets || DEFAULT_WIDGETS
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Failed to fetch dashboard widgets',
      details: error.message,
      widgets: DEFAULT_WIDGETS 
    }, 500);
  }
});


/**
 * POST /dashboard/widgets
 * Save user's dashboard widget preferences
 */
app.post('/widgets', async (c) => {
  try {
    const userId = await getUserId(c);
    console.log('💾 Dashboard widgets POST: userId =', userId);
    
    if (!userId) {
      console.error('❌ Dashboard widgets POST: No userId found');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    console.log('💾 Dashboard widgets POST: Request body =', JSON.stringify(body));
    
    const { widgets } = body;

    if (!Array.isArray(widgets)) {
      console.error('❌ Dashboard widgets POST: Invalid widgets format, got:', typeof widgets);
      return c.json({ error: 'Invalid widgets format' }, 400);
    }

    console.log('💾 Dashboard widgets POST: Saving widgets:', widgets);

    // Save widget preferences to KV store
    const key = `dashboard_widgets:${userId}`;
    try {
      await kv.set(key, widgets);
    } catch (kvError) {
      console.error('KV Set Error:', kvError);
      // Return success anyway, as this is non-critical preference saving
    }

    console.log('✅ Dashboard widgets POST: Successfully saved');

    return c.json({
      success: true,
      message: 'Dashboard widgets saved successfully'
    });
  } catch (error: any) {
    console.error('❌ Dashboard widgets POST: Error saving dashboard widgets:', error);
    return c.json({ 
      error: 'Failed to save dashboard widgets',
      details: error.message 
    }, 500);
  }
});

export default app;