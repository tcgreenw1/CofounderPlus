import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';
import { sendPushNotification } from './push-notification-helper.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supportRoutes = new Hono();

// Helper function: Create an in-app notification
async function createNotification(businessId: string, userId: string, notification: any) {
  try {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullNotification = {
      id: notificationId,
      businessId,
      userId,
      ...notification,
      read: false,
      status: 'unread',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    // Store in KV
    const kvKey = `notification:${businessId}:${userId}:${notificationId}`;
    await kv.set(kvKey, fullNotification);

    console.log(`ℹ️ Notification created:`, {
      title: notification.title,
      key: kvKey,
      businessId,
      userId,
      status: fullNotification.status,
      expiresAt: fullNotification.expiresAt
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
}

// Admin emails - users who should receive support ticket notifications
const ADMIN_EMAILS = ['tylerg@cofounderplus.com', 'admin@cofounderplus.com'];

// Support ticket types
const SUPPORT_TYPES = [
  'technical-issue',
  'billing-question',
  'feature-request',
  'account-help',
  'roadmap-question',
  'business-setup',
  'operations-help',
  'general-inquiry',
  'bug-report',
  'partnership-inquiry'
];

// Support ticket statuses
const TICKET_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  WAITING_FOR_USER: 'waiting-for-user',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

// Generate unique ticket ID
function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ticket_${timestamp}_${random}`;
}

// Create support ticket
supportRoutes.post('/create', async (c) => {
  try {
    const { subject, message, type, priority = 'medium', userEmail, userId } = await c.req.json();

    // Validate input
    if (!subject?.trim() || !message?.trim() || !type || !userEmail || !userId) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: subject, message, type, userEmail, userId' 
      }, 400);
    }

    if (!SUPPORT_TYPES.includes(type)) {
      return c.json({ 
        success: false, 
        error: `Invalid support type. Must be one of: ${SUPPORT_TYPES.join(', ')}` 
      }, 400);
    }

    const ticketId = generateTicketId();
    const timestamp = new Date().toISOString();

    const ticket = {
      id: ticketId,
      subject: subject.trim(),
      message: message.trim(),
      type,
      priority,
      status: TICKET_STATUSES.OPEN,
      userEmail,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: [
        {
          id: `msg_${Date.now()}`,
          content: message.trim(),
          sender: 'user',
          senderEmail: userEmail,
          timestamp
        }
      ],
      tags: [type],
      assignedTo: null,
      resolvedAt: null
    };

    // Store the ticket
    await kv.set(`support_ticket:${ticketId}`, ticket);
    
    // Add to user's tickets list
    const userTicketsKey = `user_tickets:${userId}`;
    const existingTickets = await kv.get(userTicketsKey) || [];
    existingTickets.push(ticketId);
    await kv.set(userTicketsKey, existingTickets);

    // Add to global tickets list for admin
    const allTicketsKey = 'support_tickets:all';
    const allTickets = await kv.get(allTicketsKey) || [];
    allTickets.push(ticketId);
    await kv.set(allTicketsKey, allTickets);

    // Add to type-specific list
    const typeTicketsKey = `support_tickets:type:${type}`;
    const typeTickets = await kv.get(typeTicketsKey) || [];
    typeTickets.push(ticketId);
    await kv.set(typeTicketsKey, typeTickets);

    console.log(`Support ticket created: ${ticketId} for user ${userEmail}`);

    // Send push notification to admin users
    try {
      // Get all admin user IDs by their emails
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      for (const adminEmail of ADMIN_EMAILS) {
        try {
          // Get admin user ID from email
          const { data: adminUsers } = await supabaseClient.auth.admin.listUsers();
          const adminUser = adminUsers?.users?.find(u => u.email === adminEmail);
          
          if (adminUser) {
            // Create notification category based on priority
            const notificationCategory = priority === 'urgent' || priority === 'high' 
              ? 'support_urgent' 
              : 'support_ticket';

            // Send push notification with action button
            await sendPushNotification({
              userId: adminUser.id,
              title: `New ${priority} support ticket`,
              message: `${subject} - from ${userEmail}`,
              category: notificationCategory,
              data: {
                ticketId,
                subject,
                userEmail,
                priority,
                type,
                action: 'open_ticket',
                url: `/admin?tab=support&ticketId=${ticketId}`
              },
              badge: 1
            });

            console.log(`📱 Sent push notification to admin: ${adminEmail}`);
          }
        } catch (adminError) {
          console.error(`Failed to send push notification to admin ${adminEmail}:`, adminError);
          // Continue to next admin even if one fails
        }
      }
    } catch (notificationError) {
      console.error('Error sending admin push notifications:', notificationError);
      // Don't fail ticket creation if notification fails
    }

    return c.json({ 
      success: true, 
      ticketId,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create support ticket' 
    }, 500);
  }
});

// Get user's tickets
supportRoutes.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }

    const userTicketsKey = `user_tickets:${userId}`;
    const ticketIds = await kv.get(userTicketsKey) || [];
    
    const tickets = [];
    for (const ticketId of ticketIds) {
      const ticket = await kv.get(`support_ticket:${ticketId}`);
      if (ticket) {
        // Return basic ticket info (not full messages for list view)
        tickets.push({
          id: ticket.id,
          subject: ticket.subject,
          type: ticket.type,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          messageCount: ticket.messages?.length || 0,
          lastMessage: ticket.messages?.[ticket.messages.length - 1]?.timestamp || ticket.createdAt
        });
      }
    }

    // Sort by most recent first
    tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return c.json({ success: true, tickets });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return c.json({ success: false, error: 'Failed to fetch tickets' }, 500);
  }
});

// Get specific ticket details
supportRoutes.get('/ticket/:ticketId', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    
    if (!ticketId) {
      return c.json({ success: false, error: 'Ticket ID is required' }, 400);
    }

    const ticket = await kv.get(`support_ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }

    return c.json({ success: true, ticket });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return c.json({ success: false, error: 'Failed to fetch ticket' }, 500);
  }
});

