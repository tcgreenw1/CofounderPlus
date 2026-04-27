import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Sparkles, 
  User, 
  Loader2, 
  Package,
  Megaphone,
  Mail,
  MessageSquare,
  Film,
  Search,
  PenTool,
  Rocket,
  TrendingUp,
  BarChart3,
  Brain,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useCredits } from '../../hooks/useCredits';

interface EcommerceProduct {
  id: string;
  businessId: string;
  type: 'print-on-demand' | 'affiliate' | 'digital-product' | 'local-arbitrage';
  productName?: string;
  productDescription?: string;
  whoBuys?: string;
  whereHangOut?: string;
  whyWin?: string;
  differentiator?: string;
  differentiatorDetails?: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductMarketingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: EcommerceProduct | null;
  businessId: string;
  userId: string;
}

// Marketing quick actions that can be selected
const MARKETING_ACTIONS = [
  { 
    id: 'blog', 
    label: 'Blog Post', 
    icon: PenTool, 
    color: '#6c5ce7',
    description: 'Generate an engaging blog article',
    credits: 10
  },
  { 
    id: 'email', 
    label: 'Email Campaign', 
    icon: Mail, 
    color: '#0984e3',
    description: 'Create a promotional email',
    credits: 10
  },
  { 
    id: 'social', 
    label: 'Social Media', 
    icon: MessageSquare, 
    color: '#00b894',
    description: 'Craft social content',
    credits: 10
  },
  { 
    id: 'ad', 
    label: 'Ad Copy', 
    icon: Megaphone, 
    color: '#fd79a8',
    description: 'Write persuasive ad copy',
    credits: 10
  },
  { 
    id: 'video', 
    label: 'Video Script', 
    icon: Film, 
    color: '#e17055',
    description: 'Generate video content',
    credits: 10
  },
  { 
    id: 'seo', 
    label: 'SEO Strategy', 
    icon: Search, 
    color: '#fdcb6e',
    description: 'Build SEO foundation',
    credits: 10
  },
  { 
    id: 'launch', 
    label: 'Launch Campaign', 
    icon: Rocket, 
    color: '#667eea',
    description: 'Strategy for launching your product',
    credits: 10
  },
  { 
    id: 'growth', 
    label: 'Growth Campaign', 
    icon: TrendingUp, 
    color: '#0984e3',
    description: 'Scale and increase market share',
    credits: 10
  },
  { 
    id: 'competitor', 
    label: 'Competitor Analysis', 
    icon: BarChart3, 
    color: '#6c5ce7',
    description: 'Analyze competitive landscape',
    credits: 10
  },
  { 
    id: 'market', 
    label: 'Market Research', 
    icon: Brain, 
    color: '#fd79a8',
    description: 'Deep market insights',
    credits: 10
  },
];

