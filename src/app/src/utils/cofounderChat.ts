/**
 * Centralized Cofounder Chat Configuration & API
 * 
 * This is the SINGLE SOURCE OF TRUTH for all AI chat interactions.
 * All Cofounder chat features (CofounderAI page, Roadmap AGI, Dashboard Assistant)
 * use this configuration.
 * 
 * To adjust AI behavior across the entire app, modify the settings here.
 */

import { supabase } from './supabase/client';
import { projectId } from './supabase/info';

// ============================================================================
// CENTRALIZED AI CONFIGURATION - Adjust these to change AI behavior app-wide
// ============================================================================

export const COFOUNDER_CONFIG = {
  // OpenAI Model Configuration
  model: 'gpt-5.1', // Standard model (ChatKit uses o1-preview/o1 when enabled)
  temperature: 0.7,
  maxTokens: 10000,
  
  // System Prompt - Core personality and behavior
  systemPrompt: `You are a Cofounder AI assistant, helping entrepreneurs build and grow their businesses.

Your role:
- Act as a strategic business partner, not just a tool
- Provide actionable, specific advice tailored to the user's business context
- Help prioritize tasks and identify quick wins
- Be encouraging but realistic
- Use business and gamification language naturally (XP, progress, milestones, etc.)

Communication style:
- Be concise and actionable (2-4 sentences unless detail is requested)
- Use bullet points for lists
- Include specific next steps when relevant
- Avoid generic advice - personalize to their business
- Never use "AI" terminology - you're their Cofounder

Remember: You have access to the user's business data, roadmap progress, and conversation history. Use this context to provide personalized recommendations.`,

  // Context Building Configuration
  contextConfig: {
    includeBusinessInfo: true,
    includeRoadmapProgress: true,
    includeChatHistory: true,
    maxHistoryMessages: 10, // Last N messages to include
  },

  // API Endpoints
  endpoints: {
    chat: `/make-server-373d8b09/cofounder/chat`, // Unified chat endpoint
    sessions: `/make-server-373d8b09/ai/chat-sessions`,
    history: `/make-server-373d8b09/ai/chat-history`,
  }
};

// ============================================================================
// TYPES
// ============================================================================

export interface CofounderChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface CofounderChatContext {
  businessId?: string;
  businessName?: string;
  industry?: string;
  stage?: string;
  userId?: string;
  sessionId?: string;
  
  // Roadmap context
  roadmapProgress?: {
    completedNodes: number;
    totalNodes: number;
    activeNodes: number;
    currentStage?: string;
  };
  
  // Current page context
  currentPage?: 'chat' | 'roadmap' | 'dashboard' | 'operations';
  currentNode?: {
    title: string;
    description?: string;
  };
  
  // Additional context
  recentActivity?: string;
  userGoals?: string[];
  customContext?: Record<string, any>;
}

export interface CofounderChatRequest {
  message: string;
  context?: CofounderChatContext;
  conversationHistory?: CofounderChatMessage[];
  sessionId?: string;
}

export interface CofounderChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  actions?: any[];
  dataUsed?: string[];
}

// ============================================================================
// CENTRALIZED CHAT API - All features use this
// ============================================================================

/**
 * Check if ChatKit mode is enabled for current business
 * Uses synchronous localStorage check to avoid triggering re-renders
 */
function isChatkitEnabled(): boolean {
  try {
    // Get from localStorage (synchronous, no re-render triggers)
    const cached = localStorage.getItem('cofounder_chatkit_enabled');
    if (cached !== null) {
      return cached === 'true';
    }

    // Default to true (ChatKit enabled by default)
    return true;
  } catch (error) {
    console.error('Error checking ChatKit status:', error);
    return true; // Default to ChatKit
  }
}

/**
 * Send a message to the Cofounder AI
 * This is used by ALL chat features across the app
 * Automatically routes to ChatKit or standard API based on settings
 */
