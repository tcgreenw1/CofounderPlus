/**
 * Automation Scheduler
 * Runs scheduled automations based on their configured frequency
 * Checks every hour for automations that need to run
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { storeAutomationResult } from './automation-storage.tsx';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY ?? '');

// Import automation execution logic from automation-endpoints
// We'll duplicate the necessary functions here to avoid circular dependencies

/**
 * Load chat history for context
 */
async function loadChatHistory(userId: string, businessId: string) {
  try {
    const historyKeys = await kv.getByPrefix(`chat_history:${userId}:${businessId}`);
    if (historyKeys && historyKeys.length > 0) {
      const messages = historyKeys
        .map(item => {
          if (typeof item.value === 'object') {
            return item.value;
          }
          return JSON.parse(item.value);
        })
        .flat()
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
      return messages;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading chat history:', error);
    return [];
  }
}

/**
 * Load business context
 */
async function loadBusinessContext(userId: string, businessId: string) {
  try {
    const contextKey = `business_context:${userId}:${businessId}`;
    const contextData = await kv.get(contextKey);
    if (contextData) {
      if (typeof contextData === 'object') {
        return contextData;
      }
      return JSON.parse(contextData);
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading business context:', error);
    return null;
  }
}

/**
 * Load relevant data based on automation type
 */
async function loadAutomationData(userId: string, businessId: string, automationId: string) {
  const data: any = {};

  try {
    if (automationId.includes('product') || automationId.includes('roadmap')) {
      const roadmapData = await kv.getByPrefix(`roadmap:${userId}:${businessId}`);
      data.roadmap = roadmapData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('sales') || automationId.includes('lead') || automationId.includes('deal')) {
      const salesData = await kv.getByPrefix(`sales:${userId}:${businessId}`);
      data.sales = salesData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('marketing') || automationId.includes('campaign')) {
      const marketingData = await kv.getByPrefix(`marketing:${userId}:${businessId}`);
      data.marketing = marketingData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('finance') || automationId.includes('expense') || automationId.includes('cash')) {
      const financeData = await kv.getByPrefix(`finance:${userId}:${businessId}`);
      data.finance = financeData?.map(item => JSON.parse(item.value)) || [];
    }

    if (automationId.includes('hr') || automationId.includes('handbook') || automationId.includes('onboarding')) {
      const hrData = await kv.getByPrefix(`hr:${userId}:${businessId}`);
      data.hr = hrData?.map(item => JSON.parse(item.value)) || [];
    }

    return data;
  } catch (error) {
    console.error('❌ Error loading automation data:', error);
    return data;
  }
}

/**
 * Get automation prompt (simplified version - full version in automation-endpoints.tsx)
 */
function getAutomationPrompt(automationId: string, context: any) {
  const userInput = context.userInput || {};
  
  // Default generic prompt
  return `You are a business automation assistant. Analyze the following business data and provide actionable insights for the automation: ${automationId}

**User Configuration:**
${JSON.stringify(userInput, null, 2)}

**Business Context:**
${JSON.stringify(context.business, null, 2)}

**Relevant Data:**
${JSON.stringify(context.data, null, 2)}

**Recent Activity:**
${JSON.stringify(context.chatHistory?.slice(0, 5), null, 2)}

Provide detailed, actionable insights based on the data. Format responses as JSON when appropriate for structured data.`;
}

/**
 * Execute automation using GPT-4o
 */
async function executeAutomation(automationId: string, context: any) {
  try {
    const prompt = getAutomationPrompt(automationId, context);

    console.log(`🤖 Executing scheduled automation: ${automationId}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a business automation assistant. Provide detailed, actionable insights based on the data provided. Format responses as JSON when appropriate for structured data (like scores, lists, or reports).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content;

    console.log(`✅ Scheduled automation ${automationId} completed`);

    return result;
  } catch (error: any) {
    console.error(`❌ Error executing scheduled automation ${automationId}:`, error);
    throw error;
  }
}

/**
 * Format automation title
 */
function formatAutomationTitle(automationId: string) {
  return automationId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get automation category
 */
function getAutomationCategory(automationId: string): string {
  if (automationId.includes('product')) return 'product';
  if (automationId.includes('sales') || automationId.includes('lead')) return 'sales';
  if (automationId.includes('marketing') || automationId.includes('campaign')) return 'marketing';
  if (automationId.includes('finance') || automationId.includes('expense') || automationId.includes('cash')) return 'finance';
  if (automationId.includes('hr') || automationId.includes('handbook')) return 'hr';
  return 'general';
}

/**
 * Check if automation should run based on frequency and last run time
 */
function shouldRunAutomation(
  frequency: string,
  lastRunTimestamp: number | null
): boolean {
  if (!lastRunTimestamp) {
    // Never run before, should run
    return true;
  }

  const now = Date.now();
  const hoursSinceLastRun = (now - lastRunTimestamp) / (1000 * 60 * 60);

  switch (frequency) {
    case 'Daily':
      // Run if 24 hours have passed (with 1 hour buffer)
      return hoursSinceLastRun >= 23;
    
    case 'Weekly':
      // Run if 7 days have passed (168 hours, with 1 hour buffer)
      return hoursSinceLastRun >= 167;
    
    case 'Monthly':
      // Run if 30 days have passed (720 hours, with 2 hour buffer)
      return hoursSinceLastRun >= 718;
    
    case 'Quarterly':
      // Run if 90 days have passed (2160 hours, with 6 hour buffer)
      return hoursSinceLastRun >= 2154;
    
    default:
      return false;
  }
}

/**
 * Process scheduled automations for all users
 */
export async function processScheduledAutomations() {
  try {
    console.log('⏰ Starting scheduled automation check...');

    // Get all cofounder settings from KV store
    const allSettings = await kv.getByPrefix('business:');
    
    if (!allSettings || allSettings.length === 0) {
      console.log('ℹ️ No business settings found');
      return;
    }

    console.log(`📋 Found ${allSettings.length} business settings to check`);

    let automationsRun = 0;
    let automationsSkipped = 0;

    for (const settingItem of allSettings) {
      try {
        // Only process cofounder_settings
        if (!settingItem.key.includes('cofounder_settings')) {
          continue;
        }

        // Parse key to extract userId and businessId
        // Format: business:{userId}:{businessId}:cofounder_settings
        const keyParts = settingItem.key.split(':');
        if (keyParts.length !== 4) {
          console.warn(`⚠️ Invalid key format: ${settingItem.key}`);
          continue;
        }

        const userId = keyParts[1];
        const businessId = keyParts[2];

        // Parse settings
        let settings;
        if (typeof settingItem.value === 'string') {
          settings = JSON.parse(settingItem.value);
        } else {
          settings = settingItem.value;
        }

        // Check if AGI is enabled
        if (!settings.agiEnabled) {
          console.log(`⏭️ Skipping ${businessId} - AGI disabled`);
          continue;
        }

        // Check each automation
        const automations = settings.automations || [];
        
        for (const automation of automations) {
          if (!automation.enabled) {
            automationsSkipped++;
            continue;
          }

          // Get last run timestamp for this automation
          const lastRunKey = `automation_last_run:${userId}:${businessId}:${automation.id}`;
          const lastRunData = await kv.get(lastRunKey);
          const lastRunTimestamp = lastRunData ? Number(lastRunData) : null;

          // Check if it should run
          if (!shouldRunAutomation(automation.frequency, lastRunTimestamp)) {
            automationsSkipped++;
            continue;
          }

          console.log(`🚀 Running scheduled automation: ${automation.id} for business ${businessId}`);

          try {
            // Load context
            const [chatHistory, businessContext, automationData] = await Promise.all([
              loadChatHistory(userId, businessId),
              loadBusinessContext(userId, businessId),
              loadAutomationData(userId, businessId, automation.id)
            ]);

            const context = {
              chatHistory,
              business: businessContext,
              data: automationData,
              userInput: automation.configuration || {}
            };

            // Execute automation
            const result = await executeAutomation(automation.id, context);

            // Store result
            await storeAutomationResult(
              userId,
              businessId,
              automation.id,
              result,
              automation.configuration
            );

            // Update last run timestamp
            await kv.set(lastRunKey, Date.now().toString());

            // Create completion notification
            const notificationId = `automation_notification:${userId}:${businessId}:${automation.id}:${Date.now()}`;
            const notification = {
              id: notificationId,
              type: 'automation_complete',
              businessId,
              automationId: automation.id,
              title: `${formatAutomationTitle(automation.id)} Complete`,
              message: 'Your scheduled automation has finished running. View results in your Cofounder chat.',
              priority: 'normal',
              category: getAutomationCategory(automation.id),
              status: 'completed',
              resultKey: `automation_result:${userId}:${businessId}:${automation.id}`,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            };

            await kv.set(notificationId, notification);

            console.log(`✅ Automation ${automation.id} completed successfully`);
            automationsRun++;

          } catch (error) {
            console.error(`❌ Error running automation ${automation.id}:`, error);

            // Create error notification
            const errorNotificationId = `automation_notification:${userId}:${businessId}:${automation.id}:${Date.now()}`;
            const errorNotification = {
              id: errorNotificationId,
              type: 'automation_error',
              businessId,
              automationId: automation.id,
              title: `${formatAutomationTitle(automation.id)} Failed`,
              message: 'Your scheduled automation encountered an error. Please try running it manually.',
              priority: 'high',
              category: getAutomationCategory(automation.id),
              status: 'error',
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            };

            await kv.set(errorNotificationId, errorNotification);
          }
        }

      } catch (error) {
        console.error(`❌ Error processing settings ${settingItem.key}:`, error);
      }
    }

    console.log(`✅ Scheduled automation check complete: ${automationsRun} run, ${automationsSkipped} skipped`);

  } catch (error) {
    console.error('❌ Error in scheduled automation processor:', error);
  }
}

/**
 * Start the scheduler (runs every hour)
 */
export function startScheduler() {
  console.log('🕐 Starting automation scheduler (runs every hour)');

  // Run immediately on startup
  processScheduledAutomations();

  // Then run every hour
  setInterval(() => {
    processScheduledAutomations();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
}
