import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

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
        errorMessage.includes('503');
      
      if (!shouldRetry || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Auth request failed after retries');
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'inactive' | 'development';
  inventory?: number;
  sales: number;
  views: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
  business_id: string;
  user_id: string;
}

// Helper function to verify user access
const verifyUserAccess = async (accessToken: string) => {
  // This would implement JWT verification
  // For now, we'll just check if token exists
  if (!accessToken || accessToken === 'undefined') {
    throw new Error('Invalid or missing access token');
  }
  return true;
};

// Helper function to parse products data from KV store
const parseProductsData = (productsData: any): Product[] => {
  if (!productsData) {
    return [];
  }
  
  if (typeof productsData === 'string') {
    try {
      return JSON.parse(productsData);
    } catch (error) {
      console.error('🏭 Products: Error parsing products data:', error);
      return [];
    }
  }
  
  if (Array.isArray(productsData)) {
    return productsData;
  }
  
  console.warn('🏭 Products: Unexpected data format:', typeof productsData);
  return [];
};

// Helper function to get current organization ID for a user
const getCurrentOrganizationId = async (userId: string): Promise<string> => {
  try {
    const contextKey = `user_current_org:${userId}`;
    const context = await kv.get(contextKey);
    
    if (!context) {
      // No org context set, user is in their own organization
      return userId;
    }
    
    const parsedContext = typeof context === 'string' ? JSON.parse(context) : context;
    return parsedContext.organizationId || userId;
  } catch (error) {
    console.error('❌ Error getting current organization:', error);
    // Fallback to user's own organization on error
    return userId;
  }
};

