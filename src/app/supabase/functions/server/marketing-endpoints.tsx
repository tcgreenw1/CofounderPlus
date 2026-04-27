import { Hono } from 'npm:hono@4';
import * as kv from './kv_store.tsx';

// Marketing endpoints for campaign management and content generation
const app = new Hono();

// Helper function to call OpenAI/ChatGPT
async function callChatGPT(prompt: string, maxTokens: number = 8000): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: 'gpt-5.1',
      input: [
        {
          role: 'system',
          content: `You are an expert marketing strategist and content creator. You help businesses create compelling marketing campaigns, content strategies, and brand messaging. You understand SEO, social media, email marketing, content marketing, and paid advertising. Provide actionable, data-driven insights and creative solutions.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_output_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  
  const content =
    data.output_text ??
    data?.output?.[0]?.content?.[0]?.text ??
    "";
  
  // Check if response was truncated
  const finishReason = data?.output?.[0]?.finish_reason || data.finish_reason;
  if (finishReason === 'length') {
    console.warn('⚠️ ChatGPT response was truncated due to length limit');
    throw new Error('Response was too long and got truncated. Please try a more specific query or reduce the scope.');
  }
  
  return content;
}

// Content Generation Endpoint
app.post('/marketing/generate-content', async (c) => {
  try {
    const { 
      contentType, 
      topic, 
      tone, 
      targetAudience, 
      keywords,
      length,
      platform,
      businessId 
    } = await c.req.json();

    if (!contentType || !topic) {
      return c.json({ success: false, error: 'Content type and topic are required' }, 400);
    }

    // Convert length descriptors to word counts
    const getLengthGuidance = (lengthType: string) => {
      switch (lengthType) {
        case 'short':
          return '500-700 words (quick read, 3-4 minutes)';
        case 'medium':
          return '1000-1500 words (standard, 5-7 minutes)';
        case 'long':
          return '2000-3000 words (comprehensive, 10-15 minutes)';
        default:
          return '1000-1500 words';
      }
    };

    let prompt = '';
    
    switch (contentType) {
      case 'blog':
        prompt = `Create a comprehensive blog post about: ${topic}

${tone ? `Tone: ${tone}` : 'Tone: Professional and engaging'}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${keywords ? `SEO Keywords to include: ${keywords}` : ''}
Target length: ${length ? getLengthGuidance(length) : getLengthGuidance('medium')}

Please provide:
1. **Title**: SEO-optimized, compelling headline
2. **Meta Description**: 150-160 characters for SEO
3. **Content**: Full blog post with proper formatting (use markdown)
4. **Key Takeaways**: 3-5 bullet points summarizing main points
5. **CTA**: A compelling call-to-action
6. **SEO Keywords**: List of relevant keywords used
7. **Readability Score**: Estimated grade level

Return as JSON with this structure:
{
  "title": "string",
  "metaDescription": "string",
  "content": "string (markdown formatted)",
  "keyTakeaways": ["string"],
  "cta": "string",
  "seoKeywords": ["string"],
  "readabilityScore": "string"
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
        break;

      case 'email':
        prompt = `Create an email campaign about: ${topic}

${tone ? `Tone: ${tone}` : 'Tone: Friendly and persuasive'}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${platform ? `Email platform: ${platform}` : ''}
${length ? `Email length: ${length === 'short' ? 'Brief and to the point' : length === 'long' ? 'Detailed and comprehensive' : 'Standard length'}` : ''}

Please provide:
1. **Subject Line**: Compelling, high open-rate subject line
2. **Preview Text**: First line that appears in inbox
3. **Body**: Full email content with proper formatting
4. **CTA Button Text**: Action-oriented button text
5. **Alternative Subject Lines**: 2-3 alternative subject lines to A/B test
6. **Best Send Time**: Recommended day and time to send
7. **Personalization Tags**: Suggested merge tags to use

Return as JSON with this structure:
{
  "subjectLine": "string",
  "previewText": "string",
  "body": "string (HTML formatted)",
  "ctaButtonText": "string",
  "alternativeSubjects": ["string"],
  "bestSendTime": "string",
  "personalizationTags": ["string"]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
        break;

      case 'social':
        prompt = `Create social media content about: ${topic}

${platform ? `Platform: ${platform}` : 'Platforms: LinkedIn, Twitter, Instagram, Facebook'}
${tone ? `Tone: ${tone}` : 'Tone: Engaging and authentic'}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Please create platform-specific posts for:
1. **LinkedIn**: Professional, thought-leadership style
2. **Twitter/X**: Concise, engaging thread (3-5 tweets)
3. **Instagram**: Visual-focused caption with hashtags
4. **Facebook**: Community-focused, longer-form
5. **Best Posting Times**: For each platform
6. **Hashtag Strategy**: Relevant hashtags for each platform
7. **Engagement Hooks**: Questions or CTAs to drive engagement

Return as JSON with this structure:
{
  "linkedin": {
    "post": "string",
    "hashtags": ["string"],
    "bestTime": "string"
  },
  "twitter": {
    "thread": ["string"],
    "hashtags": ["string"],
    "bestTime": "string"
  },
  "instagram": {
    "caption": "string",
    "hashtags": ["string"],
    "bestTime": "string"
  },
  "facebook": {
    "post": "string",
    "bestTime": "string"
  }
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
        break;

      case 'ad':
        prompt = `Create ad copy for: ${topic}

${platform ? `Platform: ${platform}` : 'Platforms: Google Ads, Facebook Ads, LinkedIn Ads'}
${tone ? `Tone: ${tone}` : 'Tone: Persuasive and benefit-focused'}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Please create ad variations:
1. **Headlines**: 5 different attention-grabbing headlines (30 chars max)
2. **Descriptions**: 3 compelling descriptions (90 chars max)
3. **Long Description**: Extended description for platforms that support it
4. **CTA Options**: 5 different call-to-action phrases
5. **Targeting Keywords**: Recommended keywords for targeting
6. **Ad Extensions**: Sitelinks, callouts, structured snippets
7. **A/B Test Variants**: 3 complete ad variations to test

Return as JSON with this structure:
{
  "headlines": ["string"],
  "descriptions": ["string"],
  "longDescription": "string",
  "ctaOptions": ["string"],
  "targetingKeywords": ["string"],
  "adExtensions": {
    "sitelinks": ["string"],
    "callouts": ["string"],
    "snippets": ["string"]
  },
  "variants": [
    {
      "headline": "string",
      "description": "string",
      "cta": "string"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
        break;

      case 'video':
        const videoDuration = length === 'short' ? '60-90 seconds' : length === 'long' ? '5-7 minutes' : '2-3 minutes';
        prompt = `Create a video script about: ${topic}

${tone ? `Tone: ${tone}` : 'Tone: Engaging and informative'}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
Target duration: ${videoDuration}

Please provide:
1. **Title**: Compelling video title
2. **Hook**: First 5 seconds to grab attention
3. **Script**: Complete script with timing markers
4. **Visual Suggestions**: What to show on screen
5. **B-Roll Ideas**: Suggested supplementary footage
6. **Music Mood**: Recommended background music style
7. **End Screen CTA**: Clear call-to-action for video end
8. **YouTube Description**: SEO-optimized description
9. **Thumbnail Ideas**: 3 thumbnail concept suggestions

Return as JSON with this structure:
{
  "title": "string",
  "hook": "string",
  "script": [
    {
      "timestamp": "string",
      "narration": "string",
      "visual": "string"
    }
  ],
  "bRollIdeas": ["string"],
  "musicMood": "string",
  "endScreenCta": "string",
  "youtubeDescription": "string",
  "thumbnailIdeas": ["string"]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
        break;

      case 'seo':
        prompt = `Create an SEO content strategy for: ${topic}

${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${keywords ? `Seed Keywords: ${keywords}` : ''}

Please provide:
1. **Primary Keywords**: Top 10 keywords to target
2. **Long-Tail Keywords**: 15 long-tail keyword opportunities
3. **Content Cluster Topics**: 10 related topics to create content around
4. **Search Intent**: Understanding of what users are looking for
5. **Competitor Gaps**: Opportunities competitors are missing
6. **Content Calendar**: 12-week content plan
7. **On-Page SEO Checklist**: Key elements to optimize
8. **Internal Linking Strategy**: How to connect content

Return as JSON with this structure:
{
  "primaryKeywords": [
    {
      "keyword": "string",
      "searchVolume": "string",
      "difficulty": "string",
      "intent": "string"
    }
  ],
  "longTailKeywords": ["string"],
  "contentClusters": [
    {
      "pillarTopic": "string",
      "subTopics": ["string"]
    }
  ],
  "searchIntent": "string",
  "competitorGaps": ["string"],
  "contentCalendar": [
    {
      "week": number,
      "topic": "string",
      "contentType": "string",
      "keywords": ["string"]
    }
  ],
  "onPageChecklist": ["string"],
  "internalLinkingStrategy": "string"
}

IMPORTANT: Return ONLY valid JSON, no other text.`;
        break;

      default:
        return c.json({ success: false, error: 'Invalid content type' }, 400);
    }

    console.log('🎨 Generating marketing content:', contentType, 'for', topic);
    
    // Call ChatGPT
    const chatGPTResponse = await callChatGPT(prompt, 8000);
    
    console.log('📊 ChatGPT response length:', chatGPTResponse?.length || 0);

    // Parse the response
    let parsedContent;
    try {
      if (!chatGPTResponse || chatGPTResponse.trim() === '') {
        throw new Error('Empty response from AI');
      }
      
      let jsonString = chatGPTResponse;
      
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing whitespace
      jsonString = jsonString.trim();
      
      // Check if the response looks like it was cut off
      if (!jsonString.endsWith('}') && !jsonString.endsWith(']')) {
        console.warn('⚠️ Response appears to be truncated');
        throw new Error('Response appears incomplete. Please try a more specific query.');
      }
      
      // Try to extract JSON from the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/) || jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = JSON.parse(jsonString);
      }
      
      console.log('✅ Successfully parsed marketing content');
      
    } catch (parseError: any) {
      console.error('❌ Failed to parse ChatGPT response:', parseError);
      console.error('Raw response:', chatGPTResponse);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Add metadata
    const result = {
      ...parsedContent,
      id: `${contentType}-${Date.now()}`,
      contentType,
      topic,
      timestamp: new Date().toISOString(),
      businessId
    };

    // Save to database
    try {
      const key = `marketing:content:${businessId}:${result.id}`;
      console.log('💾 Attempting to save content to DB with key:', key);
      console.log('💾 Content data:', JSON.stringify(result).substring(0, 200));
      await kv.set(key, result);
      console.log('✅ Saved content to database:', key);
      
      // Verify it was saved by reading it back
      const verification = await kv.get(key);
      console.log('🔍 Verification read:', verification ? 'Success' : 'Failed to read back');
    } catch (dbError) {
      console.error('❌ Failed to save to database:', dbError);
      // Continue even if DB save fails
    }

    return c.json({ 
      success: true, 
      content: result
    });

  } catch (error: any) {
    console.error('❌ Marketing content generation error:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to generate marketing content' 
    }, 500);
  }
});

