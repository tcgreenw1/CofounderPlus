import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

// Marketing quick actions that can be selected
const MARKETING_ACTIONS = [
  { id: 'blog', label: 'Blog Post', credits: 10 },
  { id: 'email', label: 'Email Campaign', credits: 10 },
  { id: 'social', label: 'Social Media', credits: 10 },
  { id: 'ad', label: 'Ad Copy', credits: 10 },
  { id: 'video', label: 'Video Script', credits: 10 },
  { id: 'seo', label: 'SEO Strategy', credits: 10 },
  { id: 'launch', label: 'Launch Campaign', credits: 10 },
  { id: 'growth', label: 'Growth Campaign', credits: 10 },
  { id: 'competitor', label: 'Competitor Analysis', credits: 10 },
  { id: 'market', label: 'Market Research', credits: 10 },
];

// POST /product-marketing - Create a product marketing plan
app.post('/', async (c) => {
  try {
    const { businessId, userId, productId, productData, planType, selectedActions } = await c.req.json();

    if (!businessId || !userId || !productId || !productData) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    console.log('📊 Creating product marketing plan:', { productId, planType });

    // Create a unique ID for this marketing plan
    const planId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine which actions to run
    let actionsToRun: string[] = [];
    
    if (planType === 'cofounder') {
      // Use GPT-4o to intelligently select actions
      actionsToRun = await selectMarketingActionsWithGPT(productData);
    } else {
      // Use user-selected actions
      actionsToRun = selectedActions || [];
    }

    // Store the marketing plan
    const marketingPlan = {
      id: planId,
      businessId,
      userId,
      productId,
      productData,
      planType,
      selectedActions: actionsToRun,
      status: 'processing',
      progress: 0,
      totalActions: actionsToRun.length,
      completedActions: 0,
      results: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`product_marketing:${businessId}:${planId}`, marketingPlan);

    console.log('✅ Product marketing plan created:', planId);
    console.log('🔑 Storage key:', `product_marketing:${businessId}:${planId}`);
    console.log('📦 Plan data:', JSON.stringify(marketingPlan, null, 2));

    // Calculate total credits (for response only - frontend will deduct)
    const totalCredits = actionsToRun.length * 10;
    
    console.log(`💰 Plan will require ${totalCredits} credits (${actionsToRun.length} actions x 10 credits)`);
    console.log('⚠️ Note: Credits should be deducted by frontend before calling this endpoint');

    // Start background processing
    processMarketingPlanInBackground(planId, businessId, userId, productData, actionsToRun);

    return c.json({ 
      success: true, 
      planId,
      actionsToRun,
      totalCredits,
      message: 'Marketing plan started. You will receive notifications as content is generated.'
    });
  } catch (error) {
    console.error('❌ Error creating product marketing plan:', error);
    return c.json({ error: 'Failed to create marketing plan', details: error.message }, 500);
  }
});

// GET /product-marketing - Get product marketing plans for a business
app.get('/', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const productId = c.req.query('productId');

    if (!businessId) {
      return c.json({ error: 'Missing businessId' }, 400);
    }

    console.log('📊 Fetching product marketing plans for business:', businessId);

    // Get all marketing plans for this business
    const allPlans = await kv.getByPrefix(`product_marketing:${businessId}:`);
    
    console.log('🔍 Debug: Retrieved plans from KV:', allPlans.length);
    console.log('🔍 Debug: Raw plans data:', JSON.stringify(allPlans, null, 2));
    
    // Filter by productId if provided
    let plans = allPlans;
    if (productId) {
      plans = allPlans.filter((plan: any) => plan.productId === productId);
      console.log('🔍 Debug: Filtered by productId:', productId, '- Found:', plans.length);
    }

    // Sort by creation date (newest first)
    plans.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('✅ Found', plans.length, 'marketing plans');

    return c.json({ plans });
  } catch (error) {
    console.error('❌ Error fetching product marketing plans:', error);
    return c.json({ error: 'Failed to fetch marketing plans', details: error.message }, 500);
  }
});

// GET /product-marketing/:planId - Get a specific marketing plan
app.get('/:planId', async (c) => {
  try {
    const { planId } = c.req.param();
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'Missing businessId' }, 400);
    }

    console.log('📊 Fetching marketing plan:', planId);

    const plan = await kv.get(`product_marketing:${businessId}:${planId}`);

    if (!plan) {
      return c.json({ error: 'Marketing plan not found' }, 404);
    }

    console.log('✅ Found marketing plan:', planId);

    return c.json({ plan });
  } catch (error) {
    console.error('❌ Error fetching marketing plan:', error);
    return c.json({ error: 'Failed to fetch marketing plan', details: error.message }, 500);
  }
});

