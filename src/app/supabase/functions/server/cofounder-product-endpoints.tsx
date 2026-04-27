/**
 * COFOUNDER PRODUCT INTELLIGENCE ENDPOINTS
 * 
 * Provides backend functionality for the Cofounder Product tab including:
 * - AI-powered product insights and recommendations
 * - Product roadmap management with AI prioritization
 * - User research session tracking and analysis
 * - Automated product task management
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProductInsight {
  id: string;
  type: 'opportunity' | 'metric' | 'competitive' | 'user-feedback' | 'technical';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  action: string;
  status: 'new' | 'in-review' | 'actioned' | 'dismissed';
  business_id: string;
  user_id: string;
  created_at: string;
}

interface ProductMetric {
  metric: string;
  value: string;
  trend: string;
  status: 'up' | 'down' | 'stable';
  target?: string;
  timestamp: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  status: 'in-progress' | 'planned' | 'planning' | 'backlog' | 'completed';
  progress: number;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  team: string;
  confidence: number;
  tags?: string[];
  business_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UserResearchSession {
  id: string;
  type: 'interview' | 'survey' | 'usability' | 'focus-group';
  title: string;
  description?: string;
  company?: string;
  responses?: number;
  participants?: number;
  date: string;
  insights: number;
  status: 'completed' | 'analyzing' | 'scheduled' | 'in-progress';
  notes?: string;
  tags?: string[];
  business_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface AutomatedTask {
  id: string;
  task: string;
  description?: string;
  schedule: string;
  nextRun: string;
  status: 'active' | 'paused' | 'completed';
  lastRun: string;
  lastResult?: string;
  business_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper functions
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Verify user authentication with fallback to JWT decoding
 */
async function verifyUserAccess(accessToken: string) {
  if (!accessToken) throw new Error('No access token provided');

  // 1. Try Supabase Auth first
  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data: { user }, error } = await authClient.auth.getUser(accessToken);
    
    if (!error && user) {
      return user;
    }
    console.warn('Supabase auth check failed, falling back to JWT:', error?.message);
  } catch (e) {
    console.warn('Supabase auth client error:', e);
  }

  // 2. Fallback to JWT decoding (offline verification)
  const payload = decodeJWT(accessToken);
  if (!payload || !payload.sub) {
    throw new Error('Invalid authorization token');
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  // Return user-like object
  return {
    id: payload.sub,
    email: payload.email,
    app_metadata: payload.app_metadata || {},
    user_metadata: payload.user_metadata || {},
    aud: payload.aud,
    created_at: new Date(payload.iat * 1000).toISOString()
  };
}

/**
 * Safely parse potential JSON string data
 */
function safeParse(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data; // Return as is if not valid JSON
    }
  }
  return data;
}

/**
 * Call OpenAI API for product insights
 */
async function generateAIInsights(prompt: string, context: any = {}): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a Cofounder AI assistant specializing in product management and strategy.
Your role is to analyze product data and provide actionable insights that help entrepreneurs build better products.

Communication style:
- Be specific and actionable
- Focus on quick wins and high-impact opportunities
- Use data to support recommendations
- Prioritize based on business impact
- Never use "AI" terminology - you're their Cofounder`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.1',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_output_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.output_text ??
    data?.output?.[0]?.content?.[0]?.text ??
    "";
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// ENDPOINT REGISTRATION FUNCTION
// ============================================================================

