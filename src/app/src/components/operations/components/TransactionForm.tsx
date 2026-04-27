import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, ArrowLeft, CheckCircle, Package, Percent, Minus } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { toast } from "sonner@2.0.3";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'scheduled';
  payment_method?: string;
  reference?: string;
  tags?: string[];
  created_at: string;
  // Future transaction fields
  is_future_transaction?: boolean;
  scheduled_date?: string;
  // Recurring transaction fields
  recurrence_type?: 'one-time' | 'monthly' | 'annual';
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
}

interface TransactionFormProps {
  onTransactionAdded: (transaction: Transaction) => void;
  selectedBusiness: any;
  user: any;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onTransactionAdded, selectedBusiness, user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    is_future_transaction: false,
    recurrence_type: 'one-time',
    recurrence_interval: 1
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Load products when component mounts
  useEffect(() => {
    loadProducts();
  }, [selectedBusiness]);

  // Auto-calculate amount when product, quantity, or discount changes
  useEffect(() => {
    if (selectedProduct && formData.quantity) {
      const unitPrice = formData.unit_price || selectedProduct.price;
      const quantity = formData.quantity;
      const subtotal = unitPrice * quantity;
      
      let finalAmount = subtotal;
      
      // Apply discount
      if (formData.discount_percentage) {
        finalAmount = subtotal * (1 - formData.discount_percentage / 100);
      } else if (formData.discount_amount) {
        finalAmount = subtotal - formData.discount_amount;
      }
      
      updateFormData({ 
        amount: Math.max(0, finalAmount),
        unit_price: unitPrice
      });
    }
  }, [selectedProduct, formData.quantity, formData.unit_price, formData.discount_percentage, formData.discount_amount]);

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

  const categories = useMemo(() => ({
    income: [
      { id: 'consulting', name: 'Consulting', color: 'bg-emerald-100 text-emerald-700' },
      { id: 'products', name: 'Product Sales', color: 'bg-blue-100 text-blue-700' },
      { id: 'subscriptions', name: 'Subscriptions', color: 'bg-purple-100 text-purple-700' },
      { id: 'freelance', name: 'Freelance', color: 'bg-orange-100 text-orange-700' },
      { id: 'other', name: 'Other Income', color: 'bg-gray-100 text-gray-700' }
    ],
    expense: [
      { id: 'office', name: 'Office Supplies', color: 'bg-blue-100 text-blue-700' },
      { id: 'software', name: 'Software & Tools', color: 'bg-purple-100 text-purple-700' },
      { id: 'marketing', name: 'Marketing', color: 'bg-orange-100 text-orange-700' },
      { id: 'travel', name: 'Travel', color: 'bg-green-100 text-green-700' },
      { id: 'meals', name: 'Meals', color: 'bg-red-100 text-red-700' },
      { id: 'utilities', name: 'Utilities', color: 'bg-yellow-100 text-yellow-700' },
      { id: 'other', name: 'Other', color: 'bg-gray-100 text-gray-700' }
    ]
  }), []);

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
          toast.success("Transaction saved successfully!");
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
        date: formData.date || new Date().toISOString().split('T')[0],
        status: formData.status || 'completed',
        payment_method: formData.payment_method,
        reference: formData.reference,
        tags: formData.tags || [],
        // Product-related fields
        product_id: formData.product_id,
        product_name: formData.product_name,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        discount_amount: formData.discount_amount,
        discount_percentage: formData.discount_percentage,
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
      updateFormData({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
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
      discount_amount: undefined,
      discount_percentage: undefined
    });
  }, [updateFormData]);

  const currentCategories = categories[formData.type || 'expense'];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of 3</span>
          <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% complete</span>
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {/* Step 1: Transaction Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <Label className="text-lg mb-4 block">What type of transaction is this?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${formData.type === 'income' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : 'hover:shadow-md'}`}
                onClick={() => updateFormData({ type: 'income' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Income</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Money coming in</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${formData.type === 'expense' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : 'hover:shadow-md'}`}
                onClick={() => updateFormData({ type: 'expense' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit mx-auto mb-4">
                    <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Expense</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Money going out</p>
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

      {/* Step 2: Amount and Category */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="amount" className="text-lg mb-3 block">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => updateFormData({ amount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="pl-10 text-lg h-12"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="date" className="text-lg mb-3 block">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateFormData({ date: e.target.value })}
                className="text-lg h-12"
              />
            </div>
          </div>

          <div>
            <Label className="text-lg mb-3 block">Category</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentCategories.map((category) => (
                <Card 
                  key={category.id}
                  className={`cursor-pointer transition-all ${formData.category === category.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                  onClick={() => updateFormData({ category: category.id })}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`p-2 rounded-lg w-fit mx-auto mb-2 ${category.color}`}>
                      <div className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium">{category.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={() => setStep(3)}
              disabled={!formData.amount || !formData.category}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Description */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="description" className="text-lg mb-3 block">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder="e.g., Monthly software subscription, Client payment"
              className="text-lg h-12"
            />
          </div>

          <div>
            <Label htmlFor="reference" className="text-lg mb-3 block">Reference (Optional)</Label>
            <Input
              id="reference"
              value={formData.reference || ''}
              onChange={(e) => updateFormData({ reference: e.target.value })}
              placeholder="e.g., Invoice #123, Receipt #456"
              className="h-12"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.description || loading}
              className="bg-gradient-to-r from-green-600 to-blue-600"
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
};