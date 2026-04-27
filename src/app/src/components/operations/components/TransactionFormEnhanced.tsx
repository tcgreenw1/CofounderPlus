import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, ArrowLeft, CheckCircle, Package, Percent, Minus, Calendar, Clock, Tag, FileText, X } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { toast } from "sonner@2.0.3";
import { MultiBusinessSelector } from '../../MultiBusinessSelector';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  date: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'scheduled';
  payment_method?: string;
  reference?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  // Future transaction fields
  is_future_transaction?: boolean;
  scheduled_date?: string;
  // Recurring transaction fields
  recurrence_type?: 'one-time' | 'bi-weekly' | 'monthly' | 'annual';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  next_occurrence?: string;
  is_recurring_instance?: boolean;
  parent_transaction_id?: string;
  occurrence_number?: number;
  // Product-related fields
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'development';
  cost_price?: number; // For expense calculations
}

interface TransactionFormEnhancedProps {
  onTransactionAdded: (transaction: Transaction) => void;
  selectedBusiness: any;
  user: any;
}

export const TransactionFormEnhanced: React.FC<TransactionFormEnhancedProps> = ({ onTransactionAdded, selectedBusiness, user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    is_future_transaction: false,
    recurrence_type: 'one-time',
    recurrence_interval: 1,
    tags: [],
    discount_amount: 0,
    discount_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [useProduct, setUseProduct] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load products when component mounts
  useEffect(() => {
    loadProducts();
  }, [selectedBusiness]);

  // Auto-calculate amount when product, quantity, or discount changes
  useEffect(() => {
    if (selectedProduct && formData.quantity && formData.quantity > 0) {
      const basePrice = formData.type === 'income' 
        ? (formData.unit_price || selectedProduct.price)
        : (formData.unit_price || selectedProduct.cost_price || selectedProduct.price);
      
      const quantity = formData.quantity;
      const subtotal = basePrice * quantity;
      
      let finalAmount = subtotal;
      
      // Apply discount
      if (formData.discount_percentage && formData.discount_percentage > 0) {
        finalAmount = subtotal * (1 - formData.discount_percentage / 100);
      } else if (formData.discount_amount && formData.discount_amount > 0) {
        finalAmount = subtotal - formData.discount_amount;
      }
      
      updateFormData({ 
        amount: Math.max(0, finalAmount),
        unit_price: basePrice
      });
    }
  }, [selectedProduct, formData.quantity, formData.unit_price, formData.discount_percentage, formData.discount_amount, formData.type]);

  const loadProducts = async () => {
    if (!selectedBusiness || !user) return;
    
    setLoadingProducts(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/data?businessId=${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      console.log('Failed to load products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Enhanced categories with subcategories
  const categories = useMemo(() => ({
    income: [
      { 
        id: 'sales', 
        name: 'Product Sales', 
        color: 'bg-success/10 text-success',
        subcategories: ['physical-products', 'digital-products', 'subscriptions']
      },
      { 
        id: 'services', 
        name: 'Service Revenue', 
        color: 'bg-chart-2/20 text-chart-2',
        subcategories: ['consulting', 'freelance', 'maintenance', 'support']
      },
      { 
        id: 'investments', 
        name: 'Investment Income', 
        color: 'bg-chart-4/20 text-chart-4',
        subcategories: ['dividends', 'interest', 'capital-gains', 'royalties']
      },
      { 
        id: 'other', 
        name: 'Other Income', 
        color: 'bg-muted text-muted-foreground',
        subcategories: ['grants', 'refunds', 'miscellaneous']
      }
    ],
    expense: [
      { 
        id: 'operations', 
        name: 'Operations', 
        color: 'bg-chart-2/20 text-chart-2',
        subcategories: ['office-supplies', 'utilities', 'rent', 'insurance']
      },
      { 
        id: 'technology', 
        name: 'Technology', 
        color: 'bg-chart-4/20 text-chart-4',
        subcategories: ['software', 'hardware', 'hosting', 'subscriptions']
      },
      { 
        id: 'marketing', 
        name: 'Marketing & Sales', 
        color: 'bg-chart-1/20 text-chart-1',
        subcategories: ['advertising', 'content', 'events', 'materials']
      },
      { 
        id: 'travel', 
        name: 'Travel & Entertainment', 
        color: 'bg-success/10 text-success',
        subcategories: ['flights', 'hotels', 'meals', 'client-entertainment']
      },
      { 
        id: 'professional', 
        name: 'Professional Services', 
        color: 'bg-destructive/10 text-destructive',
        subcategories: ['legal', 'accounting', 'consulting', 'banking']
      },
      { 
        id: 'inventory', 
        name: 'Inventory & Materials', 
        color: 'bg-chart-5/20 text-chart-5',
        subcategories: ['raw-materials', 'finished-goods', 'packaging', 'shipping']
      },
      { 
        id: 'other', 
        name: 'Other Expenses', 
        color: 'bg-muted text-muted-foreground',
        subcategories: ['taxes', 'fees', 'miscellaneous']
      }
    ]
  }), []);

  // Payment methods
  const paymentMethods = [
    'cash', 'check', 'bank-transfer', 'credit-card', 'debit-card', 
    'paypal', 'stripe', 'venmo', 'zelle', 'cryptocurrency', 'other'
  ];

  // Status options
  const statusOptions = [
    { value: 'completed', label: 'Completed', color: 'text-success' },
    { value: 'pending', label: 'Pending', color: 'text-chart-5' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-destructive' },
    { value: 'scheduled', label: 'Scheduled', color: 'text-chart-2' }
  ];

  // Recurrence options
  const recurrenceOptions = [
    { value: 'one-time', label: 'One Time' },
    { value: 'bi-weekly', label: 'Every 2 Weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annually' }
  ];

  const handleSubmit = useCallback(async () => {
    if (!formData.description || !formData.amount || !selectedBusiness) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          }
        );

        if (response.ok) {
          const result = await response.json();
          onTransactionAdded(result.transaction);
          toast.success(
            result.recurring_transactions && result.recurring_transactions.length > 0
              ? `Transaction saved! Created ${result.total_created} transactions (including recurring)`
              : "Transaction saved successfully!"
          );
          return;
        } else {
          const errorText = await response.text();
          toast.error(`Failed to save transaction: ${errorText}`);
        }
      }

      // Fallback to local state
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: formData.type || 'expense',
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category || 'other',
        subcategory: formData.subcategory,
        date: formData.date || new Date().toISOString().split('T')[0],
        due_date: formData.due_date,
        status: formData.status || 'completed',
        payment_method: formData.payment_method,
        reference: formData.reference,
        tags: formData.tags || [],
        notes: formData.notes,
        // Product-related fields
        product_id: formData.product_id,
        product_name: formData.product_name,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        discount_amount: formData.discount_amount,
        discount_percentage: formData.discount_percentage,
        // Recurring fields
        recurrence_type: formData.recurrence_type,
        recurrence_interval: formData.recurrence_interval,
        recurrence_end_date: formData.recurrence_end_date,
        created_at: new Date().toISOString()
      };

      onTransactionAdded(transaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, selectedBusiness, user, onTransactionAdded]);

  const updateFormData = useCallback((updates: Partial<Transaction>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleProductSelect = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      const basePrice = formData.type === 'income' 
        ? product.price 
        : product.cost_price || product.price;
        
      updateFormData({
        product_id: product.id,
        product_name: product.name,
        unit_price: basePrice,
        quantity: 1,
        // Auto-generate description if empty
        description: formData.description || `${formData.type === 'income' ? 'Sale' : 'Purchase'} of ${product.name}`
      });
    }
  }, [products, formData.type, formData.description, updateFormData]);

  const clearProductSelection = useCallback(() => {
    setSelectedProduct(null);
    updateFormData({
      product_id: undefined,
      product_name: undefined,
      unit_price: undefined,
      quantity: undefined,
      discount_amount: 0,
      discount_percentage: 0
    });
  }, [updateFormData]);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateFormData({
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  }, [tagInput, formData.tags, updateFormData]);

  const removeTag = useCallback((tagToRemove: string) => {
    updateFormData({
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  }, [formData.tags, updateFormData]);

  const currentCategories = categories[formData.type || 'expense'];
  const selectedCategory = currentCategories.find(cat => cat.id === formData.category);

  // DESKTOP: Single Long Form
  const renderDesktopForm = () => (
    <div className="space-y-8">
      {/* Section 1: Transaction Type */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">1</div>
          <h3>Transaction Type</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all border-2 ${formData.type === 'income' ? 'border-success bg-success/5' : 'border-border hover:border-border/80'}`}
            onClick={() => updateFormData({ type: 'income' })}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-success/10 rounded-full w-fit mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h4>Income</h4>
              <p className="text-muted-foreground mt-1">Money coming in</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${formData.type === 'expense' ? 'border-destructive bg-destructive/5' : 'border-border hover:border-border/80'}`}
            onClick={() => updateFormData({ type: 'expense' })}
          >
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto mb-3">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <h4>Expense</h4>
              <p className="text-muted-foreground mt-1">Money going out</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Section 2: Product Integration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">2</div>
          <h3>Product Integration</h3>
          <span className="text-muted-foreground ml-auto">(Optional)</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={useProduct}
            onCheckedChange={setUseProduct}
            id="use-product"
          />
          <Label htmlFor="use-product">
            {formData.type === 'income' ? 'Link to product sale' : 'Link to product cost'}
          </Label>
        </div>

        {useProduct && (
          <div className="space-y-4 pl-10">
            <div>
              <Label htmlFor="product">Select Product</Label>
              <Select onValueChange={handleProductSelect} disabled={loadingProducts}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground ml-4">
                          ${formData.type === 'income' ? product.price : (product.cost_price || product.price)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4>{selectedProduct.name}</h4>
                      <p className="text-muted-foreground">{selectedProduct.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearProductSelection}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity || 1}
                        onChange={(e) => updateFormData({ quantity: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_price">Unit Price ($)</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        value={formData.unit_price || 0}
                        onChange={(e) => updateFormData({ unit_price: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Discount (Optional)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount_percentage">Percentage (%)</Label>
                        <Input
                          id="discount_percentage"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.discount_percentage || 0}
                          onChange={(e) => updateFormData({ 
                            discount_percentage: Number(e.target.value),
                            discount_amount: 0
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount_amount">Fixed Amount ($)</Label>
                        <Input
                          id="discount_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount_amount || 0}
                          onChange={(e) => updateFormData({ 
                            discount_amount: Number(e.target.value),
                            discount_percentage: 0
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span>Total Amount:</span>
                      <span className="text-success">
                        ${formData.amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>

      <Separator />

      {/* Section 3: Amount, Dates & Category */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">3</div>
          <h3>Amount & Details</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {!useProduct && (
            <div>
              <Label htmlFor="amount">
                Amount <span style={{ color: 'var(--destructive)' }}>*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => updateFormData({ amount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="pl-9"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="date">Transaction Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={formData.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateFormData({ date: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="due_date"
                type="date"
                value={formData.due_date || formData.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateFormData({ due_date: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <span className={status.color}>{status.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>
            Category <span style={{ color: 'var(--destructive)' }}>*</span>
          </Label>
          <div className="grid grid-cols-4 gap-3 mt-2">
            {currentCategories.map((category) => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all border-2 ${formData.category === category.id ? 'border-primary' : 'border-border hover:border-border/80'}`}
                onClick={() => updateFormData({ category: category.id })}
              >
                <CardContent className="p-4 text-center">
                  <div className={`p-2 rounded-lg w-fit mx-auto mb-2 ${category.color}`}>
                    <div className="w-4 h-4" />
                  </div>
                  <p>{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedCategory?.subcategories && (
            <div className="mt-4">
              <Label>Subcategory (Optional)</Label>
              <Select value={formData.subcategory} onValueChange={(value) => updateFormData({ subcategory: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory.subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* Section 4: Recurrence & Payment Details */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">4</div>
          <h3>Recurrence & Payment</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Frequency</Label>
            <Select value={formData.recurrence_type} onValueChange={(value) => updateFormData({ recurrence_type: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.recurrence_type !== 'one-time' && (
            <div>
              <Label htmlFor="recurrence_end_date">End Date (Optional)</Label>
              <Input
                id="recurrence_end_date"
                type="date"
                value={formData.recurrence_end_date || ''}
                onChange={(e) => updateFormData({ recurrence_end_date: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label>Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => updateFormData({ payment_method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              value={formData.reference || ''}
              onChange={(e) => updateFormData({ reference: e.target.value })}
              placeholder="e.g., Invoice #123"
            />
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mt-2 mb-3">
            {formData.tags?.map((tag, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                {tag} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="flex-1"
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Tag className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Section 5: Description & Notes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">5</div>
          <h3>Description & Notes</h3>
        </div>

        <div>
          <Label htmlFor="description">
            Description <span style={{ color: 'var(--destructive)' }}>*</span>
          </Label>
          <Input
            id="description"
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="e.g., Monthly software subscription"
            required
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            placeholder="Additional notes about this transaction..."
            rows={4}
          />
        </div>

        {/* Transaction Summary */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Type:</span>
              <Badge variant={formData.type === 'income' ? 'default' : 'destructive'}>
                {formData.type}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>${formData.amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span>{currentCategories.find(c => c.id === formData.category)?.name || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span>{statusOptions.find(s => s.value === formData.status)?.label || 'Completed'}</span>
            </div>
            <div className="flex justify-between">
              <span>Frequency:</span>
              <span>{recurrenceOptions.find(r => r.value === formData.recurrence_type)?.label || 'One Time'}</span>
            </div>
            {selectedProduct && (
              <div className="flex justify-between">
                <span>Product:</span>
                <span>{selectedProduct.name} (×{formData.quantity})</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          onClick={handleSubmit}
          disabled={!formData.description || !formData.amount || loading}
          className="w-full bg-success hover:bg-success/90"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Transaction
            </>
          )}
        </Button>
      </section>
    </div>
  );

  // MOBILE: Stepped Form (existing logic)
  const renderMobileForm = () => (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span>Step {step} of 5</span>
          <span className="text-muted-foreground">{Math.round((step / 5) * 100)}% complete</span>
        </div>
        <Progress value={(step / 5) * 100} className="h-2" />
      </div>

      {/* Step 1: Transaction Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <Label className="block mb-4">What type of transaction is this?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all border-2 ${formData.type === 'income' ? 'border-success bg-success/5' : 'border-border'}`}
                onClick={() => updateFormData({ type: 'income' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-success/10 rounded-full w-fit mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                  <h3>Income</h3>
                  <p className="text-muted-foreground mt-2">Money coming in</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all border-2 ${formData.type === 'expense' ? 'border-destructive bg-destructive/5' : 'border-border'}`}
                onClick={() => updateFormData({ type: 'expense' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto mb-4">
                    <TrendingDown className="w-8 h-8 text-destructive" />
                  </div>
                  <h3>Expense</h3>
                  <p className="text-muted-foreground mt-2">Money going out</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => setStep(2)}
              disabled={!formData.type}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Product Integration (Optional) */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label className="block mb-4">Product Integration (Optional)</Label>
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                checked={useProduct}
                onCheckedChange={setUseProduct}
                id="use-product"
              />
              <Label htmlFor="use-product">
                {formData.type === 'income' ? 'Link to product sale' : 'Link to product cost'}
              </Label>
            </div>

            {useProduct && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product">Select Product</Label>
                  <Select onValueChange={handleProductSelect} disabled={loadingProducts}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <span className="text-muted-foreground ml-4">
                              ${formData.type === 'income' ? product.price : (product.cost_price || product.price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4>{selectedProduct.name}</h4>
                          <p className="text-muted-foreground">{selectedProduct.description}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={clearProductSelection}>
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={formData.quantity || 1}
                            onChange={(e) => updateFormData({ quantity: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit_price">Unit Price ($)</Label>
                          <Input
                            id="unit_price"
                            type="number"
                            step="0.01"
                            value={formData.unit_price || 0}
                            onChange={(e) => updateFormData({ unit_price: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Discount Section */}
                      <div className="space-y-3">
                        <Label>Discount (Optional)</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="discount_percentage">Percentage (%)</Label>
                            <Input
                              id="discount_percentage"
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.discount_percentage || 0}
                              onChange={(e) => updateFormData({ 
                                discount_percentage: Number(e.target.value),
                                discount_amount: 0 // Clear amount when percentage is set
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="discount_amount">Fixed Amount ($)</Label>
                            <Input
                              id="discount_amount"
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.discount_amount || 0}
                              onChange={(e) => updateFormData({ 
                                discount_amount: Number(e.target.value),
                                discount_percentage: 0 // Clear percentage when amount is set
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Calculated Total */}
                      <div className="pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span>Total Amount:</span>
                          <span className="text-success">
                            ${formData.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Amount, Dates & Category */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid gap-6">
            {!useProduct && (
              <div>
                <Label htmlFor="amount">
                  Amount <span style={{ color: 'var(--destructive)' }}>*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => updateFormData({ amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="date">Transaction Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateFormData({ date: e.target.value })}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date || formData.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateFormData({ due_date: e.target.value })}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value as any })}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <span className={status.color}>{status.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>
              Category <span style={{ color: 'var(--destructive)' }}>*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {currentCategories.map((category) => (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all border-2 ${formData.category === category.id ? 'border-primary' : 'border-border'}`}
                  onClick={() => updateFormData({ category: category.id })}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`p-2 rounded-lg w-fit mx-auto mb-2 ${category.color}`}>
                      <div className="w-5 h-5" />
                    </div>
                    <p>{category.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Subcategory Selection */}
            {selectedCategory?.subcategories && (
              <div className="mt-4">
                <Label>Subcategory (Optional)</Label>
                <Select value={formData.subcategory} onValueChange={(value) => updateFormData({ subcategory: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory.subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={() => setStep(4)}
              disabled={!formData.amount || !formData.category}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Recurrence & Payment Details */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="grid gap-6">
            <div>
              <Label>Frequency</Label>
              <Select value={formData.recurrence_type} onValueChange={(value) => updateFormData({ recurrence_type: value as any })}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.recurrence_type !== 'one-time' && (
              <div>
                <Label htmlFor="recurrence_end_date">End Date (Optional)</Label>
                <Input
                  id="recurrence_end_date"
                  type="date"
                  value={formData.recurrence_end_date || ''}
                  onChange={(e) => updateFormData({ recurrence_end_date: e.target.value })}
                  className="h-12"
                />
              </div>
            )}

            <div>
              <Label>Payment Method</Label>
              <Select value={formData.payment_method} onValueChange={(value) => updateFormData({ payment_method: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                value={formData.reference || ''}
                onChange={(e) => updateFormData({ reference: e.target.value })}
                placeholder="e.g., Invoice #123, Receipt #456"
                className="h-12"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-3 mt-2">
              {formData.tags?.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Tag className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={() => setStep(5)}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Description & Notes */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="description">
              Description <span style={{ color: 'var(--destructive)' }}>*</span>
            </Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="e.g., Monthly software subscription, Client payment"
              className="h-12"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateFormData({ notes: e.target.value })}
              placeholder="Additional notes about this transaction..."
              rows={4}
            />
          </div>

          {/* Transaction Summary */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Type:</span>
                <Badge variant={formData.type === 'income' ? 'default' : 'destructive'}>
                  {formData.type}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>${formData.amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span>{currentCategories.find(c => c.id === formData.category)?.name || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span>{statusOptions.find(s => s.value === formData.status)?.label || 'Completed'}</span>
              </div>
              <div className="flex justify-between">
                <span>Frequency:</span>
                <span>{recurrenceOptions.find(r => r.value === formData.recurrence_type)?.label || 'One Time'}</span>
              </div>
              {selectedProduct && (
                <div className="flex justify-between">
                  <span>Product:</span>
                  <span>{selectedProduct.name} (×{formData.quantity})</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.description || loading}
              className="bg-success hover:bg-success/90"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Transaction
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return isMobile ? renderMobileForm() : renderDesktopForm();
};