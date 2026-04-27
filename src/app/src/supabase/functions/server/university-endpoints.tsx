import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Initialize Supabase clients - separate for auth validation vs admin operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Helper function to get user from auth token
async function getUserFromAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  console.log('🎓 AUTH: Authorization header present:', !!authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('🎓 AUTH: No Bearer token found');
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  console.log('🎓 AUTH: Token extracted, length:', token?.length);
  
  try {
    // Use the anon key client for user token validation
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error) {
      console.log('🎓 AUTH: Error getting user:', error.message);
      return null;
    }
    
    if (!user) {
      console.log('🎓 AUTH: No user found for token');
      return null;
    }
    
    console.log('🎓 AUTH: User found:', user.email);
    return user;
  } catch (err) {
    console.error('🎓 AUTH: Exception in getUserFromAuth:', err);
    return null;
  }
}

// Analytics helper
async function trackEvent(userId: string, event: string, data: any = {}) {
  try {
    await kv.set(`analytics:${userId}:${Date.now()}`, {
      event,
      data,
      timestamp: new Date().toISOString(),
      userId
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Get all tracks
app.get('/tracks', async (c) => {
  try {
    console.log('🎓 ENDPOINTS: /tracks request received');
    
    const tracks = await kv.getByPrefix('university:track:');
    console.log('🎓 ENDPOINTS: Raw tracks from KV:', tracks.length, 'items');
    
    // Check if we have valid track data
    const validTracks = tracks.filter(track => track.value && track.value.id && track.value.title);
    console.log('🎓 ENDPOINTS: Valid tracks found:', validTracks.length);
    
    // If no valid tracks exist, try to auto-seed
    if (validTracks.length === 0) {
      console.log('🎓 ENDPOINTS: No valid tracks found, attempting auto-seed...');
      
      try {
        const { seedUniversityData } = await import('./university-data-seeder-final.tsx');
        const seedResult = await seedUniversityData();
        
        if (seedResult.success) {
          console.log('🎓 ENDPOINTS: ✅ Auto-seed successful, refetching tracks...');
          
          // Refetch tracks after seeding
          const newTracks = await kv.getByPrefix('university:track:');
          const newValidTracks = newTracks.filter(track => track.value && track.value.id && track.value.title);
          
          if (newValidTracks.length > 0) {
            const trackData = newValidTracks.map(track => track.value).sort((a, b) => a.order_index - b.order_index);
            console.log('🎓 ENDPOINTS: ✅ Auto-seeded and returning', trackData.length, 'tracks');
            
            return c.json({ 
              tracks: trackData,
              autoSeeded: true,
              message: 'University data was automatically seeded'
            });
          }
        } else {
          console.error('🎓 ENDPOINTS: Auto-seed failed:', seedResult.error);
        }
      } catch (seedError) {
        console.error('🎓 ENDPOINTS: Auto-seed error:', seedError);
      }
    }
    
    // Log the raw track data for debugging
    tracks.forEach((track, index) => {
      console.log(`🎓 ENDPOINTS: Raw track ${index}:`, {
        key: track.key,
        hasValue: !!track.value,
        valueKeys: track.value ? Object.keys(track.value) : 'no value'
      });
    });
    
    const trackData = tracks.map(track => track.value).sort((a, b) => a.order_index - b.order_index);
    console.log('🎓 ENDPOINTS: Processed track data:', trackData.length, 'tracks');
    
    // Log each processed track
    trackData.forEach((track, index) => {
      console.log(`🎓 ENDPOINTS: Processed track ${index}:`, {
        id: track?.id,
        title: track?.title,
        category: track?.category,
        tutorial_count: track?.tutorial_count,
        estimated_hours: track?.estimated_hours,
        order_index: track?.order_index
      });
    });
    
    const response = { tracks: trackData };
    console.log('🎓 ENDPOINTS: ✅ Returning response with', trackData.length, 'tracks');
    
    return c.json(response);
  } catch (error) {
    console.error('🎓 ENDPOINTS: ❌ Error in /tracks:', error);
    return c.json({ error: 'Failed to fetch tracks', details: error.message }, 500);
  }
});

// Get track by slug with tutorials
app.get('/track/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const user = await getUserFromAuth(c.req.raw);
    
    const track = await kv.get(`university:track:${slug}`);
    if (!track) {
      return c.json({ error: 'Track not found' }, 404);
    }
    
    // Get tutorials for this track
    const allTutorials = await kv.getByPrefix('university:tutorial:');
    const trackTutorials = allTutorials
      .map(t => t.value)
      .filter(t => t.track_slug === slug)
      .sort((a, b) => a.order_index - b.order_index);
    
    // Get user progress if authenticated
    let userProgress = {};
    if (user) {
      const progressData = await kv.getByPrefix(`university:progress:${user.id}:`);
      userProgress = progressData.reduce((acc, p) => {
        const tutorialSlug = p.key.split(':').pop();
        acc[tutorialSlug] = p.value;
        return acc;
      }, {});
      
      // Track event
      await trackEvent(user.id, 'track_viewed', { track_slug: slug });
    }
    
    return c.json({ 
      track: track,
      tutorials: trackTutorials,
      userProgress
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch track' }, 500);
  }
});

// Get tutorial by slug
app.get('/tutorial/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const user = await getUserFromAuth(c.req.raw);
    
    const tutorial = await kv.get(`university:tutorial:${slug}`);
    if (!tutorial) {
      return c.json({ error: 'Tutorial not found' }, 404);
    }
    
    // Get tutorial content (lessons)
    const lessons = await kv.getByPrefix(`university:lesson:${slug}:`);
    const lessonData = lessons
      .map(l => l.value)
      .sort((a, b) => a.order_index - b.order_index);
    
    // Get tutorial assets
    const assets = await kv.getByPrefix(`university:asset:${slug}:`);
    const assetData = assets.map(a => a.value);
    
    // Get user progress if authenticated
    let userProgress = null;
    let isBookmarked = false;
    if (user) {
      userProgress = await kv.get(`university:progress:${user.id}:${slug}`);
      const bookmark = await kv.get(`university:bookmark:${user.id}:${slug}`);
      isBookmarked = !!bookmark;
      
      // Track event
      await trackEvent(user.id, 'tutorial_viewed', { tutorial_slug: slug });
    }
    
    return c.json({
      tutorial,
      lessons: lessonData,
      assets: assetData,
      userProgress,
      isBookmarked
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch tutorial' }, 500);
  }
});

// Search tutorials and tracks
app.get('/search', async (c) => {
  try {
    console.log('🔍 SEARCH: Search endpoint called');
    const query = c.req.query('q') || '';
    const category = c.req.query('category') || '';
    const difficulty = c.req.query('difficulty') || '';
    const hasTemplates = c.req.query('hasTemplates') === 'true';
    const user = await getUserFromAuth(c.req.raw);
    
    console.log('🔍 SEARCH: Search params:', { query, category, difficulty, hasTemplates });
    
    // Get all tutorials and tracks for search
    const [tutorials, tracks] = await Promise.all([
      kv.getByPrefix('university:tutorial:'),
      kv.getByPrefix('university:track:')
    ]);
    
    console.log('🔍 SEARCH: Retrieved data:', {
      tutorialsCount: tutorials.length,
      tracksCount: tracks.length
    });
    
    let results = [];
    
    // Search tutorials with comprehensive null protection
    const tutorialResults = tutorials
      .map(t => t.value)
      .filter(tutorial => {
        // Comprehensive null protection
        if (!tutorial || typeof tutorial !== 'object') {
          console.warn('🔍 SEARCH: Invalid tutorial found:', tutorial);
          return false;
        }
        
        // Ensure required fields exist
        if (!tutorial.id || !tutorial.title) {
          console.warn('🔍 SEARCH: Tutorial missing required fields:', tutorial);
          return false;
        }
        
        try {
          const safeTitle = tutorial.title || '';
          const safeSummary = tutorial.summary || '';
          const safeTags = Array.isArray(tutorial.tags) ? tutorial.tags : [];
          const safeCategory = tutorial.category || '';
          const safeDifficulty = tutorial.difficulty || '';
          const safeAssets = Array.isArray(tutorial.assets) ? tutorial.assets : [];
          
          const matchesQuery = !query || 
            safeTitle.toLowerCase().includes(query.toLowerCase()) ||
            safeSummary.toLowerCase().includes(query.toLowerCase()) ||
            safeTags.some(tag => tag && typeof tag === 'string' && tag.toLowerCase().includes(query.toLowerCase()));
          
          const matchesCategory = !category || safeCategory === category;
          const matchesDifficulty = !difficulty || safeDifficulty === difficulty;
          const matchesTemplates = !hasTemplates || safeAssets.length > 0;
          
          return matchesQuery && matchesCategory && matchesDifficulty && matchesTemplates;
        } catch (filterError) {
          console.error('🔍 SEARCH: Error filtering tutorial:', filterError, tutorial);
          return false;
        }
      })
      .map(tutorial => {
        try {
          return {
            ...tutorial,
            type: 'tutorial',
            // Ensure safe values for required fields
            title: tutorial.title || 'Untitled Tutorial',
            summary: tutorial.summary || 'No description available',
            category: tutorial.category || 'General',
            difficulty: tutorial.difficulty || 'Beginner',
            tags: Array.isArray(tutorial.tags) ? tutorial.tags : [],
            est_minutes: typeof tutorial.est_minutes === 'number' ? tutorial.est_minutes : 0
          };
        } catch (mapError) {
          console.error('🔍 SEARCH: Error mapping tutorial:', mapError, tutorial);
          return null;
        }
      })
      .filter(Boolean); // Remove any null results
    
    // Search tracks with comprehensive null protection
    const trackResults = tracks
      .map(t => t.value)
      .filter(track => {
        // Comprehensive null protection
        if (!track || typeof track !== 'object') {
          console.warn('🔍 SEARCH: Invalid track found:', track);
          return false;
        }
        
        // Ensure required fields exist
        if (!track.id || !track.title) {
          console.warn('🔍 SEARCH: Track missing required fields:', track);
          return false;
        }
        
        try {
          const safeTitle = track.title || '';
          const safeSummary = track.summary || '';
          const safeCategory = track.category || '';
          
          const matchesQuery = !query || 
            safeTitle.toLowerCase().includes(query.toLowerCase()) ||
            safeSummary.toLowerCase().includes(query.toLowerCase());
          
          const matchesCategory = !category || safeCategory === category;
          
          return matchesQuery && matchesCategory;
        } catch (filterError) {
          console.error('🔍 SEARCH: Error filtering track:', filterError, track);
          return false;
        }
      })
      .map(track => {
        try {
          return {
            ...track,
            type: 'track',
            // Ensure safe values for required fields
            title: track.title || 'Untitled Track',
            summary: track.summary || 'No description available',
            category: track.category || 'General',
            tutorial_count: typeof track.tutorial_count === 'number' ? track.tutorial_count : 0,
            estimated_hours: typeof track.estimated_hours === 'number' ? track.estimated_hours : 0
          };
        } catch (mapError) {
          console.error('🔍 SEARCH: Error mapping track:', mapError, track);
          return null;
        }
      })
      .filter(Boolean); // Remove any null results
    
    results = [...tutorialResults, ...trackResults];
    
    console.log('🔍 SEARCH: Search completed:', {
      tutorialResults: tutorialResults.length,
      trackResults: trackResults.length,
      totalResults: results.length
    });
    
    // Track search if user is authenticated
    if (user && query) {
      try {
        await trackEvent(user.id, 'search_performed', { query, category, difficulty, hasTemplates });
      } catch (trackError) {
        console.warn('🔍 SEARCH: Failed to track search event:', trackError);
        // Don't fail the search if tracking fails
      }
    }
    
    return c.json({ results });
  } catch (error) {
    console.error('🔍 SEARCH: Search endpoint error:', error);
    return c.json({ 
      error: 'Failed to perform search', 
      details: error.message,
      results: [] // Always return empty results array on error
    }, 500);
  }
});

// Update user progress
app.post('/progress/:tutorialSlug', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const tutorialSlug = c.req.param('tutorialSlug');
    const body = await c.req.json();
    const { completed, percent, lastStepIndex } = body;
    
    const progressKey = `university:progress:${user.id}:${tutorialSlug}`;
    const progressData = {
      tutorial_slug: tutorialSlug,
      completed: completed || false,
      percent: percent || 0,
      last_step_index: lastStepIndex || 0,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(progressKey, progressData);
    
    // Track completion
    if (completed) {
      await trackEvent(user.id, 'tutorial_completed', { tutorial_slug: tutorialSlug });
    }
    
    return c.json({ success: true, progress: progressData });
  } catch (error) {
    return c.json({ error: 'Failed to update progress' }, 500);
  }
});

// Update checklist step
app.post('/checklist/:tutorialSlug/:stepIndex', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const tutorialSlug = c.req.param('tutorialSlug');
    const stepIndex = parseInt(c.req.param('stepIndex'));
    const body = await c.req.json();
    const { checked } = body;
    
    const checklistKey = `university:checklist:${user.id}:${tutorialSlug}`;
    let checklist = await kv.get(checklistKey) || { steps: {} };
    
    checklist.steps[stepIndex] = {
      checked,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(checklistKey, checklist);
    
    // Track event
    await trackEvent(user.id, 'checklist_checked', { 
      tutorial_slug: tutorialSlug, 
      step_index: stepIndex,
      checked 
    });
    
    return c.json({ success: true, checklist });
  } catch (error) {
    return c.json({ error: 'Failed to update checklist' }, 500);
  }
});

// Toggle bookmark
app.post('/bookmark/:tutorialSlug', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const tutorialSlug = c.req.param('tutorialSlug');
    const bookmarkKey = `university:bookmark:${user.id}:${tutorialSlug}`;
    
    const existing = await kv.get(bookmarkKey);
    
    if (existing) {
      // Remove bookmark
      await kv.del(bookmarkKey);
      return c.json({ success: true, bookmarked: false });
    } else {
      // Add bookmark
      await kv.set(bookmarkKey, {
        tutorial_slug: tutorialSlug,
        created_at: new Date().toISOString()
      });
      return c.json({ success: true, bookmarked: true });
    }
  } catch (error) {
    return c.json({ error: 'Failed to toggle bookmark' }, 500);
  }
});

