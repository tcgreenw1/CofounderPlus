import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Bot, 
  Sparkles, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  Clock,
  CheckCircle,
  Settings,
  Bell,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Database,
  Rocket,
  Brain,
  Workflow,
  Activity,
  Package,
  GitBranch,
  Flag,
  LineChart,
  UserCheck,
  TestTube,
  Award,
  Map,
  Layers,
  Crosshair,
  ShieldCheck,
  FileSearch,
  ListChecks,
  Clipboard,
  CalendarDays,
  Boxes,
  RefreshCw,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Play,
  ChevronDown,
  ChevronUp,
  Save,
  Wand2,
  Keyboard,
  GripVertical,
  Upload,
  Megaphone,
  Tag as TagIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { DraggableRoadmapItem } from './DraggableRoadmapItem';
import { ResearchFileUpload } from './ResearchFileUpload';
import { TagInput } from './TagInput';
import { useKeyboardShortcuts, KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { ProductResearch } from './ProductResearch';
import { EcommerceProducts } from './EcommerceProducts';
import { useCredits } from '../../hooks/useCredits';
import { ProductChat } from './ProductChat';
import { useIsMobile } from '../ui/use-mobile';
import { AutomationReportsWidget } from '../AutomationReportsWidget';
import { useBusiness } from '../BusinessContext';

interface CofounderProductProps {
  user?: any;
  userData?: any;
  productContent?: React.ReactNode;
}

// Type definitions
interface ProductInsight {
  id: string;
  type: 'opportunity' | 'metric' | 'competitive' | 'user-feedback' | 'technical';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  action: string;
  status: 'new' | 'in-review' | 'actioned' | 'dismissed';
}

interface ProductMetric {
  metric: string;
  value: string;
  trend: string;
  status: 'up' | 'down' | 'stable';
}

interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  status: 'in-progress' | 'planned' | 'planning' | 'backlog' | 'completed';
  progress: number;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  team: string;
  confidence: number;
  tags?: string[];
}

interface UserResearchSession {
  id: string;
  type: 'interview' | 'survey' | 'usability' | 'focus-group';
  title: string;
  description?: string;
  company?: string;
  responses?: number;
  participants?: number;
  date: string;
  insights: number;
  status: 'completed' | 'analyzing' | 'scheduled' | 'in-progress';
  notes?: string;
}

interface AutomatedTask {
  id: string;
  task: string;
  description?: string;
  schedule: string;
  nextRun: string;
  status: 'active' | 'paused';
  lastRun: string;
}

// Default mock data as fallback
const defaultMetrics: ProductMetric[] = [
  { metric: 'Active Users (MAU)', value: '0', trend: '+0%', status: 'up' },
  { metric: 'Feature Adoption', value: '0%', trend: '+0%', status: 'up' },
  { metric: 'User Satisfaction', value: '0/5', trend: '+0', status: 'up' },
  { metric: 'Churn Rate', value: '0%', trend: '0%', status: 'down' }
];