export function addProductEndpoints(app: Hono) {
  console.log('🏭 Setting up Product endpoints...');

  // Get products data for a business
  app.get('/make-server-373d8b09/products/data', async (c) => {
    try {
      console.log('🏭 Products: Get products data endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      console.log('🏭 Products: Request params:', { businessId, hasToken: !!accessToken });
      
      if (!businessId) {
        console.error('🏭 Products: Missing businessId parameter');
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        console.error('🏭 Products: Missing access token');
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      // Verify user access
      try {
        await verifyUserAccess(accessToken);
      } catch (error: any) {
        console.error('🏭 Products: Authorization failed:', error.message);
        return c.json({ success: false, error: 'Invalid authorization token' }, 401);
      }
      
      console.log('🏭 Products: Fetching products for business:', businessId);
      
      // Get user from token - create client with ANON_KEY for token validation
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        }
      );

      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        console.error('🏭 Products: Auth error:', authError);
        return c.json({ success: false, error: 'Invalid authorization' }, 401);
      }

      const userId = user.id;
      
      // Get user's current organization context
      const organizationId = await getCurrentOrganizationId(userId);
      console.log('🏭 Products: Organization context:', { userId, organizationId });
      
      // Get products from KV store using organization context
      const productsKey = `business:${organizationId}:${businessId}:products`;
      console.log('🏭 Products: Fetching from key:', productsKey);
      
      const productsData = await kv.get(productsKey);
      console.log('🏭 Products: Raw data type:', typeof productsData);
      
      const products = parseProductsData(productsData);
      
      console.log('🏭 Products: Found products:', products.length);
      
      return c.json({
        success: true,
        products: products,
        total: products.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🏭 Products: Error fetching products data:', error);
      return c.json({ 
        success: false, 
        error: `Failed to fetch products: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  // Create a new product
  app.post('/make-server-373d8b09/products', async (c) => {
    try {
      console.log('🏭 Products: Create product endpoint called');
      
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!businessId) {
        console.error('🏭 Products: Missing businessId parameter');
        return c.json({ success: false, error: 'Business ID is required' }, 400);
      }
      
      if (!accessToken) {
        console.error('🏭 Products: Missing access token');
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      // Get user from token
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        }
      );

      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        console.error('🏭 Products: Auth error:', authError);
        return c.json({ success: false, error: 'Invalid authorization' }, 401);
      }

      const userId = user.id;
      
      const requestBody = await c.req.json();
      console.log('🏭 Products: Create product request:', requestBody);
      
      const { name, description, price, category, status, inventory } = requestBody;
      
      // Validate required fields
      if (!name || !description || price === undefined || !category) {
        console.error('🏭 Products: Missing required fields');
        return c.json({ success: false, error: 'Name, description, price, and category are required' }, 400);
      }
      
      // Get user's current organization context
      const organizationId = await getCurrentOrganizationId(userId);
      console.log('🏭 Products: Creating product in organization:', organizationId);
      
      // Create new product
      const newProduct: Product = {
        id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category,
        status: status || 'active',
        inventory: inventory || 0,
        sales: 0,
        views: 0,
        conversion_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        business_id: businessId,
        user_id: userId
      };
      
      console.log('🏭 Products: Creating new product:', newProduct.id);
      
      // Get existing products and add the new one using organization context
      const productsKey = `business:${organizationId}:${businessId}:products`;
      const productsData = await kv.get(productsKey);
      const existingProducts = parseProductsData(productsData);
      
      const updatedProducts = [newProduct, ...existingProducts];
      
      // Save updated products list (always as JSON string for consistency)
      await kv.set(productsKey, JSON.stringify(updatedProducts));
      
      console.log('🏭 Products: Product created successfully:', newProduct.id);
      
      return c.json({
        success: true,
        product: newProduct,
        message: 'Product created successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🏭 Products: Error creating product:', error);
      return c.json({ 
        success: false, 
        error: `Failed to create product: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  // Update a product
  app.put('/make-server-373d8b09/products/:id', async (c) => {
    try {
      console.log('🏭 Products: Update product endpoint called');
      
      const productId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!productId || !businessId) {
        console.error('🏭 Products: Missing required parameters');
        return c.json({ success: false, error: 'Product ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        console.error('🏭 Products: Missing access token');
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      // Verify user access
      try {
        await verifyUserAccess(accessToken);
      } catch (error: any) {
        console.error('🏭 Products: Authorization failed:', error.message);
        return c.json({ success: false, error: 'Invalid authorization token' }, 401);
      }
      
      // Get user from token
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        }
      );

      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        console.error('🏭 Products: Auth error:', authError);
        return c.json({ success: false, error: 'Invalid authorization' }, 401);
      }

      const userId = user.id;
      
      const updateData = await c.req.json();
      console.log('🏭 Products: Update product request:', { productId, updateData });
      
      // Get user's current organization context
      const organizationId = await getCurrentOrganizationId(userId);
      console.log('🏭 Products: Updating product in organization:', organizationId);
      
      // Get existing products using organization context
      const productsKey = `business:${organizationId}:${businessId}:products`;
      const productsData = await kv.get(productsKey);
      const existingProducts = parseProductsData(productsData);
      
      // Find product to update
      const productIndex = existingProducts.findIndex((p: Product) => p.id === productId);
      
      if (productIndex === -1) {
        console.error('🏭 Products: Product not found:', productId);
        return c.json({ success: false, error: 'Product not found' }, 404);
      }
      
      // Update the product
      const updatedProduct = {
        ...existingProducts[productIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      existingProducts[productIndex] = updatedProduct;
      
      // Save updated products list (always as JSON string for consistency)
      await kv.set(productsKey, JSON.stringify(existingProducts));
      
      console.log('🏭 Products: Product updated successfully:', productId);
      
      return c.json({
        success: true,
        product: updatedProduct,
        message: 'Product updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🏭 Products: Error updating product:', error);
      return c.json({ 
        success: false, 
        error: `Failed to update product: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  // Delete a product
  app.delete('/make-server-373d8b09/products/:id', async (c) => {
    try {
      console.log('🏭 Products: Delete product endpoint called');
      
      const productId = c.req.param('id');
      const businessId = c.req.query('businessId');
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!productId || !businessId) {
        console.error('🏭 Products: Missing required parameters');
        return c.json({ success: false, error: 'Product ID and Business ID are required' }, 400);
      }
      
      if (!accessToken) {
        console.error('🏭 Products: Missing access token');
        return c.json({ success: false, error: 'Authorization token is required' }, 401);
      }
      
      // Get user from token
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        }
      );

      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        console.error('🏭 Products: Auth error:', authError);
        return c.json({ success: false, error: 'Invalid authorization' }, 401);
      }

      const userId = user.id;
      
      // Get user's current organization context
      const organizationId = await getCurrentOrganizationId(userId);
      console.log('🏭 Products: Deleting product in organization:', organizationId);
      
      // Get existing products using organization context
      const productsKey = `business:${organizationId}:${businessId}:products`;
      const productsData = await kv.get(productsKey);
      const existingProducts = parseProductsData(productsData);
      
      // Find product to delete
      const productIndex = existingProducts.findIndex((p: Product) => p.id === productId);
      
      if (productIndex === -1) {
        console.error('🏭 Products: Product not found:', productId);
        return c.json({ success: false, error: 'Product not found' }, 404);
      }
      
      // Remove the product
      const deletedProduct = existingProducts[productIndex];
      existingProducts.splice(productIndex, 1);
      
      // Save updated products list (always as JSON string for consistency)
      await kv.set(productsKey, JSON.stringify(existingProducts));
      
      console.log('🏭 Products: Product deleted successfully:', productId);
      
      return c.json({
        success: true,
        product: deletedProduct,
        message: 'Product deleted successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('🏭 Products: Error deleting product:', error);
      return c.json({ 
        success: false, 
        error: `Failed to delete product: ${error.message}`,
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  console.log('🏭 Product endpoints setup completed');
}