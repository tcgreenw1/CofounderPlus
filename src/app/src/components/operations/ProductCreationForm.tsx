import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Lightbulb, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { productTemplates, statusOptions } from './constants/productConstants';
import { MultiBusinessSelector } from '../MultiBusinessSelector';

interface ProductCreationFormProps {
  productStep: number;
  newProduct: any;
  setNewProduct: (product: any) => void;
  setProductStep: (step: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  businesses?: any[];
  selectedBusinessIds?: string[];
  onBusinessSelectionChange?: (businessIds: string[]) => void;
  currentBusinessId?: string;
}

export const ProductCreationForm: React.FC<ProductCreationFormProps> = ({
  productStep,
  newProduct,
  setNewProduct,
  setProductStep,
  onSubmit,
  onCancel,
  businesses,
  selectedBusinessIds,
  onBusinessSelectionChange,
  currentBusinessId
}) => {
  // Check if the selected category supports subscriptions
  const isSubscriptionEligible = ['digital', 'software', 'subscription'].includes(newProduct.category);

  // Handle subscription toggle
  const handleSubscriptionToggle = (enabled: boolean) => {
    if (enabled) {
      setNewProduct(prev => ({ 
        ...prev, 
        isSubscription: true,
        subscriptionType: 'monthly' // Default to monthly
      }));
    } else {
      setNewProduct(prev => ({ 
        ...prev, 
        isSubscription: false,
        subscriptionType: undefined 
      }));
    }
  };

  if (productStep === 1) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-3"
      >
        <div className="text-center mb-3">
          <h3 className="text-base sm:text-lg font-semibold mb-1">Choose Your Product Category 🎯</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
            Select the type of product that best describes what you're building
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {productTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setNewProduct(prev => ({ ...prev, category: template.id }));
                  setProductStep(2);
                }}
                className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  newProduct.category === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center mb-2`}>
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h4 className="font-semibold mb-1 text-xs sm:text-sm line-clamp-1">{template.name}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.examples.slice(0, 2).map((example, index) => (
                    <Badge key={index} variant="outline" className="text-xs py-0">
                      {example}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setProductStep(1)}
          className="flex items-center gap-1 flex-shrink-0 h-8 px-2"
        >
          <ArrowLeft className="w-3 h-3" />
          <span className="hidden sm:inline text-xs">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold truncate">Product Details ✨</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
            Tell us about your amazing product
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-3">
          <div>
            <Label htmlFor="product-name" className="text-xs font-medium">Product Name *</Label>
            <Input
              id="product-name"
              value={newProduct.name || ''}
              onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your product name"
              className="mt-1 text-xs h-8"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="product-price" className="text-xs font-medium">
              Price ($) * {newProduct.isSubscription && (
                <Badge variant="outline" className="ml-1 text-xs py-0">
                  {newProduct.subscriptionType === 'annual' ? 'per year' : 'per month'}
                </Badge>
              )}
            </Label>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              value={newProduct.price || ''}
              onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              className="mt-1 text-xs h-8"
            />
          </div>

          <div>
            <Label htmlFor="product-status" className="text-xs font-medium">Status</Label>
            <Select 
              value={newProduct.status || 'active'} 
              onValueChange={(value) => setNewProduct(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="mt-1 text-xs h-8">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show inventory field only for physical products or if not subscription eligible */}
          {(!isSubscriptionEligible || !newProduct.isSubscription) && newProduct.category !== 'software' && (
            <div>
              <Label htmlFor="product-inventory" className="text-xs font-medium">Initial Inventory</Label>
              <Input
                id="product-inventory"
                type="number"
                min="0"
                value={newProduct.inventory || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, inventory: e.target.value }))}
                placeholder="0"
                className="mt-1 text-xs h-8"
              />
            </div>
          )}

          {/* Subscription Options for eligible categories */}
          {isSubscriptionEligible && (
            <div className="space-y-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Subscription Product
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Enable recurring billing
                  </p>
                </div>
                <Switch
                  checked={newProduct.isSubscription || false}
                  onCheckedChange={handleSubscriptionToggle}
                />
              </div>

              {newProduct.isSubscription && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Billing Frequency
                    </Label>
                    <Select 
                      value={newProduct.subscriptionType || 'monthly'} 
                      onValueChange={(value) => setNewProduct(prev => ({ ...prev, subscriptionType: value }))}
                    >
                      <SelectTrigger className="mt-1 text-xs h-8">
                        <SelectValue placeholder="Select billing frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly" className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>Monthly</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="annual" className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>🗓️</span>
                            <span>Annual</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="product-description" className="text-xs font-medium">Description</Label>
            <Textarea
              id="product-description"
              value={newProduct.description || ''}
              onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your product..."
              className="mt-1 h-16 sm:h-20 text-xs resize-none"
              maxLength={500}
            />
          </div>

          {/* Pricing suggestions based on category */}
          {newProduct.category && (
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h5 className="text-xs font-medium mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  Suggested Pricing
                </span>
              </h5>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(productTemplates.find(t => t.id === newProduct.category)?.pricing || {}).map(([tier, price]) => (
                  <Button
                    key={tier}
                    variant="outline"
                    size="sm"
                    onClick={() => setNewProduct(prev => ({ ...prev, price: price }))}
                    className="text-xs px-2 py-1 h-6"
                  >
                    {tier}: ${price}{newProduct.isSubscription && (newProduct.subscriptionType === 'annual' ? '/yr' : '/mo')}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Business Selector */}
      {businesses && businesses.length > 1 && selectedBusinessIds && onBusinessSelectionChange && currentBusinessId && (
        <div className="pt-3 border-t">
          <MultiBusinessSelector
            businesses={businesses}
            selectedBusinessIds={selectedBusinessIds}
            currentBusinessId={currentBusinessId}
            onChange={onBusinessSelectionChange}
            label="Add to Businesses"
            description="Select which businesses should have this product"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto text-xs h-8"
        >
          Cancel
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={!newProduct.name || !newProduct.price}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs h-8"
        >
          <Plus className="w-3 h-3 mr-1" />
          Create Product
        </Button>
      </div>
    </motion.div>
  );
};