// Campaign Strategy Endpoint
app.post('/marketing/campaign-strategy', async (c) => {
  try {
    const { 
      campaignGoal, 
      budget, 
      duration, 
      targetAudience,
      channels,
      businessId 
    } = await c.req.json();

    if (!campaignGoal) {
      return c.json({ success: false, error: 'Campaign goal is required' }, 400);
    }

    const prompt = `Create a comprehensive marketing campaign strategy:

Campaign Goal: ${campaignGoal}
${budget ? `Budget: $${budget}` : ''}
${duration ? `Duration: ${duration}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${channels ? `Preferred Channels: ${channels}` : 'Channels: Multi-channel approach'}

Please provide a complete campaign strategy with:
1. **Campaign Name**: Creative, memorable campaign name
2. **Executive Summary**: Overview of the campaign
3. **Target Audience Profile**: Detailed audience demographics and psychographics
4. **Key Messages**: 5 core messages to communicate
5. **Channel Strategy**: Recommended channels and why
6. **Content Calendar**: Week-by-week content plan
7. **Budget Allocation**: How to split budget across channels
8. **KPIs**: Key performance indicators to track
9. **Timeline**: Detailed timeline with milestones
10. **Risk Mitigation**: Potential challenges and solutions
11. **Creative Concepts**: 3-5 creative campaign ideas
12. **Success Metrics**: What success looks like

Return as JSON with this structure:
{
  "campaignName": "string",
  "executiveSummary": "string",
  "targetAudience": {
    "demographics": "string",
    "psychographics": "string",
    "painPoints": ["string"],
    "motivations": ["string"]
  },
  "keyMessages": ["string"],
  "channelStrategy": [
    {
      "channel": "string",
      "rationale": "string",
      "tactics": ["string"],
      "budgetPercentage": number
    }
  ],
  "contentCalendar": [
    {
      "week": number,
      "activities": ["string"],
      "deliverables": ["string"]
    }
  ],
  "budgetAllocation": [
    {
      "category": "string",
      "amount": number,
      "percentage": number
    }
  ],
  "kpis": [
    {
      "metric": "string",
      "target": "string",
      "measurementMethod": "string"
    }
  ],
  "timeline": [
    {
      "phase": "string",
      "startDate": "string",
      "endDate": "string",
      "milestones": ["string"]
    }
  ],
  "riskMitigation": [
    {
      "risk": "string",
      "mitigation": "string"
    }
  ],
  "creativeIdeas": [
    {
      "concept": "string",
      "description": "string",
      "channels": ["string"]
    }
  ],
  "successMetrics": {
    "primary": "string",
    "secondary": ["string"]
  }
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

    console.log('🎯 Creating campaign strategy for:', campaignGoal);
    
    const chatGPTResponse = await callChatGPT(prompt, 8000);
    
    // Parse response
    let parsedStrategy;
    try {
      let jsonString = chatGPTResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      if (!jsonString.endsWith('}')) {
        throw new Error('Response appears incomplete');
      }
      
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      parsedStrategy = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonString);
      
      console.log('✅ Successfully created campaign strategy');
      
    } catch (parseError: any) {
      console.error('❌ Failed to parse strategy response:', parseError);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    const result = {
      ...parsedStrategy,
      id: `campaign-${Date.now()}`,
      timestamp: new Date().toISOString(),
      businessId
    };

    // Save to database
    try {
      const key = `marketing:campaign:${businessId}:${result.id}`;
      console.log('💾 Attempting to save campaign to DB with key:', key);
      await kv.set(key, result);
      console.log('✅ Saved campaign strategy to database:', key);
      
      // Verify it was saved by reading it back
      const verification = await kv.get(key);
      console.log('🔍 Verification read:', verification ? 'Success' : 'Failed to read back');
    } catch (dbError) {
      console.error('❌ Failed to save campaign to database:', dbError);
    }

    return c.json({ 
      success: true, 
      strategy: result
    });

  } catch (error: any) {
    console.error('❌ Campaign strategy error:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to create campaign strategy' 
    }, 500);
  }
});

