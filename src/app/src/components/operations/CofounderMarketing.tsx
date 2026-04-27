import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { SocialContentRenderer, AdContentRenderer, EmailContentRenderer, MarketAnalysisRenderer, VideoContentRenderer } from './MarketingContentRenderers';
import { 
  Bot, 
  Sparkles, 
  Mail, 
  Zap,
  Settings,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Brain,
  Megaphone,
  PenTool,
  Search,
  Film,
  Target,
  Loader2,
  Copy,
  Check,
  Rocket,
  TrendingUp,
  Lightbulb,
  FileText,
  Database,
  Users,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Activity,
  Plug2,
  Mic,
  Video,
  Camera,
  Instagram,
  Facebook,
  Send,
  Flame,
  Snowflake,
  ThermometerSun
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useCredits } from '../../hooks/useCredits';
import { MarketingChat } from './MarketingChat';
import { useIsMobile } from '../ui/use-mobile';
import { useNotifications } from '../../contexts/NotificationContext';
import { useBusiness } from '../BusinessContext';
import type { Campaign, Lead } from './MarketingOperations';
import { AutomationReportsWidget } from '../AutomationReportsWidget';
import { ProductMarketingStudio } from './ProductMarketingStudio';

interface CofounderMarketingProps {
  user?: any;
  userData?: any;
  campaigns?: Campaign[];
  setCampaigns?: React.Dispatch<React.SetStateAction<Campaign[]>>;
  leads?: Lead[];
  setLeads?: React.Dispatch<React.SetStateAction<Lead[]>>;
  filteredCampaigns?: Campaign[];
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  selectedCampaignType?: string;
  setSelectedCampaignType?: (type: string) => void;
  showAddCampaign?: boolean;
  setShowAddCampaign?: (show: boolean) => void;
  showAddLead?: boolean;
  setShowAddLead?: (show: boolean) => void;
  newCampaign?: any;
  setNewCampaign?: React.Dispatch<React.SetStateAction<any>>;
  newLead?: any;
  setNewLead?: React.Dispatch<React.SetStateAction<any>>;
  isCreatingCampaign?: boolean;
  isCreatingLead?: boolean;
  editingCampaign?: Campaign | null;
  setEditingCampaign?: React.Dispatch<React.SetStateAction<Campaign | null>>;
  showEditCampaign?: boolean;
  setShowEditCampaign?: (show: boolean) => void;
  isUpdatingCampaign?: boolean;
  handleAddCampaign?: () => void;
  handleAddLead?: () => void;
  handleEditCampaign?: (campaign: Campaign) => void;
  handleUpdateCampaign?: () => void;
  handleDeleteCampaign?: (campaign: Campaign) => void;
  handleDeleteLead?: (lead: Lead) => void;
  handleEditLead?: (lead: Lead) => void;
  handleUpdateLead?: () => void;
  getStatusBadgeColor?: (status: string) => string;
  confirmDeleteCampaign?: () => void;
  confirmDeleteLead?: () => void;
  campaignToDelete?: Campaign | null;
  setCampaignToDelete?: React.Dispatch<React.SetStateAction<Campaign | null>>;
  showDeleteConfirm?: boolean;
  setShowDeleteConfirm?: (show: boolean) => void;
  isDeletingCampaign?: boolean;
  leadToDelete?: Lead | null;
  setLeadToDelete?: React.Dispatch<React.SetStateAction<Lead | null>>;
  showDeleteLeadConfirm?: boolean;
  setShowDeleteLeadConfirm?: (show: boolean) => void;
  isDeletingLead?: boolean;
  showEditLead?: boolean;
  isUpdatingLead?: boolean;
}

interface ContentResult {
  id: string;
  contentType: string;
  topic: string;
  timestamp: string;
  [key: string]: any;
}

interface CampaignStrategy {
  id: string;
  campaignName: string;
  executiveSummary: string;
  timestamp: string;
  [key: string]: any;
}

interface CompetitorAnalysis {
  id: string;
  timestamp: string;
  [key: string]: any;
}

// Quick action configurations
const contentQuickActions = [
  { 
    id: 'blog', 
    label: 'Blog Post', 
    icon: PenTool, 
    color: '#6c5ce7',
    topic: 'Latest trends and best practices',
    description: 'Generate an engaging blog article'
  },
  { 
    id: 'email', 
    label: 'Email Campaign', 
    icon: Mail, 
    color: '#0984e3',
    topic: 'New product announcement and value proposition',
    description: 'Create a promotional email'
  },
  { 
    id: 'social', 
    label: 'Social Media', 
    icon: MessageSquare, 
    color: '#00b894',
    topic: 'Engaging social media posts and hooks',
    description: 'Craft social content'
  },
  { 
    id: 'ad', 
    label: 'Ad Copy', 
    icon: Megaphone, 
    color: '#fd79a8',
    topic: 'Compelling advertisement and call-to-action',
    description: 'Write persuasive ad copy'
  },
  { 
    id: 'video', 
    label: 'Video Script', 
    icon: Film, 
    color: '#e17055',
    topic: 'Engaging video script and narrative',
    description: 'Generate video content'
  },
  { 
    id: 'seo', 
    label: 'SEO Strategy', 
    icon: Search, 
    color: '#fdcb6e',
    topic: 'SEO optimization and keyword strategy',
    description: 'Build SEO foundation'
  },
];

const campaignQuickActions = [
  { 
    id: 'launch', 
    label: 'Launch Campaign', 
    icon: Rocket, 
    color: '#667eea',
    description: 'Strategy for launching your product or service',
    type: 'campaign'
  },
  { 
    id: 'growth', 
    label: 'Growth Campaign', 
    icon: TrendingUp, 
    color: '#0984e3',
    description: 'Scale and increase market share',
    type: 'campaign'
  },
  { 
    id: 'seasonal', 
    label: 'Seasonal Campaign', 
    icon: Sparkles, 
    color: '#00b894',
    description: 'Create seasonal promotions',
    type: 'campaign'
  },
];

const analysisQuickActions = [
  { 
    id: 'competitor', 
    label: 'Competitor Analysis', 
    icon: BarChart3, 
    color: '#6c5ce7',
    description: 'Analyze competitive landscape',
    type: 'analysis'
  },
  { 
    id: 'market', 
    label: 'Market Research', 
    icon: Brain, 
    color: '#fd79a8',
    description: 'Deep market insights',
    type: 'analysis'
  },
];

const creatorResearchActions = [
  { 
    id: 'podcast-creators', 
    label: 'Podcast Creators', 
    icon: Mic, 
    color: '#9b59b6',
    description: 'Find podcast hosts to feature your product',
    type: 'creator-research'
  },
  { 
    id: 'youtube-creators', 
    label: 'YouTube Creators', 
    icon: Video, 
    color: '#e74c3c',
    description: 'Discover YouTubers for product reviews',
    type: 'creator-research'
  },
  { 
    id: 'tiktok-creators', 
    label: 'TikTok Creators', 
    icon: Camera, 
    color: '#000000',
    description: 'Connect with TikTok influencers',
    type: 'creator-research'
  },
  { 
    id: 'instagram-creators', 
    label: 'Instagram Creators', 
    icon: Instagram, 
    color: '#e1306c',
    description: 'Find Instagram influencers in your niche',
    type: 'creator-research'
  },
  { 
    id: 'facebook-creators', 
    label: 'Facebook Creators', 
    icon: Facebook, 
    color: '#1877f2',
    description: 'Discover Facebook content creators',
    type: 'creator-research'
  },
];

// Merge all quick actions into one array
const allQuickActions = [...contentQuickActions, ...campaignQuickActions, ...analysisQuickActions, ...creatorResearchActions];

// Helper function to get color for content type
const getContentTypeColor = (contentType: string): string => {
  const action = allQuickActions.find(a => a.id === contentType);
  return action?.color || '#6c5ce7'; // Default to purple
};

