import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

export function addCalendarEndpoints(app: Hono, verifyUserAccess: Function) {
  console.log('📅 Adding calendar endpoints...');

  // Get all calendar events for the current user/business
  app.get('/make-server-373d8b09/calendar/events', async (c) => {
    console.log('📅 Get calendar events endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      // Get businessId from query params (optional)
      const businessId = c.req.query('businessId') || user.id;

      console.log(`📅 Fetching calendar events for businessId: ${businessId}`);
      
      // Get all calendar events for this business
      const events = await kv.getByPrefix(`calendar:${businessId}:`);
      
      console.log(`📅 Found ${events.length} calendar events`);
      return c.json({ events });

    } catch (error) {
      console.error('❌ Calendar get events error:', error);
      return c.json({ error: `Error getting calendar events: ${error?.message || error}`, events: [] }, 500);
    }
  });

  // Create a new calendar event
  app.post('/make-server-373d8b09/calendar/events', async (c) => {
    console.log('📅 Create calendar event endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const eventData = await c.req.json();
      const { businessId, event } = eventData;
      
      const targetBusinessId = businessId || user.id;

      console.log(`📅 Creating calendar event for businessId: ${targetBusinessId}`, event);

      // Validate event data
      if (!event.id || !event.title || !event.startTime || !event.endTime) {
        return c.json({ error: 'Invalid event data. Required: id, title, startTime, endTime' }, 400);
      }

      // Store event in KV store
      const key = `calendar:${targetBusinessId}:${event.id}`;
      const eventToStore = {
        ...event,
        userId: user.id,
        businessId: targetBusinessId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await kv.set(key, eventToStore);

      console.log(`✅ Calendar event created: ${event.title} (${event.id})`);
      return c.json({ success: true, event: eventToStore });

    } catch (error) {
      console.error('❌ Calendar create event error:', error);
      return c.json({ error: `Error creating calendar event: ${error?.message || error}` }, 500);
    }
  });

  // Update an existing calendar event
  app.put('/make-server-373d8b09/calendar/events/:eventId', async (c) => {
    console.log('📅 Update calendar event endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const eventId = c.req.param('eventId');
      const updateData = await c.req.json();
      const { businessId, event } = updateData;
      
      const targetBusinessId = businessId || user.id;
      const key = `calendar:${targetBusinessId}:${eventId}`;

      console.log(`📅 Updating calendar event:`, {
        eventId,
        targetBusinessId,
        key,
        eventData: event
      });

      // Get existing event
      const existingEvent = await kv.get(key);
      
      if (!existingEvent) {
        console.error(`❌ Event not found with key: ${key}`);
        
        // Try to find all events for this business to debug
        const allEvents = await kv.getByPrefix(`calendar:${targetBusinessId}:`);
        console.log(`📅 All events for business ${targetBusinessId}:`, {
          count: allEvents.length,
          eventIds: allEvents.map(e => e.id)
        });
        
        return c.json({ 
          error: 'Event not found',
          details: {
            searchedKey: key,
            availableEvents: allEvents.length,
            eventIds: allEvents.map(e => e.id)
          }
        }, 404);
      }

      // Update event
      const updatedEvent = {
        ...existingEvent,
        ...event,
        id: eventId, // Ensure ID doesn't change
        userId: user.id,
        businessId: targetBusinessId,
        updatedAt: new Date().toISOString()
      };

      await kv.set(key, updatedEvent);

      console.log(`✅ Calendar event updated: ${updatedEvent.title} (${eventId})`);
      return c.json({ success: true, event: updatedEvent });

    } catch (error) {
      console.error('❌ Calendar update event error:', error);
      return c.json({ error: `Error updating calendar event: ${error?.message || error}` }, 500);
    }
  });

  // Delete a calendar event
  app.delete('/make-server-373d8b09/calendar/events/:eventId', async (c) => {
    console.log('📅 Delete calendar event endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const eventId = c.req.param('eventId');
      const businessId = c.req.query('businessId') || user.id;
      const key = `calendar:${businessId}:${eventId}`;

      console.log(`📅 Deleting calendar event: ${eventId} for businessId: ${businessId}`);

      // Check if event exists
      const existingEvent = await kv.get(key);
      
      if (!existingEvent) {
        return c.json({ error: 'Event not found' }, 404);
      }

      // Delete event
      await kv.del(key);

      console.log(`✅ Calendar event deleted: ${eventId}`);
      return c.json({ success: true, message: 'Event deleted successfully' });

    } catch (error) {
      console.error('❌ Calendar delete event error:', error);
      return c.json({ error: `Error deleting calendar event: ${error?.message || error}` }, 500);
    }
  });

  // Bulk sync calendar events (for initial sync or conflict resolution)
  app.post('/make-server-373d8b09/calendar/events/sync', async (c) => {
    console.log('📅 Sync calendar events endpoint called');
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await verifyUserAccess(accessToken);
      
      const { businessId, events } = await c.req.json();
      const targetBusinessId = businessId || user.id;

      console.log(`📅 Syncing ${events.length} calendar events for businessId: ${targetBusinessId}`);

      // Store all events
      const results = [];
      for (const event of events) {
        try {
          const key = `calendar:${targetBusinessId}:${event.id}`;
          const eventToStore = {
            ...event,
            userId: user.id,
            businessId: targetBusinessId,
            updatedAt: new Date().toISOString()
          };

          await kv.set(key, eventToStore);
          results.push({ id: event.id, success: true });
        } catch (error) {
          console.error(`❌ Error syncing event ${event.id}:`, error);
          results.push({ id: event.id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Calendar sync complete: ${successCount}/${events.length} events synced`);
      
      return c.json({ 
        success: true, 
        results,
        syncedCount: successCount,
        totalCount: events.length 
      });

    } catch (error) {
      console.error('❌ Calendar sync error:', error);
      return c.json({ error: `Error syncing calendar events: ${error?.message || error}` }, 500);
    }
  });

  console.log('✅ Calendar endpoints added successfully');
}