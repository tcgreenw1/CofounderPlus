import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Debug endpoint to check all ticket-related keys in KV store
 */
app.get('/debug-all-ticket-keys', async (c) => {
  console.log('🔍 DEBUG: Checking all ticket-related keys...');
  
  try {
    // Check various possible keys
    const keysToCheck = [
      'admin:support_tickets',
      'support_tickets:all',
      'user:support_tickets',
    ];
    
    const results: any = {};
    
    for (const key of keysToCheck) {
      const data = await kv.get(key);
      results[key] = {
        exists: data !== null && data !== undefined,
        isArray: Array.isArray(data),
        count: Array.isArray(data) ? data.length : 'N/A',
        sample: Array.isArray(data) && data.length > 0 ? data[0] : data
      };
      console.log(`🔍 Key "${key}":`, results[key]);
    }
    
    // Also check prefix-based tickets
    const prefixTickets = await kv.getByPrefix('support_ticket:');
    results['support_ticket:*'] = {
      exists: prefixTickets.length > 0,
      isArray: true,
      count: prefixTickets.length,
      sample: prefixTickets[0] || null
    };
    console.log('🔍 Prefix "support_ticket:*":', results['support_ticket:*']);
    
    // Check user-specific tickets
    const userTickets = await kv.getByPrefix('user:');
    const userSupportTickets = userTickets.filter((item: any) => 
      item && typeof item === 'object' && 'support_tickets' in item
    );
    results['user:*:support_tickets'] = {
      exists: userSupportTickets.length > 0,
      count: userSupportTickets.length,
      sample: userSupportTickets[0] || null
    };
    console.log('🔍 User tickets:', results['user:*:support_tickets']);
    
    return c.json({
      success: true,
      message: 'Debug check complete',
      results,
      totalPrefixTickets: prefixTickets.length,
      recommendation: prefixTickets.length > 0 
        ? 'Found tickets with support_ticket: prefix. You may need to migrate these to admin:support_tickets'
        : 'No prefix-based tickets found. Check if admin:support_tickets key has data.'
    });
    
  } catch (error) {
    console.error('🔍 DEBUG ERROR:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * Migrate tickets from support_ticket: prefix to admin:support_tickets array
 */
app.post('/migrate-tickets', async (c) => {
  console.log('🔄 MIGRATION: Starting ticket migration...');
  
  try {
    // Get all tickets with support_ticket: prefix
    const prefixTickets = await kv.getByPrefix('support_ticket:');
    console.log(`🔄 MIGRATION: Found ${prefixTickets.length} tickets with prefix`);
    
    if (prefixTickets.length === 0) {
      return c.json({
        success: true,
        message: 'No tickets to migrate',
        migrated: 0
      });
    }
    
    // Get existing admin tickets
    const adminTicketsKey = 'admin:support_tickets';
    const existingAdminTickets = await kv.get(adminTicketsKey) || [];
    console.log(`🔄 MIGRATION: Existing admin tickets: ${Array.isArray(existingAdminTickets) ? existingAdminTickets.length : 0}`);
    
    // Combine (avoiding duplicates by ticket ID)
    const existingIds = new Set(
      Array.isArray(existingAdminTickets) 
        ? existingAdminTickets.map((t: any) => t.id) 
        : []
    );
    
    const newTickets = prefixTickets.filter((ticket: any) => 
      !existingIds.has(ticket.id)
    );
    
    console.log(`🔄 MIGRATION: New tickets to add: ${newTickets.length}`);
    
    const mergedTickets = [
      ...(Array.isArray(existingAdminTickets) ? existingAdminTickets : []),
      ...newTickets
    ];
    
    // Save merged tickets
    await kv.set(adminTicketsKey, mergedTickets);
    console.log(`🔄 MIGRATION: Saved ${mergedTickets.length} total tickets to ${adminTicketsKey}`);
    
    return c.json({
      success: true,
      message: 'Migration complete',
      prefixTicketsFound: prefixTickets.length,
      existingAdminTickets: Array.isArray(existingAdminTickets) ? existingAdminTickets.length : 0,
      newTicketsMigrated: newTickets.length,
      totalAfterMigration: mergedTickets.length
    });
    
  } catch (error) {
    console.error('🔄 MIGRATION ERROR:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
