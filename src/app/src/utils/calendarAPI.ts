import { projectId, publicAnonKey } from './supabase/info';
import { supabase } from './supabase/client';

const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;

// Helper function to get access token
async function getAccessToken(): Promise<string> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  console.log('🔑 Calendar API getting access token:', {
    hasSession: !!session.data.session,
    hasAccessToken: !!token,
    tokenStart: token?.substring(0, 20) + '...',
    tokenLength: token?.length,
    sessionData: session.data.session ? {
      userId: session.data.session.user?.id,
      expiresAt: session.data.session.expires_at
    } : null
  });
  
  if (!token) {
    throw new Error('No access token available - user not authenticated');
  }
  
  return token;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  type: 'meeting' | 'call' | 'task' | 'reminder' | 'other';
  location?: string;
  attendees?: string[];
  color: string;
  userId?: string;
  businessId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const calendarAPI = {
  // Fetch all events for a business
  async fetchEvents(businessId?: string): Promise<CalendarEvent[]> {
    try {
      const url = businessId 
        ? `${serverUrl}/calendar/events?businessId=${businessId}`
        : `${serverUrl}/calendar/events`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch calendar events:', response.statusText);
        return [];
      }

      const data = await response.json();
      
      // Convert date strings to Date objects
      return (data.events || []).map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime)
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  },

  // Create a new event
  async createEvent(event: CalendarEvent, businessId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/calendar/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId,
          event: {
            ...event,
            startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
            endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to create calendar event:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return false;
    }
  },

  // Update an existing event
  async updateEvent(eventId: string, event: CalendarEvent, businessId?: string): Promise<boolean> {
    try {
      console.log('📅 Updating calendar event:', {
        eventId,
        event: {
          ...event,
          startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
          endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime
        },
        businessId
      });

      const response = await fetch(`${serverUrl}/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId,
          event: {
            ...event,
            startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
            endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to update calendar event:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        return false;
      }

      const result = await response.json();
      console.log('✅ Calendar event updated successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error updating calendar event:', error);
      return false;
    }
  },

  // Delete an event
  async deleteEvent(eventId: string, businessId?: string): Promise<boolean> {
    try {
      const url = businessId 
        ? `${serverUrl}/calendar/events/${eventId}?businessId=${businessId}`
        : `${serverUrl}/calendar/events/${eventId}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to delete calendar event:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  },

  // Bulk sync events
  async syncEvents(events: CalendarEvent[], businessId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/calendar/events/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId,
          events: events.map(event => ({
            ...event,
            startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
            endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime
          }))
        })
      });

      if (!response.ok) {
        console.error('Failed to sync calendar events:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error syncing calendar events:', error);
      return false;
    }
  }
};