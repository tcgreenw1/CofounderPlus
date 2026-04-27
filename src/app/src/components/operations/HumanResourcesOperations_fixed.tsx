import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Edit, Trash2, UserPlus, Clock, Award, Calendar,
  BarChart3, TrendingUp, DollarSign, Heart, Shield, FileText,
  Search, Filter, RefreshCw, ArrowUp, ArrowDown, Star,
  MapPin, Phone, Mail, Building, GraduationCap, Briefcase,
  CheckCircle, AlertCircle, PlayCircle, PauseCircle, Zap,
  Target, Timer, BookOpen, Clipboard, ClipboardCheck, User,
  UserCheck, UserX, CreditCard, Gift, Stethoscope, Brain,
  Sparkles, Flame, ChevronUp, ChevronDown, Slack, Wallet,
  Book, Eye, Umbrella, Home, Plane, Info, Link as LinkIcon, ExternalLink, MessageSquare, Bell, Bot, ArrowRight, Edit3, Loader2, Download
} from 'lucide-react';
import { HRNotifications } from './HRNotifications';
import { CofounderHRNew as CofounderHR } from './CofounderHRNew';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { useBusiness } from '../BusinessContext';
import { BusinessDropdownHeader } from '../BusinessDropdownHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner@2.0.3';
import { AutomationReportsWidget } from '../AutomationReportsWidget';
import { useIsMobile } from '../ui/use-mobile';
import { isIOS } from '../../utils/platformDetection';
import { useCredits } from '../../hooks/useCredits';
import { useNotifications } from '../../contexts/NotificationContext';

interface HumanResourcesOperationsProps {
  user?: any;
  userData?: any;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  hire_date: string;
  salary: number;
  manager_id?: string;
  location: string;
  skills: string[];
  performance_score?: number;
  created_at: string;
}

interface ContractorContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  is_primary?: boolean;
}

interface Contractor {
  id: string;
  contractor_type: 'person' | 'company';
  name: string;
  email: string;
  phone?: string;
  // For companies
  company_name?: string;
  contacts?: ContractorContact[];
  // For persons
  title?: string;
  specialization: string;
  hourly_rate: number;
  contract_start: string;
  contract_end?: string;
  status: 'active' | 'inactive' | 'completed';
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  total_hours_worked: number;
  total_amount_paid: number;
  notes?: string;
  created_at: string;
}

interface TimeEntry {
  id: string;
  employee_id?: string;
  contractor_id?: string;
  date: string;
  hours_worked: number;
  description?: string;
  project?: string;
  billable: boolean;
  created_at: string;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period: string;
  overall_score: number;
  communication_score: number;
  technical_score: number;
  leadership_score: number;
  goals_achievement: number;
  strengths: string;
  areas_for_improvement: string;
  goals_for_next_period: string;
  status: 'draft' | 'completed' | 'approved';
  created_at: string;
}

interface Benefit {
  id: string;
  name: string;
  type: 'health' | 'dental' | 'vision' | 'retirement' | 'vacation' | 'other';
  description: string;
  provider?: string;
  cost_per_employee: number;
  employee_contribution: number;
  is_active: boolean;
  enrolled_employees: string[];
  created_at: string;
}

interface WellnessGoal {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  category: 'fitness' | 'mental_health' | 'nutrition' | 'work_life_balance';
  deadline: string;
  status: 'active' | 'completed' | 'paused';
  participants: string[];
  created_at: string;
}

interface Handbook {
  id: string;
  business_id: string;
  role_title: string;
  role_description: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  word_count: number;
  sections: string[];
}

interface HRDocument {
  id: string;
  business_id?: string;
  businessId?: string;
  document_type?: string;
  documentType?: string;
  title: string;
  content: string;
  aiSummary?: string;
  metadata?: any;
  created_at?: string;
  createdAt?: string;
  additionalContext?: string;
  userId?: string;
  updatedAt?: string;
}

// Utility function for status badge colors
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'on_leave':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'terminated':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Status utility functions
const getStatusColor = (status: string) => {
  const colors = {
    'active': '#22c55e',
    'inactive': '#6b7280',
    'on_leave': '#eab308',
    'terminated': '#ef4444',
    'completed': '#3b82f6',
    'full_time': '#22c55e',
    'part_time': '#3b82f6',
    'contract': '#f59e0b',
    'intern': '#8b5cf6'
  };
  return colors[status as keyof typeof colors] || '#6b7280';
};

// Animated counter component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = count;
    const change = value - startValue;

    const updateCount = () => {
      const now = Date.now();
      const timePassed = now - startTime;
      const progress = Math.min(timePassed / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.round(startValue + change * easeOutQuart);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [value, duration, count]);

  return <span>{count.toLocaleString()}</span>;
};