// DELETE /product-marketing/:planId - Delete a marketing plan
app.delete('/:planId', async (c) => {
  try {
    const { planId } = c.req.param();
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'Missing businessId' }, 400);
    }

    console.log('🗑️ Deleting marketing plan:', planId);

    const key = `product_marketing:${businessId}:${planId}`;
    await kv.del(key);

    console.log('✅ Marketing plan deleted:', planId);

    return c.json({ success: true, message: 'Marketing plan deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting marketing plan:', error);
    return c.json({ error: 'Failed to delete marketing plan', details: error.message }, 500);
  }
});

// POST /product-marketing/:planId/retry - Retry a failed marketing plan
app.post('/:planId/retry', async (c) => {
  try {
    const { planId } = c.req.param();
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ error: 'Missing businessId' }, 400);
    }

    console.log('🔄 Retrying marketing plan:', planId);

    const plan = await kv.get(`product_marketing:${businessId}:${planId}`);

    if (!plan) {
      return c.json({ error: 'Marketing plan not found' }, 404);
    }

    // Only retry if plan is failed or partial
    if (plan.status !== 'failed' && plan.status !== 'partial') {
      return c.json({ error: 'Can only retry failed or partial plans' }, 400);
    }

    // Get failed actions
    const failedActions = plan.results
      .filter((r: any) => r.status === 'failed')
      .map((r: any) => r.actionId);

    if (failedActions.length === 0) {
      return c.json({ error: 'No failed actions to retry' }, 400);
    }

    // Reset plan to processing
    const updatedPlan = {
      ...plan,
      status: 'processing',
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`product_marketing:${businessId}:${planId}`, updatedPlan);

    // Restart processing for failed actions
    processMarketingPlanInBackground(
      planId,
      businessId,
      plan.userId,
      plan.productData,
      failedActions
    );

    console.log('✅ Marketing plan retry started:', planId);

    return c.json({ 
      success: true, 
      message: 'Retry started',
      failedActionsCount: failedActions.length
    });
  } catch (error) {
    console.error('❌ Error retrying marketing plan:', error);
    return c.json({ error: 'Failed to retry marketing plan', details: error.message }, 500);
  }
});