// Get user's bookmarks
app.get('/bookmarks', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const bookmarks = await kv.getByPrefix(`university:bookmark:${user.id}:`);
    const bookmarkData = bookmarks.map(b => b.value);
    
    return c.json({ bookmarks: bookmarkData });
  } catch (error) {
    return c.json({ error: 'Failed to fetch bookmarks' }, 500);
  }
});

// Get user's progress summary
app.get('/progress', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const progress = await kv.getByPrefix(`university:progress:${user.id}:`);
    const progressData = progress.map(p => p.value);
    
    return c.json({ progress: progressData });
  } catch (error) {
    return c.json({ error: 'Failed to fetch progress' }, 500);
  }
});

// Track resource download
app.post('/download/:assetId', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    const assetId = c.req.param('assetId');
    
    if (user) {
      await trackEvent(user.id, 'resource_download', { asset_id: assetId });
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to track download' }, 500);
  }
});

// Helper function to check admin status
function isAdminEmail(email: string): boolean {
  const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
  return adminEmails.includes(email);
}

// Helper function to check if University data exists
async function checkUniversityDataExists() {
  try {
    const tracks = await kv.getByPrefix('university:track:');
    const validTracks = tracks.filter(track => track.value && track.value.id && track.value.title);
    return validTracks.length > 0;
  } catch (error) {
    console.error('🎓 UNIVERSITY ENDPOINTS: Error checking data existence:', error);
    return false;
  }
}

