/**
 * Organization/Account Management Endpoints
 * Handles multi-account switching, notifications, and organization membership
 * Version: 1.0
 */

import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx'; // Use cached version

const orgRouter = new Hono();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Helper function: Retry auth requests with exponential backoff
 */
async function retryAuthRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 8,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      const errorMessage = error?.message || String(error);
      const errorStatus = error?.status || error?.code;
      
      // Check if it's a JSON parse error (HTML response instead of JSON)
      const isJsonError = errorMessage.includes('is not valid JSON') || 
                          errorMessage.includes('Unexpected token');
      
      // Check if it's a connection error that should be retried
      const shouldRetry = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('503') ||
        errorMessage.includes('502') ||
        errorMessage.includes('500') ||
        errorMessage.includes('504') ||
        errorStatus === 503 ||
        errorStatus === 502 ||
        errorStatus === 500 ||
        errorStatus === 504 ||
        error?.name === 'AuthRetryableFetchError' ||
        (isJsonError && attempt < 3); // Retry JSON errors for first 3 attempts
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const baseDelay = initialDelay * Math.pow(1.5, attempt);
      const jitter = Math.random() * 100; // Add randomness to prevent thundering herd
      const delay = Math.min(baseDelay + jitter, 5000); // Cap at 5 seconds
      
      console.log(`⚠️ Auth request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms...`, {
        errorName: error?.name,
        errorStatus: errorStatus,
        errorMessage: errorMessage?.substring(0, 100)
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

/**
 * Helper: Verify user authentication with JWT fallback
 */
async function verifyUser(authHeader: string | undefined) {
  if (!authHeader) {
    console.error('❌ VerifyUser: No authorization header provided');
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Check if token is the anon key (simple string check)
  if (token === SUPABASE_ANON_KEY) {
    console.error('❌ VerifyUser: Anon key provided instead of user token');
    throw new Error('Authentication failed: Anonymous access not allowed');
  }

  // Check if token looks valid (basic JWT format check)
  if (!token || token.length < 20 || !token.includes('.')) {
    console.error('❌ VerifyUser: Invalid token format:', token?.substring(0, 20) + '...');
    throw new Error('Authentication failed: Invalid token format');
  }

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ VerifyUser: Missing Supabase configuration', {
      hasUrl: !!SUPABASE_URL,
      hasAnonKey: !!SUPABASE_ANON_KEY
    });
    throw new Error('Server configuration error: Missing Supabase credentials');
  }

  // Try to decode JWT locally as fallback if Supabase Auth fails
  const decodeJWT = (jwt: string) => {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (second part)
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const jsonPayload = atob(base64 + padding);
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return null;
    }
  };

  // Create a client instance with ANON key (not service role) for user verification
  // This is more reliable for getUser() calls with user tokens
  const authClient = createClient(
    SUPABASE_URL, 
    SUPABASE_ANON_KEY
  );
  
  try {
    console.log('🔑 VerifyUser: Attempting to verify user with token:', token.substring(0, 20) + '...');
    
    // Get user from Supabase Auth using the token directly with retry logic
    const result = await retryAuthRequest(() => 
      authClient.auth.getUser(token)
    );
    
    const { data: { user }, error } = result;

    if (error) {
      console.error('❌ VerifyUser: Supabase auth.getUser() error:', {
        message: error.message,
        name: error.name,
        status: (error as any).status,
        code: (error as any).code,
        details: JSON.stringify(error)
      });
      
      // Try JWT fallback for retryable errors (504, 503, etc.)
      const errorStatus = (error as any).status;
      if (errorStatus === 504 || errorStatus === 503 || error.name === 'AuthRetryableFetchError') {
        console.log('🔄 VerifyUser: Auth service timeout, attempting JWT fallback...');
        const payload = decodeJWT(token);
        if (payload && payload.sub && payload.role !== 'anon') {
          console.log('✅ VerifyUser: Using JWT fallback for user:', payload.email || payload.sub);
          // Return a minimal user object from JWT
          return {
            id: payload.sub,
            email: payload.email || '',
            user_metadata: payload.user_metadata || {},
            created_at: payload.created_at || new Date().toISOString()
          };
        }
        throw new Error('Service temporarily unavailable: Authentication service timeout (please retry)');
      }
      
      // Check if this is a JSON parse error indicating Supabase is unreachable
      if (error.message?.includes('is not valid JSON') || error.message?.includes('Unexpected token')) {
        throw new Error('Service temporarily unavailable: Unable to reach authentication service');
      }
      
      // Format a readable error message
      const errorDetail = error.message || error.name || errorStatus || 'Unknown error';
      throw new Error(`Authentication failed: ${errorDetail}`);
    }
    
    if (!user) {
      console.error('❌ VerifyUser: No user returned from auth.getUser()');
      throw new Error('Authentication failed: User not found');
    }

    console.log('✅ VerifyUser: User verified successfully:', user.email);
    return user;
  } catch (err: any) {
    console.error('❌ VerifyUser exception:', {
      message: err.message,
      name: err.name,
      stack: err.stack,
      details: JSON.stringify(err)
    });
    
    // If the error is already formatted, rethrow it
    if (err.message?.startsWith('Authentication failed:') || err.message?.startsWith('Service temporarily unavailable:')) {
      throw err;
    }
    
    // Check for JSON parse errors
    if (err.message?.includes('is not valid JSON') || err.message?.includes('Unexpected token')) {
      throw new Error('Service temporarily unavailable: Unable to reach authentication service');
    }
    
    // Otherwise, wrap it with more context
    throw new Error(`Authentication failed: ${err.message || err.name || 'Unknown error'}`);
  }
}