// Helper function: Use GPT-4o to intelligently select marketing actions
async function selectMarketingActionsWithGPT(productData: any): Promise<string[]> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not found, using default actions');
      return ['blog', 'social', 'email', 'ad', 'seo']; // Default fallback
    }

    const prompt = `You are a marketing strategist analyzing an ecommerce product to determine the most effective marketing actions.

Product Information:
- Name: ${productData.productName || 'Unknown'}
- Description: ${productData.productDescription || 'Not provided'}
- Type: ${productData.type || 'Unknown'}
- Target Customer: ${productData.whoBuys || 'Not specified'}
- Distribution Channels: ${productData.whereHangOut || 'Not specified'}
- Competitive Advantage: ${productData.whyWin || 'Not specified'}
- Market Differentiator: ${productData.differentiator || 'Unknown'}

Available Marketing Actions:
${MARKETING_ACTIONS.map(a => `- ${a.id}: ${a.label}`).join('\n')}

Based on this product information, select the 5-7 most effective marketing actions that would create a comprehensive marketing strategy. Return ONLY a JSON array of action IDs.

Example response format: ["blog", "social", "email", "ad", "seo"]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a marketing strategist. Always respond with valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error('❌ GPT-4o API error:', response.status);
      return ['blog', 'social', 'email', 'ad', 'seo']; // Default fallback
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Strip markdown code blocks if present (e.g., ```json ... ```)
    let cleanContent = content;
    if (cleanContent.startsWith('```')) {
      // Remove opening code block marker (```json or ```)
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '');
      // Remove closing code block marker
      cleanContent = cleanContent.replace(/\n?```$/, '');
      cleanContent = cleanContent.trim();
    }
    
    // Parse the JSON response
    const selectedActions = JSON.parse(cleanContent);
    
    // Validate that we got an array
    if (!Array.isArray(selectedActions)) {
      console.error('❌ GPT-4o did not return an array, using fallback');
      return ['blog', 'social', 'email', 'ad', 'seo'];
    }
    
    // Validate that all actions are valid
    const validActionIds = MARKETING_ACTIONS.map(a => a.id);
    const validatedActions = selectedActions.filter(id => validActionIds.includes(id));
    
    if (validatedActions.length === 0) {
      console.error('❌ No valid actions in GPT-4o response, using fallback');
      return ['blog', 'social', 'email', 'ad', 'seo'];
    }
    
    console.log('✅ GPT-4o selected marketing actions:', validatedActions);
    
    return validatedActions;
  } catch (error) {
    console.error('❌ Error selecting marketing actions with GPT:', error);
    // Return default actions as fallback
    return ['blog', 'social', 'email', 'ad', 'seo'];
  }
}

// Helper function: Process marketing plan in background
async function processMarketingPlanInBackground(
  planId: string,
  businessId: string,
  userId: string,
  productData: any,
  actionsToRun: string[]
) {
  // This runs asynchronously without blocking the response
  (async () => {
    const maxRetries = 3;
    const timeoutMs = 600000; // 10 minute timeout per action
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting background processing for plan:', planId);

      // Send initial notification
      await createNotification(businessId, userId, {
        title: 'Marketing Plan Started',
        message: `Generating ${actionsToRun.length} marketing pieces for ${productData.productName || 'your product'}`,
        type: 'info',
        category: 'marketing',
      });

      const results = [];
      let completedCount = 0;
      let hasErrors = false;

      for (const actionId of actionsToRun) {
        // Check overall timeout
        if (Date.now() - startTime > timeoutMs * actionsToRun.length) {
          console.error('❌ Overall timeout exceeded for plan:', planId);
          hasErrors = true;
          break;
        }

        let retryCount = 0;
        let actionCompleted = false;

        while (retryCount < maxRetries && !actionCompleted) {
          try {
            console.log(`📝 Generating content for action: ${actionId} (attempt ${retryCount + 1}/${maxRetries})`);

            // Add timeout to individual API call
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);

            try {
              // Generate content for this action
              const contentData = await Promise.race([
                generateMarketingContent(actionId, productData),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Action timeout')), timeoutMs)
                )
              ]);

              clearTimeout(timeout);

              // Store the result
              const result = {
                actionId,
                actionLabel: MARKETING_ACTIONS.find(a => a.id === actionId)?.label || actionId,
                content: contentData.content,
                status: 'completed',
                completedAt: new Date().toISOString(),
              };

              results.push(result);
              completedCount++;
              actionCompleted = true;

              // Update progress
              const plan = await kv.get(`product_marketing:${businessId}:${planId}`);
              if (plan) {
                const updatedPlan = {
                  ...plan,
                  completedActions: completedCount,
                  progress: Math.round((completedCount / actionsToRun.length) * 100),
                  results,
                  updatedAt: new Date().toISOString(),
                };
                await kv.set(`product_marketing:${businessId}:${planId}`, updatedPlan);
              }

              // Send progress notification
              await createNotification(businessId, userId, {
                title: `${result.actionLabel} Complete`,
                message: `${completedCount}/${actionsToRun.length} marketing pieces generated`,
                type: 'success',
                category: 'marketing',
              });

              console.log(`✅ Completed ${actionId} (${completedCount}/${actionsToRun.length})`);
              
              // Add delay before next API call to avoid rate limiting (3 seconds)
              if (completedCount < actionsToRun.length) {
                console.log('⏳ Waiting 3 seconds before next generation to avoid rate limits...');
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
            } catch (timeoutError) {
              clearTimeout(timeout);
              throw timeoutError;
            }
          } catch (error) {
            retryCount++;
            hasErrors = true;
            console.error(`❌ Error generating content for ${actionId} (attempt ${retryCount}/${maxRetries}):`, error);
            
            if (retryCount >= maxRetries) {
              // Store error result after all retries exhausted
              results.push({
                actionId,
                actionLabel: MARKETING_ACTIONS.find(a => a.id === actionId)?.label || actionId,
                status: 'failed',
                error: error.message || 'Generation failed after multiple retries',
                completedAt: new Date().toISOString(),
              });
              
              // Still increment completed count to track progress
              completedCount++;
              
              // Update plan with error
              const plan = await kv.get(`product_marketing:${businessId}:${planId}`);
              if (plan) {
                const updatedPlan = {
                  ...plan,
                  completedActions: completedCount,
                  progress: Math.round((completedCount / actionsToRun.length) * 100),
                  results,
                  updatedAt: new Date().toISOString(),
                };
                await kv.set(`product_marketing:${businessId}:${planId}`, updatedPlan);
              }
              
              console.log(`❌ Failed ${actionId} after ${maxRetries} retries`);
            } else {
              // Wait before retry (exponential backoff)
              const waitTime = Math.min(3000 * Math.pow(2, retryCount - 1), 10000);
              console.log(`⏳ Waiting ${waitTime/1000} seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
      }

      // Mark plan as completed or partial
      const finalPlan = await kv.get(`product_marketing:${businessId}:${planId}`);
      if (finalPlan) {
        const successfulActions = results.filter(r => r.status === 'completed').length;
        const failedActions = results.filter(r => r.status === 'failed').length;
        
        const finalStatus = failedActions === 0 ? 'completed' : 
                           successfulActions > 0 ? 'partial' : 'failed';
        
        const updatedPlan = {
          ...finalPlan,
          status: finalStatus,
          completedActions: completedCount,
          progress: 100,
          results,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await kv.set(`product_marketing:${businessId}:${planId}`, updatedPlan);
      }

      // Send completion notification
      const successfulCount = results.filter(r => r.status === 'completed').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      
      if (failedCount === 0) {
        await createNotification(businessId, userId, {
          title: 'Marketing Plan Complete!',
          message: `All ${successfulCount} marketing pieces for ${productData.productName || 'your product'} are ready in the Studio tab`,
          type: 'success',
          category: 'marketing',
        });
      } else if (successfulCount > 0) {
        await createNotification(businessId, userId, {
          title: 'Marketing Plan Partially Complete',
          message: `${successfulCount} of ${actionsToRun.length} marketing pieces completed. ${failedCount} failed. Check the Studio tab for details.`,
          type: 'warning',
          category: 'marketing',
        });
      } else {
        await createNotification(businessId, userId, {
          title: 'Marketing Plan Failed',
          message: `Unable to generate marketing content. Please try again or contact support.`,
          type: 'error',
          category: 'marketing',
        });
      }

      console.log('✅ Background processing completed for plan:', planId);
      console.log(`📊 Final stats: ${successfulCount} successful, ${failedCount} failed`);
    } catch (error) {
      console.error('❌ Critical error in background processing:', error);
      
      // Mark plan as failed
      try {
        const failedPlan = await kv.get(`product_marketing:${businessId}:${planId}`);
        if (failedPlan) {
          const updatedPlan = {
            ...failedPlan,
            status: 'failed',
            error: error.message || 'Unknown error occurred',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await kv.set(`product_marketing:${businessId}:${planId}`, updatedPlan);
        }
        
        // Send error notification
        await createNotification(businessId, userId, {
          title: 'Marketing Plan Failed',
          message: `An error occurred while generating marketing content. Please try again.`,
          type: 'error',
          category: 'marketing',
        });
      } catch (updateError) {
        console.error('❌ Failed to update plan with error status:', updateError);
      }
    }
  })();
}

