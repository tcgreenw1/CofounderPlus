/**
 * Microsoft Graph API Integration
 * Used to create unique Teams meetings for bookings
 */

const TENANT_ID = Deno.env.get('MICROSOFT_TENANT_ID');
const CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
const CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');
const ADMIN_EMAIL = Deno.env.get('MICROSOFT_ADMIN_EMAIL');

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface TeamsMeeting {
  joinUrl: string;
  id: string;
}

async function getAccessToken(): Promise<string> {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Microsoft Graph credentials not configured');
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'https://graph.microsoft.com/.default',
    client_secret: CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  const response = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Microsoft Auth Error:', error);
    throw new Error('Failed to authenticate with Microsoft Graph');
  }

  const data: TokenResponse = await response.json();
  return data.access_token;
}

export async function createTeamsMeeting(params: {
  subject: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  description?: string;
}): Promise<TeamsMeeting | null> {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !ADMIN_EMAIL) {
    console.log('⚠️ Microsoft credentials missing, skipping Teams meeting creation');
    return null;
  }

  try {
    const token = await getAccessToken();

    const event = {
      subject: params.subject,
      body: {
        contentType: 'HTML',
        content: params.description || '',
      },
      start: {
        dateTime: params.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: params.endTime,
        timeZone: 'UTC',
      },
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      // We don't add attendees here to avoid sending a raw Outlook invite.
      // We'll capture the link and send our own branded email.
    };

    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${ADMIN_EMAIL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Create Teams Event Error:', error);
      throw new Error(`Failed to create Teams event: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.isOnlineMeeting && data.onlineMeeting && data.onlineMeeting.joinUrl) {
      console.log('✅ Created Microsoft Teams Meeting:', data.onlineMeeting.joinUrl);
      return {
        joinUrl: data.onlineMeeting.joinUrl,
        id: data.id,
      };
    } else {
      console.warn('⚠️ Event created but no Teams URL found in response');
      return null;
    }
  } catch (error) {
    console.error('❌ Microsoft Graph Error:', error);
    return null;
  }
}
