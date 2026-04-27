import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Sparkles, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Users, 
  Target,
  Zap,
  Clock,
  CheckCircle,
  Send,
  Eye,
  Settings,
  Bell,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Database,
  Globe,
  Briefcase,
  FileText,
  Phone,
  Video,
  Brain,
  Activity,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Percent,
  TrendingDown,
  AlertCircle,
  Loader2,
  X,
  TestTube2,
  Building2,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { useBusiness } from '../BusinessContext';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useCredits } from '../../hooks/useCredits';
import { SalesChat } from './SalesChat';
import { AutomationReportsWidget } from '../AutomationReportsWidget';
import { useIsMobile } from '../ui/use-mobile';

interface CofounderSalesNewProps {
  user?: any;
  userData?: any;
}

interface GoogleConnectionBannerProps {
  user?: any;
  isCheckingGoogle: boolean;
  googleConnected: boolean | null;
  googleUserInfo: { email: string; name: string; picture: string } | null;
  connectGoogle: () => void;
  disconnectGoogle: () => void;
  isMobile: boolean;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Deal {
  id: string;
  name: string;
  company: string;
  customerId?: string;
  value: number;
  stage: string;
  probability: number;
  contact: string;
  email: string;
  phone?: string;
  notes?: string;
  expectedCloseDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  customerId?: string;
  email: string;
  phone?: string;
  source: string;
  score: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailStep {
  delayDays: number;
  subject: string;
  body: string;
}

interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused';
  steps: number;
  contacts: number;
  emailSteps?: EmailStep[];
  stats: {
    sent: number;
    opened: number;
    replied: number;
    bounced: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  pipeline: {
    total: number;
    active: number;
    won: number;
    lost: number;
    totalValue: number;
    wonValue: number;
    winRate: number;
  };
  leads: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  sequences: {
    total: number;
    active: number;
    paused: number;
    draft: number;
  };
}

// Google Connection Banner Component (for use in header on mobile)
export function GoogleConnectionBanner({ 
  user, 
  isCheckingGoogle, 
  googleConnected, 
  googleUserInfo, 
  connectGoogle, 
  disconnectGoogle,
  isMobile 
}: GoogleConnectionBannerProps) {
  const navigate = useNavigate();

  if (isCheckingGoogle) {
    return null; // Don't show in header while checking
  }

  if (googleConnected && googleUserInfo) {
    return null; // Don't show in header when connected (show full banner below)
  }

  if (!googleConnected && isMobile) {
    // Compact version for mobile header
    return (
      <Button
        onClick={connectGoogle}
        size="sm"
        style={{
          padding: 'var(--spacing-1) var(--spacing-2)',
          borderRadius: 'var(--radius-lg)',
          gap: 'var(--spacing-1)',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          color: 'white',
          border: 'none',
          fontSize: '10px',
          whiteSpace: 'nowrap',
        }}
      >
        <Mail className="size-3" />
        Google
      </Button>
    );
  }

  return null;
}

export function CofounderSalesNew({ user, userData }: CofounderSalesNewProps) {
  const navigate = useNavigate();
  const { deductCredits, checkCredits } = useCredits();
  const { selectedBusiness } = useBusiness();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Google OAuth state
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
  const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);

  // Data state
  const [pipeline, setPipeline] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [insights, setInsights] = useState<string>('');

  // UI state
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showSequenceDialog, setShowSequenceDialog] = useState(false);
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState('actions');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Form state
  const [newDeal, setNewDeal] = useState<Partial<Deal>>({
    name: '',
    company: '',
    customerId: '',
    value: 0,
    stage: 'prospecting',
    probability: 10,
    contact: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    company: '',
    customerId: '',
    email: '',
    phone: '',
    source: 'website',
    score: 50,
    status: 'new',
    notes: ''
  });

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    size: '',
    notes: ''
  });

  const [sequenceForm, setSequenceForm] = useState({
    name: '',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'paused',
    contacts: 0,
    emailSteps: [] as EmailStep[]
  });

  // Check Google connection status
  const checkGoogleConnection = async () => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setGoogleConnected(false);
        setIsCheckingGoogle(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google/status?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (!response.ok) {
        // If endpoint doesn't exist or returns error, silently set to not connected
        setGoogleConnected(false);
        setIsCheckingGoogle(false);
        return;
      }

      const data = await response.json();
      
      if (data.connected) {
        setGoogleConnected(true);
        setGoogleUserInfo({
          email: data.email,
          name: data.name,
          picture: data.picture
        });
        console.log('✅ Google connected:', data.email);
      } else {
        setGoogleConnected(false);
        console.log('⚠️ Google not connected');
      }
    } catch (error) {
      // Silently handle fetch errors (network issues, CORS, endpoint not found)
      // This is expected if Google integration hasn't been set up yet
      setGoogleConnected(false);
    } finally {
      setIsCheckingGoogle(false);
    }
  };

  // Connect to Google
  const connectGoogle = async () => {
    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      // Get OAuth URL from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google/auth-url?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      const data = await response.json();

      if (!data.success || !data.authUrl) {
        toast.error(data.error || 'Failed to get Google authorization URL');
        return;
      }

      console.log('🔗 Redirecting to Google OAuth:', data.authUrl);
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;

    } catch (error: any) {
      console.error('Error connecting to Google:', error);
      toast.error(error.message || 'Failed to connect to Google');
    }
  };

  // Disconnect from Google
  const disconnectGoogle = async () => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/google/disconnect`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user.id })
        }
      );

      const data = await response.json();

      if (data.success) {
        setGoogleConnected(false);
        setGoogleUserInfo(null);
        toast.success('Google disconnected successfully');
      } else {
        toast.error(data.error || 'Failed to disconnect Google');
      }
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      toast.error(error.message || 'Failed to disconnect Google');
    }
  };

  // Check Google connection on mount
  useEffect(() => {
    checkGoogleConnection();
  }, [user?.id]);

  // Load all sales data
  const loadSalesData = async () => {
    if (!selectedBusiness?.id) return;

    setIsLoadingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales`;

      // Fetch pipeline
      const pipelineRes = await fetch(`${baseUrl}/pipeline?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (pipelineRes.ok) {
        const pipelineData = await pipelineRes.json();
        setPipeline(pipelineData.pipeline || []);
        console.log('✅ Loaded sales pipeline:', pipelineData.count, 'deals');
      } else {
        console.error('❌ Failed to load pipeline:', pipelineRes.status);
      }

      // Fetch leads
      const leadsRes = await fetch(`${baseUrl}/leads?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
        console.log('✅ Loaded leads:', leadsData.count, 'leads');
      } else {
        console.error('❌ Failed to load leads:', leadsRes.status);
      }

      // Fetch customers
      const customersRes = await fetch(`${baseUrl}/customers?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData.customers || []);
        console.log('✅ Loaded customers:', customersData.count, 'customers');
      } else {
        console.error('❌ Failed to load customers:', customersRes.status, customersRes.statusText);
        const errorData = await customersRes.text();
        console.error('❌ Error details:', errorData);
      }

      // Fetch sequences
      const sequencesRes = await fetch(`${baseUrl}/sequences?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (sequencesRes.ok) {
        const sequencesData = await sequencesRes.json();
        setSequences(sequencesData.sequences || []);
        console.log('✅ Loaded sequences:', sequencesData.count, 'sequences');
      }

      // Fetch analytics
      const analyticsRes = await fetch(`${baseUrl}/analytics?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
        console.log('✅ Loaded sales analytics');
      }

      // Fetch latest insights
      const insightsRes = await fetch(`${baseUrl}/insights?businessId=${selectedBusiness.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        if (insightsData.insights && insightsData.insights.length > 0) {
          setInsights(insightsData.insights[0].content);
        }
      }

    } catch (error) {
      console.error('❌ Error loading sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Generate GPT insights
  const handleGenerateInsights = async () => {
    if (!selectedBusiness?.id) return;

    // Check credits (10 credits for sales insights)
    if (!checkCredits(10)) {
      return;
    }

    setIsGeneratingInsights(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        setIsGeneratingInsights(false);
        return;
      }

      console.log('🤖 Generating sales insights with GPT...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/insights/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            context: `Business: ${selectedBusiness.name}`
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate insights: ${errorText}`);
      }

      const data = await response.json();
      
      // Deduct credits after successful generation
      await deductCredits(10, 'Sales Insights Generation');
      
      setInsights(data.insights);
      console.log('✅ Insights generated successfully');
      toast.success('Sales insights generated!');

    } catch (error) {
      console.error('❌ Error generating insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // CUSTOMER HANDLERS
  const handleCreateCustomer = async () => {
    if (!selectedBusiness?.id || !newCustomer.name) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/customers/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            customer: newCustomer
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const data = await response.json();
      setCustomers(prev => [...prev, data.customer]);
      setShowCustomerDialog(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        website: '',
        industry: '',
        size: '',
        notes: ''
      });
      toast.success('Customer created successfully!');
      loadSalesData();

    } catch (error) {
      console.error('❌ Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer(customer);
    setShowCustomerDialog(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedBusiness?.id || !newCustomer.name || !editingCustomer) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/customers/update`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            customerId: editingCustomer.id,
            updates: newCustomer
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error updating customer:', errorData);
        throw new Error(errorData.error || 'Failed to update customer');
      }

      toast.success('Customer updated successfully!');
      setShowCustomerDialog(false);
      setEditingCustomer(null);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        website: '',
        industry: '',
        size: '',
        notes: ''
      });
      loadSalesData();

    } catch (error: any) {
      console.error('❌ Error updating customer:', error);
      toast.error(error.message || 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/customers/delete?businessId=${selectedBusiness.id}&customerId=${customerId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error deleting customer:', errorData);
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      toast.success('Customer deleted successfully!');
      loadSalesData();

    } catch (error: any) {
      console.error('❌ Error deleting customer:', error);
      toast.error(error.message || 'Failed to delete customer');
    }
  };

  // Create new deal
  const handleCreateDeal = async () => {
    if (!selectedBusiness?.id || !newDeal.name || !newDeal.customerId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      // Get customer name
      const customer = customers.find(c => c.id === newDeal.customerId);
      const dealData = {
        ...newDeal,
        company: customer?.name || newDeal.company
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/pipeline/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            deal: dealData
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create deal');
      }

      const data = await response.json();
      setPipeline(prev => [...prev, data.deal]);
      setShowDealDialog(false);
      setNewDeal({
        name: '',
        company: '',
        customerId: '',
        value: 0,
        stage: 'prospecting',
        probability: 10,
        contact: '',
        email: '',
        phone: '',
        notes: ''
      });
      setCustomerSearchQuery('');
      toast.success('Deal created successfully!');
      loadSalesData(); // Refresh all data

    } catch (error) {
      console.error('❌ Error creating deal:', error);
      toast.error('Failed to create deal');
    }
  };

  // Edit deal
  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setNewDeal(deal);
    if (deal.customerId) {
      const customer = customers.find(c => c.id === deal.customerId);
      setCustomerSearchQuery(customer?.name || '');
    }
    setShowDealDialog(true);
  };

  // Update deal
  const handleUpdateDeal = async () => {
    if (!selectedBusiness?.id || !newDeal.name || !newDeal.customerId || !editingDeal) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      // Get customer name
      const customer = customers.find(c => c.id === newDeal.customerId);
      const dealData = {
        ...newDeal,
        company: customer?.name || newDeal.company
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/pipeline/update`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            dealId: editingDeal.id,
            updates: dealData
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error updating deal:', errorData);
        throw new Error(errorData.error || 'Failed to update deal');
      }

      toast.success('Deal updated successfully!');
      setShowDealDialog(false);
      setEditingDeal(null);
      setNewDeal({
        name: '',
        company: '',
        customerId: '',
        value: 0,
        stage: 'prospecting',
        probability: 10,
        contact: '',
        email: '',
        phone: '',
        notes: ''
      });
      setCustomerSearchQuery('');
      loadSalesData();

    } catch (error: any) {
      console.error('❌ Error updating deal:', error);
      toast.error(error.message || 'Failed to update deal');
    }
  };

  // Delete deal
  const handleDeleteDeal = async (dealId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/pipeline/delete?businessId=${selectedBusiness.id}&dealId=${dealId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error deleting deal:', errorData);
        throw new Error(errorData.error || 'Failed to delete deal');
      }

      toast.success('Deal deleted successfully!');
      loadSalesData();

    } catch (error: any) {
      console.error('❌ Error deleting deal:', error);
      toast.error(error.message || 'Failed to delete deal');
    }
  };

  // Create new lead
  const handleCreateLead = async () => {
    if (!selectedBusiness?.id || !newLead.name || !newLead.email || !newLead.customerId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      // Get customer name
      const customer = customers.find(c => c.id === newLead.customerId);
      const leadData = {
        ...newLead,
        company: customer?.name || newLead.company
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/leads/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            lead: leadData
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      const data = await response.json();
      setLeads(prev => [...prev, data.lead]);
      setShowLeadDialog(false);
      setNewLead({
        name: '',
        company: '',
        customerId: '',
        email: '',
        phone: '',
        source: 'website',
        score: 50,
        status: 'new',
        notes: ''
      });
      setCustomerSearchQuery('');
      toast.success('Lead created successfully!');
      loadSalesData(); // Refresh all data

    } catch (error) {
      console.error('❌ Error creating lead:', error);
      toast.error('Failed to create lead');
    }
  };

  // Edit lead
  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead(lead);
    if (lead.customerId) {
      const customer = customers.find(c => c.id === lead.customerId);
      setCustomerSearchQuery(customer?.name || '');
    }
    setShowLeadDialog(true);
  };

  // Update lead
  const handleUpdateLead = async () => {
    if (!selectedBusiness?.id || !newLead.name || !newLead.email || !newLead.customerId || !editingLead) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      // Get customer name
      const customer = customers.find(c => c.id === newLead.customerId);
      const leadData = {
        ...newLead,
        company: customer?.name || newLead.company
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/leads/update`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            leadId: editingLead.id,
            updates: leadData
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error updating lead:', errorData);
        throw new Error(errorData.error || 'Failed to update lead');
      }

      toast.success('Lead updated successfully!');
      setShowLeadDialog(false);
      setEditingLead(null);
      setNewLead({
        name: '',
        company: '',
        customerId: '',
        email: '',
        phone: '',
        source: 'website',
        score: 50,
        status: 'new',
        notes: ''
      });
      setCustomerSearchQuery('');
      loadSalesData();

    } catch (error: any) {
      console.error('❌ Error updating lead:', error);
      toast.error(error.message || 'Failed to update lead');
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/leads/delete?businessId=${selectedBusiness.id}&leadId=${leadId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error deleting lead:', errorData);
        throw new Error(errorData.error || 'Failed to delete lead');
      }

      toast.success('Lead deleted successfully!');
      loadSalesData();

    } catch (error: any) {
      console.error('❌ Error deleting lead:', error);
      toast.error(error.message || 'Failed to delete lead');
    }
  };

  // SEQUENCE BUILDER HANDLERS
  const resetSequenceForm = () => {
    setSequenceForm({
      name: '',
      description: '',
      status: 'draft',
      contacts: 0,
      emailSteps: []
    });
  };

  const handleAddEmailStep = () => {
    setSequenceForm(prev => ({
      ...prev,
      emailSteps: [
        ...prev.emailSteps,
        {
          delayDays: prev.emailSteps.length === 0 ? 0 : 3,
          subject: '',
          body: ''
        }
      ]
    }));
  };

  const handleRemoveEmailStep = (index: number) => {
    setSequenceForm(prev => ({
      ...prev,
      emailSteps: prev.emailSteps.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateEmailStep = (index: number, field: keyof EmailStep, value: any) => {
    setSequenceForm(prev => ({
      ...prev,
      emailSteps: prev.emailSteps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleApplyTemplate = (index: number, templateType: string) => {
    const templates: Record<string, { subject: string; body: string }> = {
      intro: {
        subject: 'Quick question about {{company}}',
        body: `Hi {{firstName}},\n\nI came across {{company}} and was impressed by [specific aspect].\n\nI work with companies like yours to [value proposition]. Would you be open to a quick 15-minute call to discuss how we might help {{company}} [achieve specific goal]?\n\nBest regards,\n{{senderName}}`
      },
      'follow-up': {
        subject: 'Following up on my previous email',
        body: `Hi {{firstName}},\n\nI wanted to follow up on my previous email. I know you're busy, so I'll keep this brief.\n\nI believe we can help {{company}} [specific benefit]. Would you have 10 minutes this week to explore this?\n\nLooking forward to hearing from you.\n\nBest,\n{{senderName}}`
      },
      'value-prop': {
        subject: 'How we helped [Similar Company] increase revenue by 40%',
        body: `Hi {{firstName}},\n\nI wanted to share a quick case study that might be relevant to {{company}}.\n\nWe recently helped [Similar Company] achieve [specific results] by [specific approach].\n\nI think we could deliver similar results for {{company}}. Would you like to see the full case study?\n\nBest,\n{{senderName}}`
      },
      'case-study': {
        subject: 'Case Study: [Similar Company] Success Story',
        body: `Hi {{firstName}},\n\nThought you might find this interesting.\n\nWe recently worked with [Similar Company] in your industry to [solve problem]. The results:\n• [Metric 1]\n• [Metric 2]\n• [Metric 3]\n\nI'd love to show you how we could achieve similar results for {{company}}.\n\nWant to learn more?\n\nBest,\n{{senderName}}`
      },
      demo: {
        subject: 'Quick demo for {{company}}?',
        body: `Hi {{firstName}},\n\nI'd love to give you a personalized 15-minute demo of how our solution can help {{company}} [achieve specific goal].\n\nHow does [day/time] work for you?\n\nI'll keep it focused on your specific needs and show you exactly how we can [deliver value].\n\nBest,\n{{senderName}}`
      },
      breakup: {
        subject: 'Should I close your file?',
        body: `Hi {{firstName}},\n\nI've reached out a few times but haven't heard back. I completely understand - timing might not be right.\n\nBefore I close your file, I wanted to check one last time:\n\nIs this still a priority for {{company}}, or should I follow up in a few months?\n\nEither way, I appreciate your time.\n\nBest,\n{{senderName}}`
      }
    };

    const template = templates[templateType];
    if (template) {
      handleUpdateEmailStep(index, 'subject', template.subject);
      handleUpdateEmailStep(index, 'body', template.body);
      toast.success('Template applied!');
    }
  };

  const handleEditSequence = (sequence: Sequence) => {
    setEditingSequence(sequence);
    setSequenceForm({
      name: sequence.name,
      description: sequence.description || '',
      status: sequence.status,
      contacts: sequence.contacts,
      emailSteps: sequence.emailSteps || []
    });
    setShowSequenceDialog(true);
  };

  const handleSaveSequence = async () => {
    if (!selectedBusiness?.id || !sequenceForm.name.trim() || sequenceForm.emailSteps.length === 0) {
      toast.error('Please fill in required fields and add at least one email step');
      return;
    }

    // Validate email steps
    for (let i = 0; i < sequenceForm.emailSteps.length; i++) {
      const step = sequenceForm.emailSteps[i];
      if (!step.subject.trim() || !step.body.trim()) {
        toast.error(`Email step ${i + 1} is incomplete. Please fill in subject and body.`);
        return;
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const isEditing = !!editingSequence;
      const endpoint = isEditing
        ? `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/sequences/update`
        : `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/sequences/create`;

      const sequenceData = {
        name: sequenceForm.name,
        description: sequenceForm.description,
        status: sequenceForm.status,
        steps: sequenceForm.emailSteps.length,
        contacts: sequenceForm.contacts,
        emailSteps: sequenceForm.emailSteps
      };

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(
          isEditing
            ? {
                businessId: selectedBusiness.id,
                sequenceId: editingSequence.id,
                updates: sequenceData
              }
            : {
                businessId: selectedBusiness.id,
                sequence: sequenceData
              }
        )
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} sequence`);
      }

      const data = await response.json();
      
      if (isEditing) {
        setSequences(prev => prev.map(s => s.id === editingSequence.id ? { ...s, ...sequenceData, emailSteps: sequenceForm.emailSteps, updatedAt: new Date().toISOString() } : s));
        toast.success('Sequence updated successfully!');
      } else {
        setSequences(prev => [...prev, data.sequence]);
        toast.success('Sequence created successfully!');
      }

      setShowSequenceDialog(false);
      setEditingSequence(null);
      resetSequenceForm();
      loadSalesData(); // Refresh all data

    } catch (error) {
      console.error(`❌ Error ${editingSequence ? 'updating' : 'creating'} sequence:`, error);
      toast.error(`Failed to ${editingSequence ? 'update' : 'create'} sequence`);
    }
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/sales/sequences/delete`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness?.id,
            sequenceId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete sequence');
      }

      setSequences(prev => prev.filter(s => s.id !== sequenceId));
      toast.success('Sequence deleted successfully!');
      loadSalesData(); // Refresh analytics

    } catch (error) {
      console.error('❌ Error deleting sequence:', error);
      toast.error('Failed to delete sequence');
    }
  };

  // Load data on mount and business change
  useEffect(() => {
    loadSalesData();
  }, [selectedBusiness?.id]);

  // Data sanitization helpers
  const sanitizeDeal = (deal: any): Deal | null => {
    if (!deal || !deal.id) return null;
    return {
      ...deal,
      stage: deal.stage || 'prospecting',
      value: deal.value || 0,
      probability: deal.probability || 0,
      name: deal.name || 'Unnamed Deal',
      company: deal.company || 'No Company',
      contact: deal.contact || 'No contact',
      email: deal.email || 'No email',
    };
  };

  const sanitizeLead = (lead: any): Lead | null => {
    if (!lead || !lead.id) return null;
    return {
      ...lead,
      name: lead.name || 'Unnamed Lead',
      company: lead.company || 'No Company',
      email: lead.email || 'No email',
      status: lead.status || 'new',
      score: lead.score || 0,
      source: lead.source || 'Unknown',
    };
  };

  // Stage colors - Yellow theme
  const getStageColor = (stage: string | undefined | null) => {
    if (!stage) return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    
    switch (stage) {
      case 'prospecting': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
      case 'qualification': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
      case 'proposal': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
      case 'negotiation': return 'bg-amber-600/10 text-amber-800 dark:text-amber-400';
      case 'closed-won': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'closed-lost': return 'bg-red-500/10 text-red-700 dark:text-red-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    
    switch (status) {
      case 'new': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
      case 'contacted': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
      case 'qualified': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'unqualified': return 'bg-red-500/10 text-red-700 dark:text-red-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  // Helper function to safely format stage name
  const formatStageName = (stage: string | undefined | null) => {
    if (!stage || typeof stage !== 'string') return 'Unknown';
    return stage.replace(/-/g, ' ');
  };

  // Filter customers based on search query
  const filteredCustomers = customerSearchQuery
    ? customers.filter(c => 
        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(customerSearchQuery.toLowerCase())
      )
    : customers;

  // Customer selector component
  const CustomerSelector = ({ 
    value, 
    onChange, 
    onNavigate 
  }: { 
    value?: string; 
    onChange: (customerId: string) => void;
    onNavigate: () => void;
  }) => {
    const selectedCustomer = value ? customers.find(c => c.id === value) : null;

    return (
      <div>
        <Label>Customer *</Label>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Input
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              placeholder="Search customers..."
              style={{ paddingLeft: 'var(--spacing-8)' }}
            />
            <Search className="size-4 text-muted-foreground" style={{ position: 'absolute', left: 'var(--spacing-2)', top: '50%', transform: 'translateY(-50%)' }} />
            {customerSearchQuery && filteredCustomers.length > 0 && (
              <Card style={{ 
                position: 'absolute', 
                top: 'calc(100% + var(--spacing-1))', 
                left: 0, 
                right: 0, 
                zIndex: 50,
                maxHeight: '200px',
                overflow: 'auto',
                borderRadius: 'var(--radius-lg)'
              }}>
                {filteredCustomers.slice(0, 5).map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      onChange(customer.id);
                      setCustomerSearchQuery(customer.name);
                    }}
                    style={{
                      padding: 'var(--spacing-2)',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                    }}
                    className="hover:bg-accent"
                  >
                    <div>{customer.name}</div>
                    {customer.email && <div className="text-muted-foreground" style={{ fontSize: '12px' }}>{customer.email}</div>}
                  </div>
                ))}
              </Card>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onNavigate}
            style={{
              borderRadius: 'var(--radius-lg)',
              gap: 'var(--spacing-2)',
            }}
          >
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Manage</span>
          </Button>
        </div>
        {selectedCustomer && (
          <div style={{ 
            marginTop: 'var(--spacing-2)', 
            padding: 'var(--spacing-2)', 
            background: 'var(--muted)', 
            borderRadius: 'var(--radius-lg)' 
          }}>
            <div>{selectedCustomer.name}</div>
            {selectedCustomer.email && <div className="text-muted-foreground" style={{ fontSize: '12px' }}>{selectedCustomer.email}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-6)',
        marginTop: 'var(--spacing-6)',
        paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom, 0px) + 100px, 100px)' : undefined,
      }}
    >
      {/* Google Connection Status Banner */}
      {isCheckingGoogle ? (
        <Alert style={{ borderRadius: 'var(--radius-lg)' }}>
          <Loader2 className="size-4 animate-spin" />
          <AlertDescription>Checking Google connection...</AlertDescription>
        </Alert>
      ) : googleConnected === false ? (
        <Alert 
          style={{ 
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: isMobile ? 'var(--spacing-2)' : undefined,
          }}
        >
          <Mail className={isMobile ? 'size-3' : 'size-4'} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full" style={{ gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className={isMobile ? 'text-xs' : ''} style={{ color: '#f59e0b', marginBottom: isMobile ? '2px' : undefined }}>Connect Your Google Account</h4>
              <AlertDescription className={isMobile ? 'text-xs' : ''} style={{ fontSize: isMobile ? '10px' : undefined, lineHeight: isMobile ? '1.2' : undefined }}>
                {isMobile 
                  ? 'Gmail, Calendar & Drive integration' 
                  : 'Connect Google Workspace to enable Gmail, Calendar, Drive, and Contacts integration for automated sales workflows. Currently in beta testing - request access to join the testing program.'}
              </AlertDescription>
            </div>
            <div className={isMobile ? 'flex flex-row w-full' : 'flex flex-col sm:flex-row'} style={{ gap: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)', flexShrink: 0 }}>
              {!isMobile ? (
                <Button
                onClick={() => {
                  const supportMessage = encodeURIComponent(
                    'Subject: Request to Join Google Workspace Beta Testing Program\n\n' +
                    'Hi Cofounder+ Team,\n\n' +
                    'I would like to request access to become a beta tester for the Google Workspace integration. ' +
                    'This integration is currently pending production-level verification from Google (4-6 weeks approval process).\n\n' +
                    'My Details:\n' +
                    `User ID: ${user?.id || 'N/A'}\n` +
                    `Email: ${user?.email || 'N/A'}\n\n` +
                    'I understand this is a beta feature and may have limitations. I\'m excited to help test and provide feedback!\n\n' +
                    'Thank you!'
                  );
                  navigate(`/support?message=${supportMessage}`);
                }}
                variant="outline"
                className="whitespace-nowrap"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  borderColor: 'var(--border)',
                  gap: 'var(--spacing-2)',
                }}
              >
                <TestTube2 className="size-4" />
                Join Beta Testing
              </Button>
              ) : (
                <Button
                onClick={() => {
                  const supportMessage = encodeURIComponent(
                    'Subject: Request to Join Google Workspace Beta Testing Program\\n\\n' +
                    'Hi Cofounder+ Team,\\n\\n' +
                    'I would like to request access to become a beta tester for the Google Workspace integration. ' +
                    'This integration is currently pending production-level verification from Google (4-6 weeks approval process).\\n\\n' +
                    'My Details:\\n' +
                    `User ID: ${user?.id || 'N/A'}\\n` +
                    `Email: ${user?.email || 'N/A'}\\n\\n` +
                    'I understand this is a beta feature and may have limitations. I am excited to help test and provide feedback!\\n\\n' +
                    'Thank you!'
                  );
                  navigate(`/support?message=${supportMessage}`);
                }}
                variant="outline"
                className="whitespace-nowrap"
                size="sm"
                style={{
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                  borderColor: 'var(--border)',
                  gap: 'var(--spacing-1)',
                  fontSize: '11px',
                  flex: 1,
                }}
              >
                <TestTube2 className="size-3" />
                Join Beta
              </Button>
              )}
              <Button
                onClick={connectGoogle}
                className="whitespace-nowrap"
                size={isMobile ? 'sm' : 'default'}
                style={{
                  padding: isMobile ? 'var(--spacing-1) var(--spacing-2)' : 'var(--spacing-2) var(--spacing-5)',
                  borderRadius: 'var(--radius-lg)',
                  gap: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  color: 'white',
                  border: 'none',
                  fontSize: isMobile ? '11px' : undefined,
                  flex: isMobile ? 1 : undefined,
                }}
              >
                <Mail className={isMobile ? 'size-3' : 'size-4'} />
                {isMobile ? 'Connect' : 'Connect Google Workspace'}
              </Button>
            </div>
          </div>
        </Alert>
      ) : googleConnected && googleUserInfo ? (
        <Alert 
          style={{ 
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: isMobile ? 'var(--spacing-2)' : undefined,
          }}
        >
          <CheckCircle className={isMobile ? 'size-3' : 'size-4'} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full" style={{ gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)' }}>
            <div>
              <h4 className={isMobile ? 'text-sm' : ''} style={{ color: 'var(--color-success)' }}>Google Connected</h4>
              <AlertDescription className={isMobile ? 'text-xs' : ''}>
                {isMobile 
                  ? `${googleUserInfo.email}` 
                  : `Connected as ${googleUserInfo.email} • Gmail, Calendar, Drive & Contacts enabled`}
              </AlertDescription>
            </div>
            <Button
              onClick={disconnectGoogle}
              variant="outline"
              size="sm"
              style={{
                borderRadius: 'var(--radius-lg)',
                gap: 'var(--spacing-2)',
                padding: isMobile ? 'var(--spacing-1) var(--spacing-2)' : undefined,
              }}
            >
              <X className={isMobile ? 'size-3' : 'size-4'} />
              {!isMobile && 'Disconnect'}
            </Button>
          </div>
        </Alert>
      ) : null}

      {/* Analytics Overview */}
      {analytics && (
        <div className={isMobile ? "grid grid-cols-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"} style={{ gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-4)' }}>
          <Card style={{ borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-xl)' }}>
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-4)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={isMobile ? "text-xs text-muted-foreground" : "text-muted-foreground"} style={{ fontSize: isMobile ? '8px' : undefined, lineHeight: isMobile ? '1' : undefined }}>Pipeline Value</p>
                  <h3 style={{ marginTop: isMobile ? '2px' : 'var(--spacing-1)', fontSize: isMobile ? '11px' : undefined }}>
                    ${isMobile ? `${((analytics.pipeline?.totalValue || 0) / 1000).toFixed(0)}k` : (analytics.pipeline?.totalValue || 0).toLocaleString()}
                  </h3>
                </div>
                <DollarSign className={isMobile ? "size-3 text-muted-foreground" : "size-8 text-muted-foreground"} />
              </div>
            </CardHeader>
          </Card>

          <Card style={{ borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-xl)' }}>
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-4)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={isMobile ? "text-xs text-muted-foreground" : "text-muted-foreground"} style={{ fontSize: isMobile ? '8px' : undefined, lineHeight: isMobile ? '1' : undefined }}>Win Rate</p>
                  <h3 style={{ marginTop: isMobile ? '2px' : 'var(--spacing-1)', fontSize: isMobile ? '11px' : undefined }}>
                    {analytics.pipeline.winRate}%
                  </h3>
                </div>
                <Percent className={isMobile ? "size-3 text-muted-foreground" : "size-8 text-muted-foreground"} />
              </div>
            </CardHeader>
          </Card>

          <Card style={{ borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-xl)' }}>
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-4)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={isMobile ? "text-xs text-muted-foreground" : "text-muted-foreground"} style={{ fontSize: isMobile ? '8px' : undefined, lineHeight: isMobile ? '1' : undefined }}>Active Deals</p>
                  <h3 style={{ marginTop: isMobile ? '2px' : 'var(--spacing-1)', fontSize: isMobile ? '11px' : undefined }}>
                    {analytics.pipeline.active}
                  </h3>
                </div>
                <Target className={isMobile ? "size-3 text-muted-foreground" : "size-8 text-muted-foreground"} />
              </div>
            </CardHeader>
          </Card>

          <Card style={{ borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-xl)' }}>
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-1)' : 'var(--spacing-4)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={isMobile ? "text-xs text-muted-foreground" : "text-muted-foreground"} style={{ fontSize: isMobile ? '8px' : undefined, lineHeight: isMobile ? '1' : undefined }}>Total Leads</p>
                  <h3 style={{ marginTop: isMobile ? '2px' : 'var(--spacing-1)', fontSize: isMobile ? '11px' : undefined }}>
                    {analytics.leads.total}
                  </h3>
                </div>
                <Users className={isMobile ? "size-3 text-muted-foreground" : "size-8 text-muted-foreground"} />
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList 
          className="grid w-full grid-cols-5"
          style={{
            background: 'var(--muted)',
            padding: 'var(--spacing-1)',
            borderRadius: 'var(--radius-lg)',
            ...(isMobile && {
              position: 'sticky',
              top: '0',
              zIndex: 10,
              marginBottom: 'var(--spacing-3)'
            })
          }}
        >
          <TabsTrigger 
            value="actions"
            style={{
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Quick Actions</span>
            <span className="sm:hidden">Actions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chat"
            style={{
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Chat</span>
            <span className="sm:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pipeline"
            style={{
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Deals & Leads</span>
            <span className="sm:hidden">Sales</span>
          </TabsTrigger>
          <TabsTrigger 
            value="customers"
            style={{
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Customers</span>
            <span className="sm:hidden">Accts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="sequences"
            style={{
              borderRadius: 'var(--spacing-2)',
            }}
          >
            <span className="hidden sm:inline">Sequences</span>
            <span className="sm:hidden">Email</span>
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
            <SalesChat user={user} />
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" style={{ marginTop: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div className="flex items-center justify-between">
            <h3>Sales Insights</h3>
            <Button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              style={{
                gap: 'var(--spacing-2)',
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                color: 'white',
                border: 'none',
              }}
            >
              {isGeneratingInsights ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Insights (10 credits)
                </>
              )}
            </Button>
          </div>

          {insights ? (
            <Card style={{ borderRadius: 'var(--radius-xl)' }}>
              <CardHeader>
                <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                  <Brain className="size-5" style={{ color: '#f59e0b' }} />
                  Cofounder Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {insights}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert style={{ borderRadius: 'var(--radius-lg)' }}>
              <Sparkles className="size-4" />
              <AlertDescription>
                Click Generate Insights to get analysis of your sales data, trends, and recommendations.
              </AlertDescription>
            </Alert>
          )}

          {/* Automation Reports */}
          <div style={{ marginTop: isMobile ? 'var(--spacing-6)' : 'var(--spacing-8)' }}>
            <AutomationReportsWidget 
              category="sales" 
              categoryColor="var(--chart-1)"
              maxResults={5}
            />
          </div>
        </div>
        </TabsContent>

        {/* Deals & Leads Tab (Merged) */}
        <TabsContent value="pipeline" style={{ marginTop: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        {isMobile ? (
          /* Mobile: Side-by-side layout */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {/* Mobile Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
              <div className="flex items-center justify-between">
                <h4 style={{ fontSize: '14px' }}>Deals</h4>
                <Button 
                  onClick={() => setShowDealDialog(true)} 
                  size="sm"
                  style={{ 
                    padding: '4px 8px',
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '11px'
                  }}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <h4 style={{ fontSize: '14px' }}>Leads</h4>
                <Button 
                  onClick={() => setShowLeadDialog(true)} 
                  size="sm"
                  style={{ 
                    padding: '4px 8px',
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '11px'
                  }}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>

            {/* Mobile Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)', alignItems: 'start' }}>
              {/* Deals Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {pipeline.length === 0 ? (
                  <div style={{ 
                    padding: 'var(--spacing-2)', 
                    background: 'var(--muted)', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '10px',
                    textAlign: 'center'
                  }}>
                    No deals
                  </div>
                ) : (
                  pipeline.filter(deal => deal && deal.id).map(deal => (
                    <Card key={deal.id} style={{ 
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        padding: 'var(--spacing-1)',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <div className="flex items-start justify-between" style={{ gap: '2px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '11px',
                              fontWeight: 'var(--font-weight-semibold)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {deal.name || 'Unnamed'}
                            </div>
                            <div style={{ 
                              fontSize: '9px',
                              color: 'var(--muted-foreground)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {deal.company || 'No Company'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDeal(deal)}
                              style={{ padding: '2px', height: 'auto', minWidth: 'auto' }}
                            >
                              <Edit className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDeal(deal.id)}
                              style={{ padding: '2px', height: 'auto', minWidth: 'auto' }}
                            >
                              <Trash2 className="size-3" style={{ color: 'var(--destructive)' }} />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: 'var(--spacing-1)' }}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '2px',
                          fontSize: '9px'
                        }}>
                          <Badge 
                            className={getStageColor(deal.stage)} 
                            style={{ 
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 4px',
                              fontSize: '8px',
                              width: 'fit-content'
                            }}
                          >
                            {formatStageName(deal.stage)}
                          </Badge>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'var(--muted-foreground)' }}>Value</span>
                            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                              ${(deal.value || 0) >= 1000 ? `${((deal.value || 0) / 1000).toFixed(0)}k` : (deal.value || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'var(--muted-foreground)' }}>Prob</span>
                            <span>{deal.probability || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Leads Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {leads.length === 0 ? (
                  <div style={{ 
                    padding: 'var(--spacing-2)', 
                    background: 'var(--muted)', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '10px',
                    textAlign: 'center'
                  }}>
                    No leads
                  </div>
                ) : (
                  leads.filter(lead => lead && lead.id).map(lead => (
                    <Card key={lead.id} style={{ 
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        padding: 'var(--spacing-1)',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        <div className="flex items-start justify-between" style={{ gap: '2px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontSize: '11px',
                              fontWeight: 'var(--font-weight-semibold)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {lead.name || 'Unnamed'}
                            </div>
                            <div style={{ 
                              fontSize: '9px',
                              color: 'var(--muted-foreground)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {lead.company || 'No Company'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLead(lead)}
                              style={{ padding: '2px', height: 'auto', minWidth: 'auto' }}
                            >
                              <Edit className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLead(lead.id)}
                              style={{ padding: '2px', height: 'auto', minWidth: 'auto' }}
                            >
                              <Trash2 className="size-3" style={{ color: 'var(--destructive)' }} />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: 'var(--spacing-1)' }}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '2px',
                          fontSize: '9px'
                        }}>
                          <Badge 
                            className={getStatusColor(lead.status)} 
                            style={{ 
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 4px',
                              fontSize: '8px',
                              width: 'fit-content'
                            }}
                          >
                            {lead.status}
                          </Badge>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'var(--muted-foreground)' }}>Source</span>
                            <span style={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '60px'
                            }}>
                              {lead.source || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'var(--muted-foreground)' }}>Score</span>
                            <span>{lead.score || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: Stacked layout */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            {/* Deals Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div className="flex items-center justify-between">
                <h3>Deals</h3>
                <Button onClick={() => setShowDealDialog(true)} style={{ gap: 'var(--spacing-2)', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: 'white', border: 'none' }}>
                  <Plus className="size-4" />
                  Add Deal
                </Button>
              </div>

              {pipeline.length === 0 ? (
                <Alert style={{ borderRadius: 'var(--radius-lg)' }}>
                  <AlertCircle className="size-4" />
                  <AlertDescription>
                    No deals in pipeline yet. Create your first deal to get started!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                  {pipeline.filter(deal => deal && deal.id).map(deal => (
                    <Card key={deal.id} style={{ borderRadius: 'var(--radius-xl)' }}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{deal.name || 'Unnamed Deal'}</CardTitle>
                            <CardDescription>{deal.company || 'No Company'}</CardDescription>
                          </div>
                          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                            <Badge className={getStageColor(deal.stage)} style={{ borderRadius: 'var(--radius-lg)' }}>
                              {formatStageName(deal.stage)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDeal(deal)}
                              style={{ padding: 'var(--spacing-1)' }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDeal(deal.id)}
                              style={{ padding: 'var(--spacing-1)' }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Value</span>
                            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                              ${(deal.value || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Probability</span>
                            <span>{deal.probability || 0}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Contact</span>
                            <span>{deal.contact || 'No contact'}</span>
                          </div>
                          {deal.expectedCloseDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Close Date</span>
                              <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Leads Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div className="flex items-center justify-between">
                <h3>Leads</h3>
                <Button onClick={() => setShowLeadDialog(true)} style={{ gap: 'var(--spacing-2)', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: 'white', border: 'none' }}>
                  <Plus className="size-4" />
                  Add Lead
                </Button>
              </div>

              {leads.length === 0 ? (
                <Alert style={{ borderRadius: 'var(--radius-lg)' }}>
                  <AlertCircle className="size-4" />
                  <AlertDescription>
                    No leads yet. Add your first lead to get started!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
                  {leads.filter(lead => lead && lead.id).map(lead => (
                    <Card key={lead.id} style={{ borderRadius: 'var(--radius-xl)' }}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{lead.name || 'Unnamed Lead'}</CardTitle>
                            <CardDescription>{lead.company || 'No Company'}</CardDescription>
                          </div>
                          <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                            <Badge className={getStatusColor(lead.status)} style={{ borderRadius: 'var(--radius-lg)' }}>
                              {lead.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLead(lead)}
                              style={{ padding: 'var(--spacing-1)' }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLead(lead.id)}
                              style={{ padding: 'var(--spacing-1)' }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <span>{lead.email || 'No email'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Source</span>
                            <span>{lead.source || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Score</span>
                            <span>{lead.score || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

          {/* Create/Edit Deal Dialog */}
          <Dialog open={showDealDialog} onOpenChange={(open) => {
            setShowDealDialog(open);
            if (!open) {
              setEditingDeal(null);
              setNewDeal({
                name: '',
                company: '',
                customerId: '',
                value: 0,
                stage: 'prospecting',
                probability: 10,
                contact: '',
                email: '',
                phone: '',
                notes: ''
              });
              setCustomerSearchQuery('');
            }
          }}>
            <DialogContent style={{ borderRadius: 'var(--radius-xl)' }}>
              <DialogHeader>
                <DialogTitle>{editingDeal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
                <DialogDescription>
                  {editingDeal ? 'Update the deal details' : 'Add a new opportunity to your sales pipeline'}
                </DialogDescription>
              </DialogHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div>
                  <Label htmlFor="deal-name">Deal Name *</Label>
                  <Input
                    id="deal-name"
                    value={newDeal.name || ''}
                    onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                    placeholder="Enter deal name"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <CustomerSelector
                  value={newDeal.customerId}
                  onChange={(customerId) => setNewDeal({ ...newDeal, customerId })}
                  onNavigate={() => {
                    setShowDealDialog(false);
                    setActiveTab('customers');
                  }}
                />
                <div>
                  <Label htmlFor="deal-value">Deal Value</Label>
                  <Input
                    id="deal-value"
                    type="number"
                    value={newDeal.value || 0}
                    onChange={(e) => setNewDeal({ ...newDeal, value: parseFloat(e.target.value) })}
                    placeholder="0"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="deal-contact">Contact Person</Label>
                  <Input
                    id="deal-contact"
                    value={newDeal.contact || ''}
                    onChange={(e) => setNewDeal({ ...newDeal, contact: e.target.value })}
                    placeholder="Contact name"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="deal-email">Email</Label>
                  <Input
                    id="deal-email"
                    type="email"
                    value={newDeal.email || ''}
                    onChange={(e) => setNewDeal({ ...newDeal, email: e.target.value })}
                    placeholder="email@example.com"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="deal-notes">Notes</Label>
                  <Textarea
                    id="deal-notes"
                    value={newDeal.notes || ''}
                    onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                    placeholder="Add notes about this deal"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <Button 
                  onClick={editingDeal ? handleUpdateDeal : handleCreateDeal}
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create/Edit Lead Dialog */}
          <Dialog open={showLeadDialog} onOpenChange={(open) => {
            setShowLeadDialog(open);
            if (!open) {
              setEditingLead(null);
              setNewLead({
                name: '',
                company: '',
                customerId: '',
                email: '',
                phone: '',
                source: 'website',
                score: 50,
                status: 'new',
                notes: ''
              });
              setCustomerSearchQuery('');
            }
          }}>
            <DialogContent style={{ borderRadius: 'var(--radius-xl)' }}>
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                <DialogDescription>
                  {editingLead ? 'Update the lead details' : 'Add a new lead to your pipeline'}
                </DialogDescription>
              </DialogHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div>
                  <Label htmlFor="lead-name">Name *</Label>
                  <Input
                    id="lead-name"
                    value={newLead.name || ''}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="Lead name"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <CustomerSelector
                  value={newLead.customerId}
                  onChange={(customerId) => setNewLead({ ...newLead, customerId })}
                  onNavigate={() => {
                    setShowLeadDialog(false);
                    setActiveTab('customers');
                  }}
                />
                <div>
                  <Label htmlFor="lead-email">Email *</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    value={newLead.email || ''}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="email@example.com"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="lead-source">Source</Label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
                    <SelectTrigger style={{ marginTop: 'var(--spacing-2)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lead-notes">Notes</Label>
                  <Textarea
                    id="lead-notes"
                    value={newLead.notes || ''}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    placeholder="Add notes about this lead"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <Button 
                  onClick={editingLead ? handleUpdateLead : handleCreateLead}
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" style={{ marginTop: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div className="flex items-center justify-between">
            <h3>Customers</h3>
            <Button onClick={() => setShowCustomerDialog(true)} style={{ gap: 'var(--spacing-2)', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: 'white', border: 'none' }}>
              <Plus className="size-4" />
              Add Customer
            </Button>
          </div>

          {customers.length === 0 ? (
            <Alert style={{ borderRadius: 'var(--radius-lg)' }}>
              <AlertCircle className="size-4" />
              <AlertDescription>
                No customers yet. Add your first customer to get started!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
              {customers.map(customer => (
                <Card key={customer.id} style={{ borderRadius: 'var(--radius-xl)' }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                          <Building2 className="size-5" />
                          {customer.name}
                        </CardTitle>
                        {customer.industry && (
                          <CardDescription>{customer.industry}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          style={{ padding: 'var(--spacing-1)' }}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          style={{ padding: 'var(--spacing-1)' }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                      {customer.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Email</span>
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.website && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Website</span>
                          <span>{customer.website}</span>
                        </div>
                      )}
                      {customer.size && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Company Size</span>
                          <span>{customer.size}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Customer Dialog */}
          <Dialog open={showCustomerDialog} onOpenChange={(open) => {
            setShowCustomerDialog(open);
            if (!open) {
              setEditingCustomer(null);
              setNewCustomer({
                name: '',
                email: '',
                phone: '',
                website: '',
                industry: '',
                size: '',
                notes: ''
              });
            }
          }}>
            <DialogContent style={{ borderRadius: 'var(--radius-xl)' }}>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                <DialogDescription>
                  {editingCustomer ? 'Update the customer details' : 'Add a new customer for account management'}
                </DialogDescription>
              </DialogHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div>
                  <Label htmlFor="customer-name">Company Name *</Label>
                  <Input
                    id="customer-name"
                    value={newCustomer.name || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="Company name"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={newCustomer.email || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="email@example.com"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                    value={newCustomer.phone || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-website">Website</Label>
                  <Input
                    id="customer-website"
                    value={newCustomer.website || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, website: e.target.value })}
                    placeholder="https://example.com"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-industry">Industry</Label>
                  <Input
                    id="customer-industry"
                    value={newCustomer.industry || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-size">Company Size</Label>
                  <Select value={newCustomer.size} onValueChange={(value) => setNewCustomer({ ...newCustomer, size: value })}>
                    <SelectTrigger style={{ marginTop: 'var(--spacing-2)' }}>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer-notes">Notes</Label>
                  <Textarea
                    id="customer-notes"
                    value={newCustomer.notes || ''}
                    onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                    placeholder="Add notes about this customer"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <Button 
                  onClick={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </TabsContent>

        {/* Sequences Tab */}
        <TabsContent value="sequences" style={{ marginTop: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <div className="flex items-center justify-between">
            <h3>Email Sequences</h3>
            <Button 
              onClick={() => {
                setEditingSequence(null);
                resetSequenceForm();
                setShowSequenceDialog(true);
              }} 
              style={{ gap: 'var(--spacing-2)', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: 'white', border: 'none' }}
            >
              <Plus className="size-4" />
              New Sequence
            </Button>
          </div>

          {sequences.length === 0 ? (
            <Alert style={{ borderRadius: 'var(--radius-lg)' }}>
              <AlertCircle className="size-4" />
              <AlertDescription>
                No sequences yet. Create your first email sequence!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
              {sequences.map(sequence => (
                <Card key={sequence.id} style={{ borderRadius: 'var(--radius-xl)' }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{sequence.name}</CardTitle>
                        <CardDescription>{sequence.description || 'No description'}</CardDescription>
                      </div>
                      <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                        <Badge 
                          style={{ 
                            borderRadius: 'var(--radius-lg)',
                            background: sequence.status === 'active' ? 'rgba(245, 158, 11, 0.2)' : 'var(--muted)',
                            color: sequence.status === 'active' ? '#f59e0b' : 'var(--muted-foreground)'
                          }}
                        >
                          {sequence.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSequence(sequence)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSequence(sequence.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Steps</span>
                        <span>{sequence.steps}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Contacts</span>
                        <span>{sequence.contacts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sent</span>
                        <span>{sequence.stats.sent}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Opened</span>
                        <span>{sequence.stats.opened}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Sequence Dialog */}
          <Dialog open={showSequenceDialog} onOpenChange={setShowSequenceDialog}>
            <DialogContent style={{ borderRadius: 'var(--radius-xl)', maxWidth: '700px' }}>
              <DialogHeader>
                <DialogTitle>{editingSequence ? 'Edit Sequence' : 'Create New Sequence'}</DialogTitle>
                <DialogDescription>
                  Build an automated email sequence for outreach
                </DialogDescription>
              </DialogHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div>
                  <Label>Sequence Name *</Label>
                  <Input
                    value={sequenceForm.name}
                    onChange={(e) => setSequenceForm({ ...sequenceForm, name: e.target.value })}
                    placeholder="e.g., Cold Outreach Sequence"
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={sequenceForm.description}
                    onChange={(e) => setSequenceForm({ ...sequenceForm, description: e.target.value })}
                    placeholder="Describe this sequence..."
                    style={{ marginTop: 'var(--spacing-2)' }}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-3)' }}>
                    <Label>Email Steps ({sequenceForm.emailSteps.length})</Label>
                    <Button
                      onClick={handleAddEmailStep}
                      size="sm"
                      style={{ 
                        gap: 'var(--spacing-2)',
                        background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <Plus className="size-4" />
                      Add Step
                    </Button>
                  </div>
                  
                  {sequenceForm.emailSteps.map((step, index) => (
                    <Card key={index} style={{ marginBottom: 'var(--spacing-3)', borderRadius: 'var(--radius-lg)' }}>
                      <CardHeader style={{ padding: 'var(--spacing-3)' }}>
                        <div className="flex items-center justify-between">
                          <h4>Step {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEmailStep(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent style={{ padding: 'var(--spacing-3)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                          <div>
                            <Label>Delay (days)</Label>
                            <Input
                              type="number"
                              value={step.delayDays}
                              onChange={(e) => handleUpdateEmailStep(index, 'delayDays', parseInt(e.target.value))}
                              style={{ marginTop: 'var(--spacing-1)' }}
                            />
                          </div>
                          <div>
                            <Label>Subject *</Label>
                            <Input
                              value={step.subject}
                              onChange={(e) => handleUpdateEmailStep(index, 'subject', e.target.value)}
                              placeholder="Email subject"
                              style={{ marginTop: 'var(--spacing-1)' }}
                            />
                          </div>
                          <div>
                            <Label>Body *</Label>
                            <Textarea
                              value={step.body}
                              onChange={(e) => handleUpdateEmailStep(index, 'body', e.target.value)}
                              placeholder="Email body"
                              rows={4}
                              style={{ marginTop: 'var(--spacing-1)' }}
                            />
                          </div>
                          <div>
                            <Label>Quick Templates</Label>
                            <div className="flex flex-wrap" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApplyTemplate(index, 'intro')}
                              >
                                Intro
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApplyTemplate(index, 'follow-up')}
                              >
                                Follow-up
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApplyTemplate(index, 'value-prop')}
                              >
                                Value Prop
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApplyTemplate(index, 'breakup')}
                              >
                                Breakup
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button 
                  onClick={handleSaveSequence}
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', 
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {editingSequence ? 'Update Sequence' : 'Create Sequence'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CofounderSalesNew;
