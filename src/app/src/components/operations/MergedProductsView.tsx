import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Package, 
  Edit, 
  Trash2, 
  ShoppingBag, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  Sparkles,
  Download,
  Filter,
  Megaphone
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { EcommerceProductModal } from './EcommerceProductModal';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { useNavigate } from 'react-router-dom';

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

interface EcommerceProduct {
  id: string;
  businessId: string;
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

interface MergedProductsViewProps {
  businessId: string;
  userId: string;
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  refreshTrigger?: number; // Add this to trigger refreshes from parent
  products?: Product[]; // Optional prop to receive products from parent
}

const PRODUCT_TYPE_LABELS = {
  'print-on-demand': 'Print-on-Demand',
  'affiliate': 'Affiliate',
  'digital-product': 'Digital Product',
  'local-arbitrage': 'Local Arbitrage'
};

const DIFFERENTIATOR_LABELS = {
  'new-bundle': 'New Bundle',
  'new-message': 'New Message',
  'new-platform': 'New Platform',
  'new-use-case': 'New Use Case',
  'unknown': 'Unknown'
};

export function MergedProductsView({ 
  businessId, 
  userId,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRefresh, // Add callback for parent refresh
  refreshTrigger,
  products: productsProp
}: MergedProductsViewProps & { onRefresh?: () => void }) {
  const navigate = useNavigate();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(productsProp || []);
  const [ecommerceProducts, setEcommerceProducts] = useState<EcommerceProduct[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(!productsProp);
  const [isEcommerceLoading, setIsEcommerceLoading] = useState(true);
  const [isEcommerceModalOpen, setIsEcommerceModalOpen] = useState(false);
  const [editingEcommerceProduct, setEditingEcommerceProduct] = useState<EcommerceProduct | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Load catalog products
  const loadCatalogProducts = async () => {
    try {
      setIsCatalogLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      console.log('📦 MergedProductsView: Loading catalog products', {
        hasSession: !!session,
        hasAccessToken: !!accessToken,
        businessId
      });

      if (!accessToken) {
        console.warn('📦 MergedProductsView: No access token available');
        setIsCatalogLoading(false);
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/data?businessId=${businessId}`;
      console.log('📦 MergedProductsView: Fetching from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('📦 MergedProductsView: Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 MergedProductsView: Response data:', {
          success: data.success,
          productsCount: data.products?.length || 0,
          total: data.total,
          timestamp: data.timestamp,
          firstProduct: data.products?.[0]
        });
        setCatalogProducts(data.products || []);
      } else {
        const errorText = await response.text();
        console.error('📦 MergedProductsView: Failed to load products:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        toast.error('Failed to load catalog products');
      }
    } catch (error) {
      console.error('📦 MergedProductsView: Error loading catalog products:', error);
      toast.error('Error loading catalog products');
    } finally {
      setIsCatalogLoading(false);
    }
  };

  // Load ecommerce products
  const loadEcommerceProducts = async () => {
    try {
      setIsEcommerceLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ecommerce-products?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load ecommerce products');
      }

      const data = await response.json();
      setEcommerceProducts(data.products || []);
    } catch (error) {
      console.error('Error loading ecommerce products:', error);
      toast.error('Failed to load ecommerce products');
    } finally {
      setIsEcommerceLoading(false);
    }
  };

  useEffect(() => {
    if (productsProp) {
      setCatalogProducts(productsProp);
      setIsCatalogLoading(false);
    }
  }, [productsProp]);

  useEffect(() => {
    if (businessId && userId) {
      console.log('🔄 MergedProductsView: Reloading products (refreshTrigger:', refreshTrigger, ')');
      if (!productsProp) {
        loadCatalogProducts();
      }
      loadEcommerceProducts();
    }
  }, [businessId, userId, refreshTrigger]); // productsProp handled in separate effect to avoid loop

  // Delete handlers
  const handleDeleteCatalogProduct = async (product: Product) => {
    // Direct delete without confirmation
    if (onDeleteProduct) {
      onDeleteProduct(product);
      return;
    }

    // Fallback if no onDeleteProduct prop
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
        loadCatalogProducts();
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleDeleteEcommerceProduct = async (productId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ecommerce-products/${productId}?businessId=${businessId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product idea deleted successfully');
      loadEcommerceProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleEcommerceProductSaved = () => {
    setIsEcommerceModalOpen(false);
    setEditingEcommerceProduct(null);
    loadEcommerceProducts();
  };

  // Export ecommerce products to CSV
  const handleExportEcommerce = () => {
    if (ecommerceProducts.length === 0) {
      toast.error('No ecommerce ideas to export');
      return;
    }

    const headers = ['Product Name', 'Type', 'Description', 'Target Customer', 'Distribution Channels', 'Competitive Advantage', 'Differentiator', 'Tool Enhanced', 'Created'];
    const rows = ecommerceProducts.map(p => [
      p.productName || 'Untitled',
      PRODUCT_TYPE_LABELS[p.type],
      p.productDescription || '',
      p.whoBuys || '',
      p.whereHangOut || '',
      p.whyWin || '',
      p.differentiator ? DIFFERENTIATOR_LABELS[p.differentiator] : '',
      p.aiGenerated ? 'Yes' : 'No',
      new Date(p.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `\"${cell}\"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecommerce-ideas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Ecommerce ideas exported successfully');
  };

  // Calculate stats
  const ecommerceStats = {
    total: ecommerceProducts.length,
    aiEnhanced: ecommerceProducts.filter(p => p.aiGenerated).length,
    withStrategy: ecommerceProducts.filter(p => p.differentiator && p.differentiator !== 'unknown').length,
  };

  const isLoading = isCatalogLoading || isEcommerceLoading;

  // Filter ecommerce products
  const filteredEcommerceProducts = ecommerceProducts.filter(product => {
    const matchesSearch = !searchQuery || 
      (product.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       product.productDescription?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || product.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
        <div>
          <h2>Products</h2>
          <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
            Manage your product catalog and ecommerce ideas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
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
              Add Catalog Product
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingEcommerceProduct(null);
              setIsEcommerceModalOpen(true);
            }}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Ecommerce Idea
          </Button>
        </div>
      </div>

      {/* Product Catalog Section */}
      <section>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-4)'
        }}>
          <div>
            <h3>Product Catalog</h3>
            <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              {isCatalogLoading ? 'Loading products...' : `${catalogProducts.length} product${catalogProducts.length !== 1 ? 's' : ''} in catalog`}
            </p>
          </div>
        </div>

        {isCatalogLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 'var(--spacing-8)'
          }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
          </div>
        ) : catalogProducts.length === 0 ? (
          <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-8)' }}>
              <div style={{ textAlign: 'center' }}>
                <Package 
                  className="w-12 h-12 mx-auto mb-4" 
                  style={{ color: 'var(--muted-foreground)' }} 
                />
                <h3>No Catalog Products Yet</h3>
                <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
                  Click "Add Catalog Product" to create your first product
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
            {catalogProducts.map((product) => (
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
                        onClick={() => handleDeleteCatalogProduct(product)}
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
                  {product.inventory !== undefined && product.category !== 'software' && (
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
      </section>

      {/* Ecommerce Ideas Section */}
      <section>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-4)',
          flexWrap: 'wrap',
          gap: 'var(--spacing-3)'
        }}>
          <div>
            <h3>Ecommerce Ideas</h3>
            <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>
              Track and research your ecommerce product ideas
            </p>
          </div>
          {ecommerceProducts.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportEcommerce}
              style={{
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Statistics */}
        {ecommerceProducts.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)'
          }}>
            <Card style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <CardContent style={{ padding: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  <div style={{
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary-soft)',
                  }}>
                    <ShoppingBag className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'var(--font-weight-bold)' }}>
                      {ecommerceStats.total}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      Total Ideas
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <CardContent style={{ padding: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  <div style={{
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--success-soft)',
                  }}>
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'var(--font-weight-bold)' }}>
                      {ecommerceStats.aiEnhanced}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      Tool Enhanced
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <CardContent style={{ padding: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  <div style={{
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255, 207, 0, 0.1)',
                  }}>
                    <TrendingUp className="w-5 h-5" style={{ color: '#FFCF00' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'var(--font-weight-bold)' }}>
                      {ecommerceStats.withStrategy}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      With Strategy
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {ecommerceProducts.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-4)',
            flexWrap: 'wrap'
          }}>
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                maxWidth: '300px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger style={{ 
                width: '200px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="print-on-demand">Print-on-Demand</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="digital-product">Digital Product</SelectItem>
                <SelectItem value="local-arbitrage">Local Arbitrage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ecommerce Products Grid */}
        {isEcommerceLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 'var(--spacing-8)'
          }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
          </div>
        ) : filteredEcommerceProducts.length === 0 ? (
          <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-8)' }}>
              <div style={{ textAlign: 'center' }}>
                <ShoppingBag 
                  className="w-12 h-12 mx-auto mb-4" 
                  style={{ color: 'var(--muted-foreground)' }} 
                />
                <h3>{ecommerceProducts.length === 0 ? 'No Ecommerce Ideas Yet' : 'No Matching Ideas'}</h3>
                <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
                  {ecommerceProducts.length === 0 
                    ? 'Click "Add Ecommerce Idea" to start researching'
                    : 'Try adjusting your filters or search query'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 'var(--spacing-4)'
          }}>
            {filteredEcommerceProducts.map((product) => (
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
                        marginBottom: 'var(--spacing-2)',
                        flexWrap: 'wrap'
                      }}>
                        <Badge 
                          style={{
                            background: 'var(--primary-soft)',
                            color: 'var(--primary)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--spacing-1) var(--spacing-2)',
                            fontSize: '12px'
                          }}
                        >
                          {PRODUCT_TYPE_LABELS[product.type]}
                        </Badge>
                        {product.aiGenerated && (
                          <Badge 
                            style={{
                              background: 'var(--success-soft)',
                              color: 'var(--success)',
                              borderRadius: 'var(--radius-md)',
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-1)'
                            }}
                          >
                            <Sparkles className="w-3 h-3" />
                            Tool Enhanced
                          </Badge>
                        )}
                      </div>
                      <CardTitle style={{ fontSize: '16px', marginBottom: 'var(--spacing-2)' }}>
                        {product.productName || 'Untitled Idea'}
                      </CardTitle>
                      {product.productDescription && (
                        <CardDescription style={{ fontSize: '13px' }}>
                          {product.productDescription.length > 120 
                            ? `${product.productDescription.substring(0, 120)}...` 
                            : product.productDescription}
                        </CardDescription>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEcommerceProduct(product);
                          setIsEcommerceModalOpen(true);
                        }}
                        style={{ padding: 'var(--spacing-2)' }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${product.productName || 'this idea'}"?`)) {
                            handleDeleteEcommerceProduct(product.id);
                          }
                        }}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    {product.whoBuys && (
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                          Target Customer
                        </div>
                        <div style={{ fontSize: '13px' }}>{product.whoBuys}</div>
                      </div>
                    )}
                    {product.whereHangOut && (
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                          Distribution Channels
                        </div>
                        <div style={{ fontSize: '13px' }}>{product.whereHangOut}</div>
                      </div>
                    )}
                    {product.whyWin && (
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                          Competitive Advantage
                        </div>
                        <div style={{ fontSize: '13px' }}>{product.whyWin}</div>
                      </div>
                    )}
                    {product.differentiator && product.differentiator !== 'unknown' && (
                      <div style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 207, 0, 0.1)',
                        border: '1px solid rgba(255, 207, 0, 0.3)'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: '#FFCF00', marginBottom: 'var(--spacing-1)' }}>
                          Strategy: {DIFFERENTIATOR_LABELS[product.differentiator]}
                        </div>
                        {product.differentiatorDetails && (
                          <div style={{ fontSize: '12px', color: 'var(--foreground)' }}>
                            {product.differentiatorDetails}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Marketing Plan Button */}
                    <Button
                      onClick={() => {
                        navigate('/operations/marketing', {
                          state: { ecommerceProductId: product.id, ecommerceProduct: product }
                        });
                      }}
                      style={{
                        width: '100%',
                        marginTop: 'var(--spacing-2)',
                        background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
                        color: 'white',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-2)',
                      }}
                    >
                      <Megaphone className="w-4 h-4" />
                      Create Marketing Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Ecommerce Product Modal */}
      {isEcommerceModalOpen && (
        <EcommerceProductModal
          isOpen={isEcommerceModalOpen}
          onClose={() => {
            setIsEcommerceModalOpen(false);
            setEditingEcommerceProduct(null);
          }}
          onSave={handleEcommerceProductSaved}
          businessId={businessId}
          userId={userId}
          product={editingEcommerceProduct}
        />
      )}
    </div>
  );
}