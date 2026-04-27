import { Hono } from 'npm:hono@4';

const app = new Hono();

// MASTERY REFRESH ENDPOINT - AI-powered dashboard update
app.post('/mastery/refresh', async (c) => {
  try {
    const { masteryContext, businessId } = await c.req.json();
    
    if (!masteryContext) {
      return c.json({
        success: false,
        error: 'Mastery context is required'
      }, 400);
    }

    console.log('🔄 Mastery Refresh request:', {
      level: masteryContext.currentLevel,
      totalXP: masteryContext.totalXP,
      domainCount: masteryContext.domains?.length
    });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return c.json({
        success: false,
        error: 'AI service not configured'
      }, 500);
    }

    // Build comprehensive mastery analysis prompt
    const sortedDomains = (masteryContext.domains || []).sort((a: any, b: any) => b.level - a.level);
    const averageLevel = sortedDomains.reduce((sum: number, d: any) => sum + d.level, 0) / sortedDomains.length;
    
    const analysisPrompt = `Analyze this user's mastery profile and provide an accurate, comprehensive assessment:

Current Profile:
- Level: ${masteryContext.currentLevel}
- Total XP: ${masteryContext.totalXP}
- Average Domain Mastery: ${Math.round(averageLevel)}%

Skill Domains:
${sortedDomains.map((d: any, i: number) => `${i + 1}. ${d.name}: ${d.level}%`).join('\n')}

Recent Progress:
${masteryContext.recentGains?.map((g: any) => `- ${g.description}`).join('\n') || 'No recent gains recorded'}

Current Weaknesses:
${masteryContext.weaknesses?.map((w: any) => `- ${w.area}`).join('\n') || 'None identified'}

Provide:
1. A comprehensive analysis of their skill ownership and mastery level
2. Specific insights into their strongest and weakest domains
3. Actionable recommendations for skill development
4. An assessment of their overall entrepreneurial readiness
5. Next steps to reach the next mastery level

Be specific, actionable, and encouraging. Focus on what they've accomplished and what they need to work on next.`;

    // Call ChatGPT for analysis
    console.log('🤖 Calling ChatGPT for mastery analysis...');
    
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        input: [
          {
            role: 'system',
            content: `You are an expert business mastery analyst for Cofounder+. You analyze entrepreneurs' skill profiles and provide accurate, actionable assessments of their mastery levels across different business domains.

Your analysis should be:
- Specific and data-driven based on their actual skill levels
- Encouraging yet realistic about growth areas
- Focused on actionable next steps
- Professional and insightful

Use markdown formatting for clarity. Be concise but comprehensive.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_output_tokens: 800
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      return c.json({
        success: false,
        error: `AI service error: ${openAiResponse.status}`
      }, 500);
    }

    const aiResult = await openAiResponse.json();
    
    const analysis =
      aiResult.output_text ??
      aiResult?.output?.[0]?.content?.[0]?.text ??
      "";
    
    console.log('✅ Mastery analysis generated:', analysis.substring(0, 150) + '...');

    // Store the analysis in the mastery data
    // Note: In a real implementation, you might want to update the actual mastery data
    // For now, we'll just return the analysis
    
    return c.json({
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error in Mastery Refresh:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to refresh mastery dashboard'
    }, 500);
  }
});

export default app;
