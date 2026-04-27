
import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const supportChatRouter = new Hono();

// Start a new chat session
supportChatRouter.post('/start', async (c) => {
  console.log('💬 Support Chat: Starting new session');
  try {
    const body = await c.req.json();
    console.log('💬 Support Chat: Request body:', body);
    
    const { userId, userEmail, userName } = body;
    
    // Generate a unique session ID
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData = {
      id: sessionId,
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      userName: userName || 'Guest',
      status: 'active',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messagesCount: 0
    };
    
    console.log('💬 Support Chat: Creating session:', sessionId);
    
    // Save session to KV
    await kv.set(`support_chat_session:${sessionId}`, JSON.stringify(sessionData));
    
    console.log('💬 Support Chat: Session saved successfully');
    
    return c.json({ 
      success: true, 
      sessionId,
      message: 'Chat session started' 
    });
  } catch (error) {
    console.error('❌ Support Chat Error (Start):', error);
    return c.json({ 
      error: error.message || 'Internal server error',
      stack: error.stack 
    }, 500);
  }
});

// Send a message
supportChatRouter.post('/send', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, message, role, senderName } = body;
    
    if (!sessionId || !message) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Get existing session
    const sessionStr = await kv.get(`support_chat_session:${sessionId}`);
    if (!sessionStr) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const session = JSON.parse(sessionStr);
    
    // Create message object
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: role || 'user', // user, agent, or system
      content: message,
      senderName: senderName || (role === 'agent' ? 'Support Agent' : session.userName),
      timestamp: new Date().toISOString()
    };
    
    // Get existing messages
    const messagesKey = `support_chat_messages:${sessionId}`;
    const messagesStr = await kv.get(messagesKey);
    let messages = messagesStr ? JSON.parse(messagesStr) : [];
    
    // Add new message
    messages.push(newMessage);
    
    // Save back to KV
    await kv.set(messagesKey, JSON.stringify(messages));
    
    // Update session
    session.lastActivity = new Date().toISOString();
    session.messagesCount = messages.length;
    session.lastMessage = message; // Preview
    
    // If user sent message and status was resolved, reopen it
    if (role === 'user' && session.status === 'resolved') {
      session.status = 'active';
    }
    
    await kv.set(`support_chat_session:${sessionId}`, JSON.stringify(session));
    
    return c.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('❌ Support Chat Error (Send):', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get chat history
supportChatRouter.get('/history', async (c) => {
  try {
    const sessionId = c.req.query('sessionId');
    
    if (!sessionId) {
      return c.json({ error: 'Session ID required' }, 400);
    }
    
    const messagesStr = await kv.get(`support_chat_messages:${sessionId}`);
    const messages = messagesStr ? JSON.parse(messagesStr) : [];
    
    return c.json({ messages });
  } catch (error) {
    console.error('❌ Support Chat Error (History):', error);
    return c.json({ error: error.message }, 500);
  }
});

// List all active sessions (Admin)
supportChatRouter.get('/list', async (c) => {
  try {
    const sessionsRaw = await kv.getByPrefix('support_chat_session:');
    
    const sessions = sessionsRaw.map((s: string) => {
      try {
        return JSON.parse(s);
      } catch (e) {
        return null;
      }
    }).filter((s: any) => s !== null);
    
    // Sort by last activity desc
    sessions.sort((a: any, b: any) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
    
    return c.json({ sessions });
  } catch (error) {
    console.error('❌ Support Chat Error (List):', error);
    return c.json({ error: error.message }, 500);
  }
});

// Admin endpoints for resolving/updating status
supportChatRouter.post('/status', async (c) => {
  try {
    const { sessionId, status } = await c.req.json();
    
    const sessionStr = await kv.get(`support_chat_session:${sessionId}`);
    if (!sessionStr) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    const session = JSON.parse(sessionStr);
    session.status = status;
    session.updatedAt = new Date().toISOString();
    
    await kv.set(`support_chat_session:${sessionId}`, JSON.stringify(session));
    
    return c.json({ success: true, session });
  } catch (error) {
    console.error('❌ Support Chat Error (Status):', error);
    return c.json({ error: error.message }, 500);
  }
});

export default supportChatRouter;
