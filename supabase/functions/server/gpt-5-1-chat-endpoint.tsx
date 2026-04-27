/**
 * GPT-5.1 Chat Endpoint with Function Calling
 * 
 * Key differences from GPT-4o:
 * 1. Uses /v1/chat/completions endpoint (not /v1/responses)
 * 2. Tools format: direct name property (not nested in function)
 * 3. Response uses tool_calls[] (not function_call)
 * 4. Strict JSON Schema validation
 */

import { Hono } from 'npm:hono@4';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { loadUnifiedMemory } from './chat-memory-helpers.tsx';
import { buildSystemMessage } from './chat-system-message.tsx';
import { ALL_FUNCTIONS_GPT51 } from './gpt-5-1-function-definitions.ts';
import { executeFunctionCall } from './function-handlers.ts';

const app = new Hono();

// Categorize functions as READ (2 credits) vs WRITE (10 credits)
const READ_FUNCTIONS = ['getProducts'];
const WRITE_FUNCTIONS = [
  'createTransaction', 'updateTransaction', 'deleteTransaction', 'createBudget',
  'createRoadmapTask', 'updateRoadmapTaskStatus', 'deleteRoadmapTask',
  'addTeamMember', 'updateTeamMember', 'createProduct', 'updateProduct',
  'createSalesLead', 'updateSalesLead', 
  'createSalesDeal', 'updateSalesDeal', 'deleteSalesDeal',
  'createSalesCustomer', 'updateSalesCustomer', 'deleteSalesCustomer',
  'createSalesEmailSequence', 'updateSalesEmailSequence', 'deleteSalesEmailSequence',
  'createMarketingCampaign', 'updateMarketingCampaign',
  'createMarketingLead', 'updateMarketingLead', 'deleteMarketingLead',
  'createNote', 'createHandbook', 'updateHandbook', 'deleteHandbook',
  'createOnboardingPlan', 'updateOnboardingPlan', 'deleteOnboardingPlan',
  'createEmployeeBenefit', 'updateEmployeeBenefit', 'deleteEmployeeBenefit',
  'createEmployeePerformance', 'updateEmployeePerformance', 'deleteEmployeePerformance',
  'createContractor', 'updateContractor', 'deleteContractor',
  'updateUserProfile'
];

function getCreditCost(functionName: string): number {
  if (READ_FUNCTIONS.includes(functionName)) return 2;
  if (WRITE_FUNCTIONS.includes(functionName)) return 10;
  return 1; // Default
}

// Helper function: Retry auth requests with exponential backoff
async function retryAuthRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      const errorMessage = error?.message || String(error);
      
      const shouldRetry = 
        errorMessage.includes('connection reset') ||
        errorMessage.includes('connection error') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('socket hang up') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('503') ||
        errorMessage.includes('502') ||
        errorMessage.includes('500');
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

// Verify user access with robust checks
async function verifyUserAccess(accessToken: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  try {
    const { data: { user }, error } = await retryAuthRequest(() => 
      supabase.auth.getUser(accessToken)
    );
    
    if (error || !user) {
      // Manual JWT decode check for anon tokens
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.role === 'anon') {
             console.error('❌ Anonymous token rejected');
          }
        }
      } catch (e) {
        // Ignore decode errors
      }
      throw new Error('Unauthorized');
    }
    
    return user;
  } catch (error: any) {
    console.error('❌ Auth verification failed:', error.message);
    throw new Error('Unauthorized');
  }
}