export function CofounderProduct({ user, userData, productContent }: CofounderProductProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { deductCredits, checkCredits, credits, isLoading: isLoadingCredits } = useCredits();
  
  // State management
  const [insights, setInsights] = useState<ProductInsight[]>([]);
  const [hasLoadedInsights, setHasLoadedInsights] = useState(false);
  const [metrics, setMetrics] = useState<ProductMetric[]>(defaultMetrics);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [userResearch, setUserResearch] = useState<UserResearchSession[]>([]);
  const [automatedTasks, setAutomatedTasks] = useState<AutomatedTask[]>([]);
  const [customers, setCustomers] = useState<Array<{id: string; name: string}>>([]);
  
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isPrioritizingRoadmap, setIsPrioritizingRoadmap] = useState(false);
  const [isAnalyzingResearch, setIsAnalyzingResearch] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [showRoadmapDialog, setShowRoadmapDialog] = useState(false);
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [showGuidanceConfirm, setShowGuidanceConfirm] = useState(false);
  const [editingRoadmapItem, setEditingRoadmapItem] = useState<RoadmapItem | null>(null);
  const [editingResearchSession, setEditingResearchSession] = useState<UserResearchSession | null>(null);
  const [editingTask, setEditingTask] = useState<AutomatedTask | null>(null);
  
  // Expandable sections
  const [expandedInsights, setExpandedInsights] = useState(false);
  const [expandedInsightCards, setExpandedInsightCards] = useState<Set<string>>(new Set());
  const [expandedResearch, setExpandedResearch] = useState(false);
  const [expandedRoadmap, setExpandedRoadmap] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(false);
  
  // Keyboard shortcuts & file uploads
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [researchFiles, setResearchFiles] = useState<Record<string, any[]>>({});
  const [roadmapTags, setRoadmapTags] = useState<string[]>([]);
  const [researchTags, setResearchTags] = useState<string[]>([]);
  
  // Form states
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    description: '',
    status: 'backlog' as RoadmapItem['status'],
    priority: 'medium' as RoadmapItem['priority'],
    dueDate: '',
    team: 'Product',
    confidence: 50,
    progress: 0,
    tags: [] as string[]
  });
  
  const [researchForm, setResearchForm] = useState({
    type: 'interview' as UserResearchSession['type'],
    title: '',
    description: '',
    company: '',
    participants: 0,
    responses: 0,
    date: new Date().toLocaleDateString(),
    status: 'scheduled' as UserResearchSession['status'],
    notes: ''
  });
  
  const [taskForm, setTaskForm] = useState({
    task: '',
    description: '',
    schedule: 'Daily',
    nextRun: 'Tomorrow',
    status: 'active' as AutomatedTask['status'],
    department: 'Product' as 'Product' | 'Marketing' | 'Sales' | 'Finance' | 'HR'
  });
  
  const [metricsForm, setMetricsForm] = useState<ProductMetric[]>(defaultMetrics);
  
  // Get business ID from BusinessContext (not userData which is never passed)
  const { selectedBusiness } = useBusiness();
  const businessId = selectedBusiness?.id || 'default';
  
  // Don't allow data fetching until we have a real business ID (not 'default')
  const hasValidBusinessId = businessId && businessId !== 'default';
  
  // Initialize accessToken state to handle cases where it's not immediately available
  const [sessionToken, setSessionToken] = useState<string | null>(user?.accessToken || null);
  
  // Effect to get fresh session token on mount
  useEffect(() => {
    const getSessionToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setSessionToken(session.access_token);
        } else if (user?.accessToken) {
          setSessionToken(user.accessToken);
        } else {
          // Fallback to localStorage if available
          const localToken = localStorage.getItem('access_token');
          if (localToken) setSessionToken(localToken);
        }
      } catch (e) {
        console.warn('Error getting session:', e);
      }
    };
    
    getSessionToken();
  }, [user]);

  // API call helper - always gets fresh token
  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    // Get fresh session token
    const { data: { session } } = await supabase.auth.getSession();
    const freshToken = session?.access_token;
    
    if (!freshToken) {
      throw new Error('Authentication required - please sign in again');
    }
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09${endpoint}`,
      {
        ...options,
        headers: {
          'Authorization': `Bearer ${freshToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  };
  
  // Fetch functions
  const fetchInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    console.log('🎯 CLIENT: Fetching insights for businessId:', businessId);
    console.log('🎯 CLIENT: Current user ID:', user?.id);
    console.log('🎯 CLIENT: Expected KV key would be:', `business:${user?.id}:${businessId}:product:insights`);
    try {
      const data = await makeApiCall(`/product-intelligence/insights?businessId=${businessId}`);
      console.log('🎯 CLIENT: Fetch insights response:', {
        success: data.success,
        insightsCount: data.insights?.length,
        isArray: Array.isArray(data.insights),
        fullResponse: data
      });
      if (data.success) {
        console.log('✅ CLIENT: Fetched insights from backend:', data.insights);
        const fetchedInsights = Array.isArray(data.insights) ? data.insights : [];
        setInsights(fetchedInsights);
        setHasLoadedInsights(true);
        console.log('✅ CLIENT: Insights state updated with', fetchedInsights.length, 'insights');
      } else {
        console.error('❌ CLIENT: Fetch insights failed:', data.error);
        setInsights([]);
        setHasLoadedInsights(true);
      }
    } catch (error: any) {
      console.error('❌ CLIENT: Error fetching insights:', error);
      setInsights([]);
      setHasLoadedInsights(true);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [businessId]);
  
  const fetchMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const data = await makeApiCall(`/product-intelligence/metrics?businessId=${businessId}`);
      if (data.success && data.metrics && data.metrics.length > 0) {
        setMetrics(data.metrics);
        setMetricsForm(data.metrics);
      }
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };
  
  const fetchRoadmapItems = async () => {
    setIsLoadingRoadmap(true);
    try {
      const data = await makeApiCall(`/product-roadmap/items?businessId=${businessId}`);
      if (data.success) {
        setRoadmapItems(data.items || []);
      }
    } catch (error: any) {
      console.error('Error fetching roadmap items:', error);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };
  
  const fetchUserResearch = async () => {
    setIsLoadingResearch(true);
    try {
      const data = await makeApiCall(`/user-research/sessions?businessId=${businessId}`);
      if (data.success) {
        setUserResearch(data.sessions || []);
      }
    } catch (error: any) {
      console.error('Error fetching user research:', error);
    } finally {
      setIsLoadingResearch(false);
    }
  };
  
  const fetchAutomatedTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const data = await makeApiCall(`/product-automation/tasks?businessId=${businessId}`);
      if (data.success) {
        setAutomatedTasks(data.tasks || []);
      }
    } catch (error: any) {
      console.error('Error fetching automated tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };
  
  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      // Use accounts endpoint as customers
      const data = await makeApiCall(`/sales/accounts?businessId=${businessId}`);
      if (data.success) {
        // Only store id and name for dropdown
        setCustomers((data.accounts || []).map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  // Fetch all data on component mount and when dependencies change
  useEffect(() => {
    console.log('🔄 useEffect triggered - Checking dependencies:', { 
      hasUser: !!user, 
      hasSessionToken: !!sessionToken,
      businessId,
      hasValidBusinessId,
      userData: userData
    });
    
    // Add detailed logging
    if (!user) console.log('❌ BLOCKING: No user');
    if (!sessionToken) console.log('❌ BLOCKING: No sessionToken');
    if (!hasValidBusinessId) console.log('❌ BLOCKING: Invalid businessId (current value:', businessId, ')');
    
    if (user && sessionToken && hasValidBusinessId) {
      console.log('✅ ALL CHECKS PASSED - Loading product intelligence data for business:', businessId);
      fetchInsights();
      fetchMetrics();
      fetchRoadmapItems();
      fetchUserResearch();
      fetchAutomatedTasks();
      fetchCustomers();
    } else {
      console.log('⚠️ useEffect skipped - Missing dependencies');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionToken, businessId, hasValidBusinessId]);
  
  // Also reload data when component becomes visible (e.g., after navigation or refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && sessionToken && hasValidBusinessId) {
        console.log('🔄 Page became visible, reloading insights...');
        fetchInsights();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionToken, businessId]);
  
  // Generate AI insights
  const handleCofounderMagic = async () => {
    if (isGeneratingInsights) return;
    
    // Debug logging
    console.log('🎯 Generate Insights - Credit Check:', {
      credits,
      isLoadingCredits,
      required: 10,
      hasEnough: credits >= 10
    });
    
    // Wait for credits to load
    if (isLoadingCredits) {
      toast.error('Loading credit balance, please wait...');
      return;
    }
    
    // Show confirmation dialog
    setShowGuidanceConfirm(true);
  };
  
  const confirmGenerateInsights = async () => {
    setShowGuidanceConfirm(false);
    
    // Check credits (10 credits for insights generation)
    if (!checkCredits(10)) {
      return;
    }
    
    setIsGeneratingInsights(true);
    toast.loading('Cofounder is analyzing your product data...');
    
    try {
      
      const context = {
        metrics: metrics,
        roadmap: roadmapItems.slice(0, 5),
        userResearch: userResearch.slice(0, 3),
        businessInfo: {
          name: userData?.business_name || 'Your Business',
          industry: userData?.industry || 'Technology'
        }
      };
      
      console.log('🎯 CLIENT: Calling generate insights API...', { businessId, contextKeys: Object.keys(context) });
      console.log('🎯 CLIENT: Current user ID:', user?.id);
      console.log('🎯 CLIENT: Expected KV key would be:', `business:${user?.id}:${businessId}:product:insights`);
      
      const data = await makeApiCall(`/product-intelligence/generate?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ context, focus: 'general' }),
      });
      
      console.log('🎯 CLIENT: Generate insights API response:', { 
        success: data.success, 
        insightsCount: data.insights?.length,
        error: data.error,
        fullResponse: data
      });
      
      if (data.success) {
        // Deduct credits after successful generation
        await deductCredits(10, 'Product Insights Generation');
        
        toast.dismiss();
        toast.success(`Generated ${data.insights.length} new product insights!`);
        console.log('🎯 CLIENT: Successfully generated insights, refetching from backend...');
        
        // Refetch insights from backend to ensure we have the persisted version
        await fetchInsights();
        console.log('🎯 CLIENT: Insights refetched from backend after generation');
      } else {
        throw new Error(data.error || 'Failed to generate insights');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to generate insights: ${error.message}`);
      console.error('Error generating insights:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };
  
  // AI Prioritize Roadmap
  const handleAIPrioritizeRoadmap = async () => {
    if (roadmapItems.length === 0) {
      toast.error('Add some roadmap items first');
      return;
    }
    
    // Check and deduct credits (3 credits for roadmap prioritization)
    if (!checkCredits(3)) {
      return;
    }
    
    setIsPrioritizingRoadmap(true);
    toast.loading('Cofounder is analyzing and prioritizing your roadmap...');
    
    try {
      // Deduct credits before API call
      const success = await deductCredits(3, 'Roadmap Prioritization');
      if (!success) {
        setIsPrioritizingRoadmap(false);
        return;
      }
      
      const context = {
        businessContext: {
          name: userData?.business_name || 'Your Business',
          industry: userData?.industry || 'Technology'
        },
        metrics: metrics
      };
      
      const data = await makeApiCall(`/product-roadmap/ai-prioritize?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ items: roadmapItems, context }),
      });
      
      if (data.success && data.recommendations) {
        toast.dismiss();
        toast.success('Roadmap prioritized by AI! Check the updated priorities.');
        
        // Apply AI recommendations to roadmap items
        const updatedItems = roadmapItems.map(item => {
          const recommendation = data.recommendations.find((r: any) => r.id === item.id);
          if (recommendation) {
            return {
              ...item,
              priority: recommendation.recommendedPriority,
              confidence: recommendation.confidence
            };
          }
          return item;
        });
        
        // Save updated items to backend
        for (const item of updatedItems) {
          await makeApiCall(`/product-roadmap/items/${item.id}?businessId=${businessId}`, {
            method: 'PUT',
            body: JSON.stringify(item),
          });
        }
        
        // Refetch roadmap items from backend to ensure we have the persisted version
        await fetchRoadmapItems();
      } else {
        throw new Error(data.error || 'Failed to prioritize roadmap');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to prioritize roadmap: ${error.message}`);
      console.error('Error prioritizing roadmap:', error);
    } finally {
      setIsPrioritizingRoadmap(false);
    }
  };
  
  // AI Analyze Research
  const handleAnalyzeResearch = async (sessionId: string) => {
    const session = userResearch.find(s => s.id === sessionId);
    if (!session || !session.notes) {
      toast.error('Add some notes to this research session first');
      return;
    }
    
    // Check and deduct credits (4 credits for research analysis)
    if (!checkCredits(4)) {
      return;
    }
    
    setIsAnalyzingResearch(true);
    toast.loading('Cofounder is analyzing research data...');
    
    try {
      // Deduct credits before API call
      const success = await deductCredits(4, 'User Research Analysis');
      if (!success) {
        setIsAnalyzingResearch(false);
        return;
      }
      const data = await makeApiCall(`/user-research/analyze?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ 
          sessionId: sessionId,
          notes: session.notes,
          researchData: {
            type: session.type,
            title: session.title,
            participants: session.participants,
            responses: session.responses
          }
        }),
      });
      
      if (data.success) {
        toast.dismiss();
        toast.success(`Extracted ${data.insights.length} insights from research!`);
        
        // Show insights in a nice format
        const insightSummary = data.insights.map((i: any) => 
          `• ${i.category}: ${i.insight}`
        ).join('\n');
        
        // Refetch research sessions from backend to ensure we have the persisted version
        await fetchUserResearch();
      } else {
        throw new Error(data.error || 'Failed to analyze research');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to analyze research: ${error.message}`);
      console.error('Error analyzing research:', error);
    } finally {
      setIsAnalyzingResearch(false);
    }
  };
  
  // Save metrics
  const handleSaveMetrics = async () => {
    try {
      const data = await makeApiCall(`/product-intelligence/metrics?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify({ metrics: metricsForm }),
      });
      
      if (data.success) {
        toast.success('Metrics updated successfully!');
        // Refetch metrics from backend to ensure we have the persisted version
        await fetchMetrics();
        setShowMetricsDialog(false);
      }
    } catch (error: any) {
      toast.error(`Failed to update metrics: ${error.message}`);
    }
  };
  
  // Roadmap CRUD operations
  const handleCreateRoadmapItem = async () => {
    if (!roadmapForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    try {
      const data = await makeApiCall(`/product-roadmap/items?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify(roadmapForm),
      });
      
      if (data.success) {
        toast.success('Roadmap item created successfully!');
        // Refetch roadmap items from backend to ensure we have the persisted version
        await fetchRoadmapItems();
        setShowRoadmapDialog(false);
        resetRoadmapForm();
      }
    } catch (error: any) {
      toast.error(`Failed to create roadmap item: ${error.message}`);
    }
  };
  
  const handleUpdateRoadmapItem = async () => {
    if (!editingRoadmapItem) return;
    
    try {
      const data = await makeApiCall(`/product-roadmap/items/${editingRoadmapItem.id}?businessId=${businessId}`, {
        method: 'PUT',
        body: JSON.stringify(roadmapForm),
      });
      
      if (data.success) {
        toast.success('Roadmap item updated successfully!');
        // Refetch roadmap items from backend to ensure we have the persisted version
        await fetchRoadmapItems();
        setShowRoadmapDialog(false);
        setEditingRoadmapItem(null);
        resetRoadmapForm();
      }
    } catch (error: any) {
      toast.error(`Failed to update roadmap item: ${error.message}`);
    }
  };
  
  const handleDeleteRoadmapItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roadmap item?')) return;
    
    try {
      const data = await makeApiCall(`/product-roadmap/items/${id}?businessId=${businessId}`, {
        method: 'DELETE',
      });
      
      if (data.success) {
        toast.success('Roadmap item deleted successfully!');
        // Refetch roadmap items from backend to ensure we have the persisted version
        await fetchRoadmapItems();
      }
    } catch (error: any) {
      toast.error(`Failed to delete roadmap item: ${error.message}`);
    }
  };
  
  // Research CRUD operations
  const handleCreateResearchSession = async () => {
    if (!researchForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    try {
      const data = await makeApiCall(`/user-research/sessions?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify(researchForm),
      });
      
      if (data.success) {
        toast.success('Research session created successfully!');
        // Refetch research sessions from backend to ensure we have the persisted version
        await fetchUserResearch();
        setShowResearchDialog(false);
        resetResearchForm();
      }
    } catch (error: any) {
      toast.error(`Failed to create research session: ${error.message}`);
    }
  };
  
  const handleUpdateResearchSession = async () => {
    if (!editingResearchSession) return;
    
    try {
      const data = await makeApiCall(`/user-research/sessions/${editingResearchSession.id}?businessId=${businessId}`, {
        method: 'PUT',
        body: JSON.stringify(researchForm),
      });
      
      if (data.success) {
        toast.success('Research session updated successfully!');
        // Refetch research sessions from backend to ensure we have the persisted version
        await fetchUserResearch();
        setShowResearchDialog(false);
        setEditingResearchSession(null);
        resetResearchForm();
      }
    } catch (error: any) {
      toast.error(`Failed to update research session: ${error.message}`);
    }
  };
  
  // Task CRUD operations
  const handleCreateTask = async () => {
    if (!taskForm.task.trim()) {
      toast.error('Please enter a task name');
      return;
    }
    
    try {
      const data = await makeApiCall(`/product-automation/tasks?businessId=${businessId}`, {
        method: 'POST',
        body: JSON.stringify(taskForm),
      });
      
      if (data.success) {
        toast.success('Automated task created successfully!');
        // Refetch automated tasks from backend to ensure we have the persisted version
        await fetchAutomatedTasks();
        setShowTaskDialog(false);
        resetTaskForm();
      }
    } catch (error: any) {
      toast.error(`Failed to create task: ${error.message}`);
    }
  };
  
  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      const data = await makeApiCall(`/product-automation/tasks/${editingTask.id}?businessId=${businessId}`, {
        method: 'PUT',
        body: JSON.stringify(taskForm),
      });
      
      if (data.success) {
        toast.success('Task updated successfully!');
        // Refetch automated tasks from backend to ensure we have the persisted version
        await fetchAutomatedTasks();
        setShowTaskDialog(false);
        setEditingTask(null);
        resetTaskForm();
      }
    } catch (error: any) {
      toast.error(`Failed to update task: ${error.message}`);
    }
  };
  
  const handleExecuteTask = async (taskId: string) => {
    try {
      toast.loading('Executing task...');
      const data = await makeApiCall(`/product-automation/execute/${taskId}?businessId=${businessId}`, {
        method: 'POST',
      });
      
      if (data.success) {
        toast.dismiss();
        toast.success('Task executed successfully!');
        // Refetch automated tasks from backend to ensure we have the persisted version
        await fetchAutomatedTasks();
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Failed to execute task: ${error.message}`);
    }
  };
  
  // Insight actions
  const handleDismissInsight = async (insightId: string) => {
    try {
      const data = await makeApiCall(`/product-intelligence/insights/${insightId}?businessId=${businessId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'dismissed' }),
      });
      
      if (data.success) {
        toast.success('Insight dismissed');
        // Refetch insights from backend to ensure we have the persisted version
        await fetchInsights();
      }
    } catch (error: any) {
      toast.error(`Failed to dismiss insight: ${error.message}`);
    }
  };
  
  const toggleInsightCardExpanded = (insightId: string) => {
    setExpandedInsightCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };
  
  // Drag and drop handler
  const handleMoveRoadmapItem = (dragIndex: number, hoverIndex: number) => {
    const updatedItems = [...roadmapItems];
    const [removed] = updatedItems.splice(dragIndex, 1);
    updatedItems.splice(hoverIndex, 0, removed);
    
    // Update order property
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setRoadmapItems(reorderedItems);
    
    // Optionally save the new order to backend
    // This would be done in a debounced fashion in production
  };
  
  // Form reset functions
  const resetRoadmapForm = () => {
    setRoadmapForm({
      title: '',
      description: '',
      status: 'backlog',
      priority: 'medium',
      dueDate: '',
      team: 'Product',
      confidence: 50,
      progress: 0,
      tags: []
    });
  };
  
  const resetResearchForm = () => {
    setResearchForm({
      type: 'interview',
      title: '',
      description: '',
      company: '',
      participants: 0,
      responses: 0,
      date: new Date().toLocaleDateString(),
      status: 'scheduled',
      notes: ''
    });
  };
  
  const resetTaskForm = () => {
    setTaskForm({
      task: '',
      description: '',
      schedule: 'Daily',
      nextRun: 'Tomorrow',
      status: 'active'
    });
  };
  
  // Edit handlers
  const handleEditRoadmapItem = (item: RoadmapItem) => {
    setEditingRoadmapItem(item);
    setRoadmapForm({
      title: item.title,
      description: item.description || '',
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate,
      team: item.team,
      confidence: item.confidence,
      progress: item.progress,
      tags: item.tags || []
    });
    setShowRoadmapDialog(true);
  };
  
  const handleEditResearchSession = (session: UserResearchSession) => {
    setEditingResearchSession(session);
    setResearchForm({
      type: session.type,
      title: session.title,
      description: session.description || '',
      company: session.company || '',
      participants: session.participants || 0,
      responses: session.responses || 0,
      date: session.date,
      status: session.status,
      notes: session.notes || ''
    });
    setShowResearchDialog(true);
  };
  
  const handleEditTask = (task: AutomatedTask) => {
    setEditingTask(task);
    setTaskForm({
      task: task.task,
      description: task.description || '',
      schedule: task.schedule,
      nextRun: task.nextRun,
      status: task.status
    });
    setShowTaskDialog(true);
  };
  
  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return '#3b82f6';
      case 'planned': return '#8b5cf6';
      case 'planning': return '#6366f1';
      case 'backlog': return '#64748b';
      default: return '#64748b';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'var(--destructive)';
      case 'medium': return '#f59e0b';
      case 'low': return '#64748b';
      default: return '#64748b';
    }
  };
  
  const refreshAllData = () => {
    fetchInsights();
    fetchMetrics();
    fetchRoadmapItems();
    fetchUserResearch();
    fetchAutomatedTasks();
    toast.success('Refreshing all product data...');
  };
  
  // Keyboard shortcuts - defined after all handlers  
  const handleShowHelp = () => setShowKeyboardHelp(true);
  const handleNewRoadmap = () => {
    resetRoadmapForm();
    setEditingRoadmapItem(null);
    setShowRoadmapDialog(true);
  };
  const handleOpenSettings = () => navigate('/cofounder-settings');
  
  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: handleShowHelp,
    },
    {
      key: 'g',
      ctrlKey: true,
      description: 'Generate AI insights',
      action: handleCofounderMagic,
      enabled: !isGeneratingInsights,
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'Refresh all data',
      action: refreshAllData,
    },
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      description: 'New roadmap item',
      action: handleNewRoadmap,
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open settings',
      action: handleOpenSettings,
    },
  ];
  
  useKeyboardShortcuts(keyboardShortcuts);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-6)',
        marginTop: 'var(--spacing-6)',
      }}
    >
      {/* Tabs for Chat, Quick Actions, Research, and Products */}
      <Tabs defaultValue="quick-actions" style={{ width: '100%' }}>
        <TabsList 
          className="grid w-full grid-cols-4 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
          style={{
            width: '100%',
            maxWidth: '1000px',
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
            className="data-[state=active]:bg-white/50 data-[state=active]:text-purple-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Actions</span>
            <span className="sm:hidden">Actions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chat"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-purple-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Chat</span>
            <span className="sm:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger 
            value="research"
            className="data-[state=active]:bg-white/50 data-[state=active]:text-purple-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Research</span>
            <span className="sm:hidden">Research</span>
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className="data-[state=active]:bg-white/50 data-[state=active]:text-purple-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{ 
              position: 'relative',
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <span className="hidden sm:inline">Products</span>
            <span className="sm:hidden">Products</span>
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
            <ProductChat user={user} />
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" style={{ marginTop: 'var(--spacing-4)' }}>
          {/* Need product strategy guidance? - Moved to top with credit notice */}
          <Card 
            style={{ 
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(124, 58, 237, 0.03))',
              borderColor: 'rgba(139, 92, 246, 0.2)',
              marginBottom: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)',
            }}
          >
            <CardContent style={{ padding: 'var(--spacing-5)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between" style={{ gap: 'var(--spacing-4)' }}>
                <div>
                  <h3 className="text-lg flex items-center" style={{ gap: 'var(--spacing-2)', fontWeight: 'var(--font-weight-semibold)' }}>
                    <Rocket className="size-5" style={{ color: '#8b5cf6' }} />
                    Need product strategy guidance?
                  </h3>
                  <p className="text-sm text-muted-foreground" style={{ marginTop: 'var(--spacing-1)' }}>
                    Let Cofounder analyze your product data and provide strategic recommendations
                  </p>
                  <Badge
                    variant="secondary"
                    style={{
                      marginTop: 'var(--spacing-2)',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Costs 10 credits
                  </Badge>
                </div>
                <Button
                  onClick={handleCofounderMagic}
                  disabled={isGeneratingInsights || isLoadingCredits}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 whitespace-nowrap"
                  style={{
                    padding: 'var(--spacing-3) var(--spacing-5)',
                    borderRadius: 'var(--radius-lg)',
                    gap: 'var(--spacing-2)',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  {isLoadingCredits ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : isGeneratingInsights ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-5" />
                      <span>Get Guidance</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Intelligence - Full Width */}
          <Card style={{ borderRadius: 'var(--radius-lg)' }}>
            <CardHeader style={{ padding: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)' }}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)', fontSize: isMobile ? '1rem' : undefined }}>
                  <Brain className={isMobile ? "size-4" : "size-5"} style={{ color: '#8b5cf6' }} />
                  <span className="hidden sm:inline">Product Intelligence</span>
                  <span className="sm:hidden">Insights</span>
                </CardTitle>
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                  <Badge style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'none', fontSize: isMobile ? '0.7rem' : '0.75rem', padding: isMobile ? 'var(--spacing-1) var(--spacing-2)' : undefined }}>
                    {insights.length}
                  </Badge>
                  {insights.length > 5 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedInsights(!expandedInsights)}
                      style={{
                        height: '24px',
                        width: '24px',
                        padding: 0,
                      }}
                    >
                      {expandedInsights ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription className="hidden sm:block">AI-generated opportunities and recommendations</CardDescription>
            </CardHeader>
            <CardContent style={{ 
              paddingLeft: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)',
              paddingRight: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)',
              paddingBottom: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)',
              paddingTop: 0 
            }}>
              {isLoadingInsights ? (
                <div className="flex items-center justify-center" style={{ padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-8)' }}>
                  <Loader2 className={isMobile ? "size-6 animate-spin" : "size-8 animate-spin"} style={{ color: '#8b5cf6' }} />
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center" style={{ padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-8)' }}>
                  <Lightbulb className={isMobile ? "size-8 mx-auto" : "size-12 mx-auto"} style={{ color: 'var(--muted-foreground)', marginBottom: isMobile ? 'var(--spacing-2)' : 'var(--spacing-4)' }} />
                  <p style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', color: 'var(--muted-foreground)' }}>
                    No insights yet. Click "Generate Insights" to let Cofounder analyze your product data.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)', width: '100%', overflow: 'hidden' }}>
                  <AnimatePresence>
                    {insights.slice(0, expandedInsights ? insights.length : 5).map((insight) => {
                      const isExpanded = expandedInsightCards.has(insight.id);
                      return (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        whileHover={{ scale: isMobile ? 1 : 1.01 }}
                        onClick={() => toggleInsightCardExpanded(insight.id)}
                        style={{
                          padding: isMobile ? 'var(--spacing-2)' : 'var(--spacing-4)',
                          borderRadius: isMobile ? 'var(--radius-md)' : 'var(--radius-lg)',
                          border: '1px solid var(--border)',
                          background: 'var(--card)',
                          cursor: 'pointer',
                          width: '100%',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-3)', width: '100%', overflow: 'hidden' }}>
                          <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-2)', width: '100%' }}>
                            <div className="flex items-start" style={{ gap: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)', flex: 1, minWidth: 0, maxWidth: '100%' }}>
                              {insight.type === 'opportunity' && <Lightbulb className={isMobile ? "size-3 mt-0.5 flex-shrink-0" : "size-4 mt-0.5 flex-shrink-0"} style={{ color: '#f59e0b' }} />}
                              {insight.type === 'metric' && <BarChart3 className={isMobile ? "size-3 mt-0.5 flex-shrink-0" : "size-4 mt-0.5 flex-shrink-0"} style={{ color: '#3b82f6' }} />}
                              {insight.type === 'competitive' && <Target className={isMobile ? "size-3 mt-0.5 flex-shrink-0" : "size-4 mt-0.5 flex-shrink-0"} style={{ color: '#8b5cf6' }} />}
                              {insight.type === 'user-feedback' && <MessageSquare className={isMobile ? "size-3 mt-0.5 flex-shrink-0" : "size-4 mt-0.5 flex-shrink-0"} style={{ color: '#10b981' }} />}
                              {insight.type === 'technical' && <Database className={isMobile ? "size-3 mt-0.5 flex-shrink-0" : "size-4 mt-0.5 flex-shrink-0"} style={{ color: '#ef4444' }} />}
                              <div style={{ flex: 1, minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                                <p style={{ 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem', 
                                  fontWeight: 'var(--font-weight-semibold)', 
                                  wordWrap: 'break-word', 
                                  overflowWrap: 'break-word',
                                  width: '100%',
                                  whiteSpace: 'normal'
                                }}>
                                  {insight.title}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline"
                              style={{
                                borderColor: insight.priority === 'high' ? 'var(--destructive)' : insight.priority === 'medium' ? '#f59e0b' : '#64748b',
                                color: insight.priority === 'high' ? 'var(--destructive)' : insight.priority === 'medium' ? '#f59e0b' : '#64748b',
                                fontSize: '0.625rem',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground" style={{ 
                            fontSize: isMobile ? '0.7rem' : '0.75rem', 
                            wordWrap: 'break-word', 
                            overflowWrap: 'break-word',
                            width: '100%',
                            whiteSpace: 'normal',
                            paddingLeft: isMobile ? 'calc(12px + var(--spacing-1))' : 'calc(16px + var(--spacing-2))'
                          }}>
                            {insight.description}
                          </p>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'stretch' : 'center', 
                          justifyContent: 'space-between',
                          gap: isMobile ? 'var(--spacing-2)' : 'var(--spacing-4)',
                          width: '100%',
                          overflow: 'hidden'
                        }}>
                          <p className="text-xs text-muted-foreground" style={{ flexShrink: 0 }}>{insight.timestamp}</p>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap',
                            alignItems: 'center', 
                            gap: 'var(--spacing-2)',
                            width: isMobile ? '100%' : 'auto'
                          }}>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismissInsight(insight.id);
                              }}
                              style={{
                                height: '28px',
                                fontSize: '0.75rem',
                                padding: 'var(--spacing-1) var(--spacing-2)',
                                borderRadius: 'var(--radius)',
                                flexShrink: 0
                              }}
                            >
                              <X className="size-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                height: isExpanded ? 'auto' : '28px',
                                minHeight: '28px',
                                fontSize: '0.75rem',
                                padding: 'var(--spacing-1) var(--spacing-3)',
                                borderRadius: 'var(--radius)',
                                flex: isMobile ? '1 1 auto' : '0 1 auto',
                                minWidth: 0,
                                overflow: isExpanded ? 'visible' : 'hidden',
                                textOverflow: isExpanded ? 'clip' : 'ellipsis',
                                whiteSpace: isExpanded ? 'normal' : 'nowrap'
                              }}
                            >
                              <span style={{ 
                                overflow: isExpanded ? 'visible' : 'hidden', 
                                textOverflow: isExpanded ? 'clip' : 'ellipsis',
                                display: 'inline-block',
                                maxWidth: isExpanded ? 'none' : (isMobile ? '100%' : '200px'),
                                wordWrap: isExpanded ? 'break-word' : 'normal',
                                overflowWrap: isExpanded ? 'break-word' : 'normal'
                              }}>
                                {insight.action}
                              </span>
                              <ArrowRight className="size-3 ml-1" style={{ flexShrink: 0 }} />
                            </Button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{
                            marginTop: 'var(--spacing-2)',
                            padding: 'var(--spacing-3)',
                            borderRadius: 'var(--radius)',
                            background: 'var(--muted)',
                            fontSize: '0.75rem',
                            color: 'var(--muted-foreground)'
                          }}>
                            <p style={{ marginBottom: 'var(--spacing-1)' }}><strong>Action Required:</strong></p>
                            <p style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                              {insight.action}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two Column Layout (currently empty but available for future use) */}
          <div 
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)', marginTop: isMobile ? 'var(--spacing-4)' : 'var(--spacing-6)' }}
          >
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)' }}>
              {/* Left column content */}
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 'var(--spacing-3)' : 'var(--spacing-4)' }}>
              {/* Product Roadmap and Automated Tasks removed per user request */}
            </div>
          </div>

      {/* Metrics Dialog */}
      <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
        <DialogContent style={{ maxWidth: '500px' }}>
          <DialogHeader>
            <DialogTitle>Edit Product Metrics</DialogTitle>
            <DialogDescription>
              Update your product metrics to track performance
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {metricsForm.map((metric, index) => (
              <div key={index}>
                <Label>{metric.metric}</Label>
                <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                  <Input
                    value={metric.value}
                    onChange={(e) => {
                      const newMetrics = [...metricsForm];
                      newMetrics[index].value = e.target.value;
                      setMetricsForm(newMetrics);
                    }}
                    placeholder="Value"
                  />
                  <Input
                    value={metric.trend}
                    onChange={(e) => {
                      const newMetrics = [...metricsForm];
                      newMetrics[index].trend = e.target.value;
                      setMetricsForm(newMetrics);
                    }}
                    placeholder="Trend (e.g., +10%)"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMetricsDialog(false);
                setMetricsForm(metrics);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMetrics}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              <Save className="size-4 mr-2" />
              Save Metrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roadmap Dialog */}
      <Dialog open={showRoadmapDialog} onOpenChange={setShowRoadmapDialog}>
        <DialogContent style={{ maxWidth: '500px' }}>
          <DialogHeader>
            <DialogTitle>{editingRoadmapItem ? 'Edit Roadmap Item' : 'Add Roadmap Item'}</DialogTitle>
            <DialogDescription>
              {editingRoadmapItem ? 'Update your roadmap item details' : 'Create a new roadmap item for your product'}
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label htmlFor="roadmap-title">Title *</Label>
              <Input
                id="roadmap-title"
                value={roadmapForm.title}
                onChange={(e) => setRoadmapForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mobile App MVP"
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="roadmap-description">Description</Label>
              <Textarea
                id="roadmap-description"
                value={roadmapForm.description}
                onChange={(e) => setRoadmapForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the roadmap item..."
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="roadmap-status">Status</Label>
                <Select
                  value={roadmapForm.status}
                  onValueChange={(value: RoadmapItem['status']) => setRoadmapForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="roadmap-status" style={{ marginTop: 'var(--spacing-2)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="roadmap-priority">Priority</Label>
                <Select
                  value={roadmapForm.priority}
                  onValueChange={(value: RoadmapItem['priority']) => setRoadmapForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger id="roadmap-priority" style={{ marginTop: 'var(--spacing-2)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="roadmap-duedate">Due Date</Label>
                <Input
                  id="roadmap-duedate"
                  value={roadmapForm.dueDate}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  placeholder="e.g., Q2 2025"
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
              <div>
                <Label htmlFor="roadmap-team">Team</Label>
                <Input
                  id="roadmap-team"
                  value={roadmapForm.team}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, team: e.target.value }))}
                  placeholder="e.g., Engineering"
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="roadmap-progress">Progress: {roadmapForm.progress}%</Label>
              <input
                id="roadmap-progress"
                type="range"
                min="0"
                max="100"
                value={roadmapForm.progress}
                onChange={(e) => setRoadmapForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                style={{ 
                  width: '100%',
                  marginTop: 'var(--spacing-2)',
                  accentColor: '#3b82f6'
                }}
              />
            </div>
            <div>
              <Label htmlFor="roadmap-confidence">Confidence: {roadmapForm.confidence}%</Label>
              <input
                id="roadmap-confidence"
                type="range"
                min="0"
                max="100"
                value={roadmapForm.confidence}
                onChange={(e) => setRoadmapForm(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                style={{ 
                  width: '100%',
                  marginTop: 'var(--spacing-2)',
                  accentColor: '#8b5cf6'
                }}
              />
            </div>
            <div>
              <Label htmlFor="roadmap-tags">Tags</Label>
              <div style={{ marginTop: 'var(--spacing-2)' }}>
                <TagInput
                  tags={roadmapForm.tags}
                  onChange={(tags) => setRoadmapForm(prev => ({ ...prev, tags }))}
                  placeholder="Add tags (press Enter)"
                  suggestions={['mvp', 'feature', 'bug-fix', 'enhancement', 'ui-ux', 'backend', 'frontend', 'mobile', 'web', 'api']}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRoadmapDialog(false);
                setEditingRoadmapItem(null);
                resetRoadmapForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingRoadmapItem ? handleUpdateRoadmapItem : handleCreateRoadmapItem}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              {editingRoadmapItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Research Dialog */}
      <Dialog open={showResearchDialog} onOpenChange={setShowResearchDialog}>
        <DialogContent style={{ maxWidth: '500px' }}>
          <DialogHeader>
            <DialogTitle>{editingResearchSession ? 'Edit Research Session' : 'Add Research Session'}</DialogTitle>
            <DialogDescription>
              {editingResearchSession ? 'Update research session details' : 'Create a new user research session'}
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label htmlFor="research-title">Title *</Label>
              <Input
                id="research-title"
                value={researchForm.title}
                onChange={(e) => setResearchForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Enterprise User Interview"
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="research-type">Type</Label>
                <Select
                  value={researchForm.type}
                  onValueChange={(value: UserResearchSession['type']) => setResearchForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="research-type" style={{ marginTop: 'var(--spacing-2)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="usability">Usability Test</SelectItem>
                    <SelectItem value="focus-group">Focus Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="research-status">Status</Label>
                <Select
                  value={researchForm.status}
                  onValueChange={(value: UserResearchSession['status']) => setResearchForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="research-status" style={{ marginTop: 'var(--spacing-2)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="analyzing">Analyzing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="research-company">Company / Customer</Label>
                {customers.length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/operations/sales')}
                    style={{
                      height: 'auto',
                      padding: 'var(--spacing-1) var(--spacing-2)',
                      fontSize: 'var(--text-xs, 12px)',
                      color: 'var(--primary, #2F80FF)'
                    }}
                  >
                    Add Customer
                  </Button>
                )}
              </div>
              {customers.length > 0 ? (
                <Select
                  value={researchForm.company}
                  onValueChange={(value) => setResearchForm(prev => ({ ...prev, company: value }))}
                >
                  <SelectTrigger id="research-company" style={{ marginTop: 'var(--spacing-2)' }}>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__custom__">Enter custom company...</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.name}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="research-company"
                  value={researchForm.company}
                  onChange={(e) => setResearchForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g., TechCorp Inc."
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              )}
              {researchForm.company === '__custom__' && customers.length > 0 && (
                <Input
                  value=""
                  onChange={(e) => setResearchForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Enter company name..."
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              )}
            </div>
            <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="research-participants">Participants</Label>
                <Input
                  id="research-participants"
                  type="number"
                  value={researchForm.participants}
                  onChange={(e) => setResearchForm(prev => ({ ...prev, participants: parseInt(e.target.value) || 0 }))}
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
              <div>
                <Label htmlFor="research-date">Date</Label>
                <Input
                  id="research-date"
                  value={researchForm.date}
                  onChange={(e) => setResearchForm(prev => ({ ...prev, date: e.target.value }))}
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="research-notes">Notes</Label>
              <Textarea
                id="research-notes"
                value={researchForm.notes}
                onChange={(e) => setResearchForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add your research notes and findings..."
                rows={4}
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label>Attachments</Label>
              <div style={{ marginTop: 'var(--spacing-2)' }}>
                <ResearchFileUpload
                  sessionId={editingResearchSession?.id || 'new'}
                  files={researchFiles[editingResearchSession?.id || 'new'] || []}
                  onFilesChange={(files) => {
                    const sessionId = editingResearchSession?.id || 'new';
                    setResearchFiles(prev => ({ ...prev, [sessionId]: files }));
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResearchDialog(false);
                setEditingResearchSession(null);
                resetResearchForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingResearchSession ? handleUpdateResearchSession : handleCreateResearchSession}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              {editingResearchSession ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent style={{ maxWidth: '500px' }}>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Automated Task' : 'Add Automated Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update automated task configuration' : 'Create an automated task for any department'}
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div>
              <Label htmlFor="task-department">Department *</Label>
              <Select
                value={taskForm.department}
                onValueChange={(value: 'Product' | 'Marketing' | 'Sales' | 'Finance' | 'HR') => setTaskForm(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger id="task-department" style={{ marginTop: 'var(--spacing-2)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-name">Task Name *</Label>
              <Input
                id="task-name"
                value={taskForm.task}
                onChange={(e) => setTaskForm(prev => ({ ...prev, task: e.target.value }))}
                placeholder="e.g., Weekly Metrics Report"
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this task does..."
                style={{ marginTop: 'var(--spacing-2)' }}
              />
            </div>
            <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-3)' }}>
              <div>
                <Label htmlFor="task-schedule">Schedule</Label>
                <Input
                  id="task-schedule"
                  value={taskForm.schedule}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, schedule: e.target.value }))}
                  placeholder="e.g., Daily, 9:00 AM"
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
              <div>
                <Label htmlFor="task-nextrun">Next Run</Label>
                <Input
                  id="task-nextrun"
                  value={taskForm.nextRun}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, nextRun: e.target.value }))}
                  placeholder="e.g., Tomorrow"
                  style={{ marginTop: 'var(--spacing-2)' }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={taskForm.status}
                onValueChange={(value: AutomatedTask['status']) => setTaskForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="task-status" style={{ marginTop: 'var(--spacing-2)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTaskDialog(false);
                setEditingTask(null);
                resetTaskForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingTask ? handleUpdateTask : handleCreateTask}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

          {/* Automation Reports */}
          <div style={{ marginTop: isMobile ? 'var(--spacing-6)' : 'var(--spacing-8)' }}>
            <AutomationReportsWidget 
              category="product" 
              categoryColor="var(--chart-4)"
              maxResults={5}
            />
          </div>

        </TabsContent>

        {/* Product Research Tab */}
        <TabsContent value="research" style={{ marginTop: 'var(--spacing-4)' }}>
          <ProductResearch 
            user={user} 
            userData={userData}
            userResearch={userResearch}
            isLoadingResearch={isLoadingResearch}
            expandedResearch={expandedResearch}
            setExpandedResearch={setExpandedResearch}
            isAnalyzingResearch={isAnalyzingResearch}
            onAddSession={() => {
              resetResearchForm();
              setEditingResearchSession(null);
              setShowResearchDialog(true);
            }}
            onEditSession={handleEditResearchSession}
            onAnalyzeResearch={handleAnalyzeResearch}
          />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" style={{ marginTop: 'var(--spacing-4)' }}>
          {productContent || (
            hasValidBusinessId && user?.id ? (
              <EcommerceProducts businessId={businessId} userId={user.id} />
            ) : (
              <Card style={{ borderRadius: 'var(--radius-lg)' }}>
                <CardContent style={{ padding: 'var(--spacing-6)' }}>
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Products</h3>
                    <p className="text-muted-foreground">Your product catalog will appear here</p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Get Guidance Confirmation Dialog */}
      <Dialog open={showGuidanceConfirm} onOpenChange={setShowGuidanceConfirm}>
        <DialogContent 
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            maxWidth: '32rem',
          }}
        >
          <DialogHeader>
            <DialogTitle 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                fontSize: '1.25rem',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--card-foreground)',
              }}
            >
              <div
                style={{
                  padding: 'var(--spacing-2)',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles className="size-5" style={{ color: 'var(--primary-foreground)' }} />
              </div>
              Get Cofounder Product Guidance
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--muted-foreground)', marginTop: 'var(--spacing-2)' }}>
              Cofounder will analyze your product data and provide comprehensive insights
            </DialogDescription>
          </DialogHeader>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            {/* Benefits List */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--muted)',
              }}
            >
              <p style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--card-foreground)', marginBottom: 'var(--spacing-1)' }}>
                You'll receive:
              </p>
              {[
                'Strategic recommendations',
                'Market opportunities',
                'Competitive insights',
                'Growth suggestions',
                'Technical improvements'
              ].map((benefit, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <div 
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--card-foreground)' }}>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Cost Information */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-soft)',
                border: '1px solid var(--primary)',
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)' }}>
                Credit Cost:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <Sparkles className="size-4" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '1rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary)' }}>
                  10 credits
                </span>
              </div>
            </div>
          </div>

          <DialogFooter style={{ marginTop: 'var(--spacing-4)', gap: 'var(--spacing-3)' }}>
            <Button
              variant="outline"
              onClick={() => setShowGuidanceConfirm(false)}
              style={{
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmGenerateInsights}
              disabled={isLoadingCredits || credits < 10}
              style={{
                borderRadius: 'var(--radius-md)',
                fontWeight: 'var(--font-weight-medium)',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--chart-2) 100%)',
                color: 'var(--primary-foreground)',
              }}
            >
              <Sparkles className="size-4" />
              Confirm & Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
        shortcuts={keyboardShortcuts}
      />

      {/* Keyboard Shortcuts Help Button */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-6)',
          right: 'var(--spacing-6)',
          zIndex: 40,
        }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowKeyboardHelp(true)}
          style={{
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            padding: 0,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            background: 'var(--card)',
          }}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="size-5" />
        </Button>
      </div>
    </div>
  );
}