// Add message to ticket (user or admin)
supportRoutes.post('/ticket/:ticketId/message', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    const { message, senderEmail, isAdmin = false } = await c.req.json();

    if (!ticketId || !message?.trim() || !senderEmail) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: message, senderEmail' 
      }, 400);
    }

    const ticket = await kv.get(`support_ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }

    const timestamp = new Date().toISOString();
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      content: message.trim(),
      sender: isAdmin ? 'admin' : 'user',
      senderEmail,
      timestamp
    };

    // Add message to ticket
    ticket.messages.push(newMessage);
    ticket.updatedAt = timestamp;

    // Update status if admin is responding
    if (isAdmin && ticket.status === TICKET_STATUSES.OPEN) {
      ticket.status = TICKET_STATUSES.IN_PROGRESS;
    } else if (!isAdmin && ticket.status === TICKET_STATUSES.WAITING_FOR_USER) {
      ticket.status = TICKET_STATUSES.IN_PROGRESS;
    }

    // Save updated ticket
    await kv.set(`support_ticket:${ticketId}`, ticket);

    console.log(`Message added to ticket ${ticketId} by ${senderEmail} (${isAdmin ? 'admin' : 'user'})`);

    // If admin is replying, create in-app notification for the user
    if (isAdmin && ticket.userId) {
      console.log(`📬 Creating in-app notification for user ${ticket.userId} about admin reply on ticket ${ticketId}`);
      
      try {
        // Get user's business ID (if they have one) - try to find it
        let businessId = 'default';
        const userBusinessKey = `user_business:${ticket.userId}`;
        const userBusiness = await kv.get(userBusinessKey);
        if (userBusiness && userBusiness.businessId) {
          businessId = userBusiness.businessId;
        }
        
        // Create in-app notification
        await createNotification(businessId, ticket.userId, {
          title: 'Support Ticket Reply',
          message: `New reply to: ${ticket.subject}`,
          type: 'info',
          category: 'support',
          actionUrl: `/support?ticket=${ticketId}`,
          data: {
            ticketId: ticket.id,
            ticketSubject: ticket.subject,
            type: 'admin_reply'
          }
        });

        console.log(`✅ In-app notification created for user ${ticket.userId}`);
      } catch (notifError) {
        console.error(`❌ Failed to create in-app notification:`, notifError);
        // Don't fail the reply if notification fails
      }

      // Also send push notification
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
        console.log(`📱 Push notification sent to user ${ticket.userId}`);
      } catch (pushError) {
        console.error(`❌ Failed to send push notification:`, pushError);
        // Don't fail the reply if push notification fails
      }
    }

    return c.json({ 
      success: true, 
      message: newMessage,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        updatedAt: ticket.updatedAt
      }
    });

  } catch (error) {
    console.error('Error adding message to ticket:', error);
    return c.json({ success: false, error: 'Failed to add message' }, 500);
  }
});

// Update ticket status (admin or user for resolving own tickets)
supportRoutes.patch('/ticket/:ticketId/status', async (c) => {
  try {
    const ticketId = c.req.param('ticketId');
    const { status, adminEmail, userEmail } = await c.req.json();

    if (!ticketId || !status) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: status' 
      }, 400);
    }

    // Check if user is admin OR if user is marking their own ticket as resolved
    const isAdmin = adminEmail && (
      adminEmail.includes('admin@cofounderplus.com') || 
      adminEmail.includes('tylerg@cofounderplus.com')
    );
    
    const isUserResolvingOwnTicket = userEmail && status === TICKET_STATUSES.RESOLVED;
    
    if (!isAdmin && !isUserResolvingOwnTicket) {
      return c.json({ success: false, error: 'Unauthorized - users can only mark their own tickets as resolved' }, 403);
    }

    const ticket = await kv.get(`support_ticket:${ticketId}`);
    
    if (!ticket) {
      return c.json({ success: false, error: 'Ticket not found' }, 404);
    }

    // If user is resolving own ticket, verify they own the ticket
    if (!isAdmin && isUserResolvingOwnTicket) {
      if (ticket.userEmail !== userEmail) {
        return c.json({ success: false, error: 'Unauthorized - you can only resolve your own tickets' }, 403);
      }
    }

    if (!Object.values(TICKET_STATUSES).includes(status)) {
      return c.json({ 
        success: false, 
        error: `Invalid status. Must be one of: ${Object.values(TICKET_STATUSES).join(', ')}` 
      }, 400);
    }

    const timestamp = new Date().toISOString();
    const oldStatus = ticket.status;
    
    ticket.status = status;
    ticket.updatedAt = timestamp;
    
    if (status === TICKET_STATUSES.RESOLVED || status === TICKET_STATUSES.CLOSED) {
      ticket.resolvedAt = timestamp;
    }

    // Add system message for status change
    const actorType = isAdmin ? 'admin' : 'user';
    const actorEmail = isAdmin ? adminEmail : userEmail;
    const systemMessage = {
      id: `msg_${Date.now()}_system`,
      content: `Status changed from "${oldStatus}" to "${status}" by ${actorType}`,
      sender: 'system',
      senderEmail: actorEmail,
      timestamp
    };
    
    ticket.messages.push(systemMessage);

    // Save updated ticket
    await kv.set(`support_ticket:${ticketId}`, ticket);

    console.log(`Ticket ${ticketId} status updated to ${status} by ${actorEmail} (${actorType})`);

    return c.json({ 
      success: true, 
      ticket: {
        id: ticket.id,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt
      }
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    return c.json({ success: false, error: 'Failed to update ticket status' }, 500);
  }
});

// Get all tickets (admin only) - Enhanced with pagination and filtering
supportRoutes.get('/admin/all', async (c) => {
  try {
    // Get admin email from request headers or query
    const adminEmail = c.req.header('x-admin-email') || c.req.query('adminEmail');
    
    // Verify admin user
    if (!adminEmail?.includes('admin@cofounderplus.com') && !adminEmail?.includes('tylerg@cofounderplus.com')) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    // Get pagination and filter parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '25');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || 'all';
    const type = c.req.query('type') || 'all';
    const priority = c.req.query('priority') || 'all';
    const assignee = c.req.query('assignee') || 'all';
    const sortBy = c.req.query('sortBy') || 'updatedAt';
    const sortOrder = c.req.query('sortOrder') || 'desc';

    const allTicketsKey = 'support_tickets:all';
    const ticketIds = await kv.get(allTicketsKey) || [];
    
    let allTickets = [];
    for (const ticketId of ticketIds) {
      const ticket = await kv.get(`support_ticket:${ticketId}`);
      if (ticket) {
        allTickets.push(ticket);
      }
    }

    // Apply filters
    let filteredTickets = allTickets.filter(ticket => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !ticket.subject.toLowerCase().includes(searchLower) &&
          !ticket.userEmail.toLowerCase().includes(searchLower) &&
          !ticket.id.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (status !== 'all' && ticket.status !== status) {
        return false;
      }

      // Type filter
      if (type !== 'all' && ticket.type !== type) {
        return false;
      }

      // Priority filter
      if (priority !== 'all' && ticket.priority !== priority) {
        return false;
      }

      // Assignee filter
      if (assignee !== 'all' && ticket.assignedTo !== assignee) {
        return false;
      }

      return true;
    });

    // Sort tickets
    filteredTickets.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[a.priority] || 2;
          bValue = priorityOrder[b.priority] || 2;
          break;
        case 'status':
          const statusOrder = { 'open': 0, 'in-progress': 1, 'waiting-for-user': 2, 'resolved': 3, 'closed': 4 };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    // Calculate pagination
    const totalItems = filteredTickets.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get paginated tickets
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    
    const tickets = paginatedTickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      userEmail: ticket.userEmail,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messageCount: ticket.messages?.length || 0,
      lastMessage: ticket.messages?.[ticket.messages.length - 1]?.content?.substring(0, 100) + '...' || '',
      assignedTo: ticket.assignedTo
    }));

    // Get enhanced summary stats
    const stats = {
      total: totalItems,
      open: filteredTickets.filter(t => t.status === TICKET_STATUSES.OPEN).length,
      inProgress: filteredTickets.filter(t => t.status === TICKET_STATUSES.IN_PROGRESS).length,
      waitingForUser: filteredTickets.filter(t => t.status === TICKET_STATUSES.WAITING_FOR_USER).length,
      resolved: filteredTickets.filter(t => t.status === TICKET_STATUSES.RESOLVED).length,
      closed: filteredTickets.filter(t => t.status === TICKET_STATUSES.CLOSED).length,
      byType: {},
      avgResponseTime: 0,
      ticketsToday: filteredTickets.filter(t => {
        const today = new Date();
        const ticketDate = new Date(t.createdAt);
        return ticketDate.toDateString() === today.toDateString();
      }).length,
      ticketsThisWeek: filteredTickets.filter(t => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const ticketDate = new Date(t.createdAt);
        return ticketDate >= weekAgo;
      }).length
    };

    // Count by type
    SUPPORT_TYPES.forEach(type => {
      stats.byType[type] = filteredTickets.filter(t => t.type === type).length;
    });

    // Calculate average response time (simplified)
    const responseTimes = filteredTickets
      .filter(t => t.messages && t.messages.length > 1)
      .map(t => {
        const firstMessage = t.messages[0];
        const firstAdminMessage = t.messages.find(m => m.sender === 'admin');
        if (firstAdminMessage) {
          return new Date(firstAdminMessage.timestamp).getTime() - new Date(firstMessage.timestamp).getTime();
        }
        return 0;
      })
      .filter(time => time > 0);

    if (responseTimes.length > 0) {
      const avgMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      stats.avgResponseTime = Math.round(avgMs / (1000 * 60 * 60)); // Convert to hours
    }

    const pagination = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit
    };

    return c.json({ success: true, tickets, stats, pagination });

  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    return c.json({ success: false, error: 'Failed to fetch tickets' }, 500);
  }
});

// Generate test data for development (admin only)
supportRoutes.post('/admin/generate-test-data', async (c) => {
  try {
    // Get admin email from request headers
    const adminEmail = c.req.header('x-admin-email');
    
    // Verify admin user
    if (!adminEmail?.includes('admin@cofounderplus.com') && !adminEmail?.includes('tylerg@cofounderplus.com')) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const { count = 50 } = await c.req.json();

    const testUsers = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'bob.johnson@example.com',
      'alice.williams@example.com',
      'charlie.brown@example.com',
      'diana.davis@example.com',
      'evan.miller@example.com',
      'fiona.wilson@example.com',
      'george.moore@example.com',
      'helen.taylor@example.com'
    ];

    const testSubjects = [
      'Having trouble with business setup',
      'Questions about roadmap progression',
      'Unable to access finance operations',
      'Marketing tools not working',
      'Billing inquiry about subscription',
      'Feature request for new functionality',
      'Technical issue with dashboard',
      'Account help needed',
      'Partnership inquiry',
      'Bug report - app crashes',
      'Need help with product creation',
      'Sales operations questions',
      'HR management features',
      'General inquiry about platform',
      'Roadmap questions for retail industry',
      'Unable to save changes in operations',
      'Request for business name suggestions',
      'Issues with Google OAuth login',
      'Questions about pro features',
      'Help with business analytics'
    ];

    const testMessages = [
      'Hi, I need help with setting up my business. I\'m not sure how to get started with the roadmap.',
      'I\'m having trouble accessing the finance operations section. It says I need pro access, but I thought this was included.',
      'The marketing tools page isn\'t loading properly. I get a blank screen when I try to open it.',
      'I have a question about my billing. I was charged twice this month and need clarification.',
      'Could you please add a feature to export data? This would be very helpful for my business reporting.',
      'The app keeps crashing when I try to save my business information. This is very frustrating.',
      'I need help understanding how to progress through the roadmap. Some steps are confusing.',
      'I\'m interested in partnering with your platform. Who should I contact about business development?',
      'There seems to be a bug in the product creation form. The submit button doesn\'t work.',
      'I can\'t log in with my Google account. The authentication flow gets stuck.',
      'What pro features are available? I\'m considering upgrading my account.',
      'I need help with the HR management section. How do I add team members?',
      'The business analytics are not showing correct data. Can you help me troubleshoot?',
      'How do I change my business information after initial setup?',
      'I love the platform! Just wanted to provide some positive feedback.',
      'The roadmap for my industry seems incomplete. Will there be updates?',
      'I\'m getting permission errors when trying to access certain features.',
      'Can you help me understand the difference between free and pro features?',
      'The mobile app has some usability issues. The text is too small.',
      'I need assistance with setting up recurring transactions in finance.'
    ];

    const generatedTickets = [];

    for (let i = 0; i < count; i++) {
      const ticketId = generateTicketId();
      const userEmail = testUsers[Math.floor(Math.random() * testUsers.length)];
      const userId = `test_user_${Math.random().toString(36).substring(2, 8)}`;
      const subject = testSubjects[Math.floor(Math.random() * testSubjects.length)];
      const message = testMessages[Math.floor(Math.random() * testMessages.length)];
      const type = SUPPORT_TYPES[Math.floor(Math.random() * SUPPORT_TYPES.length)];
      const priority = ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)];
      const status = Object.values(TICKET_STATUSES)[Math.floor(Math.random() * Object.values(TICKET_STATUSES).length)];
      
      // Random date within last 30 days
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Updated date between created and now
      const updatedAt = new Date(new Date(createdAt).getTime() + Math.random() * (Date.now() - new Date(createdAt).getTime())).toISOString();

      const messages = [
        {
          id: `msg_${Date.now()}_${i}`,
          content: message,
          sender: 'user',
          senderEmail: userEmail,
          timestamp: createdAt
        }
      ];

      // Randomly add admin responses to some tickets
      if (Math.random() > 0.3) {
        const adminResponses = [
          'Thank you for contacting us. I\'ll look into this issue and get back to you shortly.',
          'I understand your concern. Let me help you resolve this problem.',
          'This is a known issue and our team is working on a fix. I\'ll keep you updated.',
          'I\'ve escalated this to our development team. You should see a resolution soon.',
          'Thanks for the feedback! I\'ve forwarded your suggestion to our product team.',
          'I\'ve checked your account and everything looks correct. Can you try again?',
          'I\'ve updated your account settings. Please try accessing the feature now.',
          'This has been resolved. Please let me know if you continue to experience issues.'
        ];
        
        const adminResponse = adminResponses[Math.floor(Math.random() * adminResponses.length)];
        const adminTimestamp = new Date(new Date(createdAt).getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString();
        
        messages.push({
          id: `msg_${Date.now()}_${i}_admin`,
          content: adminResponse,
          sender: 'admin',
          senderEmail: adminEmail,
          timestamp: adminTimestamp
        });
      }

      const ticket = {
        id: ticketId,
        subject,
        message,
        type,
        priority,
        status,
        userEmail,
        userId,
        createdAt,
        updatedAt,
        messages,
        tags: [type],
        assignedTo: Math.random() > 0.7 ? adminEmail : null,
        resolvedAt: status === TICKET_STATUSES.RESOLVED || status === TICKET_STATUSES.CLOSED ? updatedAt : null
      };

      // Store the ticket
      await kv.set(`support_ticket:${ticketId}`, ticket);
      
      // Add to user's tickets list
      const userTicketsKey = `user_tickets:${userId}`;
      const existingUserTickets = await kv.get(userTicketsKey) || [];
      existingUserTickets.push(ticketId);
      await kv.set(userTicketsKey, existingUserTickets);

      // Add to global tickets list
      const allTicketsKey = 'support_tickets:all';
      const allTickets = await kv.get(allTicketsKey) || [];
      allTickets.push(ticketId);
      await kv.set(allTicketsKey, allTickets);

      // Add to type-specific list
      const typeTicketsKey = `support_tickets:type:${type}`;
      const typeTickets = await kv.get(typeTicketsKey) || [];
      typeTickets.push(ticketId);
      await kv.set(typeTicketsKey, typeTickets);

      generatedTickets.push(ticketId);
    }

    console.log(`Generated ${count} test support tickets for admin ${adminEmail}`);

    return c.json({ 
      success: true, 
      message: `Successfully generated ${count} test support tickets`,
      ticketIds: generatedTickets
    });

  } catch (error) {
    console.error('Error generating test data:', error);
    return c.json({ success: false, error: 'Failed to generate test data' }, 500);
  }
});

// Bulk update tickets (admin only)
supportRoutes.patch('/admin/bulk-update', async (c) => {
  try {
    // Get admin email from request headers
    const adminEmail = c.req.header('x-admin-email');
    
    // Verify admin user
    if (!adminEmail?.includes('admin@cofounderplus.com') && !adminEmail?.includes('tylerg@cofounderplus.com')) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const { ticketIds, updates } = await c.req.json();

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return c.json({ success: false, error: 'No ticket IDs provided' }, 400);
    }

    if (!updates || typeof updates !== 'object') {
      return c.json({ success: false, error: 'No updates provided' }, 400);
    }

    const results = [];
    const timestamp = new Date().toISOString();

    for (const ticketId of ticketIds) {
      try {
        const ticket = await kv.get(`support_ticket:${ticketId}`);
        
        if (!ticket) {
          results.push({ ticketId, success: false, error: 'Ticket not found' });
          continue;
        }

        // Apply updates
        if (updates.status && Object.values(TICKET_STATUSES).includes(updates.status)) {
          const oldStatus = ticket.status;
          ticket.status = updates.status;
          ticket.updatedAt = timestamp;
          
          if (updates.status === TICKET_STATUSES.RESOLVED || updates.status === TICKET_STATUSES.CLOSED) {
            ticket.resolvedAt = timestamp;
          }

          // Add system message for status change
          const systemMessage = {
            id: `msg_${Date.now()}_bulk_${Math.random().toString(36).substring(2, 8)}`,
            content: `Status changed from "${oldStatus}" to "${updates.status}" by admin (bulk update)`,
            sender: 'system',
            senderEmail: adminEmail,
            timestamp
          };
          
          ticket.messages.push(systemMessage);
        }

        if (updates.assignedTo !== undefined) {
          ticket.assignedTo = updates.assignedTo;
          ticket.updatedAt = timestamp;

          // Add system message for assignment change
          const systemMessage = {
            id: `msg_${Date.now()}_assign_${Math.random().toString(36).substring(2, 8)}`,
            content: `Ticket ${updates.assignedTo ? `assigned to ${updates.assignedTo}` : 'unassigned'} by admin (bulk update)`,
            sender: 'system',
            senderEmail: adminEmail,
            timestamp
          };
          
          ticket.messages.push(systemMessage);
        }

        // Save updated ticket
        await kv.set(`support_ticket:${ticketId}`, ticket);
        
        results.push({ ticketId, success: true });

      } catch (error) {
        console.error(`Error updating ticket ${ticketId}:`, error);
        results.push({ ticketId, success: false, error: 'Update failed' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Bulk update completed by ${adminEmail}: ${successCount} successful, ${failCount} failed`);

    return c.json({ 
      success: true, 
      message: `Bulk update completed: ${successCount} successful, ${failCount} failed`,
      results
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    return c.json({ success: false, error: 'Failed to bulk update tickets' }, 500);
  }
});

// Get support types and statuses
supportRoutes.get('/config', async (c) => {
  return c.json({
    success: true,
    config: {
      types: SUPPORT_TYPES.map(type => ({
        value: type,
        label: type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      })),
      statuses: Object.values(TICKET_STATUSES),
      priorities: ['low', 'medium', 'high', 'urgent']
    }
  });
});

export default supportRoutes;