// Auto-seed endpoint - accessible to all authenticated users
app.post('/auto-seed', async (c) => {
  try {
    console.log('🎓 UNIVERSITY ENDPOINTS: Auto-seed request received');
    
    const user = await getUserFromAuth(c.req.raw);
    console.log('🎓 UNIVERSITY ENDPOINTS: User from auth:', user ? user.email : 'none');
    
    if (!user) {
      console.log('🎓 UNIVERSITY ENDPOINTS: No user authenticated');
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    // Check if data already exists
    const dataExists = await checkUniversityDataExists();
    if (dataExists) {
      console.log('🎓 UNIVERSITY ENDPOINTS: Data already exists, skipping seed');
      return c.json({ 
        success: true, 
        message: 'University data already exists - no seeding needed',
        alreadySeeded: true 
      });
    }
    
    console.log('🎓 UNIVERSITY ENDPOINTS: No data found, seeding for user:', user.email);
    
    // Import seeding functions
    const { seedUniversityData } = await import('./university-data-seeder-final.tsx');
    const result = await seedUniversityData();
    
    console.log('🎓 UNIVERSITY ENDPOINTS: Auto-seeding completed:', result.success ? 'success' : 'failed');
    
    if (result.success) {
      console.log('🎓 UNIVERSITY ENDPOINTS: ✅ University data auto-seeded successfully');
    } else {
      console.error('🎓 UNIVERSITY ENDPOINTS: ❌ University auto-seeding failed:', result.error);
    }
    
    return c.json(result);
  } catch (error) {
    console.error('🎓 UNIVERSITY ENDPOINTS: Auto-seed error:', error);
    return c.json({ error: 'Failed to auto-seed data', details: error.message }, 500);
  }
});

// Track completion of a tutorial
app.post('/track-completion', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { tutorialId, trackId } = await c.req.json();
    
    if (!tutorialId || !trackId) {
      return c.json({ error: 'tutorialId and trackId are required' }, 400);
    }

    const completionKey = `university:completion:${user.id}:${trackId}:${tutorialId}`;
    const trackProgressKey = `university:track-progress:${user.id}:${trackId}`;
    
    // Mark tutorial as completed
    await kv.set(completionKey, {
      userId: user.id,
      trackId,
      tutorialId,
      completedAt: new Date().toISOString()
    });

    // Update track progress
    const existingProgress = await kv.get(trackProgressKey);
    let progressData = existingProgress ? JSON.parse(existingProgress) : {
      userId: user.id,
      trackId,
      completedTutorials: [],
      totalTutorials: 0,
      allCompleted: false
    };

    // Set total tutorials for registering-business track
    if (trackId === 'registering-business' && progressData.totalTutorials === 0) {
      progressData.totalTutorials = 13; // 7 steps + 6 resources
    }

    // Add tutorial to completed list if not already there (skip 'init' marker)
    if (tutorialId !== 'init' && !progressData.completedTutorials.includes(tutorialId)) {
      progressData.completedTutorials.push(tutorialId);
    }

    // Check if all tutorials are completed
    if (progressData.totalTutorials > 0) {
      progressData.allCompleted = progressData.completedTutorials.length >= progressData.totalTutorials;
    }

    await kv.set(trackProgressKey, JSON.stringify(progressData));

    console.log('🎓 Tutorial completion tracked:', { userId: user.id, trackId, tutorialId });

    return c.json({
      success: true,
      progress: progressData
    });
  } catch (error) {
    console.error('🎓 Track completion error:', error);
    return c.json({ error: 'Failed to track completion', details: error.message }, 500);
  }
});

