import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Package, Plus, Edit, Search, Eye, ShoppingCart, DollarSign, Target, AlertCircle, RefreshCw, Lock, Zap, Trash2, Link as LinkIcon, ExternalLink, Bot, Sparkles
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useBusiness } from '../BusinessContext';
import { BusinessDropdownHeader } from '../BusinessDropdownHeader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ProductCreationForm } from './ProductCreationForm';
import { useOperationsUsage } from './OperationsPaywall';
import { productTemplates, statusOptions } from './constants/productConstants';
import { useCloudSubscription } from '../CloudSubscriptionContext';
import { toast } from 'sonner@2.0.3';
import { useIsMobile } from '../ui/use-mobile';
import { CofounderProduct } from './CofounderProduct';
import { EcommerceProducts } from './EcommerceProducts';
import { MergedProductsView } from './MergedProductsView';
import { isIOS } from '../../utils/platformDetection';

interface ProductOperationsProps {
  user?: any;
  userData?: any;
  isProUser?: boolean;
  onUpgrade?: () => void;
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
  isSubscription?: boolean;
  subscriptionType?: 'monthly' | 'annual';
}

function ProductOperations({ user, userData, isProUser = false, onUpgrade }: ProductOperationsProps) {
  const { selectedBusiness, userBusinesses } = useBusiness();
  const { isCreatorOrHigher } = useCloudSubscription();
  const { checkLimit } = useOperationsUsage();
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productStep, setProductStep] = useState(1);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    status: 'active',
    category: 'software'
  });
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>(
    selectedBusiness ? [selectedBusiness.id] : []
  );
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ usage: number; limit: number; tier: string } | null>(null);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductStep, setEditProductStep] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  // Deprecated state for confirmation dialog - kept for safety but unused
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add trigger for MergedProductsView
  
  // Tab state with persistence
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('productOperations_activeTab');
    return saved || 'cofounder';
  });

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('productOperations_activeTab', activeTab);
  }, [activeTab]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Handle billing portal redirect
  const handleManageBilling = async () => {
    if (!user) return;
    
    setIsBillingLoading(true);
    const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09`;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const response = await fetch(`${serverUrl}/stripe/create-customer-portal/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        window.location.href = data.portalUrl;
      } else {
        toast.error(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setIsBillingLoading(false);
    }
  };

  // Sync local products to server
  const syncLocalProductsToServer = async () => {
    if (!selectedBusiness || !user) return;

    setSyncing(true);
    setSyncMessage(null);

    try {
      const localProducts = loadProductsFromLocalStorage();
      const localOnlyProducts = localProducts.filter(p => p.id.startsWith('local-'));

      if (localOnlyProducts.length === 0) {
        setSyncMessage('No local products to sync');
        setSyncing(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setSyncMessage('Not authenticated. Please log in again.');
        setSyncing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;
      let errorDetails: string[] = [];

      for (const localProduct of localOnlyProducts) {
        try {
          console.log('🔄 Syncing product:', localProduct.name);
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products?businessId=${selectedBusiness.id}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: localProduct.name || 'Untitled Product',
                description: localProduct.description || 'No description provided',
                price: Number(localProduct.price) || 0,
                category: localProduct.category || 'other',
                status: localProduct.status || 'active',
                inventory: localProduct.inventory || 0
              })
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Product synced successfully:', localProduct.name);
            successCount++;
          } else {
            const errorText = await response.text();
            console.error('❌ Failed to sync product:', localProduct.name, errorText);
            errorDetails.push(`${localProduct.name}: ${errorText.substring(0, 100)}`);
            failCount++;
          }
        } catch (error: any) {
          console.error('❌ Error syncing product:', localProduct.name, error);
          errorDetails.push(`${localProduct.name}: ${error.message}`);
          failCount++;
        }
      }

      if (successCount > 0) {
        // Remove local-only products from localStorage since they're now on server
        const currentProducts = loadProductsFromLocalStorage();
        const serverOnlyProducts = currentProducts.filter(p => !p.id.startsWith('local-'));
        saveProductsToLocalStorage(serverOnlyProducts);
        
        // Reload products from server to get the updated list
        await loadProductData();
        setSyncMessage(`Successfully synced ${successCount} product(s) to server${failCount > 0 ? `. ${failCount} failed.` : ''}!`);
      } else {
        const errorMsg = errorDetails.length > 0 ? `Failed to sync: ${errorDetails[0]}` : 'Failed to sync products. Check console for details.';
        setSyncMessage(errorMsg);
        console.error('❌ Sync errors:', errorDetails);
      }
    } catch (error: any) {
      setSyncMessage(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Local storage functions for product persistence
  const getLocalStorageKey = () => {
    return selectedBusiness ? `cofounder_products_${selectedBusiness.id}` : null;
  };

  const saveProductsToLocalStorage = (productsToSave: Product[]) => {
    const key = getLocalStorageKey();
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(productsToSave));
      } catch (error) {
        // Silent error
      }
    }
  };

  const loadProductsFromLocalStorage = (): Product[] => {
    const key = getLocalStorageKey();
    if (key) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const products = JSON.parse(saved);
          return products;
        }
      } catch (error) {
        // Silent error
      }
    }
    return [];
  };

  const mergeServerAndLocalProducts = (serverProducts: Product[], localProducts: Product[]): Product[] => {
    // Create a map of server products by ID
    const serverProductsMap = new Map(serverProducts.map(p => [p.id, p]));
    
    // Filter local products to only include those not on server (local-only products)
    const localOnlyProducts = localProducts.filter(p => 
      p.id.startsWith('local-') && !serverProductsMap.has(p.id)
    );
    
    // Combine server products with local-only products
    const merged = [...serverProducts, ...localOnlyProducts];
    
    return merged;
  };

  // Save products to local storage whenever products state changes
  // BUT only if we're not currently loading (to avoid saving stale data during business switch)
  useEffect(() => {
    if (selectedBusiness && products.length > 0 && !loading) {
      saveProductsToLocalStorage(products);
    }
  }, [products]);

  // Check product limits based on ACTIVE products only
  const checkProductLimits = useCallback(async () => {
    if (!selectedBusiness) return;
    
    try {
      // Count only active products
      const activeProductCount = products.filter(p => p.status === 'active').length;
      
      // Get tier and limits
      const limitCheck = await checkLimit('products');
      const actualLimit = typeof limitCheck.limit === 'number' ? limitCheck.limit : 999;
      
      // Check if active product count exceeds limit
      const isLimitExceeded = activeProductCount >= actualLimit;
      
      setLimitReached(isLimitExceeded);
      setLimitInfo({
        usage: activeProductCount,  // Use actual active product count
        limit: actualLimit,
        tier: limitCheck.tier
      });
    } catch (error) {
      // Silent error
    }
  }, [selectedBusiness, products, checkLimit]);

  useEffect(() => {
    checkProductLimits();
  }, [checkProductLimits, products.length]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!showAddProduct) {
      setProductStep(1);
      setNewProduct({ status: 'active', category: 'software' });
      // IMPORTANT: Reset selectedBusinessIds to current business when modal closes
      setSelectedBusinessIds(selectedBusiness ? [selectedBusiness.id] : []);
    }
  }, [showAddProduct, selectedBusiness]);

  // Reset edit form state when edit modal closes
  useEffect(() => {
    if (!showEditProduct) {
      setEditProductStep(1);
      setEditingProduct(null);
    }
  }, [showEditProduct]);

  const loadProductData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user || !selectedBusiness) {
        const localProducts = loadProductsFromLocalStorage();
        setProducts(localProducts);
        setLoading(false);
        return;
      }

      const localProducts = loadProductsFromLocalStorage();
      if (localProducts.length > 0) {
        setProducts(localProducts);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        const localProducts = loadProductsFromLocalStorage();
        setProducts(localProducts);
        setLoading(false);
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/data?businessId=${selectedBusiness.id}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const serverProducts = data.products || [];
        const localProducts = loadProductsFromLocalStorage();
        
        const mergedProducts = mergeServerAndLocalProducts(serverProducts, localProducts);
        setProducts(mergedProducts);
        
        saveProductsToLocalStorage(mergedProducts);
        
        setError(null);
      } else {
        const localProducts = loadProductsFromLocalStorage();
        setProducts(localProducts);
      }
    } catch (error: any) {
      const localProducts = loadProductsFromLocalStorage();
      setProducts(localProducts);
    } finally {
      setLoading(false);
      setLastRefreshTime(new Date());
    }
  }, [user, selectedBusiness]);

  // Load product data when component mounts or dependencies change
  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  // Clear products when business changes to prevent showing wrong business products
  useEffect(() => {
    if (selectedBusiness) {
      // Reset products immediately when business changes
      setProducts([]);
      setLoading(true);
      // Also clear any error states
      setError(null);
      setSearchTerm('');
      setSelectedCategory('all');
      // Reset business selection to current business
      setSelectedBusinessIds([selectedBusiness.id]);
    }
  }, [selectedBusiness?.id]);

  // Auto-refresh removed to prevent unwanted page refreshes
  // Users can manually refresh using the refresh button if needed

  const handleAddProduct = useCallback(async () => {
    if (!newProduct.name || !newProduct.price || !selectedBusiness) return;

    try {
      // Check if user can create more products
      const limitCheck = await checkLimit('products');
      if (!limitCheck.allowed) {
        setError(`You've reached your monthly limit of ${limitCheck.limit} products. Upgrade your plan to create more.`);
        setShowAddProduct(false); // Close the modal
        return;
      }

      let savedToServer = false;
      
      // Try to save to server first
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        try {
          console.log('🏭 Products: Attempting to save product to server...', {
            selectedBusinessIds,
            businessCount: selectedBusinessIds.length,
            currentBusiness: selectedBusiness.id
          });
          
          // Create the product for all selected businesses
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...newProduct,
                businessIds: selectedBusinessIds // Send selected business IDs
              }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log('🏭 Products: Server response:', result);
            
            if (result && result.success && result.product) {
              // Reload product data to reflect products in all businesses
              await loadProductData();
              
              setShowAddProduct(false);
              savedToServer = true;
              
              // Trigger refresh in MergedProductsView
              setRefreshTrigger(prev => prev + 1);
              
              // Show success message with business count
              if (result.businessIds && result.businessIds.length > 1) {
                toast.success(`Product created successfully in ${result.businessIds.length} businesses!`);
              } else {
                toast.success('Product created successfully!');
              }
              
              setError(null);
              return;
            }
          }
        } catch (fetchError) {
          // Fall through to local save
        }
      }

      const product: Product = {
        id: `local-${Date.now()}`,
        name: newProduct.name,
        description: newProduct.description || '',
        price: Number(newProduct.price),
        category: newProduct.category || 'software',
        status: newProduct.status || 'active',
        inventory: newProduct.inventory || 0,
        sales: 0,
        views: 0,
        conversion_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedProducts = [...products, product];
      setProducts(updatedProducts);
      saveProductsToLocalStorage(updatedProducts);
      setShowAddProduct(false);

    } catch (error) {
      setError('Failed to add product. Please try again.');
    }
  }, [newProduct, selectedBusiness, user, products, checkLimit, selectedBusinessIds]);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowEditProduct(true);
    setEditProductStep(1);
  }, []);

  const handleUpdateProduct = useCallback(async () => {
    if (!editingProduct || !selectedBusiness) return;

    try {
      let savedToServer = false;
      
      // Try to save to server first
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user && !editingProduct.id.startsWith('local-')) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${editingProduct.id}?businessId=${selectedBusiness.id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(editingProduct),
            }
          );

          if (response.ok) {
            const result = await response.json();
            
            if (result && result.success && result.product) {
              // Update products state and local storage
              const updatedProducts = products.map(p => 
                p.id === editingProduct.id ? result.product : p
              );
              setProducts(updatedProducts);
              saveProductsToLocalStorage(updatedProducts);
              
              setShowEditProduct(false);
              setEditingProduct(null);
              savedToServer = true;
              
              // Clear any previous errors since this worked
              setError(null);
              return;
            } else {
              console.warn('⚠️ Server response missing product data:', result);
            }
          } else {
            const errorText = await response.text();
            console.warn('⚠️ Server update failed:', response.status, errorText);
          }
        } catch (fetchError) {
          console.warn('⚠️ Network error during product update:', fetchError.message);
        }
      }

      // Save locally (either as fallback or if local product)
      console.log('💾 Updating product locally...');
      const updatedProduct = {
        ...editingProduct,
        updated_at: new Date().toISOString()
      };

      const updatedProducts = products.map(p => 
        p.id === editingProduct.id ? updatedProduct : p
      );
      setProducts(updatedProducts);
      saveProductsToLocalStorage(updatedProducts);
      setShowEditProduct(false);
      setEditingProduct(null);

    } catch (error) {
      setError('Failed to update product. Please try again.');
    }
  }, [editingProduct, selectedBusiness, user, products, saveProductsToLocalStorage]);

  const initiateDeleteProduct = useCallback(async (product: Product) => {
    // Directly delete without confirmation dialog
    setProductToDelete(product);
    if (!selectedBusiness) return;

    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Try to delete from server first (if not a local-only product)
      if (accessToken && user && !product.id.startsWith('local-')) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/${product.id}?businessId=${selectedBusiness.id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${errorText}`);
          }
        } catch (fetchError) {
          throw new Error(`Network error: ${fetchError.message}`);
        }
      }

      // Remove from local state
      setProducts(prevProducts => {
        const updatedProducts = prevProducts.filter(p => p.id !== product.id);
        saveProductsToLocalStorage(updatedProducts);
        return updatedProducts;
      });
      
      // Clear error state
      setError(null);
      setProductToDelete(null);

    } catch (error) {
      setError(`Failed to delete product: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  }, [selectedBusiness, user, saveProductsToLocalStorage]);

  // Wrap the entire component in the gating system
  const productContent = selectedBusiness && user?.id ? (
    <MergedProductsView 
      businessId={selectedBusiness.id} 
      userId={user.id}
      onAddProduct={() => setShowAddProduct(true)}
      onEditProduct={handleEditProduct}
      onDeleteProduct={initiateDeleteProduct}
      onRefresh={loadProductData} // Pass the data loading function
      refreshTrigger={refreshTrigger} // Add refresh trigger
      products={products} // Pass managed products (including local sync)
    />
  ) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading product data...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: isMobile && isIOSApp ? 'max(env(safe-area-inset-bottom, 0px) + 200px, 200px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
      }}
    >
      {/* Product Operations Header with Refresh Button */}
      <div style={{ position: 'relative' }}>
        <BusinessDropdownHeader
          title="Product Operations"
          description="Manage your products and leverage AI-powered product intelligence"
          icon={<Package className="w-5 h-5 sm:w-6 sm:h-6" />}
          accentColor="purple"
          additionalInfo={
            lastRefreshTime && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            )
          }
        />
      </div>

      {/* Just show Cofounder Product component - tabs moved inside */}
      <CofounderProduct 
        user={user} 
        userData={userData}
        productContent={productContent}
      />

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-6xl h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Plus className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Create New Product</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Let's create something amazing that your customers will love
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <ProductCreationForm
              productStep={productStep}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              setProductStep={setProductStep}
              onSubmit={handleAddProduct}
              onCancel={() => {
                setShowAddProduct(false);
                setNewProduct({ status: 'active', category: 'software' });
                setProductStep(1);
              }}
              businesses={userBusinesses}
              selectedBusinessIds={selectedBusinessIds}
              onBusinessSelectionChange={setSelectedBusinessIds}
              currentBusinessId={selectedBusiness?.id}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
        <DialogContent className="max-w-6xl h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Edit className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Edit Product</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Update your product details and keep it fresh for your customers
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <ProductCreationForm
              productStep={editProductStep}
              newProduct={editingProduct || {}}
              setNewProduct={setEditingProduct}
              setProductStep={setEditProductStep}
              onSubmit={handleUpdateProduct}
              onCancel={() => {
                setShowEditProduct(false);
                setEditingProduct(null);
                setEditProductStep(1);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProductOperations;