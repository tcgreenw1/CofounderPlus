import React, { useState, useEffect } from 'react';
import { Plus, Package, Edit, Trash2, ShoppingBag, Eye, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { EcommerceProducts } from './EcommerceProducts';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

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
}

interface UnifiedProductsViewProps {
  businessId: string;
  userId: string;
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

export function UnifiedProductsView({ 
  businessId, 
  userId,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}: UnifiedProductsViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load regular products from backend
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.log('📦 UnifiedProductsView: No access token, skipping product load');
        setIsLoading(false);
        return;
      }

      console.log('📦 UnifiedProductsView: Loading products for businessId:', businessId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/data?businessId=${businessId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('📦 UnifiedProductsView: Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 UnifiedProductsView: Loaded products:', data.products?.length || 0);
        setProducts(data.products || []);
      } else {
        const errorText = await response.text();
        console.error('📦 UnifiedProductsView: Failed to load products:', errorText);
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('📦 UnifiedProductsView: Error loading products:', error);
      toast.error('Error loading products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId && userId) {
      console.log('📦 UnifiedProductsView: useEffect triggered', { businessId, userId });
      loadProducts();
    }
  }, [businessId, userId]);

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${product.id}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('Product deleted successfully');
        loadProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <Tabs defaultValue="catalog" style={{ width: '100%' }}>
        <TabsList 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)',
            maxWidth: '400px',
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-4)'
          }}
        >
          <TabsTrigger value="catalog">
            <Package className="w-4 h-4 mr-2" />
            Product Catalog
          </TabsTrigger>
          <TabsTrigger value="ecommerce">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Ecommerce Ideas
          </TabsTrigger>
        </TabsList>

        {/* Product Catalog Tab */}
        <TabsContent value="catalog" style={{ marginTop: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {/* Header with Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
              <div>
                <h3 style={{ fontWeight: 'var(--font-weight-semibold)' }}>Product Catalog</h3>
                <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
                  {isLoading ? 'Loading products...' : `${products.length} product${products.length !== 1 ? 's' : ''} in catalog`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Button
                  onClick={loadProducts}
                  variant="outline"
                  disabled={isLoading}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {onAddProduct && (
                  <Button
                    onClick={onAddProduct}
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                padding: 'var(--spacing-8)'
              }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
              </div>
            ) : products.length === 0 ? (
              <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                <CardContent style={{ padding: 'var(--spacing-8)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Package 
                      className="w-12 h-12 mx-auto mb-4" 
                      style={{ color: 'var(--muted-foreground)' }} 
                    />
                    <h3>No Products Yet</h3>
                    <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
                      Click "Add Product" to create your first product
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 'var(--spacing-4)'
              }}>
                {products.map((product) => (
                  <Card 
                    key={product.id}
                    style={{ 
                      borderRadius: 'var(--radius-xl)', 
                      border: '1px solid var(--border)',
                    }}
                  >
                    <CardHeader style={{ padding: 'var(--spacing-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'var(--spacing-2)',
                            marginBottom: 'var(--spacing-2)'
                          }}>
                            <Badge 
                              style={{
                                background: product.status === 'active' ? 'var(--success-soft)' : 'var(--muted)',
                                color: product.status === 'active' ? 'var(--success)' : 'var(--muted-foreground)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-1) var(--spacing-2)',
                                fontSize: '12px'
                              }}
                            >
                              {product.status}
                            </Badge>
                            <Badge 
                              style={{
                                background: 'var(--primary-soft)',
                                color: 'var(--primary)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-1) var(--spacing-2)',
                                fontSize: '12px'
                              }}
                            >
                              {product.category}
                            </Badge>
                          </div>
                          <CardTitle style={{ fontSize: '16px', marginBottom: 'var(--spacing-2)' }}>
                            {product.name}
                          </CardTitle>
                          {product.description && (
                            <CardDescription style={{ fontSize: '13px' }}>
                              {product.description.length > 100 
                                ? `${product.description.substring(0, 100)}...` 
                                : product.description}
                            </CardDescription>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                          {onEditProduct && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditProduct(product)}
                              style={{ padding: 'var(--spacing-2)' }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            style={{ 
                              padding: 'var(--spacing-2)',
                              color: 'var(--destructive)'
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent style={{ padding: '0 var(--spacing-4) var(--spacing-4)' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'var(--spacing-3)',
                        marginTop: 'var(--spacing-3)'
                      }}>
                        <div>
                          <div style={{ 
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            marginBottom: 'var(--spacing-1)'
                          }}>
                            Price
                          </div>
                          <div style={{ 
                            fontSize: '14px',
                            fontWeight: 'var(--font-weight-semibold)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-1)'
                          }}>
                            <DollarSign className="w-3 h-3" />
                            {product.price.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            marginBottom: 'var(--spacing-1)'
                          }}>
                            Sales
                          </div>
                          <div style={{ 
                            fontSize: '14px',
                            fontWeight: 'var(--font-weight-semibold)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-1)'
                          }}>
                            <TrendingUp className="w-3 h-3" />
                            {product.sales || 0}
                          </div>
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '12px',
                            color: 'var(--muted-foreground)',
                            marginBottom: 'var(--spacing-1)'
                          }}>
                            Views
                          </div>
                          <div style={{ 
                            fontSize: '14px',
                            fontWeight: 'var(--font-weight-semibold)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-1)'
                          }}>
                            <Eye className="w-3 h-3" />
                            {product.views || 0}
                          </div>
                        </div>
                      </div>
                      {product.inventory !== undefined && (
                        <div style={{ 
                          marginTop: 'var(--spacing-3)',
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--accent)',
                          fontSize: '12px'
                        }}>
                          <strong>Inventory:</strong> {product.inventory} units
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Ecommerce Products Tab */}
        <TabsContent value="ecommerce" style={{ marginTop: 'var(--spacing-4)' }}>
          <EcommerceProducts businessId={businessId} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}