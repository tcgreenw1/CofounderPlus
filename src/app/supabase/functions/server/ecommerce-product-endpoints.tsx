/**
 * ECOMMERCE PRODUCT ENDPOINTS
 * 
 * Handles ecommerce product management with GPT-4o enhancement:
 * - Create/update/delete ecommerce products
 * - AI-powered product research and completion
 * - Credit charging for AI enhancements
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store_business.tsx';
import { deductUserCredits } from './credits-endpoints.tsx';

const app = new Hono();

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface EcommerceProduct {
  id: string;
  businessId: string;
  userId: string;
  type: 'print-on-demand' | 'affiliate' | 'digital-product' | 'local-arbitrage';
  productName?: string;
  productDescription?: string;
  whoBuys?: string;
  whereHangOut?: string;
  whyWin?: string;
  differentiator?: 'new-bundle' | 'new-message' | 'new-platform' | 'new-use-case' | 'unknown';
  differentiatorDetails?: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /ecommerce-products
 * List all ecommerce products for a business
 */
app.get('/ecommerce-products', async (c) => {
  try {
    const businessId = c.req.query('businessId');
    
    if (!businessId) {
      return c.json({ error: 'businessId is required' }, 400);
    }

    const key = `ecommerce_products_${businessId}`;
    const products = await kv.get(key);

    return c.json({ 
      success: true,
      products: products || []
    });
  } catch (error: any) {
    console.error('Error fetching ecommerce products:', error);
    return c.json({ 
      error: 'Failed to fetch ecommerce products',
      details: error.message 
    }, 500);
  }
});

/**
 * Use GPT-4o to enhance product details
 */
