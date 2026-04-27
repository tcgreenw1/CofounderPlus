import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

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
      
      // Get products from KV store
      const productsKey = `business:${businessId}:products`;
      const products = await kv.get(productsKey) || [];
      
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
      
      // Verify user access
      try {
        await verifyUserAccess(accessToken);
      } catch (error: any) {
        console.error('🏭 Products: Authorization failed:', error.message);
        return c.json({ success: false, error: 'Invalid authorization token' }, 401);
      }
      
      const requestBody = await c.req.json();
      console.log('🏭 Products: Create product request:', requestBody);
      
      const { name, description, price, category, status, inventory, businessIds } = requestBody;
      
      // Validate required fields
      if (!name || !description || price === undefined || !category) {
        console.error('🏭 Products: Missing required fields');
        return c.json({ success: false, error: 'Name, description, price, and category are required' }, 400);
      }
      
      // Create new product with a shared ID
      const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newProduct: Product = {
        id: productId,
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
        user_id: 'user_placeholder' // We'd get this from the JWT token in a real implementation
      };
      
      console.log('🏭 Products: Creating new product:', newProduct.id);
      
      // Determine which businesses to add the product to
      const targetBusinessIds = businessIds && Array.isArray(businessIds) && businessIds.length > 0 
        ? businessIds 
        : [businessId];
      
      console.log('🏭 Products: Adding product to businesses:', targetBusinessIds);
      
      // Add product to all selected businesses
      for (const targetBusinessId of targetBusinessIds) {
        const productsKey = `business:${targetBusinessId}:products`;
        const existingProducts = await kv.get(productsKey) || [];
        
        // Create a copy of the product with the correct business_id
        const businessProduct = {
          ...newProduct,
          business_id: targetBusinessId
        };
        
        const updatedProducts = [businessProduct, ...existingProducts];
        await kv.set(productsKey, updatedProducts);
        
        console.log(`🏭 Products: Product added to business ${targetBusinessId}`);
      }
      
      console.log('🏭 Products: Product created successfully across all businesses');
      
      return c.json({
        success: true,
        product: newProduct,
        businessIds: targetBusinessIds,
        message: targetBusinessIds.length > 1 
          ? `Product created successfully in ${targetBusinessIds.length} businesses` 
          : 'Product created successfully',
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
      
      const updateData = await c.req.json();
      console.log('🏭 Products: Update product request:', { productId, updateData });
      
      // Get existing products
      const productsKey = `business:${businessId}:products`;
      const existingProducts = await kv.get(productsKey) || [];
      
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
      
      // Save updated products list
      await kv.set(productsKey, existingProducts);
      
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
      
      // Verify user access
      try {
        await verifyUserAccess(accessToken);
      } catch (error: any) {
        console.error('🏭 Products: Authorization failed:', error.message);
        return c.json({ success: false, error: 'Invalid authorization token' }, 401);
      }
      
      // Get existing products
      const productsKey = `business:${businessId}:products`;
      const existingProducts = await kv.get(productsKey) || [];
      
      // Find product to delete
      const productIndex = existingProducts.findIndex((p: Product) => p.id === productId);
      
      if (productIndex === -1) {
        console.error('🏭 Products: Product not found:', productId);
        return c.json({ success: false, error: 'Product not found' }, 404);
      }
      
      // Remove the product
      const deletedProduct = existingProducts[productIndex];
      existingProducts.splice(productIndex, 1);
      
      // Save updated products list
      await kv.set(productsKey, existingProducts);
      
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