import React, { useState, useEffect } from 'react';
import { DollarSign, X, Calendar, Clock, Package, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Switch } from '../../ui/switch';

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
  is_future_transaction?: boolean;
  scheduled_date?: string;
  recurrence_type?: 'one-time' | 'bi-weekly' | 'monthly' | 'annual';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
}

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (updatedTransaction: Transaction) => void;
  products?: Product[];
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  products = []
}) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [tagInput, setTagInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
      
      // Find selected product if any
      if (transaction.product_id && products.length > 0) {
        const product = products.find(p => p.id === transaction.product_id);
        setSelectedProduct(product || null);
      } else {
        setSelectedProduct(null);
      }
    }
  }, [transaction, products]);

  // Categories and subcategories
  const categories = {
    income: [
      { 
        id: 'sales', 
        name: 'Product Sales', 
        subcategories: ['physical-products', 'digital-products', 'subscriptions']
      },
      { 
        id: 'services', 
        name: 'Service Revenue', 
        subcategories: ['consulting', 'freelance', 'maintenance', 'support']
      },
      { 
        id: 'investments', 
        name: 'Investment Income', 
        subcategories: ['dividends', 'interest', 'capital-gains', 'royalties']
      },
      { 
        id: 'other', 
        name: 'Other Income', 
        subcategories: ['grants', 'refunds', 'miscellaneous']
      }
    ],
    expense: [
      { 
        id: 'operations', 
        name: 'Operations', 
        subcategories: ['office-supplies', 'utilities', 'rent', 'insurance']
      },
      { 
        id: 'technology', 
        name: 'Technology', 
        subcategories: ['software', 'hardware', 'hosting', 'subscriptions']
      },
      { 
        id: 'marketing', 
        name: 'Marketing & Sales', 
        subcategories: ['advertising', 'content', 'events', 'materials']
      },
      { 
        id: 'travel', 
        name: 'Travel & Entertainment', 
        subcategories: ['flights', 'hotels', 'meals', 'client-entertainment']
      },
      { 
        id: 'professional', 
        name: 'Professional Services', 
        subcategories: ['legal', 'accounting', 'consulting', 'banking']
      },
      { 
        id: 'inventory', 
        name: 'Inventory & Materials', 
        subcategories: ['raw-materials', 'finished-goods', 'packaging', 'shipping']
      },
      { 
        id: 'other', 
        name: 'Other Expenses', 
        subcategories: ['taxes', 'fees', 'miscellaneous']
      }
    ]
  };

  const paymentMethods = [
    'cash', 'check', 'bank-transfer', 'credit-card', 'debit-card', 
    'paypal', 'stripe', 'venmo', 'zelle', 'cryptocurrency', 'other'
  ];

  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'scheduled', label: 'Scheduled' }
  ];

  const recurrenceOptions = [
    { value: 'one-time', label: 'One Time' },
    { value: 'bi-weekly', label: 'Every 2 Weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annually' }
  ];

  const updateFormData = (updates: Partial<Transaction>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleProductSelect = (productId: string) => {
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
        quantity: formData.quantity || 1
      });
    }
  };

  const clearProductSelection = () => {
    setSelectedProduct(null);
    updateFormData({
      product_id: undefined,
      product_name: undefined,
      unit_price: undefined,
      quantity: undefined,
      discount_amount: 0,
      discount_percentage: 0
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateFormData({
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleSave = () => {
    if (!formData.description || !formData.amount) return;
    
    const updatedTransaction: Transaction = {
      ...transaction!,
      ...formData,
      updated_at: new Date().toISOString()
    };
    
    onSave(updatedTransaction);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  // Safely get current categories with fallback
  const transactionType = formData.type || transaction?.type || 'expense';
  const currentCategories = categories[transactionType as 'income' | 'expense'] || [];
  const selectedCategory = currentCategories?.find(cat => cat.id === formData.category);

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Edit Transaction
          </DialogTitle>
          <DialogDescription>
            Make changes to the transaction details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Type & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => updateFormData({ type: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => updateFormData({ amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Transaction description"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => updateFormData({ date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => updateFormData({ due_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => updateFormData({ payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
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
              </div>

              {/* Category & Subcategory */}
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => updateFormData({ category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategory?.subcategories && (
                <div>
                  <Label>Subcategory</Label>
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

            {/* Right Column */}
            <div className="space-y-4">
              {/* Product Integration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Product Integration</Label>
                  {selectedProduct && (
                    <Button type="button" variant="outline" size="sm" onClick={clearProductSelection}>
                      Clear Product
                    </Button>
                  )}
                </div>
                
                {!selectedProduct ? (
                  <Select onValueChange={handleProductSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ${formData.type === 'income' ? product.price : (product.cost_price || product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="quantity" className="text-xs">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity || 1}
                          onChange={(e) => updateFormData({ quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit_price" className="text-xs">Unit Price ($)</Label>
                        <Input
                          id="unit_price"
                          type="number"
                          step="0.01"
                          value={formData.unit_price || 0}
                          onChange={(e) => updateFormData({ unit_price: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recurrence */}
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

              {/* Reference */}
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={formData.reference || ''}
                  onChange={(e) => updateFormData({ reference: e.target.value })}
                  placeholder="Invoice #, Receipt #, etc."
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={handleTagKeyDown}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!formData.description || !formData.amount}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};