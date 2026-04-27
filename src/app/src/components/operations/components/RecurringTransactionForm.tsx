import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, ArrowLeft, CheckCircle, Package, Percent, Calendar, RefreshCw, Repeat } from 'lucide-react';
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
import { Switch } from '../../ui/switch';
import { toast } from "sonner@2.0.3";
import { TRANSACTION_CATEGORIES, DEFAULT_EXPENSE_CATEGORY, DEFAULT_INCOME_CATEGORY } from '../constants/financeConstants';

interface RecurringTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  frequency: 'one-time' | 'monthly' | 'annual';
  start_date: string;
  end_date?: string; // For recurring transactions
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  reference?: string;
  tags?: string[];
  created_at: string;
  // Product-related fields
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
  // Recurring specific fields
  is_recurring: boolean;
  next_occurrence?: string;
  occurrences_remaining?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'development';
}

interface RecurringTransactionFormProps {
  onTransactionAdded: (transaction: RecurringTransaction) => void;
  selectedBusiness: any;
  user: any;
}

export const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({ 
  onTransactionAdded, 
  selectedBusiness, 
  user 
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<RecurringTransaction>>({
    type: 'expense',
    status: 'completed',
    start_date: new Date().toISOString().split('T')[0],
    frequency: 'one-time',
    is_recurring: false
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

  // Calculate next occurrence and end date when frequency changes
  useEffect(() => {
    if (formData.frequency && formData.frequency !== 'one-time' && formData.start_date) {
      const startDate = new Date(formData.start_date);
      let nextOccurrence = new Date(startDate);
      let endDate = new Date(startDate);
      
      if (formData.frequency === 'monthly') {
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        endDate.setFullYear(endDate.getFullYear() + 1); // Default to 1 year for monthly
      } else if (formData.frequency === 'annual') {
        nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
        endDate.setFullYear(endDate.getFullYear() + 5); // Default to 5 years for annual
      }
      
      updateFormData({
        next_occurrence: nextOccurrence.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_recurring: true
      });
    } else {
      updateFormData({
        next_occurrence: undefined,
        end_date: undefined,
        is_recurring: false
      });
    }
  }, [formData.frequency, formData.start_date]);

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

  const categories = useMemo(() => TRANSACTION_CATEGORIES, []);

  // Calculate projections for recurring transactions
  const calculateProjections = useCallback(() => {
    if (!formData.amount || formData.frequency === 'one-time') return null;
    
    const amount = Number(formData.amount);
    const monthly = formData.frequency === 'monthly' ? amount : (formData.frequency === 'annual' ? amount / 12 : 0);
    const annual = formData.frequency === 'annual' ? amount : (formData.frequency === 'monthly' ? amount * 12 : 0);
    
    return {
      monthly,
      annual,
      type: formData.type
    };
  }, [formData.amount, formData.frequency, formData.type]);

  const projections = calculateProjections();

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
            formData.frequency === 'one-time' 
              ? "Transaction saved successfully!" 
              : `Recurring ${formData.frequency} ${formData.type} created successfully!`
          );
          
          // Reset form
          setFormData({
            type: 'expense',
            status: 'completed',
            start_date: new Date().toISOString().split('T')[0],
            frequency: 'one-time',
            is_recurring: false
          });
          setSelectedProduct(null);
          setStep(1);
          return;
        } else {
          const errorText = await response.text();
          toast.error(`Failed to save transaction: ${errorText}`);
        }
      }

      // Fallback to local state
      const transaction: RecurringTransaction = {
        id: Date.now().toString(),
        type: formData.type || 'expense',
        amount: Number(formData.amount),
        description: formData.description,
        category: formData.category || DEFAULT_EXPENSE_CATEGORY,
        frequency: formData.frequency || 'one-time',
        start_date: formData.start_date || new Date().toISOString().split('T')[0],
        end_date: formData.end_date,
        status: formData.status || 'completed',
        payment_method: formData.payment_method,
        reference: formData.reference,
        tags: formData.tags || [],
        is_recurring: formData.is_recurring || false,
        next_occurrence: formData.next_occurrence,
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
      
      // Reset form
      setFormData({
        type: 'expense',
        status: 'completed',
        start_date: new Date().toISOString().split('T')[0],
        frequency: 'one-time',
        is_recurring: false
      });
      setSelectedProduct(null);
      setStep(1);
      
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, selectedBusiness, user, onTransactionAdded]);

  const updateFormData = useCallback((updates: Partial<RecurringTransaction>) => {
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
        discount_amount: undefined,
        discount_percentage: undefined,
        // Auto-generate description if empty
        description: formData.description || `${formData.type === 'income' ? 'Sale' : 'Purchase'} of ${product.name}`,
        // Set category to Product Sales if income
        category: formData.type === 'income' ? 'Product Sales' : formData.category
      });
    }
  }, [products, formData.type, formData.description, formData.category, updateFormData]);

  const clearProductSelection = useCallback(() => {
    setSelectedProduct(null);
    updateFormData({
      product_id: undefined,
      product_name: undefined,
      unit_price: undefined,
      quantity: undefined,
      discount_amount: undefined,
      discount_percentage: undefined,
      amount: undefined
    });
  }, [updateFormData]);

  const currentCategories = categories[formData.type || 'expense'];

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of 4</span>
          <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}% complete</span>
        </div>
        <Progress value={(step / 4) * 100} className="h-2" />
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

      {/* Step 2: Frequency */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label className="text-lg mb-4 block">How often does this {formData.type} occur?</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${formData.frequency === 'one-time' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:shadow-md'}`}
                onClick={() => updateFormData({ frequency: 'one-time' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">One Time</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Single transaction</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${formData.frequency === 'monthly' ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'hover:shadow-md'}`}
                onClick={() => updateFormData({ frequency: 'monthly' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-fit mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Monthly</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Repeats every month</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${formData.frequency === 'annual' ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'hover:shadow-md'}`}
                onClick={() => updateFormData({ frequency: 'annual' })}
              >
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full w-fit mx-auto mb-4">
                    <Repeat className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Annual</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Repeats every year</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Date fields for recurring transactions */}
          {formData.frequency !== 'one-time' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="start_date" className="text-lg mb-3 block">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateFormData({ start_date: e.target.value })}
                  className="text-lg h-12"
                />
              </div>
              <div>
                <Label htmlFor="end_date" className="text-lg mb-3 block">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => updateFormData({ end_date: e.target.value })}
                  className="text-lg h-12"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty for indefinite recurring
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button 
              onClick={() => setStep(3)}
              disabled={!formData.frequency}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Amount, Product, and Category */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Product Selection Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Selection (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedProduct ? (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Attach to a product from your inventory
                  </Label>
                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      <span className="ml-2 text-sm text-gray-600">Loading products...</span>
                    </div>
                  ) : products.length > 0 ? (
                    <Select onValueChange={handleProductSelect}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.filter(p => p.status === 'active').map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{product.name}</span>
                              <span className="text-green-600 ml-2">${product.price}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No active products found. You can still create a transaction without attaching a product.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Product Display */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{selectedProduct.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Base price: ${selectedProduct.price}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearProductSelection}
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Quantity and Pricing Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="quantity" className="text-sm font-medium mb-2 block">
                          Quantity
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity || 1}
                          onChange={(e) => updateFormData({ quantity: Number(e.target.value) })}
                          className="h-10"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="unitPrice" className="text-sm font-medium mb-2 block">
                          Unit Price
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="unitPrice"
                            type="number"
                            step="0.01"
                            value={formData.unit_price || selectedProduct.price}
                            onChange={(e) => updateFormData({ unit_price: Number(e.target.value) })}
                            className="pl-9 h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Discount
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="%"
                              value={formData.discount_percentage || ''}
                              onChange={(e) => updateFormData({ 
                                discount_percentage: Number(e.target.value),
                                discount_amount: undefined
                              })}
                              className="pl-9 h-10"
                            />
                          </div>
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Amount"
                              value={formData.discount_amount || ''}
                              onChange={(e) => updateFormData({ 
                                discount_amount: Number(e.target.value),
                                discount_percentage: undefined
                              })}
                              className="pl-9 h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Summary */}
                    {formData.quantity && formData.unit_price && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal ({formData.quantity} × ${formData.unit_price}):</span>
                            <span>${(formData.quantity * formData.unit_price).toFixed(2)}</span>
                          </div>
                          {(formData.discount_percentage || formData.discount_amount) && (
                            <div className="flex justify-between text-red-600">
                              <span>
                                Discount {formData.discount_percentage ? `(${formData.discount_percentage}%)` : ''}:
                              </span>
                              <span>
                                -${formData.discount_percentage 
                                  ? ((formData.quantity * formData.unit_price) * formData.discount_percentage / 100).toFixed(2)
                                  : (formData.discount_amount || 0).toFixed(2)
                                }
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total:</span>
                            <span>${(formData.amount || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Amount Entry (when no product selected) */}
          {!selectedProduct && (
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
                <Label htmlFor="start_date" className="text-lg mb-3 block">
                  {formData.frequency === 'one-time' ? 'Date' : 'Start Date'}
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateFormData({ start_date: e.target.value })}
                  className="text-lg h-12"
                />
              </div>
            </div>
          )}

          {/* Date field for product-based transactions */}
          {selectedProduct && (
            <div>
              <Label htmlFor="start_date" className="text-lg mb-3 block">
                {formData.frequency === 'one-time' ? 'Date' : 'Start Date'}
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => updateFormData({ start_date: e.target.value })}
                className="text-lg h-12"
              />
            </div>
          )}

          {/* Category Selection */}
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

          {/* Projections Preview */}
          {projections && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <TrendingUp className="w-5 h-5" />
                  Projection Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${projections.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      ${projections.monthly.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Monthly {projections.type}</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${projections.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      ${projections.annual.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Annual {projections.type}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

      {/* Step 4: Description and Details */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="description" className="text-lg mb-3 block">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              placeholder={`e.g., ${formData.frequency === 'monthly' ? 'Monthly' : formData.frequency === 'annual' ? 'Annual' : ''} ${formData.type === 'income' ? 'client payment' : 'software subscription'}`}
              className="text-lg h-12"
            />
            {selectedProduct && (
              <p className="text-sm text-gray-500 mt-2">
                Product attached: {selectedProduct.name} 
                {formData.quantity && ` (Qty: ${formData.quantity})`}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reference" className="text-lg mb-3 block">Reference (Optional)</Label>
            <Input
              id="reference"
              value={formData.reference || ''}
              onChange={(e) => updateFormData({ reference: e.target.value })}
              placeholder="e.g., Invoice #123, Contract #456"
              className="h-12"
            />
          </div>

          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Type:</span>
                <Badge variant={formData.type === 'income' ? 'default' : 'destructive'}>
                  {formData.type?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Frequency:</span>
                <Badge variant="secondary">{formData.frequency?.replace('-', ' ').toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-semibold">${(formData.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span>{formData.category}</span>
              </div>
              {formData.frequency !== 'one-time' && projections && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Monthly Impact:</span>
                    <span className={`font-semibold ${projections.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {projections.type === 'income' ? '+' : '-'}${projections.monthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Impact:</span>
                    <span className={`font-semibold ${projections.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {projections.type === 'income' ? '+' : '-'}${projections.annual.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
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
                  {formData.frequency === 'one-time' ? 'Save Transaction' : `Create ${formData.frequency} ${formData.type}`}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};