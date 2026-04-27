import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import * as kv from './kv_store.tsx';

const streakApp = new Hono();

// Environment variables - throw if not set
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables for Streak endpoints');
}

// Create Supabase clients - we need BOTH
// Service role for KV store operations  
const supabaseService = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Anon key for user authentication
const supabaseAuth = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Add CORS middleware
streakApp.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

// TEST endpoint to check if environment variables are set
streakApp.get('/test-env', async (c) => {
  return c.json({
    hasUrl: !!Deno.env.get('SUPABASE_URL'),
    hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
    hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    urlLength: (Deno.env.get('SUPABASE_URL') || '').length,
    anonKeyLength: (Deno.env.get('SUPABASE_ANON_KEY') || '').length
  });
});

// Helper function to get current date in CST timezone
function getCST(date?: Date): Date {
  const d = date || new Date();
  // Convert to CST (UTC-6, or UTC-5 during DST)
  // For simplicity, we'll use a fixed UTC-6 offset
  const utcTime = d.getTime();
  const cstOffset = -6 * 60 * 60 * 1000; // CST is UTC-6
  return new Date(utcTime + cstOffset);
}

// Helper function to get date string in CST (YYYY-MM-DD format)
function getCSTDateString(date?: Date): string {
  const cstDate = getCST(date);
  const year = cstDate.getUTCFullYear();
  const month = String(cstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(cstDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to check if two CST date strings are consecutive
function areDatesConsecutive(dateStr1: string, dateStr2: string): boolean {
  const date1 = new Date(dateStr1 + 'T00:00:00Z');
  const date2 = new Date(dateStr2 + 'T00:00:00Z');
  const diffTime = date2.getTime() - date1.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

function isSameDay(dateStr1: string, dateStr2: string): boolean {
  return dateStr1 === dateStr2;
}

// GET /get - Get user's current streak
streakApp.get('/get', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    // Check if token is Anon Key or has anon role
    if (accessToken === SUPABASE_ANON_KEY) {
      console.log('🔥 Streak: Anonymous token provided, returning empty data');
      return c.json({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalActiveDays: 0,
        lastAnimationDate: null
      });
    }

    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role === 'anon') {
           console.log('🔥 Streak: Anonymous role token provided, returning empty data');
           return c.json({
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            totalActiveDays: 0,
            lastAnimationDate: null
          });
        }
      }
    } catch (e) {
      // Ignore decode errors
    }

    // Use service role to validate the token - more reliable than checking session
    try {
      const { data: { user }, error } = await supabaseService.auth.getUser(accessToken);
      
      if (error) {
        console.error('🔥 Streak Auth Error:', error.message);
        // Return empty streak data instead of 401 for better UX
        return c.json({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          totalActiveDays: 0,
          lastAnimationDate: null
        });
      }
      
      if (!user) {
        console.error('🔥 Streak: No user returned from auth');
        return c.json({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          totalActiveDays: 0,
          lastAnimationDate: null
        });
      }

      const userId = user.id;
      const streakKey = `streak:${userId}`;
      const todayCST = getCSTDateString();
      
      // Get existing streak data
      const existingData = await kv.get(streakKey);
      
      if (!existingData) {
        // No streak data yet
        return c.json({
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          totalActiveDays: 0,
          lastAnimationDate: null
        });
      }

      const streakData = JSON.parse(existingData);
      const lastActivityDateCST = streakData.lastActivityDate;

      // Check if streak should be reset (missed yesterday)
      if (lastActivityDateCST && !isSameDay(lastActivityDateCST, todayCST)) {
        const yesterday = getCSTDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
        
        if (!isSameDay(lastActivityDateCST, yesterday)) {
          // Streak broken - reset to 0
          const updatedData = {
            ...streakData,
            currentStreak: 0,
            lastActivityDate: streakData.lastActivityDate // Keep for reference
          };
          
          await kv.set(streakKey, JSON.stringify(updatedData));
          
          return c.json({
            currentStreak: 0,
            longestStreak: streakData.longestStreak || 0,
            lastActivityDate: streakData.lastActivityDate,
            totalActiveDays: streakData.totalActiveDays || 0,
            lastAnimationDate: streakData.lastAnimationDate || null
          });
        }
      }

      return c.json({
        currentStreak: streakData.currentStreak || 0,
        longestStreak: streakData.longestStreak || 0,
        lastActivityDate: streakData.lastActivityDate,
        totalActiveDays: streakData.totalActiveDays || 0,
        lastAnimationDate: streakData.lastAnimationDate || null
      });

    } catch (error) {
      return c.json({ error: 'Failed to get streak', details: error.message }, 500);
    }
  } catch (error) {
    return c.json({ error: 'Failed to get streak', details: error.message }, 500);
  }
});

