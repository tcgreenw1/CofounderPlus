import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Megaphone, Plus, RefreshCw, Users, DollarSign, Target, TrendingUp,
  Search, Edit, Trash2, Eye, MousePointer, ArrowUp, Activity,
  Mail, Share2, Calendar, BarChart3, Settings, FileText, Link as LinkIcon, Bot, Sparkles, Plug2
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useBusiness } from '../BusinessContext';
import { BusinessDropdownHeader } from '../BusinessDropdownHeader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { CofounderMarketing } from './CofounderMarketing';
import { ProductMarketingPlanModal } from './ProductMarketingPlanModal';
import { useIsMobile } from '../ui/use-mobile';
import { isIOS } from '../../utils/platformDetection';

interface MarketingOperationsProps {
  user?: any;
  userData?: any;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'social' | 'ppc' | 'content' | 'seo' | 'display';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'new' | 'qualified' | 'contacted' | 'converted' | 'lost';
  temperature?: 'cold' | 'warm' | 'hot';
  value: number;
  score: number;
  tags: string[];
  notes?: string;
  created_at: string;
  last_contact?: string;
}

interface MarketingMetric {
  id: string;
  date: string;
  website_visits: number;
  unique_visitors: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  email_opens: number;
  email_clicks: number;
  social_followers: number;
  social_engagement: number;
  leads_generated: number;
  cost_per_lead: number;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'video' | 'podcast' | 'infographic' | 'ebook' | 'webinar';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  content?: string;
  publish_date?: string;
  channels: string[];
  performance: {
    views: number;
    shares: number;
    comments: number;
    likes: number;
  };
  created_at: string;
}

