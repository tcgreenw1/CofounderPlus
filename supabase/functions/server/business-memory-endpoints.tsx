/**
 * BUSINESS MEMORY ENDPOINTS
 * 
 * Extracts and stores business details from chat conversations
 * Creates a unified memory system that all chats can reference
 * Stores business context, goals, challenges, and progress notes
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

interface BusinessMemory {
  businessId: string;
  businessName: string;
  industry?: string;
  description?: string;
  
  // Business details extracted from conversations
  targetMarket?: string;
  customerPersona?: string;
  valueProposition?: string;
  revenueModel?: string;
  competitors?: string[];
  
  // Goals and milestones
  shortTermGoals?: string[];
  longTermGoals?: string[];
  currentChallenges?: string[];
  
  // Progress tracking
  keyMetrics?: Record<string, any>;
  milestones?: Array<{
    title: string;
    date: string;
    achieved: boolean;
  }>;
  
  // Conversation insights
  conversationNotes?: Array<{
    date: string;
    note: string;
    source: string; // 'chat', 'hr', 'finance', 'marketing', 'sales', 'product'
  }>;
  
  // Metadata
  lastUpdated: string;
  updatedBy: string; // user id
}

/**
 * Verify user has access to business
 */
async function verifyBusinessAccess(userId: string, businessId: string): Promise<boolean> {
  try {
    // Business data is stored at business:userId:businessId
    const businessKey = `business:${userId}:${businessId}`;
    const business = await kv.get(businessKey);
    
    if (!business) {
      console.log(`⚠️ Business ${businessId} not found for user ${userId}`);
      return false;
    }
    
    // Business exists at this key, so user has access
    const businessData = typeof business === 'string' ? JSON.parse(business) : business;
    console.log(`✅ Verified access to business ${businessId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error verifying business access:', error);
    return false;
  }
}

/**
 * Extract business details from conversation using AI
 */
async function extractBusinessDetailsFromMessage(
  message: string, 
  aiResponse: string,
  currentMemory: BusinessMemory
): Promise<Partial<BusinessMemory>> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not configured');
    return {};
  }

  try {
    // Use GPT to extract structured business information from the conversation
    const extractionPrompt = `You are analyzing a conversation between a user and their Cofounder AI assistant. Extract any business details mentioned.

Current business context:
${JSON.stringify(currentMemory, null, 2)}

User message: "${message}"
AI response: "${aiResponse}"

Extract and return ONLY the new information mentioned (don't repeat existing info). Return a JSON object with these fields (only include fields that have NEW information):

{
  "targetMarket": "Who the business is targeting",
  "customerPersona": "Description of ideal customer",
  "valueProposition": "What makes this business unique",
  "revenueModel": "How the business makes money",
  "competitors": ["List of competitors mentioned"],
  "shortTermGoals": ["Goals for next 3-6 months"],
  "longTermGoals": ["Goals for 1-3 years"],
  "currentChallenges": ["Current obstacles or problems"],
  "keyMetrics": {"metric_name": "value"},
  "conversationNote": "Brief summary of important insight from this conversation (1-2 sentences)"
}

If no new business details are mentioned, return an empty object: {}

Return ONLY valid JSON, no other text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a business information extraction assistant. Extract structured business details from conversations and return only valid JSON.'
          },
          { 
            role: 'user', 
            content: extractionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return {};
    }

    const data = await response.json();
    const extractedContent = data.choices[0]?.message?.content || '{}';
    
    console.log('🧠 Extracted content:', extractedContent);
    
    // Parse the JSON response
    try {
      const extracted = JSON.parse(extractedContent);
      return extracted;
    } catch (parseError) {
      console.error('❌ Failed to parse extraction JSON:', parseError);
      return {};
    }
  } catch (error) {
    console.error('❌ Error extracting business details:', error);
    return {};
  }
}

/**
 * GET /business-memory/:businessId - Get business memory
 */
app.get('/make-server-373d8b09/business-memory/:businessId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const businessId = c.req.param('businessId');
    
    // Verify user has access to this business
    const hasAccess = await verifyBusinessAccess(user.id, businessId);
    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get business memory from KV store
    const memoryKey = `business_memory:${businessId}`;
    const memory = await kv.get(memoryKey);

    if (!memory) {
      // Return default memory structure if none exists
      return c.json({
        businessId,
        conversationNotes: [],
        lastUpdated: new Date().toISOString()
      });
    }

    const memoryData = typeof memory === 'string' ? JSON.parse(memory) : memory;

    console.log(`✅ Retrieved business memory for ${businessId}`);

    return c.json(memoryData);
  } catch (error: any) {
    console.error('❌ Error fetching business memory:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

/**
 * POST /business-memory/extract - Extract and save business details from conversation
 */
app.post('/make-server-373d8b09/business-memory/extract', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { 
      businessId, 
      userMessage, 
      aiResponse, 
      source = 'chat' // 'chat', 'hr', 'finance', 'marketing', 'sales', 'product'
    } = body;

    if (!businessId || !userMessage || !aiResponse) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify user has access to this business
    const hasAccess = await verifyBusinessAccess(user.id, businessId);
    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get current business memory
    const memoryKey = `business_memory:${businessId}`;
    let currentMemory: BusinessMemory;
    
    const existingMemory = await kv.get(memoryKey);
    if (existingMemory) {
      currentMemory = typeof existingMemory === 'string' ? JSON.parse(existingMemory) : existingMemory;
    } else {
      // Initialize new memory
      currentMemory = {
        businessId,
        businessName: '',
        conversationNotes: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: user.id
      };
    }

    console.log(`🧠 Extracting business details from conversation for business ${businessId}`);

    // Extract new business details using AI
    const extractedDetails = await extractBusinessDetailsFromMessage(
      userMessage,
      aiResponse,
      currentMemory
    );

    // Merge extracted details with current memory
    if (Object.keys(extractedDetails).length > 0) {
      // Handle arrays (append new items)
      if (extractedDetails.competitors) {
        currentMemory.competitors = [
          ...(currentMemory.competitors || []),
          ...extractedDetails.competitors.filter(c => !currentMemory.competitors?.includes(c))
        ];
      }
      
      if (extractedDetails.shortTermGoals) {
        currentMemory.shortTermGoals = [
          ...(currentMemory.shortTermGoals || []),
          ...extractedDetails.shortTermGoals
        ];
      }
      
      if (extractedDetails.longTermGoals) {
        currentMemory.longTermGoals = [
          ...(currentMemory.longTermGoals || []),
          ...extractedDetails.longTermGoals
        ];
      }
      
      if (extractedDetails.currentChallenges) {
        currentMemory.currentChallenges = [
          ...(currentMemory.currentChallenges || []),
          ...extractedDetails.currentChallenges
        ];
      }

      // Handle objects (merge)
      if (extractedDetails.keyMetrics) {
        currentMemory.keyMetrics = {
          ...(currentMemory.keyMetrics || {}),
          ...extractedDetails.keyMetrics
        };
      }

      // Handle simple fields (overwrite if new value provided)
      if (extractedDetails.targetMarket) currentMemory.targetMarket = extractedDetails.targetMarket;
      if (extractedDetails.customerPersona) currentMemory.customerPersona = extractedDetails.customerPersona;
      if (extractedDetails.valueProposition) currentMemory.valueProposition = extractedDetails.valueProposition;
      if (extractedDetails.revenueModel) currentMemory.revenueModel = extractedDetails.revenueModel;

      // Add conversation note if extracted
      if ((extractedDetails as any).conversationNote) {
        currentMemory.conversationNotes = currentMemory.conversationNotes || [];
        currentMemory.conversationNotes.push({
          date: new Date().toISOString(),
          note: (extractedDetails as any).conversationNote,
          source
        });
      }

      // Update metadata
      currentMemory.lastUpdated = new Date().toISOString();
      currentMemory.updatedBy = user.id;

      // Save updated memory
      await kv.set(memoryKey, currentMemory);

      console.log(`✅ Updated business memory for ${businessId}`);
      console.log('📝 Extracted:', Object.keys(extractedDetails).join(', '));

      return c.json({
        success: true,
        extracted: extractedDetails,
        memory: currentMemory
      });
    } else {
      console.log(`ℹ️ No new business details extracted from conversation`);
      return c.json({
        success: true,
        extracted: {},
        memory: currentMemory
      });
    }
  } catch (error: any) {
    console.error('❌ Error extracting business memory:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

/**
 * PUT /business-memory/:businessId - Manually update business memory
 */
app.put('/make-server-373d8b09/business-memory/:businessId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const businessId = c.req.param('businessId');
    const updates = await c.req.json();

    // Verify user has access to this business
    const hasAccess = await verifyBusinessAccess(user.id, businessId);
    if (!hasAccess) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get current memory
    const memoryKey = `business_memory:${businessId}`;
    let currentMemory: BusinessMemory;
    
    const existingMemory = await kv.get(memoryKey);
    if (existingMemory) {
      currentMemory = typeof existingMemory === 'string' ? JSON.parse(existingMemory) : existingMemory;
    } else {
      currentMemory = {
        businessId,
        businessName: '',
        conversationNotes: [],
        lastUpdated: new Date().toISOString(),
        updatedBy: user.id
      };
    }

    // Merge updates
    const updatedMemory = {
      ...currentMemory,
      ...updates,
      businessId, // Ensure businessId doesn't change
      lastUpdated: new Date().toISOString(),
      updatedBy: user.id
    };

    // Save updated memory
    await kv.set(memoryKey, updatedMemory);

    console.log(`✅ Manually updated business memory for ${businessId}`);

    return c.json({
      success: true,
      memory: updatedMemory
    });
  } catch (error: any) {
    console.error('❌ Error updating business memory:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;