// Helper function: Generate marketing content using GPT-4o
async function generateMarketingContent(actionId: string, productData: any): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompts: Record<string, string> = {
    blog: `Write a comprehensive blog post (800-1000 words) about this product. Include an engaging headline, introduction, main content sections, and conclusion.`,
    email: `Create an email campaign for this product. Include subject line, preview text, email body with clear call-to-action.`,
    social: `Generate 10 social media posts for this product across different platforms (Twitter, Instagram, LinkedIn, Facebook). Include hashtags and emojis where appropriate.`,
    ad: `Write compelling ad copy for this product. Create 3 variations: short (25 words), medium (50 words), and long (100 words). Include strong call-to-actions.`,
    video: `Create a video script for this product. Include hook (first 5 seconds), main content, and call-to-action. Format as a shot-by-shot breakdown.`,
    seo: `Develop an SEO strategy for this product. Include target keywords, meta descriptions, content topics, backlink opportunities.`,
    launch: `Create a product launch campaign strategy. Include timeline, channels, messaging, key milestones, and success metrics.`,
    growth: `Develop a growth marketing strategy for this product. Include acquisition channels, retention tactics, and scaling recommendations.`,
    competitor: `Analyze the competitive landscape for this product. Identify main competitors, their strengths/weaknesses, and differentiation opportunities.`,
    market: `Conduct market research for this product. Include target market size, customer segments, pricing analysis, and market trends.`,
  };

  const systemPrompt = `You are a professional marketing content creator. Create high-quality, actionable marketing content that drives results.`;

  const userPrompt = `${prompts[actionId] || prompts.blog}

Product Information:
- Name: ${productData.productName || 'Unknown'}
- Description: ${productData.productDescription || 'Not provided'}
- Type: ${productData.type || 'Unknown'}
- Target Customer: ${productData.whoBuys || 'Not specified'}
- Distribution Channels: ${productData.whereHangOut || 'Not specified'}
- Competitive Advantage: ${productData.whyWin || 'Not specified'}
- Market Differentiator: ${productData.differentiator || 'Unknown'}

Provide detailed, professional content that is ready to use.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GPT-4o API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  return {
    type: actionId,
    content,
    generatedAt: new Date().toISOString(),
  };
}

// Helper function: Create a notification
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

export default app;