async function enhanceProductWithAI(product: Partial<EcommerceProduct>): Promise<Partial<EcommerceProduct>> {
  const productTypeLabels = {
    'print-on-demand': 'Print-on-demand products (shirts, hoodies, posters)',
    'affiliate': 'Affiliate products (TikTok Shop, Amazon Influencer, Gumroad)',
    'digital-product': 'Digital products (Notion templates, resumes, planners)',
    'local-arbitrage': 'Local arbitrage (Facebook Marketplace flipping, thrift resale)'
  };

  const systemPrompt = `You are an expert ecommerce product strategist. You help entrepreneurs refine and develop their product ideas with market research, target audience insights, and competitive positioning.

When given a partial product description, you fill in missing details with:
1. **Product Name & Description**: If missing, create a compelling name and description based on the product type and any provided context
2. **Target Customer (Who buys this)**: Identify the ideal customer demographic, psychographic, and behavioral profile
3. **Distribution Channels (Where they hang out)**: List specific platforms, communities, and channels where the target audience is active
4. **Competitive Advantage (Why this wins)**: Explain unique selling propositions and competitive advantages
5. **Market Differentiator**: If unknown, analyze the best differentiation strategy (new bundle, new message, new platform, new use case)

Provide realistic, data-driven insights based on current market trends. Be specific and actionable.`;

  const userPrompt = `Product Type: ${productTypeLabels[product.type as keyof typeof productTypeLabels]}

${product.productName ? `Product Name: ${product.productName}` : ''}
${product.productDescription ? `Description: ${product.productDescription}` : ''}
${product.whoBuys ? `Target Customer: ${product.whoBuys}` : ''}
${product.whereHangOut ? `Where They Hang Out: ${product.whereHangOut}` : ''}
${product.whyWin ? `Why This Wins: ${product.whyWin}` : ''}
${product.differentiator && product.differentiator !== 'unknown' ? `Differentiator: ${product.differentiator}` : ''}
${product.differentiatorDetails ? `Differentiator Details: ${product.differentiatorDetails}` : ''}

Please fill in the missing fields with market research and strategic insights. Return ONLY a valid JSON object with these fields (fill in what's missing):
{
  "productName": "string (if missing)",
  "productDescription": "string (if missing)",
  "whoBuys": "string (if missing)",
  "whereHangOut": "string (if missing)",
  "whyWin": "string (if missing)",
  "differentiator": "new-bundle | new-message | new-platform | new-use-case (if unknown)",
  "differentiatorDetails": "string (if missing or differentiator was unknown)"
}

Important: Only include fields that need to be filled in or improved. Use original values for fields that were already provided.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from OpenAI response');
    }

    const enhancements = JSON.parse(jsonMatch[0]);

    // Merge enhancements with original product
    return {
      productName: product.productName || enhancements.productName,
      productDescription: product.productDescription || enhancements.productDescription,
      whoBuys: product.whoBuys || enhancements.whoBuys,
      whereHangOut: product.whereHangOut || enhancements.whereHangOut,
      whyWin: product.whyWin || enhancements.whyWin,
      differentiator: (product.differentiator && product.differentiator !== 'unknown') 
        ? product.differentiator 
        : enhancements.differentiator,
      differentiatorDetails: product.differentiatorDetails || enhancements.differentiatorDetails,
    };
  } catch (error: any) {
    console.error('Error enhancing product with AI:', error);
    throw new Error(`AI enhancement failed: ${error.message}`);
  }
}

/**
 * Check if AI enhancement is needed
 */
function needsAIEnhancement(product: Partial<EcommerceProduct>): boolean {
  return !product.productName ||
    !product.productDescription ||
    !product.whoBuys ||
    !product.whereHangOut ||
    !product.whyWin ||
    !product.differentiator ||
    product.differentiator === 'unknown' ||
    (product.differentiator && product.differentiator !== 'unknown' && !product.differentiatorDetails);
}

/**
 * Charge credits for AI enhancement
 * Uses the user-based credit system, not business-based
 */
async function chargeCredits(businessId: string, userId: string, amount: number): Promise<boolean> {
  // Use user-based credit system
  const creditsKey = `user_credits_${userId}`;
  const currentCredits = await kv.get(creditsKey) || 0;

  if (currentCredits < amount) {
    throw new Error('Insufficient credits');
  }

  // Deduct credits
  await kv.set(creditsKey, currentCredits - amount);

  // Log transaction
  const transactionsKey = `credit_transactions_${userId}`;
  const transactions = await kv.get(transactionsKey) || [];
  transactions.push({
    id: crypto.randomUUID(),
    userId,
    businessId,
    amount: -amount,
    type: 'ecommerce_product_enhancement',
    timestamp: new Date().toISOString(),
  });
  await kv.set(transactionsKey, transactions);

  return true;
}

/**
 * POST /ecommerce-products
 * Create a new ecommerce product
 */
app.post('/ecommerce-products', async (c) => {
  try {
    const body = await c.req.json();
    const { businessId, userId, type, productName, productDescription, whoBuys, whereHangOut, whyWin, differentiator, differentiatorDetails } = body;

    if (!businessId || !userId || !type) {
      return c.json({ error: 'businessId, userId, and type are required' }, 400);
    }

    const productData: Partial<EcommerceProduct> = {
      type,
      productName,
      productDescription,
      whoBuys,
      whereHangOut,
      whyWin,
      differentiator,
      differentiatorDetails,
    };

    console.log('🛍️ Ecommerce Product: Received product data:', productData);

    let creditsCharged = 0;
    let enhancedData = { ...productData };
    let aiGenerated = false;

    // Check if AI enhancement is needed
    const needsEnhancement = needsAIEnhancement(productData);
    console.log('🛍️ Ecommerce Product: Needs AI enhancement?', needsEnhancement);
    
    if (needsEnhancement) {
      // Charge 10 credits
      try {
        console.log('🛍️ Ecommerce Product: Attempting to charge 10 credits for user:', userId);
        const creditResult = await deductUserCredits(userId, 10, 'Ecommerce Product Enhancement');
        
        if (!creditResult.success) {
          console.log(`🛍️ Ecommerce Product: ${creditResult.error} - saving without enhancement`);
          // Save without AI enhancement instead of returning error
          enhancedData = productData;
          aiGenerated = false;
          creditsCharged = 0;
        } else {
          creditsCharged = 10;
          console.log('🛍️ Ecommerce Product: Credits charged successfully');

          // Enhance with AI
          console.log('🛍️ Ecommerce Product: Calling AI enhancement...');
          const enhancements = await enhanceProductWithAI(productData);
          console.log('🛍️ Ecommerce Product: AI enhancements received:', enhancements);
          enhancedData = { ...productData, ...enhancements };
          aiGenerated = true;
        }
      } catch (error: any) {
        console.error('🛍️ Ecommerce Product: Unexpected error during AI enhancement:', error);
        // Save without AI enhancement instead of throwing error
        enhancedData = productData;
        aiGenerated = false;
        creditsCharged = 0;
      }
    } else {
      console.log('🛍️ Ecommerce Product: All fields provided, skipping AI enhancement');
    }

    // Create new product
    const newProduct: EcommerceProduct = {
      id: crypto.randomUUID(),
      businessId,
      userId,
      ...enhancedData as any,
      aiGenerated,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to KV store
    const key = `ecommerce_products_${businessId}`;
    const products = await kv.get(key) || [];
    products.push(newProduct);
    await kv.set(key, products);

    return c.json({ 
      success: true,
      product: newProduct,
      creditsCharged
    });
  } catch (error: any) {
    console.error('Error creating ecommerce product:', error);
    return c.json({ 
      error: 'Failed to create ecommerce product',
      details: error.message 
    }, 500);
  }
});

/**
 * PUT /ecommerce-products/:id
 * Update an existing ecommerce product
 */
app.put('/ecommerce-products/:id', async (c) => {
  try {
    const productId = c.req.param('id');
    const body = await c.req.json();
    const { businessId, userId, type, productName, productDescription, whoBuys, whereHangOut, whyWin, differentiator, differentiatorDetails } = body;

    if (!businessId) {
      return c.json({ error: 'businessId is required' }, 400);
    }

    const key = `ecommerce_products_${businessId}`;
    const products = await kv.get(key) || [];
    const productIndex = products.findIndex((p: EcommerceProduct) => p.id === productId);

    if (productIndex === -1) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const existingProduct = products[productIndex];
    const productData: Partial<EcommerceProduct> = {
      type: type || existingProduct.type,
      productName: productName !== undefined ? productName : existingProduct.productName,
      productDescription: productDescription !== undefined ? productDescription : existingProduct.productDescription,
      whoBuys: whoBuys !== undefined ? whoBuys : existingProduct.whoBuys,
      whereHangOut: whereHangOut !== undefined ? whereHangOut : existingProduct.whereHangOut,
      whyWin: whyWin !== undefined ? whyWin : existingProduct.whyWin,
      differentiator: differentiator !== undefined ? differentiator : existingProduct.differentiator,
      differentiatorDetails: differentiatorDetails !== undefined ? differentiatorDetails : existingProduct.differentiatorDetails,
    };

    console.log('🛍️ Ecommerce Product: Received product data:', productData);

    let creditsCharged = 0;
    let enhancedData = { ...productData };
    let aiGenerated = existingProduct.aiGenerated;

    // Check if AI enhancement is needed (only for newly empty fields)
    const needsEnhancement = needsAIEnhancement(productData);
    console.log('🛍️ Ecommerce Product: Needs AI enhancement?', needsEnhancement);
    
    if (needsEnhancement) {
      try {
        console.log('🛍️ Ecommerce Product: Attempting to charge 10 credits for user:', userId);
        const creditResult = await deductUserCredits(userId, 10, 'Ecommerce Product Enhancement');
        
        if (!creditResult.success) {
          console.log(`🛍️ Ecommerce Product: ${creditResult.error} - saving without enhancement`);
          // Save without AI enhancement instead of returning error
          enhancedData = productData;
          aiGenerated = false;
          creditsCharged = 0;
        } else {
          creditsCharged = 10;
          console.log('🛍️ Ecommerce Product: Credits charged successfully');

          const enhancements = await enhanceProductWithAI(productData);
          console.log('🛍️ Ecommerce Product: AI enhancements received:', enhancements);
          enhancedData = { ...productData, ...enhancements };
          aiGenerated = true;
        }
      } catch (error: any) {
        console.error('🛍️ Ecommerce Product: Unexpected error during AI enhancement:', error);
        // Save without AI enhancement instead of throwing error
        enhancedData = productData;
        aiGenerated = false;
        creditsCharged = 0;
      }
    } else {
      console.log('🛍️ Ecommerce Product: All fields provided, skipping AI enhancement');
    }

    // Update product
    const updatedProduct: EcommerceProduct = {
      ...existingProduct,
      ...enhancedData as any,
      aiGenerated,
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProduct;
    await kv.set(key, products);

    return c.json({ 
      success: true,
      product: updatedProduct,
      creditsCharged
    });
  } catch (error: any) {
    console.error('Error updating ecommerce product:', error);
    return c.json({ 
      error: 'Failed to update ecommerce product',
      details: error.message 
    }, 500);
  }
});

/**
 * DELETE /ecommerce-products/:id
 * Delete an ecommerce product
 */
app.delete('/ecommerce-products/:id', async (c) => {
  try {
    const productId = c.req.param('id');
    const businessId = c.req.query('businessId');

    console.log('🗑️ Delete request - productId:', productId, 'businessId:', businessId);

    if (!businessId) {
      console.error('🗑️ Delete failed: businessId is required');
      return c.json({ error: 'businessId is required' }, 400);
    }

    const key = `ecommerce_products_${businessId}`;
    console.log('🗑️ Fetching products from key:', key);
    
    const products = await kv.get(key) || [];
    console.log('🗑️ Current products count:', products.length);
    console.log('🗑️ Products:', JSON.stringify(products, null, 2));
    
    const filteredProducts = products.filter((p: EcommerceProduct) => p.id !== productId);
    console.log('🗑️ Filtered products count:', filteredProducts.length);

    if (filteredProducts.length === products.length) {
      console.error('🗑️ Product not found with id:', productId);
      return c.json({ error: 'Product not found' }, 404);
    }

    await kv.set(key, filteredProducts);
    console.log('🗑️ Product deleted successfully');

    return c.json({ 
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('🗑️ Error deleting ecommerce product:', error);
    return c.json({ 
      error: 'Failed to delete ecommerce product',
      details: error.message 
    }, 500);
  }
});

export default app;