// Award quiz badge
app.post('/award-badge', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { trackId, badgeType, score } = await c.req.json();
    
    if (!trackId || !badgeType) {
      return c.json({ error: 'trackId and badgeType are required' }, 400);
    }

    const badgeKey = `university:badge:${user.id}:${trackId}`;
    
    // Store badge data
    await kv.set(badgeKey, {
      userId: user.id,
      trackId,
      badgeType,
      score,
      earnedAt: new Date().toISOString()
    });

    console.log('🏆 Badge awarded:', { userId: user.id, trackId, badgeType, score });

    return c.json({
      success: true,
      badge: { trackId, badgeType, score }
    });
  } catch (error) {
    console.error('🏆 Award badge error:', error);
    return c.json({ error: 'Failed to award badge', details: error.message }, 500);
  }
});

// Get user's track progress (completion + badges)
app.get('/user-track-progress', async (c) => {
  try {
    const user = await getUserFromAuth(c.req.raw);
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Get all track progress
    const progressEntries = await kv.getByPrefix(`university:track-progress:${user.id}:`);
    const badgeEntries = await kv.getByPrefix(`university:badge:${user.id}:`);

    const trackProgress: { [key: string]: any } = {};

    // Process progress data
    for (const entry of progressEntries) {
      if (entry.value && typeof entry.value === 'string') {
        try {
          const data = JSON.parse(entry.value);
          if (data.trackId) {
            trackProgress[data.trackId] = {
              completedTutorials: data.completedTutorials || [],
              totalTutorials: data.totalTutorials || 0,
              allCompleted: data.allCompleted || false
            };
          }
        } catch (e) {
          console.error('Error parsing progress:', e);
        }
      }
    }

    // Process badge data
    for (const entry of badgeEntries) {
      if (entry.value) {
        const badge = typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value;
        if (badge.trackId) {
          if (!trackProgress[badge.trackId]) {
            trackProgress[badge.trackId] = {
              completedTutorials: [],
              totalTutorials: 0,
              allCompleted: false
            };
          }
          trackProgress[badge.trackId].badge = {
            type: badge.badgeType,
            score: badge.score,
            earnedAt: badge.earnedAt
          };
        }
      }
    }

    console.log('🎓 User track progress fetched:', { userId: user.id, trackCount: Object.keys(trackProgress).length });

    return c.json({
      progress: trackProgress
    });
  } catch (error) {
    console.error('🎓 Get track progress error:', error);
    return c.json({ error: 'Failed to get track progress', details: error.message }, 500);
  }
});