export async function sendCofounderMessage(
  request: CofounderChatRequest
): Promise<CofounderChatResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Check if ChatKit is enabled (synchronous check)
    const useChatkit = isChatkitEnabled();
    const endpoint = useChatkit 
      ? '/make-server-373d8b09/chatkit/chat'
      : COFOUNDER_CONFIG.endpoints.chat;

    console.log(`🤖 Sending via ${useChatkit ? 'ChatKit (latest models)' : 'Standard API (gpt-4o)'}`);

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: request.message,
          context: request.context,
          conversationHistory: request.conversationHistory,
          sessionId: request.sessionId,
          // Include config so server knows our preferences
          config: {
            model: COFOUNDER_CONFIG.model,
            temperature: COFOUNDER_CONFIG.temperature,
            maxTokens: COFOUNDER_CONFIG.maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const data = await response.json();
    return {
      success: true,
      response: data.response,
      usage: data.usage,
      actions: data.actions,
      dataUsed: data.dataUsed
    };

  } catch (error: any) {
    console.error('❌ Cofounder Chat Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message to Cofounder'
    };
  }
}

/**
 * Get chat sessions for the current user
 */
export async function getChatSessions(userId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1${COFOUNDER_CONFIG.endpoints.sessions}?userId=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load chat sessions');
    }

    const data = await response.json();
    return {
      success: true,
      sessions: data.sessions || []
    };

  } catch (error: any) {
    console.error('❌ Failed to load chat sessions:', error);
    return {
      success: false,
      sessions: [],
      error: error.message
    };
  }
}

/**
 * Get chat history for a specific session
 */
export async function getChatHistory(sessionId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1${COFOUNDER_CONFIG.endpoints.history}?sessionId=${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load chat history');
    }

    const data = await response.json();
    return {
      success: true,
      messages: data.messages || []
    };

  } catch (error: any) {
    console.error('❌ Failed to load chat history:', error);
    return {
      success: false,
      messages: [],
      error: error.message
    };
  }
}

// ============================================================================
// CONTEXT BUILDERS - Build rich context for different scenarios
// ============================================================================

/**
 * Build context for roadmap-specific interactions
 */
export function buildRoadmapContext(
  roadmapData: any,
  currentNode?: any
): Partial<CofounderChatContext> {
  const context: Partial<CofounderChatContext> = {
    currentPage: 'roadmap'
  };

  if (roadmapData) {
    context.roadmapProgress = {
      completedNodes: roadmapData.completedNodes || 0,
      totalNodes: roadmapData.totalNodes || 0,
      activeNodes: roadmapData.activeNodes || 0,
      currentStage: roadmapData.currentStage
    };
  }

  if (currentNode) {
    context.currentNode = {
      title: currentNode.title,
      description: currentNode.description
    };
  }

  return context;
}

/**
 * Build context for dashboard widget recommendations
 */
export function buildDashboardContext(
  currentWidgets: string[],
  businessContext?: any
): Partial<CofounderChatContext> {
  return {
    currentPage: 'dashboard',
    customContext: {
      currentWidgets,
      availableWidgets: 'all-dashboard-widgets'
    },
    businessName: businessContext?.name,
    industry: businessContext?.industry,
    stage: businessContext?.stage
  };
}

/**
 * Build context for general business chat
 */
export function buildBusinessContext(
  business: any,
  additionalContext?: Record<string, any>
): Partial<CofounderChatContext> {
  return {
    currentPage: 'chat',
    businessId: business?.id,
    businessName: business?.name,
    industry: business?.industry,
    stage: business?.stage || 'startup',
    customContext: additionalContext
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format conversation history for API
 */
export function formatConversationHistory(
  messages: any[],
  maxMessages: number = COFOUNDER_CONFIG.contextConfig.maxHistoryMessages
): CofounderChatMessage[] {
  return messages
    .slice(-maxMessages) // Get last N messages
    .map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
    }));
}

/**
 * Create a specialized prompt for specific use cases
 */
export function createSpecializedPrompt(
  baseMessage: string,
  specialization: 'roadmap' | 'dashboard' | 'operations'
): string {
  const prefixes = {
    roadmap: 'As my strategic partner helping me navigate my business roadmap: ',
    dashboard: 'As my business advisor helping me optimize my dashboard: ',
    operations: 'As my operations expert: '
  };

  return prefixes[specialization] + baseMessage;
}
