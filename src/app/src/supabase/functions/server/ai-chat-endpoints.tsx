import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Initialize Supabase client
const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Operation limits for AI messages per subscription plan
const AI_MESSAGE_LIMITS = {
  free: 50,
  creator: 200,
  builder: 2000,
  studio: 20000
};

// Get user subscription tier
const getUserSubscriptionTier = async (userId: string): Promise<string> => {
  try {
    const subscriptionKey = `subscription_${userId}`;
    const subscription = await kv.get(subscriptionKey);
    
    if (!subscription || subscription.status !== 'active') {
      return 'free';
    }

    const productMapping: Record<string, string> = {
      'Creator': 'creator',
      'Builder': 'builder', 
      'Studio': 'studio'
    };

    return productMapping[subscription.planName] || 'free';
  } catch (error) {
    console.error('Error getting subscription tier:', error);
    return 'free';
  }
};

// Check AI message limits
const checkAIMessageLimit = async (userId: string, businessId: string): Promise<{ allowed: boolean; usage: number; limit: number; tier: string }> => {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const usageKey = `operations_usage_${businessId}_${currentMonthKey}`;
  
  try {
    const currentUsage = await kv.get(usageKey) || { ai_messages: 0 };
    const tier = await getUserSubscriptionTier(userId);
    const limit = AI_MESSAGE_LIMITS[tier as keyof typeof AI_MESSAGE_LIMITS] || AI_MESSAGE_LIMITS.free;
    
    return {
      allowed: currentUsage.ai_messages < limit,
      usage: currentUsage.ai_messages,
      limit,
      tier
    };
  } catch (error) {
    console.error('Error checking AI message limit:', error);
    return { allowed: false, usage: 0, limit: 0, tier: 'free' };
  }
};

// Update AI message usage
const updateAIMessageUsage = async (userId: string, businessId: string): Promise<void> => {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const usageKey = `operations_usage_${businessId}_${currentMonthKey}`;
  
  try {
    const currentUsage = await kv.get(usageKey) || { ai_messages: 0 };
    currentUsage.ai_messages = (currentUsage.ai_messages || 0) + 1;
    await kv.set(usageKey, currentUsage);
  } catch (error) {
    console.error('Error updating AI message usage:', error);
  }
};

// Verify user access
const verifyUserAccess = async (accessToken: string) => {
  if (!accessToken) {
    throw new Error('Authorization header is required');
  }

  const { data: { user }, error } = await supabaseAuth.auth.getUser(accessToken);
  if (error || !user) {
    throw new Error('Invalid access token');
  }

  return user;
};

// Business update handler - simplified and direct
const handleBusinessUpdate = async (message: string, userId: string, businessId: string, accessToken: string) => {
  try {
    console.log('🤖 Processing business update request:', message);

    // Extract business name from message using simple regex
    const nameMatch = message.match(/(?:change|update|rename).*(?:business|company).*(?:name|to)\s+(?:to\s+)?["']?([^"',.!?]+)["']?/i);
    if (!nameMatch) {
      throw new Error('Could not extract business name from your request. Please specify the new business name clearly.');
    }

    const newBusinessName = nameMatch[1].trim();
    console.log('🤖 Extracted business name:', newBusinessName);

    // Update business directly
    const projectUrl = Deno.env.get('SUPABASE_URL')!;
    const response = await fetch(`${projectUrl}/functions/v1/make-server-373d8b09/businesses/${businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ name: newBusinessName })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to update business name');
    }

    const result = await response.json();
    console.log('🤖 Business update successful:', result);

    return {
      response: `✅ Successfully changed your business name to "${newBusinessName}"! The change has been applied to your account.`,
      actions: [
        {
          id: 'view_business',
          type: 'navigate',
          label: 'View Business Info',
          description: 'See your updated business information',
          icon: 'briefcase'
        }
      ],
      dataUsed: ['business_data']
    };

  } catch (error: any) {
    console.error('Business update error:', error);
    return {
      response: `❌ I couldn't update your business name: ${error.message}. Please try rephrasing your request or visit the Business Management page to update manually.`,
      actions: [
        {
          id: 'go_to_business_management',
          type: 'navigate',
          label: 'Business Management',
          description: 'Update business details manually',
          icon: 'settings'
        }
      ],
      dataUsed: []
    };
  }
};