// Competitor Analysis Endpoint
app.post('/marketing/competitor-analysis', async (c) => {
  try {
    const { 
      industry, 
      competitors, 
      businessName,
      businessId 
    } = await c.req.json();

    if (!industry) {
      return c.json({ success: false, error: 'Industry is required' }, 400);
    }

    const prompt = `Conduct a comprehensive competitor marketing analysis:

Industry: ${industry}
${businessName ? `Our Business: ${businessName}` : ''}
${competitors ? `Known Competitors: ${competitors}` : ''}

Analyze the competitive landscape and provide:
1. **Market Leaders**: Top 5 competitors in the space
2. **Marketing Strategies**: What marketing tactics are working for them
3. **Content Analysis**: Types of content they create and performance
4. **Social Media Presence**: Follower counts, engagement rates, strategies
5. **SEO Analysis**: Top keywords they rank for
6. **Advertising**: What ads they're running and where
7. **Strengths**: What competitors are doing well
8. **Weaknesses**: Gaps and opportunities
9. **Differentiation Opportunities**: How to stand out
10. **Market Positioning**: Recommended positioning strategy
11. **Actionable Insights**: 10 specific actions to take

Return as JSON with this structure:
{
  "marketLeaders": [
    {
      "name": "string",
      "marketShare": "string",
      "uniqueValueProp": "string"
    }
  ],
  "marketingStrategies": [
    {
      "competitor": "string",
      "strategy": "string",
      "effectiveness": "string"
    }
  ],
  "contentAnalysis": {
    "topPerformingFormats": ["string"],
    "publishingFrequency": "string",
    "topics": ["string"]
  },
  "socialMediaPresence": [
    {
      "competitor": "string",
      "platform": "string",
      "followers": "string",
      "engagementRate": "string",
      "strategy": "string"
    }
  ],
  "seoAnalysis": {
    "topKeywords": ["string"],
    "domainAuthority": "string",
    "backlinks": "string"
  },
  "advertising": {
    "platforms": ["string"],
    "adTypes": ["string"],
    "estimatedSpend": "string"
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "differentiationOpportunities": ["string"],
  "recommendedPositioning": "string",
  "actionableInsights": [
    {
      "action": "string",
      "priority": "string",
      "impact": "string"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

    console.log('🔍 Analyzing competitors in:', industry);
    
    const chatGPTResponse = await callChatGPT(prompt, 8000);
    
    // Parse response
    let parsedAnalysis;
    try {
      let jsonString = chatGPTResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      parsedAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(jsonString);
      
      console.log('✅ Successfully analyzed competitors');
      
    } catch (parseError: any) {
      console.error('❌ Failed to parse analysis response:', parseError);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    const result = {
      ...parsedAnalysis,
      id: `analysis-${Date.now()}`,
      timestamp: new Date().toISOString(),
      businessId
    };

    // Save to database
    try {
      const key = `marketing:analysis:${businessId}:${result.id}`;
      console.log('💾 Attempting to save analysis to DB with key:', key);
      await kv.set(key, result);
      console.log('✅ Saved competitor analysis to database:', key);
      
      // Verify it was saved by reading it back
      const verification = await kv.get(key);
      console.log('🔍 Verification read:', verification ? 'Success' : 'Failed to read back');
    } catch (dbError) {
      console.error('❌ Failed to save analysis to database:', dbError);
    }

    return c.json({ 
      success: true, 
      analysis: result
    });

  } catch (error: any) {
    console.error('❌ Competitor analysis error:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to analyze competitors' 
    }, 500);
  }
});

// Get Marketing History Endpoint
app.get('/marketing/history', async (c) => {
  try {
    const businessId = c.req.query('businessId');

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    console.log('📚 Loading marketing history for business:', businessId);

    // Load all marketing data for this business
    const contentPrefix = `marketing:content:${businessId}:`;
    const campaignPrefix = `marketing:campaign:${businessId}:`;
    const analysisPrefix = `marketing:analysis:${businessId}:`;
    const creatorsPrefix = `creator_research:${businessId}:`;
    
    console.log('🔍 Searching with prefixes:', { contentPrefix, campaignPrefix, analysisPrefix, creatorsPrefix });
    
    const contentKeys = await kv.getByPrefix(contentPrefix);
    const campaignKeys = await kv.getByPrefix(campaignPrefix);
    const analysisKeys = await kv.getByPrefix(analysisPrefix);
    const creatorsKeys = await kv.getByPrefix(creatorsPrefix);
    
    console.log('📦 Raw results from DB:', { 
      contentKeys: contentKeys?.length || 0, 
      campaignKeys: campaignKeys?.length || 0,
      analysisKeys: analysisKeys?.length || 0,
      creatorsKeys: creatorsKeys?.length || 0
    });

    // Sort by timestamp (newest first)
    const sortByTimestamp = (a: any, b: any) => {
      const aTime = a.timestamp || a.createdAt;
      const bTime = b.timestamp || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    };

    const content = (contentKeys || []).sort(sortByTimestamp);
    const campaigns = (campaignKeys || []).sort(sortByTimestamp);
    const analyses = (analysisKeys || []).sort(sortByTimestamp);
    const creators = (creatorsKeys || []).sort(sortByTimestamp);

    console.log(`✅ Loaded ${content.length} content, ${campaigns.length} campaigns, ${analyses.length} analyses, ${creators.length} creator research`);

    return c.json({
      success: true,
      content,
      campaigns,
      analyses,
      creators
    });

  } catch (error: any) {
    console.error('❌ Failed to load marketing history:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to load marketing history'
    }, 500);
  }
});

// ============================================================================
// MARKETING CAMPAIGNS CRUD ENDPOINTS
// ============================================================================

// Get all marketing campaigns for a business
app.get('/marketing/campaigns', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    const key = `business:${user.id}:${businessId}:marketing_campaigns`;
    const campaigns = await kv.get(key) || [];

    // Ensure all campaigns have the required metrics fields for the frontend
    const formattedCampaigns = campaigns.map((campaign: any) => ({
      ...campaign,
      spent: campaign.spent || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      conversions: campaign.conversions || 0,
      ctr: campaign.ctr || 0,
      cpc: campaign.cpc || 0,
      cpa: campaign.cpa || 0,
    }));

    console.log(`📊 Retrieved ${formattedCampaigns.length} marketing campaigns for business ${businessId}`);
    return c.json({ success: true, campaigns: formattedCampaigns });
  } catch (error: any) {
    console.error('❌ Get campaigns error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Create a new marketing campaign
app.post('/marketing/campaigns', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    const body = await c.req.json();
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const campaign = {
      id: campaignId,
      name: body.name,
      description: body.description || '',
      type: body.type || 'other',
      budget: body.budget || 0,
      spent: body.spent || 0,
      impressions: body.impressions || 0,
      clicks: body.clicks || 0,
      conversions: body.conversions || 0,
      ctr: body.ctr || 0,
      cpc: body.cpc || 0,
      cpa: body.cpa || 0,
      start_date: body.startDate || new Date().toISOString().split('T')[0],
      end_date: body.endDate || '',
      status: body.status || 'planning',
      results: body.results || '',
      business_id: businessId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const key = `business:${user.id}:${businessId}:marketing_campaigns`;
    let campaigns = await kv.get(key) || [];

    if (!Array.isArray(campaigns)) {
      campaigns = [];
    }

    campaigns.push(campaign);
    await kv.set(key, campaigns);

    console.log(`✅ Created marketing campaign: ${campaignId} - ${body.name}`);
    return c.json({ success: true, campaign });
  } catch (error: any) {
    console.error('❌ Create campaign error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update a marketing campaign
app.put('/marketing/campaigns/:id', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    const body = await c.req.json();
    const key = `business:${user.id}:${businessId}:marketing_campaigns`;
    let campaigns = await kv.get(key) || [];

    const campaignIndex = campaigns.findIndex((c: any) => c.id === campaignId);
    if (campaignIndex === -1) {
      return c.json({ success: false, error: 'Campaign not found' }, 404);
    }

    campaigns[campaignIndex] = {
      ...campaigns[campaignIndex],
      ...body,
      id: campaignId,
      business_id: businessId,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    await kv.set(key, campaigns);

    console.log(`✅ Updated marketing campaign: ${campaignId}`);
    return c.json({ success: true, campaign: campaigns[campaignIndex] });
  } catch (error: any) {
    console.error('❌ Update campaign error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete a marketing campaign
app.delete('/marketing/campaigns/:id', async (c) => {
  try {
    const campaignId = c.req.param('id');
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    const key = `business:${user.id}:${businessId}:marketing_campaigns`;
    let campaigns = await kv.get(key) || [];

    const initialLength = campaigns.length;
    campaigns = campaigns.filter((c: any) => c.id !== campaignId);

    if (campaigns.length === initialLength) {
      return c.json({ success: false, error: 'Campaign not found' }, 404);
    }

    await kv.set(key, campaigns);

    console.log(`✅ Deleted marketing campaign: ${campaignId}`);
    return c.json({ success: true, message: 'Campaign deleted' });
  } catch (error: any) {
    console.error('❌ Delete campaign error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// MARKETING DATA ENDPOINT - Aggregated marketing data for frontend
// ============================================================================

// Get all marketing data (campaigns, leads, metrics, content)
app.get('/marketing/data', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    // Load all marketing data
    const campaignsKey = `business:${user.id}:${businessId}:marketing_campaigns`;
    const leadsKey = `business:${user.id}:${businessId}:marketing_leads`;
    const metricsKey = `business:${user.id}:${businessId}:marketing_metrics`;
    const contentKey = `business:${user.id}:${businessId}:marketing_content`;

    const campaigns = await kv.get(campaignsKey) || [];
    const leads = await kv.get(leadsKey) || [];
    const metrics = await kv.get(metricsKey) || [];
    const content = await kv.get(contentKey) || [];

    // Ensure all campaigns have the required metrics fields
    const formattedCampaigns = campaigns.map((campaign: any) => ({
      ...campaign,
      spent: campaign.spent || 0,
      impressions: campaign.impressions || 0,
      clicks: campaign.clicks || 0,
      conversions: campaign.conversions || 0,
      ctr: campaign.ctr || 0,
      cpc: campaign.cpc || 0,
      cpa: campaign.cpa || 0,
    }));

    console.log(`📊 Retrieved marketing data for business ${businessId}: ${formattedCampaigns.length} campaigns, ${leads.length} leads, ${metrics.length} metrics, ${content.length} content items`);

    return c.json({
      success: true,
      campaigns: formattedCampaigns,
      leads,
      metrics,
      content
    });
  } catch (error: any) {
    console.error('❌ Get marketing data error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// MARKETING LEADS ENDPOINTS
// ============================================================================

// Create a new marketing lead
app.post('/marketing/leads', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    const body = await c.req.json();
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const lead = {
      id: leadId,
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      source: body.source || '',
      value: body.value || 0,
      status: body.status || 'new',
      notes: body.notes || '',
      business_id: businessId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const key = `business:${user.id}:${businessId}:marketing_leads`;
    let leads = await kv.get(key) || [];

    if (!Array.isArray(leads)) {
      leads = [];
    }

    leads.push(lead);
    await kv.set(key, leads);

    console.log(`✅ Created marketing lead: ${leadId} - ${body.name}`);
    return c.json({ success: true, lead });
  } catch (error: any) {
    console.error('❌ Create lead error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete a marketing lead
app.delete('/marketing/leads/:id', async (c) => {
  try {
    const leadId = c.req.param('id');
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    const key = `business:${user.id}:${businessId}:marketing_leads`;
    let leads = await kv.get(key) || [];

    const initialLength = leads.length;
    leads = leads.filter((l: any) => l.id !== leadId);

    if (leads.length === initialLength) {
      return c.json({ success: false, error: 'Lead not found' }, 404);
    }

    await kv.set(key, leads);

    console.log(`✅ Deleted marketing lead: ${leadId}`);
    return c.json({ success: true, message: 'Lead deleted' });
  } catch (error: any) {
    console.error('❌ Delete lead error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// SEED SAMPLE DATA ENDPOINT
// ============================================================================

// Seed sample marketing data for new users
app.post('/marketing/seed-sample-data', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    if (!businessId) {
      return c.json({ success: false, error: 'Business ID is required' }, 400);
    }

    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }

    // Get user from Supabase
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ success: false, error: 'Invalid authorization' }, 401);
    }

    // Create sample campaigns
    const sampleCampaigns = [
      {
        id: `campaign_${Date.now()}_1`,
        name: 'Launch Campaign',
        description: 'Initial product launch marketing campaign',
        type: 'email',
        budget: 5000,
        spent: 3250,
        impressions: 45000,
        clicks: 2250,
        conversions: 180,
        ctr: 5.0,
        cpc: 1.44,
        cpa: 18.06,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active',
        results: 'Strong initial response, above average CTR',
        business_id: businessId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `campaign_${Date.now()}_2`,
        name: 'Social Media Ads',
        description: 'Facebook and Instagram paid advertising',
        type: 'social',
        budget: 3000,
        spent: 2800,
        impressions: 120000,
        clicks: 3600,
        conversions: 144,
        ctr: 3.0,
        cpc: 0.78,
        cpa: 19.44,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: '',
        status: 'active',
        results: 'High engagement on Instagram, optimizing Facebook targeting',
        business_id: businessId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Create sample leads
    const sampleLeads = [
      {
        id: `lead_${Date.now()}_1`,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '(555) 123-4567',
        company: 'Tech Innovations Inc',
        source: 'Website Form',
        value: 5000,
        score: 85,
        temperature: 'hot',
        status: 'qualified',
        tags: ['enterprise', 'priority'],
        notes: 'Interested in enterprise plan',
        business_id: businessId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `lead_${Date.now()}_2`,
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        phone: '(555) 234-5678',
        company: 'Digital Solutions LLC',
        source: 'LinkedIn Campaign',
        value: 3000,
        score: 65,
        temperature: 'warm',
        status: 'contacted',
        tags: ['linkedin', 'b2b'],
        notes: 'Follow up next week',
        business_id: businessId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `lead_${Date.now()}_3`,
        name: 'Emily Rodriguez',
        email: 'emily.r@startup.com',
        phone: '(555) 345-6789',
        company: 'Startup Ventures',
        source: 'Referral',
        value: 2000,
        score: 45,
        temperature: 'cold',
        status: 'new',
        tags: ['startup', 'referral'],
        notes: 'Initial inquiry, needs nurturing',
        business_id: businessId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Save to database
    const campaignsKey = `business:${user.id}:${businessId}:marketing_campaigns`;
    const leadsKey = `business:${user.id}:${businessId}:marketing_leads`;

    await kv.set(campaignsKey, sampleCampaigns);
    await kv.set(leadsKey, sampleLeads);

    console.log(`✅ Seeded sample marketing data for business ${businessId}`);

    return c.json({
      success: true,
      campaigns: sampleCampaigns,
      leads: sampleLeads
    });
  } catch (error: any) {
    console.error('❌ Seed sample data error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Creator Research Endpoint
app.post('/marketing/creator-research', async (c) => {
  try {
    const { 
      userId,
      businessId, 
      productId,
      researchType,
      platform
    } = await c.req.json();

    if (!userId || !businessId || !productId || !platform) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    console.log(`🔍 Starting creator research for platform: ${platform}`);

    // Get product details
    const product = await kv.get(`ecommerce_product:${businessId}:${productId}`);
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    // Deduct 10 credits
    const userData = await kv.get(`user:${userId}`);
    const currentCredits = userData?.credits || 0;
    
    if (currentCredits < 10) {
      return c.json({ success: false, error: 'Insufficient credits' }, 402);
    }

    await kv.set(`user:${userId}`, {
      ...userData,
      credits: currentCredits - 10
    });

    console.log(`💳 Deducted 10 credits. New balance: ${currentCredits - 10}`);

    // Generate platform-specific prompt
    const platformNames = {
      'podcast': 'Podcast',
      'youtube': 'YouTube',
      'tiktok': 'TikTok',
      'instagram': 'Instagram',
      'facebook': 'Facebook'
    };

    const platformName = platformNames[platform] || platform;

    const prompt = `You are a marketing research expert. Find and recommend ${platformName} creators who would be perfect for promoting this product:

Product Name: ${product.productName}
Description: ${product.productDescription}
Target Audience: ${product.whoBuys || 'Not specified'}
Where They Hang Out: ${product.whereHangOut || 'Not specified'}
Key Differentiator: ${product.differentiator || 'Not specified'}

Provide a detailed list of 10-15 ${platformName} creators who would be ideal to reach out to for product promotion. For each creator, include:

1. Creator Name/Channel Name
2. ${platformName === 'Podcast' ? 'Podcast Name' : 'Handle/Username'}
3. Follower/Subscriber Count (estimate if exact numbers unavailable)
4. Niche/Focus Area
5. Why They're a Good Fit (2-3 sentences)
6. Content Style
7. Engagement Rate (High/Medium/Low)
8. Best Approach (How to reach out to them)
9. Estimated Collaboration Cost (Budget range)

${platform === 'podcast' ? 'Focus on podcasts that discuss topics related to the product niche.' : ''}
${platform === 'youtube' ? 'Focus on YouTubers who create review, unboxing, or tutorial content.' : ''}
${platform === 'tiktok' ? 'Focus on TikTok creators with authentic engagement and niche alignment.' : ''}
${platform === 'instagram' ? 'Focus on Instagram influencers with strong visual content and engagement.' : ''}
${platform === 'facebook' ? 'Focus on Facebook creators and groups with active communities.' : ''}

Format the response in clear, organized sections with headers. Make it actionable and ready to use.`;

    // Call ChatGPT to generate creator recommendations
    const creatorList = await callChatGPT(prompt, 10000);

    // Store the research result
    const researchId = `creator_research:${businessId}:${Date.now()}`;
    const researchData = {
      id: researchId,
      userId,
      businessId,
      productId,
      platform: platformName,
      researchType,
      content: creatorList,
      createdAt: new Date().toISOString(),
      productName: product.productName
    };

    await kv.set(researchId, researchData);
    console.log(`✅ Saved creator research: ${researchId}`);

    // Count creators in the list (rough estimate)
    const creatorCount = (creatorList.match(/Creator Name|Channel Name|Handle/gi) || []).length;

    // Send success notification
    const notificationId = `notification:${userId}:${Date.now()}`;
    await kv.set(notificationId, {
      id: notificationId,
      userId,
      type: 'success',
      title: `${platformName} Creators Found!`,
      message: `We found ${creatorCount || 10}+ ${platformName.toLowerCase()} creators who are perfect for promoting your product "${product.productName}". Check your Marketing Storage.`,
      read: false,
      category: 'marketing',
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      researchId,
      creatorCount: creatorCount || 10,
      message: `Found ${creatorCount || 10}+ ${platformName} creators`
    });

  } catch (error: any) {
    console.error('❌ Creator research error:', error);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to complete creator research' 
    }, 500);
  }
});

export default app;