export function ProductMarketingPlanModal({ 
  isOpen, 
  onClose, 
  product, 
  businessId,
  userId
}: ProductMarketingPlanModalProps) {
  const [planType, setPlanType] = useState<'cofounder' | 'manual'>('cofounder');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkCredits, deductCredits } = useCredits();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPlanType('cofounder');
      setSelectedActions([]);
    }
  }, [isOpen]);

  const handleActionToggle = (actionId: string) => {
    setSelectedActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const calculateTotalCredits = () => {
    if (planType === 'cofounder') {
      // Cofounder will decide, so we estimate max possible
      return MARKETING_ACTIONS.length * 10; // Max if all actions selected
    }
    return selectedActions.length * 10;
  };

  const handleSubmit = async () => {
    if (!product) return;

    // Validation
    if (planType === 'manual' && selectedActions.length === 0) {
      toast.error('Please select at least one marketing action');
      return;
    }

    const totalCredits = calculateTotalCredits();
    
    // Check credits
    const hasCredits = await checkCredits(totalCredits);
    if (!hasCredits) {
      toast.error(`Insufficient credits. You need ${totalCredits} credits.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Deduct credits BEFORE calling the backend
      console.log(`💰 Deducting ${totalCredits} credits for product marketing plan...`);
      const deductSuccess = await deductCredits(totalCredits, 'Product Marketing Plan');
      
      if (!deductSuccess) {
        throw new Error('Failed to deduct credits');
      }
      
      // Create product marketing plan
      console.log('🚀 ProductMarketingPlanModal: Creating plan with:', {
        businessId,
        userId,
        productId: product.id,
        planType,
        selectedActionsCount: planType === 'manual' ? selectedActions.length : 'auto',
        creditsDeducted: totalCredits
      });
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/product-marketing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessId,
            userId,
            productId: product.id,
            productData: product,
            planType,
            selectedActions: planType === 'manual' ? selectedActions : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create marketing plan');
      }

      const result = await response.json();
      console.log('✅ ProductMarketingPlanModal: Plan created successfully:', result);
      console.log('📦 ProductMarketingPlanModal: Plan saved with businessId:', businessId);
      console.log('🔑 ProductMarketingPlanModal: Product businessId:', product.businessId);
      console.log('🔍 ProductMarketingPlanModal: To view, go to Marketing page → Content Studio tab with businessId:', businessId);
      console.log(`💰 Total credits deducted: ${totalCredits}`);

      toast.success('Marketing plan started!', {
        description: `Cofounder is generating your marketing content. Check the Content Studio tab in the Marketing page to see your generated content.`,
      });

      onClose();
    } catch (error) {
      console.error('Error creating marketing plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create marketing plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        style={{ 
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <div style={{
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Megaphone className="w-5 h-5" style={{ color: 'white' }} />
            </div>
            Create Marketing Plan
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive marketing strategy for your product
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
          {/* Product Info */}
          <Card style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <CardHeader style={{ padding: 'var(--spacing-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <Package className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                <CardTitle style={{ fontSize: '14px' }}>Product</CardTitle>
              </div>
            </CardHeader>
            <CardContent style={{ padding: '0 var(--spacing-3) var(--spacing-3)' }}>
              <div style={{ fontSize: '16px', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                {product.productName || 'Untitled Product'}
              </div>
              {product.productDescription && (
                <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                  {product.productDescription}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan Type Selection */}
          <div>
            <Label style={{ marginBottom: 'var(--spacing-3)', display: 'block' }}>
              How would you like to create your marketing plan?
            </Label>
            <RadioGroup value={planType} onValueChange={(value) => setPlanType(value as 'cofounder' | 'manual')}>
              <Card 
                style={{ 
                  borderRadius: 'var(--radius-lg)', 
                  border: planType === 'cofounder' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => setPlanType('cofounder')}
              >
                <CardContent style={{ padding: 'var(--spacing-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-3)' }}>
                    <RadioGroupItem value="cofounder" id="cofounder" />
                    <div style={{ flex: 1 }}>
                      <Label 
                        htmlFor="cofounder" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 'var(--spacing-2)',
                          cursor: 'pointer',
                          marginBottom: 'var(--spacing-2)'
                        }}
                      >
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Let Cofounder Build It</span>
                        <Badge 
                          style={{ 
                            background: 'var(--primary-soft)', 
                            color: 'var(--primary)',
                            fontSize: '11px',
                            padding: 'var(--spacing-1) var(--spacing-2)',
                          }}
                        >
                          Recommended
                        </Badge>
                      </Label>
                      <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-2)' }}>
                        Cofounder will analyze your product and automatically select and run the most effective marketing actions for your specific product type and target audience.
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--spacing-1)',
                        fontSize: '12px',
                        color: 'var(--warning)',
                        marginTop: 'var(--spacing-2)',
                      }}>
                        <AlertCircle className="w-3 h-3" />
                        Estimated: Up to {MARKETING_ACTIONS.length * 10} credits (only charged for actions used)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                style={{ 
                  borderRadius: 'var(--radius-lg)', 
                  border: planType === 'manual' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: 'var(--spacing-3)',
                }}
                onClick={() => setPlanType('manual')}
              >
                <CardContent style={{ padding: 'var(--spacing-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-3)' }}>
                    <RadioGroupItem value="manual" id="manual" />
                    <div style={{ flex: 1 }}>
                      <Label 
                        htmlFor="manual" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 'var(--spacing-2)',
                          cursor: 'pointer',
                          marginBottom: 'var(--spacing-2)'
                        }}
                      >
                        <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>I'll Choose The Actions</span>
                      </Label>
                      <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                        Select specific marketing actions you want Cofounder to generate for your product.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Manual Action Selection */}
          {planType === 'manual' && (
            <div>
              <Label style={{ marginBottom: 'var(--spacing-3)', display: 'block' }}>
                Select Marketing Actions ({selectedActions.length} selected)
              </Label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 'var(--spacing-2)',
              }}>
                {MARKETING_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedActions.includes(action.id);
                  return (
                    <Card
                      key={action.id}
                      style={{
                        borderRadius: 'var(--radius-lg)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isSelected ? 'var(--primary-soft)' : 'var(--card)',
                      }}
                      onClick={() => handleActionToggle(action.id)}
                    >
                      <CardContent style={{ padding: 'var(--spacing-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-2)' }}>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleActionToggle(action.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                              <Icon 
                                className="w-4 h-4" 
                                style={{ color: action.color }} 
                              />
                              <span style={{ fontSize: '14px', fontWeight: 'var(--font-weight-semibold)' }}>
                                {action.label}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                              {action.description}
                            </p>
                            <div style={{ 
                              fontSize: '11px', 
                              color: 'var(--primary)',
                              marginTop: 'var(--spacing-1)',
                            }}>
                              {action.credits} credits
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Credit Summary */}
          <Card style={{ 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border)',
            background: 'var(--accent)',
          }}>
            <CardContent style={{ padding: 'var(--spacing-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-1)' }}>
                    Total Credits
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary)' }}>
                    {planType === 'cofounder' 
                      ? `Up to ${calculateTotalCredits()}` 
                      : calculateTotalCredits()
                    }
                  </div>
                </div>
                {planType === 'cofounder' && (
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', textAlign: 'right', maxWidth: '200px' }}>
                    Only charged for actions actually generated
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-2)', 
          justifyContent: 'flex-end',
          marginTop: 'var(--spacing-4)',
          paddingTop: 'var(--spacing-4)',
          borderTop: '1px solid var(--border)',
        }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (planType === 'manual' && selectedActions.length === 0)}
            style={{
              background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Plan...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Start Marketing Plan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}