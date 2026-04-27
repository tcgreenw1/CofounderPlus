import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addSlackEndpoints(app: Hono, verifyUserAccess: Function) {
  console.log('🔧 Adding Slack endpoints...');

  const SLACK_CLIENT_ID = Deno.env.get('SLACK_CLIENT_ID');
  const SLACK_CLIENT_SECRET = Deno.env.get('SLACK_CLIENT_SECRET');
  const REDIRECT_URI = 'https://www.cofounderplus.com/operations/hr/slack-callback';

  // Check Slack connection status
  app.get('/make-server-373d8b09/slack/status', async (c) => {
    console.log('Slack: Check status endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      const slackConnection = await kv.get(`slack_connection:${user.id}`).catch(() => null);

      if (slackConnection && slackConnection.access_token) {
        return c.json({
          connected: true,
          team_name: slackConnection.team_name,
          team_id: slackConnection.team_id,
          user_id: slackConnection.user_id,
          connected_at: slackConnection.connected_at
        });
      }

      return c.json({ connected: false });

    } catch (error) {
      console.error('Slack status check error:', error);
      return c.json({ error: `Error checking status: ${error?.message || error}`, connected: false }, 500);
    }
  });

  // Initiate OAuth flow
  app.get('/make-server-373d8b09/slack/auth/initiate', async (c) => {
    console.log('Slack: Initiate OAuth endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      if (!SLACK_CLIENT_ID) {
        return c.json({ error: 'Slack client ID not configured' }, 500);
      }

      // Generate state for CSRF protection
      const state = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await kv.set(`slack_oauth_state:${state}`, { userId: user.id, timestamp: Date.now() });

      const scopes = [
        'channels:history',
        'channels:read',
        'chat:write',
        'groups:history',
        'groups:read',
        'im:history',
        'im:read',
        'im:write',
        'mpim:history',
        'mpim:read',
        'users:read',
        'team:read'
      ].join(',');

      const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;

      console.log('Slack: Generated auth URL');
      return c.json({ authUrl });

    } catch (error) {
      console.error('Slack OAuth initiate error:', error);
      return c.json({ error: `Error initiating OAuth: ${error?.message || error}` }, 500);
    }
  });

  // Handle OAuth callback
  app.post('/make-server-373d8b09/slack/auth/callback', async (c) => {
    console.log('Slack: OAuth callback endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      const { code } = await c.req.json();

      if (!code) {
        return c.json({ error: 'No authorization code provided' }, 400);
      }

      if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
        return c.json({ error: 'Slack credentials not configured' }, 500);
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          code: code,
          redirect_uri: REDIRECT_URI
        })
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.ok) {
        console.error('Slack OAuth error:', tokenData);
        return c.json({ error: tokenData.error || 'Failed to exchange code' }, 400);
      }

      // Store Slack connection data
      const connectionData = {
        access_token: tokenData.access_token,
        bot_access_token: tokenData.access_token, // For bot operations
        scope: tokenData.scope,
        team_id: tokenData.team?.id,
        team_name: tokenData.team?.name,
        user_id: tokenData.authed_user?.id,
        connected_at: new Date().toISOString()
      };

      await kv.set(`slack_connection:${user.id}`, connectionData);

      console.log(`Slack: User ${user.id} connected to team ${connectionData.team_name}`);
      return c.json({ 
        success: true,
        team_name: connectionData.team_name
      });

    } catch (error) {
      console.error('Slack OAuth callback error:', error);
      return c.json({ error: `Error completing OAuth: ${error?.message || error}` }, 500);
    }
  });

  // Disconnect Slack
  app.post('/make-server-373d8b09/slack/disconnect', async (c) => {
    console.log('Slack: Disconnect endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      await kv.del(`slack_connection:${user.id}`);

      console.log(`Slack: User ${user.id} disconnected`);
      return c.json({ success: true });

    } catch (error) {
      console.error('Slack disconnect error:', error);
      return c.json({ error: `Error disconnecting: ${error?.message || error}` }, 500);
    }
  });

  // Get connection status
  app.get('/make-server-373d8b09/slack/connection-status', async (c) => {
    console.log('Slack: Get connection status endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      const slackConnection = await kv.get(`slack_connection:${user.id}`);

      if (!slackConnection) {
        return c.json({ 
          connected: false 
        });
      }

      return c.json({
        connected: true,
        workspace_name: slackConnection.team_name || 'Slack Workspace',
        team_id: slackConnection.team_id,
        user_id: slackConnection.user_id,
        connected_at: slackConnection.connected_at
      });

    } catch (error) {
      console.error('Slack connection status error:', error);
      return c.json({ error: `Error checking connection: ${error?.message || error}`, connected: false }, 500);
    }
  });

  // Get channels list
  app.get('/make-server-373d8b09/slack/channels', async (c) => {
    console.log('Slack: Get channels endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      const slackConnection = await kv.get(`slack_connection:${user.id}`);
      if (!slackConnection || !slackConnection.access_token) {
        return c.json({ error: 'Slack not connected' }, 401);
      }

      const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
        headers: {
          'Authorization': `Bearer ${slackConnection.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack API error:', data.error);
        return c.json({ error: data.error || 'Failed to fetch channels' }, 400);
      }

      return c.json({ channels: data.channels || [] });

    } catch (error) {
      console.error('Slack get channels error:', error);
      return c.json({ error: `Error fetching channels: ${error?.message || error}`, channels: [] }, 500);
    }
  });

  // Get messages from a channel
  app.get('/make-server-373d8b09/slack/messages/:channelId', async (c) => {
    console.log('Slack: Get messages endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      const slackConnection = await kv.get(`slack_connection:${user.id}`);
      if (!slackConnection || !slackConnection.access_token) {
        return c.json({ error: 'Slack not connected' }, 401);
      }

      const channelId = c.req.param('channelId');

      const response = await fetch(`https://slack.com/api/conversations.history?channel=${channelId}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${slackConnection.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack API error:', data.error);
        return c.json({ error: data.error || 'Failed to fetch messages' }, 400);
      }

      // Enrich messages with user information
      const messages = await Promise.all((data.messages || []).map(async (msg: any) => {
        if (msg.user) {
          try {
            const userResponse = await fetch(`https://slack.com/api/users.info?user=${msg.user}`, {
              headers: {
                'Authorization': `Bearer ${slackConnection.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            const userData = await userResponse.json();
            if (userData.ok && userData.user) {
              msg.username = userData.user.real_name || userData.user.name;
            }
          } catch (e) {
            console.error('Error fetching user info:', e);
          }
        }
        return msg;
      }));

      return c.json({ messages });

    } catch (error) {
      console.error('Slack get messages error:', error);
      return c.json({ error: `Error fetching messages: ${error?.message || error}`, messages: [] }, 500);
    }
  });

  // Send a message
  app.post('/make-server-373d8b09/slack/send', async (c) => {
    console.log('Slack: Send message endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);

      const slackConnection = await kv.get(`slack_connection:${user.id}`);
      if (!slackConnection || !slackConnection.access_token) {
        return c.json({ error: 'Slack not connected' }, 401);
      }

      const { channel, text } = await c.req.json();

      if (!channel || !text) {
        return c.json({ error: 'Channel and text are required' }, 400);
      }

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${slackConnection.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          text
        })
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Slack API error:', data.error);
        return c.json({ error: data.error || 'Failed to send message' }, 400);
      }

      console.log(`Slack: Message sent to channel ${channel}`);
      return c.json({ success: true, message: data.message });

    } catch (error) {
      console.error('Slack send message error:', error);
      return c.json({ error: `Error sending message: ${error?.message || error}` }, 500);
    }
  });

  console.log('✅ Slack endpoints added successfully');
}