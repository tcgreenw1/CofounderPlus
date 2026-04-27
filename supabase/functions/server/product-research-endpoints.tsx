import { Hono } from 'npm:hono@4';

const app = new Hono();

// Helper function to call OpenAI/ChatGPT
async function callChatGPT(prompt: string): Promise<any> {
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
          content: `You are an expert ecommerce product researcher and analyst. You help entrepreneurs find profitable products to resell online. You analyze market demand, competition, pricing, profit margins, trends, and supplier sources. Provide detailed, actionable insights based on real market data and trends.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_output_tokens: 8000,
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

// Product Research Analysis Endpoint
app.post('/product-research/analyze', async (c) => {
  try {
    const { query, niche, budget, targetMarket, businessId } = await c.req.json();

    if (!query) {
      return c.json({ success: false, error: 'Product query is required' }, 400);
    }

    // Construct research prompt
    const prompt = `
Analyze the following product idea for ecommerce reselling and provide detailed research:

Product/Category: ${query}
${niche ? `Niche: ${niche}` : ''}
${budget ? `Budget per unit: $${budget}` : ''}
${targetMarket ? `Target Market: ${targetMarket}` : ''}

Please provide research for 3-5 specific product variations or opportunities within this category. For each product, analyze:

1. **Product Name**: A specific product name/variation
2. **Category**: The product category
3. **Market Demand**: high/medium/low - Based on search volume, trends, and consumer interest
4. **Profit Margin**: Estimated percentage (be realistic)
5. **Competition Level**: low/medium/high - Based on number of sellers and market saturation
6. **Price Range**: Min and max retail price in USD
7. **Estimated Monthly Sales**: Realistic estimate for an average seller
8. **Supplier Sources**: 3-4 specific places to source (e.g., Alibaba, AliExpress, specific wholesalers)
9. **Key Insights**: 3-5 important insights about this product opportunity
10. **Pros**: 4-5 advantages of selling this product
11. **Cons**: 3-4 challenges or disadvantages
12. **Recommendation**: Clear recommendation on whether to pursue this product
13. **Research Score**: 0-100 score based on overall opportunity (higher is better)
14. **Trends**: 3-5 current market trends related to this product
15. **Target Audience**: Who would buy this product

Return your analysis as a JSON array with this EXACT structure:
[
  {
    "productName": "string",
    "category": "string",
    "marketDemand": "high|medium|low",
    "profitMargin": number,
    "competitionLevel": "low|medium|high",
    "priceRange": { "min": number, "max": number },
    "estimatedMonthlySales": number,
    "supplierSources": ["string", "string", "string"],
    "keyInsights": ["string", "string", "string"],
    "pros": ["string", "string", "string", "string"],
    "cons": ["string", "string", "string"],
    "recommendation": "string",
    "researchScore": number,
    "trends": ["string", "string", "string"],
    "targetAudience": "string"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text or explanation.`;

    console.log('🔍 Starting product research for:', query);
    
    // Call ChatGPT for research
    const chatGPTResponse = await callChatGPT(prompt);
    
    console.log('📊 ChatGPT raw response length:', chatGPTResponse?.length || 0);
    console.log('📊 ChatGPT raw response preview:', chatGPTResponse?.substring(0, 200));
    console.log('📊 ChatGPT raw response end:', chatGPTResponse?.substring(chatGPTResponse.length - 200));

    // Parse the response with robust error handling
    let parsedResults;
    try {
      if (!chatGPTResponse || chatGPTResponse.trim() === '') {
        throw new Error('Empty response from AI');
      }
      
      let jsonString = chatGPTResponse;
      
      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remove any leading/trailing whitespace
      jsonString = jsonString.trim();
      
      // Check if the response looks like it was cut off (doesn't end with ] or })
      if (!jsonString.endsWith(']') && !jsonString.endsWith('}')) {
        console.warn('⚠️ Response appears to be truncated (does not end with ] or })');
        console.warn('Last 100 chars:', jsonString.substring(jsonString.length - 100));
        throw new Error('Response appears incomplete. Please try a more specific query.');
      }
      
      // Try to extract JSON array from the response
      const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedResults = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole string
        parsedResults = JSON.parse(jsonString);
      }
      
      // Validate that we got an array
      if (!Array.isArray(parsedResults)) {
        console.error('Response is not an array:', parsedResults);
        throw new Error('Expected an array of products');
      }
      
      // Validate that array is not empty
      if (parsedResults.length === 0) {
        console.error('Response array is empty');
        throw new Error('No products returned from AI');
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse ChatGPT response:', parseError);
      console.error('Response length:', chatGPTResponse?.length);
      console.error('First 300 chars:', chatGPTResponse?.substring(0, 300));
      console.error('Last 300 chars:', chatGPTResponse?.substring(chatGPTResponse.length - 300));
      throw new Error(`Failed to parse research results from AI: ${parseError.message}`);
    }

    // Add unique IDs and timestamps
    const results = parsedResults.map((result: any, index: number) => ({
      id: `research-${Date.now()}-${index}`,
      ...result,
      timestamp: new Date().toISOString()
    }));

    console.log('✅ Product research completed:', results.length, 'products found');

    return c.json({
      success: true,
      results: results,
      query: query,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Product research error:', error);
    return c.json(
      { 
        success: false, 
        error: error.message || 'Failed to complete product research',
        details: error.toString()
      },
      500
    );
  }
});

// Get product research suggestions/quick prompts
app.get('/product-research/suggestions', async (c) => {
  const suggestions = [
    {
      id: '1',
      title: 'Trending Tech Gadgets',
      query: 'wireless charging accessories and smart home devices under $50',
      niche: 'technology',
      description: 'Hot tech products with high demand'
    },
    {
      id: '2',
      title: 'Fitness & Wellness',
      query: 'resistance bands, yoga mats, and portable fitness equipment',
      niche: 'fitness',
      description: 'Health products with evergreen demand'
    },
    {
      id: '3',
      title: 'Pet Products',
      query: 'innovative pet toys, grooming tools, and pet accessories',
      niche: 'pets',
      description: 'Growing market with loyal customers'
    },
    {
      id: '4',
      title: 'Home Organization',
      query: 'space-saving organizers, storage solutions, and decluttering tools',
      niche: 'home',
      description: 'Popular products for modern homes'
    },
    {
      id: '5',
      title: 'Eco-Friendly Products',
      query: 'sustainable, reusable, and environmentally friendly everyday items',
      niche: 'sustainability',
      description: 'Growing trend with conscious consumers'
    }
  ];

  return c.json({
    success: true,
    suggestions: suggestions
  });
});

export default app;
