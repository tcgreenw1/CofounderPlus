import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Loader2,
  Filter,
  Megaphone,
  Download
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { EcommerceProductModal } from './EcommerceProductModal';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

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

interface EcommerceProductsProps {
  businessId: string;
  userId: string;
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

export function EcommerceProducts({ businessId, userId }: EcommerceProductsProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<EcommerceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EcommerceProduct | null>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifferentiator, setFilterDifferentiator] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Load products
  const loadProducts = async () => {
    try {
      setIsLoading(true);
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
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading ecommerce products:', error);
      toast.error('Failed to load ecommerce products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [businessId]);

  // Debug logging
  useEffect(() => {
    console.log('EcommerceProducts mounted - businessId:', businessId, 'userId:', userId);
    console.log('Products loaded:', products.length);
  }, [products, businessId, userId]);

  const handleDelete = async (productId: string) => {
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
        const errorData = await response.json();
        console.error('Delete error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleProductSaved = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    loadProducts();
  };

  // Calculate statistics
  const stats = {
    total: products.length,
    aiEnhanced: products.filter(p => p.aiGenerated).length,
    byType: {
      'print-on-demand': products.filter(p => p.type === 'print-on-demand').length,
      'affiliate': products.filter(p => p.type === 'affiliate').length,
      'digital-product': products.filter(p => p.type === 'digital-product').length,
      'local-arbitrage': products.filter(p => p.type === 'local-arbitrage').length,
    },
    withDifferentiator: products.filter(p => p.differentiator && p.differentiator !== 'unknown').length,
  };

  // Export to CSV
  const handleExport = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }

    const headers = ['Product Name', 'Type', 'Description', 'Target Customer', 'Distribution Channels', 'Competitive Advantage', 'Differentiator', 'AI Enhanced', 'Created'];
    const rows = products.map(p => [
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

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecommerce-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Products exported successfully');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Ecommerce Products</h2>
          <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
            Track and research your ecommerce product ideas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={products.length === 0}
            style={{
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ecommerce Product
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {products.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-4)'
        }}>
          <Card style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div style={{
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary-soft)',
                }}>
                  <Package className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'var(--font-weight-bold)' }}>
                    {stats.total}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Total Products
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
                    {stats.aiEnhanced}
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
                    {stats.withDifferentiator}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    With Strategy
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
                  background: 'rgba(147, 51, 234, 0.1)',
                }}>
                  <BarChart3 className="w-5 h-5" style={{ color: '#9333EA' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'var(--font-weight-semibold)' }}>
                    {Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0]?.[1] || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    {PRODUCT_TYPE_LABELS[Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0]?.[0] as keyof typeof PRODUCT_TYPE_LABELS] || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    Most Common
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value)}
            style={{ width: '150px' }}
          >
            <SelectTrigger>
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
          <Select
            value={filterDifferentiator}
            onValueChange={(value) => setFilterDifferentiator(value)}
            style={{ width: '150px' }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by differentiator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Differentiators</SelectItem>
              <SelectItem value="new-bundle">New Bundle</SelectItem>
              <SelectItem value="new-message">New Message</SelectItem>
              <SelectItem value="new-platform">New Platform</SelectItem>
              <SelectItem value="new-use-case">New Use Case</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value)}
            style={{ width: '150px' }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery('');
            setFilterType('all');
            setFilterDifferentiator('all');
            setSortBy('newest');
          }}
        >
          <Filter className="w-4 h-4 mr-2" />
          Reset Filters
        </Button>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 'var(--spacing-8)'
        }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
        </div>
      ) : products.length === 0 ? (
        <Card style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
          <CardContent style={{ padding: 'var(--spacing-8)' }}>
            <div style={{ textAlign: 'center' }}>
              <Package 
                className="w-12 h-12 mx-auto mb-4" 
                style={{ color: 'var(--muted-foreground)' }} 
              />
              <h3>No Ecommerce Products Yet</h3>
              <p style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
                Click the "+ Ecommerce Product" button to add your first product idea
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
          {products
            .filter(product => 
              (filterType === 'all' || product.type === filterType) &&
              (filterDifferentiator === 'all' || product.differentiator === filterDifferentiator) &&
              (searchQuery === '' || product.productName?.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .sort((a, b) => {
              if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              if (sortBy === 'name') return a.productName?.localeCompare(b.productName || '') || 0;
              return 0;
            })
            .map((product) => (
            <Card 
              key={product.id}
              style={{ 
                borderRadius: 'var(--radius-xl)', 
                border: '1px solid var(--border)',
                position: 'relative',
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
                      <div style={{
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-soft)',
                        fontSize: '12px',
                        color: 'var(--primary)',
                      }}>
                        {PRODUCT_TYPE_LABELS[product.type]}
                      </div>
                      {product.aiGenerated && (
                        <div style={{
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--success-soft)',
                          fontSize: '12px',
                          color: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-1)'
                        }}>
                          <Sparkles className="w-3 h-3" />
                          Enhanced
                        </div>
                      )}
                    </div>
                    <CardTitle style={{ fontSize: '16px' }}>
                      {product.productName || 'Untitled Product'}
                    </CardTitle>
                    {product.productDescription && (
                      <CardDescription style={{ marginTop: 'var(--spacing-2)', fontSize: '13px' }}>
                        {product.productDescription.length > 100 
                          ? `${product.productDescription.substring(0, 100)}...` 
                          : product.productDescription}
                      </CardDescription>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setIsModalOpen(true);
                      }}
                      style={{ padding: 'var(--spacing-2)' }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
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
                      <div style={{ 
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        marginBottom: 'var(--spacing-1)'
                      }}>
                        Who buys this?
                      </div>
                      <div style={{ fontSize: '14px' }}>{product.whoBuys}</div>
                    </div>
                  )}
                  {product.whereHangOut && (
                    <div>
                      <div style={{ 
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        marginBottom: 'var(--spacing-1)'
                      }}>
                        Where do they hang out?
                      </div>
                      <div style={{ fontSize: '14px' }}>{product.whereHangOut}</div>
                    </div>
                  )}
                  {product.whyWin && (
                    <div>
                      <div style={{ 
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        marginBottom: 'var(--spacing-1)'
                      }}>
                        Why would this version win?
                      </div>
                      <div style={{ fontSize: '14px' }}>{product.whyWin}</div>
                    </div>
                  )}
                  {product.differentiator && product.differentiator !== 'unknown' && (
                    <div>
                      <div style={{ 
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        marginBottom: 'var(--spacing-1)'
                      }}>
                        Market Differentiator
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--accent)',
                      }}>
                        <strong>{DIFFERENTIATOR_LABELS[product.differentiator]}</strong>
                        {product.differentiatorDetails && (
                          <div style={{ marginTop: 'var(--spacing-2)' }}>
                            {product.differentiatorDetails}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Marketing Button */}
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

      {/* Add/Edit Modal */}
      <EcommerceProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={handleProductSaved}
        businessId={businessId}
        userId={userId}
        editingProduct={editingProduct}
      />
    </div>
  );
}