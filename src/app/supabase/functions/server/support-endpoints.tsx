import { Hono } from 'npm:hono@4';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';
import { sendPushNotification } from './push-notification-helper.tsx';

/**
 * Support Ticket Endpoints
 * Handles support ticket creation, retrieval, and updates
 */

const app = new Hono();

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Helper to verify user authentication
async function getUserFromToken(authHeader: string | null, supabase: any) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// Helper to check if user is admin
function isAdminUser(email: string): boolean {
  const adminEmails = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];
  return adminEmails.includes(email);
}

/**
 * GET /support/ticket/:ticketId
 * Get a single ticket by ID
 */
app.get('/ticket/:ticketId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const ticketId = c.req.param('ticketId');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Check if user is admin
    const isAdmin = isAdminUser(user.email || '');
    
    // Get ticket. First try fetching from admin tickets if admin, then user tickets.
    // For simplicity and to ensure we get the latest, we'll try to find it in admin tickets first if admin.
    
    let ticket = null;
    
    if (isAdmin) {
      const adminTicketsKey = `admin:support_tickets`;
      const adminTickets = await kv.get(adminTicketsKey) || [];
      if (Array.isArray(adminTickets)) {
        ticket = adminTickets.find((t: any) => t.id === ticketId);
      }
    }
    
    if (!ticket) {
      // Try to find in user tickets (if not admin, or if not found in admin list)
      // Note: If admin, we don't know the userId of the ticket owner easily without scanning all users or having it in admin list.
      // Assuming admin list has all tickets.
      
      if (!isAdmin) {
        // Find in current user's tickets
        const ticketsKey = `user:${user.id}:support_tickets`;
        const userTickets = await kv.get(ticketsKey) || [];
        if (Array.isArray(userTickets)) {
          ticket = userTickets.find((t: any) => t.id === ticketId);
        }
      }
    }
    
    if (!ticket) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    return c.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch ticket',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /support/ticket/:ticketId/message
 * Add a message to a ticket (path param style)
 */
app.post('/ticket/:ticketId/message', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const ticketId = c.req.param('ticketId');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { message, isAdmin } = body; // isAdmin flag from body, but verify with real check
    
    if (!message) {
      return c.json({ 
        success: false, 
        error: 'Message is required' 
      }, 400);
    }
    
    // Verify admin status if trying to post as admin
    const isRealAdmin = isAdminUser(user.email || '');
    if (isAdmin && !isRealAdmin) {
      return c.json({ success: false, error: 'Unauthorized - Admin only' }, 403);
    }
    
    const sender = isRealAdmin && isAdmin ? 'admin' : 'user';
    
    // We need to update both admin list and user list
    // First, find the ticket in admin list (it's the master source of truth usually)
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    
    let ticket: any = null;
    let ticketIndex = -1;
    
    if (Array.isArray(adminTickets)) {
      ticketIndex = adminTickets.findIndex((t: any) => t.id === ticketId);
      if (ticketIndex !== -1) {
        ticket = adminTickets[ticketIndex];
      }
    }
    
    if (!ticket) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    // Add new message
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender,
      senderEmail: user.email,
      message,
      timestamp: new Date().toISOString()
    };
    
    ticket.messages = [...(ticket.messages || []), newMessage];
    ticket.updatedAt = new Date().toISOString();
    if (sender === 'user') {
      ticket.status = 'open'; // Reopen if user replies
    }
    
    // Update admin list
    adminTickets[ticketIndex] = ticket;
    await kv.set(adminTicketsKey, adminTickets);
    
    // Update user list
    if (ticket.userId) {
      const userTicketsKey = `user:${ticket.userId}:support_tickets`;
      const userTickets = await kv.get(userTicketsKey) || [];
      if (Array.isArray(userTickets)) {
        const userTicketIndex = userTickets.findIndex((t: any) => t.id === ticketId);
        if (userTicketIndex !== -1) {
          userTickets[userTicketIndex] = ticket;
          await kv.set(userTicketsKey, userTickets);
        }
      }
      
      // Send push notification if reply from admin
      if (sender === 'admin') {
        console.log(`📱 Sending support ticket reply notification to user ${ticket.userId}`);
        try {
          await sendPushNotification({
            userId: ticket.userId,
            title: 'Support Ticket Reply',
            message: `New reply to: ${ticket.subject}`,
            category: 'support_ticket',
            data: {
              ticketId: ticket.id,
              type: 'admin_reply',
              actionUrl: `/support?ticket=${ticket.id}`
            }
          });
        } catch (pushError) {
          console.error('Failed to send push notification:', pushError);
        }
      }
    }
    
    return c.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    return c.json({
      success: false,
      error: 'Failed to add message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * PATCH /support/ticket/:ticketId/status
 * Update ticket status (path param style)
 */
app.patch('/ticket/:ticketId/status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const ticketId = c.req.param('ticketId');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user || !isAdminUser(user.email || '')) {
      return c.json({ success: false, error: 'Unauthorized - Admin only' }, 403);
    }
    
    const body = await c.req.json();
    const { status } = body;
    
    if (!status) {
      return c.json({ 
        success: false, 
        error: 'Status is required' 
      }, 400);
    }
    
    // Get admin tickets
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    
    if (!Array.isArray(adminTickets)) {
      return c.json({ success: false, error: 'Invalid tickets data' }, 500);
    }
    
    // Find and update the ticket
    const ticketIndex = adminTickets.findIndex((t: any) => t.id === ticketId);
    
    if (ticketIndex === -1) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    const ticket = adminTickets[ticketIndex];
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    
    adminTickets[ticketIndex] = ticket;
    
    // Save updated admin tickets
    await kv.set(adminTicketsKey, adminTickets);
    
    // Also update user's tickets
    if (ticket.userId) {
      const userTicketsKey = `user:${ticket.userId}:support_tickets`;
      const userTickets = await kv.get(userTicketsKey) || [];
      if (Array.isArray(userTickets)) {
        const userTicketIndex = userTickets.findIndex((t: any) => t.id === ticketId);
        if (userTicketIndex !== -1) {
          userTickets[userTicketIndex] = ticket;
          await kv.set(userTicketsKey, userTickets);
        }
      }
    }
    
    return c.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return c.json({
      success: false,
      error: 'Failed to update ticket status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /support/user-tickets
 * Get all support tickets for the authenticated user
 */
app.get('/user-tickets', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get user's support tickets from KV store
    const ticketsKey = `user:${user.id}:support_tickets`;
    const tickets = await kv.get(ticketsKey) || [];
    
    // Sort by most recent first
    const sortedTickets = Array.isArray(tickets) 
      ? tickets.sort((a: any, b: any) => 
          new Date(b.updatedAt || b.createdAt).getTime() - 
          new Date(a.updatedAt || a.createdAt).getTime()
        )
      : [];
    
    return c.json({
      success: true,
      tickets: sortedTickets
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch support tickets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /support/create-ticket
 * Create a new support ticket
 */
app.post('/create-ticket', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { subject, message, category, priority = 'medium' } = body;
    
    if (!subject || !message) {
      return c.json({ 
        success: false, 
        error: 'Subject and message are required' 
      }, 400);
    }
    
    // Get existing tickets
    const ticketsKey = `user:${user.id}:support_tickets`;
    const existingTickets = await kv.get(ticketsKey) || [];
    
    // Create new ticket
    const newTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      userEmail: user.email,
      subject,
      category: category || 'general',
      type: category || 'general', // Alias for frontend compatibility
      priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'user',
          message,
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    // Add to tickets array
    const updatedTickets = Array.isArray(existingTickets) 
      ? [...existingTickets, newTicket]
      : [newTicket];
    
    // Save to KV store
    await kv.set(ticketsKey, updatedTickets);
    
    // Also save to admin view for support team
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    const updatedAdminTickets = Array.isArray(adminTickets)
      ? [...adminTickets, newTicket]
      : [newTicket];
    await kv.set(adminTicketsKey, updatedAdminTickets);
    
    return c.json({
      success: true,
      ticket: newTicket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return c.json({
      success: false,
      error: 'Failed to create support ticket',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /support/add-message
 * Add a message to an existing ticket
 */
app.post('/add-message', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { ticketId, message } = body;
    
    if (!ticketId || !message) {
      return c.json({ 
        success: false, 
        error: 'Ticket ID and message are required' 
      }, 400);
    }
    
    // Get user's tickets
    const ticketsKey = `user:${user.id}:support_tickets`;
    const tickets = await kv.get(ticketsKey) || [];
    
    if (!Array.isArray(tickets)) {
      return c.json({ success: false, error: 'Invalid tickets data' }, 500);
    }
    
    // Find and update the ticket
    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
    
    if (ticketIndex === -1) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    const ticket = tickets[ticketIndex];
    
    // Add new message
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      message,
      timestamp: new Date().toISOString()
    };
    
    ticket.messages = [...(ticket.messages || []), newMessage];
    ticket.updatedAt = new Date().toISOString();
    ticket.status = 'open'; // Reopen if closed
    
    tickets[ticketIndex] = ticket;
    
    // Save updated tickets
    await kv.set(ticketsKey, tickets);
    
    // Also update admin view
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    if (Array.isArray(adminTickets)) {
      const adminTicketIndex = adminTickets.findIndex((t: any) => t.id === ticketId);
      if (adminTicketIndex !== -1) {
        adminTickets[adminTicketIndex] = ticket;
        await kv.set(adminTicketsKey, adminTickets);
      }
    }
    
    return c.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    return c.json({
      success: false,
      error: 'Failed to add message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * PUT /support/update-status
 * Update ticket status (admin only)
 */
app.put('/update-status', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user || !isAdminUser(user.email || '')) {
      return c.json({ success: false, error: 'Unauthorized - Admin only' }, 403);
    }
    
    const body = await c.req.json();
    const { ticketId, status } = body;
    
    if (!ticketId || !status) {
      return c.json({ 
        success: false, 
        error: 'Ticket ID and status are required' 
      }, 400);
    }
    
    // Get admin tickets
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    
    if (!Array.isArray(adminTickets)) {
      return c.json({ success: false, error: 'Invalid tickets data' }, 500);
    }
    
    // Find and update the ticket
    const ticketIndex = adminTickets.findIndex((t: any) => t.id === ticketId);
    
    if (ticketIndex === -1) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    const ticket = adminTickets[ticketIndex];
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    
    adminTickets[ticketIndex] = ticket;
    
    // Save updated admin tickets
    await kv.set(adminTicketsKey, adminTickets);
    
    // Also update user's tickets
    if (ticket.userId) {
      const userTicketsKey = `user:${ticket.userId}:support_tickets`;
      const userTickets = await kv.get(userTicketsKey) || [];
      if (Array.isArray(userTickets)) {
        const userTicketIndex = userTickets.findIndex((t: any) => t.id === ticketId);
        if (userTicketIndex !== -1) {
          userTickets[userTicketIndex] = ticket;
          await kv.set(userTicketsKey, userTickets);
        }
      }
    }
    
    return c.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return c.json({
      success: false,
      error: 'Failed to update ticket status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /support/admin/all
 * Get all support tickets (admin only) - Alias for all-tickets to match frontend
 */
app.get('/admin/all', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user || !isAdminUser(user.email || '')) {
      return c.json({ success: false, error: 'Unauthorized - Admin only' }, 403);
    }
    
    // Get all admin tickets
    const adminTicketsKey = `admin:support_tickets`;
    const tickets = await kv.get(adminTicketsKey) || [];
    
    // Calculate stats
    const stats = {
      total: Array.isArray(tickets) ? tickets.length : 0,
      open: Array.isArray(tickets) ? tickets.filter((t: any) => t.status === 'open').length : 0,
      inProgress: Array.isArray(tickets) ? tickets.filter((t: any) => t.status === 'in-progress').length : 0,
      resolved: Array.isArray(tickets) ? tickets.filter((t: any) => t.status === 'resolved').length : 0,
      closed: Array.isArray(tickets) ? tickets.filter((t: any) => t.status === 'closed').length : 0,
    };
    
    // Sort by most recent first
    const sortedTickets = Array.isArray(tickets)
      ? tickets.sort((a: any, b: any) => 
          new Date(b.updatedAt || b.createdAt).getTime() - 
          new Date(a.updatedAt || a.createdAt).getTime()
        )
      : [];
    
    return c.json({
      success: true,
      tickets: sortedTickets,
      stats
    });
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch admin tickets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /support/admin/all-tickets
 * Get all support tickets (admin only)
 */
app.get('/admin/all-tickets', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user || !isAdminUser(user.email || '')) {
      return c.json({ success: false, error: 'Unauthorized - Admin only' }, 403);
    }
    
    // Get all admin tickets
    const adminTicketsKey = `admin:support_tickets`;
    const tickets = await kv.get(adminTicketsKey) || [];
    
    // Sort by most recent first
    const sortedTickets = Array.isArray(tickets)
      ? tickets.sort((a: any, b: any) => 
          new Date(b.updatedAt || b.createdAt).getTime() - 
          new Date(a.updatedAt || a.createdAt).getTime()
        )
      : [];
    
    return c.json({
      success: true,
      tickets: sortedTickets
    });
  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch admin tickets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /support/admin/reply
 * Admin reply to a ticket
 */
app.post('/admin/reply', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user || !isAdminUser(user.email || '')) {
      return c.json({ success: false, error: 'Unauthorized - Admin only' }, 403);
    }
    
    const body = await c.req.json();
    const { ticketId, message } = body;
    
    if (!ticketId || !message) {
      return c.json({ 
        success: false, 
        error: 'Ticket ID and message are required' 
      }, 400);
    }
    
    // Get admin tickets
    const adminTicketsKey = `admin:support_tickets`;
    const adminTickets = await kv.get(adminTicketsKey) || [];
    
    if (!Array.isArray(adminTickets)) {
      return c.json({ success: false, error: 'Invalid tickets data' }, 500);
    }
    
    // Find and update the ticket
    const ticketIndex = adminTickets.findIndex((t: any) => t.id === ticketId);
    
    if (ticketIndex === -1) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    const ticket = adminTickets[ticketIndex];
    
    // Add admin reply
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: 'admin',
      senderEmail: user.email,
      message,
      timestamp: new Date().toISOString()
    };
    
    ticket.messages = [...(ticket.messages || []), newMessage];
    ticket.updatedAt = new Date().toISOString();
    
    adminTickets[ticketIndex] = ticket;
    
    // Save updated admin tickets
    await kv.set(adminTicketsKey, adminTickets);
    
    // Also update user's tickets
    if (ticket.userId) {
      const userTicketsKey = `user:${ticket.userId}:support_tickets`;
      const userTickets = await kv.get(userTicketsKey) || [];
      if (Array.isArray(userTickets)) {
        const userTicketIndex = userTickets.findIndex((t: any) => t.id === ticketId);
        if (userTicketIndex !== -1) {
          userTickets[userTicketIndex] = ticket;
          await kv.set(userTicketsKey, userTickets);
        }
      }
      
      // Send push notification to user about admin reply
      console.log(`📱 Sending support ticket reply notification to user ${ticket.userId}`);
      try {
        await sendPushNotification({
          userId: ticket.userId,
          title: 'Support Ticket Reply',
          message: `New reply to: ${ticket.subject}`,
          category: 'support_ticket',
          data: {
            ticketId: ticket.id,
            type: 'admin_reply',
            actionUrl: `/support?ticket=${ticket.id}`
          }
        });
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError);
        // Continue even if push notification fails
      }
    }
    
    return c.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error adding admin reply:', error);
    return c.json({
      success: false,
      error: 'Failed to add reply',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /support/check-updates
 * Check for unread support ticket updates (admin replies/status changes)
 */
app.get('/check-updates', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get user's ticket IDs
    const ticketsKey = `user_tickets:${user.id}`;
    const ticketIds = await kv.get(ticketsKey) || [];
    
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return c.json({ success: true, hasUnread: false, unreadCount: 0 });
    }
    
    // Get read status tracking
    const readStatusKey = `user:${user.id}:support_read_status`;
    const readStatus = await kv.get(readStatusKey) || {};
    
    let unreadCount = 0;
    let lastUpdate: string | null = null;
    
    // Load each ticket and check for unread admin messages
    for (const ticketId of ticketIds) {
      const ticket = await kv.get(`support_ticket:${ticketId}`);
      
      if (!ticket) continue;
      
      const ticketReadStatus = readStatus[ticket.id] || {};
      const lastReadTime = ticketReadStatus.lastReadTime || ticket.createdAt;
      
      // Check if there are admin messages or status changes after last read
      const hasUnreadMessages = (ticket.messages || []).some((msg: any) => 
        msg.sender === 'admin' && msg.timestamp > lastReadTime
      );
      
      const hasStatusChange = ticketReadStatus.lastKnownStatus && 
        ticket.status !== ticketReadStatus.lastKnownStatus &&
        ticket.updatedAt > lastReadTime;
      
      if (hasUnreadMessages || hasStatusChange) {
        unreadCount++;
        if (!lastUpdate || ticket.updatedAt > lastUpdate) {
          lastUpdate = ticket.updatedAt;
        }
      }
    }
    
    console.log(`📬 Support check-updates for user ${user.id}: ${unreadCount} unread tickets`);
    
    return c.json({
      success: true,
      hasUnread: unreadCount > 0,
      unreadCount,
      lastUpdate
    });
  } catch (error) {
    console.error('Error checking support updates:', error);
    return c.json({
      success: false,
      error: 'Failed to check updates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /support/admin/generate-test-data
 * Generate test support tickets (admin only)
 */
app.post('/admin/generate-test-data', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user || !isAdminUser(user.email || '')) {
      return c.json({ success: false, error: 'Unauthorized - Admin only' }, 403);
    }
    
    const body = await c.req.json();
    const count = body.count || 10;
    
    const adminTicketsKey = `admin:support_tickets`;
    const currentTickets = await kv.get(adminTicketsKey) || [];
    const tickets = Array.isArray(currentTickets) ? [...currentTickets] : [];
    
    const categories = ['technical', 'billing', 'feature-request', 'partnership', 'general'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['open', 'in-progress', 'waiting-for-user', 'resolved', 'closed'];
    
    for (let i = 0; i < count; i++) {
      const id = `ticket_test_${Date.now()}_${i}`;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const ticket = {
        id,
        userId: user.id, // Assign to current admin for testing
        userEmail: `test_user_${i}@example.com`,
        subject: `Test Ticket ${i}: ${category} issue`,
        category,
        priority,
        status,
        type: category, // Frontend uses 'type', backend uses 'category' but let's keep consistency
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: Math.floor(Math.random() * 5) + 1,
        lastMessage: `This is a test message for ticket ${i}`,
        messages: [
          {
            id: `msg_${Date.now()}_${i}`,
            sender: 'user',
            senderEmail: `test_user_${i}@example.com`,
            message: `This is the initial message for test ticket ${i}. I am having trouble with ${category}.`,
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
          }
        ]
      };
      
      tickets.push(ticket);
    }
    
    await kv.set(adminTicketsKey, tickets);
    
    return c.json({
      success: true,
      count,
      message: `Generated ${count} test tickets`
    });
  } catch (error) {
    console.error('Error generating test data:', error);
    return c.json({
      success: false,
      error: 'Failed to generate test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /support/mark-read/:ticketId
 * Mark a support ticket as read
 */
app.post('/mark-read/:ticketId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const ticketId = c.req.param('ticketId');
    
    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const user = await getUserFromToken(authHeader, supabase);
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get user's tickets
    const ticketsKey = `user:${user.id}:support_tickets`;
    const tickets = await kv.get(ticketsKey) || [];
    
    const ticket = Array.isArray(tickets) 
      ? tickets.find((t: any) => t.id === ticketId)
      : null;
    
    if (!ticket) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }
    
    // Update read status
    const readStatusKey = `user:${user.id}:support_read_status`;
    const readStatus = await kv.get(readStatusKey) || {};
    
    readStatus[ticketId] = {
      lastReadTime: new Date().toISOString(),
      lastKnownStatus: ticket.status
    };
    
    await kv.set(readStatusKey, readStatus);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking ticket as read:', error);
    return c.json({
      success: false,
      error: 'Failed to mark as read',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;