// Analyze message intent - simplified
const analyzeMessageIntent = (message: string) => {
  const lowercaseMessage = message.toLowerCase();

  // Business update intents
  if (lowercaseMessage.includes('change business name') || 
      lowercaseMessage.includes('update business name') ||
      lowercaseMessage.includes('rename business') || 
      lowercaseMessage.includes('business name to') ||
      lowercaseMessage.includes('change my business name') || 
      lowercaseMessage.includes('update my business name') ||
      lowercaseMessage.includes('rename my business')) {
    return { type: 'business_update', action: 'update_business_name', confidence: 0.95 };
  }

  // Default to general inquiry
  return { type: 'general_inquiry', confidence: 0.5 };
};

// Main AI chat endpoint
app.post('/ai/chat', async (c) => {
  try {
    console.log('🤖 AI Chat request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyUserAccess(accessToken);
    
    const { message, businessId, sessionId } = await c.req.json();
    
    if (!message?.trim()) {
      return c.json({ error: 'Message is required' }, 400);
    }

    if (!businessId) {
      return c.json({ error: 'Business ID is required' }, 400);
    }

    console.log(`🤖 Processing message: "${message}" for business: ${businessId}`);

    // Check usage limits
    const usageCheck = await checkAIMessageLimit(user.id, businessId);
    if (!usageCheck.allowed) {
      return c.json({
        error: 'AI message limit reached',
        usage: usageCheck.usage,
        limit: usageCheck.limit,
        tier: usageCheck.tier
      }, 429);
    }

    // Analyze message intent
    const intent = analyzeMessageIntent(message);
    console.log('🤖 Message intent:', intent);

    let response, actions = [], dataUsed = [];

    // Handle business updates
    if (intent.type === 'business_update') {
      const result = await handleBusinessUpdate(message, user.id, businessId, accessToken);
      response = result.response;
      actions = result.actions;
      dataUsed = result.dataUsed;
    } else {
      // For other messages, provide a helpful response
      response = "I can help you with business operations! Try asking me to:\n\n• Change your business name\n• Update business information\n• View business analytics\n\nWhat would you like to do?";
      actions = [
        {
          id: 'business_management',
          type: 'navigate',
          label: 'Business Management',
          description: 'Manage your business settings',
          icon: 'settings'
        }
      ];
      dataUsed = ['general_help'];
    }

    // Update usage counter
    await updateAIMessageUsage(user.id, businessId);

    // Store conversation in session
    const conversationKey = `ai_conversation_${sessionId || 'default'}`;
    const conversation = await kv.get(conversationKey) || { messages: [] };
    conversation.messages.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    );
    await kv.set(conversationKey, conversation);

    return c.json({
      message: response,
      actions,
      dataUsed,
      usage: {
        current: usageCheck.usage + 1,
        limit: usageCheck.limit,
        tier: usageCheck.tier
      }
    });

  } catch (error: any) {
    console.error('🤖 AI Chat error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
});

// Delete chat session endpoint
app.delete('/ai/chat/:sessionId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    await verifyUserAccess(accessToken);
    
    const sessionId = c.req.param('sessionId');
    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    const conversationKey = `ai_conversation_${sessionId}`;
    await kv.del(conversationKey);
    
    return c.json({ 
      success: true, 
      message: 'Session deleted successfully'
    });

  } catch (error: any) {
    console.error('🗑️ Error deleting chat session:', error);
    return c.json({ 
      error: 'Failed to delete session',
      details: error.message
    }, 500);
  }
});

// Test endpoint
app.get('/ai/test', (c) => {
  return c.json({ 
    status: 'AI endpoints working',
    timestamp: new Date().toISOString(),
    message: 'Clean AI chat endpoints are functional'
  });
});

export default app;