/**
 * Data Structure:
 * 
 * user_organizations:{userId} = [
 *   {
 *     organizationId: string (the owner's userId or unique org ID),
 *     role: 'owner' | 'member',
 *     joinedAt: string,
 *     ownerEmail: string,
 *     ownerName: string
 *   }
 * ]
 * 
 * organization_data:{orgId} = {
 *   ownerId: string,
 *   ownerEmail: string,
 *   ownerName: string,
 *   createdAt: string,
 *   members: [userId1, userId2, ...]
 * }
 * 
 * user_notifications:{userId} = [
 *   {
 *     id: string,
 *     type: 'team_invitation',
 *     fromUserId: string,
 *     fromUserEmail: string,
 *     fromUserName: string,
 *     organizationId: string,
 *     status: 'pending' | 'accepted' | 'declined',
 *     createdAt: string,
 *     expiresAt: string
 *   }
 * ]
 */

/**
 * GET /organizations/list
 * Get all organizations for a user
 */
orgRouter.get('/organizations/list', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));

    // Get user's organizations
    const orgsKey = `user_organizations:${user.id}`;
    let organizations;
    try {
      organizations = await kv.get(orgsKey);
    } catch (kvError) {
      console.error(`❌ KV get failed for ${orgsKey}:`, kvError);
      // Continue with empty data instead of failing
      organizations = null;
    }
    
    let orgs = [];
    if (organizations && typeof organizations === 'string') {
      try {
        orgs = JSON.parse(organizations);
      } catch (parseError) {
        console.error(`❌ JSON parse failed for ${orgsKey}:`, parseError);
        orgs = [];
      }
    } else if (Array.isArray(organizations)) {
      orgs = organizations;
    }

    // Always include user's own organization
    const hasOwnOrg = orgs.some((org: any) => org.organizationId === user.id);
    if (!hasOwnOrg) {
      orgs.unshift({
        organizationId: user.id,
        role: 'owner',
        joinedAt: user.created_at || new Date().toISOString(),
        ownerEmail: user.email,
        ownerName: user.user_metadata?.name || user.email
      });
      try {
        await kv.set(orgsKey, JSON.stringify(orgs));
      } catch (kvSetError) {
        console.error(`❌ KV set failed for ${orgsKey}:`, kvSetError);
        // Continue anyway - user can still use their organization
      }
    }

    // Fetch additional data for each organization
    const orgsWithData = await Promise.all(orgs.map(async (org: any) => {
      try {
        const orgDataKey = `organization_data:${org.organizationId}`;
        const orgData = await kv.get(orgDataKey);
        let parsedOrgData = null;
        
        if (orgData && typeof orgData === 'string') {
          parsedOrgData = JSON.parse(orgData);
        } else if (orgData) {
          parsedOrgData = orgData;
        }

        return {
          ...org,
          memberCount: parsedOrgData?.members?.length || 0,
          businessCount: 0 // We'll calculate this from businesses
        };
      } catch (error) {
        console.error('Error fetching org data:', error);
        return org;
      }
    }));

    return c.json({
      success: true,
      organizations: orgsWithData,
      currentUserId: user.id
    });

  } catch (error: any) {
    console.error('❌ Error listing organizations:', error);
    
    // Return graceful degradation for service unavailable errors
    if (error.message?.includes('Service temporarily unavailable') || 
        error.message?.includes('Unable to reach authentication service')) {
      return c.json({
        success: false,
        error: 'Authentication service temporarily unavailable',
        degraded: true
      }, 503);
    }
    
    return c.json({
      success: false,
      error: error.message || 'Failed to list organizations'
    }, 500);
  }
});