export function CofounderMarketing({ 
  user, 
  userData, 
  campaigns, 
  leads,
  setLeads,
  showAddCampaign,
  setShowAddCampaign,
  showAddLead,
  setShowAddLead,
  newCampaign,
  setNewCampaign,
  newLead,
  setNewLead,
  isCreatingCampaign,
  isCreatingLead,
  editingCampaign,
  setEditingCampaign,
  showEditCampaign,
  setShowEditCampaign,
  isUpdatingCampaign,
  handleAddCampaign,
  handleAddLead,
  handleEditCampaign,
  handleUpdateCampaign,
  handleDeleteCampaign,
  handleDeleteLead,
  handleEditLead,
  handleUpdateLead,
  confirmDeleteCampaign,
  confirmDeleteLead,
  campaignToDelete,
  setCampaignToDelete,
  showDeleteConfirm,
  setShowDeleteConfirm,
  isDeletingCampaign,
  leadToDelete,
  setLeadToDelete,
  showDeleteLeadConfirm,
  setShowDeleteLeadConfirm,
  isDeletingLead,
  showEditLead,
  isUpdatingLead
}: CofounderMarketingProps) {
  const navigate = useNavigate();
  const { deductCredits, checkCredits } = useCredits();
  const isMobile = useIsMobile();
  const { addNotification } = useNotifications();
  const { selectedBusiness } = useBusiness();
  const [activeTab, setActiveTab] = useState('quick-actions');
  
  // Generated content storage
  const [generatedContent, setGeneratedContent] = useState<ContentResult | null>(null);
  const [contentHistory, setContentHistory] = useState<ContentResult[]>([]);
  const [campaignStrategies, setCampaignStrategies] = useState<CampaignStrategy[]>([]);
  const [competitorAnalyses, setCompetitorAnalyses] = useState<CompetitorAnalysis[]>([]);
  
  // Loading states for quick actions (running in background)
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  
  // Track background jobs (for visual indicators only, doesn't block UI)
  const [backgroundJobs, setBackgroundJobs] = useState<Set<string>>(new Set());
  
  // Dialog States
  const [showContentDialog, setShowContentDialog] = useState(false);
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showContentInputDialog, setShowContentInputDialog] = useState(false);
  const [showCampaignInputDialog, setShowCampaignInputDialog] = useState(false);
  const [showAnalysisInputDialog, setShowAnalysisInputDialog] = useState(false);
  const [campaignStrategy, setCampaignStrategy] = useState<CampaignStrategy | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Content input state
  const [contentInputType, setContentInputType] = useState<string>('');
  const [contentInputLabel, setContentInputLabel] = useState<string>('');
  const [contentTopic, setContentTopic] = useState<string>('');
  const [contentTone, setContentTone] = useState<string>('professional');
  const [contentLength, setContentLength] = useState<string>('medium');

  // Campaign input state
  const [campaignInputType, setCampaignInputType] = useState<string>('');
  const [campaignInputLabel, setCampaignInputLabel] = useState<string>('');
  const [campaignGoal, setCampaignGoal] = useState<string>('');
  const [campaignBudget, setCampaignBudget] = useState<string>('');
  const [campaignDuration, setCampaignDuration] = useState<string>('medium');

  // Analysis input state
  const [analysisInputType, setAnalysisInputType] = useState<string>('');
  const [analysisInputLabel, setAnalysisInputLabel] = useState<string>('');
  const [analysisTarget, setAnalysisTarget] = useState<string>('');
  const [analysisScope, setAnalysisScope] = useState<string>('comprehensive');

  // Creator research input state
  const [creatorResearchType, setCreatorResearchType] = useState<string>('');
  const [creatorResearchLabel, setCreatorResearchLabel] = useState<string>('');
  const [showCreatorResearchDialog, setShowCreatorResearchDialog] = useState<boolean>(false);
  const [selectedProductForCreators, setSelectedProductForCreators] = useState<string | null>(null);
  const [ecommerceProducts, setEcommerceProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Filter for storage tab
  const [storageFilter, setStorageFilter] = useState<'all' | 'content' | 'campaigns' | 'analysis' | 'creators'>('all');
  
  // Creator research results state
  const [creatorResearch, setCreatorResearch] = useState<any[]>([]);

  // Loading state
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load from localStorage when business changes
  useEffect(() => {
    if (selectedBusiness?.id) {
      try {
        const savedContent = localStorage.getItem(`contentHistory_${selectedBusiness.id}`);
        const savedCampaigns = localStorage.getItem(`campaignStrategies_${selectedBusiness.id}`);
        const savedAnalyses = localStorage.getItem(`competitorAnalyses_${selectedBusiness.id}`);
        
        console.log('🔍 Loading from localStorage for business:', selectedBusiness.id);
        console.log('📦 Raw savedContent:', savedContent);
        console.log('📦 Raw savedCampaigns:', savedCampaigns);
        console.log('📦 Raw savedAnalyses:', savedAnalyses);
        
        if (savedContent) {
          const parsed = JSON.parse(savedContent);
          console.log('✅ Parsed content:', parsed.length, 'items');
          setContentHistory(parsed);
        }
        if (savedCampaigns) {
          const parsed = JSON.parse(savedCampaigns);
          console.log('✅ Parsed campaigns:', parsed.length, 'items');
          setCampaignStrategies(parsed);
        }
        if (savedAnalyses) {
          const parsed = JSON.parse(savedAnalyses);
          console.log('✅ Parsed analyses:', parsed.length, 'items');
          setCompetitorAnalyses(parsed);
        }
      } catch (error) {
        console.error('Error loading marketing history from localStorage:', error);
      }
    }
  }, [selectedBusiness?.id]);

  // Save to localStorage whenever content changes
  useEffect(() => {
    if (selectedBusiness?.id && contentHistory.length > 0) {
      console.log('💾 Saving contentHistory to localStorage:', contentHistory.length, 'items for business:', selectedBusiness.id);
      localStorage.setItem(`contentHistory_${selectedBusiness.id}`, JSON.stringify(contentHistory));
    }
  }, [contentHistory, selectedBusiness?.id]);

  useEffect(() => {
    if (selectedBusiness?.id && campaignStrategies.length > 0) {
      localStorage.setItem(`campaignStrategies_${selectedBusiness.id}`, JSON.stringify(campaignStrategies));
    }
  }, [campaignStrategies, selectedBusiness?.id]);

  useEffect(() => {
    if (selectedBusiness?.id && competitorAnalyses.length > 0) {
      localStorage.setItem(`competitorAnalyses_${selectedBusiness.id}`, JSON.stringify(competitorAnalyses));
    }
  }, [competitorAnalyses, selectedBusiness?.id]);

  // Load saved content on mount
  useEffect(() => {
    console.log('🔄 loadMarketingHistory effect triggered. User:', !!user, 'Business:', selectedBusiness?.id);
    
    const loadMarketingHistory = async () => {
      if (!user || !selectedBusiness?.id) {
        console.log('⏭️ Skipping marketing history load:', { hasUser: !!user, hasBusiness: !!selectedBusiness?.id });
        return;
      }
      
      setIsLoadingHistory(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (!accessToken) {
          console.error('❌ No access token for loading marketing history');
          return;
        }

        const businessId = selectedBusiness?.id;
        if (!businessId) {
          console.log('⏭️ No business selected for marketing history');
          return;
        }
        
        console.log('📚 Loading marketing history for business:', businessId);

        // Fetch all marketing data from backend
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/history?businessId=${businessId}`;
        console.log('🌐 Fetching marketing history from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 Response status:', response.status, response.statusText);
        const data = await response.json();
        console.log('📊 Response data:', data);

        if (data.success) {
          // Backend is source of truth - update state and localStorage
          const backendContent = data.content || [];
          const backendCampaigns = data.campaigns || [];
          const backendAnalyses = data.analyses || [];
          const backendCreators = data.creators || [];
          
          console.log('📥 Backend data received:', {
            content: backendContent.length,
            campaigns: backendCampaigns.length,
            analyses: backendAnalyses.length,
            creators: backendCreators.length
          });
          
          // Update state with backend data (backend is source of truth)
          setContentHistory(backendContent);
          setCampaignStrategies(backendCampaigns);
          setCompetitorAnalyses(backendAnalyses);
          setCreatorResearch(backendCreators);
          
          // Sync localStorage with backend data
          localStorage.setItem(`contentHistory_${businessId}`, JSON.stringify(backendContent));
          localStorage.setItem(`campaignStrategies_${businessId}`, JSON.stringify(backendCampaigns));
          localStorage.setItem(`competitorAnalyses_${businessId}`, JSON.stringify(backendAnalyses));
          localStorage.setItem(`creatorResearch_${businessId}`, JSON.stringify(backendCreators));
          
          console.log('✅ Loaded marketing history from backend:', { 
            content: backendContent.length, 
            campaigns: backendCampaigns.length, 
            analyses: backendAnalyses.length,
            creators: backendCreators.length 
          });
        } else {
          console.error('❌ Failed to load marketing history:', data.error);
        }
      } catch (error) {
        console.error('❌ Error loading marketing history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadMarketingHistory();
  }, [user, selectedBusiness?.id]);

  // Quick action handler for content generation
  const handleQuickGenerateContent = async (contentType: string, userTopic: string) => {
    // Check credits (10 credits for quick actions)
    if (!checkCredits(10)) {
      return;
    }

    // Add to background jobs
    setBackgroundJobs(prev => new Set(prev).add(contentType));
    
    // Add notification instead of toast
    addNotification({
      title: 'Generating Content',
      message: `Your ${contentType} content is being generated in the background...`,
      type: 'info',
      category: 'marketing',
      metadata: {
        contentType: contentType,
        status: 'processing'
      }
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.dismiss();
        toast.error('Please log in to use marketing tools');
        setIsGenerating(false);
        setActiveAction(null);
        return;
      }

      // Get business info from userData
      const businessInfo = userData?.business_info || {};
      const businessName = businessInfo.business_name || 'your business';
      const industry = businessInfo.industry || 'your industry';
      const targetMarket = businessInfo.target_market || 'potential customers';

      // Enhance the topic with business context if it doesn't already mention the business
      const enhancedTopic = userTopic.toLowerCase().includes(businessName.toLowerCase()) 
        ? userTopic 
        : `${userTopic} for ${businessName} (${industry})`;

      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;
      
      console.log('🎯 Generating content for business ID:', businessId, {
        selectedBusiness: selectedBusiness?.id,
        currentBusiness: userData?.current_business_id,
        firstBusiness: userData?.businesses?.[0]?.id
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/generate-content`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contentType,
            topic: enhancedTopic,
            tone: contentTone,
            length: contentLength,
            targetAudience: targetMarket,
            businessId: businessId
          })
        }
      );

      const data = await response.json();
      
      if (data.success && data.content) {
        // Deduct credits after successful generation
        await deductCredits(10, `Marketing Content Generation - ${contentType}`);
        
        setGeneratedContent(data.content);
        setContentHistory(prev => {
          const updated = [data.content, ...prev].slice(0, 50);
          console.log('📝 Content added to history. Total items:', updated.length, 'New content:', data.content);
          return updated;
        });
        
        // Add notification
        addNotification({
          title: `${contentType} Content Ready`,
          message: `Your ${contentType} content has been generated successfully.`,
          type: 'success',
          category: 'marketing',
          actionUrl: '/operations/marketing',
          metadata: {
            contentType,
            topic: data.content.topic
          }
        });
        
        // Switch to Content Studio tab and open dialog to show the content
        setActiveTab('content-studio');
        setShowContentDialog(true);
      } else {
        throw new Error(data.error || 'Content generation failed');
      }
    } catch (error: any) {
      console.error('Content generation error:', error);
      
      // Add error notification
      addNotification({
        title: 'Content Generation Failed',
        message: `Failed to generate ${contentType}: ${error.message}`,
        type: 'error',
        category: 'marketing',
        metadata: {
          contentType: contentType,
          error: error.message
        }
      });
    } finally {
      setBackgroundJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentType);
        return newSet;
      });
    }
  };

  // Quick action handler for campaign strategy
  const handleQuickCreateCampaign = async (campaignType: string, userGoal?: string, budget?: string, duration?: string) => {
    // Check credits (10 credits for quick actions)
    if (!checkCredits(10)) {
      return;
    }

    // Add to background jobs
    setBackgroundJobs(prev => new Set(prev).add(campaignType));
    
    // Add notification instead of toast
    addNotification({
      title: 'Creating Campaign Strategy',
      message: `Your ${campaignType} campaign strategy is being created in the background...`,
      type: 'info',
      category: 'marketing',
      metadata: {
        campaignType: campaignType,
        status: 'processing'
      }
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.dismiss();
        toast.error('Please log in to use marketing tools');
        setIsCreatingStrategy(false);
        setActiveAction(null);
        return;
      }

      // Get business info from userData
      const businessInfo = userData?.business_info || {};
      const businessName = businessInfo.business_name || 'our business';
      const industry = businessInfo.industry || 'our industry';
      const targetMarket = businessInfo.target_market || 'our target audience';

      // Use user-provided goal or generate default
      let campaignGoal = userGoal || '';
      if (!campaignGoal) {
        if (campaignType === 'launch') {
          campaignGoal = `Launch ${businessName} and acquire initial customers in ${industry}`;
        } else if (campaignType === 'growth') {
          campaignGoal = `Scale ${businessName} and increase market share in ${industry}`;
        } else if (campaignType === 'seasonal') {
          campaignGoal = `Run a seasonal promotion campaign for ${businessName} targeting ${targetMarket}`;
        }
      }

      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;
      
      console.log('🎯 Creating campaign for business ID:', businessId, {
        selectedBusiness: selectedBusiness?.id,
        currentBusiness: userData?.current_business_id,
        firstBusiness: userData?.businesses?.[0]?.id
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/campaign-strategy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            campaignGoal,
            targetAudience: targetMarket,
            budget: budget || undefined,
            duration: duration || undefined,
            businessId: businessId
          })
        }
      );

      const data = await response.json();
      
      if (data.success && data.strategy) {
        // Deduct credits after successful generation
        await deductCredits(10, `Campaign Strategy - ${campaignType}`);
        
        setCampaignStrategy(data.strategy);
        setCampaignStrategies(prev => [data.strategy, ...prev].slice(0, 50));
        
        // Add notification
        addNotification({
          title: 'Campaign Strategy Ready',
          message: `Your ${campaignType} campaign strategy has been created.`,
          type: 'success',
          category: 'marketing',
          actionUrl: '/operations/marketing',
          metadata: {
            campaignType,
            goal: data.strategy.goal
          }
        });
        
        // Switch to Content Studio tab and open dialog to show the strategy
        setActiveTab('content-studio');
        setShowStrategyDialog(true);
      } else {
        throw new Error(data.error || 'Strategy creation failed');
      }
    } catch (error: any) {
      console.error('Campaign strategy error:', error);
      
      // Add error notification
      addNotification({
        title: 'Campaign Strategy Failed',
        message: `Failed to create ${campaignType} strategy: ${error.message}`,
        type: 'error',
        category: 'marketing',
        metadata: {
          campaignType: campaignType,
          error: error.message
        }
      });
    } finally {
      setBackgroundJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignType);
        return newSet;
      });
    }
  };

  // Quick action handler for competitor analysis
  const handleQuickAnalyzeCompetitors = async (analysisType: string, userTarget?: string, scope?: string) => {
    const analysisId = analysisType || 'competitor-analysis';
    
    // Check credits (10 credits for quick actions)
    if (!checkCredits(10)) {
      return;
    }

    // Add to background jobs
    setBackgroundJobs(prev => new Set(prev).add(analysisId));
    
    // Add notification instead of toast
    addNotification({
      title: 'Running Analysis',
      message: `Your ${analysisInputLabel || 'competitor analysis'} is being processed in the background...`,
      type: 'info',
      category: 'marketing',
      metadata: {
        analysisId: analysisId,
        status: 'processing'
      }
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        addNotification({
          title: 'Authentication Required',
          message: 'Please log in to use marketing tools',
          type: 'error',
          category: 'marketing'
        });
        setBackgroundJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(analysisId);
          return newSet;
        });
        return;
      }

      // Get business info from userData
      const businessInfo = userData?.business_info || {};
      const industry = businessInfo.industry || 'Technology';
      const businessName = businessInfo.business_name || '';

      // Use user-provided target or default to business/industry
      const target = userTarget || `${businessName} in ${industry}`;

      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;
      
      console.log('🎯 Creating analysis for business ID:', businessId, {
        selectedBusiness: selectedBusiness?.id,
        currentBusiness: userData?.current_business_id,
        firstBusiness: userData?.businesses?.[0]?.id
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/competitor-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            industry,
            businessName,
            target,
            scope: scope || 'comprehensive',
            analysisType: analysisType,
            businessId: businessId
          })
        }
      );

      const data = await response.json();

      if (data.success && data.analysis) {
        // Deduct credits after successful generation
        await deductCredits(10, 'Competitor Analysis');
        
        setCompetitorAnalysis(data.analysis);
        setCompetitorAnalyses(prev => [data.analysis, ...prev].slice(0, 50));
        
        // Add notification
        addNotification({
          title: 'Competitor Analysis Ready',
          message: `Analysis for ${analysisTarget} has been completed.`,
          type: 'success',
          category: 'marketing',
          actionUrl: '/operations/marketing',
          metadata: {
            target: analysisTarget
          }
        });
        
        // Switch to Content Studio tab and open dialog to show the analysis
        setActiveTab('content-studio');
        setShowAnalysisDialog(true);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Competitor analysis error:', error);
      
      // Add error notification
      addNotification({
        title: 'Analysis Failed',
        message: `Failed to analyze competitors: ${error.message}`,
        type: 'error',
        category: 'marketing',
        metadata: {
          analysisId: analysisId,
          error: error.message
        }
      });
    } finally {
      setBackgroundJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(analysisId);
        return newSet;
      });
    }
  };

  // Load ecommerce products for creator research
  const loadEcommerceProducts = async () => {
    try {
      setLoadingProducts(true);
      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;

      if (!businessId) {
        console.warn('⚠️ No business ID available for loading products');
        setEcommerceProducts([]);
        return;
      }

      console.log('📦 Loading ecommerce products for business:', businessId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/ecommerce-products?businessId=${businessId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Products data:', data);
        
        // The endpoint returns { success: true, products: [...] }
        if (data.success && data.products) {
          console.log('✅ Loaded products:', data.products.length);
          setEcommerceProducts(data.products);
        } else if (data.products) {
          // Fallback if success field is missing
          console.log('✅ Loaded products (fallback):', data.products.length);
          setEcommerceProducts(data.products);
        } else {
          console.warn('⚠️ No products found or invalid response');
          setEcommerceProducts([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load products:', response.status, errorText);
        setEcommerceProducts([]);
      }
    } catch (error) {
      console.error('❌ Error loading ecommerce products:', error);
      setEcommerceProducts([]);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Creator research handler
  const handleCreatorResearch = async (researchType: string, productId: string) => {
    // Check credits (10 credits for creator research)
    if (!checkCredits(10)) {
      return;
    }

    // Add to background jobs
    setBackgroundJobs(prev => new Set(prev).add(researchType));
    
    // Add notification instead of toast
    addNotification({
      type: 'info',
      title: `Finding ${creatorResearchLabel}...`,
      message: `Your creator research is running in the background. You'll be notified when complete.`,
      duration: 5000
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;

      if (!accessToken || !businessId) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/creator-research`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            businessId,
            productId,
            researchType,
            platform: researchType.replace('-creators', '') // e.g., 'podcast-creators' -> 'podcast'
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Success notification will be sent by backend
        console.log('Creator research completed:', data);
        
        addNotification({
          type: 'success',
          title: `${creatorResearchLabel} Found!`,
          message: `We found ${data.creatorCount || 'several'} ${creatorResearchLabel.toLowerCase()} for your product. Check your storage.`,
          duration: 8000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Research Failed',
          message: data.error || 'Failed to find creators',
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('Creator research error:', error);
      addNotification({
        type: 'error',
        title: 'Research Error',
        message: error.message || 'An error occurred while searching for creators'
      });
    } finally {
      setBackgroundJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(researchType);
        return newSet;
      });
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleDeleteGeneratedContent = async (contentId: string) => {
    try {
      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;
      
      // Delete from backend
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (accessToken && businessId) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/delete-content`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contentId, businessId })
          }
        );
      }
      
      // Update local state
      setContentHistory(prev => prev.filter(c => c.id !== contentId));
      toast.success('Content deleted');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const handleDeleteCampaignStrategy = async (campaignId: string) => {
    try {
      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;
      
      // Delete from backend
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (accessToken && businessId) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/delete-campaign`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ campaignId, businessId })
          }
        );
      }
      
      // Update local state
      setCampaignStrategies(prev => prev.filter(c => c.id !== campaignId));
      toast.success('Campaign strategy deleted');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const handleDeleteCompetitorAnalysis = async (analysisId: string) => {
    try {
      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;
      
      // Delete from backend
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (accessToken && businessId) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/delete-analysis`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ analysisId, businessId })
          }
        );
      }
      
      // Update local state
      setCompetitorAnalyses(prev => prev.filter(a => a.id !== analysisId));
      toast.success('Analysis deleted');
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('Failed to delete analysis');
    }
  };

  const renderContentPreview = () => {
    if (!generatedContent) return null;

    const contentType = generatedContent.contentType;

    // Use specialized renderers for specific content types
    if (contentType === 'social') {
      return <SocialContentRenderer content={generatedContent} copiedField={copiedField} onCopy={copyToClipboard} />;
    }
    
    if (contentType === 'ad') {
      return <AdContentRenderer content={generatedContent} copiedField={copiedField} onCopy={copyToClipboard} />;
    }
    
    if (contentType === 'email') {
      return <EmailContentRenderer content={generatedContent} copiedField={copiedField} onCopy={copyToClipboard} />;
    }

    if (contentType === 'video') {
      return <VideoContentRenderer content={generatedContent} copiedField={copiedField} onCopy={copyToClipboard} />;
    }

    // Default rendering for other content types (blog, seo, etc.)
    const entries = Object.entries(generatedContent).filter(
      ([key]) => !['id', 'contentType', 'topic', 'timestamp', 'businessId'].includes(key)
    );

    return (
      <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', maxWidth: '100%', overflow: 'hidden' }}>
        {entries.map(([key, value]) => {
          if (typeof value === 'string') {
            return (
              <div key={key}>
                <div 
                  className="flex items-center justify-between"
                  style={{ marginBottom: 'var(--spacing-2)' }}
                >
                  <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(value, key)}
                    style={{ padding: 'var(--spacing-1) var(--spacing-2)' }}
                  >
                    {copiedField === key ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Textarea
                  value={value}
                  readOnly
                  rows={value.length > 100 ? 8 : 3}
                  className="w-full resize-none"
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                />
              </div>
            );
          } else if (Array.isArray(value)) {
            return (
              <div key={key}>
                <Label className="capitalize" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
                  {value.map((item, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      style={{
                        background: 'var(--accent)',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        borderRadius: 'var(--radius-lg)',
                      }}
                    >
                      {typeof item === 'string' ? item : JSON.stringify(item)}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          } else if (typeof value === 'object') {
            return (
              <div key={key}>
                <Label className="capitalize" style={{ marginBottom: 'var(--spacing-2)', display: 'block' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <div 
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-3)',
                    maxWidth: '100%',
                    overflow: 'auto',
                  }}
                >
                  <pre className="text-xs whitespace-pre-wrap break-words" style={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const renderCampaignStrategy = () => {
    if (!campaignStrategy) return null;

    return (
      <div className="flex flex-col" style={{ gap: 'var(--spacing-6)' }}>
        {/* Executive Summary */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #0984e315 0%, #0984e305 100%)',
            border: '2px solid #0984e340',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-5)',
          }}
        >
          <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
            <Lightbulb className="w-5 h-5" style={{ color: '#0984e3' }} />
            <h4 style={{ fontWeight: 'var(--font-weight-bold)' }}>Executive Summary</h4>
          </div>
          <p className="leading-relaxed">{campaignStrategy.executiveSummary}</p>
        </div>

        {/* Target Audience */}
        {campaignStrategy.targetAudience && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center" >
              <Target className="w-5 h-5 mr-2" style={{ color: '#6c5ce7' }} />
              Target Audience
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
              <div 
                style={{
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-4)',
                }}
              >
                <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Demographics</h5>
                <p className="text-sm leading-relaxed">{campaignStrategy.targetAudience.demographics}</p>
              </div>
              <div 
                style={{
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-4)',
                }}
              >
                <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Psychographics</h5>
                <p className="text-sm leading-relaxed">{campaignStrategy.targetAudience.psychographics}</p>
              </div>
              {campaignStrategy.targetAudience.painPoints && (
                <div 
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Pain Points</h5>
                  <ul className="text-sm" style={{ paddingLeft: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    {campaignStrategy.targetAudience.painPoints.map((point: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {campaignStrategy.targetAudience.motivations && (
                <div 
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Motivations</h5>
                  <ul className="text-sm" style={{ paddingLeft: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    {campaignStrategy.targetAudience.motivations.map((motivation: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{motivation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Messages */}
        {campaignStrategy.keyMessages && Array.isArray(campaignStrategy.keyMessages) && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" style={{ color: '#00b894' }} />
              Key Messages
            </h4>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
              {campaignStrategy.keyMessages.map((message: string, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    background: 'linear-gradient(135deg, #00b89415 0%, #00b89405 100%)',
                    border: '2px solid #00b89430',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    display: 'flex',
                    alignItems: 'start',
                    gap: 'var(--spacing-3)',
                  }}
                >
                  <div 
                    style={{
                      background: '#00b89430',
                      borderRadius: 'var(--radius-full)',
                      minWidth: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: '14px',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <p className="flex-1">{message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channel Strategy */}
        {campaignStrategy.channelStrategy && Array.isArray(campaignStrategy.channelStrategy) && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <Megaphone className="w-5 h-5 mr-2" style={{ color: '#fd79a8' }} />
              Channel Strategy
            </h4>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
              {campaignStrategy.channelStrategy.map((channel: any, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--background)',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-5)',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between" style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                    <h5 style={{ fontWeight: 'var(--font-weight-bold)' }}>{channel.channel}</h5>
                    {channel.budgetPercentage !== undefined && (
                      <Badge 
                        style={{
                          background: 'var(--primary-soft)',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          borderRadius: 'var(--radius-lg)',
                        }}
                      >
                        {channel.budgetPercentage}% of budget
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ marginBottom: 'var(--spacing-3)', opacity: 0.8 }}>{channel.rationale}</p>
                  {channel.tactics && Array.isArray(channel.tactics) && (
                    <div>
                      <h6 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)', fontSize: '14px' }}>Tactics:</h6>
                      <ul className="text-sm" style={{ paddingLeft: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        {channel.tactics.map((tactic: string, tidx: number) => (
                          <li key={tidx} className="leading-relaxed">{tactic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Allocation */}
        {campaignStrategy.budgetAllocation && Array.isArray(campaignStrategy.budgetAllocation) && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <Database className="w-5 h-5 mr-2" style={{ color: '#fdcb6e' }} />
              Budget Allocation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--spacing-3)' }}>
              {campaignStrategy.budgetAllocation.map((item: any, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>{item.category}</p>
                    <p className="text-sm opacity-60">{item.percentage}%</p>
                  </div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '20px', color: '#fdcb6e' }}>
                    ${item.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPIs */}
        {campaignStrategy.kpis && Array.isArray(campaignStrategy.kpis) && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" style={{ color: '#00b894' }} />
              Key Performance Indicators
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--spacing-3)' }}>
              {campaignStrategy.kpis.map((kpi: any, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--background)',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <h5 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>{kpi.metric}</h5>
                  <div 
                    style={{
                      background: 'linear-gradient(135deg, #00b89420 0%, #00b89410 100%)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--spacing-3)',
                      marginBottom: 'var(--spacing-2)',
                    }}
                  >
                    <p style={{ fontWeight: 'var(--font-weight-semibold)', color: '#00b894' }}>{kpi.target}</p>
                  </div>
                  <p className="text-xs opacity-60">{kpi.measurementMethod}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {campaignStrategy.timeline && Array.isArray(campaignStrategy.timeline) && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <Rocket className="w-5 h-5 mr-2" style={{ color: '#667eea' }} />
              Timeline
            </h4>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-4)' }}>
              {campaignStrategy.timeline.map((phase: any, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-5)',
                    position: 'relative',
                  }}
                >
                  <div className="flex items-start" style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                    <div 
                      style={{
                        background: '#667eea',
                        color: 'white',
                        borderRadius: 'var(--radius-full)',
                        minWidth: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'var(--font-weight-bold)',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h5 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-1)' }}>{phase.phase}</h5>
                      <p className="text-sm opacity-60">
                        {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {phase.milestones && Array.isArray(phase.milestones) && (
                    <ul className="text-sm" style={{ paddingLeft: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      {phase.milestones.map((milestone: string, midx: number) => (
                        <li key={midx} className="leading-relaxed">{milestone}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creative Ideas */}
        {campaignStrategy.creativeIdeas && Array.isArray(campaignStrategy.creativeIdeas) && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <PenTool className="w-5 h-5 mr-2" style={{ color: '#e17055' }} />
              Creative Ideas
            </h4>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
              {campaignStrategy.creativeIdeas.map((idea: any, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    background: 'linear-gradient(135deg, #e1705515 0%, #e1705505 100%)',
                    border: '2px solid #e1705530',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                    <h5 style={{ fontWeight: 'var(--font-weight-bold)' }}>{idea.concept}</h5>
                    {idea.channels && Array.isArray(idea.channels) && (
                      <div className="flex flex-wrap" style={{ gap: 'var(--spacing-1)' }}>
                        {idea.channels.map((channel: string, cidx: number) => (
                          <Badge 
                            key={cidx}
                            variant="outline"
                            style={{
                              background: '#e1705520',
                              borderColor: '#e17055',
                              fontSize: '11px',
                              padding: 'var(--spacing-1) var(--spacing-2)',
                            }}
                          >
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{idea.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Mitigation */}
        {campaignStrategy.riskMitigation && Array.isArray(campaignStrategy.riskMitigation) && (
          <div>
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <Zap className="w-5 h-5 mr-2" style={{ color: '#ff6b6b' }} />
              Risk Mitigation
            </h4>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
              {campaignStrategy.riskMitigation.map((item: any, idx: number) => (
                <div 
                  key={idx}
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)', color: '#ff6b6b' }}>
                    Risk: {item.risk}
                  </h5>
                  <p className="text-sm leading-relaxed"><strong>Mitigation:</strong> {item.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Metrics */}
        {campaignStrategy.successMetrics && (
          <div 
            style={{
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              border: '2px solid #667eea40',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-5)',
            }}
          >
            <h4 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-3)' }} className="flex items-center">
              <Check className="w-5 h-5 mr-2" style={{ color: '#667eea' }} />
              Success Metrics
            </h4>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
              <div>
                <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Primary Goal</h5>
                <p className="leading-relaxed">{campaignStrategy.successMetrics.primary}</p>
              </div>
              {campaignStrategy.successMetrics.secondary && Array.isArray(campaignStrategy.successMetrics.secondary) && (
                <div>
                  <h5 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-2)' }}>Secondary Goals</h5>
                  <ul className="text-sm" style={{ paddingLeft: 'var(--spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    {campaignStrategy.successMetrics.secondary.map((metric: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{metric}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-6)',
      }}
    >
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList 
          className="grid w-full grid-cols-5 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-1)',
            ...(isMobile && {
              position: 'sticky',
              top: '0',
              zIndex: 10,
              marginBottom: 'var(--spacing-3)'
            })
          }}
        >
          <TabsTrigger 
            value="quick-actions"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-green-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Actions
          </TabsTrigger>
          <TabsTrigger 
            value="chat"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-green-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="content-studio"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-green-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Studio
          </TabsTrigger>
          <TabsTrigger 
            value="campaigns"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-green-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Campaigns
          </TabsTrigger>
          <TabsTrigger 
            value="leads"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-green-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Leads
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0" style={{ padding: 0 }}>
          <div style={{
            ...(isMobile && {
              height: 'calc(100dvh - 64px - 60px - 80px)', 
              maxHeight: 'calc(100dvh - 64px - 60px - 80px)',
              overflow: 'hidden'
            })
          }}>
            <MarketingChat user={user} />
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions">
          <Card 
            className="border-none"
            style={{
              background: 'var(--background)',
              borderRadius: 'var(--radius-2xl)',
            }}
          >
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)' }}>
              <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', fontSize: isMobile ? '1.125rem' : undefined }}>
                <Zap className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: '#6c5ce7' }} />
                Marketing Quick Actions
              </CardTitle>
              <CardDescription style={{ fontSize: isMobile ? '0.75rem' : undefined }}>
                Generate content, campaigns, and competitive analysis instantly using your business information
              </CardDescription>
            </CardHeader>
            <CardContent style={{ 
              paddingLeft: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingRight: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingBottom: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingTop: 0 
            }}>
              {/* Action buttons */}
              <div 
                className="flex items-center justify-end"
                style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/integrations?category=Marketing')}
                  className="border-[#667eea] text-[#667eea] hover:bg-[#667eea]/10"
                  style={{
                    padding: 'var(--spacing-2) var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <Plug2 className="size-4" />
                  Integrations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/cofounder-settings')}
                  style={{
                    padding: 'var(--spacing-2) var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <Settings className="size-4" />
                  Automations
                </Button>
              </div>
              
              <div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                style={{ gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-4)' }}
              >
                {allQuickActions.map((action) => {
                  const Icon = action.icon;
                  const isContent = !action.type || action.type === 'content';
                  const isCampaign = action.type === 'campaign';
                  const isAnalysis = action.type === 'analysis';
                  const isCreatorResearch = action.type === 'creator-research';
                  const isRunning = backgroundJobs.has(action.id);
                  const isDisabled = false; // Never disable - allow background processing
                  
                  const handleClick = () => {
                    if (isContent && 'topic' in action) {
                      // Open input dialog for content generation
                      setContentInputType(action.id);
                      setContentInputLabel(action.label);
                      setContentTopic('');
                      setContentTone('professional');
                      setContentLength('medium');
                      setShowContentInputDialog(true);
                    } else if (isCampaign) {
                      // Open input dialog for campaign strategy
                      setCampaignInputType(action.id);
                      setCampaignInputLabel(action.label);
                      setCampaignGoal('');
                      setCampaignBudget('');
                      setCampaignDuration('medium');
                      setShowCampaignInputDialog(true);
                    } else if (isAnalysis) {
                      // Open input dialog for analysis
                      setAnalysisInputType(action.id);
                      setAnalysisInputLabel(action.label);
                      setAnalysisTarget('');
                      setAnalysisScope('comprehensive');
                      setShowAnalysisInputDialog(true);
                    } else if (action.type === 'creator-research') {
                      // Open input dialog for creator research - requires product selection
                      setCreatorResearchType(action.id);
                      setCreatorResearchLabel(action.label);
                      setSelectedProductForCreators(null);
                      setShowCreatorResearchDialog(true);
                    }
                  };
                  
                  const credits = 10;
                  
                  return (
                    <Card
                      key={action.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-none relative"
                      style={{
                        background: 'var(--background)',
                        borderRadius: 'var(--radius-xl)',
                        opacity: isDisabled && !isActive ? 0.5 : 1,
                      }}
                      onClick={handleClick}
                    >
                      <CardContent
                        className="flex flex-col items-center text-center"
                        style={{
                          padding: 'var(--spacing-4)',
                          gap: 'var(--spacing-2)',
                        }}
                      >
                        <Badge
                          variant="secondary"
                          style={{
                            position: 'absolute',
                            top: 'var(--spacing-2)',
                            right: 'var(--spacing-2)',
                            fontSize: '0.625rem',
                            padding: '2px 6px',
                            background: 'var(--primary)',
                            color: 'white',
                          }}
                        >
                          {credits} credits
                        </Badge>
                        <div 
                          style={{
                            background: `${action.color}15`,
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isRunning ? (
                            <Loader2 className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} animate-spin`} style={{ color: action.color }} />
                          ) : (
                            <Icon className={isMobile ? 'w-4 h-4' : 'w-6 h-6'} style={{ color: action.color }} />
                          )}
                        </div>
                        <div>
                          <p style={{ 
                            fontWeight: 'var(--font-weight-semibold)', 
                            marginBottom: 'var(--spacing-1)',
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            lineHeight: isMobile ? '1.2' : undefined,
                          }}>
                            {action.label}
                          </p>
                          {!isMobile && (
                            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                              {isRunning ? 'Generating...' : action.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Automation Reports */}
          <div style={{ marginTop: isMobile ? 'var(--spacing-6)' : 'var(--spacing-8)' }}>
            <AutomationReportsWidget 
              category="marketing" 
              categoryColor="var(--chart-5)"
              maxResults={5}
            />
          </div>
        </TabsContent>

        {/* Content Studio Tab */}
        <TabsContent value="content-studio">
          <Card 
            className="border-none"
            style={{
              background: 'var(--background)',
              borderRadius: 'var(--radius-2xl)',
            }}
          >
            <CardHeader style={{ padding: 'var(--spacing-6)' }}>
              <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#667eea' }} />
                Content Studio
              </CardTitle>
              <CardDescription>
                Your complete marketing asset library - all content, campaigns, and analysis in one place
              </CardDescription>
            </CardHeader>
            <CardContent style={{ 
              paddingLeft: 'var(--spacing-6)',
              paddingRight: 'var(--spacing-6)',
              paddingBottom: 'var(--spacing-6)',
              paddingTop: 0 
            }}>
              {/* Filter buttons */}
              <div 
                className="flex flex-wrap"
                style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}
              >
                <Button
                  size="sm"
                  variant={storageFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStorageFilter('all')}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  All ({contentHistory.length + campaignStrategies.length + competitorAnalyses.length})
                </Button>
                <Button
                  size="sm"
                  variant={storageFilter === 'content' ? 'default' : 'outline'}
                  onClick={() => setStorageFilter('content')}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  <FileText className="w-4 h-4" style={{ marginRight: 'var(--spacing-1)' }} />
                  Content ({contentHistory.length})
                </Button>
                <Button
                  size="sm"
                  variant={storageFilter === 'campaigns' ? 'default' : 'outline'}
                  onClick={() => setStorageFilter('campaigns')}
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  <Target className="w-4 h-4" style={{ marginRight: 'var(--spacing-1)' }} />
                  Campaigns ({campaignStrategies.length})
                </Button>
                <Button
                  size="sm"
                  variant={storageFilter === 'analysis' ? 'default' : 'outline'}
                  onClick={() => setStorageFilter('analysis')}
                  style={{ borderRadius: 'var(--spacing-lg)' }}
                >
                  <BarChart3 className="w-4 h-4" style={{ marginRight: 'var(--spacing-1)' }} />
                  Analysis ({competitorAnalyses.length})
                </Button>
              </div>

              {/* Content list */}
              <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
                {/* Debug logging */}
                {console.log('🎨 Content Studio rendering. Filter:', storageFilter, 'Content count:', contentHistory.length, 'Campaign count:', campaignStrategies.length, 'Analysis count:', competitorAnalyses.length)}
                
                {/* Content History */}
                {(storageFilter === 'all' || storageFilter === 'content') && contentHistory.length > 0 && (
                  <>
                    {storageFilter === 'all' && (
                      <h4 style={{ fontWeight: 'var(--font-weight-semibold)', marginTop: 'var(--spacing-2)' }}>
                        Content
                      </h4>
                    )}
                    {contentHistory.map((content) => {
                      const contentColor = getContentTypeColor(content.contentType);
                      return (
                        <div
                          key={content.id}
                          className="flex items-center justify-between transition-all duration-200 hover:shadow-md"
                          style={{
                            background: `linear-gradient(135deg, ${contentColor}10 0%, ${contentColor}05 100%)`,
                            border: `2px solid ${contentColor}40`,
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-4)',
                          }}
                        >
                          <button
                            onClick={() => {
                              setGeneratedContent(content);
                              setShowContentDialog(true);
                            }}
                            className="flex items-start flex-1"
                            style={{ 
                              gap: 'var(--spacing-3)',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <div 
                              style={{
                                background: `${contentColor}20`,
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--spacing-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FileText className="w-4 h-4" style={{ color: contentColor }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                                {content.topic}
                              </p>
                              <p className="text-xs opacity-60">
                                {content.contentType} • {new Date(content.timestamp).toLocaleDateString()} {new Date(content.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGeneratedContent(content.id);
                              }}
                              style={{
                                padding: 'var(--spacing-2)',
                                height: 'auto',
                              }}
                            >
                              <Trash2 className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
                            </Button>
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Campaign Strategies */}
                {(storageFilter === 'all' || storageFilter === 'campaigns') && campaignStrategies.length > 0 && (
                  <>
                    {storageFilter === 'all' && campaignStrategies.length > 0 && (
                      <h4 style={{ fontWeight: 'var(--font-weight-semibold)', marginTop: 'var(--spacing-4)' }}>
                        Campaigns
                      </h4>
                    )}
                    {campaignStrategies.map((campaign) => {
                      const campaignColor = '#0984e3'; // Blue for campaigns
                      return (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between transition-all duration-200 hover:shadow-md"
                          style={{
                            background: `linear-gradient(135deg, ${campaignColor}10 0%, ${campaignColor}05 100%)`,
                            border: `2px solid ${campaignColor}40`,
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-4)',
                          }}
                        >
                          <button
                            onClick={() => {
                              setCampaignStrategy(campaign);
                              setShowStrategyDialog(true);
                            }}
                            className="flex items-start flex-1"
                            style={{ 
                              gap: 'var(--spacing-3)',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <div 
                              style={{
                                background: `${campaignColor}20`,
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--spacing-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Target className="w-4 h-4" style={{ color: campaignColor }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                                {campaign.campaignName}
                              </p>
                              <p className="text-xs opacity-60">
                                Campaign Strategy • {new Date(campaign.timestamp).toLocaleDateString()} {new Date(campaign.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCampaignStrategy(campaign.id);
                              }}
                              style={{
                                padding: 'var(--spacing-2)',
                                height: 'auto',
                              }}
                            >
                              <Trash2 className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
                            </Button>
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Competitor Analyses */}
                {(storageFilter === 'all' || storageFilter === 'analysis') && competitorAnalyses.length > 0 && (
                  <>
                    {storageFilter === 'all' && competitorAnalyses.length > 0 && (
                      <h4 style={{ fontWeight: 'var(--font-weight-semibold)', marginTop: 'var(--spacing-4)' }}>
                        Analysis
                      </h4>
                    )}
                    {competitorAnalyses.map((analysis) => {
                      const analysisColor = '#6c5ce7'; // Purple for analysis
                      return (
                        <div
                          key={analysis.id}
                          className="flex items-center justify-between transition-all duration-200 hover:shadow-md"
                          style={{
                            background: `linear-gradient(135deg, ${analysisColor}10 0%, ${analysisColor}05 100%)`,
                            border: `2px solid ${analysisColor}40`,
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-4)',
                          }}
                        >
                          <button
                            onClick={() => {
                              setCompetitorAnalysis(analysis);
                              setShowAnalysisDialog(true);
                            }}
                            className="flex items-start flex-1"
                            style={{ 
                              gap: 'var(--spacing-3)',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <div 
                              style={{
                                background: `${analysisColor}20`,
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--spacing-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <BarChart3 className="w-4 h-4" style={{ color: analysisColor }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                                Competitor Analysis
                              </p>
                              <p className="text-xs opacity-60">
                                Market Analysis • {new Date(analysis.timestamp).toLocaleDateString()} {new Date(analysis.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCompetitorAnalysis(analysis.id);
                              }}
                              style={{
                                padding: 'var(--spacing-2)',
                                height: 'auto',
                              }}
                            >
                              <Trash2 className="w-4 h-4" style={{ color: 'var(--destructive)' }} />
                            </Button>
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Empty state */}
                {contentHistory.length === 0 && campaignStrategies.length === 0 && competitorAnalyses.length === 0 && (
                  <div 
                    className="flex flex-col items-center justify-center"
                    style={{ padding: 'var(--spacing-8)', gap: 'var(--spacing-3)' }}
                  >
                    <Database className="w-12 h-12 opacity-30" />
                    <p className="opacity-60">
                      No content generated yet. Use Quick Actions to get started!
                    </p>
                  </div>
                )}
              </div>

              {/* Product Marketing Plans Section */}
              {user?.id && selectedBusiness?.id && (
                <div style={{ marginTop: 'var(--spacing-8)' }}>
                  <div 
                    style={{ 
                      marginBottom: 'var(--spacing-4)',
                      paddingBottom: 'var(--spacing-4)',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <h3 style={{ 
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--spacing-2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)'
                    }}>
                      <Sparkles className="w-5 h-5" style={{ color: '#667eea' }} />
                      Product Marketing Plans
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)'
                    }}>
                      Marketing content generated from your products
                    </p>
                  </div>
                  <ProductMarketingStudio 
                    businessId={selectedBusiness.id} 
                    userId={user.id} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card 
            className="border-none"
            style={{
              background: 'var(--background)',
              borderRadius: 'var(--radius-2xl)',
            }}
          >
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', fontSize: isMobile ? '1.125rem' : undefined }}>
                    <Megaphone className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: '#667eea' }} />
                    Marketing Campaigns
                  </CardTitle>
                  <CardDescription style={{ fontSize: isMobile ? '0.75rem' : undefined }}>
                    Track and manage your marketing campaigns
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddCampaign?.(true)}
                  size={isMobile ? "sm" : "default"}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-lg)',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <Plus className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                  {!isMobile && 'Add Campaign'}
                </Button>
              </div>
            </CardHeader>
            <CardContent style={{ 
              paddingLeft: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingRight: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingBottom: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingTop: 0 
            }}>
              {campaigns && campaigns.length > 0 ? (
                <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
                  {campaigns.map((campaign) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                      }}
                    >
                      <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-3)' }}>
                        <div className="flex-1">
                          <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                            <h4 style={{ margin: 0 }}>{campaign.name}</h4>
                            <Badge 
                              variant={
                                campaign.status === 'active' ? 'default' : 
                                campaign.status === 'completed' ? 'secondary' : 
                                'outline'
                              }
                              style={{
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {campaign.status}
                            </Badge>
                            <Badge 
                              variant="outline"
                              style={{
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {campaign.type}
                            </Badge>
                          </div>
                          <p className="opacity-70" style={{ fontSize: '0.875rem', margin: 0, marginBottom: 'var(--spacing-2)' }}>
                            {campaign.description}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)' }}>
                            <div>
                              <div className="opacity-60" style={{ fontSize: '0.75rem' }}>Budget</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>${campaign.budget.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="opacity-60" style={{ fontSize: '0.75rem' }}>Spent</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>${campaign.spent.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="opacity-60" style={{ fontSize: '0.75rem' }}>Impressions</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{campaign.impressions.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="opacity-60" style={{ fontSize: '0.75rem' }}>Conversions</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{campaign.conversions.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                          <Button
                            variant="ghost"
                            size={isMobile ? "sm" : "default"}
                            onClick={() => handleEditCampaign?.(campaign)}
                            style={{
                              borderRadius: 'var(--radius-md)',
                              padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)',
                            }}
                          >
                            <Edit className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                          </Button>
                          <Button
                            variant="ghost"
                            size={isMobile ? "sm" : "default"}
                            onClick={() => handleDeleteCampaign?.(campaign)}
                            style={{
                              borderRadius: 'var(--radius-md)',
                              padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)',
                              color: 'var(--destructive)',
                            }}
                          >
                            <Trash2 className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center"
                  style={{ padding: 'var(--spacing-8)', gap: 'var(--spacing-3)' }}
                >
                  <Megaphone className="w-12 h-12 opacity-30" />
                  <p className="opacity-60">
                    No campaigns yet. Create campaigns in the Marketing Operations section.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <Card 
            className="border-none"
            style={{
              background: 'var(--background)',
              borderRadius: 'var(--radius-2xl)',
            }}
          >
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', fontSize: isMobile ? '1.125rem' : undefined }}>
                    <Users className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: '#00b894' }} />
                    Marketing Leads
                  </CardTitle>
                  <CardDescription style={{ fontSize: isMobile ? '0.75rem' : undefined }}>
                    View and manage your marketing leads
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddLead?.(true)}
                  size={isMobile ? "sm" : "default"}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-lg)',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <Plus className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                  {!isMobile && 'Add Lead'}
                </Button>
              </div>
            </CardHeader>
            <CardContent style={{ 
              paddingLeft: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingRight: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingBottom: isMobile ? 'var(--spacing-3)' : 'var(--spacing-6)',
              paddingTop: 0 
            }}>
              {leads && leads.length > 0 ? (
                <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
                  {leads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                      }}
                    >
                      <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-3)' }}>
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                            <h4 style={{ margin: 0 }}>{lead.name}</h4>
                            <Badge 
                              variant={
                                lead.status === 'converted' ? 'default' : 
                                lead.status === 'qualified' ? 'secondary' : 
                                'outline'
                              }
                              style={{
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {lead.status}
                            </Badge>
                            {lead.temperature && (
                              <Badge
                                style={{
                                  background: lead.temperature === 'hot' ? '#d4183d20' : lead.temperature === 'warm' ? '#f59e0b20' : '#00709920',
                                  color: lead.temperature === 'hot' ? '#d4183d' : lead.temperature === 'warm' ? '#f59e0b' : '#007099',
                                  border: 'none',
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--spacing-1)',
                                }}
                              >
                                {lead.temperature === 'hot' && <Flame className="w-3 h-3" />}
                                {lead.temperature === 'warm' && <ThermometerSun className="w-3 h-3" />}
                                {lead.temperature === 'cold' && <Snowflake className="w-3 h-3" />}
                                {lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col" style={{ gap: 'var(--spacing-1)', marginBottom: 'var(--spacing-2)' }}>
                            <div className="opacity-70" style={{ fontSize: '0.875rem' }}>
                              <Mail className="w-3 h-3 inline mr-1" />
                              {lead.email}
                            </div>
                            {lead.phone && (
                              <div className="opacity-70" style={{ fontSize: '0.875rem' }}>
                                📞 {lead.phone}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)' }}>
                            <div>
                              <div className="opacity-60" style={{ fontSize: '0.75rem' }}>Source</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{lead.source}</div>
                            </div>
                            <div>
                              <div className="opacity-60" style={{ fontSize: '0.75rem' }}>Value</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>${lead.value.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="opacity-60" style={{ fontSize: '0.75rem' }}>Score</div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{lead.score}/100</div>
                            </div>
                          </div>
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex flex-wrap" style={{ gap: 'var(--spacing-1)', marginTop: 'var(--spacing-2)' }}>
                              {lead.tags.map((tag, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="outline"
                                  style={{
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                          <Button
                            variant="default"
                            size={isMobile ? "sm" : "default"}
                            onClick={async () => {
                              if (!selectedBusiness?.id) {
                                toast.error('No business selected');
                                return;
                              }
                              
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (!session?.access_token) {
                                  toast.error('Authentication required');
                                  return;
                                }

                                const response = await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/import-leads`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      Authorization: `Bearer ${session.access_token}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      businessId: selectedBusiness.id,
                                      leadIds: [lead.id]
                                    })
                                  }
                                );

                                if (response.ok) {
                                  toast.success('Lead sent to Sales!');
                                  // Remove from marketing leads
                                  if (setLeads) {
                                    setLeads(prev => prev.filter(l => l.id !== lead.id));
                                  }
                                } else {
                                  const error = await response.json();
                                  toast.error(error.message || 'Failed to send to sales');
                                }
                              } catch (error: any) {
                                console.error('Error sending to sales:', error);
                                toast.error(error.message || 'Failed to send to sales');
                              }
                            }}
                            style={{
                              borderRadius: 'var(--radius-md)',
                              padding: isMobile ? 'var(--spacing-1) var(--spacing-2)' : 'var(--spacing-2) var(--spacing-3)',
                              background: 'linear-gradient(135deg, #d4183d, #ff4757)',
                              color: 'white',
                              border: 'none',
                              gap: 'var(--spacing-1)',
                              fontSize: isMobile ? '0.75rem' : '0.875rem',
                            }}
                          >
                            <Send className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                            {!isMobile && 'Send to Sales'}
                          </Button>
                          <div className="flex" style={{ gap: 'var(--spacing-1)' }}>
                            <Button
                              variant="ghost"
                              size={isMobile ? "sm" : "default"}
                              onClick={() => handleEditLead?.(lead)}
                              style={{
                                borderRadius: 'var(--radius-md)',
                                padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)',
                              }}
                            >
                              <Edit className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                            </Button>
                            <Button
                              variant="ghost"
                              size={isMobile ? "sm" : "default"}
                              onClick={() => handleDeleteLead?.(lead)}
                              style={{
                                borderRadius: 'var(--radius-md)',
                                padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)',
                                color: 'var(--destructive)',
                              }}
                            >
                              <Trash2 className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div 
                  className="flex flex-col items-center justify-center"
                  style={{ padding: 'var(--spacing-8)', gap: 'var(--spacing-3)' }}
                >
                  <Users className="w-12 h-12 opacity-30" />
                  <p className="opacity-60">
                    No leads yet. Leads will appear here when generated from your marketing activities.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Input Dialog */}
      <Dialog open={showContentInputDialog} onOpenChange={setShowContentInputDialog}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#6c5ce7' }} />
              Generate {contentInputLabel}
            </DialogTitle>
            <DialogDescription>
              Specify what you want to create and we'll generate it for you
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            {/* Topic Input */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="content-topic">What do you want to create?</Label>
              <Textarea
                id="content-topic"
                placeholder={`e.g., "Write a blog post about how our product helps small businesses save time" or "Create social media posts about our new feature launch"`}
                value={contentTopic}
                onChange={(e) => setContentTopic(e.target.value)}
                rows={3}
                style={{
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            </div>

            {/* Tone Selection */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="content-tone">Tone</Label>
              <Select value={contentTone} onValueChange={setContentTone}>
                <SelectTrigger 
                  id="content-tone"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Length Selection */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="content-length">Length</Label>
              <Select value={contentLength} onValueChange={setContentLength}>
                <SelectTrigger 
                  id="content-length"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (Quick read)</SelectItem>
                  <SelectItem value="medium">Medium (Standard)</SelectItem>
                  <SelectItem value="long">Long (Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => setShowContentInputDialog(false)}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!contentTopic.trim()) {
                    toast.error('Please describe what you want to create');
                    return;
                  }
                  setShowContentInputDialog(false);
                  handleQuickGenerateContent(contentInputType, contentTopic);
                }}
                disabled={!contentTopic.trim()}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)',
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Input Dialog */}
      <Dialog open={showCampaignInputDialog} onOpenChange={setShowCampaignInputDialog}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Target className="w-5 h-5" style={{ color: '#667eea' }} />
              Create {campaignInputLabel}
            </DialogTitle>
            <DialogDescription>
              Describe your campaign goals and we'll create a comprehensive strategy
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            {/* Campaign Goal Input */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-goal">What are your campaign goals?</Label>
              <Textarea
                id="campaign-goal"
                placeholder={`e.g., "Launch our new product to tech-savvy millennials" or "Increase brand awareness in the healthcare industry by 50%"`}
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                rows={3}
                style={{
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            </div>

            {/* Budget Input */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-budget">Budget (Optional)</Label>
              <Input
                id="campaign-budget"
                placeholder="e.g., $5,000 or 10,000"
                value={campaignBudget}
                onChange={(e) => setCampaignBudget(e.target.value)}
                style={{
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            </div>

            {/* Duration Selection */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-duration">Campaign Duration</Label>
              <Select value={campaignDuration} onValueChange={setCampaignDuration}>
                <SelectTrigger 
                  id="campaign-duration"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (1-2 weeks)</SelectItem>
                  <SelectItem value="medium">Medium (1 month)</SelectItem>
                  <SelectItem value="long">Long (3+ months)</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => setShowCampaignInputDialog(false)}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!campaignGoal.trim()) {
                    toast.error('Please describe your campaign goals');
                    return;
                  }
                  setShowCampaignInputDialog(false);
                  handleQuickCreateCampaign(campaignInputType, campaignGoal, campaignBudget, campaignDuration);
                }}
                disabled={!campaignGoal.trim()}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)',
                }}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Create Strategy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis Input Dialog */}
      <Dialog open={showAnalysisInputDialog} onOpenChange={setShowAnalysisInputDialog}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Brain className="w-5 h-5" style={{ color: '#6c5ce7' }} />
              {analysisInputLabel}
            </DialogTitle>
            <DialogDescription>
              Specify what you want to analyze and we'll provide detailed insights
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            {/* Analysis Target Input */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="analysis-target">What do you want to analyze?</Label>
              <Textarea
                id="analysis-target"
                placeholder={`e.g., "Analyze top 5 competitors in the SaaS project management space" or "Research the email marketing software market"`}
                value={analysisTarget}
                onChange={(e) => setAnalysisTarget(e.target.value)}
                rows={3}
                style={{
                  borderRadius: 'var(--radius-lg)',
                }}
              />
            </div>

            {/* Scope Selection */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="analysis-scope">Analysis Depth</Label>
              <Select value={analysisScope} onValueChange={setAnalysisScope}>
                <SelectTrigger 
                  id="analysis-scope"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick Overview</SelectItem>
                  <SelectItem value="standard">Standard Analysis</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive (Detailed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => setShowAnalysisInputDialog(false)}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!analysisTarget.trim()) {
                    toast.error('Please describe what you want to analyze');
                    return;
                  }
                  setShowAnalysisInputDialog(false);
                  handleQuickAnalyzeCompetitors(analysisInputType, analysisTarget, analysisScope);
                }}
                disabled={!analysisTarget.trim()}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)',
                }}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Creator Research Dialog */}
      <Dialog open={showCreatorResearchDialog} onOpenChange={(open) => {
        setShowCreatorResearchDialog(open);
        if (open) {
          // Load ecommerce products when dialog opens
          loadEcommerceProducts();
        }
      }}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Users className="w-5 h-5" style={{ color: '#9b59b6' }} />
              {creatorResearchLabel}
            </DialogTitle>
            <DialogDescription>
              Select a product to find creators who can help promote it
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            {/* Product Selection */}
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="product-select">Select Product</Label>
              {loadingProducts ? (
                <div className="flex items-center justify-center" style={{ padding: 'var(--spacing-8)' }}>
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
              ) : ecommerceProducts.length > 0 ? (
                <Select value={selectedProductForCreators || ''} onValueChange={setSelectedProductForCreators}>
                  <SelectTrigger id="product-select">
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ecommerceProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.productName || 'Unnamed Product'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert>
                  <AlertDescription>
                    No products found. Please create an ecommerce product first in the Products tab.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => setShowCreatorResearchDialog(false)}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedProductForCreators) {
                    toast.error('Please select a product');
                    return;
                  }
                  setShowCreatorResearchDialog(false);
                  handleCreatorResearch(creatorResearchType, selectedProductForCreators);
                }}
                disabled={!selectedProductForCreators}
                style={{
                  flex: 1,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)',
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Creators
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Dialog */}
      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[80vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#6c5ce7' }} />
              Generated Content
            </DialogTitle>
            <DialogDescription>
              {generatedContent?.topic}
            </DialogDescription>
          </DialogHeader>
          <div style={{ marginTop: 'var(--spacing-4)', maxWidth: '100%', overflow: 'hidden' }}>
            {renderContentPreview()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Strategy Dialog */}
      <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-3xl lg:max-w-6xl max-h-[85vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Target className="w-5 h-5" style={{ color: '#0984e3' }} />
              Campaign Strategy
            </DialogTitle>
            <DialogDescription>
              {campaignStrategy?.campaignName}
            </DialogDescription>
          </DialogHeader>
          <div style={{ marginTop: 'var(--spacing-4)' }}>
            {renderCampaignStrategy()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Competitor Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[80vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <BarChart3 className="w-5 h-5" style={{ color: '#00b894' }} />
              Competitor Analysis
            </DialogTitle>
            <DialogDescription>
              Market insights and competitive intelligence
            </DialogDescription>
          </DialogHeader>
          <div style={{ marginTop: 'var(--spacing-4)' }}>
            {competitorAnalysis && (
              <MarketAnalysisRenderer content={competitorAnalysis} copiedField={copiedField} onCopy={copyToClipboard} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Campaign Dialog */}
      <Dialog open={showAddCampaign} onOpenChange={setShowAddCampaign}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Megaphone className="w-5 h-5" style={{ color: '#667eea' }} />
              Create Marketing Campaign
            </DialogTitle>
            <DialogDescription>
              Add a new marketing campaign to track and manage
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder="e.g., Summer Sale 2024"
                value={newCampaign?.name || ''}
                onChange={(e) => setNewCampaign?.({ ...newCampaign, name: e.target.value })}
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-description">Description</Label>
              <Textarea
                id="campaign-description"
                placeholder="Describe your campaign goals and strategy"
                value={newCampaign?.description || ''}
                onChange={(e) => setNewCampaign?.({ ...newCampaign, description: e.target.value })}
                rows={3}
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <Select 
                value={newCampaign?.type || 'email'} 
                onValueChange={(value) => setNewCampaign?.({ ...newCampaign, type: value })}
              >
                <SelectTrigger id="campaign-type" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="content">Content Marketing</SelectItem>
                  <SelectItem value="ppc">PPC/Ads</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-budget">Budget ($)</Label>
              <Input
                id="campaign-budget"
                type="number"
                placeholder="5000"
                value={newCampaign?.budget || ''}
                onChange={(e) => setNewCampaign?.({ ...newCampaign, budget: parseFloat(e.target.value) || 0 })}
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="campaign-status">Status</Label>
              <Select 
                value={newCampaign?.status || 'planning'} 
                onValueChange={(value) => setNewCampaign?.({ ...newCampaign, status: value })}
              >
                <SelectTrigger id="campaign-status" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => setShowAddCampaign?.(false)}
                style={{ flex: 1, borderRadius: 'var(--radius-lg)' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCampaign}
                disabled={isCreatingCampaign}
                style={{ 
                  flex: 1, 
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)'
                }}
              >
                {isCreatingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={showEditCampaign} onOpenChange={setShowEditCampaign}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto"
          style={{
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <Edit className="w-5 h-5" style={{ color: '#667eea' }} />
              Edit Campaign
            </DialogTitle>
            <DialogDescription>
              Update campaign details
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="edit-campaign-name">Campaign Name</Label>
              <Input
                id="edit-campaign-name"
                placeholder="e.g., Summer Sale 2024"
                value={editingCampaign?.name || ''}
                onChange={(e) => setEditingCampaign?.({ ...editingCampaign!, name: e.target.value })}
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="edit-campaign-description">Description</Label>
              <Textarea
                id="edit-campaign-description"
                placeholder="Describe your campaign goals and strategy"
                value={editingCampaign?.description || ''}
                onChange={(e) => setEditingCampaign?.({ ...editingCampaign!, description: e.target.value })}
                rows={3}
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="edit-campaign-type">Campaign Type</Label>
              <Select 
                value={editingCampaign?.type || 'email'} 
                onValueChange={(value) => setEditingCampaign?.({ ...editingCampaign!, type: value })}
              >
                <SelectTrigger id="edit-campaign-type" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="content">Content Marketing</SelectItem>
                  <SelectItem value="ppc">PPC/Ads</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="edit-campaign-budget">Budget ($)</Label>
              <Input
                id="edit-campaign-budget"
                type="number"
                placeholder="5000"
                value={editingCampaign?.budget || ''}
                onChange={(e) => setEditingCampaign?.({ ...editingCampaign!, budget: parseFloat(e.target.value) || 0 })}
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="edit-campaign-status">Status</Label>
              <Select 
                value={editingCampaign?.status || 'planning'} 
                onValueChange={(value) => setEditingCampaign?.({ ...editingCampaign!, status: value })}
              >
                <SelectTrigger id="edit-campaign-status" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => setShowEditCampaign?.(false)}
                style={{ flex: 1, borderRadius: 'var(--radius-lg)' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCampaign}
                disabled={isUpdatingCampaign}
                style={{ 
                  flex: 1, 
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)'
                }}
              >
                {isUpdatingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Update Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}