import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Package, 
  Eye, 
  Download, 
  Clock, 
  CheckCircle, 
  Loader2,
  FileText,
  Mail,
  Share2,
  Video,
  TrendingUp,
  Search as SearchIcon,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface MarketingPlan {
  id: string;
  businessId: string;
  userId: string;
  productId: string;
  productData: {
    productName?: string;
    productDescription?: string;
    type?: string;
  };
  planType: 'cofounder' | 'manual';
  selectedActions: string[];
  status: 'processing' | 'completed' | 'partial' | 'failed';
  progress: number;
  totalActions: number;
  completedActions: number;
  results: MarketingResult[];
  createdAt: string;
  updatedAt: string;
  error?: string;
}

interface MarketingResult {
  actionId: string;
  actionLabel: string;
  content: string;
  status: string;
  completedAt: string;
}

interface ProductMarketingStudioProps {
  businessId: string;
  userId: string;
}

const ACTION_ICONS: Record<string, any> = {
  'blog': FileText,
  'email': Mail,
  'social': Share2,
  'ad': Megaphone,
  'video': Video,
  'seo': SearchIcon,
  'launch': Sparkles,
  'growth': TrendingUp,
  'competitor': SearchIcon,
  'market': SearchIcon,
};

export function ProductMarketingStudio({ businessId, userId }: ProductMarketingStudioProps) {
  const [plans, setPlans] = useState<MarketingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<MarketingResult | null>(null);
  const [showContentDialog, setShowContentDialog] = useState(false);

  // Load marketing plans
  const loadMarketingPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/product-marketing?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load marketing plans');
      }

      const data = await response.json();
      console.log('📊 ProductMarketingStudio: Received data from API:', data);
      console.log('📊 ProductMarketingStudio: Plans count:', data.plans?.length || 0);
      console.log('📊 ProductMarketingStudio: Plans data:', JSON.stringify(data.plans, null, 2));
      
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error loading marketing plans:', error);
      toast.error('Failed to load marketing plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      console.log('🏢 ProductMarketingStudio: Component mounted/updated with businessId:', businessId);
      console.log('👤 ProductMarketingStudio: userId:', userId);
      loadMarketingPlans();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(loadMarketingPlans, 10000);
      return () => clearInterval(interval);
    } else {
      console.log('⚠️ ProductMarketingStudio: No businessId provided, cannot load plans');
    }
  }, [businessId]);

  // Filter plans by search query
  const filteredPlans = plans.filter(plan => {
    const searchLower = searchQuery.toLowerCase();
    return (
      plan.productData.productName?.toLowerCase().includes(searchLower) ||
      plan.productData.productDescription?.toLowerCase().includes(searchLower) ||
      plan.productData.type?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewContent = (result: MarketingResult) => {
    setSelectedContent(result);
    setShowContentDialog(true);
  };

  const handleDownloadContent = (result: MarketingResult, productName: string) => {
    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName}_${result.actionLabel.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Content downloaded');
  };

  const togglePlanExpanded = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  if (isLoading) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-8)',
        }}
      >
        <Loader2 className="size-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card style={{ borderRadius: 'var(--radius-lg)' }}>
        <CardContent style={{ padding: 'var(--spacing-8)' }}>
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--spacing-4)',
              textAlign: 'center',
            }}
          >
            <Megaphone 
              className="size-12" 
              style={{ color: 'var(--muted-foreground)' }}
            />
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>No Marketing Content Yet</h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                Create a marketing plan for your products to see generated content here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Header */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
        }}
      >
        <div>
          <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Marketing Studio</h2>
          <p style={{ color: 'var(--muted-foreground)' }}>
            View and manage all generated marketing content for your products
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <SearchIcon 
            className="size-4" 
            style={{
              position: 'absolute',
              left: 'var(--spacing-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted-foreground)',
            }}
          />
          <Input
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: 'calc(var(--spacing-3) + 1.5rem)',
            }}
          />
        </div>
      </div>

      {/* Marketing Plans List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {filteredPlans.map((plan) => {
          const isExpanded = expandedPlan === plan.id;
          const Icon = plan.status === 'completed' ? CheckCircle : Loader2;
          
          return (
            <Card 
              key={plan.id}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: `1px solid var(--border)`,
              }}
            >
              <CardHeader
                style={{
                  cursor: 'pointer',
                  padding: 'var(--spacing-4)',
                }}
                onClick={() => togglePlanExpanded(plan.id)}
              >
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-4)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)',
                        marginBottom: 'var(--spacing-2)',
                      }}
                    >
                      <Package className="size-5" style={{ color: 'var(--primary)' }} />
                      <CardTitle>{plan.productData.productName || 'Untitled Product'}</CardTitle>
                      <Badge 
                        variant={plan.status === 'completed' ? 'default' : 'secondary'}
                        style={{
                          background: plan.status === 'completed' ? 'var(--success)' : 'var(--muted)',
                          color: plan.status === 'completed' ? 'var(--success-foreground)' : 'var(--foreground)',
                        }}
                      >
                        <Icon 
                          className={plan.status === 'processing' ? "size-3 animate-spin mr-1" : "size-3 mr-1"}
                        />
                        {plan.status === 'completed' ? 'Completed' : 'Processing'}
                      </Badge>
                    </div>
                    
                    <CardDescription>
                      {plan.productData.productDescription || 'No description'}
                    </CardDescription>
                    
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-4)',
                        marginTop: 'var(--spacing-3)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                        <Calendar className="size-4" />
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                        <Sparkles className="size-4" />
                        {plan.planType === 'cofounder' ? 'Auto-selected' : 'Manual selection'}
                      </div>
                      <div>
                        {plan.completedActions} / {plan.totalActions} pieces
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlanExpanded(plan.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp className="size-5" />
                    ) : (
                      <ChevronDown className="size-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent 
                  style={{
                    paddingTop: 0,
                    paddingBottom: 'var(--spacing-4)',
                    paddingLeft: 'var(--spacing-4)',
                    paddingRight: 'var(--spacing-4)',
                  }}
                >
                  {plan.results.length === 0 ? (
                    <div 
                      style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-4)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                      <p>Generating marketing content...</p>
                    </div>
                  ) : (
                    <div 
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 'var(--spacing-3)',
                      }}
                    >
                      {plan.results.map((result, index) => {
                        const ActionIcon = ACTION_ICONS[result.actionId] || FileText;
                        
                        return (
                          <Card 
                            key={index}
                            style={{
                              borderRadius: 'var(--radius-md)',
                              border: `1px solid var(--border)`,
                              background: 'var(--card)',
                            }}
                          >
                            <CardContent 
                              style={{
                                padding: 'var(--spacing-3)',
                              }}
                            >
                              <div 
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  marginBottom: 'var(--spacing-2)',
                                }}
                              >
                                <div 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-2)',
                                  }}
                                >
                                  <ActionIcon 
                                    className="size-4" 
                                    style={{ color: 'var(--primary)' }}
                                  />
                                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                                    {result.actionLabel}
                                  </span>
                                </div>
                                <CheckCircle 
                                  className="size-4" 
                                  style={{ color: 'var(--success)' }}
                                />
                              </div>
                              
                              <p 
                                style={{
                                  fontSize: 'var(--text-sm)',
                                  color: 'var(--muted-foreground)',
                                  marginBottom: 'var(--spacing-3)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {result.content.substring(0, 100)}...
                              </p>
                              
                              <div 
                                style={{
                                  display: 'flex',
                                  gap: 'var(--spacing-2)',
                                }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewContent(result)}
                                  style={{
                                    flex: 1,
                                    gap: 'var(--spacing-1)',
                                  }}
                                >
                                  <Eye className="size-3" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadContent(result, plan.productData.productName || 'content')}
                                  style={{
                                    flex: 1,
                                    gap: 'var(--spacing-1)',
                                  }}
                                >
                                  <Download className="size-3" />
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Content View Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent 
          style={{
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedContent?.actionLabel}
            </DialogTitle>
            <DialogDescription>
              Generated marketing content
            </DialogDescription>
          </DialogHeader>
          
          <div 
            style={{
              padding: 'var(--spacing-4)',
              background: 'var(--muted)',
              borderRadius: 'var(--radius-md)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 'var(--text-sm)',
            }}
          >
            {selectedContent?.content}
          </div>
          
          <div 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-2)',
              marginTop: 'var(--spacing-4)',
            }}
          >
            <Button
              variant="outline"
              onClick={() => {
                if (selectedContent) {
                  navigator.clipboard.writeText(selectedContent.content);
                  toast.success('Content copied to clipboard');
                }
              }}
            >
              Copy to Clipboard
            </Button>
            <Button
              onClick={() => setShowContentDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}