/**
 * POST /organizations/switch
 * Switch to a different organization context
 */
orgRouter.post('/organizations/switch', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));

    const { organizationId } = await c.req.json();

    if (!organizationId) {
      return c.json({ success: false, error: 'Organization ID is required' }, 400);
    }

    // Verify user has access to this organization
    const orgsKey = `user_organizations:${user.id}`;
    let organizations;
    try {
      organizations = await kv.get(orgsKey);
    } catch (kvError) {
      console.error(`❌ KV get failed for ${orgsKey}:`, kvError);
      organizations = null;
    }
    
    let orgs = [];
    if (organizations && typeof organizations === 'string') {
      try {
        orgs = JSON.parse(organizations);
      } catch (parseError) {
        console.error(`❌ JSON parse failed for ${orgsKey}:`, parseError);
        orgs = [];
      }
    } else if (Array.isArray(organizations)) {
      orgs = organizations;
    }

    const hasAccess = orgs.some((org: any) => org.organizationId === organizationId) || organizationId === user.id;

    if (!hasAccess) {
      return c.json({ success: false, error: 'Access denied to this organization' }, 403);
    }

    // Store current organization context
    const contextKey = `user_current_org:${user.id}`;
    await kv.set(contextKey, JSON.stringify({
      organizationId,
      switchedAt: new Date().toISOString()
    }));

    return c.json({
      success: true,
      message: 'Organization switched successfully',
      organizationId
    });

  } catch (error: any) {
    console.error('❌ Error switching organization:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to switch organization'
    }, 500);
  }
});

/**
 * GET /organizations/current
 * Get the current organization context for a user
 */
orgRouter.get('/organizations/current', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));

    const contextKey = `user_current_org:${user.id}`;
    const context = await kv.get(contextKey);

    let currentOrgId = user.id; // Default to own organization
    
    if (context && typeof context === 'string') {
      const parsed = JSON.parse(context);
      currentOrgId = parsed.organizationId;
    } else if (context && context.organizationId) {
      currentOrgId = context.organizationId;
    }

    return c.json({
      success: true,
      organizationId: currentOrgId
    });

  } catch (error: any) {
    console.error('❌ Error getting current organization:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to get current organization'
    }, 500);
  }
});

/**
 * POST /organizations/create
 * Initialize organization data for a user (if not exists)
 */
orgRouter.post('/organizations/create', async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));

    // Create organization data
    const orgDataKey = `organization_data:${user.id}`;
    const existingOrgData = await kv.get(orgDataKey);

    if (!existingOrgData) {
      const orgData = {
        ownerId: user.id,
        ownerEmail: user.email,
        ownerName: user.user_metadata?.name || user.email,
        createdAt: new Date().toISOString(),
        members: []
      };
      await kv.set(orgDataKey, JSON.stringify(orgData));
    }

    // Ensure user has their own org in the list
    const orgsKey = `user_organizations:${user.id}`;
    const organizations = await kv.get(orgsKey);
    
    let orgs = [];
    if (organizations && typeof organizations === 'string') {
      orgs = JSON.parse(organizations);
    } else if (Array.isArray(organizations)) {
      orgs = organizations;
    }

    const hasOwnOrg = orgs.some((org: any) => org.organizationId === user.id);
    if (!hasOwnOrg) {
      orgs.unshift({
        organizationId: user.id,
        role: 'owner',
        joinedAt: user.created_at || new Date().toISOString(),
        ownerEmail: user.email,
        ownerName: user.user_metadata?.name || user.email
      });
      await kv.set(orgsKey, JSON.stringify(orgs));
    }

    return c.json({
      success: true,
      message: 'Organization initialized',
      organizationId: user.id
    });

  } catch (error: any) {
    console.error('❌ Error creating organization:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to create organization'
    }, 500);
  }
});

export default orgRouter;