// GPT-5.1 Chat endpoint with function calling
app.post('/gpt-5-1-chat', async (c) => {
  try {
    console.log('🚀 GPT-5.1 Chat Endpoint Called');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization required' }, 401);
    }

    const user = await verifyUserAccess(accessToken);
    const body = await c.req.json();
    const { message, sessionId, conversationHistory, businessContext } = body;

    console.log('📝 Request:', { message, businessContext: businessContext?.id });

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Don't deduct credits yet - we'll calculate the correct amount after knowing what functions are called
    const { deductUserCredits } = await import('./credits-endpoints.tsx');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }

    // Load unified memory
    const unifiedMemory = businessContext?.id ? await loadUnifiedMemory(businessContext.id) : '';
    
    console.log(`🧠 Unified Memory: ${unifiedMemory ? 'YES' : 'NO'}`);

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: buildSystemMessage(businessContext, unifiedMemory)
      }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('🔧 Tools count:', ALL_FUNCTIONS_GPT51.length);

    // Make request to OpenAI with GPT-5.1
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: messages,
        tools: ALL_FUNCTIONS_GPT51, // NEW FORMAT: tools directly, not wrapped in function
        tool_choice: 'auto', // Let GPT decide when to use tools
        temperature: 0.7,
        max_completion_tokens: 2000, // GPT-5.1 uses max_completion_tokens (not max_tokens)
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI Error:', errorText);
      return c.json({ 
        error: `OpenAI request failed: ${errorText}` 
      }, openaiResponse.status);
    }

    const data = await openaiResponse.json();
    console.log('📦 OpenAI Response:', JSON.stringify(data, null, 2));

    const message_obj = data.choices[0].message;
    let aiResponse = message_obj.content || '';
    const functionsExecuted: any[] = [];

    // NEW GPT-5.1 FORMAT: Check for tool_calls (not function_call)
    if (message_obj.tool_calls && message_obj.tool_calls.length > 0) {
      console.log(`🔨 Processing ${message_obj.tool_calls.length} tool calls...`);

      for (const toolCall of message_obj.tool_calls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

          console.log(`⚙️  Executing: ${functionName}`, functionArgs);

          try {
            // CRITICAL FIX: Override businessId with the correct ID from businessContext
            // GPT might use the business name instead of the ID, so we force the correct one
            if (businessContext?.id && !functionArgs.businessId) {
              functionArgs.businessId = businessContext.id;
              console.log(`💡 Auto-injected businessId: ${businessContext.id}`);
            } else if (businessContext?.id && functionArgs.businessId !== businessContext.id) {
              console.log(`⚠️  Correcting businessId from "${functionArgs.businessId}" to "${businessContext.id}"`);
              functionArgs.businessId = businessContext.id;
            }

            // Execute the function using existing handler
            const result = await executeFunctionCall(functionName, functionArgs, user.id);
            
            functionsExecuted.push({
              name: functionName,
              arguments: functionArgs,
              result: result
            });

            console.log(`✅ ${functionName} executed:`, result?.success ? 'SUCCESS' : 'FAILED');
          } catch (error: any) {
            console.error(`❌ Function execution error for ${functionName}:`, error);
            functionsExecuted.push({
              name: functionName,
              arguments: functionArgs,
              result: {
                success: false,
                error: error.message
              }
            });
          }
        }
      }

      // If AI didn't provide text response, create one based on function results
      if (!aiResponse && functionsExecuted.length > 0) {
        const successCount = functionsExecuted.filter(f => f.result?.success).length;
        const failedCount = functionsExecuted.length - successCount;
        
        // Create personable response based on what was done
        if (successCount > 0 && failedCount === 0) {
          // All successful - be enthusiastic and specific
          const functionSummaries = functionsExecuted.map(f => {
            const funcName = f.name;
            const args = f.arguments;
            
            // Generate natural language description of what was done
            if (funcName.startsWith('create')) {
              const entityType = funcName.replace('create', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
              const name = args.title || args.name || args.firstName || args.email || 'it';
              return `created ${entityType} "${name}"`;
            } else if (funcName.startsWith('update')) {
              const entityType = funcName.replace('update', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
              return `updated ${entityType}`;
            } else if (funcName.startsWith('delete')) {
              const entityType = funcName.replace('delete', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
              return `deleted ${entityType}`;
            } else if (funcName.startsWith('add')) {
              return `added ${args.name || args.title || 'new item'}`;
            } else {
              return `completed ${funcName}`;
            }
          });
          
          if (functionsExecuted.length === 1) {
            aiResponse = `Done! I've ${functionSummaries[0]}.`;
          } else {
            aiResponse = `All set! I've ${functionSummaries.slice(0, -1).join(', ')} and ${functionSummaries[functionsExecuted.length - 1]}.`;
          }
        } else if (successCount > 0 && failedCount > 0) {
          // Mixed results
          aiResponse = `I was able to complete ${successCount} ${successCount === 1 ? 'action' : 'actions'}, but ${failedCount} ${failedCount === 1 ? 'failed' : 'failed'}. Let me know if you'd like me to try again.`;
        } else {
          // All failed
          aiResponse = `I ran into some issues trying to complete that. Could you provide more details or try rephrasing your request?`;
        }
      }
    } else {
      console.log('💬 No tool calls - standard chat response');
    }

    // Calculate total credits to deduct based on functions executed
    let totalCredits = 1; // Base credit for regular message
    for (const func of functionsExecuted) {
      totalCredits += getCreditCost(func.name);
    }

    // Deduct credits
    let deductResult = await deductUserCredits(user.id, totalCredits, 'Cofounder Chat Message (GPT-5.1)');

    if (!deductResult.success) {
      console.log('❌ Credit deduction failed:', deductResult.error);
      return c.json({ 
        error: deductResult.error || 'Insufficient credits',
        needsUpgrade: true,
        remainingCredits: deductResult.remainingCredits
      }, 402);
    }

    console.log('✅ Credit deduction successful. Remaining:', deductResult.remainingCredits);

    // Save message to KV store
    if (sessionId) {
      try {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const messageData = {
          id: messageId,
          user_message: message,
          ai_response: aiResponse,
          timestamp: new Date().toISOString(),
          session_id: sessionId,
          user_id: user.id,
          business_id: businessContext?.id || null,
          functions_executed: functionsExecuted
        };
        
        // Use a non-blocking promise or separate try/catch to ensure response isn't blocked/failed by logging
        await kv.set(`ai_chat_message:${user.id}:${sessionId}:${messageId}`, JSON.stringify(messageData))
          .catch(err => console.error('❌ Failed to save chat message to KV:', err));

        // Update or create session
        const sessionKey = `ai_chat_session:${user.id}:${sessionId}`;
        
        // Don't fail if session update fails
        try {
          // Try to fetch existing session first
          let sessionStr = null;
          try {
            sessionStr = await kv.get(sessionKey);
          } catch (getError) {
            // If get fails, we might still want to try creating a new one or just ignore
            console.warn('⚠️ Failed to fetch session for update (non-critical):', getError.message);
          }

          if (sessionStr) {
            // Update existing session
            const session = typeof sessionStr === 'string' ? JSON.parse(sessionStr) : sessionStr;
            const updatedSession = {
              ...session,
              last_message: message.substring(0, 100),
              updated_at: new Date().toISOString()
            };
            await kv.set(sessionKey, JSON.stringify(updatedSession));
          } else {
            // Create new session if it doesn't exist
            const newSession = {
              id: sessionId,
              user_id: user.id,
              business_id: businessContext?.id || null,
              title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              last_message: message.substring(0, 100),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await kv.set(sessionKey, JSON.stringify(newSession));
            console.log(`✅ Created new session: ${sessionId}`);
          }
        } catch (sessionError: any) {
          // Log as warning instead of error to prevent alarming logs for non-critical updates
          if (sessionError.message?.includes('timeout')) {
            console.warn('⚠️ Session update timed out (non-critical, skipped)');
          } else {
            console.warn('⚠️ Failed to update chat session:', sessionError.message);
          }
        }
      } catch (kvError) {
        console.error('❌ Critical KV Store Error (History):', kvError);
        // Do NOT throw, allow response to return
      }
    }

    console.log('✅ GPT-5.1 Response complete');

    return c.json({
      response: aiResponse,
      functionsExecuted: functionsExecuted,
      model: 'gpt-5.1',
      credits_remaining: deductResult.remainingCredits
    });

  } catch (error: any) {
    console.error('❌ GPT-5.1 Chat Error:', error);
    return c.json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});

export default app;