// POST /record - Record activity and update streak
streakApp.post('/record', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    // Check if token is Anon Key or has anon role
    if (accessToken === SUPABASE_ANON_KEY) {
       console.log('🔥 Streak Record: Anonymous token provided, skipping update');
       return c.json({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalActiveDays: 0,
        lastAnimationDate: null,
        shouldShowAnimation: false
      });
    }

    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role === 'anon') {
           console.log('🔥 Streak Record: Anonymous role token provided, skipping update');
           return c.json({
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            totalActiveDays: 0,
            lastAnimationDate: null,
            shouldShowAnimation: false
          });
        }
      }
    } catch (e) {
      // Ignore decode errors
    }

    // Use service role to validate the token - more reliable than checking session
    const { data: { user }, error } = await supabaseService.auth.getUser(accessToken);
    if (!user || error) {
      console.error('🔥 Streak Record Auth Error:', error?.message);
      // Return current streak data without updating instead of 401
      return c.json({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalActiveDays: 0,
        lastAnimationDate: null,
        shouldShowAnimation: false
      });
    }

    const userId = user.id;
    const { activityType } = await c.req.json();
    
    const streakKey = `streak:${userId}`;
    const todayCST = getCSTDateString();

    // Get existing streak data
    const existingData = await kv.get(streakKey);
    
    let streakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: todayCST,
      totalActiveDays: 0,
      lastAnimationDate: null as string | null,
      activities: [] as Array<{ type: string; date: string }>
    };

    let shouldShowAnimation = false;

    if (existingData) {
      streakData = JSON.parse(existingData);
      const lastActivityDateCST = streakData.lastActivityDate;

      // Check if this is the first activity of the day (CST)
      if (isSameDay(lastActivityDateCST, todayCST)) {
        // Same day - just add the activity, don't increment streak
        streakData.activities.push({ type: activityType, date: todayCST });
        await kv.set(streakKey, JSON.stringify(streakData));
        
        // Don't show animation - already recorded today
        return c.json({
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          lastActivityDate: streakData.lastActivityDate,
          totalActiveDays: streakData.totalActiveDays,
          lastAnimationDate: streakData.lastAnimationDate,
          shouldShowAnimation: false
        });
      }

      // Different day - check if consecutive
      if (areDatesConsecutive(lastActivityDateCST, todayCST)) {
        // Consecutive day! Increment streak
        streakData.currentStreak += 1;
        streakData.totalActiveDays += 1;
        shouldShowAnimation = true;
      } else {
        // Gap in days - reset streak to 1
        streakData.currentStreak = 1;
        streakData.totalActiveDays += 1;
        shouldShowAnimation = true;
      }

      // Update longest streak if needed
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak;
      }

      streakData.lastActivityDate = todayCST;
      
      // Update last animation date if we should show animation
      if (shouldShowAnimation) {
        streakData.lastAnimationDate = todayCST;
      }
      
      streakData.activities.push({ type: activityType, date: todayCST });

      // Keep only last 30 days of activities
      if (streakData.activities.length > 30) {
        streakData.activities = streakData.activities.slice(-30);
      }

    } else {
      // First activity ever
      streakData.currentStreak = 1;
      streakData.longestStreak = 1;
      streakData.totalActiveDays = 1;
      streakData.lastActivityDate = todayCST;
      streakData.lastAnimationDate = todayCST;
      streakData.activities = [{ type: activityType, date: todayCST }];
      shouldShowAnimation = true;
    }

    await kv.set(streakKey, JSON.stringify(streakData));

    return c.json({
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      lastActivityDate: streakData.lastActivityDate,
      totalActiveDays: streakData.totalActiveDays,
      lastAnimationDate: streakData.lastAnimationDate,
      shouldShowAnimation: shouldShowAnimation
    });

  } catch (error) {
    return c.json({ error: 'Failed to record activity', details: error.message }, 500);
  }
});

export default streakApp;