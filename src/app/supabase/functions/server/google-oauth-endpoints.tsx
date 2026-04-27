import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addGoogleOAuthEndpoints(app: any) {
  console.log('🔧 Adding Google OAuth endpoints...');

  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const GOOGLE_REDIRECT_URI = 'https://www.cofounderplus.com/operations/sales/google-callback';

  // Log configuration on startup
  console.log('🔍 Google OAuth Configuration:');
  console.log('   Client ID:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
  console.log('   Client Secret:', GOOGLE_CLIENT_SECRET ? `${GOOGLE_CLIENT_SECRET.substring(0, 8)}...` : 'NOT SET');
  console.log('   Redirect URI:', GOOGLE_REDIRECT_URI);

  // Test endpoint to verify OAuth configuration
  app.get('/make-server-373d8b09/google/config-test', async (c: any) => {
    try {
      return c.json({
        success: true,
        configured: {
          hasClientId: !!GOOGLE_CLIENT_ID,
          hasClientSecret: !!GOOGLE_CLIENT_SECRET,
          redirectUri: GOOGLE_REDIRECT_URI,
          clientIdPrefix: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET',
        },
        message: (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) 
          ? '⚠️ Missing OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Supabase environment variables.'
          : '✅ OAuth credentials configured correctly!'
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  });

  // Helper to get user's access token
  async function getUserAccessToken(userId: string) {
    const tokenData = await kv.get(`google_oauth:${userId}`);
    return tokenData;
  }

  // Helper to refresh access token if expired
  async function refreshAccessToken(userId: string, refreshToken: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh error:', errorText);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();

      // Store new access token (keep existing refresh token)
      const existingData = await getUserAccessToken(userId);
      await kv.set(`google_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: refreshToken, // Keep existing refresh token
        expires_at: Date.now() + (data.expires_in * 1000),
        scope: existingData?.scope || '',
        token_type: data.token_type
      });

      console.log(`🔄 Google access token refreshed for user ${userId}`);
      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Helper to make authenticated Google API calls
  async function googleRequest(userId: string, url: string, options: any = {}) {
    const tokenData = await getUserAccessToken(userId);

    if (!tokenData) {
      throw new Error('User not connected to Google. Please authorize first.');
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    if (Date.now() >= tokenData.expires_at) {
      console.log('🔄 Access token expired, refreshing...');
      accessToken = await refreshAccessToken(userId, tokenData.refresh_token);
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google API error (${url}):`, errorText);
      
      // If 401, token might be invalid - try refreshing
      if (response.status === 401 && tokenData.refresh_token) {
        console.log('🔄 Got 401, attempting token refresh...');
        accessToken = await refreshAccessToken(userId, tokenData.refresh_token);
        
        // Retry request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`Google API error: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      }

      throw new Error(`Google API error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Get OAuth authorization URL
  app.get('/make-server-373d8b09/google/auth-url', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      if (!GOOGLE_CLIENT_ID) {
        return c.json({ 
          error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
        }, 500);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Build OAuth authorization URL with all required scopes
      const scopes = [
        // Gmail API - full access to read, compose, send, and permanently delete emails
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
        
        // Calendar API - full access to calendars
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        
        // Drive API - full access to files
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        
        // People API (Contacts) - full access to contacts
        'https://www.googleapis.com/auth/contacts',
        'https://www.googleapis.com/auth/contacts.other.readonly',
        
        // Admin SDK - Directory API for user management
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        
        // User profile info
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
      ];

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
      authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to get refresh token
      authUrl.searchParams.set('state', userId); // Pass userId as state for callback

      console.log('🔗 Generated Google OAuth URL:');
      console.log('   Client ID:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
      console.log('   Redirect URI being sent:', GOOGLE_REDIRECT_URI);
      console.log('   Scopes:', scopes.join(' '));
      console.log('   ⚠️  IMPORTANT: This redirect URI must EXACTLY match what is configured in Google Cloud Console');
      console.log('   📖 See /GOOGLE_OAUTH_SETUP.md for configuration instructions');

      return c.json({
        success: true,
        authUrl: authUrl.toString(),
        redirectUri: GOOGLE_REDIRECT_URI,
        note: 'If you get redirect_uri_mismatch error, verify this exact URI is registered in Google Cloud Console'
      });

    } catch (error: any) {
      console.error('Get auth URL error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // OAuth callback handler (POST version for frontend)
  app.post('/make-server-373d8b09/google/callback', async (c: any) => {
    try {
      const body = await c.req.json();
      const { code, userId } = body;

      if (!code || !userId) {
        return c.json({ error: 'Missing code or userId' }, 400);
      }

      console.log(`🔑 Exchanging code for access token for user ${userId}...`);

      // Exchange authorization code for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code: code,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', errorText);
        return c.json({ error: 'Failed to exchange authorization code', details: errorText }, 500);
      }

      const data = await response.json();

      // Store tokens for this user
      await kv.set(`google_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000),
        scope: data.scope,
        token_type: data.token_type,
        connected_at: new Date().toISOString()
      });

      console.log(`✅ Google connected successfully for user ${userId}`);

      return c.json({
        success: true,
        message: 'Google account connected successfully!',
        scopes: data.scope
      });

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // OAuth callback handler (GET version for redirect from Google)
  app.get('/make-server-373d8b09/google/callback', async (c: any) => {
    try {
      const code = c.req.query('code');
      const state = c.req.query('state'); // This is the userId
      const error = c.req.query('error');

      if (error) {
        console.error('OAuth error:', error);
        return c.json({ error: `Google authorization failed: ${error}` }, 400);
      }

      if (!code || !state) {
        return c.json({ error: 'Invalid callback parameters' }, 400);
      }

      const userId = state;

      console.log(`🔑 Exchanging code for access token for user ${userId}...`);

      // Exchange authorization code for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code: code,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', errorText);
        return c.json({ error: 'Failed to exchange authorization code' }, 500);
      }

      const data = await response.json();

      // Store tokens for this user
      await kv.set(`google_oauth:${userId}`, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000),
        scope: data.scope,
        token_type: data.token_type,
        connected_at: new Date().toISOString()
      });

      console.log(`✅ Google connected successfully for user ${userId}`);

      return c.json({
        success: true,
        message: 'Google account connected successfully!',
        scopes: data.scope
      });

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Check connection status
  app.get('/make-server-373d8b09/google/status', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      const tokenData = await getUserAccessToken(userId);

      if (!tokenData) {
        return c.json({
          connected: false,
          message: 'Not connected to Google'
        });
      }

      // Verify token is still valid by making a test request to get user info
      try {
        const userInfo = await googleRequest(userId, 'https://www.googleapis.com/oauth2/v2/userinfo');
        
        return c.json({
          connected: true,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          scopes: tokenData.scope,
          connectedAt: tokenData.connected_at
        });
      } catch (error) {
        // Token invalid or expired
        return c.json({
          connected: false,
          message: 'Google connection expired. Please reconnect.'
        });
      }

    } catch (error: any) {
      console.error('Status check error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Disconnect Google
  app.post('/make-server-373d8b09/google/disconnect', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const body = await c.req.json();
      const userId = body.userId;

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      // Get token to revoke it
      const tokenData = await getUserAccessToken(userId);
      if (tokenData?.access_token) {
        // Revoke the token with Google
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
          method: 'POST'
        });
      }

      // Delete stored tokens
      await kv.del(`google_oauth:${userId}`);

      console.log(`🔌 Google disconnected for user ${userId}`);

      return c.json({
        success: true,
        message: 'Google disconnected successfully'
      });

    } catch (error: any) {
      console.error('Disconnect error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // ============================================
  // GMAIL API ENDPOINTS
  // ============================================

  // Get Gmail messages (inbox)
  app.get('/make-server-373d8b09/google/gmail/messages', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const maxResults = c.req.query('maxResults') || '50';
      const query = c.req.query('query') || ''; // Gmail search query

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`📧 Fetching Gmail messages for user ${userId}...`);

      let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }

      const data = await googleRequest(userId, url);

      return c.json({
        success: true,
        messages: data.messages || [],
        resultSizeEstimate: data.resultSizeEstimate || 0
      });

    } catch (error: any) {
      console.error('Get Gmail messages error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get single Gmail message details
  app.get('/make-server-373d8b09/google/gmail/message/:id', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const messageId = c.req.param('id');

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`📧 Fetching Gmail message ${messageId} for user ${userId}...`);

      const data = await googleRequest(
        userId, 
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
      );

      return c.json({
        success: true,
        message: data
      });

    } catch (error: any) {
      console.error('Get Gmail message error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Send Gmail message
  app.post('/make-server-373d8b09/google/gmail/send', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const body = await c.req.json();
      const { userId, to, subject, message, cc, bcc } = body;

      if (!userId || !to || !subject || !message) {
        return c.json({ error: 'Missing required fields: userId, to, subject, message' }, 400);
      }

      console.log(`📤 Sending Gmail message for user ${userId} to ${to}...`);

      // Create the email in RFC 2822 format
      let email = [
        `To: ${to}`,
        `Subject: ${subject}`,
      ];

      if (cc) email.push(`Cc: ${cc}`);
      if (bcc) email.push(`Bcc: ${bcc}`);
      
      email.push('Content-Type: text/html; charset=utf-8');
      email.push('');
      email.push(message);

      const emailString = email.join('\r\n');
      
      // Base64url encode the message
      const encodedMessage = btoa(emailString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const data = await googleRequest(
        userId,
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          body: JSON.stringify({ raw: encodedMessage })
        }
      );

      console.log(`✅ Gmail message sent successfully`);

      return c.json({
        success: true,
        messageId: data.id,
        threadId: data.threadId
      });

    } catch (error: any) {
      console.error('Send Gmail error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // ============================================
  // CALENDAR API ENDPOINTS
  // ============================================

  // Get calendar list
  app.get('/make-server-373d8b09/google/calendar/list', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`📅 Fetching calendars for user ${userId}...`);

      const data = await googleRequest(
        userId,
        'https://www.googleapis.com/calendar/v3/users/me/calendarList'
      );

      return c.json({
        success: true,
        calendars: data.items || []
      });

    } catch (error: any) {
      console.error('Get calendars error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Get calendar events
  app.get('/make-server-373d8b09/google/calendar/events', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const calendarId = c.req.query('calendarId') || 'primary';
      const timeMin = c.req.query('timeMin');
      const timeMax = c.req.query('timeMax');
      const maxResults = c.req.query('maxResults') || '50';

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`📅 Fetching calendar events for user ${userId}...`);

      let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;
      
      if (timeMin) url += `&timeMin=${encodeURIComponent(timeMin)}`;
      if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;

      const data = await googleRequest(userId, url);

      return c.json({
        success: true,
        events: data.items || []
      });

    } catch (error: any) {
      console.error('Get calendar events error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Create calendar event
  app.post('/make-server-373d8b09/google/calendar/events', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const body = await c.req.json();
      const { userId, calendarId = 'primary', summary, description, start, end, attendees, location } = body;

      if (!userId || !summary || !start || !end) {
        return c.json({ error: 'Missing required fields: userId, summary, start, end' }, 400);
      }

      console.log(`📅 Creating calendar event for user ${userId}...`);

      const event: any = {
        summary,
        description,
        start,
        end
      };

      if (location) event.location = location;
      if (attendees) event.attendees = attendees;

      const data = await googleRequest(
        userId,
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          body: JSON.stringify(event)
        }
      );

      console.log(`✅ Calendar event created successfully`);

      return c.json({
        success: true,
        event: data
      });

    } catch (error: any) {
      console.error('Create calendar event error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // ============================================
  // DRIVE API ENDPOINTS
  // ============================================

  // List Drive files
  app.get('/make-server-373d8b09/google/drive/files', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const pageSize = c.req.query('pageSize') || '50';
      const query = c.req.query('query') || '';

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`📁 Fetching Drive files for user ${userId}...`);

      let url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,iconLink)`;
      
      if (query) url += `&q=${encodeURIComponent(query)}`;

      const data = await googleRequest(userId, url);

      return c.json({
        success: true,
        files: data.files || []
      });

    } catch (error: any) {
      console.error('Get Drive files error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  // ============================================
  // PEOPLE API (CONTACTS) ENDPOINTS
  // ============================================

  // Get contacts
  app.get('/make-server-373d8b09/google/contacts', async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization required' }, 401);
      }

      const userId = c.req.query('userId');
      const pageSize = c.req.query('pageSize') || '100';

      if (!userId) {
        return c.json({ error: 'User ID is required' }, 400);
      }

      console.log(`👥 Fetching contacts for user ${userId}...`);

      const url = `https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=names,emailAddresses,phoneNumbers,organizations,addresses`;

      const data = await googleRequest(userId, url);

      return c.json({
        success: true,
        contacts: data.connections || [],
        totalPeople: data.totalPeople || 0
      });

    } catch (error: any) {
      console.error('Get contacts error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  console.log('✅ Google OAuth endpoints added successfully');
}