function MarketingOperations({ user, userData }: MarketingOperationsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBusiness } = useBusiness();
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetric[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaignType, setSelectedCampaignType] = useState('all');
  const [activeTab, setActiveTab] = useState('cofounder');
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'email' as const,
    budget: 1000,
    start_date: new Date().toISOString().split('T')[0]
  });
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    value: 0,
    notes: ''
  });

  // Edit and delete state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [isUpdatingCampaign, setIsUpdatingCampaign] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);
  
  // Lead delete state
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [showDeleteLeadConfirm, setShowDeleteLeadConfirm] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  // Lead edit state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditLead, setShowEditLead] = useState(false);
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);

  // Product Marketing Plan Modal state
  const [showProductMarketingModal, setShowProductMarketingModal] = useState(false);
  const [ecommerceProduct, setEcommerceProduct] = useState<any | null>(null);

  // Detect if an ecommerce product was passed via navigation
  useEffect(() => {
    if (location.state?.ecommerceProduct) {
      setEcommerceProduct(location.state.ecommerceProduct);
      setShowProductMarketingModal(true);
      // Clear the navigation state to prevent modal re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Memoized calculations to prevent unnecessary re-renders
  const metrics = useMemo(() => {
    const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
    const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
    const totalImpressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
    const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
    const totalConversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
    
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
    const averageCPA = totalConversions > 0 ? totalSpent / totalConversions : 0;

    return {
      totalBudget,
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      activeCampaigns,
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      conversionRate,
      overallCTR,
      averageCPC,
      averageCPA
    };
  }, [campaigns, leads]);

  // Memoized filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedCampaignType === 'all' || campaign.type === selectedCampaignType;
      return matchesSearch && matchesType;
    });
  }, [campaigns, searchTerm, selectedCampaignType]);

  const loadMarketingData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user || !selectedBusiness) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setLoading(false);
        return;
      }

      // Load marketing data from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/data?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setLeads(data.leads || []);
        setMarketingMetrics(data.metrics || []);
        setContentItems(data.content || []);
        
        // If no data exists, automatically seed sample data to database
        if (!data.campaigns?.length && !data.leads?.length) {
          await seedSampleData(accessToken);
        }
      } else {
        const errorText = await response.text();
        console.log('Failed to load marketing data:', response.status, errorText);
        // Start with empty data if backend fails
        setCampaigns([]);
        setLeads([]);
        setMarketingMetrics([]);
        setContentItems([]);
      }
    } catch (error) {
      console.log('Error loading marketing data:', error);
      // Start with empty data on error
      setCampaigns([]);
      setLeads([]);
      setMarketingMetrics([]);
      setContentItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedBusiness]);

  const seedSampleData = async (accessToken: string | null) => {
    try {
      if (accessToken && selectedBusiness) {
        // Seed via API to save real data to database
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/seed-sample-data?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          // Set the real data from backend
          setCampaigns(data.campaigns || []);
          setLeads(data.leads || []);
          toast.success('Sample marketing data loaded from database');
          return;
        } else {
          console.log('Failed to seed sample data via API');
        }
      }
      
      // If backend seeding fails, show empty state
      setCampaigns([]);
      setLeads([]);
      console.log('Starting with empty marketing data - create your first campaign!');
    } catch (error) {
      console.log('Error seeding sample data:', error);
      setCampaigns([]);
      setLeads([]);
    }
  };

  useEffect(() => {
    loadMarketingData();
  }, [loadMarketingData]);

  const handleAddCampaign = async () => {
    if (!newCampaign.name || !newCampaign.budget || !selectedBusiness) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingCampaign(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to save to backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/campaigns?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCampaign)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setCampaigns(prev => [...prev, result.campaign]);
          setNewCampaign({
            name: '',
            description: '',
            type: 'email',
            budget: 1000,
            start_date: new Date().toISOString().split('T')[0]
          });
          setShowAddCampaign(false);
          toast.success('Campaign created successfully!');
          
          // Refresh the data to ensure everything is in sync
          setTimeout(() => loadMarketingData(), 1000);
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend save failed:', response.status, errorText);
          toast.error('Failed to save to server, saving locally instead');
        }
      }

      // If backend fails, show error - don't save locally
      toast.error('Unable to save campaign. Please check your connection and try again.');
    } catch (error) {
      console.error('Error adding campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.email || !selectedBusiness) return;

    setIsCreatingLead(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to save to backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/leads?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newLead)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setLeads(prev => [...prev, result.lead]);
          setNewLead({
            name: '',
            email: '',
            phone: '',
            source: '',
            value: 0,
            notes: ''
          });
          setShowAddLead(false);
          toast.success('Lead added successfully!');
          return;
        }
      }

      // If backend fails, show error
      toast.error('Unable to add lead. Please check your connection and try again.');
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead. Please try again.');
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowEditCampaign(true);
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign || !selectedBusiness) {
      toast.error('Missing campaign or business information');
      return;
    }

    setIsUpdatingCampaign(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to update via backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/campaigns/${editingCampaign.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: editingCampaign.name,
              description: editingCampaign.description,
              type: editingCampaign.type,
              status: editingCampaign.status,
              budget: editingCampaign.budget,
              start_date: editingCampaign.start_date,
              end_date: editingCampaign.end_date
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? result.campaign : c));
          setEditingCampaign(null);
          setShowEditCampaign(false);
          toast.success('Campaign updated successfully!');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend update failed:', response.status, errorText);
          toast.error('Failed to update on server, updating locally instead');
        }
      }

      // If backend fails, show error
      toast.error('Unable to update campaign. Please check your connection and try again.');
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign. Please try again.');
    } finally {
      setIsUpdatingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (!selectedBusiness) {
      toast.error('Missing business information');
      return;
    }

    setIsDeletingCampaign(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to delete via backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/campaigns/${campaign.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
          toast.success('Campaign deleted successfully!');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend delete failed:', response.status, errorText);
          toast.error('Failed to delete on server, deleting locally instead');
        }
      }

      // If backend fails, show error
      toast.error('Unable to delete campaign. Please check your connection and try again.');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign. Please try again.');
    } finally {
      setIsDeletingCampaign(false);
    }
  };

  const confirmDeleteCampaign = async () => {
    // This function is no longer needed but kept for compatibility
    if (!campaignToDelete || !selectedBusiness) {
      toast.error('Missing campaign or business information');
      return;
    }
    await handleDeleteCampaign(campaignToDelete);
    setCampaignToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!selectedBusiness) {
      toast.error('Missing business information');
      return;
    }

    setIsDeletingLead(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to delete via backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/leads/${lead.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          setLeads(prev => prev.filter(l => l.id !== lead.id));
          toast.success('Lead deleted successfully!');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend delete failed:', response.status, errorText);
          toast.error('Failed to delete on server, deleting locally instead');
        }
      }

      // If backend fails, show error
      toast.error('Unable to delete lead. Please check your connection and try again.');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead. Please try again.');
    } finally {
      setIsDeletingLead(false);
    }
  };

  const confirmDeleteLead = async () => {
    // This function is no longer needed but kept for compatibility
    if (!leadToDelete || !selectedBusiness) {
      toast.error('Missing lead or business information');
      return;
    }
    await handleDeleteLead(leadToDelete);
    setLeadToDelete(null);
    setShowDeleteLeadConfirm(false);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditLead(true);
  };

  const handleUpdateLead = async () => {
    if (!editingLead || !selectedBusiness) {
      toast.error('Missing lead or business information');
      return;
    }

    setIsUpdatingLead(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to update via backend
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/marketing/leads/${editingLead.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: editingLead.name,
              email: editingLead.email,
              phone: editingLead.phone,
              company: editingLead.company,
              source: editingLead.source,
              status: editingLead.status,
              temperature: editingLead.temperature,
              value: editingLead.value,
              score: editingLead.score,
              tags: editingLead.tags,
              notes: editingLead.notes
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          setLeads(prev => prev.map(l => l.id === editingLead.id ? result.lead : l));
          setEditingLead(null);
          setShowEditLead(false);
          toast.success('Lead updated successfully!');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend update failed:', response.status, errorText);
          toast.error('Failed to update lead on server');
        }
      }

      // If backend fails, show error
      toast.error('Unable to update lead. Please check your connection and try again.');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead. Please try again.');
    } finally {
      setIsUpdatingLead(false);
    }
  };

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'qualified': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'contacted': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'converted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'lost': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: isMobile && isIOSApp ? 'max(env(safe-area-inset-bottom, 0px) + 200px, 200px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
      }}
    >
      {/* Header - Reduced spacing */}
      <BusinessDropdownHeader
        title="Marketing Operations"
        description="Build campaigns, track leads, and amplify your brand"
        icon={<Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />}
        accentColor="green"
      />

      {/* Main Content - Simplified */}
      <CofounderMarketing 
        user={user} 
        userData={userData}
        campaigns={campaigns}
        setCampaigns={setCampaigns}
        leads={leads}
        setLeads={setLeads}
        filteredCampaigns={filteredCampaigns}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCampaignType={selectedCampaignType}
        setSelectedCampaignType={setSelectedCampaignType}
        showAddCampaign={showAddCampaign}
        setShowAddCampaign={setShowAddCampaign}
        showAddLead={showAddLead}
        setShowAddLead={setShowAddLead}
        newCampaign={newCampaign}
        setNewCampaign={setNewCampaign}
        newLead={newLead}
        setNewLead={setNewLead}
        isCreatingCampaign={isCreatingCampaign}
        isCreatingLead={isCreatingLead}
        editingCampaign={editingCampaign}
        setEditingCampaign={setEditingCampaign}
        showEditCampaign={showEditCampaign}
        setShowEditCampaign={setShowEditCampaign}
        isUpdatingCampaign={isUpdatingCampaign}
        handleAddCampaign={handleAddCampaign}
        handleAddLead={handleAddLead}
        handleEditCampaign={handleEditCampaign}
        handleUpdateCampaign={handleUpdateCampaign}
        handleDeleteCampaign={handleDeleteCampaign}
        handleDeleteLead={handleDeleteLead}
        getStatusBadgeColor={getStatusBadgeColor}
        confirmDeleteCampaign={confirmDeleteCampaign}
        confirmDeleteLead={confirmDeleteLead}
        campaignToDelete={campaignToDelete}
        setCampaignToDelete={setCampaignToDelete}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        isDeletingCampaign={isDeletingCampaign}
        leadToDelete={leadToDelete}
        setLeadToDelete={setLeadToDelete}
        showDeleteLeadConfirm={showDeleteLeadConfirm}
        setShowDeleteLeadConfirm={setShowDeleteLeadConfirm}
        isDeletingLead={isDeletingLead}
        handleEditLead={handleEditLead}
        showEditLead={showEditLead}
        isUpdatingLead={isUpdatingLead}
        handleUpdateLead={handleUpdateLead}
      />

      {/* Add Lead Dialog */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent 
          className="max-w-md"
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Add New Lead</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              Enter the details for the new marketing lead
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', paddingTop: 'var(--spacing-4)' }}>
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="lead-name" style={{ color: 'var(--foreground)' }}>Name *</Label>
              <Input
                id="lead-name"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder="Lead name"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="lead-email" style={{ color: 'var(--foreground)' }}>Email *</Label>
              <Input
                id="lead-email"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder="email@example.com"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="lead-phone" style={{ color: 'var(--foreground)' }}>Phone</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="lead-source" style={{ color: 'var(--foreground)' }}>Source</Label>
              <Input
                id="lead-source"
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                placeholder="e.g., Website, Referral, Event"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="lead-value" style={{ color: 'var(--foreground)' }}>Estimated Value ($)</Label>
              <Input
                id="lead-value"
                type="number"
                value={newLead.value}
                onChange={(e) => setNewLead({ ...newLead, value: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                min="0"
                step="100"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <Label htmlFor="lead-notes" style={{ color: 'var(--foreground)' }}>Notes</Label>
              <Textarea
                id="lead-notes"
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Additional notes about this lead..."
                rows={3}
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="flex justify-end" style={{ gap: 'var(--spacing-2)', paddingTop: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddLead(false);
                  setNewLead({
                    name: '',
                    email: '',
                    phone: '',
                    source: '',
                    value: 0,
                    notes: ''
                  });
                }}
                disabled={isCreatingLead}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddLead}
                disabled={!newLead.name || !newLead.email || isCreatingLead}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {isCreatingLead ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={showEditLead} onOpenChange={setShowEditLead}>
        <DialogContent 
          className="max-w-md max-h-[90vh] overflow-y-auto"
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--foreground)' }}>Edit Lead</DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)' }}>
              Update the lead details
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="flex flex-col" style={{ gap: 'var(--spacing-4)', paddingTop: 'var(--spacing-4)' }}>
              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-name" style={{ color: 'var(--foreground)' }}>Name *</Label>
                <Input
                  id="edit-lead-name"
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  placeholder="Lead name"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-email" style={{ color: 'var(--foreground)' }}>Email *</Label>
                <Input
                  id="edit-lead-email"
                  type="email"
                  value={editingLead.email}
                  onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                  placeholder="email@example.com"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-phone" style={{ color: 'var(--foreground)' }}>Phone</Label>
                <Input
                  id="edit-lead-phone"
                  type="tel"
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-company" style={{ color: 'var(--foreground)' }}>Company</Label>
                <Input
                  id="edit-lead-company"
                  value={editingLead.company || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                  placeholder="Company name"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-source" style={{ color: 'var(--foreground)' }}>Source</Label>
                <Input
                  id="edit-lead-source"
                  value={editingLead.source}
                  onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })}
                  placeholder="e.g., Website, Referral, Event"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-status" style={{ color: 'var(--foreground)' }}>Status</Label>
                <Select 
                  value={editingLead.status} 
                  onValueChange={(value: any) => setEditingLead({ ...editingLead, status: value })}
                >
                  <SelectTrigger 
                    id="edit-lead-status"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-temperature" style={{ color: 'var(--foreground)' }}>Temperature</Label>
                <Select 
                  value={editingLead.temperature || 'cold'} 
                  onValueChange={(value: any) => setEditingLead({ ...editingLead, temperature: value })}
                >
                  <SelectTrigger 
                    id="edit-lead-temperature"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold">❄️ Cold</SelectItem>
                    <SelectItem value="warm">🌡️ Warm</SelectItem>
                    <SelectItem value="hot">🔥 Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-value" style={{ color: 'var(--foreground)' }}>Estimated Value ($)</Label>
                <Input
                  id="edit-lead-value"
                  type="number"
                  value={editingLead.value}
                  onChange={(e) => setEditingLead({ ...editingLead, value: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  step="100"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-score" style={{ color: 'var(--foreground)' }}>Lead Score (0-100)</Label>
                <Input
                  id="edit-lead-score"
                  type="number"
                  value={editingLead.score}
                  onChange={(e) => setEditingLead({ ...editingLead, score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="5"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
                <Label htmlFor="edit-lead-notes" style={{ color: 'var(--foreground)' }}>Notes</Label>
                <Textarea
                  id="edit-lead-notes"
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  placeholder="Additional notes about this lead..."
                  rows={3}
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              <div className="flex justify-end" style={{ gap: 'var(--spacing-2)', paddingTop: 'var(--spacing-2)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditLead(false);
                    setEditingLead(null);
                  }}
                  disabled={isUpdatingLead}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLead}
                  disabled={!editingLead.name || !editingLead.email || isUpdatingLead}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {isUpdatingLead ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Marketing Plan Modal */}
      <ProductMarketingPlanModal
        isOpen={showProductMarketingModal}
        onClose={() => {
          setShowProductMarketingModal(false);
          setEcommerceProduct(null);
        }}
        product={ecommerceProduct}
        businessId={ecommerceProduct?.businessId || selectedBusiness?.id || ''}
        userId={user?.id || ''}
      />
    </motion.div>
  );
}

export default MarketingOperations;