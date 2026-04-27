import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
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

interface EcommerceProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  businessId: string;
  userId: string;
  editingProduct: EcommerceProduct | null;
}

const PRODUCT_TYPES = [
  { value: 'print-on-demand', label: 'Print-on-demand (shirts, hoodies, posters)' },
  { value: 'affiliate', label: 'Affiliate (TikTok Shop, Amazon Influencer storefronts, Gumroad affiliate products)' },
  { value: 'digital-product', label: 'Digital Product (Notion templates, resumes, planners)' },
  { value: 'local-arbitrage', label: 'Local arbitrage (Facebook Marketplace flipping, Thrift → resale, Craigslist → OfferUp)' }
];

const DIFFERENTIATORS = [
  { value: 'new-bundle', label: 'New bundle' },
  { value: 'new-message', label: 'New message' },
  { value: 'new-platform', label: 'New platform' },
  { value: 'new-use-case', label: 'New use case' },
  { value: 'unknown', label: "No, I don't know" }
];

export function EcommerceProductModal({
  isOpen,
  onClose,
  onSaved,
  businessId,
  userId,
  editingProduct
}: EcommerceProductModalProps) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [creditsRequired, setCreditsRequired] = useState(0);

  // Form state
  const [productType, setProductType] = useState<string>('');
  const [knowsProduct, setKnowsProduct] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [whoBuys, setWhoBuys] = useState('');
  const [whereHangOut, setWhereHangOut] = useState('');
  const [whyWin, setWhyWin] = useState('');
  const [differentiator, setDifferentiator] = useState<string>('');
  const [differentiatorDetails, setDifferentiatorDetails] = useState('');

  // Reset form when modal opens/closes or when editing product changes
  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        // Load existing product data
        setProductType(editingProduct.type);
        setKnowsProduct(editingProduct.productName ? 'yes' : 'no');
        setProductName(editingProduct.productName || '');
        setProductDescription(editingProduct.productDescription || '');
        setWhoBuys(editingProduct.whoBuys || '');
        setWhereHangOut(editingProduct.whereHangOut || '');
        setWhyWin(editingProduct.whyWin || '');
        setDifferentiator(editingProduct.differentiator || '');
        setDifferentiatorDetails(editingProduct.differentiatorDetails || '');
      } else {
        // Reset for new product
        setProductType('');
        setKnowsProduct('');
        setProductName('');
        setProductDescription('');
        setWhoBuys('');
        setWhereHangOut('');
        setWhyWin('');
        setDifferentiator('');
        setDifferentiatorDetails('');
      }
      setStep(1);
      setCreditsRequired(0);
    }
  }, [isOpen, editingProduct]);

  // Calculate credits required based on empty fields
  const calculateCreditsRequired = () => {
    const hasEmptyFields = 
      !productName ||
      !productDescription ||
      !whoBuys ||
      !whereHangOut ||
      !whyWin ||
      !differentiator ||
      differentiator === 'unknown' ||
      (differentiator && differentiator !== 'unknown' && !differentiatorDetails);

    return hasEmptyFields ? 10 : 0;
  };

  const handleNext = () => {
    if (step === 1 && !productType) {
      toast.error('Please select a product type');
      return;
    }
    if (step === 2 && knowsProduct === 'yes' && !productName) {
      toast.error('Please enter a product name');
      return;
    }
    
    if (step === 4) {
      // Calculate credits before final step
      const credits = calculateCreditsRequired();
      setCreditsRequired(credits);
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);

      const productData = {
        businessId,
        userId,
        type: productType,
        productName: productName || undefined,
        productDescription: productDescription || undefined,
        whoBuys: whoBuys || undefined,
        whereHangOut: whereHangOut || undefined,
        whyWin: whyWin || undefined,
        differentiator: differentiator || undefined,
        differentiatorDetails: differentiatorDetails || undefined,
      };

      const url = editingProduct
        ? `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ecommerce-products/${editingProduct.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ecommerce-products`;

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      const result = await response.json();
      
      if (result.creditsCharged) {
        toast.success(`Product saved! ${result.creditsCharged} credits used for enhancement`);
      } else {
        toast.success('Product saved successfully!');
      }
      
      onSaved();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label>What type of ecommerce product?</Label>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--muted-foreground)',
                marginTop: 'var(--spacing-1)'
              }}>
                Select the category that best describes your product idea
              </p>
            </div>
            <RadioGroup value={productType} onValueChange={setProductType}>
              {PRODUCT_TYPES.map((type) => (
                <div 
                  key={type.value}
                  style={{
                    display: 'flex',
                    alignItems: 'start',
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    background: productType === type.value ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setProductType(type.value)}
                >
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label 
                    htmlFor={type.value}
                    style={{ 
                      cursor: 'pointer',
                      flex: 1,
                      paddingTop: '2px'
                    }}
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label>Do you know the product or idea you're going to sell?</Label>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--muted-foreground)',
                marginTop: 'var(--spacing-1)'
              }}>
                If you're still exploring, our tool can help you refine your idea
              </p>
            </div>
            <RadioGroup value={knowsProduct} onValueChange={setKnowsProduct}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: knowsProduct === 'yes' ? 'var(--accent)' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setKnowsProduct('yes')}
              >
                <RadioGroupItem value="yes" id="knows-yes" />
                <Label htmlFor="knows-yes" style={{ cursor: 'pointer', flex: 1, paddingTop: '2px' }}>
                  Yes, I know what I want to sell
                </Label>
              </div>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  background: knowsProduct === 'no' ? 'var(--accent)' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setKnowsProduct('no')}
              >
                <RadioGroupItem value="no" id="knows-no" />
                <Label htmlFor="knows-no" style={{ cursor: 'pointer', flex: 1, paddingTop: '2px' }}>
                  No, I need help figuring it out
                </Label>
              </div>
            </RadioGroup>

            {knowsProduct === 'yes' && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--spacing-4)',
                marginTop: 'var(--spacing-2)'
              }}>
                <div>
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Motivational Quote T-Shirts"
                    style={{
                      marginTop: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="product-description">Product Description</Label>
                  <Textarea
                    id="product-description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe your product idea..."
                    rows={4}
                    style={{
                      marginTop: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label>Optional Questions</Label>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--muted-foreground)',
                marginTop: 'var(--spacing-1)'
              }}>
                These questions help refine your product strategy. Leave blank if you'd like our tool to help
              </p>
            </div>

            <div>
              <Label htmlFor="who-buys">Who buys this?</Label>
              <Textarea
                id="who-buys"
                value={whoBuys}
                onChange={(e) => setWhoBuys(e.target.value)}
                placeholder="e.g., Young entrepreneurs, fitness enthusiasts, students..."
                rows={3}
                style={{
                  marginTop: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            </div>

            <div>
              <Label htmlFor="where-hang-out">Where do they already hang out?</Label>
              <Textarea
                id="where-hang-out"
                value={whereHangOut}
                onChange={(e) => setWhereHangOut(e.target.value)}
                placeholder="e.g., Instagram, TikTok, Reddit r/entrepreneur, fitness forums..."
                rows={3}
                style={{
                  marginTop: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            </div>

            <div>
              <Label htmlFor="why-win">Why would this version win?</Label>
              <Textarea
                id="why-win"
                value={whyWin}
                onChange={(e) => setWhyWin(e.target.value)}
                placeholder="e.g., Better designs, faster shipping, unique message, lower price..."
                rows={3}
                style={{
                  marginTop: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label>Do you know how your product or idea is different in the market?</Label>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--muted-foreground)',
                marginTop: 'var(--spacing-1)'
              }}>
                Understanding your unique angle helps position your product for success
              </p>
            </div>

            <RadioGroup value={differentiator} onValueChange={setDifferentiator}>
              {DIFFERENTIATORS.map((diff) => (
                <div 
                  key={diff.value}
                  style={{
                    display: 'flex',
                    alignItems: 'start',
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    background: differentiator === diff.value ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setDifferentiator(diff.value)}
                >
                  <RadioGroupItem value={diff.value} id={diff.value} />
                  <Label 
                    htmlFor={diff.value}
                    style={{ 
                      cursor: 'pointer',
                      flex: 1,
                      paddingTop: '2px'
                    }}
                  >
                    {diff.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {differentiator && differentiator !== 'unknown' && (
              <div style={{ marginTop: 'var(--spacing-2)' }}>
                <Label htmlFor="differentiator-details">
                  How do you see this differentiator in the market?
                </Label>
                <Textarea
                  id="differentiator-details"
                  value={differentiatorDetails}
                  onChange={(e) => setDifferentiatorDetails(e.target.value)}
                  placeholder="Explain your unique angle..."
                  rows={4}
                  style={{
                    marginTop: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label>Review & Save</Label>
              <p style={{ 
                fontSize: '13px', 
                color: 'var(--muted-foreground)',
                marginTop: 'var(--spacing-1)'
              }}>
                Review your product details before saving
              </p>
            </div>

            {creditsRequired > 0 && (
              <Alert style={{ 
                borderRadius: 'var(--radius-lg)',
                background: 'var(--success-soft)',
                border: '1px solid var(--success)'
              }}>
                <Sparkles className="h-4 w-4" style={{ color: 'var(--success)' }} />
                <AlertDescription style={{ color: 'var(--success)' }}>
                  <strong>Enhancement Available</strong>
                  <p style={{ marginTop: 'var(--spacing-2)' }}>
                    Our tool will analyze your input and fill in the remaining details using GPT-4o for <strong>{creditsRequired} credits</strong>. 
                    This includes market research, target audience analysis, and competitive positioning.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {creditsRequired === 0 && (
              <Alert style={{ 
                borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-soft)',
                border: '1px solid var(--border)'
              }}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All fields are complete! No credits will be charged.
                </AlertDescription>
              </Alert>
            )}

            <div style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Product Type</div>
                  <div>{PRODUCT_TYPES.find(t => t.value === productType)?.label}</div>
                </div>
                {productName && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Product Name</div>
                    <div>{productName}</div>
                  </div>
                )}
                {productDescription && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Description</div>
                    <div>{productDescription}</div>
                  </div>
                )}
                {whoBuys && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Target Customer</div>
                    <div>{whoBuys}</div>
                  </div>
                )}
                {differentiator && differentiator !== 'unknown' && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Market Differentiator</div>
                    <div>{DIFFERENTIATORS.find(d => d.value === differentiator)?.label}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        style={{ 
          maxWidth: '600px',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-6)',
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? 'Edit Ecommerce Product' : 'Add Ecommerce Product'}
          </DialogTitle>
          <DialogDescription>
            {editingProduct 
              ? 'Update your ecommerce product details below.' 
              : 'Add a new ecommerce product idea and let our tool enhance it with market research.'}
          </DialogDescription>
          <div style={{ 
            display: 'flex',
            gap: 'var(--spacing-2)',
            marginTop: 'var(--spacing-4)'
          }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: 'var(--radius-full)',
                  background: s <= step ? 'var(--primary)' : 'var(--border)',
                }}
              />
            ))}
          </div>
        </DialogHeader>

        <div style={{ marginTop: 'var(--spacing-6)' }}>
          {renderStep()}
        </div>

        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--spacing-6)',
        }}>
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handleBack}
            disabled={isSaving}
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            {step === 1 ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </>
            )}
          </Button>

          {step < 5 ? (
            <Button
              onClick={handleNext}
              disabled={isSaving}
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : creditsRequired > 0 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Save & Enhance ({creditsRequired} credits)
                </>
              ) : (
                'Save Product'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}