// Admin: Seed initial data (kept for admin override)
app.post('/admin/seed', async (c) => {
  try {
    console.log('🎓 UNIVERSITY ENDPOINTS: Admin seed request received');
    
    const user = await getUserFromAuth(c.req.raw);
    console.log('🎓 UNIVERSITY ENDPOINTS: User from auth:', user ? user.email : 'none');
    
    if (!user) {
      console.log('🎓 UNIVERSITY ENDPOINTS: No user authenticated');
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    if (!isAdminEmail(user.email)) {
      console.log('🎓 UNIVERSITY ENDPOINTS: User not admin. Expected admin email, Got:', user.email);
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    console.log('🎓 UNIVERSITY ENDPOINTS: ✅ Admin access granted, seeding data...');
    
    // Import seeding functions
    const { seedUniversityData } = await import('./university-data-seeder-final.tsx');
    const result = await seedUniversityData();
    
    console.log('🎓 UNIVERSITY ENDPOINTS: Seeding completed:', result.success ? 'success' : 'failed');
    
    if (result.success) {
      console.log('🎓 UNIVERSITY ENDPOINTS: ✅ University data seeded successfully');
    } else {
      console.error('🎓 UNIVERSITY ENDPOINTS: ❌ University seeding failed:', result.error);
    }
    
    return c.json(result);
  } catch (error) {
    console.error('🎓 UNIVERSITY ENDPOINTS: Seed error:', error);
    return c.json({ error: 'Failed to seed data', details: error.message }, 500);
  }
});

export { app as universityRoutes };