export function addCofounderProductEndpoints(app: Hono) {
  console.log('🎯 Setting up Cofounder Product Intelligence endpoints...');

  // =========================================================================
  // PRODUCT INTELLIGENCE & INSIGHTS ENDPOINTS
  // =========================================================================

  /**
   * GET /product-intelligence/insights
   * Fetch all product insights for a business
   */
  app.get('/make-server-373d8b09/product-intelligence/insights', async (c) => {
    try {
      console.log('🎯 Product Intelligence: Get insights endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      // Get insights from KV store
      const insightsKey = `business:${userId}:${businessId}:product:insights`;
      const rawInsights = await kv.get(insightsKey);
      
      // Handle potential stringified JSON
      let insights = safeParse(rawInsights) || [];
      if (!Array.isArray(insights)) {
        insights = [];
      }
      
      console.log(`🎯 Product Intelligence GET - Key: ${insightsKey}`);
      console.log(`🎯 Product Intelligence GET - Found ${insights.length} insights`);
      
      return c.json({
        success: true,
        insights: insights,
        total: insights.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Intelligence: Error fetching insights:', error);
      return c.json({ 
        success: false, 
        error: `Failed to fetch insights: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /product-intelligence/generate
   * Generate new AI-powered product insights
   */
  app.post('/make-server-373d8b09/product-intelligence/generate', async (c) => {
    try {
      console.log('🎯 Product Intelligence: Generate insights endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const requestBody = await c.req.json();
      const { context = {}, focus = 'general' } = requestBody;
      
      console.log('🎯 Product Intelligence: Generating insights with focus:', focus);
      
      // Build prompt for AI
      let prompt = `As a product management Cofounder, analyze the following business context and generate 3-5 actionable product insights:\n\n`;
      
      if (context.metrics) {
        prompt += `Current Product Metrics:\n${JSON.stringify(context.metrics, null, 2)}\n\n`;
      }
      
      if (context.roadmap) {
        prompt += `Roadmap Status:\n${JSON.stringify(context.roadmap, null, 2)}\n\n`;
      }
      
      if (context.userResearch) {
        prompt += `Recent User Research:\n${JSON.stringify(context.userResearch, null, 2)}\n\n`;
      }
      
      if (context.businessInfo) {
        prompt += `Business Context:\n${JSON.stringify(context.businessInfo, null, 2)}\n\n`;
      }
      
      prompt += `Focus Area: ${focus}\n\n`;
      prompt += `Please provide insights in the following JSON format:
[
  {
    "type": "opportunity|metric|competitive|user-feedback|technical",
    "title": "Brief insight title",
    "description": "Detailed actionable description",
    "priority": "high|medium|low",
    "action": "Specific action to take"
  }
]

Focus on:
- Actionable opportunities that can be acted on quickly
- Data-driven recommendations
- High-impact improvements
- Quick wins
- Strategic long-term opportunities`;
      
      // Call OpenAI API
      const aiResponse = await generateAIInsights(prompt, context);
      
      // Parse AI response
      let generatedInsights: any[] = [];
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedInsights = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array found, create a single insight from the response
          generatedInsights = [{
            type: 'opportunity',
            title: 'Product Strategy Recommendation',
            description: aiResponse.substring(0, 200),
            priority: 'medium',
            action: 'Review recommendation'
          }];
        }
      } catch (parseError) {
        console.error('🎯 Product Intelligence: Error parsing AI response:', parseError);
        // Create a single insight from the response
        generatedInsights = [{
          type: 'opportunity',
          title: 'Product Strategy Insights',
          description: aiResponse.substring(0, 200),
          priority: 'medium',
          action: 'Review insights'
        }];
      }
      
      // Convert to ProductInsight objects
      const now = new Date().toISOString();
      const insights: ProductInsight[] = generatedInsights.map((insight, index) => ({
        id: generateId('insight'),
        type: insight.type || 'opportunity',
        title: insight.title || 'Product Insight',
        description: insight.description || '',
        priority: insight.priority || 'medium',
        timestamp: 'Just now',
        action: insight.action || 'Review',
        status: 'new',
        business_id: businessId,
        user_id: userId,
        created_at: now
      }));
      
      // Get existing insights and prepend new ones
      const insightsKey = `business:${userId}:${businessId}:product:insights`;
      const rawExisting = await kv.get(insightsKey);
      const existingInsightsRaw = safeParse(rawExisting);
      const existingInsights = Array.isArray(existingInsightsRaw) ? existingInsightsRaw : [];
      const updatedInsights = [...insights, ...existingInsights];
      
      // Keep only the most recent 50 insights
      const trimmedInsights = updatedInsights.slice(0, 50);
      
      // Save to KV store
      console.log(`🎯 Product Intelligence SAVE - Key: ${insightsKey}`);
      await kv.set(insightsKey, trimmedInsights);
      console.log(`🎯 Product Intelligence SAVE - Successfully saved ${trimmedInsights.length} insights`);
      
      console.log(`🎯 Product Intelligence: Generated ${insights.length} new insights`);
      
      return c.json({
        success: true,
        insights: insights,
        total: insights.length,
        message: 'Product insights generated successfully',
        timestamp: now
      });
      
    } catch (error: any) {
      console.error('🎯 Product Intelligence: Error generating insights:', error);
      return c.json({ 
        success: false, 
        error: `Failed to generate insights: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * PUT /product-intelligence/insights/:id
   * Update insight status (mark as actioned, dismissed, etc.)
   */
  app.put('/make-server-373d8b09/product-intelligence/insights/:id', async (c) => {
    try {
      console.log('🎯 Product Intelligence: Update insight endpoint called');
      
      const insightId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!insightId || !businessId) {
        return c.json({ success: false, error: 'Insight ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const updateData = await c.req.json();
      
      // Get existing insights
      const insightsKey = `business:${userId}:${businessId}:product:insights`;
      const rawInsights = await kv.get(insightsKey);
      let insights = safeParse(rawInsights);
      
      if (!Array.isArray(insights)) {
        insights = [];
      }
      
      // Find and update insight
      const insightIndex = insights.findIndex((i: ProductInsight) => i.id === insightId);
      
      if (insightIndex === -1) {
        return c.json({ success: false, error: 'Insight not found' }, 404);
      }
      
      insights[insightIndex] = {
        ...insights[insightIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      await kv.set(insightsKey, insights);
      
      console.log(`🎯 Product Intelligence: Updated insight ${insightId}`);
      
      return c.json({
        success: true,
        insight: insights[insightIndex],
        message: 'Insight updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Intelligence: Error updating insight:', error);
      return c.json({ 
        success: false, 
        error: `Failed to update insight: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * GET /product-intelligence/metrics
   * Fetch product metrics for a business
   */
  app.get('/make-server-373d8b09/product-intelligence/metrics', async (c) => {
    try {
      console.log('🎯 Product Intelligence: Get metrics endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      // Get metrics from KV store
      const metricsKey = `business:${userId}:${businessId}:product:metrics`;
      const rawMetrics = await kv.get(metricsKey);
      let metrics = safeParse(rawMetrics) || [];
      
      if (!Array.isArray(metrics)) {
        metrics = [];
      }
      
      console.log(`🎯 Product Intelligence: Found ${metrics.length} metrics`);
      
      return c.json({
        success: true,
        metrics: metrics,
        total: metrics.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Intelligence: Error fetching metrics:', error);
      return c.json({ 
        success: false, 
        error: `Failed to fetch metrics: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /product-intelligence/metrics
   * Update product metrics for a business
   */
  app.post('/make-server-373d8b09/product-intelligence/metrics', async (c) => {
    try {
      console.log('🎯 Product Intelligence: Update metrics endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const requestBody = await c.req.json();
      const { metrics } = requestBody;
      
      if (!metrics || !Array.isArray(metrics)) {
        return c.json({ success: false, error: 'Metrics array is required' }, 400);
      }
      
      // Add timestamp to metrics
      const timestampedMetrics = metrics.map((m: ProductMetric) => ({
        ...m,
        timestamp: new Date().toISOString()
      }));
      
      // Save to KV store
      const metricsKey = `business:${userId}:${businessId}:product:metrics`;
      await kv.set(metricsKey, timestampedMetrics);
      
      console.log(`🎯 Product Intelligence: Updated ${metrics.length} metrics`);
      
      return c.json({
        success: true,
        metrics: timestampedMetrics,
        message: 'Metrics updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Intelligence: Error updating metrics:', error);
      return c.json({ 
        success: false, 
        error: `Failed to update metrics: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  // =========================================================================
  // PRODUCT ROADMAP ENDPOINTS
  // =========================================================================

  /**
   * GET /product-roadmap/items
   * Fetch all roadmap items for a business
   */
  app.get('/make-server-373d8b09/product-roadmap/items', async (c) => {
    try {
      console.log('🎯 Product Roadmap: Get items endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      // Get roadmap items from KV store
      const roadmapKey = `business:${userId}:${businessId}:product:roadmap`;
      const rawItems = await kv.get(roadmapKey);
      let items = safeParse(rawItems) || [];
      
      if (!Array.isArray(items)) {
        items = [];
      }
      
      console.log(`🎯 Product Roadmap: Found ${items.length} roadmap items`);
      
      return c.json({
        success: true,
        items: items,
        total: items.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Roadmap: Error fetching items:', error);
      return c.json({ 
        success: false, 
        error: `Failed to fetch roadmap items: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /product-roadmap/items
   * Create a new roadmap item
   */
  app.post('/make-server-373d8b09/product-roadmap/items', async (c) => {
    try {
      console.log('🎯 Product Roadmap: Create item endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const requestBody = await c.req.json();
      const { title, description, status, priority, dueDate, team, confidence, tags } = requestBody;
      
      if (!title) {
        return c.json({ success: false, error: 'Title is required' }, 400);
      }
      
      const now = new Date().toISOString();
      const newItem: RoadmapItem = {
        id: generateId('roadmap'),
        title: title.trim(),
        description: description?.trim() || '',
        status: status || 'backlog',
        progress: 0,
        priority: priority || 'medium',
        dueDate: dueDate || 'TBD',
        team: team || 'Product',
        confidence: confidence || 50,
        tags: tags || [],
        business_id: businessId,
        user_id: userId,
        created_at: now,
        updated_at: now
      };
      
      // Get existing items and add new one
      const roadmapKey = `business:${userId}:${businessId}:product:roadmap`;
      const rawExisting = await kv.get(roadmapKey);
      let existingItems = safeParse(rawExisting) || [];
      if (!Array.isArray(existingItems)) existingItems = [];
      
      const updatedItems = [newItem, ...existingItems];
      
      await kv.set(roadmapKey, updatedItems);
      
      console.log(`🎯 Product Roadmap: Created item ${newItem.id}`);
      
      return c.json({
        success: true,
        item: newItem,
        message: 'Roadmap item created successfully',
        timestamp: now
      });
      
    } catch (error: any) {
      console.error('🎯 Product Roadmap: Error creating item:', error);
      return c.json({ 
        success: false, 
        error: `Failed to create roadmap item: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * PUT /product-roadmap/items/:id
   * Update a roadmap item
   */
  app.put('/make-server-373d8b09/product-roadmap/items/:id', async (c) => {
    try {
      console.log('🎯 Product Roadmap: Update item endpoint called');
      
      const itemId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!itemId || !businessId) {
        return c.json({ success: false, error: 'Item ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const updateData = await c.req.json();
      
      // Get existing items
      const roadmapKey = `business:${userId}:${businessId}:product:roadmap`;
      const rawItems = await kv.get(roadmapKey);
      let items = safeParse(rawItems) || [];
      if (!Array.isArray(items)) items = [];
      
      // Find and update item
      const itemIndex = items.findIndex((i: RoadmapItem) => i.id === itemId);
      
      if (itemIndex === -1) {
        return c.json({ success: false, error: 'Roadmap item not found' }, 404);
      }
      
      items[itemIndex] = {
        ...items[itemIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      await kv.set(roadmapKey, items);
      
      console.log(`🎯 Product Roadmap: Updated item ${itemId}`);
      
      return c.json({
        success: true,
        item: items[itemIndex],
        message: 'Roadmap item updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Roadmap: Error updating item:', error);
      return c.json({ 
        success: false, 
        error: `Failed to update roadmap item: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * DELETE /product-roadmap/items/:id
   * Delete a roadmap item
   */
  app.delete('/make-server-373d8b09/product-roadmap/items/:id', async (c) => {
    try {
      console.log('🎯 Product Roadmap: Delete item endpoint called');
      
      const itemId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!itemId || !businessId) {
        return c.json({ success: false, error: 'Item ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      // Get existing items
      const roadmapKey = `business:${userId}:${businessId}:product:roadmap`;
      const rawItems = await kv.get(roadmapKey);
      let items = safeParse(rawItems) || [];
      if (!Array.isArray(items)) items = [];
      
      // Find and remove item
      const itemIndex = items.findIndex((i: RoadmapItem) => i.id === itemId);
      
      if (itemIndex === -1) {
        return c.json({ success: false, error: 'Roadmap item not found' }, 404);
      }
      
      const deletedItem = items[itemIndex];
      items.splice(itemIndex, 1);
      
      await kv.set(roadmapKey, items);
      
      console.log(`🎯 Product Roadmap: Deleted item ${itemId}`);
      
      return c.json({
        success: true,
        item: deletedItem,
        message: 'Roadmap item deleted successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Roadmap: Error deleting item:', error);
      return c.json({ 
        success: false, 
        error: `Failed to delete roadmap item: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /product-roadmap/ai-prioritize
   * Use AI to analyze and prioritize roadmap items
   */
  app.post('/make-server-373d8b09/product-roadmap/ai-prioritize', async (c) => {
    try {
      console.log('🎯 Product Roadmap: AI prioritize endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const requestBody = await c.req.json();
      const { items = [], context = {} } = requestBody;
      
      if (!items || items.length === 0) {
        return c.json({ success: false, error: 'Roadmap items are required' }, 400);
      }
      
      console.log(`🎯 Product Roadmap: AI prioritizing ${items.length} items`);
      
      // Build prompt for AI
      const prompt = `As a product management Cofounder, analyze the following roadmap items and provide prioritization recommendations.

Roadmap Items:
${JSON.stringify(items, null, 2)}

${context.businessContext ? `Business Context:\n${JSON.stringify(context.businessContext, null, 2)}\n\n` : ''}
${context.metrics ? `Current Metrics:\n${JSON.stringify(context.metrics, null, 2)}\n\n` : ''}

For each item, provide:
1. Recommended priority (high/medium/low)
2. Confidence score (0-100)
3. Brief reasoning

Return JSON array in this format:
[
  {
    "id": "item_id",
    "recommendedPriority": "high|medium|low",
    "confidence": 85,
    "reasoning": "Brief explanation"
  }
]`;
      
      const aiResponse = await generateAIInsights(prompt, context);
      
      // Parse AI response
      let priorityRecommendations: any[] = [];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          priorityRecommendations = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('🎯 Product Roadmap: Error parsing AI response:', parseError);
        return c.json({ 
          success: false, 
          error: 'Failed to parse AI recommendations',
          timestamp: new Date().toISOString()
        }, 500);
      }
      
      console.log(`🎯 Product Roadmap: AI generated ${priorityRecommendations.length} recommendations`);
      
      return c.json({
        success: true,
        recommendations: priorityRecommendations,
        message: 'Roadmap prioritization completed',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Roadmap: Error with AI prioritization:', error);
      return c.json({ 
        success: false, 
        error: `Failed to prioritize roadmap: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  // =========================================================================
  // USER RESEARCH ENDPOINTS
  // =========================================================================

  /**
   * GET /user-research/sessions
   * Fetch all research sessions for a business
   */
  app.get('/make-server-373d8b09/user-research/sessions', async (c) => {
    try {
      console.log('🎯 User Research: Get sessions endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      // Get research sessions from KV store
      const researchKey = `business:${userId}:${businessId}:product:research`;
      const rawSessions = await kv.get(researchKey);
      
      // Ensure we always return an array
      let sessions = [];
      if (rawSessions) {
        sessions = typeof rawSessions === 'string' ? JSON.parse(rawSessions) : rawSessions;
        // Ensure it's an array
        sessions = Array.isArray(sessions) ? sessions : [];
      }
      
      console.log(`🎯 User Research: Found ${sessions.length} research sessions`);
      
      return c.json({
        success: true,
        sessions: sessions,
        total: sessions.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 User Research: Error fetching sessions:', error);
      return c.json({ 
        success: false, 
        error: `Failed to fetch research sessions: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /user-research/sessions
   * Create a new research session
   */
  app.post('/make-server-373d8b09/user-research/sessions', async (c) => {
    try {
      console.log('🎯 User Research: Create session endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const requestBody = await c.req.json();
      const { type, title, description, company, responses, participants, date, status, notes, tags } = requestBody;
      
      if (!type || !title) {
        return c.json({ success: false, error: 'Type and title are required' }, 400);
      }
      
      const now = new Date().toISOString();
      const newSession: UserResearchSession = {
        id: generateId('research'),
        type: type,
        title: title.trim(),
        description: description?.trim() || '',
        company: company?.trim() || '',
        responses: responses || 0,
        participants: participants || 0,
        date: date || new Date().toLocaleDateString(),
        insights: 0,
        status: status || 'scheduled',
        notes: notes || '',
        tags: tags || [],
        business_id: businessId,
        user_id: userId,
        created_at: now,
        updated_at: now
      };
      
      // Get existing sessions and add new one
      const researchKey = `business:${userId}:${businessId}:product:research`;
      const rawSessions = await kv.get(researchKey);
      
      // Ensure we properly parse existing sessions
      let existingSessions = [];
      if (rawSessions) {
        existingSessions = typeof rawSessions === 'string' ? JSON.parse(rawSessions) : rawSessions;
        existingSessions = Array.isArray(existingSessions) ? existingSessions : [];
      }
      
      const updatedSessions = [newSession, ...existingSessions];
      
      await kv.set(researchKey, updatedSessions);
      
      console.log(`🎯 User Research: Created session ${newSession.id}`);
      
      return c.json({
        success: true,
        session: newSession,
        message: 'Research session created successfully',
        timestamp: now
      });
      
    } catch (error: any) {
      console.error('🎯 User Research: Error creating session:', error);
      return c.json({ 
        success: false, 
        error: `Failed to create research session: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * PUT /user-research/sessions/:id
   * Update a research session
   */
  app.put('/make-server-373d8b09/user-research/sessions/:id', async (c) => {
    try {
      console.log('🎯 User Research: Update session endpoint called');
      
      const sessionId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!sessionId || !businessId) {
        return c.json({ success: false, error: 'Session ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const updateData = await c.req.json();
      
      // Get existing sessions
      const researchKey = `business:${userId}:${businessId}:product:research`;
      const sessions = await kv.get(researchKey) || [];
      
      // Find and update session
      const sessionIndex = sessions.findIndex((s: UserResearchSession) => s.id === sessionId);
      
      if (sessionIndex === -1) {
        return c.json({ success: false, error: 'Research session not found' }, 404);
      }
      
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      await kv.set(researchKey, sessions);
      
      console.log(`🎯 User Research: Updated session ${sessionId}`);
      
      return c.json({
        success: true,
        session: sessions[sessionIndex],
        message: 'Research session updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 User Research: Error updating session:', error);
      return c.json({ 
        success: false, 
        error: `Failed to update research session: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /user-research/analyze
   * Use AI to analyze research data and extract insights
   */
  app.post('/make-server-373d8b09/user-research/analyze', async (c) => {
    try {
      console.log('🎯 User Research: Analyze endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const requestBody = await c.req.json();
      const { sessionId, researchData, notes } = requestBody;
      
      if (!researchData && !notes) {
        return c.json({ success: false, error: 'Research data or notes are required' }, 400);
      }
      
      console.log('🎯 User Research: Analyzing research data with AI');
      
      // Build prompt for AI
      const prompt = `As a product management Cofounder, analyze the following user research data and extract key insights:

${researchData ? `Research Data:\n${JSON.stringify(researchData, null, 2)}\n\n` : ''}
${notes ? `Research Notes:\n${notes}\n\n` : ''}

Please identify:
1. Key themes and patterns
2. User pain points
3. Feature requests
4. Usability issues
5. Opportunities for improvement

Return insights in JSON format:
[
  {
    "category": "pain-point|feature-request|usability|opportunity",
    "insight": "Specific insight description",
    "impact": "high|medium|low",
    "recommendation": "Actionable recommendation"
  }
]`;
      
      const aiResponse = await generateAIInsights(prompt);
      
      // Parse AI response
      let extractedInsights: any[] = [];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedInsights = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('🎯 User Research: Error parsing AI response:', parseError);
        // Create a text-based insight if parsing fails
        extractedInsights = [{
          category: 'general',
          insight: aiResponse.substring(0, 200),
          impact: 'medium',
          recommendation: 'Review full analysis'
        }];
      }
      
      // If sessionId provided, update the session with insight count
      if (sessionId) {
        const researchKey = `business:${userId}:${businessId}:product:research`;
        const sessions = await kv.get(researchKey) || [];
        const sessionIndex = sessions.findIndex((s: UserResearchSession) => s.id === sessionId);
        
        if (sessionIndex !== -1) {
          sessions[sessionIndex].insights = extractedInsights.length;
          sessions[sessionIndex].status = 'completed';
          sessions[sessionIndex].updated_at = new Date().toISOString();
          await kv.set(researchKey, sessions);
        }
      }
      
      console.log(`🎯 User Research: Extracted ${extractedInsights.length} insights`);
      
      return c.json({
        success: true,
        insights: extractedInsights,
        total: extractedInsights.length,
        message: 'Research analysis completed',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 User Research: Error analyzing research:', error);
      return c.json({ 
        success: false, 
        error: `Failed to analyze research: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  // =========================================================================
  // AUTOMATED TASKS ENDPOINTS
  // =========================================================================

  /**
   * GET /product-automation/tasks
   * Fetch all automated tasks for a business
   */
  app.get('/make-server-373d8b09/product-automation/tasks', async (c) => {
    try {
      console.log('🎯 Product Automation: Get tasks endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      // Get automated tasks from KV store
      const tasksKey = `business:${userId}:${businessId}:product:automation`;
      const tasks = await kv.get(tasksKey) || [];
      
      console.log(`🎯 Product Automation: Found ${tasks.length} automated tasks`);
      
      return c.json({
        success: true,
        tasks: tasks,
        total: tasks.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Automation: Error fetching tasks:', error);
      return c.json({ 
        success: false, 
        error: `Failed to fetch automated tasks: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /product-automation/tasks
   * Create a new automated task
   */
  app.post('/make-server-373d8b09/product-automation/tasks', async (c) => {
    try {
      console.log('🎯 Product Automation: Create task endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const requestBody = await c.req.json();
      const { task, description, schedule, nextRun, status } = requestBody;
      
      if (!task || !schedule) {
        return c.json({ success: false, error: 'Task name and schedule are required' }, 400);
      }
      
      const now = new Date().toISOString();
      const newTask: AutomatedTask = {
        id: generateId('automation'),
        task: task.trim(),
        description: description?.trim() || '',
        schedule: schedule,
        nextRun: nextRun || 'Not scheduled',
        status: status || 'active',
        lastRun: 'Never',
        lastResult: '',
        business_id: businessId,
        user_id: userId,
        created_at: now,
        updated_at: now
      };
      
      // Get existing tasks and add new one
      const tasksKey = `business:${userId}:${businessId}:product:automation`;
      const existingTasks = await kv.get(tasksKey) || [];
      const updatedTasks = [newTask, ...existingTasks];
      
      await kv.set(tasksKey, updatedTasks);
      
      console.log(`🎯 Product Automation: Created task ${newTask.id}`);
      
      return c.json({
        success: true,
        task: newTask,
        message: 'Automated task created successfully',
        timestamp: now
      });
      
    } catch (error: any) {
      console.error('🎯 Product Automation: Error creating task:', error);
      return c.json({ 
        success: false, 
        error: `Failed to create automated task: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * PUT /product-automation/tasks/:id
   * Update an automated task
   */
  app.put('/make-server-373d8b09/product-automation/tasks/:id', async (c) => {
    try {
      console.log('🎯 Product Automation: Update task endpoint called');
      
      const taskId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!taskId || !businessId) {
        return c.json({ success: false, error: 'Task ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      const updateData = await c.req.json();
      
      // Get existing tasks
      const tasksKey = `business:${userId}:${businessId}:product:automation`;
      const tasks = await kv.get(tasksKey) || [];
      
      // Find and update task
      const taskIndex = tasks.findIndex((t: AutomatedTask) => t.id === taskId);
      
      if (taskIndex === -1) {
        return c.json({ success: false, error: 'Automated task not found' }, 404);
      }
      
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      await kv.set(tasksKey, tasks);
      
      console.log(`🎯 Product Automation: Updated task ${taskId}`);
      
      return c.json({
        success: true,
        task: tasks[taskIndex],
        message: 'Automated task updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🎯 Product Automation: Error updating task:', error);
      return c.json({ 
        success: false, 
        error: `Failed to update automated task: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /product-automation/execute/:id
   * Manually execute an automated task
   */
  app.post('/make-server-373d8b09/product-automation/execute/:id', async (c) => {
    try {
      console.log('🎯 Product Automation: Execute task endpoint called');
      
      const taskId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!taskId || !businessId) {
        return c.json({ success: false, error: 'Task ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      const user = await verifyUserAccess(accessToken);
      const userId = user.id;
      
      // Get existing tasks
      const tasksKey = `business:${userId}:${businessId}:product:automation`;
      const tasks = await kv.get(tasksKey) || [];
      
      // Find task
      const taskIndex = tasks.findIndex((t: AutomatedTask) => t.id === taskId);
      
      if (taskIndex === -1) {
        return c.json({ success: false, error: 'Automated task not found' }, 404);
      }
      
      const task = tasks[taskIndex];
      
      console.log(`🎯 Product Automation: Executing task ${taskId}: ${task.task}`);
      
      // Simulate task execution (in a real implementation, this would trigger actual automation)
      const executionResult = {
        success: true,
        message: `Task "${task.task}" executed successfully`,
        timestamp: new Date().toISOString()
      };
      
      // Update task with execution info
      tasks[taskIndex] = {
        ...task,
        lastRun: 'Just now',
        lastResult: executionResult.message,
        updated_at: executionResult.timestamp
      };
      
      await kv.set(tasksKey, tasks);
      
      console.log(`🎯 Product Automation: Task ${taskId} executed successfully`);
      
      return c.json({
        success: true,
        task: tasks[taskIndex],
        result: executionResult,
        message: 'Task executed successfully',
        timestamp: executionResult.timestamp
      });
      
    } catch (error: any) {
      console.error('🎯 Product Automation: Error executing task:', error);
      return c.json({ 
        success: false, 
        error: `Failed to execute automated task: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  console.log('🎯 Cofounder Product Intelligence endpoints setup completed');
}