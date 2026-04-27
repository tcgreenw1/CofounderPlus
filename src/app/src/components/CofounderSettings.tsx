/**
 * Cofounder Settings Page
 * Configure AGI automation settings across all business functions
 * Uses design system CSS variables for consistent styling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  ChevronLeft,
  ChevronDown,
  Bot, 
  Zap, 
  AlertTriangle, 
  Bell,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  ListTodo,
  Mail,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
  Info,
  Activity,
  Target,
  Users,
  Lightbulb,
  BarChart3,
  TrendingDown,
  FileText,
  Receipt,
  Briefcase,
  PieChart,
  Award,
  UserCheck,
  Search,
  Play,
  Loader2,
  Edit2
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { useBusiness } from './BusinessContext';
import { toast } from 'sonner@2.0.3';
import { AutomationInputDialog } from './AutomationInputDialog';
import { useIsMobile } from './ui/use-mobile';
import { isIOS } from '../utils/platformDetection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AutomationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  category: 'product' | 'sales' | 'marketing' | 'finance' | 'hr' | 'general';
  creditCost: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  configuration?: Record<string, any>; // Stores the user's input from the form
}

export function CofounderSettings() {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [agiEnabled, setAgiEnabled] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [testingAutomation, setTestingAutomation] = useState<string | null>(null);
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationSetting | null>(null);
  const [dialogMode, setDialogMode] = useState<'test' | 'configure' | 'edit'>('test'); // Track dialog purpose
  const [isScheduleInfoExpanded, setIsScheduleInfoExpanded] = useState(false);

  // Comprehensive automation settings across all departments
  const [automations, setAutomations] = useState<AutomationSetting[]>([
    // PRODUCT AUTOMATIONS
    {
      id: 'product-market-monitoring',
      title: 'Market & Trend Monitoring',
      description: 'Automatically scans industry news, competitor activity, and market trends. Compiles a digest of relevant updates, new technologies, and shifting customer needs. Identifies emerging opportunities and threats. Delivered as a formatted report in your Cofounder chat.',
      icon: Search,
      enabled: false,
      category: 'product',
      creditCost: '60',
      frequency: 'Weekly'
    },
    {
      id: 'feature-prioritization',
      title: 'Feature Prioritization',
      description: 'Automatically reviews all roadmap features and scores them on Impact, Effort, Strategic Fit, and Urgency. Reorders your backlog and flags features that should be promoted or deprioritized. Creates tasks for top priorities. Eliminates weekly prioritization meetings.',
      icon: Target,
      enabled: true,
      category: 'product',
      creditCost: '50',
      frequency: 'Weekly'
    },
    {
      id: 'user-feedback-synthesis',
      title: 'User Feedback Synthesis',
      description: 'Scans all customer conversations, support tickets, reviews, and feedback channels. Identifies recurring themes, extracts feature requests, calculates sentiment scores, and spots breaking issues. Creates summary report with top actionable insights and recommended next steps.',
      icon: Lightbulb,
      enabled: false,
      category: 'product',
      creditCost: '40',
      frequency: 'Weekly'
    },
    {
      id: 'roadmap-health-check',
      title: 'Roadmap Health Check',
      description: 'Analyzes your roadmap for bottlenecks, overdue items, dependency conflicts, and resource constraints. Suggests timeline adjustments, identifies at-risk deliverables, and recommends scope changes. Keeps your roadmap realistic and achievable without constant manual reviews.',
      icon: Zap,
      enabled: false,
      category: 'product',
      creditCost: '45',
      frequency: 'Monthly'
    },
    
    // SALES AUTOMATIONS
    {
      id: 'lead-scoring-refresh',
      title: 'Lead Scoring & Prioritization',
      description: 'Reviews all leads and recalculates priority scores based on engagement patterns, company fit, budget signals, and conversion likelihood. Updates lead statuses (Hot/Warm/Cold), creates follow-up tasks for high-value prospects, and archives dead leads. Ensures your team always works the best opportunities.',
      icon: TrendingUp,
      enabled: true,
      category: 'sales',
      creditCost: '35',
      frequency: 'Daily'
    },
    {
      id: 'pipeline-forecast-analysis',
      title: 'Pipeline Analysis & Forecasting',
      description: 'Reviews your entire sales pipeline and generates 30/60/90 day revenue forecasts. Calculates deal win probabilities, identifies at-risk opportunities, suggests accelerators for deals, and highlights pipeline gaps. Delivered as an executive summary with specific actions to hit targets.',
      icon: BarChart3,
      enabled: true,
      category: 'sales',
      creditCost: '50',
      frequency: 'Weekly'
    },
    {
      id: 'outreach-performance-review',
      title: 'Outreach Performance Review',
      description: 'Analyzes all email sequences, call activities, and outreach campaigns. Identifies best-performing messages, optimal send times, and engagement patterns. Recommends copy improvements, suggests A/B tests, and flags underperforming campaigns. Helps you continuously improve conversion rates.',
      icon: Mail,
      enabled: false,
      category: 'sales',
      creditCost: '40',
      frequency: 'Monthly'
    },
    {
      id: 'stalled-deal-detection',
      title: 'Stalled Deal Detection',
      description: 'Scans all open deals for warning signs: long gaps since last contact, stalled stage progression, unresponsive contacts, or budget concerns. Assigns risk levels, suggests recovery tactics, and creates re-engagement tasks. Prevents revenue from slipping through the cracks.',
      icon: AlertTriangle,
      enabled: false,
      category: 'sales',
      creditCost: '30',
      frequency: 'Weekly'
    },
    {
      id: 'follow-up-queue-builder',
      title: 'Follow-up Queue Builder',
      description: 'Reviews all leads and customers to identify who needs contact based on time since last touch, deal stage, and engagement level. Creates prioritized follow-up tasks with context and suggested talking points. Ensures no hot lead goes cold due to forgotten follow-ups.',
      icon: Bell,
      enabled: true,
      category: 'sales',
      creditCost: '25',
      frequency: 'Daily'
    },
    
    // MARKETING AUTOMATIONS
    {
      id: 'campaign-performance-audit',
      title: 'Campaign Performance Audit',
      description: 'Reviews all active marketing campaigns across channels (email, social, ads, content). Calculates ROI, identifies top performers, spots underperforming assets, and recommends budget reallocation. Includes competitor comparison and suggested optimizations. Takes the guesswork out of marketing spend.',
      icon: Sparkles,
      enabled: false,
      category: 'marketing',
      creditCost: '55',
      frequency: 'Weekly'
    },
    {
      id: 'competitive-intelligence',
      title: 'Competitive Intelligence Report',
      description: 'Monitors competitor websites, social media, pricing pages, and product announcements. Tracks new features, pricing changes, market positioning shifts, and customer sentiment. Identifies gaps you can exploit and threats requiring response. Delivered as a structured intel report.',
      icon: Shield,
      enabled: false,
      category: 'marketing',
      creditCost: '60',
      frequency: 'Monthly'
    },
    {
      id: 'content-calendar-generator',
      title: 'Content Calendar Generator',
      description: 'Generates a complete content calendar with blog post ideas, social media themes, email newsletter topics, and video concepts. Tailored to your audience, optimized for SEO, and aligned with business goals. Includes headlines, key points, and publishing schedule. Solves the "what should we post?" problem.',
      icon: FileText,
      enabled: false,
      category: 'marketing',
      creditCost: '50',
      frequency: 'Monthly'
    },
    {
      id: 'seo-content-suggestions',
      title: 'SEO & Content Recommendations',
      description: 'Analyzes your existing content performance, identifies keyword gaps, suggests new topics with high search volume, and recommends updates to underperforming pages. Includes technical SEO checks and backlink opportunities. Helps you climb search rankings systematically.',
      icon: Lightbulb,
      enabled: false,
      category: 'marketing',
      creditCost: '45',
      frequency: 'Monthly'
    },
    {
      id: 'marketing-metrics-digest',
      title: 'Marketing Metrics Digest',
      description: 'Compiles all key marketing metrics: website traffic, conversion rates, email open/click rates, social engagement, ad performance, and lead generation. Identifies trends, celebrates wins, flags drops, and calculates CAC and LTV. One comprehensive dashboard replacing hours of manual reporting.',
      icon: Activity,
      enabled: false,
      category: 'marketing',
      creditCost: '40',
      frequency: 'Weekly'
    },
    
    // FINANCE AUTOMATIONS
    {
      id: 'expense-review-categorization',
      title: 'Expense Review & Categorization',
      description: 'Reviews all recent transactions and ensures proper categorization for accounting. Flags unusual charges, identifies duplicate expenses, spots subscription creep, and finds potential tax deductions. Creates expense reports and highlights areas of overspending. Eliminates manual bookkeeping.',
      icon: Receipt,
      enabled: true,
      category: 'finance',
      creditCost: '30',
      frequency: 'Weekly'
    },
    {
      id: 'cash-runway-forecast',
      title: 'Cash Flow & Runway Analysis',
      description: 'Projects your cash position for the next 90 days based on revenue patterns, expense trends, and known commitments. Calculates burn rate, estimates runway, identifies cash crunch periods, and suggests preservation strategies. Know exactly when you need to raise or when you can invest.',
      icon: TrendingDown,
      enabled: true,
      category: 'finance',
      creditCost: '50',
      frequency: 'Weekly'
    },
    {
      id: 'invoice-collection-monitor',
      title: 'Invoice & Collections Monitor',
      description: 'Tracks all outstanding invoices, calculates days outstanding, identifies overdue payments, and creates follow-up tasks. Suggests payment reminder language and escalation strategies. Helps you get paid faster and reduces bad debt without awkward manual tracking.',
      icon: FileText,
      enabled: false,
      category: 'finance',
      creditCost: '35',
      frequency: 'Weekly'
    },
    {
      id: 'financial-statement-generator',
      title: 'Financial Statement Generator',
      description: 'Generates professional P&L statements, balance sheets, and cash flow statements. Includes key financial ratios, month-over-month comparisons, and variance explanations. Investor-ready formatting. Eliminates hours of manual financial reporting and spreadsheet wrangling.',
      icon: PieChart,
      enabled: false,
      category: 'finance',
      creditCost: '45',
      frequency: 'Monthly'
    },
    {
      id: 'budget-variance-tracking',
      title: 'Budget Variance Analysis',
      description: 'Compares actual spending vs. budget across all categories. Calculates variances, explains major differences, identifies concerning trends, and recommends corrective actions. Tracks burn rate against plan. Keeps spending on track without constant manual spreadsheet updates.',
      icon: Target,
      enabled: false,
      category: 'finance',
      creditCost: '35',
      frequency: 'Monthly'
    },
    {
      id: 'tax-optimization-scanner',
      title: 'Tax Deduction Scanner',
      description: 'Reviews all expenses to identify potential tax deductions you might be missing. Categorizes by deduction type (travel, meals, equipment, home office, etc.), suggests documentation requirements, and flags questionable items. Maximizes tax savings and reduces audit risk.',
      icon: DollarSign,
      enabled: false,
      category: 'finance',
      creditCost: '50',
      frequency: 'Quarterly'
    },
    
    // HR AUTOMATIONS
    {
      id: 'policy-compliance-check',
      title: 'HR Policy Compliance Review',
      description: 'Reviews your employee handbook, policies, and practices against current employment laws and regulations. Flags outdated policies, identifies compliance risks, suggests updates, and provides recommended policy language. Keeps you legally compliant as regulations change.',
      icon: Briefcase,
      enabled: false,
      category: 'hr',
      creditCost: '65',
      frequency: 'Quarterly'
    },
    {
      id: 'onboarding-readiness-check',
      title: 'New Hire Onboarding Prep',
      description: 'When new team members are added, automatically generates role-specific onboarding materials: welcome packets, first-week schedules, training plans, 30-60-90 day goals, and manager check-in guides. Ensures every hire gets consistent, thorough onboarding without manual prep work.',
      icon: Users,
      enabled: false,
      category: 'hr',
      creditCost: '40',
      frequency: 'Monthly'
    },
    {
      id: 'performance-review-prep',
      title: 'Performance Review Preparation',
      description: 'Generates customized performance review templates with role-specific competencies, rating scales, and goal-setting frameworks. Includes manager guides, self-assessment forms, and development plan templates. Makes review cycles smooth and consistent without starting from scratch each time.',
      icon: Award,
      enabled: false,
      category: 'hr',
      creditCost: '45',
      frequency: 'Quarterly'
    },
    {
      id: 'team-engagement-insights',
      title: 'Team Health & Engagement Insights',
      description: 'Analyzes team metrics like turnover risk, workload distribution, goal completion rates, and feedback patterns. Identifies burnout risks, disengaged team members, and high performers. Suggests interventions, recognition opportunities, and resource rebalancing. Proactive team management.',
      icon: UserCheck,
      enabled: false,
      category: 'hr',
      creditCost: '40',
      frequency: 'Monthly'
    },
    
    // GENERAL AUTOMATIONS
    {
      id: 'daily-business-brief',
      title: 'Daily Business Brief',
      description: 'Every morning, reviews all activity from the past 24 hours across all departments. Highlights top priorities for the day, flags urgent issues, celebrates wins, and creates a recommended action plan. Your personal exec assistant delivering a strategic briefing before you start work.',
      icon: Activity,
      enabled: true,
      category: 'general',
      creditCost: '50',
      frequency: 'Daily'
    },
    {
      id: 'missing-task-identifier',
      title: 'Task Gap Analysis',
      description: 'Reviews your goals, roadmap, and recent activities to identify work that should be tracked but isn\'t. Generates missing tasks with descriptions, priorities, effort estimates, and suggested owners. Ensures nothing falls through the cracks and your task list reflects reality.',
      icon: ListTodo,
      enabled: false,
      category: 'general',
      creditCost: '35',
      frequency: 'Weekly'
    },
    {
      id: 'deadline-risk-scanner',
      title: 'Deadline Risk Scanner',
      description: 'Reviews all upcoming deadlines and calculates completion risk based on remaining time, dependencies, resource availability, and progress velocity. Creates early warning tasks for at-risk deliverables and suggests mitigation strategies. Prevents last-minute scrambles and missed commitments.',
      icon: Clock,
      enabled: false,
      category: 'general',
      creditCost: '30',
      frequency: 'Daily'
    },
    {
      id: 'cross-department-sync',
      title: 'Cross-Department Sync Check',
      description: 'Identifies misalignments between departments: marketing promises vs. product delivery, sales commitments vs. ops capacity, finance constraints vs. hiring plans. Flags conflicts, suggests coordination meetings, and creates alignment tasks. Prevents siloed disasters.',
      icon: Shield,
      enabled: false,
      category: 'general',
      creditCost: '55',
      frequency: 'Weekly'
    },
  ]);

  // Category configuration
  const categoryInfo = {
    product: { 
      iconColor: 'var(--chart-4)',
      label: 'Product',
      icon: Target
    },
    sales: { 
      iconColor: 'var(--chart-1)',
      label: 'Sales',
      icon: TrendingUp
    },
    marketing: { 
      iconColor: 'var(--chart-5)',
      label: 'Marketing',
      icon: Sparkles
    },
    finance: { 
      iconColor: 'var(--success)',
      label: 'Finance',
      icon: DollarSign
    },
    hr: { 
      iconColor: 'var(--chart-2)',
      label: 'Human Resources',
      icon: Users
    },
    general: { 
      iconColor: 'var(--chart-3)',
      label: 'General Automation',
      icon: Zap
    },
  };

  useEffect(() => {
    loadSettings();
  }, [selectedBusiness?.id]);

  useEffect(() => {
    if (!isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [agiEnabled]);

  useEffect(() => {
    if (!isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [automations]);

  const loadSettings = async () => {
    if (!selectedBusiness?.id) return;

    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('❌ No session found when loading Cofounder settings');
        return;
      }

      console.log('📥 Loading Cofounder settings for business:', selectedBusiness.id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/settings/cofounder/load?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded settings from database:', data);
        
        if (data.success && data.settings) {
          setAgiEnabled(data.settings.agiEnabled || false);
          
          if (data.settings.automations && Array.isArray(data.settings.automations)) {
            setAutomations(prev => 
              prev.map(auto => {
                const saved = data.settings.automations.find((s: any) => s.id === auto.id);
                return saved ? { 
                  ...auto, 
                  enabled: saved.enabled, 
                  frequency: saved.frequency || auto.frequency,
                  configuration: saved.configuration || undefined
                } : auto;
              })
            );
          }

          if (data.settings.updatedAt) {
            setLastSaved(data.settings.updatedAt);
          }
          
          setHasUnsavedChanges(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to load settings:', response.status, errorData);
        toast.error('Failed to load settings');
      }
    } catch (error) {
      console.error('❌ Error loading Cofounder settings:', error);
      toast.error('Error loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutomation = (automationId: string) => {
    const automation = automations.find(a => a.id === automationId);
    if (!automation) return;

    // If enabling and no configuration exists, show the input dialog
    if (!automation.enabled && !automation.configuration) {
      setSelectedAutomation(automation);
      setDialogMode('configure');
      setInputDialogOpen(true);
    } else {
      // If disabling or already configured, just toggle
      setAutomations(prev =>
        prev.map(auto =>
          auto.id === automationId
            ? { ...auto, enabled: !auto.enabled }
            : auto
        )
      );
      setHasUnsavedChanges(true);
    }
  };

  const handleEditConfiguration = (automationId: string) => {
    const automation = automations.find(a => a.id === automationId);
    if (!automation) return;

    setSelectedAutomation(automation);
    setDialogMode('edit');
    setInputDialogOpen(true);
  };

  const handleFrequencyChange = (automationId: string, newFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly') => {
    setAutomations(prev =>
      prev.map(auto =>
        auto.id === automationId
          ? { ...auto, frequency: newFrequency }
          : auto
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedBusiness?.id) {
      toast.error('Please select a business first');
      return;
    }

    try {
      setIsSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const settingsData = {
        agiEnabled,
        automations: automations.map(a => ({
          id: a.id,
          enabled: a.enabled,
          frequency: a.frequency,
          configuration: a.configuration || {}
        })),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/settings/cofounder/save`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            settings: settingsData
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to save settings: ${errorData.error || response.statusText}`);
      }

      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!confirm('Reset all settings to defaults?')) {
      return;
    }

    setAgiEnabled(false);
    
    // Reset to default enabled automations (key features enabled)
    setAutomations(prev =>
      prev.map((auto) => ({
        ...auto,
        enabled: ['feature-prioritization', 'lead-scoring-refresh', 
                 'pipeline-forecast-analysis', 'follow-up-queue-builder', 
                 'expense-review-categorization', 'cash-runway-forecast', 
                 'daily-business-brief'].includes(auto.id),
        frequency: auto.frequency // Keep existing frequencies
      }))
    );
    setHasUnsavedChanges(true);
    toast.info('Settings reset. Click Save to persist changes.');
  };

  const handleTestAutomation = async (automationId: string) => {
    if (!selectedBusiness?.id) {
      toast.error('Please select a business first');
      return;
    }

    const automation = automations.find(a => a.id === automationId);
    if (!automation) return;

    // Open input dialog to gather user context
    setSelectedAutomation(automation);
    setInputDialogOpen(true);
    setDialogMode('test');
  };

  const handleRunAutomationWithInput = async (userInput: Record<string, any>) => {
    if (!selectedBusiness?.id || !selectedAutomation) return;

    // If in configure or edit mode, save the configuration
    if (dialogMode === 'configure' || dialogMode === 'edit') {
      setAutomations(prev =>
        prev.map(auto =>
          auto.id === selectedAutomation.id
            ? { ...auto, configuration: userInput, enabled: dialogMode === 'configure' ? true : auto.enabled }
            : auto
        )
      );
      setHasUnsavedChanges(true);
      setInputDialogOpen(false);
      setSelectedAutomation(null);
      toast.success(`Configuration saved for ${selectedAutomation.title}`);
      return;
    }

    // Otherwise, run the test
    try {
      setTestingAutomation(selectedAutomation.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      toast.info(`Running ${selectedAutomation.title}...`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/automations/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            automationId: selectedAutomation.id,
            userInput
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`✅ Automation started! Check the Notifications page for results.`, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => navigate('/notifications')
          }
        });
        console.log('🧪 Automation Test Started:', data);
      } else {
        toast.error(`Failed: ${data.error || 'Unknown error'}`);
        console.error('❌ Automation Test Error:', data);
      }
    } catch (error: any) {
      console.error('❌ Error testing automation:', error);
      toast.error(error.message || 'Failed to test automation');
    } finally {
      setTestingAutomation(null);
      setInputDialogOpen(false);
      setSelectedAutomation(null);
    }
  };

  const enabledCount = automations.filter(a => a.enabled).length;
  const totalCount = automations.length;
  const estimatedDailyCost = automations
    .filter(a => a.enabled)
    .reduce((sum, auto) => {
      const cost = parseInt(auto.creditCost);
      if (auto.frequency === 'Daily') return sum + cost;
      if (auto.frequency === 'Weekly') return sum + Math.ceil(cost / 7);
      if (auto.frequency === 'Monthly') return sum + Math.ceil(cost / 30);
      if (auto.frequency === 'Quarterly') return sum + Math.ceil(cost / 90);
      return sum;
    }, 0);

  const estimatedWeeklyCost = automations
    .filter(a => a.enabled)
    .reduce((sum, auto) => {
      const cost = parseInt(auto.creditCost);
      if (auto.frequency === 'Daily') return sum + (cost * 7);
      if (auto.frequency === 'Weekly') return sum + cost;
      if (auto.frequency === 'Monthly') return sum + Math.ceil(cost / 4);
      if (auto.frequency === 'Quarterly') return sum + Math.ceil(cost / 13);
      return sum;
    }, 0);

  const estimatedMonthlyCost = automations
    .filter(a => a.enabled)
    .reduce((sum, auto) => {
      const cost = parseInt(auto.creditCost);
      if (auto.frequency === 'Daily') return sum + (cost * 30);
      if (auto.frequency === 'Weekly') return sum + Math.ceil(cost * 4);
      if (auto.frequency === 'Monthly') return sum + cost;
      if (auto.frequency === 'Quarterly') return sum + Math.ceil(cost / 3);
      return sum;
    }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div 
          className="max-w-4xl mx-auto"
          style={{ 
            padding: 'var(--spacing-4)',
          }}
        >
          {!isMobile && (
            <Button
              variant="ghost"
              onClick={() => navigate('/roadmap')}
              style={{ marginBottom: 'var(--spacing-4)' }}
            >
              <ChevronLeft className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Back
            </Button>
          )}
          
          <div className="flex items-center justify-center" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
            <div className="text-center">
              <Bot className="size-12 mx-auto animate-pulse text-primary" style={{ marginBottom: 'var(--spacing-4)' }} />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        paddingBottom: isMobile && isIOS() ? 'max(env(safe-area-inset-bottom, 0px) + 200px, 200px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)'
      }}
    >
      <div 
        className="max-w-7xl mx-auto"
        style={{ 
          padding: 'var(--spacing-3)',
        }}
      >
        {/* Header - Only show Back button on desktop */}
        <div style={{ marginBottom: 'var(--spacing-3)' }}>
          {!isMobile && (
            <Button
              variant="ghost"
              onClick={() => navigate('/roadmap')}
              style={{ marginBottom: 'var(--spacing-4)' }}
            >
              <ChevronLeft className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
              Back
            </Button>
          )}

          <div className="flex items-start justify-between flex-wrap" style={{ gap: 'var(--spacing-4)' }}>
            <div>
              <h1 style={{ marginBottom: 'var(--spacing-2)' }}>
                Cofounder Automation Settings
              </h1>
              <p className="text-muted-foreground">
                Schedule automations to handle recurring business tasks
              </p>
              {lastSaved && (
                <p className="text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-1)' }}>
                  Last saved {new Date(lastSaved).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-2)' }}>
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                disabled={isSaving}
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                style={{
                  background: hasUnsavedChanges ? 'var(--primary)' : 'var(--success)',
                  color: hasUnsavedChanges ? 'var(--primary-foreground)' : 'var(--success-foreground)',
                }}
              >
                {isSaving ? (
                  'Saving...'
                ) : hasUnsavedChanges ? (
                  <>Save Changes</>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
                    Saved
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Master AGI Toggle */}
        <Card 
          className="border"
          style={{
            marginBottom: 'var(--spacing-3)',
            borderRadius: 'var(--radius-lg)',
            borderColor: agiEnabled ? 'var(--success)' : 'var(--border)',
            background: agiEnabled ? 'var(--success-soft)' : 'var(--card)',
          }}
        >
          <CardContent style={{ padding: 'var(--spacing-3)' }}>
            <div className="flex items-center justify-between" style={{ gap: 'var(--spacing-4)' }}>
              <div className="flex items-center flex-1" style={{ gap: 'var(--spacing-3)' }}>
                <div
                  className="size-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: agiEnabled ? 'var(--success)' : 'var(--muted)',
                    color: agiEnabled ? 'var(--success-foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  <Zap className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-1)' }}>
                    Master Automation Toggle
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {agiEnabled 
                      ? 'Active - automations will run on their schedules'
                      : 'Paused - activate to enable scheduled automations'}
                  </p>
                </div>
              </div>
              <Switch
                checked={agiEnabled}
                onCheckedChange={setAgiEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Understanding Automations */}
        <Collapsible
          open={isScheduleInfoExpanded}
          onOpenChange={setIsScheduleInfoExpanded}
          style={{ marginBottom: 'var(--spacing-3)' }}
        >
          <Card
            className="border"
            style={{
              borderRadius: 'var(--radius-lg)',
              borderColor: 'var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 3%, var(--card))',
            }}
          >
            <CollapsibleTrigger asChild>
              <CardHeader 
                style={{ 
                  paddingBottom: 'var(--spacing-3)',
                  cursor: 'pointer'
                }}
                className="hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                    <Info className="size-5 text-primary" />
                    <CardTitle>How Scheduled Automations Work</CardTitle>
                  </div>
                  <ChevronDown 
                    className={`size-5 text-primary transition-transform ${isScheduleInfoExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
            <div className="grid gap-4">
              <div>
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                  <Activity className="size-4 text-success" />
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Daily Automations</span>
                </div>
                <p className="text-sm text-muted-foreground" style={{ marginLeft: 'calc(var(--spacing-2) + 1rem)' }}>
                  Run every morning at 6 AM to analyze recent activity and provide fresh insights. Perfect for lead scoring, follow-ups, and daily briefs. Most responsive to changes but uses more credits.
                </p>
              </div>

              <div>
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                  <Calendar className="size-4 text-chart-4" />
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Weekly Automations</span>
                </div>
                <p className="text-sm text-muted-foreground" style={{ marginLeft: 'calc(var(--spacing-2) + 1rem)' }}>
                  Run every Monday morning for tasks that need regular attention but not daily. Great for pipeline reviews, expense categorization, competitor tracking. Balances credit usage with strategic oversight.
                </p>
              </div>

              <div>
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                  <Clock className="size-4 text-chart-1" />
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Monthly & Quarterly</span>
                </div>
                <p className="text-sm text-muted-foreground" style={{ marginLeft: 'calc(var(--spacing-2) + 1rem)' }}>
                  Run on the 1st of the month/quarter for strategic reviews and reports. Perfect for financial statements, performance reviews, and compliance checks. Minimal credit usage for high-value periodic work.
                </p>
              </div>
            </div>

            <Separator style={{ marginTop: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }} />

            <div>
              <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                <Lightbulb className="size-4 text-primary" />
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Getting Started</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable 3-5 core automations that match your biggest time sinks. Adjust frequencies using the dropdowns - run expensive automations less often, quick checks more frequently. Test each automation first to see the results. Monitor credit usage in Settings → Plan.
              </p>
            </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 'var(--spacing-6)' }}>
          <Card className="border" style={{ borderRadius: 'var(--radius-lg)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                <div
                  className="size-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--primary-soft)',
                  }}
                >
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    {enabledCount}/{totalCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Automations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ borderRadius: 'var(--radius-lg)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                <div
                  className="size-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--success-soft)',
                  }}
                >
                  <DollarSign className="size-5 text-success" />
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    ~{estimatedDailyCost}
                  </div>
                  <div className="text-xs text-muted-foreground">Credits/day</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ borderRadius: 'var(--radius-lg)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                <div
                  className="size-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--chart-4-soft)',
                  }}
                >
                  <Calendar className="size-5 text-chart-4" />
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    ~{estimatedWeeklyCost}
                  </div>
                  <div className="text-xs text-muted-foreground">Credits/week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ borderRadius: 'var(--radius-lg)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                <div
                  className="size-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--chart-1-soft)',
                  }}
                >
                  <TrendingUp className="size-5 text-chart-1" />
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    ~{estimatedMonthlyCost}
                  </div>
                  <div className="text-xs text-muted-foreground">Credits/month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ borderRadius: 'var(--radius-lg)' }}>
            <CardContent style={{ padding: 'var(--spacing-4)' }}>
              <div className="flex items-center" style={{ gap: 'var(--spacing-3)' }}>
                <div
                  className="size-10 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    background: agiEnabled ? 'var(--success-soft)' : 'var(--muted)',
                  }}
                >
                  {agiEnabled ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <XCircle className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    {agiEnabled ? 'Active' : 'Paused'}
                  </div>
                  <div className="text-xs text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Automations by Category */}
        {Object.entries(categoryInfo).map(([category, info]) => {
          const categoryAutomations = automations.filter(a => a.category === category);
          if (categoryAutomations.length === 0) return null;
          const CategoryIcon = info.icon;

          return (
            <div key={category} style={{ marginBottom: 'var(--spacing-6)' }}>
              <div 
                className="flex items-center justify-between"
                style={{ 
                  marginBottom: 'var(--spacing-3)',
                  paddingLeft: 'var(--spacing-1)'
                }}
              >
                <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                  <CategoryIcon className="size-4" style={{ color: info.iconColor }} />
                  <h2 className="text-sm uppercase tracking-wide" style={{ 
                    color: info.iconColor,
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    {info.label}
                  </h2>
                  <Badge variant="outline" className="text-xs" style={{
                    borderColor: info.iconColor,
                    color: info.iconColor
                  }}>
                    {categoryAutomations.filter(a => a.enabled).length} active
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/automation-reports/${category}`)}
                  style={{
                    borderColor: info.iconColor,
                    color: info.iconColor
                  }}
                  className="hover:opacity-80"
                >
                  <FileText className="size-4" style={{ marginRight: 'var(--spacing-2)' }} />
                  View Reports
                </Button>
              </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {categoryAutomations.map((automation) => {
                  const Icon = automation.icon;
                  
                  return (
                    <Card
                      key={automation.id}
                      className="border transition-all"
                      style={{
                        borderRadius: 'var(--radius-md)',
                        borderColor: automation.enabled ? info.iconColor : 'var(--border)',
                        background: automation.enabled 
                          ? `color-mix(in srgb, ${info.iconColor} 3%, var(--card))`
                          : 'var(--card)',
                      }}
                    >
                      <CardContent style={{ padding: 'var(--spacing-2)' }}>
                        <div className="flex items-start" style={{ gap: 'var(--spacing-2)' }}>
                          <div className="flex items-start flex-1" style={{ gap: 'var(--spacing-2)' }}>
                            <div
                              className="size-6 flex items-center justify-center flex-shrink-0"
                              style={{
                                borderRadius: 'var(--radius-sm)',
                                background: `color-mix(in srgb, ${info.iconColor} 15%, transparent)`,
                              }}
                            >
                              <Icon className="size-3" style={{ color: info.iconColor }} />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-1)', marginBottom: 'var(--spacing-1)' }}>
                                <h3 className="text-xs leading-tight" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                  {automation.title}
                                </h3>
                                {automation.enabled && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] leading-none"
                                    style={{
                                      borderColor: info.iconColor,
                                      color: info.iconColor,
                                      background: 'transparent',
                                      padding: '1px 4px',
                                      height: '14px',
                                    }}
                                  >
                                    On
                                  </Badge>
                                )}
                              </div>

                              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-3" style={{ marginBottom: 'var(--spacing-1.5)' }}>
                                {automation.description}
                              </p>

                              <div 
                                className="flex items-center flex-wrap text-[9px]"
                                style={{ gap: 'var(--spacing-1.5)', marginBottom: 'var(--spacing-1.5)' }}
                              >
                                <div className="flex items-center" style={{ gap: 'var(--spacing-1)' }}>
                                  <Clock className="size-2.5 text-muted-foreground" />
                                  <Select
                                    value={automation.frequency}
                                    onValueChange={(value) => handleFrequencyChange(automation.id, value as any)}
                                  >
                                    <SelectTrigger 
                                      className="h-5 text-[9px] w-[70px] py-0"
                                      style={{
                                        borderColor: info.iconColor,
                                        color: info.iconColor,
                                      }}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Daily">Daily</SelectItem>
                                      <SelectItem value="Weekly">Weekly</SelectItem>
                                      <SelectItem value="Monthly">Monthly</SelectItem>
                                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center text-muted-foreground" style={{ gap: '2px' }}>
                                  <Zap className="size-2.5" />
                                  <span>{automation.creditCost}cr</span>
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTestAutomation(automation.id)}
                                disabled={testingAutomation === automation.id}
                                className="h-5 text-[9px] px-2 py-0"
                                style={{
                                  borderColor: info.iconColor,
                                  color: info.iconColor,
                                }}
                              >
                                {testingAutomation === automation.id ? (
                                  <>
                                    <Loader2 className="size-2.5 animate-spin" style={{ marginRight: '2px' }} />
                                    Running
                                  </>
                                ) : (
                                  <>
                                    <Play className="size-2.5" style={{ marginRight: '2px' }} />
                                    Run
                                  </>
                                )}
                              </Button>

                              {/* Configuration Display */}
                              {automation.configuration && Object.keys(automation.configuration).length > 0 && (
                                <div
                                  style={{
                                    marginTop: 'var(--spacing-3)',
                                    padding: 'var(--spacing-3)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--muted)',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2)' }}>
                                    <span className="text-xs" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                      Configuration
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditConfiguration(automation.id)}
                                      className="h-6 text-xs"
                                      style={{ padding: '0 var(--spacing-2)' }}
                                    >
                                      <Edit2 className="size-3" style={{ marginRight: 'var(--spacing-1)' }} />
                                      Edit
                                    </Button>
                                  </div>
                                  <div className="grid gap-1">
                                    {Object.entries(automation.configuration).map(([key, value]) => (
                                      <div key={key} className="text-xs">
                                        <span className="text-muted-foreground" style={{ textTransform: 'capitalize' }}>
                                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                        </span>{' '}
                                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <Switch
                            checked={automation.enabled}
                            onCheckedChange={() => handleToggleAutomation(automation.id)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Info Alert */}
        <Alert
          style={{
            borderRadius: 'var(--radius-lg)',
            borderColor: 'var(--border)',
            background: 'var(--muted)',
          }}
        >
          <Info className="size-4 text-muted-foreground" />
          <AlertDescription className="text-sm text-muted-foreground">
            Automations run when enabled and the Master Toggle is active. Results are delivered in your Cofounder chat. Visit <strong>Settings → Plan</strong> to manage credits.
          </AlertDescription>
        </Alert>
      </div>

      {/* Automation Input Dialog */}
      {selectedAutomation && (
        <AutomationInputDialog
          open={inputDialogOpen}
          onClose={() => {
            setInputDialogOpen(false);
            setSelectedAutomation(null);
          }}
          automationId={selectedAutomation.id}
          automationTitle={selectedAutomation.title}
          onSubmit={handleRunAutomationWithInput}
          isLoading={testingAutomation === selectedAutomation.id}
        />
      )}
    </div>
  );
}