// Metric card component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
    label: string;
  };
  delay?: number;
}> = ({ title, value, icon, color, trend, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
    >
      <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
            <div className="space-y-1 sm:space-y-3 w-full">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <motion.div 
                  className="p-1.5 sm:p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div style={{ color }} className="w-3.5 h-3.5 sm:w-5 sm:h-5">
                    {icon}
                  </div>
                </motion.div>
                <h3 className="text-[11px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 leading-tight">{title}</h3>
              </div>
              
              <motion.div 
                className="space-y-1 pl-0 sm:pl-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay * 0.1 + 0.3, type: "spring", stiffness: 200 }}
              >
                <span 
                  className="text-xl sm:text-3xl font-semibold"
                  style={{ color }}
                >
                  {typeof value === 'number' && value > 0 ? (
                    <AnimatedCounter value={value} />
                  ) : value}
                </span>
              </motion.div>
            </div>
            {trend && (
              <motion.div 
                className={`text-[10px] sm:text-xs flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 self-end sm:self-auto ${
                  trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay * 0.1 + 0.5 }}
              >
                <div className="flex items-center">
                  {trend.direction === 'up' ? (
                    <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  ) : (
                    <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  )}
                  <span className="font-medium">{trend.value}</span>
                </div>
                <span className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 sm:mt-1">
                  {trend.label}
                </span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function HumanResourcesOperations({ user, userData }: HumanResourcesOperationsProps) {
  const { selectedBusiness } = useBusiness();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isIOSApp = isIOS();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Load HR documents when component mounts or business changes
  useEffect(() => {
    if (user && selectedBusiness?.id) {
      loadDocuments();
    }
  }, [user, selectedBusiness?.id]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddContractor, setShowAddContractor] = useState(false);
  const [showAddBenefit, setShowAddBenefit] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({});
  const [newContractor, setNewContractor] = useState<Partial<Contractor>>({});
  const [newBenefit, setNewBenefit] = useState<Partial<Benefit>>({});
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit employee state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  
  // Delete confirmation state
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Contractor edit and delete state
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [showEditContractor, setShowEditContractor] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState<Contractor | null>(null);
  const [showDeleteContractorConfirm, setShowDeleteContractorConfirm] = useState(false);
  
  // Contractor type selection
  const [contractorTypeStep, setContractorTypeStep] = useState<'select' | 'form'>('select');
  const [tempContacts, setTempContacts] = useState<ContractorContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<ContractorContact>>({});
  
  // Benefits management state
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [showEditBenefit, setShowEditBenefit] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null);
  const [showDeleteBenefitConfirm, setShowDeleteBenefitConfirm] = useState(false);
  const [showBenefitGuide, setShowBenefitGuide] = useState(false);
  
  // Performance management state
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [showEditReview, setShowEditReview] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<PerformanceReview | null>(null);
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState<Partial<PerformanceReview>>({});
  const [selectedEmployeeForReview, setSelectedEmployeeForReview] = useState<string>('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'draft' | 'completed' | 'approved'>('all');
  const [performanceSearchQuery, setPerformanceSearchQuery] = useState('');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');
  const [reviewMode, setReviewMode] = useState<'quick' | 'detailed'>('quick');
  const [selectedPerformanceLevel, setSelectedPerformanceLevel] = useState<string>('');

  // Smart Actions state
  const [smartActions, setSmartActions] = useState<any[]>([]);
  const [loadingSmartActions, setLoadingSmartActions] = useState(false);
  const [smartActionsSummary, setSmartActionsSummary] = useState<string>('');
  const [hasRunSmartActions, setHasRunSmartActions] = useState(false);

  // Handbook state
  const [handbooks, setHandbooks] = useState<Handbook[]>([]);
  const [loadingHandbooks, setLoadingHandbooks] = useState(false);
  const [showContractorResearch, setShowContractorResearch] = useState(false);
  
  // Generated documents state
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Quick Actions input dialog state
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [inputDialogAction, setInputDialogAction] = useState<any>(null);
  const [inputCompanyName, setInputCompanyName] = useState('');
  const [inputIndustry, setInputIndustry] = useState('');
  const [inputTone, setInputTone] = useState('professional');
  const [inputDetails, setInputDetails] = useState('');
  const [backgroundJobs, setBackgroundJobs] = useState<Set<string>>(new Set());
  
  // Credits and notifications hooks
  const { deductCredits, checkCredits } = useCredits();
  const { addNotification } = useNotifications();

  // Mock data for Quick Actions and Insights
  const mockQuickActions = [
    {
      icon: BookOpen,
      label: 'Create Handbook',
      description: 'Generate employee handbook',
      color: '#6c5ce7',
      action: 'employee-handbook'
    },
    {
      icon: Users,
      label: 'Onboarding Guide',
      description: 'New hire onboarding materials',
      color: '#0984e3',
      action: 'onboarding-checklist'
    },
    {
      icon: Shield,
      label: 'Policy Document',
      description: 'Company policies & procedures',
      color: '#00b894',
      action: 'policy-document'
    },
    {
      icon: Award,
      label: 'Review Template',
      description: 'Performance review forms',
      color: '#fd79a8',
      action: 'performance-review'
    },
    {
      icon: Heart,
      label: 'Benefits Guide',
      description: 'Employee benefits overview',
      color: '#e17055',
      action: 'benefits-guide'
    },
    {
      icon: Search,
      label: 'Contractor Research',
      description: 'Find & hire contractors',
      color: '#0984e3',
      action: 'contractor_research'
    },
    {
      icon: Target,
      label: 'Job Description',
      description: 'Role descriptions & requirements',
      color: '#fdcb6e',
      action: 'job-description'
    }
  ];

  const mockAICapabilities = [
    {
      title: 'Automatic Handbook Generation',
      description: 'Create comprehensive handbooks from role descriptions',
      icon: Brain,
      active: true
    },
    {
      title: 'Compliance Updates',
      description: 'Auto-update policies for legal compliance',
      icon: Shield,
      active: true
    },
    {
      title: 'Multi-Business Support',
      description: 'Manage handbooks across all your businesses',
      icon: Building,
      active: true
    },
    {
      title: 'Smart Expansion',
      description: 'AI expands sections with detailed content',
      icon: Sparkles,
      active: true
    },
    {
      title: 'Custom Templates',
      description: 'Industry-specific handbook templates',
      icon: FileText,
      active: true
    },
    {
      title: 'Version Control',
      description: 'Track changes and maintain history',
      icon: Clock,
      active: true
    }
  ];

  useEffect(() => {
    loadHRData();
    loadHandbooks();
    loadDocuments();
  }, [user, selectedBusiness]);

  const loadHRData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      if (!user || !selectedBusiness) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Load HR data from backend with business ID
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/data?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('HR data loaded successfully:', data);
        
        setEmployees(data.employees || []);
        setContractors(data.contractors || []);
        setTimeEntries(data.timeEntries || []);
        setPerformanceReviews(data.performanceReviews || []);
        setBenefits(data.benefits || []);
      } else {
        console.error('Failed to load HR data:', response.status, response.statusText);
        // Set empty arrays instead of falling back to sample data
        setEmployees([]);
        setContractors([]);
        setTimeEntries([]);
        setPerformanceReviews([]);
        setBenefits([]);
      }

    } catch (error) {
      console.error('Error loading HR data:', error);
      // Set empty arrays - no fallback to sample data
      setEmployees([]);
      setContractors([]);
      setTimeEntries([]);
      setPerformanceReviews([]);
      setBenefits([]);
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const loadHandbooks = async () => {
    try {
      setLoadingHandbooks(true);
      
      if (!user || !selectedBusiness) {
        setLoadingHandbooks(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setLoadingHandbooks(false);
        return;
      }

      // Load handbooks from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHandbooks(data.handbooks || []);
      } else {
        console.log('Failed to load handbooks');
        setHandbooks([]);
      }
    } catch (error) {
      console.log('Error loading handbooks:', error);
      setHandbooks([]);
    } finally {
      setLoadingHandbooks(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      
      if (!user || !selectedBusiness) {
        setLoadingDocuments(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setLoadingDocuments(false);
        return;
      }

      // Load documents from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/documents?businessId=${selectedBusiness.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.log('Failed to load documents');
        setDocuments([]);
      }
    } catch (error) {
      console.log('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Handle quick action click - open input dialog
  const handleQuickActionClick = (action: any) => {
    // Pre-fill company name and industry if available
    const businessInfo = userData?.business_info || {};
    setInputCompanyName(businessInfo.business_name || selectedBusiness?.name || '');
    setInputIndustry(businessInfo.industry || '');
    setInputDetails('');
    setInputTone('professional');
    setInputDialogAction(action);
    setShowInputDialog(true);
  };

  // Handle generating HR document
  const handleGenerateDocument = async () => {
    if (!inputDialogAction) return;

    // Trim and validate inputs
    const trimmedCompanyName = inputCompanyName.trim();
    const trimmedIndustry = inputIndustry.trim();
    const trimmedDetails = inputDetails.trim();

    if (!trimmedCompanyName || !trimmedIndustry) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check credits (10 credits for quick actions)
    if (!checkCredits(10)) {
      return;
    }

    // Close dialog
    setShowInputDialog(false);

    // Add to background jobs
    setBackgroundJobs(prev => new Set(prev).add(inputDialogAction.action));
    
    // Add notification
    addNotification({
      title: 'Generating HR Document',
      message: `Your ${inputDialogAction.label} is being generated in the background...`,
      type: 'info',
      category: 'hr',
      metadata: {
        documentType: inputDialogAction.action,
        status: 'processing'
      }
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please log in to use HR tools');
        setBackgroundJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(inputDialogAction.action);
          return newSet;
        });
        return;
      }

      const businessId = selectedBusiness?.id || userData?.current_business_id || userData?.businesses?.[0]?.id;

      console.log('🚀 Sending HR document generation request:', {
        documentType: inputDialogAction.action,
        companyName: trimmedCompanyName,
        industry: trimmedIndustry,
        tone: inputTone,
        details: trimmedDetails,
        businessId
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/generate-document?businessId=${businessId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            documentType: inputDialogAction.action,
            companyName: trimmedCompanyName,
            industry: trimmedIndustry,
            tone: inputTone,
            details: trimmedDetails
          })
        }
      );

      const data = await response.json();
      
      console.log('📄 HR document generation response:', data);
      
      if (data.success && data.document) {
        // Deduct credits after successful generation
        await deductCredits(10, `HR Document Generation - ${inputDialogAction.label}`);
        
        // Add to documents list
        setDocuments(prev => [data.document, ...prev]);
        
        // Add success notification
        addNotification({
          title: `${inputDialogAction.label} Ready`,
          message: `Your ${inputDialogAction.label} has been generated successfully.`,
          type: 'success',
          category: 'hr',
          actionUrl: '/operations/hr',
          metadata: {
            documentType: inputDialogAction.action,
            title: data.document.title
          }
        });
        
        toast.success(`${inputDialogAction.label} generated successfully!`);
      } else {
        throw new Error(data.error || 'Document generation failed');
      }
    } catch (error: any) {
      console.error('Document generation error:', error);
      
      // Add error notification
      addNotification({
        title: 'Document Generation Failed',
        message: `Failed to generate ${inputDialogAction.label}: ${error.message}`,
        type: 'error',
        category: 'hr',
        metadata: {
          documentType: inputDialogAction.action,
          error: error.message
        }
      });
      
      toast.error(`Failed to generate ${inputDialogAction.label}: ${error.message}`);
    } finally {
      setBackgroundJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(inputDialogAction.action);
        return newSet;
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/documents/${documentId}?businessId=${selectedBusiness.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
        toast.success('Document deleted');
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownloadDocument = (document: HRDocument) => {
    const blob = new Blob([document.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/\s+/g, '_')}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Document downloaded');
  };

  const handleDeleteHandbook = async (handbookId: string) => {
    if (!confirm('Are you sure you want to delete this handbook?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/handbooks/${handbookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        toast.success('Handbook deleted');
        loadHandbooks();
      }
    } catch (error) {
      console.error('Error deleting handbook:', error);
    }
  };

  const handleAddEmployee = async () => {
    // Validate required fields
    if (!newEmployee.first_name || !newEmployee.last_name || !newEmployee.email) {
      toast.error('Please fill in all required fields (First Name, Last Name, and Email)');
      return;
    }
    
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to save to backend with business ID
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/employees?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEmployee)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setEmployees(prev => [...prev, result.employee]);
          setNewEmployee({});
          setShowAddEmployee(false);
          console.log('Employee saved successfully to backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend save failed:', response.status, errorText);
        }
      }

      // Fallback to local state (should not happen if backend is working)
      const employee: Employee = {
        id: Date.now().toString(),
        first_name: newEmployee.first_name,
        last_name: newEmployee.last_name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        position: newEmployee.position || 'Team Member',
        department: newEmployee.department || 'General',
        employment_type: newEmployee.employment_type || 'full_time',
        status: 'active',
        hire_date: newEmployee.hire_date || new Date().toISOString().split('T')[0],
        salary: Number(newEmployee.salary) || 0,
        location: newEmployee.location || 'Remote',
        skills: newEmployee.skills || [],
        created_at: new Date().toISOString()
      };

      console.log('Using fallback local state for employee');
      setEmployees(prev => [...prev, employee]);
      setNewEmployee({});
      setShowAddEmployee(false);
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee(employee);
    setShowEditEmployee(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee || !newEmployee.first_name || !newEmployee.last_name || !newEmployee.email || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to update on backend with business ID
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/employees/${editingEmployee.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEmployee)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? result.employee : emp));
          setNewEmployee({});
          setEditingEmployee(null);
          setShowEditEmployee(false);
          console.log('Employee updated successfully on backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend update failed:', response.status, errorText);
        }
      }

      // Fallback to local state (should not happen if backend is working)
      const updatedEmployee: Employee = {
        ...editingEmployee,
        ...newEmployee,
        id: editingEmployee.id,
        created_at: editingEmployee.created_at
      };

      console.log('Using fallback local state for employee update');
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp));
      setNewEmployee({});
      setEditingEmployee(null);
      setShowEditEmployee(false);
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const confirmDeleteEmployee = async () => {
    const employee = employeeToDelete;
    if (!selectedBusiness || !employee) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        // Try to delete on backend with business ID
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/employees/${employee.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
          console.log('Employee deleted successfully from backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend delete failed:', response.status, errorText);
        }
      }

      // Fallback to local state (should not happen if backend is working)
      console.log('Using fallback local state for employee deletion');
      setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    } catch (error) {
      console.error('Error deleting employee:', error);
    } finally {
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    }
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  // Contractor CRUD operations
  const handleAddContractor = async () => {
    if (!newContractor.name || !newContractor.email || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/contractors?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newContractor)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setContractors(prev => [...prev, result.contractor]);
          setNewContractor({});
          setShowAddContractor(false);
          console.log('Contractor saved successfully to backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend save failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      const contractor: Contractor = {
        id: Date.now().toString(),
        contractor_type: newContractor.contractor_type || 'person',
        name: newContractor.name,
        email: newContractor.email,
        phone: newContractor.phone,
        company_name: newContractor.company_name,
        contacts: newContractor.contractor_type === 'company' ? tempContacts : undefined,
        title: newContractor.title,
        specialization: newContractor.specialization || 'General',
        hourly_rate: Number(newContractor.hourly_rate) || 0,
        contract_start: newContractor.contract_start || new Date().toISOString().split('T')[0],
        contract_end: newContractor.contract_end,
        status: 'active',
        address: newContractor.address,
        city: newContractor.city,
        state: newContractor.state,
        zip: newContractor.zip,
        country: newContractor.country,
        total_hours_worked: 0,
        total_amount_paid: 0,
        notes: newContractor.notes,
        created_at: new Date().toISOString()
      };

      console.log('Using fallback local state for contractor');
      setContractors(prev => [...prev, contractor]);
      setNewContractor({});
      setTempContacts([]);
      setContractorTypeStep('select');
      setShowAddContractor(false);
    } catch (error) {
      console.error('Error adding contractor:', error);
    }
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.email) return;
    
    const contact: ContractorContact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      title: newContact.title,
      is_primary: tempContacts.length === 0 // First contact is primary
    };
    
    setTempContacts(prev => [...prev, contact]);
    setNewContact({});
    setShowAddContact(false);
  };

  const handleRemoveContact = (contactId: string) => {
    setTempContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const handleSetPrimaryContact = (contactId: string) => {
    setTempContacts(prev => prev.map(c => ({
      ...c,
      is_primary: c.id === contactId
    })));
  };

  const handleEditContractor = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setNewContractor(contractor);
    setTempContacts(contractor.contacts || []);
    setContractorTypeStep('form');
    setShowEditContractor(true);
  };

  const handleUpdateContractor = async () => {
    if (!editingContractor || !newContractor.name || !newContractor.email || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/contractors/${editingContractor.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newContractor)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setContractors(prev => prev.map(con => con.id === editingContractor.id ? result.contractor : con));
          setNewContractor({});
          setEditingContractor(null);
          setShowEditContractor(false);
          console.log('Contractor updated successfully on backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend update failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      const updatedContractor: Contractor = {
        ...editingContractor,
        ...newContractor,
        contacts: newContractor.contractor_type === 'company' ? tempContacts : undefined,
        id: editingContractor.id,
        created_at: editingContractor.created_at
      };

      console.log('Using fallback local state for contractor update');
      setContractors(prev => prev.map(con => con.id === editingContractor.id ? updatedContractor : con));
      setNewContractor({});
      setEditingContractor(null);
      setTempContacts([]);
      setContractorTypeStep('select');
      setShowEditContractor(false);
    } catch (error) {
      console.error('Error updating contractor:', error);
    }
  };

  const confirmDeleteContractor = async () => {
    const contractor = contractorToDelete;
    if (!selectedBusiness || !contractor) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/contractors/${contractor.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          setContractors(prev => prev.filter(con => con.id !== contractor.id));
          console.log('Contractor deleted successfully from backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend delete failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      console.log('Using fallback local state for contractor deletion');
      setContractors(prev => prev.filter(con => con.id !== contractor.id));
    } catch (error) {
      console.error('Error deleting contractor:', error);
    } finally {
      setShowDeleteContractorConfirm(false);
      setContractorToDelete(null);
    }
  };

  const handleDeleteContractor = (contractor: Contractor) => {
    setContractorToDelete(contractor);
    setShowDeleteContractorConfirm(true);
  };

  // Benefits CRUD operations
  const handleAddBenefit = async () => {
    if (!newBenefit.name || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/benefits?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newBenefit)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setBenefits(prev => [...prev, result.benefit]);
          setNewBenefit({});
          setShowAddBenefit(false);
          console.log('Benefit saved successfully to backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend save failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      const benefit: Benefit = {
        id: Date.now().toString(),
        name: newBenefit.name,
        type: newBenefit.type || 'other',
        description: newBenefit.description || '',
        provider: newBenefit.provider,
        cost_per_employee: Number(newBenefit.cost_per_employee) || 0,
        employee_contribution: Number(newBenefit.employee_contribution) || 0,
        is_active: newBenefit.is_active !== false,
        enrolled_employees: [],
        created_at: new Date().toISOString()
      };

      console.log('Using fallback local state for benefit');
      setBenefits(prev => [...prev, benefit]);
      setNewBenefit({});
      setShowAddBenefit(false);
    } catch (error) {
      console.error('Error adding benefit:', error);
    }
  };

  const handleEditBenefit = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setNewBenefit(benefit);
    setShowEditBenefit(true);
  };

  const handleUpdateBenefit = async () => {
    if (!editingBenefit || !newBenefit.name || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/benefits/${editingBenefit.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newBenefit)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setBenefits(prev => prev.map(ben => ben.id === editingBenefit.id ? result.benefit : ben));
          setNewBenefit({});
          setEditingBenefit(null);
          setShowEditBenefit(false);
          console.log('Benefit updated successfully on backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend update failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      const updatedBenefit: Benefit = {
        ...editingBenefit,
        ...newBenefit,
        id: editingBenefit.id,
        created_at: editingBenefit.created_at
      };

      console.log('Using fallback local state for benefit update');
      setBenefits(prev => prev.map(ben => ben.id === editingBenefit.id ? updatedBenefit : ben));
      setNewBenefit({});
      setEditingBenefit(null);
      setShowEditBenefit(false);
    } catch (error) {
      console.error('Error updating benefit:', error);
    }
  };

  const confirmDeleteBenefit = async () => {
    const benefit = benefitToDelete;
    if (!selectedBusiness || !benefit) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/benefits/${benefit.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          setBenefits(prev => prev.filter(ben => ben.id !== benefit.id));
          console.log('Benefit deleted successfully from backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend delete failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      console.log('Using fallback local state for benefit deletion');
      setBenefits(prev => prev.filter(ben => ben.id !== benefit.id));
    } catch (error) {
      console.error('Error deleting benefit:', error);
    } finally {
      setShowDeleteBenefitConfirm(false);
      setBenefitToDelete(null);
    }
  };

  const handleDeleteBenefit = (benefit: Benefit) => {
    setBenefitToDelete(benefit);
    setShowDeleteBenefitConfirm(true);
  };

  const toggleEmployeeEnrollment = async (benefitId: string, employeeId: string) => {
    const benefit = benefits.find(b => b.id === benefitId);
    if (!benefit) return;

    const isEnrolled = benefit.enrolled_employees.includes(employeeId);
    const updatedEnrolledEmployees = isEnrolled
      ? benefit.enrolled_employees.filter(id => id !== employeeId)
      : [...benefit.enrolled_employees, employeeId];

    setEditingBenefit(benefit);
    setNewBenefit({ ...benefit, enrolled_employees: updatedEnrolledEmployees });
    await handleUpdateBenefit();
  };

  // Performance Review CRUD operations
  const handleAddReview = async () => {
    if (!newReview.employee_id || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // If in quick mode, auto-fill missing scores based on overall score
      const overallScore = Number(newReview.overall_score) || 3;
      const reviewData = reviewMode === 'quick' ? {
        ...newReview,
        communication_score: Number(newReview.communication_score) || overallScore,
        technical_score: Number(newReview.technical_score) || overallScore,
        leadership_score: Number(newReview.leadership_score) || overallScore,
        goals_achievement: Number(newReview.goals_achievement) || overallScore,
        areas_for_improvement: newReview.areas_for_improvement || 'Continue developing skills and taking on new challenges.',
        goals_for_next_period: newReview.goals_for_next_period || 'Maintain current performance level and seek growth opportunities.'
      } : newReview;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/reviews?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...reviewData,
              reviewer_id: user.id
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          setPerformanceReviews(prev => [...prev, result.review]);
          setNewReview({});
          setShowAddReview(false);
          setReviewMode('quick');
          setSelectedPerformanceLevel('');
          console.log('Performance review saved successfully to backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend save failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      const review: PerformanceReview = {
        id: Date.now().toString(),
        employee_id: reviewData.employee_id,
        reviewer_id: user?.id || 'unknown',
        review_period: reviewData.review_period || new Date().toISOString().split('T')[0],
        overall_score: Number(reviewData.overall_score) || 3,
        communication_score: Number(reviewData.communication_score) || 3,
        technical_score: Number(reviewData.technical_score) || 3,
        leadership_score: Number(reviewData.leadership_score) || 3,
        goals_achievement: Number(reviewData.goals_achievement) || 3,
        strengths: reviewData.strengths || '',
        areas_for_improvement: reviewData.areas_for_improvement || '',
        goals_for_next_period: reviewData.goals_for_next_period || '',
        status: reviewData.status || 'draft',
        created_at: new Date().toISOString()
      };

      console.log('Using fallback local state for review');
      setPerformanceReviews(prev => [...prev, review]);
      setNewReview({});
      setShowAddReview(false);
      setReviewMode('quick');
      setSelectedPerformanceLevel('');
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const handleEditReview = (review: PerformanceReview) => {
    setEditingReview(review);
    setNewReview(review);
    setShowEditReview(true);
  };

  const handleUpdateReview = async () => {
    if (!editingReview || !newReview.employee_id || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/reviews/${editingReview.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newReview)
          }
        );

        if (response.ok) {
          const result = await response.json();
          setPerformanceReviews(prev => prev.map(rev => rev.id === editingReview.id ? result.review : rev));
          setNewReview({});
          setEditingReview(null);
          setShowEditReview(false);
          console.log('Review updated successfully on backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend update failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      const updatedReview: PerformanceReview = {
        ...editingReview,
        ...newReview,
        id: editingReview.id,
        created_at: editingReview.created_at
      };

      console.log('Using fallback local state for review update');
      setPerformanceReviews(prev => prev.map(rev => rev.id === editingReview.id ? updatedReview : rev));
      setNewReview({});
      setEditingReview(null);
      setShowEditReview(false);
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const confirmDeleteReview = async () => {
    const review = reviewToDelete;
    if (!selectedBusiness || !review) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken && user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/reviews/${review.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          setPerformanceReviews(prev => prev.filter(rev => rev.id !== review.id));
          console.log('Review deleted successfully from backend');
          return;
        } else {
          const errorText = await response.text();
          console.error('Backend delete failed:', response.status, errorText);
        }
      }

      // Fallback to local state
      console.log('Using fallback local state for review deletion');
      setPerformanceReviews(prev => prev.filter(rev => rev.id !== review.id));
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setShowDeleteReviewConfirm(false);
      setReviewToDelete(null);
    }
  };

  const handleDeleteReview = (review: PerformanceReview) => {
    setReviewToDelete(review);
    setShowDeleteReviewConfirm(true);
  };

  // Smart Actions - AI-powered HR recommendations
  const runSmartActions = async () => {
    if (!selectedBusiness) {
      toast.error('Please select a business first');
      return;
    }

    setLoadingSmartActions(true);
    setSmartActions([]);
    setSmartActionsSummary('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Please sign in to continue');
        setLoadingSmartActions(false);
        return;
      }

      console.log('🤖 Running Smart Actions for HR...', {
        businessId: selectedBusiness.id,
        employeeCount: employees.length,
        contractorCount: contractors.length
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/hr/smart-actions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            businessName: selectedBusiness.name,
            businessIndustry: selectedBusiness.industry,
            employees: employees.map(e => ({
              name: `${e.first_name} ${e.last_name}`,
              position: e.position,
              department: e.department,
              status: e.status,
              hireDate: e.hire_date,
              performanceScore: e.performance_score
            })),
            contractors: contractors.map(c => ({
              name: c.name,
              type: c.contractor_type,
              specialization: c.specialization,
              status: c.status,
              contractEnd: c.contract_end,
              hoursWorked: c.total_hours_worked
            })),
            benefits: benefits.map(b => ({
              name: b.name,
              type: b.type,
              enrolledCount: b.enrolled_employees.length,
              isActive: b.is_active
            })),
            performanceReviews: performanceReviews.map(r => ({
              overallScore: r.overall_score,
              status: r.status,
              period: r.review_period
            }))
          })
        }
      );

      console.log('🤖 Smart Actions response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Smart Actions completed:', data);
        
        setSmartActions(data.actions || []);
        setSmartActionsSummary(data.summary || '');
        setHasRunSmartActions(true);
        
        toast.success('Smart Actions completed!', {
          description: `Generated ${data.actions?.length || 0} recommendations`
        });
      } else {
        const errorData = await response.json();
        console.error('❌ Smart Actions error:', errorData);
        toast.error(errorData.error || 'Failed to generate smart actions');
      }
    } catch (error: any) {
      console.error('❌ Smart Actions error:', error);
      toast.error(`An error occurred: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingSmartActions(false);
    }
  };

  // Performance level presets
  const applyPerformancePreset = (level: string) => {
    setSelectedPerformanceLevel(level);
    
    const presets = {
      exceptional: {
        overall_score: 5,
        communication_score: 5,
        technical_score: 5,
        leadership_score: 5,
        goals_achievement: 5,
        strengths: 'Consistently exceeds expectations and demonstrates exceptional performance across all areas.',
        areas_for_improvement: 'Continue developing leadership skills and mentoring junior team members.',
        goals_for_next_period: 'Take on strategic initiatives and mentor team members.'
      },
      strong: {
        overall_score: 4.2,
        communication_score: 4.5,
        technical_score: 4,
        leadership_score: 4,
        goals_achievement: 4.5,
        strengths: 'Strong performer who consistently meets expectations and shows initiative.',
        areas_for_improvement: 'Focus on developing technical depth and cross-functional collaboration.',
        goals_for_next_period: 'Lead key projects and expand skill set in new areas.'
      },
      good: {
        overall_score: 3.7,
        communication_score: 4,
        technical_score: 3.5,
        leadership_score: 3.5,
        goals_achievement: 4,
        strengths: 'Reliable team member who completes assigned work on time.',
        areas_for_improvement: 'Work on proactive communication and taking more ownership of projects.',
        goals_for_next_period: 'Increase autonomy and take on more challenging assignments.'
      },
      needsImprovement: {
        overall_score: 2.8,
        communication_score: 3,
        technical_score: 2.5,
        leadership_score: 3,
        goals_achievement: 2.5,
        strengths: 'Shows willingness to learn and improve.',
        areas_for_improvement: 'Requires improvement in core job responsibilities and meeting deadlines.',
        goals_for_next_period: 'Focus on fundamental skills development and consistent performance.'
      }
    };

    const preset = presets[level as keyof typeof presets];
    if (preset) {
      setNewReview(prev => ({
        ...prev,
        ...preset
      }));
    }
  };

  // Calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const totalContractors = contractors.length;
  const activeContractors = contractors.filter(c => c.status === 'active').length;
  const totalTeamMembers = activeEmployees + activeContractors;

  const averagePerformance = performanceReviews.length > 0 
    ? performanceReviews.reduce((sum, review) => sum + review.overall_score, 0) / performanceReviews.length 
    : 0;

  const totalPayroll = employees
    .filter(e => e.status === 'active')
    .reduce((sum, e) => sum + e.salary, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500">Loading HR data...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-4)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: isMobile && isIOSApp ? 'max(env(safe-area-inset-bottom, 0px) + 120px, 120px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
      }}
    >
      {/* Header - Reduced spacing */}
      <BusinessDropdownHeader
        title="Human Resources Operations"
        description="Manage your team, benefits, and HR operations"
        icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
        accentColor="red"
      />

      {/* HR Management Tabs - Fixed alignment and spacing */}
      <Tabs defaultValue="quick-actions" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
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
            className="data-[state=active]:bg-white/50 data-[state=active]:text-red-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Actions
          </TabsTrigger>
          <TabsTrigger 
            value="cofounder-hr" 
            className="data-[state=active]:bg-white/50 data-[state=active]:text-red-600 text-[10px] sm:text-sm items-center justify-center flex"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="insights" 
            className="data-[state=active]:bg-white/50 data-[state=active]:text-red-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Manager
          </TabsTrigger>
          <TabsTrigger 
            value="employees" 
            className="data-[state=active]:bg-white/50 data-[state=active]:text-red-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Employees
          </TabsTrigger>
          <TabsTrigger 
            value="contractors" 
            className="data-[state=active]:bg-white/50 data-[state=active]:text-red-600 text-[10px] sm:text-sm flex items-center justify-center"
            style={{
              padding: 'var(--spacing-2) var(--spacing-3)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Contractors
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab - AI-Powered HR Assistant */}
        <TabsContent value="cofounder-hr">
          <CofounderHR user={user} userData={userData} />
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" style={{ marginTop: 'var(--spacing-4)' }}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Generate HR documents and templates instantly
              </CardDescription>
            </CardHeader>
            <CardContent style={{ padding: 'var(--spacing-6)', paddingTop: 0 }}>
              <div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
                style={{ gap: 'var(--spacing-3)' }}
              >
                {mockQuickActions.map((action, index) => {
                  const Icon = action.icon;
                  const isProcessing = backgroundJobs.has(action.action);
                  return (
                    <Card
                      key={index}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-none relative"
                      style={{
                        background: 'var(--background)',
                        borderRadius: 'var(--radius-xl)',
                        opacity: isProcessing ? 0.6 : 1,
                      }}
                      onClick={() => {
                        if (isProcessing) return; // Prevent click while processing
                        if (action.action === 'contractor_research') {
                          setShowContractorResearch(true);
                        } else {
                          handleQuickActionClick(action);
                        }
                      }}
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
                          10 credits
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
                          {isProcessing ? (
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: action.color }} />
                          ) : (
                            <Icon className="w-6 h-6" style={{ color: action.color }} />
                          )}
                        </div>
                        <div>
                          <p 
                            style={{ 
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: 'var(--spacing-1)',
                              fontSize: '0.875rem',
                            }}
                          >
                            {action.label}
                          </p>
                          <p 
                            style={{
                              opacity: 0.6,
                              fontSize: '0.75rem',
                            }}
                          >
                            {isProcessing ? 'Generating...' : action.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Generated Documents Section */}
              <div style={{ marginTop: 'var(--spacing-6)' }}>
                <div 
                  className="flex items-center justify-between"
                  style={{ marginBottom: 'var(--spacing-4)' }}
                >
                  <h3 
                    className="flex items-center"
                    style={{ gap: 'var(--spacing-2)' }}
                  >
                    <FileText className="w-5 h-5" />
                    Generated Documents
                  </h3>
                  <Badge variant="secondary">
                    {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                  </Badge>
                </div>
                
                {loadingDocuments ? (
                  <div className="flex items-center justify-center" style={{ padding: 'var(--spacing-8)' }}>
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : documents.length === 0 ? (
                  <div
                    className="text-center"
                    style={{
                      padding: 'var(--spacing-8)',
                      opacity: 0.6,
                      background: 'var(--muted)',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    <FileText className="w-12 h-12 mx-auto" style={{ marginBottom: 'var(--spacing-3)', opacity: 0.3 }} />
                    <p>No documents generated yet</p>
                    <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-2)' }}>
                      Use the quick actions above to generate your first HR document
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    {documents.map((document) => {
                      // Handle both documentType (camelCase from backend) and document_type (snake_case)
                      const docType = document.documentType || document.document_type || '';
                      const action = mockQuickActions.find(a => docType && a.action === docType);
                      const color = action?.color || '#6c5ce7';
                      const Icon = action?.icon || FileText;
                      
                      return (
                        <Card 
                          key={document.id} 
                          style={{ 
                            borderLeft: `4px solid ${color}`,
                            background: 'var(--background)'
                          }}
                        >
                          <CardContent style={{ padding: 'var(--spacing-4)' }}>
                            <div className="flex items-start justify-between" style={{ gap: 'var(--spacing-4)' }}>
                              <div className="flex items-start" style={{ gap: 'var(--spacing-3)', flex: 1 }}>
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${color}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={{ marginBottom: 'var(--spacing-1)' }}>
                                    {document.title}
                                  </h4>
                                  {document.aiSummary && (
                                    <p style={{ 
                                      fontSize: '0.875rem', 
                                      opacity: 0.7,
                                      marginBottom: 'var(--spacing-2)',
                                      lineHeight: 1.5
                                    }}>
                                      {document.aiSummary}
                                    </p>
                                  )}
                                  <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                    Generated {new Date(document.createdAt || document.created_at || Date.now()).toLocaleDateString()} at{' '}
                                    {new Date(document.createdAt || document.created_at || Date.now()).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(document)}
                                  style={{ gap: 'var(--spacing-2)' }}
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(document.id)}
                                  style={{ 
                                    color: 'var(--destructive)',
                                    borderColor: 'var(--destructive)'
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Automation Reports */}
              <div style={{ marginTop: 'var(--spacing-6)' }}>
                <AutomationReportsWidget 
                  category="hr" 
                  categoryColor="var(--chart-2)"
                  maxResults={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manager Tab - Slack Integration for Employee/Contractor Management */}
        <TabsContent value="insights" style={{ marginTop: 'var(--spacing-4)' }}>
          <Card
            className="border-none"
            style={{
              background: 'var(--background)',
              borderRadius: 'var(--radius-2xl)',
            }}
          >
            <CardHeader style={{ padding: 'var(--spacing-6)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle 
                    className="flex items-center"
                    style={{ gap: 'var(--spacing-2)' }}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Slack Manager
                  </CardTitle>
                  <CardDescription>
                    Manage employees and contractors through Slack
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate('/operations/hr/slack')}
                  className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white border-[#4A154B] flex items-center"
                  style={{
                    gap: 'var(--spacing-2)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <Slack className="w-4 h-4" />
                  <span>Configure Slack</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent style={{ padding: 'var(--spacing-6)', paddingTop: 0 }}>
              <div 
                className="flex flex-col"
                style={{ gap: 'var(--spacing-4)' }}
              >
                {/* Integration Status */}
                <div
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 
                        style={{ 
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--spacing-2)',
                        }}
                      >
                        Integration Status
                      </h4>
                      <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                        Slack integration is active and ready to manage your team. Use Slack commands to add, update, and monitor employees and contractors in real-time.
                      </p>
                    </div>
                    <Badge
                      className="border-none"
                      style={{
                        background: '#00b89420',
                        color: '#00b894',
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>

                {/* Feature Overview */}
                <div>
                  <h4 
                    style={{ 
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--spacing-3)',
                    }}
                  >
                    Manager Capabilities
                  </h4>
                  <div 
                    className="grid sm:grid-cols-2"
                    style={{ gap: 'var(--spacing-3)' }}
                  >
                    <div
                      style={{
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-4)',
                      }}
                    >
                      <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
                        <div
                          style={{
                            background: 'var(--accent)',
                            borderRadius: 'var(--radius)',
                            padding: 'var(--spacing-2)',
                          }}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 
                            style={{ 
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: 'var(--spacing-1)',
                              fontSize: '0.875rem',
                            }}
                          >
                            Team Management
                          </h5>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            Add, update, and remove employees and contractors directly from Slack
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-4)',
                      }}
                    >
                      <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
                        <div
                          style={{
                            background: 'var(--accent)',
                            borderRadius: 'var(--radius)',
                            padding: 'var(--spacing-2)',
                          }}
                        >
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 
                            style={{ 
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: 'var(--spacing-1)',
                              fontSize: '0.875rem',
                            }}
                          >
                            Real-time Notifications
                          </h5>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            Receive instant updates about team changes and important HR events
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-4)',
                      }}
                    >
                      <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
                        <div
                          style={{
                            background: 'var(--accent)',
                            borderRadius: 'var(--radius)',
                            padding: 'var(--spacing-2)',
                          }}
                        >
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 
                            style={{ 
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: 'var(--spacing-1)',
                              fontSize: '0.875rem',
                            }}
                          >
                            Time Tracking
                          </h5>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            Monitor contractor hours and employee time entries via Slack
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-4)',
                      }}
                    >
                      <div className="flex items-start" style={{ gap: 'var(--spacing-3)' }}>
                        <div
                          style={{
                            background: 'var(--accent)',
                            borderRadius: 'var(--radius)',
                            padding: 'var(--spacing-2)',
                          }}
                        >
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 
                            style={{ 
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: 'var(--spacing-1)',
                              fontSize: '0.875rem',
                            }}
                          >
                            Status Reports
                          </h5>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                            Get team status summaries and performance insights on demand
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Start Guide */}
                <div
                  style={{
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                  }}
                >
                  <h4 
                    style={{ 
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--spacing-3)',
                    }}
                  >
                    Getting Started
                  </h4>
                  <ol style={{ paddingLeft: 'var(--spacing-5)' }}>
                    <li style={{ marginBottom: 'var(--spacing-2)', fontSize: '0.875rem', opacity: 0.8 }}>
                      Click "Configure Slack" to set up your integration settings
                    </li>
                    <li style={{ marginBottom: 'var(--spacing-2)', fontSize: '0.875rem', opacity: 0.8 }}>
                      Use Slack commands to manage your team members
                    </li>
                    <li style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      Receive automated notifications and updates in your chosen Slack channel
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">Employee Management</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">Manage your team members</CardDescription>
                </div>
                <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Add Employee</span>
                      <span className="sm:hidden ml-1">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-gray-900">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Employee</DialogTitle>
                      <DialogDescription className="text-foreground/80">
                        Enter the employee details below. Fields marked with <span style={{ color: 'var(--destructive)', fontWeight: 'var(--font-weight-semibold)' }}>*</span> are required.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                            First Name <span style={{ color: 'var(--destructive)' }}>*</span>
                          </Label>
                          <Input
                            id="first_name"
                            value={newEmployee.first_name || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, first_name: e.target.value }))}
                            className="bg-background text-foreground"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                            Last Name <span style={{ color: 'var(--destructive)' }}>*</span>
                          </Label>
                          <Input
                            id="last_name"
                            value={newEmployee.last_name || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, last_name: e.target.value }))}
                            className="bg-background text-foreground"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>
                          Email <span style={{ color: 'var(--destructive)' }}>*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployee.email || ''}
                          onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-background text-foreground"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="position" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>Position</Label>
                          <Input
                            id="position"
                            value={newEmployee.position || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                            className="bg-background text-foreground"
                          />
                        </div>
                        <div>
                          <Label htmlFor="department" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>Department</Label>
                          <Input
                            id="department"
                            value={newEmployee.department || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                            className="bg-background text-foreground"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="employment_type" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>Employment Type</Label>
                          <Select 
                            value={newEmployee.employment_type || ''} 
                            onValueChange={(value) => setNewEmployee(prev => ({ ...prev, employment_type: value as any }))}
                          >
                            <SelectTrigger className="bg-background text-foreground">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_time">Full Time</SelectItem>
                              <SelectItem value="part_time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="intern">Intern</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="salary" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>Annual Salary</Label>
                          <Input
                            id="salary"
                            type="number"
                            value={newEmployee.salary || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: Number(e.target.value) }))}
                            className="bg-background text-foreground"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location" style={{ color: 'var(--foreground)', fontWeight: 'var(--font-weight-medium)' }}>Location</Label>
                        <Input
                          id="location"
                          value={newEmployee.location || ''}
                          onChange={(e) => setNewEmployee(prev => ({ ...prev, location: e.target.value }))}
                          className="bg-background text-foreground"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddEmployee(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Add Employee
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Employee Dialog */}
                <Dialog open={showEditEmployee} onOpenChange={setShowEditEmployee}>
                  <DialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20">
                    <DialogHeader>
                      <DialogTitle>Edit Employee</DialogTitle>
                      <DialogDescription>Update the employee details below</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_first_name">First Name</Label>
                          <Input
                            id="edit_first_name"
                            value={newEmployee.first_name || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, first_name: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_last_name">Last Name</Label>
                          <Input
                            id="edit_last_name"
                            value={newEmployee.last_name || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, last_name: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_email">Email</Label>
                        <Input
                          id="edit_email"
                          type="email"
                          value={newEmployee.email || ''}
                          onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_position">Position</Label>
                          <Input
                            id="edit_position"
                            value={newEmployee.position || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_department">Department</Label>
                          <Input
                            id="edit_department"
                            value={newEmployee.department || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_employment_type">Employment Type</Label>
                          <Select 
                            value={newEmployee.employment_type || ''} 
                            onValueChange={(value) => setNewEmployee(prev => ({ ...prev, employment_type: value as any }))}
                          >
                            <SelectTrigger className="bg-white/50 dark:bg-white/10 border-white/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_time">Full Time</SelectItem>
                              <SelectItem value="part_time">Part Time</SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="intern">Intern</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="edit_salary">Annual Salary</Label>
                          <Input
                            id="edit_salary"
                            type="number"
                            value={newEmployee.salary || ''}
                            onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: Number(e.target.value) }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="edit_location">Location</Label>
                        <Input
                          id="edit_location"
                          value={newEmployee.location || ''}
                          onChange={(e) => setNewEmployee(prev => ({ ...prev, location: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowEditEmployee(false);
                            setEditingEmployee(null);
                            setNewEmployee({});
                          }}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateEmployee} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Update Employee
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No employees found. Add your first employee to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                              <div className="text-sm text-gray-500">{employee.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {employee.employment_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(employee.status)}>
                              {employee.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>${employee.salary?.toLocaleString() || 0}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditEmployee(employee)}
                                className="hover:bg-blue-50 hover:border-blue-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeleteEmployee(employee)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Notifications Section */}
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl" style={{
            marginTop: 'var(--spacing-6)',
          }}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Employee Notifications</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">HR notifications and updates</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <HRNotifications user={user} userData={userData} />
            </CardContent>
          </Card>

          {/* Employee Benefits Section */}
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl" style={{
            marginTop: 'var(--spacing-6)',
          }}>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">Employee Benefits</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">Benefits programs and enrollment</CardDescription>
                </div>
                <Dialog open={showAddBenefit} onOpenChange={setShowAddBenefit}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Add Benefit</span>
                      <span className="sm:hidden ml-1">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Benefit</DialogTitle>
                      <DialogDescription>Create a new employee benefit program</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="benefit_name">Benefit Name*</Label>
                        <Input
                          id="benefit_name"
                          value={newBenefit.name || ''}
                          onChange={(e) => setNewBenefit(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          placeholder="e.g., Health Insurance, 401(k)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="benefit_type">Type*</Label>
                        <Select 
                          value={newBenefit.type || ''} 
                          onValueChange={(value) => setNewBenefit(prev => ({ ...prev, type: value as any }))}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-white/10 border-white/20">
                            <SelectValue placeholder="Select benefit type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="health">Health Insurance</SelectItem>
                            <SelectItem value="dental">Dental Insurance</SelectItem>
                            <SelectItem value="vision">Vision Insurance</SelectItem>
                            <SelectItem value="retirement">Retirement/401(k)</SelectItem>
                            <SelectItem value="vacation">Paid Time Off</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="benefit_description">Description</Label>
                        <Textarea
                          id="benefit_description"
                          value={newBenefit.description || ''}
                          onChange={(e) => setNewBenefit(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          rows={3}
                          placeholder="Brief description of the benefit"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="benefit_cost">Cost per Employee ($)</Label>
                          <Input
                            id="benefit_cost"
                            type="number"
                            value={newBenefit.cost_per_employee || ''}
                            onChange={(e) => setNewBenefit(prev => ({ ...prev, cost_per_employee: Number(e.target.value) }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="benefit_contribution">Employee Contribution ($)</Label>
                          <Input
                            id="benefit_contribution"
                            type="number"
                            value={newBenefit.employee_contribution || ''}
                            onChange={(e) => setNewBenefit(prev => ({ ...prev, employee_contribution: Number(e.target.value) }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="benefit_provider">Provider (Optional)</Label>
                        <Input
                          id="benefit_provider"
                          value={newBenefit.provider || ''}
                          onChange={(e) => setNewBenefit(prev => ({ ...prev, provider: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          placeholder="e.g., Blue Cross Blue Shield"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAddBenefit(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddBenefit} className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Benefit
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {benefits.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No benefits found. Create your first employee benefit program.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {benefits.map((benefit) => (
                    <Card key={benefit.id} className="bg-white/50 dark:bg-white/5">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{benefit.name}</h3>
                              <Badge variant="outline">{benefit.type.replace('_', ' ').toUpperCase()}</Badge>
                              {benefit.is_active && <Badge variant="default" className="bg-green-600">Active</Badge>}
                            </div>
                            {benefit.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{benefit.description}</p>
                            )}
                            {benefit.provider && (
                              <p className="text-xs text-gray-500">Provider: {benefit.provider}</p>
                            )}
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500">Cost/Employee</p>
                                <p className="font-bold text-green-600">${benefit.cost_per_employee.toFixed(2)}</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500">Employee Pays</p>
                                <p className="font-bold text-orange-600">${benefit.employee_contribution.toFixed(2)}</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <p className="text-xs text-gray-500">Enrolled</p>
                                <p className="font-bold text-blue-600">{benefit.enrolled_employees?.length || 0}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingBenefit(benefit);
                                setNewBenefit(benefit);
                                setShowEditBenefit(true);
                              }}
                              className="hover:bg-green-50 hover:border-green-200"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setBenefitToDelete(benefit);
                                setShowDeleteBenefitConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Performance Section */}
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl" style={{
            marginTop: 'var(--spacing-6)',
          }}>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">Employee Performance</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">Performance reviews and tracking</CardDescription>
                </div>
                <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">New Review</span>
                      <span className="sm:hidden ml-1">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Performance Review</DialogTitle>
                      <DialogDescription>Quick and easy employee evaluation</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="review_employee">Employee*</Label>
                        <Select 
                          value={newReview.employee_id || ''} 
                          onValueChange={(value) => setNewReview(prev => ({ ...prev, employee_id: value }))}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-white/10 border-white/20">
                            <SelectValue placeholder="Select employee to review" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.filter(e => e.status === 'active').map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.first_name} {emp.last_name} - {emp.position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="review_period">Review Period*</Label>
                        <Input
                          id="review_period"
                          value={newReview.review_period || ''}
                          onChange={(e) => setNewReview(prev => ({ ...prev, review_period: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          placeholder="e.g., Q1 2024, January 2024"
                        />
                      </div>
                      <div>
                        <Label htmlFor="overall_score">Overall Performance: {(newReview.overall_score || 3).toFixed(1)} / 5.0</Label>
                        <input
                          id="overall_score"
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={newReview.overall_score || 3}
                          onChange={(e) => setNewReview(prev => ({ ...prev, overall_score: Number(e.target.value) }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Poor</span>
                          <span>Average</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="review_strengths">Key Strengths</Label>
                        <Textarea
                          id="review_strengths"
                          value={newReview.strengths || ''}
                          onChange={(e) => setNewReview(prev => ({ ...prev, strengths: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          rows={3}
                          placeholder="What are they doing exceptionally well?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review_improvements">Areas for Improvement</Label>
                        <Textarea
                          id="review_improvements"
                          value={newReview.areas_for_improvement || ''}
                          onChange={(e) => setNewReview(prev => ({ ...prev, areas_for_improvement: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          rows={3}
                          placeholder="Where can they grow and develop?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review_goals">Goals for Next Period</Label>
                        <Textarea
                          id="review_goals"
                          value={newReview.goals_for_next_period || ''}
                          onChange={(e) => setNewReview(prev => ({ ...prev, goals_for_next_period: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          rows={3}
                          placeholder="What should they accomplish next?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review_status">Review Status</Label>
                        <Select 
                          value={newReview.status || 'draft'} 
                          onValueChange={(value) => setNewReview(prev => ({ ...prev, status: value as any }))}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-white/10 border-white/20">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">💾 Draft</SelectItem>
                            <SelectItem value="completed">✅ Completed</SelectItem>
                            <SelectItem value="approved">⭐ Approved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAddReview(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddReview} className="bg-purple-600 hover:bg-purple-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Review
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {performanceReviews.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No performance reviews found. Create your first review to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {performanceReviews.map((review) => {
                    const employee = employees.find(e => e.id === review.employee_id);
                    const getScoreColor = (score: number) => {
                      if (score >= 4.5) return 'text-green-600';
                      if (score >= 4.0) return 'text-blue-600';
                      if (score >= 3.5) return 'text-yellow-600';
                      if (score >= 3.0) return 'text-orange-600';
                      return 'text-red-600';
                    };

                    return (
                      <Card key={review.id} className="bg-white/50 dark:bg-white/5">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{employee?.first_name} {employee?.last_name}</h3>
                                <Badge variant="outline">{employee?.position}</Badge>
                                <Badge variant={
                                  review.status === 'approved' ? 'default' : 
                                  review.status === 'completed' ? 'secondary' : 
                                  'outline'
                                }>
                                  {review.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">Period: {review.review_period}</p>
                              
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded inline-block">
                                <p className="text-xs text-gray-500">Overall Score</p>
                                <p className={`text-xl font-bold ${getScoreColor(review.overall_score)}`}>
                                  {review.overall_score.toFixed(1)} / 5.0
                                </p>
                              </div>

                              {review.strengths && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-green-600 mb-1">Strengths:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.strengths}</p>
                                </div>
                              )}
                              
                              {review.areas_for_improvement && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-orange-600 mb-1">Areas for Improvement:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.areas_for_improvement}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingReview(review);
                                  setNewReview(review);
                                  setShowEditReview(true);
                                }}
                                className="hover:bg-purple-50 hover:border-purple-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setReviewToDelete(review);
                                  setShowDeleteReviewConfirm(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Handbooks Section */}
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl" style={{
            marginTop: 'var(--spacing-6)',
          }}>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                    <BookOpen className="w-5 h-5" />
                    Employee Handbooks
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">Manage employee handbooks and documentation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {loadingHandbooks ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
                  <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Loading handbooks...</p>
                </div>
              ) : handbooks.length > 0 ? (
                <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
                  {handbooks.map((handbook) => (
                    <div
                      key={handbook.id}
                      style={{
                        background: 'var(--muted)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-4)',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center" style={{ gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                            <h3 style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '0.875rem' }}>
                              {handbook.role_title}
                            </h3>
                            <Badge variant={
                              handbook.status === 'published' ? 'default' : 
                              handbook.status === 'draft' ? 'secondary' : 
                              'outline'
                            }>
                              {handbook.status}
                            </Badge>
                          </div>
                          <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{handbook.word_count.toLocaleString()} words</p>
                          <p style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: 'var(--spacing-1)' }}>
                            Updated {new Date(handbook.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex" style={{ gap: 'var(--spacing-2)' }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/operations/hr/handbook/${handbook.id}`)}
                            style={{
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              height: 'auto',
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/operations/hr/handbook/${handbook.id}?edit=true`)}
                            style={{
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              height: 'auto',
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHandbook(handbook.id)}
                            style={{
                              padding: 'var(--spacing-1) var(--spacing-2)',
                              height: 'auto',
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: 'var(--spacing-3)' }}>No handbooks yet</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                    Go to Quick Actions tab to create your first handbook
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Onboarding Section */}
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl" style={{
            marginTop: 'var(--spacing-6)',
          }}>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">Employee Onboarding</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">New hire onboarding processes</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
                  onClick={() => {
                    // Navigate to onboarding tab in Cofounder Manager
                    const cofounderTab = document.querySelector('[value="cofounder-hr"]') as HTMLElement;
                    if (cofounderTab) {
                      cofounderTab.click();
                      // Then trigger onboarding tab within Cofounder Manager
                      setTimeout(() => {
                        const onboardingTab = document.querySelector('[value="onboarding"]') as HTMLElement;
                        if (onboardingTab) onboardingTab.click();
                      }, 100);
                    }
                  }}
                >
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Onboarding Plan</span>
                  <span className="sm:hidden ml-1">Create</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">Powered by Cofounder Manager</h4>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                        Create comprehensive onboarding plans with our tool. Get automated checklists, role-specific tasks, and training schedules tailored to each new hire.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                        onClick={() => {
                          const cofounderTab = document.querySelector('[value="cofounder-hr"]') as HTMLElement;
                          if (cofounderTab) {
                            cofounderTab.click();
                            setTimeout(() => {
                              const onboardingTab = document.querySelector('[value="onboarding"]') as HTMLElement;
                              if (onboardingTab) onboardingTab.click();
                            }, 100);
                          }
                        }}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Go to Onboarding
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <ClipboardCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold">Task Checklists</p>
                    <p className="text-xs text-gray-500 mt-1">Automated day-by-day tasks</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold">Training Schedule</p>
                    <p className="text-xs text-gray-500 mt-1">Structured learning paths</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <UserCheck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="font-semibold">Progress Tracking</p>
                    <p className="text-xs text-gray-500 mt-1">Monitor completion status</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* Contractors Tab */}
        <TabsContent value="contractors" className="space-y-4">
          {/* Contractor Management */}
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">Contractor Management</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-0.5 sm:mt-1">Manage contractors and vendors</CardDescription>
                </div>
                <Dialog open={showAddContractor} onOpenChange={(open) => {
                  setShowAddContractor(open);
                  if (!open) {
                    setNewContractor({});
                    setTempContacts([]);
                    setContractorTypeStep('select');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Add Contractor</span>
                      <span className="sm:hidden ml-1">Add</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {contractorTypeStep === 'select' ? 'Choose Contractor Type' : 'Add New Contractor'}
                      </DialogTitle>
                      <DialogDescription>
                        {contractorTypeStep === 'select' 
                          ? 'Is this contractor a company or an individual person?' 
                          : 'Enter the contractor details below'}
                      </DialogDescription>
                    </DialogHeader>
                    
                    {/* Step 1: Choose Type */}
                    {contractorTypeStep === 'select' && (
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-900/20"
                            onClick={() => {
                              setNewContractor({ contractor_type: 'person' });
                              setContractorTypeStep('form');
                            }}
                          >
                            <User className="w-8 h-8 text-orange-600" />
                            <div className="text-center">
                              <div className="font-semibold">Individual Person</div>
                              <div className="text-xs text-gray-500 mt-1">Freelancer or consultant</div>
                            </div>
                          </Button>

                          <Button
                            variant="outline"
                            className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-900/20"
                            onClick={() => {
                              setNewContractor({ contractor_type: 'company' });
                              setContractorTypeStep('form');
                            }}
                          >
                            <Building className="w-8 h-8 text-orange-600" />
                            <div className="text-center">
                              <div className="font-semibold">Company</div>
                              <div className="text-xs text-gray-500 mt-1">Business or agency</div>
                            </div>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Form based on type */}
                    {contractorTypeStep === 'form' && (
                      <div className="space-y-4">
                        {newContractor.contractor_type === 'person' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <Label htmlFor="person_name">Full Name*</Label>
                                <Input
                                  id="person_name"
                                  value={newContractor.name || ''}
                                  onChange={(e) => setNewContractor(prev => ({ ...prev, name: e.target.value }))}
                                  className="bg-white/50 dark:bg-white/10 border-white/20"
                                  placeholder="John Doe"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="person_email">Email*</Label>
                                <Input
                                  id="person_email"
                                  type="email"
                                  value={newContractor.email || ''}
                                  onChange={(e) => setNewContractor(prev => ({ ...prev, email: e.target.value }))}
                                  className="bg-white/50 dark:bg-white/10 border-white/20"
                                />
                              </div>
                              <div>
                                <Label htmlFor="person_phone">Phone</Label>
                                <Input
                                  id="person_phone"
                                  value={newContractor.phone || ''}
                                  onChange={(e) => setNewContractor(prev => ({ ...prev, phone: e.target.value }))}
                                  className="bg-white/50 dark:bg-white/10 border-white/20"
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="person_title">Title/Role</Label>
                              <Input
                                id="person_title"
                                value={newContractor.title || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                                placeholder="e.g., Senior Developer"
                              />
                            </div>
                          </>
                        )}

                        {newContractor.contractor_type === 'company' && (
                          <>
                            <div>
                              <Label htmlFor="company_name">Company Name*</Label>
                              <Input
                                id="company_name"
                                value={newContractor.company_name || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, company_name: e.target.value, name: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                                placeholder="Acme Corporation"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="company_email">Main Email*</Label>
                                <Input
                                  id="company_email"
                                  type="email"
                                  value={newContractor.email || ''}
                                  onChange={(e) => setNewContractor(prev => ({ ...prev, email: e.target.value }))}
                                  className="bg-white/50 dark:bg-white/10 border-white/20"
                                />
                              </div>
                              <div>
                                <Label htmlFor="company_phone">Main Phone</Label>
                                <Input
                                  id="company_phone"
                                  value={newContractor.phone || ''}
                                  onChange={(e) => setNewContractor(prev => ({ ...prev, phone: e.target.value }))}
                                  className="bg-white/50 dark:bg-white/10 border-white/20"
                                />
                              </div>
                            </div>

                            {/* Contacts Section for Companies */}
                            <div className="border-t pt-4 mt-4">
                              <div className="flex items-center justify-between mb-3">
                                <Label>Company Contacts (Optional)</Label>
                                <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-orange-600">
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Add Contact
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-white dark:bg-gray-900">
                                    <DialogHeader>
                                      <DialogTitle>Add Contact Person</DialogTitle>
                                      <DialogDescription>Add an individual contact at this company</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="contact_name">Name*</Label>
                                        <Input
                                          id="contact_name"
                                          value={newContact.name || ''}
                                          onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="contact_email">Email*</Label>
                                          <Input
                                            id="contact_email"
                                            type="email"
                                            value={newContact.email || ''}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="contact_phone">Phone</Label>
                                          <Input
                                            id="contact_phone"
                                            value={newContact.phone || ''}
                                            onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <Label htmlFor="contact_title">Title</Label>
                                        <Input
                                          id="contact_title"
                                          value={newContact.title || ''}
                                          onChange={(e) => setNewContact(prev => ({ ...prev, title: e.target.value }))}
                                          placeholder="e.g., Project Manager"
                                        />
                                      </div>
                                      <div className="flex justify-end space-x-2">
                                        <Button variant="outline" onClick={() => {
                                          setShowAddContact(false);
                                          setNewContact({});
                                        }}>
                                          Cancel
                                        </Button>
                                        <Button onClick={handleAddContact} className="bg-orange-600 hover:bg-orange-700 text-white">
                                          Add Contact
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>

                              {tempContacts.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-3 border border-dashed rounded">
                                  No contacts added yet
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {tempContacts.map((contact) => (
                                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{contact.name}</span>
                                          {contact.is_primary && (
                                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {contact.title && <span>{contact.title} • </span>}
                                          {contact.email}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {!contact.is_primary && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSetPrimaryContact(contact.id)}
                                            className="text-xs"
                                          >
                                            Set Primary
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRemoveContact(contact.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Common fields for both types */}
                        <div className="border-t pt-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="specialization">Specialization</Label>
                              <Input
                                id="specialization"
                                value={newContractor.specialization || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, specialization: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                                placeholder="e.g., Web Development"
                              />
                            </div>
                            <div>
                              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                              <Input
                                id="hourly_rate"
                                type="number"
                                value={newContractor.hourly_rate || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, hourly_rate: Number(e.target.value) }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label htmlFor="contract_start">Contract Start</Label>
                              <Input
                                id="contract_start"
                                type="date"
                                value={newContractor.contract_start || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, contract_start: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                              />
                            </div>
                            <div>
                              <Label htmlFor="contract_end">Contract End</Label>
                              <Input
                                id="contract_end"
                                type="date"
                                value={newContractor.contract_end || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, contract_end: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              value={newContractor.address || ''}
                              onChange={(e) => setNewContractor(prev => ({ ...prev, address: e.target.value }))}
                              className="bg-white/50 dark:bg-white/10 border-white/20"
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="col-span-2">
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={newContractor.city || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, city: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State</Label>
                              <Input
                                id="state"
                                value={newContractor.state || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, state: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                              />
                            </div>
                            <div>
                              <Label htmlFor="zip">ZIP</Label>
                              <Input
                                id="zip"
                                value={newContractor.zip || ''}
                                onChange={(e) => setNewContractor(prev => ({ ...prev, zip: e.target.value }))}
                                className="bg-white/50 dark:bg-white/10 border-white/20"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={newContractor.country || ''}
                              onChange={(e) => setNewContractor(prev => ({ ...prev, country: e.target.value }))}
                              className="bg-white/50 dark:bg-white/10 border-white/20"
                            />
                          </div>

                          <div className="mt-4">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={newContractor.notes || ''}
                              onChange={(e) => setNewContractor(prev => ({ ...prev, notes: e.target.value }))}
                              className="bg-white/50 dark:bg-white/10 border-white/20"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setContractorTypeStep('select')}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          >
                            Back
                          </Button>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setShowAddContractor(false);
                                setNewContractor({});
                                setTempContacts([]);
                                setContractorTypeStep('select');
                              }}
                              className="bg-white/50 dark:bg-white/10 border-white/20"
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleAddContractor} className="bg-orange-600 hover:bg-orange-700 text-white">
                              Add Contractor
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Edit Contractor Dialog */}
                <Dialog open={showEditContractor} onOpenChange={setShowEditContractor}>
                  <DialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Contractor</DialogTitle>
                      <DialogDescription>Update contractor details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="edit_contractor_name">Name / Company Name*</Label>
                          <Input
                            id="edit_contractor_name"
                            value={newContractor.name || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_contractor_email">Email*</Label>
                          <Input
                            id="edit_contractor_email"
                            type="email"
                            value={newContractor.email || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_contractor_phone">Phone</Label>
                          <Input
                            id="edit_contractor_phone"
                            value={newContractor.phone || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, phone: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_contractor_company">Company</Label>
                          <Input
                            id="edit_contractor_company"
                            value={newContractor.company || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, company: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_contractor_contact">Contact Person</Label>
                          <Input
                            id="edit_contractor_contact"
                            value={newContractor.contact_person || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, contact_person: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_contractor_specialization">Specialization</Label>
                          <Input
                            id="edit_contractor_specialization"
                            value={newContractor.specialization || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, specialization: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_contractor_hourly_rate">Hourly Rate ($)</Label>
                          <Input
                            id="edit_contractor_hourly_rate"
                            type="number"
                            value={newContractor.hourly_rate || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, hourly_rate: Number(e.target.value) }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_contractor_start">Contract Start Date</Label>
                          <Input
                            id="edit_contractor_start"
                            type="date"
                            value={newContractor.contract_start || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, contract_start: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_contractor_end">Contract End Date</Label>
                          <Input
                            id="edit_contractor_end"
                            type="date"
                            value={newContractor.contract_end || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, contract_end: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_contractor_status">Status</Label>
                          <Select 
                            value={newContractor.status || ''} 
                            onValueChange={(value) => setNewContractor(prev => ({ ...prev, status: value as any }))}
                          >
                            <SelectTrigger className="bg-white/50 dark:bg-white/10 border-white/20">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="edit_contractor_address">Address</Label>
                        <Input
                          id="edit_contractor_address"
                          value={newContractor.address || ''}
                          onChange={(e) => setNewContractor(prev => ({ ...prev, address: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="edit_contractor_city">City</Label>
                          <Input
                            id="edit_contractor_city"
                            value={newContractor.city || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, city: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_contractor_state">State</Label>
                          <Input
                            id="edit_contractor_state"
                            value={newContractor.state || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, state: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_contractor_zip">ZIP</Label>
                          <Input
                            id="edit_contractor_zip"
                            value={newContractor.zip || ''}
                            onChange={(e) => setNewContractor(prev => ({ ...prev, zip: e.target.value }))}
                            className="bg-white/50 dark:bg-white/10 border-white/20"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="edit_contractor_country">Country</Label>
                        <Input
                          id="edit_contractor_country"
                          value={newContractor.country || ''}
                          onChange={(e) => setNewContractor(prev => ({ ...prev, country: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit_contractor_notes">Notes</Label>
                        <Textarea
                          id="edit_contractor_notes"
                          value={newContractor.notes || ''}
                          onChange={(e) => setNewContractor(prev => ({ ...prev, notes: e.target.value }))}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowEditContractor(false);
                            setEditingContractor(null);
                            setNewContractor({});
                          }}
                          className="bg-white/50 dark:bg-white/10 border-white/20"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateContractor} className="bg-orange-600 hover:bg-orange-700 text-white">
                          Update Contractor
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contractors.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No contractors found. Add your first contractor to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractors.map((contractor) => (
                        <TableRow key={contractor.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{contractor.name}</div>
                              {contractor.contact_person && (
                                <div className="text-sm text-gray-500">c/o {contractor.contact_person}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {contractor.email}
                              </div>
                              {contractor.phone && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Phone className="w-3 h-3" />
                                  {contractor.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{contractor.company || '-'}</TableCell>
                          <TableCell>{contractor.specialization}</TableCell>
                          <TableCell>${contractor.hourly_rate}/hr</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(contractor.status)}>
                              {contractor.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditContractor(contractor)}
                                className="hover:bg-orange-50 hover:border-orange-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeleteContractor(contractor)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Buttons */}
          <Card className="bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                Integrations & Platforms
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Connect to freelance platforms and communication tools</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-row gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  asChild
                  className="flex-1 gap-2 border-[#00E0FF] text-[#00E0FF] hover:bg-[#00E0FF]/10"
                >
                  <a href="https://www.upwork.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Upwork
                  </a>
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="flex-1 gap-2 border-[#FFCF00] text-[#FFCF00] hover:bg-[#FFCF00]/10"
                >
                  <a href="https://www.fiverr.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Fiverr
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Employee Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {employeeToDelete?.first_name} {employeeToDelete?.last_name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConfirm(false);
              setEmployeeToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEmployee}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Contractor Confirmation Dialog */}
      <AlertDialog open={showDeleteContractorConfirm} onOpenChange={setShowDeleteContractorConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {contractorToDelete?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteContractorConfirm(false);
              setContractorToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContractor}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Contractor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Benefit Confirmation Dialog */}
      <AlertDialog open={showDeleteBenefitConfirm} onOpenChange={setShowDeleteBenefitConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {benefitToDelete?.name}
              </span>
              ? {benefitToDelete && benefitToDelete.enrolled_employees.length > 0 && (
                <span className="text-orange-600">
                  This benefit has {benefitToDelete.enrolled_employees.length} enrolled employee(s).
                </span>
              )} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteBenefitConfirm(false);
              setBenefitToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBenefit}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Benefit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Performance Review Confirmation Dialog */}
      <AlertDialog open={showDeleteReviewConfirm} onOpenChange={setShowDeleteReviewConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Performance Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this performance review{' '}
              {reviewToDelete && employees.find(e => e.id === reviewToDelete.employee_id) && (
                <>
                  for{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {employees.find(e => e.id === reviewToDelete.employee_id)?.first_name} {employees.find(e => e.id === reviewToDelete.employee_id)?.last_name}
                  </span>
                </>
              )}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteReviewConfirm(false);
              setReviewToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReview}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HR Document Input Dialog */}
      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              {inputDialogAction?.icon && <inputDialogAction.icon className="w-5 h-5" style={{ color: inputDialogAction?.color }} />}
              Generate {inputDialogAction?.label}
            </DialogTitle>
            <DialogDescription>
              Provide details to generate your {inputDialogAction?.label}. The tool will create a comprehensive document tailored to your needs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4" style={{ marginTop: 'var(--spacing-4)' }}>
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={inputCompanyName}
                onChange={(e) => setInputCompanyName(e.target.value)}
                placeholder="Enter your company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                value={inputIndustry}
                onChange={(e) => setInputIndustry(e.target.value)}
                placeholder="e.g., Technology, Healthcare, Retail"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Document Tone</Label>
              <Select value={inputTone} onValueChange={setInputTone}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                value={inputDetails}
                onChange={(e) => setInputDetails(e.target.value)}
                placeholder="Add any specific requirements, policies, or information you'd like included..."
                rows={4}
              />
            </div>

            <div 
              className="flex items-start" 
              style={{ 
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-3)',
                background: 'var(--muted)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <Sparkles className="w-4 h-4 mt-0.5" style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                This will use 10 credits. The document will be generated in the background and you'll receive a notification when it's ready.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: 'var(--spacing-4)' }}>
            <Button
              variant="outline"
              onClick={() => setShowInputDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateDocument}
              disabled={!inputCompanyName || !inputIndustry}
              style={{
                background: inputDialogAction?.color || 'var(--primary)',
                color: 'white'
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HumanResourcesOperations;