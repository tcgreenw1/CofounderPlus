import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { useCloudSubscription } from './CloudSubscriptionContext';
import { useBusiness } from './BusinessContext';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { 
  CreditCard, 
  FileText, 
  Cloud, 
  Calculator, 
  Building2, 
  Zap,
  Lock,
  TestTube,
  Crown,
  Star,
  AlertCircle,
  ExternalLink,
  Settings,
  Plug2,
  Sparkles,
  DollarSign,
  BarChart,
  ShoppingBag,
  MessageSquare,
  Users,
  Briefcase,
  PenTool,
  Calendar,
  FileEdit,
  Layout
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'Accounting' | 'Document Management' | 'Cloud Storage' | 'Financial Services' | 'CRM' | 'Marketing' | 'Freelance' | 'Communication' | 'Other';
  isConnected: boolean;
  requiresPlan: 'builder' | 'studio' | null;
  comingSoon: boolean;
  link?: string; // Internal route or external URL
  isExternal?: boolean; // Whether the link is external
  brandColor?: string; // Brand color for active integrations
}

const integrations: Integration[] = [
  // Active integrations first (alphabetically)
  {
    id: 'fiverr',
    name: 'Fiverr',
    description: 'Find freelancers for your business needs',
    icon: Briefcase,
    category: 'Freelance',
    isConnected: false,
    requiresPlan: null,
    comingSoon: false,
    link: 'https://www.fiverr.com',
    isExternal: true,
    brandColor: '#1DBF73'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync your CRM data and manage customer relationships',
    icon: BarChart,
    category: 'CRM',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: false,
    link: '/operations/sales/hubspot',
    isExternal: false,
    brandColor: '#FF7A59'
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Connect bank accounts for real-time financial insights',
    icon: DollarSign,
    category: 'Financial Services',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: false,
    link: '/operations/finance',
    isExternal: false,
    brandColor: '#00D4FF'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect your Salesforce account for powerful CRM integration',
    icon: Cloud,
    category: 'CRM',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: false,
    link: '/operations/sales/salesforce',
    isExternal: false,
    brandColor: '#00A1E0'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect your team communication and notifications',
    icon: MessageSquare,
    category: 'Communication',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: false,
    link: '/operations/hr/slack',
    isExternal: false,
    brandColor: '#4A154B'
  },
  {
    id: 'upwork',
    name: 'Upwork',
    description: 'Connect with top freelance talent',
    icon: PenTool,
    category: 'Freelance',
    isConnected: false,
    requiresPlan: null,
    comingSoon: false,
    link: 'https://www.upwork.com',
    isExternal: true,
    brandColor: '#14A800'
  },
  // Greyed out integrations (alphabetically)
  {
    id: 'amazon-seller',
    name: 'Amazon Seller',
    description: 'Integrate with Amazon Seller Central for e-commerce management',
    icon: ShoppingBag,
    category: 'Other',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#FF9900'
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Schedule meetings and sync your calendar seamlessly',
    icon: Calendar,
    category: 'Other',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#006BFF'
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    description: 'Send and manage digital signatures for contracts and agreements',
    icon: FileText,
    category: 'Document Management',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#FFB800'
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Access and manage your files directly from Cofounder',
    icon: Cloud,
    category: 'Cloud Storage',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#0061FF'
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Integrate with Gmail, Drive, Calendar, and other Google services',
    icon: Layout,
    category: 'Other',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#4285F4'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your professional network and manage business relationships',
    icon: Users,
    category: 'Marketing',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#0A66C2'
  },
  {
    id: 'meta-ads',
    name: 'Meta Ad Manager',
    description: 'Connect Facebook and Instagram ad campaigns',
    icon: BarChart,
    category: 'Marketing',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#0081FB'
  },
  {
    id: 'notion',
    name: 'Notion API',
    description: 'Sync your workspace data and collaborate with your team',
    icon: FileEdit,
    category: 'Other',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#000000'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync your accounting data and automatically import transactions',
    icon: Calculator,
    category: 'Accounting',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#2CA01C'
  },
  {
    id: 'tiktok-ads',
    name: 'TikTok Ad Manager',
    description: 'Manage your TikTok advertising campaigns',
    icon: Zap,
    category: 'Marketing',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#FF0050'
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Connect your Xero account for seamless financial management',
    icon: Building2,
    category: 'Accounting',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#13B5EA'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows and connect thousands of apps',
    icon: Zap,
    category: 'Other',
    isConnected: false,
    requiresPlan: 'builder',
    comingSoon: true,
    brandColor: '#FF4F00'
  }
];

const categories = ['All', 'Accounting', 'Document Management', 'Cloud Storage', 'Financial Services', 'CRM', 'Marketing', 'Freelance', 'Communication', 'Other'];

