import { Hono } from 'jsr:@hono/hono@4';
import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

export const dreamBoardRoutes = new Hono();

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

async function verifyUser(authHeader: string | undefined) {
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

interface Dream {
  id: string;
  title: string;
  description: string;
  targetAmount?: number;
  category: 'financial' | 'lifestyle' | 'career' | 'personal' | 'travel' | 'family';
  targetDate?: string;
  priority: 'low' | 'medium' | 'high';
  imageUrl?: string;
  progress: number; // 0-100
  isCompleted: boolean;
  createdAt: string;
  userId: string;
  businessId?: string;
}

// Get all dreams for a user
dreamBoardRoutes.get('/dreams', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const authUserId = await verifyUser(authHeader);
    
    if (!authUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.query('userId');
    const businessId = c.req.query('businessId');

    // Security check: ensure auth user matches requested user
    if (userId && userId !== authUserId) {
      return c.json({ error: 'Unauthorized access to user data' }, 403);
    }

    // Use auth user if query param missing
    const targetUserId = userId || authUserId;

    console.log('🎯 Dream Board: Getting dreams for user:', targetUserId, 'business:', businessId);

    // Get dreams list key
    const dreamsKey = businessId ? `dreams:${targetUserId}:${businessId}` : `dreams:${targetUserId}`;
    const dreamIds = await kv.get(dreamsKey) || [];
    
    console.log('🎯 Dream Board: Found dream IDs:', dreamIds);

    if (!Array.isArray(dreamIds) || dreamIds.length === 0) {
      return c.json({ dreams: [], success: true });
    }

    // Get individual dreams
    const dreamKeys = dreamIds.map(id => `dream:${id}`);
    const dreams = await kv.mget(dreamKeys);
    
    console.log('🎯 Dream Board: Retrieved dreams:', dreams?.length || 0);

    // Filter out null values and ensure proper structure
    const validDreams = dreams?.filter(dream => dream !== null) || [];

    return c.json({ 
      dreams: validDreams,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error getting dreams:', error);
    return c.json({ 
      error: 'Failed to get dreams',
      details: error.message
    }, 500);
  }
});

// Create a new dream
dreamBoardRoutes.post('/dreams', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const authUserId = await verifyUser(authHeader);
    
    if (!authUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { userId, businessId, title, description, targetAmount, category, targetDate, priority, imageUrl } = body;

    if (!userId || !title) {
      return c.json({ error: 'User ID and title are required' }, 400);
    }

    // Security check
    if (userId !== authUserId) {
      return c.json({ error: 'Unauthorized operation' }, 403);
    }

    console.log('🎯 Dream Board: Creating dream for user:', userId, 'business:', businessId);

    // Create new dream
    const dreamId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const dream: Dream = {
      id: dreamId,
      title,
      description: description || '',
      targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
      category,
      targetDate: targetDate || undefined,
      priority: priority || 'medium',
      imageUrl: imageUrl || '',
      progress: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      userId,
      businessId: businessId || undefined
    };

    // Save individual dream
    await kv.set(`dream:${dreamId}`, dream);

    // Update dreams list
    const dreamsKey = businessId ? `dreams:${userId}:${businessId}` : `dreams:${userId}`;
    const existingDreamIds = await kv.get(dreamsKey) || [];
    const updatedDreamIds = Array.isArray(existingDreamIds) ? [...existingDreamIds, dreamId] : [dreamId];
    await kv.set(dreamsKey, updatedDreamIds);

    console.log('🎯 Dream Board: Created dream:', dreamId);

    return c.json({ 
      dream,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error creating dream:', error);
    return c.json({ 
      error: 'Failed to create dream',
      details: error.message
    }, 500);
  }
});

// Update a dream
dreamBoardRoutes.put('/dreams/:dreamId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const authUserId = await verifyUser(authHeader);
    
    if (!authUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dreamId = c.req.param('dreamId');
    const body = await c.req.json();

    console.log('🎯 Dream Board: Updating dream:', dreamId);

    // Get existing dream
    const existingDream = await kv.get(`dream:${dreamId}`);
    if (!existingDream) {
      return c.json({ error: 'Dream not found' }, 404);
    }
    
    // Security check
    if (existingDream.userId !== authUserId) {
      return c.json({ error: 'Unauthorized operation' }, 403);
    }

    // Update dream
    const updatedDream = {
      ...existingDream,
      ...body,
      id: dreamId, // Ensure ID doesn't get overwritten
      updatedAt: new Date().toISOString()
    };

    await kv.set(`dream:${dreamId}`, updatedDream);

    console.log('🎯 Dream Board: Updated dream:', dreamId);

    return c.json({ 
      dream: updatedDream,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error updating dream:', error);
    return c.json({ 
      error: 'Failed to update dream',
      details: error.message
    }, 500);
  }
});

// Delete a dream
dreamBoardRoutes.delete('/dreams/:dreamId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const authUserId = await verifyUser(authHeader);
    
    if (!authUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const dreamId = c.req.param('dreamId');
    const userId = c.req.query('userId');
    const businessId = c.req.query('businessId');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }
    
    // Security check
    if (userId !== authUserId) {
      return c.json({ error: 'Unauthorized operation' }, 403);
    }

    console.log('🎯 Dream Board: Deleting dream:', dreamId);

    // Get existing dream to verify ownership
    const existingDream = await kv.get(`dream:${dreamId}`);
    if (!existingDream) {
      return c.json({ error: 'Dream not found' }, 404);
    }

    if (existingDream.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Remove from dreams list
    const dreamsKey = businessId ? `dreams:${userId}:${businessId}` : `dreams:${userId}`;
    const existingDreamIds = await kv.get(dreamsKey) || [];
    const updatedDreamIds = Array.isArray(existingDreamIds) 
      ? existingDreamIds.filter(id => id !== dreamId) 
      : [];
    await kv.set(dreamsKey, updatedDreamIds);

    // Delete individual dream
    await kv.del(`dream:${dreamId}`);

    // Check if this was the #1 goal and clear it if so
    const numberOneGoalKey = `user_number_one_goal:${userId}`;
    const currentNumberOneGoal = await kv.get(numberOneGoalKey);
    if (currentNumberOneGoal === dreamId) {
      await kv.del(numberOneGoalKey);
    }

    console.log('🎯 Dream Board: Deleted dream:', dreamId);

    return c.json({ 
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error deleting dream:', error);
    return c.json({ 
      error: 'Failed to delete dream',
      details: error.message
    }, 500);
  }
});

// Get #1 goal for user
dreamBoardRoutes.get('/number-one-goal', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const authUserId = await verifyUser(authHeader);
    
    if (!authUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.query('userId');
    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    // Security check
    if (userId !== authUserId) {
      return c.json({ error: 'Unauthorized access' }, 403);
    }

    console.log('🎯 Dream Board: Getting #1 goal for user:', userId);

    const numberOneGoalKey = `user_number_one_goal:${userId}`;
    const goalId = await kv.get(numberOneGoalKey);

    return c.json({ 
      goalId,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error getting #1 goal:', error);
    return c.json({ 
      error: 'Failed to get #1 goal',
      details: error.message
    }, 500);
  }
});

// Set #1 goal for user
dreamBoardRoutes.post('/number-one-goal', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const authUserId = await verifyUser(authHeader);
    
    if (!authUserId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { userId, dreamId } = body;

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    // Security check
    if (userId !== authUserId) {
      return c.json({ error: 'Unauthorized operation' }, 403);
    }

    console.log('🎯 Dream Board: Setting #1 goal for user:', userId, 'dream:', dreamId);

    const numberOneGoalKey = `user_number_one_goal:${userId}`;
    
    if (dreamId) {
      // Verify dream exists and belongs to user
      const dream = await kv.get(`dream:${dreamId}`);
      if (!dream || dream.userId !== userId) {
        return c.json({ error: 'Dream not found or unauthorized' }, 404);
      }
      await kv.set(numberOneGoalKey, dreamId);
    } else {
      // Clear #1 goal
      await kv.del(numberOneGoalKey);
    }

    return c.json({ 
      goalId: dreamId,
      success: true 
    });

  } catch (error: any) {
    console.error('🎯 Dream Board: Error setting #1 goal:', error);
    return c.json({ 
      error: 'Failed to set #1 goal',
      details: error.message
    }, 500);
  }
});

console.log('🎯 Dream Board endpoints loaded');
