import { supabase } from './supabase/client';
import { projectId } from './supabase/info';

const GOOGLE_API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google`;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Authentication required');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
}

// ============================================
// GMAIL HELPERS
// ============================================

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: any;
  internalDate?: string;
}

export interface SendEmailParams {
  userId: string;
  to: string;
  subject: string;
  message: string;
  cc?: string;
  bcc?: string;
}

/**
 * Get Gmail messages (inbox)
 */
export async function getGmailMessages(
  userId: string,
  maxResults: number = 50,
  query: string = ''
): Promise<{ messages: GmailMessage[]; resultSizeEstimate: number }> {
  const headers = await getAuthHeaders();
  
  let url = `${GOOGLE_API_BASE}/gmail/messages?userId=${userId}&maxResults=${maxResults}`;
  if (query) url += `&query=${encodeURIComponent(query)}`;

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch Gmail messages');
  }

  return await response.json();
}

/**
 * Get single Gmail message details
 */
export async function getGmailMessage(
  userId: string,
  messageId: string
): Promise<{ message: GmailMessage }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/gmail/message/${messageId}?userId=${userId}`, {
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch Gmail message');
  }

  return await response.json();
}

/**
 * Send Gmail message
 */
export async function sendGmailMessage(params: SendEmailParams): Promise<{ messageId: string; threadId: string }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/gmail/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send Gmail message');
  }

  return await response.json();
}

// ============================================
// CALENDAR HELPERS
// ============================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  attendees?: { email: string }[];
  location?: string;
}

export interface CreateEventParams {
  userId: string;
  calendarId?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  attendees?: { email: string }[];
  location?: string;
}

/**
 * Get calendar list
 */
export async function getCalendarList(userId: string): Promise<{ calendars: any[] }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/calendar/list?userId=${userId}`, {
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch calendars');
  }

  return await response.json();
}

/**
 * Get calendar events
 */
export async function getCalendarEvents(
  userId: string,
  calendarId: string = 'primary',
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 50
): Promise<{ events: CalendarEvent[] }> {
  const headers = await getAuthHeaders();
  
  let url = `${GOOGLE_API_BASE}/calendar/events?userId=${userId}&calendarId=${encodeURIComponent(calendarId)}&maxResults=${maxResults}`;
  if (timeMin) url += `&timeMin=${encodeURIComponent(timeMin)}`;
  if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch calendar events');
  }

  return await response.json();
}

/**
 * Create calendar event
 */
export async function createCalendarEvent(params: CreateEventParams): Promise<{ event: CalendarEvent }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/calendar/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create calendar event');
  }

  return await response.json();
}

// ============================================
// DRIVE HELPERS
// ============================================

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

/**
 * List Drive files
 */
export async function getDriveFiles(
  userId: string,
  pageSize: number = 50,
  query: string = ''
): Promise<{ files: DriveFile[] }> {
  const headers = await getAuthHeaders();
  
  let url = `${GOOGLE_API_BASE}/drive/files?userId=${userId}&pageSize=${pageSize}`;
  if (query) url += `&query=${encodeURIComponent(query)}`;

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch Drive files');
  }

  return await response.json();
}

// ============================================
// CONTACTS (PEOPLE API) HELPERS
// ============================================

export interface Contact {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
  organizations?: Array<{
    name: string;
    title?: string;
  }>;
  addresses?: Array<{
    formattedValue: string;
  }>;
}

/**
 * Get contacts
 */
export async function getContacts(
  userId: string,
  pageSize: number = 100
): Promise<{ contacts: Contact[]; totalPeople: number }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/contacts?userId=${userId}&pageSize=${pageSize}`, {
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch contacts');
  }

  return await response.json();
}

// ============================================
// CONNECTION HELPERS
// ============================================

/**
 * Check Google connection status
 */
export async function checkGoogleConnection(userId: string): Promise<{
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
  scopes?: string;
}> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/status?userId=${userId}`, {
    headers
  });
  
  const data = await response.json();
  return data;
}

/**
 * Get Google OAuth authorization URL
 */
export async function getGoogleAuthUrl(userId: string): Promise<{ authUrl: string }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/auth-url?userId=${userId}`, {
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get Google auth URL');
  }

  return await response.json();
}

/**
 * Disconnect Google
 */
export async function disconnectGoogle(userId: string): Promise<{ success: boolean }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${GOOGLE_API_BASE}/disconnect`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to disconnect Google');
  }

  return await response.json();
}