export function IntegrationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const subscriptionContext = useCloudSubscription();
  const businessContext = useBusiness();
  
  // Get category from URL params or default to 'All'
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const businessId = businessContext?.selectedBusiness?.id;

  // Update selected category when URL params change
  useEffect(() => {
    if (categoryFromUrl && categories.includes(categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Get the current plan - handle both subscription prop and subscriptionData structure
  const currentPlan = subscriptionContext?.subscriptionData?.plan || 'free';
  const normalizedPlan = currentPlan.toLowerCase(); // Normalize to lowercase for comparison
  const isBuilderOrStudio = ['builder', 'studio'].includes(normalizedPlan);

  // Check connection status for all integrations
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        // Get user ID from session
        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        if (!user) {
          setLoading(false);
          return;
        }

        const status: Record<string, boolean> = {};

        // Check Salesforce
        try {
          const salesforceResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/salesforce/status?userId=${user.id}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              }
            }
          );
          if (salesforceResponse.ok) {
            const data = await salesforceResponse.json();
            status['salesforce'] = data.connected === true;
          }
        } catch (error) {
          console.error('Error checking Salesforce status:', error);
        }

        // Check HubSpot
        try {
          const hubspotResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hubspot/status?userId=${user.id}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              }
            }
          );
          if (hubspotResponse.ok) {
            const data = await hubspotResponse.json();
            status['hubspot'] = data.connected === true;
          }
        } catch (error) {
          console.error('Error checking HubSpot status:', error);
        }

        // Check Plaid (bank accounts)
        try {
          const plaidResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/connected-accounts/${businessId}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              }
            }
          );
          if (plaidResponse.ok) {
            const data = await plaidResponse.json();
            status['plaid'] = (data.accounts && data.accounts.length > 0) === true;
          }
        } catch (error) {
          console.error('Error checking Plaid status:', error);
        }

        // Check Slack
        try {
          const slackResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/slack/status`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              }
            }
          );
          if (slackResponse.ok) {
            const data = await slackResponse.json();
            status['slack'] = data.connected === true;
          }
        } catch (error) {
          console.error('Error checking Slack status:', error);
        }

        setConnectionStatus(status);
      } catch (error) {
        console.error('Error checking integration status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConnectionStatus();
  }, [businessId]);

  // Merge connection status with integrations
  const integrationsWithStatus = integrations.map(integration => ({
    ...integration,
    isConnected: connectionStatus[integration.id] || false
  }));

  const filteredIntegrations = integrationsWithStatus.filter(integration => {
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTooltipMessage = (integration: Integration) => {
    if (isBuilderOrStudio) {
      return "We are still testing these connections and will release them soon";
    } else {
      return "Currently in testing";
    }
  };

  const getIntegrationCard = (integration: Integration) => {
    const IconComponent = integration.icon;
    // Disabled if coming soon, or if it has no link
    const isDisabled = integration.comingSoon || (!integration.link && !integration.isExternal);
    const hasLink = integration.link && !integration.comingSoon;

    const handleClick = () => {
      if (!hasLink) return;
      
      if (integration.isExternal) {
        window.open(integration.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(integration.link!);
      }
    };

    return (
      <TooltipProvider key={integration.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`relative transition-all duration-300 ${
                hasLink 
                  ? 'hover:shadow-lg cursor-pointer hover:scale-[1.02] hover:border-primary/30' 
                  : ''
              } ${
                isDisabled 
                  ? 'opacity-50 grayscale cursor-not-allowed' 
                  : ''
              } glass-morphism border-border/50`}
              onClick={hasLink ? handleClick : undefined}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDisabled 
                          ? 'bg-muted' 
                          : ''
                      }`}
                      style={!isDisabled && integration.brandColor ? {
                        backgroundColor: integration.brandColor,
                      } : undefined}
                    >
                      <IconComponent className={`w-5 h-5 ${
                        isDisabled ? 'text-muted-foreground' : 'text-white'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {integration.name}
                        {integration.comingSoon && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            Coming Soon
                          </Badge>
                        )}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {integration.requiresPlan && (
                      <div className="flex items-center">
                        {integration.requiresPlan === 'builder' ? (
                          <Crown className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                        ) : (
                          <Star className="w-4 h-4" style={{ color: 'var(--color-energy)' }} />
                        )}
                      </div>
                    )}
                    {isDisabled && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="text-xs leading-relaxed mb-4">
                  {integration.description}
                </CardDescription>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full`}
                      style={{ 
                        backgroundColor: integration.isConnected ? 'var(--color-success)' : 'var(--color-muted-foreground)'
                      }} />
                    <span className="text-xs text-muted-foreground">
                      {integration.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  
                  {hasLink && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs px-3 py-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                      }}
                    >
                      {integration.isExternal ? 'Visit' : 'Open'}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          {isDisabled && (
            <TooltipContent 
              side="top" 
              className="max-w-xs text-center bg-popover/95 backdrop-blur-sm border border-border/50"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-foreground">
                  {integration.comingSoon ? "Coming soon" : "Currently in testing"}
                </span>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="min-h-screen bg-background starry-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Plug2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Integrations</h1>
              <p className="text-muted-foreground text-sm">
                Connect your favorite tools and streamline your workflow
              </p>
            </div>
          </div>
        </div>

        {/* Beta Notice */}
        <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 backdrop-blur-sm">
          <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Beta Testing Phase</span>
            </div>
            <p className="mt-1 text-sm">
              We're currently testing these integrations to ensure the best experience for our users.
            </p>
          </AlertDescription>
        </Alert>

        {/* AI Model Selection Card */}
        <Card className="glass-morphism border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1">AI Model Preferences</h3>
                  <p className="text-muted-foreground text-sm">
                    Choose which AI model powers your Cofounder interactions. Select from ChatGPT, Gemini, Copilot, and more.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/ai-model-selection')}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
              >
                <Settings className="w-4 h-4" />
                Configure AI
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="glass-morphism border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      // Update URL params
                      if (category === 'All') {
                        searchParams.delete('category');
                      } else {
                        searchParams.set('category', category);
                      }
                      setSearchParams(searchParams);
                    }}
                    className="text-xs"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIntegrations.map(getIntegrationCard)}
        </div>

        {filteredIntegrations.length === 0 && (
          <Card className="glass-morphism border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">No integrations found</h3>
                  <p className="text-muted-foreground text-xs mt-1">
                    Try adjusting your search terms or category filter
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <Card className="glass-morphism border-border/50">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h3 className="font-medium text-sm">Need a custom integration?</h3>
              <p className="text-muted-foreground text-xs">
                Reach out to our team if you need a specific integration for your business workflow.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => navigate('/support')}
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}