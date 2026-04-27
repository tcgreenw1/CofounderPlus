import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { useBusiness } from '../BusinessContext';
import { BusinessDropdownHeader } from '../BusinessDropdownHeader';
import { supabase } from '../../utils/supabase/client';
import { projectId } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Switch } from '../ui/switch';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  Wallet, 
  CreditCard,
  BarChart3,
  Receipt,
  Target,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Filter,
  Search,
  Calendar,
  Download,
  FileSpreadsheet,
  ArrowUp,
  Link as LinkIcon,
  Sparkles,
  Edit2,
  Trash2,
  Upload,
  Camera,
  Loader2,
  Calculator,
  MessageSquare,
  Zap,
  Lightbulb,
  FileText,
  Users,
  ShieldCheck,
  BookOpen,
  Briefcase,
  Scale,
  PieChart,
  Info
} from 'lucide-react';
import { toast } from "sonner@2.0.3";
import { useNavigate } from 'react-router-dom';
import { getDreams, updateDream } from '../../utils/dreamBoardApi';

// Import existing components
import { FinanceOverview } from './components/FinanceOverview';
import { FinanceOverviewTab } from './components/FinanceOverviewTab';
import { ProjectionChart } from './components/ProjectionChart';
import { TransactionFormEnhanced } from './components/TransactionFormEnhanced';
import { ReceiptsManagement } from './components/ReceiptsManagement';
import { TransactionSummaryCards } from './components/TransactionSummaryCards';
import { FinancialProjections } from './components/FinancialProjections';
import { TransactionListEnhanced } from './components/TransactionListEnhanced';
import { QuickActionResultDialog } from './QuickActionResultDialog';
import { FinanceReportsSection } from './FinanceReportsSection';
import { TransactionEditModal } from './components/TransactionEditModal';
import { BudgetForm } from './components/BudgetForm';
import { BudgetEditForm } from './components/BudgetEditForm';
import { BurnRateCalculator } from './components/BurnRateCalculator';
import { RunwayProjections } from './components/RunwayProjections';
import { ScenarioPlanning } from './components/ScenarioPlanning';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { ParsedTransaction } from './utils/csvParser';
import { PlaidBankConnect } from '../PlaidBankConnect';
import { AutoBookkeepingEngine } from './AutoBookkeepingEngine';
import { FinanceChat } from './FinanceChat';
import { CPASavingsSummaryWidget } from './CPASavingsSummaryWidget';
import { AutomationReportsWidget } from '../AutomationReportsWidget';
import { useIsMobile } from '../ui/use-mobile';
import { isIOS } from '../../utils/platformDetection';


interface FinanceOperationsProps {
  user: any;
  userData?: any;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  date: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'scheduled';
  payment_method?: string;
  reference?: string;
  tags?: string[];
  notes?: string;
  is_future_transaction?: boolean;
  scheduled_date?: string;
  recurrence_type?: 'one-time' | 'bi-weekly' | 'monthly' | 'annual';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  // Product fields
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
  created_at: string;
}

interface BankBalance {
  balance: number;
  currency: string;
  last_updated: string;
  created_at: string;
}

interface FinanceData {
  transactions: Transaction[];
  invoices: any[];
  budgets: any[];
  bankBalance: BankBalance;
}

function FinanceOperationsNew({ user, userData }: FinanceOperationsProps) {
  // ============================================================================
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // ============================================================================
  
  // Business context - must be called before any conditional returns
  const businessContext = useBusiness();
  const selectedBusiness = businessContext?.selectedBusiness || null;
  const isMobile = useIsMobile();
  const isIOSMobile = isIOS();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // State management - must be called unconditionally
  // Initialize with empty data so page shows immediately
  const [financeData, setFinanceData] = useState<FinanceData>({
    transactions: [],
    invoices: [],
    budgets: [],
    bankBalance: {
      balance: 0,
      currency: 'USD',
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  });
  const [loading, setLoading] = useState(true); // Start with loading true
  const [loadError, setLoadError] = useState(false);
  
  // Progressive loading states
  const [headerLoaded, setHeaderLoaded] = useState(true); // Show header immediately
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  
  // Platform detection for conditional tab display
  const isIOSApp = Capacitor.getPlatform() === 'ios';
  
  // Always default to 'auto-bookkeeping' (Cofounder Finance) since it's now the only main tab
  const [activeTab, setActiveTab] = useState('auto-bookkeeping');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showBankConnect, setShowBankConnect] = useState(false);
  const [showBankBalance, setShowBankBalance] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cofounderCategorizing, setCofounderCategorizing] = useState(false);
  const [categorizationResult, setCategorizationResult] = useState<{ 
    processed: number; 
    remaining: number;
    alreadyCategorized: number;
  } | null>(null);
  const [uncategorizedCount, setUncategorizedCount] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [connectedBanks, setConnectedBanks] = useState<any[]>([]);
  const [refreshingBalance, setRefreshingBalance] = useState<string | null>(null);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState<{itemId: string} | null>(null);
  const [syncingTransactions, setSyncingTransactions] = useState<string | null>(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState<{itemId: string} | null>(null);
  const [showIRSCategories, setShowIRSCategories] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [showEditBudget, setShowEditBudget] = useState(false);
  
  // Receipt upload state
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  // Quick action results state
  const [showQuickActionResult, setShowQuickActionResult] = useState(false);
  const [quickActionResult, setQuickActionResult] = useState<{
    title: string;
    category: string;
    content: any;
  } | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  // Reports state
  const [reports, setReports] = useState<Array<{
    id: string;
    title: string;
    category: string;
    aiSummary: string;
    createdAt: string;
    data: any;
  }>>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Dream board integration state
  const navigate = useNavigate();
  const [showDreams, setShowDreams] = useState(true); // Default to true/showing
  const [financialDreams, setFinancialDreams] = useState<any[]>([]);
  const [loadingDreams, setLoadingDreams] = useState(false);
  const [recordSavingsDream, setRecordSavingsDream] = useState<any | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [loadingPreference, setLoadingPreference] = useState(true);
  
  // Dream savings bank balance subtraction preference
  const [showSubtractDialog, setShowSubtractDialog] = useState(false);
  const [pendingSavingsData, setPendingSavingsData] = useState<{
    dream: any;
    amount: number;
    newProgress: number;
  } | null>(null);
  const [subtractPreference, setSubtractPreference] = useState<{
    shouldSubtract: boolean;
    neverAskAgain: boolean;
  } | null>(null);

  // Process scheduled transactions that are now due
  const processScheduledTransactions = useCallback(async () => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        console.log('⏰ Processing scheduled transactions...');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/process-scheduled?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.processedCount > 0) {
            console.log(`⏰ Processed ${result.processedCount} scheduled transactions`);
            toast.success(`${result.processedCount} scheduled transaction${result.processedCount > 1 ? 's' : ''} processed!`);
          }
        }
      }
    } catch (error) {
      console.error('⏰ Error processing scheduled transactions:', error);
      // Don't show error toast - this is a background process
    }
  }, [selectedBusiness, user]);

  // Load connected banks
  const loadConnectedBanks = useCallback(async () => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/connected-accounts/${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setConnectedBanks(data.accounts || []);
        }
      }
    } catch (error) {
      console.error('Error loading connected banks:', error);
    }
  }, [selectedBusiness, user]);

  // Load user preference for showing dreams
  const loadShowDreamsPreference = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/user-preferences/finance-show-dreams`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          // If preference exists, use it; otherwise default to true
          if (data.showDreams !== undefined) {
            setShowDreams(data.showDreams);
          }
        }
      }
    } catch (error) {
      console.error('Error loading show dreams preference:', error);
    } finally {
      setLoadingPreference(false);
    }
  }, [user?.id]);

  // Save user preference for showing dreams
  const saveShowDreamsPreference = useCallback(async (show: boolean) => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/user-preferences/finance-show-dreams`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ showDreams: show })
          }
        );
      }
    } catch (error) {
      console.error('Error saving show dreams preference:', error);
    }
  }, [user?.id]);

  // Load user preference for dream savings bank balance subtraction
  const loadSubtractPreference = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/user-preferences/dream-savings-subtract`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.preference) {
            setSubtractPreference(data.preference);
          }
        }
      }
    } catch (error) {
      console.error('Error loading subtract preference:', error);
    }
  }, [user?.id]);

  // Save user preference for dream savings bank balance subtraction
  const saveSubtractPreference = useCallback(async (shouldSubtract: boolean, neverAskAgain: boolean) => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/user-preferences/dream-savings-subtract`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ shouldSubtract, neverAskAgain })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.preference) {
            setSubtractPreference(data.preference);
          }
        }
      }
    } catch (error) {
      console.error('Error saving subtract preference:', error);
    }
  }, [user?.id]);

  // Load financial dreams
  const loadFinancialDreams = useCallback(async () => {
    if (!user?.id || !showDreams) return;

    try {
      setLoadingDreams(true);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const allDreams = await getDreams(user.id, selectedBusiness?.id, accessToken);
      
      // Filter for financial dreams only
      const financial = allDreams.filter(dream => dream.category === 'financial' && !dream.isCompleted);
      setFinancialDreams(financial);
    } catch (error) {
      console.error('Error loading financial dreams:', error);
    } finally {
      setLoadingDreams(false);
    }
  }, [user?.id, selectedBusiness?.id, showDreams]);

  // Load user preference on mount
  useEffect(() => {
    loadShowDreamsPreference();
    loadSubtractPreference();
  }, [loadShowDreamsPreference, loadSubtractPreference]);

  // Load dreams when toggle is turned on
  useEffect(() => {
    if (showDreams && !loadingPreference) {
      loadFinancialDreams();
    }
  }, [showDreams, loadingPreference, loadFinancialDreams]);

  // Refresh bank balance
  const refreshBankBalance = useCallback(async (itemId: string, forceWithCredits: boolean = false) => {
    if (!selectedBusiness || !user) return;

    setRefreshingBalance(itemId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/get-balance`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              businessId: selectedBusiness.id,
              itemId,
              forceWithCredits
            })
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success('Balance refreshed successfully!');
          await loadConnectedBanks();
        } else if (data.rateLimited && !forceWithCredits) {
          // Automatically retry with credits
          await refreshBankBalance(itemId, true);
          return;
        } else if (data.requiresCredits) {
          toast.error(data.error || 'Insufficient credits');
        } else {
          toast.error(data.error || 'Failed to refresh balance');
        }
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setRefreshingBalance(null);
      setShowRefreshConfirm(null);
    }
  }, [selectedBusiness, user, loadConnectedBanks]);

  // Sync transactions from bank
  const syncBankTransactions = useCallback(async (itemId: string, forceWithCredits: boolean = false) => {
    if (!selectedBusiness || !user) return;

    setSyncingTransactions(itemId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        toast.loading('Syncing transactions from your bank...', { id: 'sync-transactions' });

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/plaid-bank/sync-transactions`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: selectedBusiness.id,
              itemId,
              forceWithCredits
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          // Check if it's a rate limit error that can be bypassed with credits
          if (data.rateLimited && data.requiresCredits && !forceWithCredits) {
            toast.dismiss('sync-transactions');
            // Automatically retry with credits
            await syncBankTransactions(itemId, true);
            return;
          } else if (data.requiresCredits) {
            toast.dismiss('sync-transactions');
            toast.error(data.error || 'Insufficient credits');
          } else {
            throw new Error(data.error || 'Failed to sync transactions');
          }
          return;
        }

        toast.dismiss('sync-transactions');
        toast.success(`Successfully imported ${data.transactionsImported || 0} transactions`, {
          description: 'View them in the Transactions tab'
        });

        // Reload banks to update last_synced timestamp
        await loadConnectedBanks();
        
        // Force a refetch of finance data by updating the state
        // This will trigger the finance/data endpoint to reload
        const { data: { session: newSession } } = await supabase.auth.getSession();
        const newAccessToken = newSession?.access_token;
        
        if (newAccessToken) {
          const financeResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/data?businessId=${selectedBusiness.id}`,
            {
              headers: {
                'Authorization': `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (financeResponse.ok) {
            const financeData = await financeResponse.json();
            setFinanceData(financeData);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast.dismiss('sync-transactions');
      toast.error('Failed to sync transactions');
    } finally {
      setSyncingTransactions(null);
      setShowSyncConfirm(null);
    }
  }, [selectedBusiness, user, loadConnectedBanks]);

  // Load finance data
  const loadFinanceData = useCallback(async () => {
    if (!selectedBusiness || !user) {
      setLoading(false);
      return;
    }

    // Reset progressive loading states (except header which shows immediately)
    setIntegrationsLoaded(false);
    setSummaryLoaded(false);
    setContentLoaded(false);
    setLoadError(false);
    
    setLoading(true);
    
    try {
      // Show integrations section immediately (no delay)
      setIntegrationsLoaded(true);
      
      // First, process any scheduled transactions that are now due
      await processScheduledTransactions();
      
      // Load connected banks
      await loadConnectedBanks();

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/data?businessId=${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFinanceData(data);
          
          // Show content sections progressively with small delays
          setTimeout(() => setSummaryLoaded(true), 100);
          setTimeout(() => setContentLoaded(true), 200);
        } else {
          const errorText = await response.text();
          console.error('💰 Failed to load finance data - Response not OK:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
            url: response.url
          });
          toast.error(`Failed to load finance data: ${response.status} - ${errorText}`);
          setLoadError(true);
          
          // Still show sections even with error so page doesn't block
          setTimeout(() => setSummaryLoaded(true), 100);
          setTimeout(() => setContentLoaded(true), 200);
        }
      } else {
        console.warn('💰 No access token available');
        toast.error('Authentication required. Please sign in again.');
        setLoadError(true);
        
        // Still show sections even with error so page doesn't block
        setTimeout(() => setSummaryLoaded(true), 100);
        setTimeout(() => setContentLoaded(true), 200);
      }
    } catch (error) {
      console.error('💰 Error loading finance data - Exception caught:', {
        error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        selectedBusiness: selectedBusiness?.id,
        userId: user?.id
      });
      toast.error(`Failed to load finance data: ${error?.message || 'Unknown error'}`);
      setLoadError(true);
      
      // Still show sections even with error so page doesn't block
      setTimeout(() => setSummaryLoaded(true), 100);
      setTimeout(() => setContentLoaded(true), 200);
    } finally {
      setLoading(false);
    }
  }, [selectedBusiness, user, processScheduledTransactions]);

  // Load data on mount and business change
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Handle transaction added
  const handleTransactionAdded = useCallback((transaction: Transaction) => {
    setFinanceData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        transactions: [transaction, ...prev.transactions]
      };
    });
    setShowAddTransaction(false);
    toast.success('Transaction added successfully!');
  }, []);

  // Update bank balance
  const updateBankBalance = useCallback(async (newBalance: number) => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/set-bank-balance?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ balance: newBalance })
          }
        );

        if (response.ok) {
          const updatedBalance = await response.json();
          setFinanceData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              bankBalance: updatedBalance.bankBalance
            };
          });
          toast.success('Bank balance updated successfully!');
        } else {
          toast.error('Failed to update bank balance');
        }
      }
    } catch (error) {
      console.error('Error updating bank balance:', error);
      toast.error('Failed to update bank balance');
    }
  }, [selectedBusiness, user]);

  // Handle transaction edit
  const handleTransactionEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  }, []);

  // Handle transaction save (edit)
  const handleTransactionSave = useCallback(async (updatedTransaction: Transaction) => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions/${updatedTransaction.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTransaction)
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          // Update local state
          setFinanceData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              transactions: prev.transactions.map(t => 
                t.id === updatedTransaction.id ? result.transaction : t
              ),
              // Update bank balance if provided in response
              bankBalance: result.bankBalance || prev.bankBalance
            };
          });
          
          toast.success('Transaction updated successfully!');
          setShowEditModal(false);
          setEditingTransaction(null);
        } else {
          const errorText = await response.text();
          toast.error(`Failed to update transaction: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  }, [selectedBusiness, user]);

  // Handle transaction delete
  const handleTransactionDelete = useCallback(async (transactionId: string) => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions/${transactionId}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          // Update local state
          setFinanceData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              transactions: prev.transactions.filter(t => t.id !== transactionId),
              // Update bank balance if provided in response
              bankBalance: result.bankBalance || prev.bankBalance
            };
          });
          
          toast.success('Transaction deleted successfully!');
        } else {
          const errorText = await response.text();
          toast.error(`Failed to delete transaction: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  }, [selectedBusiness, user]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async (transactionIds: string[]) => {
    if (!selectedBusiness || !user || transactionIds.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        // Delete transactions in parallel
        const deletePromises = transactionIds.map(id =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions/${id}?businessId=${selectedBusiness.id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          )
        );

        const responses = await Promise.all(deletePromises);
        const successCount = responses.filter(r => r.ok).length;
        
        if (successCount > 0) {
          // Update local state - remove deleted transactions
          setFinanceData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              transactions: prev.transactions.filter(t => !transactionIds.includes(t.id))
            };
          });
          
          // Reload to get updated bank balance
          await loadFinanceData();
        }

        if (successCount === transactionIds.length) {
          toast.success(`Successfully deleted ${successCount} transaction(s)`);
        } else if (successCount > 0) {
          toast.warning(`Deleted ${successCount} of ${transactionIds.length} transaction(s)`);
        } else {
          toast.error('Failed to delete transactions');
        }
      }
    } catch (error) {
      console.error('Error bulk deleting transactions:', error);
      toast.error('Failed to delete transactions');
    }
  }, [selectedBusiness, user, loadFinanceData]);

  // Handle bulk status update
  const handleBulkStatusUpdate = useCallback(async (transactionIds: string[], newStatus: string) => {
    if (!selectedBusiness || !user || transactionIds.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        // Update transactions in parallel
        const updatePromises = transactionIds.map(id =>
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions/${id}?businessId=${selectedBusiness.id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status: newStatus })
            }
          )
        );

        const responses = await Promise.all(updatePromises);
        const successCount = responses.filter(r => r.ok).length;
        
        if (successCount > 0) {
          // Update local state
          setFinanceData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              transactions: prev.transactions.map(t => 
                transactionIds.includes(t.id) ? { ...t, status: newStatus as any } : t
              )
            };
          });
          
          // Reload to get updated bank balance
          await loadFinanceData();
        }

        if (successCount === transactionIds.length) {
          toast.success(`Successfully updated ${successCount} transaction(s) to ${newStatus}`);
        } else if (successCount > 0) {
          toast.warning(`Updated ${successCount} of ${transactionIds.length} transaction(s)`);
        } else {
          toast.error('Failed to update transactions');
        }
      }
    } catch (error) {
      console.error('Error bulk updating transactions:', error);
      toast.error('Failed to update transactions');
    }
  }, [selectedBusiness, user, loadFinanceData]);

  // Handle receipt upload
  const handleReceiptUpload = useCallback(async () => {
    if (!receiptFile || !selectedBusiness || !user) return;

    setUploadingReceipt(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(receiptFile);
      
      await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      const base64Image = reader.result as string;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/process-receipt?businessId=${selectedBusiness.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            image: base64Image,
            fileName: receiptFile.name
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Reload finance data to show new transactions
        await loadFinanceData();
        
        toast.success(
          `✅ Receipt processed! Added ${result.transactionsCreated} transaction(s). Cost: ${result.creditsCost} credits`,
          { duration: 5000 }
        );
        
        // Close dialog and reset
        setShowReceiptUpload(false);
        setReceiptFile(null);
        setReceiptPreview(null);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to process receipt: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      toast.error('Failed to process receipt');
    } finally {
      setUploadingReceipt(false);
    }
  }, [receiptFile, selectedBusiness, user, loadFinanceData]);

  // Handle file selection for receipt
  const handleReceiptFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setReceiptFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Handle bulk import
  const handleBulkImport = useCallback(async (transactions: ParsedTransaction[]) => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/bulk-import?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transactions })
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          // Reload finance data to get updated transactions and balance
          await loadFinanceData();
          
          toast.success(`Successfully imported ${result.imported} of ${result.total} transactions`);
          
          if (result.errors && result.errors.length > 0) {
            console.warn('Import errors:', result.errors);
            toast.warning(`${result.errors.length} transaction(s) had errors - check console for details`);
          }
        } else {
          const errorText = await response.text();
          toast.error(`Failed to import transactions: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error('Failed to import transactions');
    }
  }, [selectedBusiness, user]);

  // Load products for edit modal
  const loadProducts = useCallback(async () => {
    if (!selectedBusiness || !user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/products/data?businessId=${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      console.log('Failed to load products for edit modal:', error);
    }
  }, [selectedBusiness, user]);

  // Handle quick actions
  const handleQuickAction = useCallback((actionId: string, actionLabel: string, actionCategory: string) => {
    if (!financeData) {
      toast.error('Please wait for financial data to load');
      return;
    }

    const transactions = financeData.transactions || [];
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
    
    let content: any = {};

    switch (actionId) {
      case 'quarterly-tax-estimate': {
        const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
        const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);
        const quarterTransactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= quarterStart && tDate <= quarterEnd;
        });
        const income = quarterTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = quarterTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netIncome = income - expenses;
        const estimatedTax = netIncome > 0 ? netIncome * 0.25 : 0;
        content = {
          quarter: `Q${currentQuarter} ${currentYear}`,
          income: income.toFixed(2),
          expenses: expenses.toFixed(2),
          netIncome: netIncome.toFixed(2),
          estimatedTax: estimatedTax.toFixed(2),
          note: 'This is a simplified estimate. Consult with a tax professional for accurate calculations.'
        };
        break;
      }
      case 'tax-deductions': {
        const deductibleCategories = ['Office Supplies', 'Software & Subscriptions', 'Travel', 'Meals & Entertainment', 'Marketing & Advertising', 'Professional Services', 'Insurance', 'Utilities', 'Rent'];
        const deductions = deductibleCategories.map(category => {
          const categoryTransactions = transactions.filter(t => t.category === category && t.type === 'expense');
          const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
          return { category, amount: total, count: categoryTransactions.length };
        }).filter(d => d.amount > 0);
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
        content = { deductions, totalDeductions: totalDeductions.toFixed(2), note: 'Review these potential deductions with your tax advisor.' };
        break;
      }
      case 'profitability-analysis': {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netProfit = totalIncome - totalExpenses;
        const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
        const expensesByCategory = transactions.filter(t => t.type === 'expense' && t.category).reduce((acc: any, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {});
        const topExpenses = Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount: amount as number })).sort((a, b) => b.amount - a.amount).slice(0, 5);
        content = {
          totalIncome: totalIncome.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          netProfit: netProfit.toFixed(2),
          profitMargin: profitMargin.toFixed(2),
          topExpenses,
          status: netProfit > 0 ? 'Profitable' : 'Operating at a loss'
        };
        break;
      }
      case 'cash-flow-review': {
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        const recentTransactions = transactions.filter(t => new Date(t.date) >= last30Days);
        const cashIn = recentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const cashOut = recentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netCashFlow = cashIn - cashOut;
        const currentBalance = financeData.currentBalance || 0;
        content = {
          period: 'Last 30 Days',
          cashIn: cashIn.toFixed(2),
          cashOut: cashOut.toFixed(2),
          netCashFlow: netCashFlow.toFixed(2),
          currentBalance: currentBalance.toFixed(2),
          trend: netCashFlow > 0 ? 'Positive' : 'Negative',
          health: netCashFlow > 0 ? 'Good' : 'Needs Attention'
        };
        break;
      }
      case 'expense-optimization': {
        const expensesByCategory = transactions.filter(t => t.type === 'expense' && t.category).reduce((acc: any, t) => {
          if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 };
          acc[t.category].total += t.amount;
          acc[t.category].count += 1;
          return acc;
        }, {});
        const opportunities = Object.entries(expensesByCategory).map(([category, data]: [string, any]) => ({
          category, total: data.total, count: data.count, avgTransaction: data.total / data.count, potentialSavings: data.total * 0.1
        })).sort((a, b) => b.total - a.total).slice(0, 5);
        const totalPotentialSavings = opportunities.reduce((sum, o) => sum + o.potentialSavings, 0);
        content = { opportunities, totalPotentialSavings: totalPotentialSavings.toFixed(2), note: 'Consider negotiating with vendors, switching providers, or reducing usage in these categories.' };
        break;
      }
      case 'reconciliation-check': {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const calculatedBalance = totalIncome - totalExpenses;
        const recordedBalance = financeData.currentBalance || 0;
        const difference = Math.abs(calculatedBalance - recordedBalance);
        const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized').length;
        content = {
          calculatedBalance: calculatedBalance.toFixed(2),
          recordedBalance: recordedBalance.toFixed(2),
          difference: difference.toFixed(2),
          status: difference < 1 ? 'Balanced' : 'Discrepancy Found',
          uncategorized,
          totalTransactions: transactions.length,
          note: difference > 1 ? 'Review transactions for missing or duplicate entries.' : 'Accounts are balanced.'
        };
        break;
      }
      case 'financial-statements': {
        const thisYear = new Date().getFullYear();
        const thisYearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === thisYear);
        const revenue = thisYearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = thisYearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netIncome = revenue - expenses;
        const assets = financeData.currentBalance || 0;
        const liabilities = 0;
        const equity = assets - liabilities;
        content = {
          period: `Year ${thisYear}`,
          profitLoss: { revenue: revenue.toFixed(2), expenses: expenses.toFixed(2), netIncome: netIncome.toFixed(2) },
          balanceSheet: { assets: assets.toFixed(2), liabilities: liabilities.toFixed(2), equity: equity.toFixed(2) },
          note: 'Simplified statements. For detailed reports, export your data or consult with your accountant.'
        };
        break;
      }
      case 'business-health': {
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
        const currentBalance = financeData.currentBalance || 0;
        let healthScore = 0;
        if (profitMargin > 20) healthScore += 40; else if (profitMargin > 10) healthScore += 25; else if (profitMargin > 0) healthScore += 10;
        if (currentBalance > totalExpenses * 0.5) healthScore += 30; else if (currentBalance > totalExpenses * 0.25) healthScore += 15;
        if (transactions.length > 10) healthScore += 15;
        if (transactions.filter(t => !t.category || t.category === 'Uncategorized').length < transactions.length * 0.1) healthScore += 15;
        const rating = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Improvement';
        content = {
          healthScore, rating, profitMargin: profitMargin.toFixed(2), currentBalance: currentBalance.toFixed(2), transactionCount: transactions.length,
          recommendations: [
            healthScore < 80 ? 'Consider increasing profit margins' : 'Maintain strong financial practices',
            currentBalance < totalExpenses * 0.25 ? 'Build up cash reserves' : 'Good cash position',
            transactions.filter(t => !t.category).length > 0 ? 'Categorize all transactions' : 'Good transaction organization'
          ]
        };
        break;
      }
      case 'compliance-check': {
        const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized').length;
        const missingReceipts = transactions.filter(t => t.type === 'expense' && t.amount > 75 && !t.receiptUrl).length;
        const issues = [];
        if (uncategorized > 0) issues.push(`${uncategorized} uncategorized transactions`);
        if (missingReceipts > 0) issues.push(`${missingReceipts} expenses over $75 missing receipts`);
        const complianceScore = Math.max(0, 100 - (uncategorized * 2) - (missingReceipts * 5));
        content = {
          complianceScore,
          status: complianceScore >= 90 ? 'Compliant' : complianceScore >= 70 ? 'Mostly Compliant' : 'Action Needed',
          issues,
          recommendations: [
            uncategorized > 0 ? 'Categorize all transactions for accurate tax reporting' : 'All transactions categorized',
            missingReceipts > 0 ? 'Upload receipts for expenses over $75' : 'Receipt documentation complete',
            'Review records quarterly for ongoing compliance'
          ]
        };
        break;
      }
      default:
        toast.info('This action is not yet implemented');
        return;
    }

    setQuickActionResult({ title: actionLabel, category: actionCategory, content });
    setShowQuickActionResult(true);
    
    // Generate AI report asynchronously
    generateAIReport(actionLabel, actionCategory, content);
  }, [financeData]);

  // Generate AI report using Claude
  const generateAIReport = async (title: string, category: string, data: any) => {
    if (!selectedBusiness || !user) return;
    
    setGeneratingReport(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        toast.error('Please sign in to generate reports');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/generate-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
            title,
            category,
            data
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Report generation error from backend:', errorData);
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const result = await response.json();
      
      // Add new report to the list
      const newReport = {
        id: result.id,
        title,
        category,
        aiSummary: result.aiSummary,
        createdAt: new Date().toISOString(),
        data
      };
      
      setReports(prev => [newReport, ...prev]);
      toast.success('Report generated successfully!');
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Load reports
  const loadReports = useCallback(async () => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/reports?businessId=${selectedBusiness.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }, [selectedBusiness, user]);

  // Delete report
  const deleteReport = async (reportId: string) => {
    if (!selectedBusiness || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/reports/${reportId}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            }
          }
        );

        if (response.ok) {
          setReports(prev => prev.filter(r => r.id !== reportId));
          toast.success('Report deleted');
        } else {
          toast.error('Failed to delete report');
        }
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  // Load products and reports when component mounts
  useEffect(() => {
    loadProducts();
    loadReports();
  }, [loadProducts, loadReports]);

  // Export transactions to Excel
  const exportToExcel = useCallback(async () => {
    try {
      if (!financeData?.transactions || financeData.transactions.length === 0) {
        toast.error('No transactions to export');
        return;
      }

      // Dynamically import XLSX only when needed
      const XLSX = await import('xlsx');

      // Prepare data for Excel
      const exportData = financeData.transactions.map(t => ({
        'Date': t.date,
        'Type': t.type === 'income' ? 'Income' : 'Expense',
        'Amount': Number(t.amount) || 0,
        'Description': t.description || '',
        'Category': t.category || '',
        'Subcategory': t.subcategory || '',
        'Status': t.status || 'completed',
        'Payment Method': t.payment_method || '',
        'Reference': t.reference || '',
        'Product Name': t.product_name || '',
        'Quantity': t.quantity || '',
        'Tags': t.tags ? t.tags.join(', ') : '',
        'Notes': t.notes || '',
        'Recurrence': t.recurrence_type || 'one-time',
        'Scheduled Date': t.scheduled_date || '',
        'Due Date': t.due_date || '',
        'Created': t.created_at || ''
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add transactions sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 10 }, // Type
        { wch: 12 }, // Amount
        { wch: 30 }, // Description
        { wch: 15 }, // Category
        { wch: 15 }, // Subcategory
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Method
        { wch: 15 }, // Reference
        { wch: 20 }, // Product Name
        { wch: 10 }, // Quantity
        { wch: 20 }, // Tags
        { wch: 30 }, // Notes
        { wch: 12 }, // Recurrence
        { wch: 12 }, // Scheduled Date
        { wch: 12 }, // Due Date
        { wch: 20 }  // Created
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

      // Calculate summary metrics
      const completedTransactions = financeData.transactions.filter(t => (t.status || 'completed') === 'completed');
      const totalIncome = completedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalExpenses = completedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      // Add summary sheet
      const summarySheetData = [
        { 'Metric': 'Total Income', 'Value': totalIncome },
        { 'Metric': 'Total Expenses', 'Value': totalExpenses },
        { 'Metric': 'Net Income', 'Value': totalIncome - totalExpenses },
        { 'Metric': 'Current Bank Balance', 'Value': financeData.bankBalance?.balance || 0 },
        { 'Metric': 'Total Transactions', 'Value': financeData.transactions.length },
        { 'Metric': 'Active Budgets', 'Value': financeData.budgets?.length || 0 },
        { 'Metric': 'Pending Invoices', 'Value': financeData.invoices?.filter(i => i.status === 'pending').length || 0 }
      ];
      
      const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Add budgets sheet if available
      if (financeData.budgets && financeData.budgets.length > 0) {
        const budgetData = financeData.budgets.map(b => ({
          'Budget Name': b.name || '',
          'Category': b.category || '',
          'Amount': b.budget_amount || 0,
          'Spent': b.spent_amount || 0,
          'Remaining': (b.budget_amount || 0) - (b.spent_amount || 0),
          'Period': b.period || '',
          'Status': b.status || '',
          'Start Date': b.start_date || '',
          'End Date': b.end_date || ''
        }));
        
        const wsBudgets = XLSX.utils.json_to_sheet(budgetData);
        wsBudgets['!cols'] = [
          { wch: 25 }, // Budget Name
          { wch: 15 }, // Category
          { wch: 12 }, // Amount
          { wch: 12 }, // Spent
          { wch: 12 }, // Remaining
          { wch: 12 }, // Period
          { wch: 12 }, // Status
          { wch: 12 }, // Start Date
          { wch: 12 }  // End Date
        ];
        XLSX.utils.book_append_sheet(wb, wsBudgets, 'Budgets');
      }

      // Generate filename with business name and date
      const fileName = `${selectedBusiness?.name || 'Finance'}_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, fileName);
      
      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export to Excel');
    }
  }, [financeData, selectedBusiness]);

  // Calculate uncategorized transactions count
  React.useEffect(() => {
    if (financeData?.transactions) {
      // Count all transactions that have no category at all
      const uncategorized = financeData.transactions.filter(t => 
        !t.category || 
        t.category === '' || 
        t.category === 'Uncategorized' ||
        t.category.toLowerCase() === 'uncategorized'
      );
      setUncategorizedCount(uncategorized.length);
    }
  }, [financeData?.transactions]);

  // Handle budget update
  const handleBudgetUpdate = useCallback(async (updatedBudget: any) => {
    if (!selectedBusiness || !user) return;

    // Update local state
    setFinanceData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        budgets: prev.budgets.map(b => 
          b.id === updatedBudget.id ? updatedBudget : b
        )
      };
    });
    
    setShowEditBudget(false);
    setEditingBudget(null);
  }, [selectedBusiness, user]);

  // Handle budget delete
  const handleBudgetDelete = useCallback(async () => {
    if (!selectedBusiness || !user || !deletingBudget) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/budgets/${deletingBudget.id}?businessId=${selectedBusiness.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          // Update local state
          setFinanceData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              budgets: prev.budgets.filter(b => b.id !== deletingBudget.id)
            };
          });
          
          toast.success('Budget deleted successfully!');
          setShowDeleteConfirm(false);
          setDeletingBudget(null);
        } else {
          const errorText = await response.text();
          toast.error(`Failed to delete budget: ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  }, [selectedBusiness, user, deletingBudget]);

  // Handle recording savings for dreams
  const handleRecordSavings = useCallback(async () => {
    if (!recordSavingsDream || !savingsAmount) return;

    const additionalSavings = parseFloat(savingsAmount);
    if (isNaN(additionalSavings) || additionalSavings <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const targetAmount = recordSavingsDream.targetAmount || 0;
    if (targetAmount === 0) {
      toast.error('This dream needs a target amount first');
      return;
    }

    // Calculate current saved amount from progress
    const currentSaved = (recordSavingsDream.progress / 100) * targetAmount;
    const newSaved = currentSaved + additionalSavings;
    const newProgress = Math.min(100, (newSaved / targetAmount) * 100);

    // Check if user has a preference set
    if (subtractPreference?.neverAskAgain) {
      // User has a saved preference, apply it automatically
      await completeSavingsRecord(recordSavingsDream, newProgress, additionalSavings, subtractPreference.shouldSubtract);
    } else {
      // No preference or user wants to be asked each time - show dialog
      setPendingSavingsData({
        dream: recordSavingsDream,
        amount: additionalSavings,
        newProgress
      });
      setShowSubtractDialog(true);
      setRecordSavingsDream(null);
      setSavingsAmount('');
    }
  }, [recordSavingsDream, savingsAmount, subtractPreference]);

  // Complete the savings record (called after preference is determined)
  const completeSavingsRecord = useCallback(async (
    dream: any,
    newProgress: number,
    additionalSavings: number,
    shouldSubtract: boolean
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Update dream progress
      await updateDream(
        dream.id,
        { 
          progress: newProgress,
          isCompleted: newProgress >= 100
        },
        accessToken
      );

      // Update local state
      setFinancialDreams(prev => 
        prev.map(d => 
          d.id === dream.id 
            ? { ...d, progress: newProgress, isCompleted: newProgress >= 100 }
            : d
        )
      );

      // If user wants to subtract from bank balance
      if (shouldSubtract && financeData?.bankBalance?.balance !== undefined) {
        const currentBalance = financeData.bankBalance.balance;
        const newBalance = currentBalance - additionalSavings;
        
        // Update bank balance
        await updateBankBalance(newBalance);
        
        toast.success(
          `Recorded $${additionalSavings.toLocaleString()} towards "${dream.title}" and updated bank balance!`
        );
      } else {
        toast.success(`Recorded $${additionalSavings.toLocaleString()} towards "${dream.title}"!`);
      }
    } catch (error) {
      console.error('Error recording savings:', error);
      toast.error('Failed to record savings');
    }
  }, [financeData?.bankBalance?.balance, updateBankBalance]);

  // Cofounder Finance Categorization handler
  const handleCofounderCategorization = useCallback(async () => {
    if (!selectedBusiness || !user) return;

    setCofounderCategorizing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        // Calculate actual uncategorized count
        const actualUncategorized = financeData?.transactions?.filter(t => 
          (!t.category || 
          t.category === '' || 
          t.category === 'Uncategorized' ||
          t.category.toLowerCase() === 'uncategorized') &&
          !t.cofounder_finance_categorized
        ) || [];
        
        const toProcess = Math.min(actualUncategorized.length, 300);
        
        if (toProcess === 0) {
          // All transactions already categorized - ask about recategorization
          setCategorizationResult({
            processed: 0,
            remaining: 0,
            alreadyCategorized: financeData?.transactions?.length || 0
          });
          setCofounderCategorizing(false);
          return;
        }
        
        toast.info(`💼 Cofounder Finance is categorizing ${toProcess} transaction${toProcess !== 1 ? 's' : ''}...`);
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/categorize-with-cofounder?businessId=${selectedBusiness.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          let errorMessage = 'Failed to categorize transactions';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          toast.error(errorMessage);
          return;
        }

        const result = await response.json();

        if (result.success) {
          setCategorizationResult({
            processed: result.processed,
            remaining: result.remaining || 0,
            alreadyCategorized: result.alreadyCategorized || 0
          });
          
          if (result.processed > 0) {
            const remainingMsg = result.remaining > 0 
              ? ` (${result.remaining} remaining - run again to continue)`
              : '';
            toast.success(`✨ Successfully categorized ${result.processed} transaction${result.processed !== 1 ? 's' : ''}!${remainingMsg}`);
          } else if (result.message) {
            toast.info(result.message);
          }
          
          // Refresh finance data
          await loadFinanceData();
        } else {
          toast.error(result.error || result.message || 'Failed to categorize transactions');
        }
      }
    } catch (error: any) {
      console.error('Error categorizing with Cofounder Finance:', error);
      const errorMsg = error?.message || 'Failed to categorize transactions';
      toast.error(errorMsg);
    } finally {
      setCofounderCategorizing(false);
    }
  }, [selectedBusiness, user, financeData?.transactions, loadFinanceData]);

  // Handle bank balance subtraction dialog responses
  const handleSubtractYes = useCallback(async () => {
    if (!pendingSavingsData) return;

    // Complete the savings record with subtraction
    await completeSavingsRecord(
      pendingSavingsData.dream,
      pendingSavingsData.newProgress,
      pendingSavingsData.amount,
      true
    );

    // Reset state
    setShowSubtractDialog(false);
    setPendingSavingsData(null);
  }, [pendingSavingsData, completeSavingsRecord]);

  const handleSubtractNo = useCallback(async () => {
    if (!pendingSavingsData) return;

    // Complete the savings record without subtraction
    await completeSavingsRecord(
      pendingSavingsData.dream,
      pendingSavingsData.newProgress,
      pendingSavingsData.amount,
      false
    );

    // Reset state
    setShowSubtractDialog(false);
    setPendingSavingsData(null);
  }, [pendingSavingsData, completeSavingsRecord]);

  // Calculate summary data
  const summaryData = React.useMemo(() => {
    if (!financeData) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        pendingInvoices: 0,
        activeBudgets: 0
      };
    }

    const { transactions, invoices, budgets } = financeData;
    
    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    // Include all expense transactions (pending, completed, scheduled, etc.) for comprehensive monthly tracking
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingInvoices = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      pendingInvoices,
      activeBudgets: budgets.length
    };
  }, [financeData]);

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    if (!financeData?.transactions) {
      return [];
    }

    const filtered = financeData.transactions.filter(transaction => {
      const description = transaction.description || '';
      const category = transaction.category || '';
      const status = transaction.status || 'completed';
      
      const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || category === filterCategory;
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return filtered;
  }, [financeData?.transactions, searchTerm, filterCategory, filterStatus]);

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    if (!financeData?.transactions) return [];
    const uniqueCategories = [...new Set(financeData.transactions.map(t => t.category))];
    return uniqueCategories;
  }, [financeData?.transactions]);

  // ============================================================================
  // CONDITIONAL RETURNS - Only after ALL hooks have been called
  // ============================================================================

  // Early safety checks
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!selectedBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading business data...</p>
        </div>
      </div>
    );
  }

  // Remove blocking states - show page immediately with progressive loading
  // Errors will be shown as toasts, page will still be functional

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3)', // Reduced from spacing-4 for mobile
        paddingTop: 'var(--spacing-3)', // Reduced from spacing-4 for mobile
        paddingBottom: isMobile && isIOSMobile ? 'max(env(safe-area-inset-bottom, 0px) + 96px, 96px)' : 'max(env(safe-area-inset-bottom, 0px) + 80px, 80px)',
      }}
      className="sm:gap-[var(--spacing-4)] sm:pt-[var(--spacing-4)]"
    >
      {/* Header - Shows immediately */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <BusinessDropdownHeader
            title="Finance Operations"
            description={`Manage finances for ${selectedBusiness.name}`}
            icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
            accentColor="blue"
          />
        </div>
        
        {/* Dreams Button with Toggle below for mobile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', alignItems: 'flex-end' }}>
          <Button
            onClick={() => navigate('/dream-board')}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            style={{
              borderRadius: 'var(--radius-lg)',
              borderColor: 'var(--primary)',
              color: 'var(--primary)',
              gap: isMobile ? 'var(--spacing-1)' : 'var(--spacing-2)',
              padding: isMobile ? 'var(--spacing-2) var(--spacing-3)' : undefined,
              fontSize: isMobile ? '0.875rem' : undefined,
            }}
            className="hover:bg-[var(--primary)]/10"
          >
            <Target className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
            <span className={isMobile ? "hidden sm:inline" : ""}>Manage Dreams</span>
            <span className={isMobile ? "sm:hidden" : "hidden"}>Dreams</span>
          </Button>

          {/* Show Dreams Toggle - Only visible on mobile */}
          {isMobile && (
            <div 
              className="flex items-center"
              style={{
                gap: 'var(--spacing-1)',
                padding: 'var(--spacing-1) var(--spacing-2)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-muted)',
              }}
            >
              <label 
                htmlFor="show-dreams-toggle-mobile" 
                className="text-[10px] cursor-pointer whitespace-nowrap"
                style={{ color: 'var(--color-foreground)' }}
              >
                {showDreams ? 'Hide Dreams' : 'Show Dreams'}
              </label>
              <Switch
                id="show-dreams-toggle-mobile"
                checked={showDreams}
                onCheckedChange={(checked) => {
                  setShowDreams(checked);
                  saveShowDreamsPreference(checked);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator - subtle banner at top when loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            backgroundColor: 'var(--color-primary-soft)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-2) var(--spacing-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)'
          }}
        >
          <div 
            className="animate-spin rounded-full border-2 border-transparent"
            style={{ 
              width: '16px', 
              height: '16px',
              borderTopColor: 'var(--color-primary)',
              borderRightColor: 'var(--color-primary)'
            }}
          />
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-foreground)',
            fontFamily: 'var(--font-body)'
          }}>
            Loading your financial data...
          </span>
        </motion.div>
      )}

      {/* Skeleton while integrations load */}
      {!integrationsLoaded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            <div 
              className="animate-pulse"
              style={{ 
                height: '26px', 
                width: '160px', 
                backgroundColor: 'var(--color-muted)', 
                borderRadius: 'var(--radius-lg)' 
              }}
            />
            <div 
              className="animate-pulse"
              style={{ 
                height: '26px', 
                width: '140px', 
                backgroundColor: 'var(--color-muted)', 
                borderRadius: 'var(--radius-lg)' 
              }}
            />
          </div>
          <div 
            className="animate-pulse"
            style={{ 
              height: '100px', 
              backgroundColor: 'var(--color-muted)', 
              borderRadius: 'var(--radius-lg)' 
            }}
          />
        </div>
      )}

      {/* Integration Buttons and Bank Accounts - Progressive loading */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: integrationsLoaded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}
      >
        <div 
          className="flex flex-wrap items-center"
          style={{ gap: 'var(--spacing-1) var(--spacing-2)' }}
        >
          <Dialog open={showBankConnect} onOpenChange={setShowBankConnect}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-[#00E0FF] text-[#00E0FF] hover:bg-[#00E0FF]/10 text-[10px] sm:text-xs"
                style={{
                  gap: 'var(--spacing-1)',
                  padding: 'var(--spacing-1) var(--spacing-2)',
                  borderRadius: 'var(--radius-lg)',
                  height: '26px',
                }}
              >
                <LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Connect Bank Account</span>
                <span className="sm:hidden">Bank</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bank Account Integration</DialogTitle>
                <DialogDescription>
                  Securely connect your bank account to automatically import transactions
                </DialogDescription>
              </DialogHeader>
              
              {/* Cost Optimization Info Banner */}
              <div 
                style={{
                  backgroundColor: 'var(--primary-soft)',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-3)',
                  marginBottom: 'var(--spacing-3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                  <Info className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                  <div>
                    <h4 
                      style={{ 
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: 'var(--spacing-1)',
                        color: 'var(--foreground)'
                      }}
                    >
                      Automatic Updates (No Extra Cost!)
                    </h4>
                    <p 
                      style={{ 
                        fontSize: '0.875rem',
                        color: 'var(--muted-foreground)',
                        lineHeight: '1.5',
                        marginBottom: 'var(--spacing-2)'
                      }}
                    >
                      Your bank data updates automatically every 24 hours for FREE:
                    </p>
                    <ul style={{ 
                      fontSize: '0.8125rem',
                      color: 'var(--muted-foreground)',
                      paddingLeft: 'var(--spacing-4)',
                      lineHeight: '1.6'
                    }}>
                      <li>✓ <strong>New transactions</strong> sync automatically via webhooks</li>
                      <li>✓ <strong>Balance updates</strong> included with transaction syncs</li>
                      <li>✓ <strong>No polling required</strong> - we use Plaid webhooks (FREE)</li>
                      <li>✓ Manual refresh available once per day if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <PlaidBankConnect 
                user={user}
                businessId={selectedBusiness.id}
                onTransactionsImported={() => {
                  loadFinanceData();
                  setShowBankConnect(false);
                }}
              />
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('QuickBooks integration coming soon!', { 
              description: 'This feature is currently in testing and will be available soon.',
              duration: 3000
            })}
            className="border-[#6CFF6C] text-[#6CFF6C] hover:bg-[#6CFF6C]/10 text-[10px] sm:text-xs"
            style={{
              gap: 'var(--spacing-1)',
              padding: 'var(--spacing-1) var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
              height: '26px',
            }}
          >
            <LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden sm:inline">QuickBooks Connect</span>
            <span className="sm:hidden">QuickBooks</span>
          </Button>
        </div>

        {/* Show Dreams Toggle - Desktop only (mobile has it in header) */}
        {!isMobile && (
          <div 
            className="flex items-center"
            style={{
              gap: 'var(--spacing-1)',
              padding: 'var(--spacing-1) var(--spacing-2)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-muted)',
              alignSelf: 'flex-start',
            }}
          >
            <label 
              htmlFor="show-dreams-toggle" 
              className="text-xs cursor-pointer whitespace-nowrap"
              style={{ color: 'var(--color-foreground)' }}
            >
              {showDreams ? 'Hide Dreams' : 'Show Dreams'}
            </label>
            <Switch
              id="show-dreams-toggle"
              checked={showDreams}
              onCheckedChange={(checked) => {
                setShowDreams(checked);
                saveShowDreamsPreference(checked);
              }}
            />
          </div>
        )}

        {/* Bank Accounts - Horizontal Scroll, improved spacing */}
        <div 
          className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          style={{
            gap: 'var(--spacing-2)',
            paddingBottom: 'var(--spacing-2)',
          }}
        >
          {/* Connected Bank Accounts */}
          {connectedBanks.map((bank) => (
            <Card 
              key={bank.id} 
              className="flex-shrink-0 w-36 sm:w-48 md:w-64 border-2 border-primary/20"
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              <CardContent className="p-1.5 sm:p-2 md:p-4">
                <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div 
                      className="rounded-full bg-primary/10 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8"
                      style={{ borderRadius: 'var(--radius-full)' }}
                    >
                      <Wallet className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-4 md:h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-[9px] sm:text-[10px] md:text-sm">{bank.institution_name}</p>
                      <p className="text-[8px] sm:text-[9px] md:text-xs text-muted-foreground">••••{bank.account_mask}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-6 md:w-6 p-0"
                  >
                    {balanceVisible ? <EyeOff className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" /> : <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />}
                  </Button>
                </div>
                
                <div className="mb-1 sm:mb-1.5">
                  <p className="text-[8px] sm:text-[9px] md:text-xs text-muted-foreground mb-0.5">Available Balance</p>
                  <p className="text-sm sm:text-base md:text-2xl font-semibold text-primary">
                    {balanceVisible ? (
                      `$${(bank.current_balance || 0).toLocaleString()}`
                    ) : (
                      '••••••'
                    )}
                  </p>
                  {bank.balance_last_updated && (
                    <p className="text-[7px] sm:text-[9px] md:text-xs text-muted-foreground mt-0.5">
                      Updated {new Date(bank.balance_last_updated).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div 
                  className="flex flex-col"
                  style={{ gap: 'var(--spacing-1)' }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[8px] sm:text-[9px] md:text-xs h-5 sm:h-6 md:h-8"
                    disabled={refreshingBalance === bank.item_id || syncingTransactions === bank.item_id}
                    onClick={() => setShowRefreshConfirm({itemId: bank.item_id})}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {refreshingBalance === bank.item_id ? (
                      <>
                        <RefreshCw className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5 animate-spin" />
                        <span className="hidden sm:inline">Refreshing...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5" />
                        <span className="hidden sm:inline">Refresh Balance</span>
                        <span className="sm:hidden">Refresh</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    className="w-full text-[8px] sm:text-[9px] md:text-xs h-5 sm:h-6 md:h-8"
                    disabled={syncingTransactions === bank.item_id || refreshingBalance === bank.item_id}
                    onClick={() => setShowSyncConfirm({itemId: bank.item_id})}
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-primary-foreground)',
                      borderRadius: 'var(--radius-md)',
                      border: 'none'
                    }}
                  >
                    {syncingTransactions === bank.item_id ? (
                      <>
                        <Loader2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5 animate-spin" />
                        <span className="hidden sm:inline">Loading...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5" />
                        <span className="hidden sm:inline">Load Transactions</span>
                        <span className="sm:hidden">Load</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Manual Balance Card - Fixed padding and alignment */}
          <Card 
            className="flex-shrink-0 w-36 sm:w-48 md:w-64 border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            style={{
              borderColor: 'rgba(108, 255, 108, 0.4)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <CardContent style={{ padding: 'var(--spacing-1-5)' }} className="sm:p-2 md:p-3">
              <div 
                className="flex items-center justify-between"
                style={{ marginBottom: 'var(--spacing-1)' }}
              >
                <div 
                  className="flex items-center"
                  style={{ gap: 'var(--spacing-1)', minWidth: 0, flex: 1 }}
                >
                  <div 
                    className="rounded-full bg-[#6CFF6C]/20 flex items-center justify-center"
                    style={{
                      width: '16px',
                      height: '16px',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    <Wallet className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-4 md:h-4 text-[#6CFF6C]" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="font-semibold text-[9px] sm:text-[10px] md:text-sm text-green-700 dark:text-green-300">Manual Balance</p>
                    <p className="text-[8px] sm:text-[9px] md:text-xs text-green-600 dark:text-green-400">Business Account</p>
                  </div>
                </div>
                <div 
                  className="flex items-center"
                  style={{ gap: 'var(--spacing-1)', flexShrink: 0 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadFinanceData}
                    style={{
                      height: '14px',
                      width: '14px',
                      padding: 0,
                    }}
                    className="sm:h-4 sm:w-4 md:h-6 md:w-6"
                    title="Refresh balance"
                  >
                    <RefreshCw className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    style={{
                      height: '14px',
                      width: '14px',
                      padding: 0,
                    }}
                    className="sm:h-4 sm:w-4 md:h-6 md:w-6"
                  >
                    {balanceVisible ? <EyeOff className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" /> : <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />}
                  </Button>
                </div>
              </div>
              
              <div className="mb-1 sm:mb-1.5">
                <p className="text-[8px] sm:text-[9px] md:text-xs text-green-600 dark:text-green-400 mb-0.5">Current Balance</p>
                <p className="text-sm sm:text-base md:text-2xl font-semibold text-green-600 dark:text-green-400">
                  {balanceVisible ? (
                    `$${financeData?.bankBalance?.balance?.toLocaleString() || '0'}`
                  ) : (
                    '••••••'
                  )}
                </p>
                {financeData?.bankBalance?.last_updated && (
                  <p className="text-[7px] sm:text-[9px] md:text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Updated {new Date(financeData.bankBalance.last_updated).toLocaleDateString()}
                  </p>
                )}
              </div>

              <Dialog open={showBankBalance} onOpenChange={setShowBankBalance}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[8px] sm:text-[9px] md:text-xs border-[#6CFF6C] text-green-700 dark:text-green-300 hover:bg-[#6CFF6C]/10 h-5 sm:h-6 md:h-8"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    <CreditCard className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5" />
                    <span className="hidden md:inline">Update Balance</span>
                    <span className="md:hidden">Update</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Manual Bank Balance</DialogTitle>
                    <DialogDescription>
                      Manually update your bank balance for cash or institutions not connected via Plaid.
                    </DialogDescription>
                  </DialogHeader>
                  <BankBalanceForm 
                    currentBalance={financeData?.bankBalance?.balance || 0}
                    connectedBanks={connectedBanks}
                    recentTransactions={financeData?.transactions?.slice(0, 10) || []}
                    onUpdate={updateBankBalance}
                    onClose={() => setShowBankBalance(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Financial Dreams Cards - Only show when toggle is on */}
          {showDreams && (
            <>
              {loadingDreams ? (
                <Card className="flex-shrink-0 w-64 border-2 border-dashed" style={{ borderColor: 'var(--color-border)' }}>
                  <CardContent className="p-4 flex items-center justify-center h-full">
                    <div className="text-center">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Loading dreams...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : financialDreams.length === 0 ? (
                <Card 
                  className="flex-shrink-0 w-36 sm:w-48 md:w-64 border-2 border-dashed" 
                  style={{ 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <CardContent className="p-2 sm:p-3 md:p-4 flex items-center justify-center h-full">
                    <div className="text-center">
                      <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-1.5 md:mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
                      <p className="text-[9px] sm:text-[10px] md:text-sm mb-1 sm:mb-1.5 md:mb-2" style={{ color: 'var(--color-foreground)' }}>No financial dreams yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dream-board')}
                        className="text-[8px] sm:text-[9px] md:text-xs h-5 sm:h-6 md:h-8"
                        style={{ borderRadius: 'var(--radius-md)' }}
                      >
                        Create Dream
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                financialDreams.map((dream) => {
                  const targetAmount = dream.targetAmount || 0;
                  const currentSaved = (dream.progress / 100) * targetAmount;
                  const remaining = targetAmount - currentSaved;

                  return (
                    <Card 
                      key={dream.id} 
                      className="flex-shrink-0 w-36 sm:w-48 md:w-64 border-2"
                      style={{ 
                        borderColor: 'var(--color-primary)',
                        backgroundColor: 'var(--color-card)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      <CardContent className="p-1.5 sm:p-2 md:p-4">
                        <div className="flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <div 
                              className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                              style={{ 
                                backgroundColor: 'var(--color-primary-soft)',
                                borderRadius: 'var(--radius-full)'
                              }}
                            >
                              <Target className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4" style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[9px] sm:text-[10px] md:text-sm truncate" style={{ color: 'var(--color-foreground)' }}>
                                {dream.title}
                              </p>
                              <Badge 
                                variant="outline" 
                                className="text-[7px] sm:text-[8px] md:text-[10px] mt-0.5 px-1 py-0"
                                style={{ 
                                  borderColor: 'var(--color-primary)',
                                  color: 'var(--color-primary)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                              >
                                {dream.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="mb-1 sm:mb-1.5 md:mb-2">
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <p className="text-[8px] sm:text-[9px] md:text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                              Progress
                            </p>
                            <p className="text-[8px] sm:text-[9px] md:text-xs font-semibold" style={{ color: '#00E0FF' }}>
                              {dream.progress.toFixed(0)}%
                            </p>
                          </div>
                          <div 
                            className="relative h-1.5 sm:h-2 w-full overflow-hidden rounded-full mb-1 sm:mb-1.5" 
                            style={{ 
                              backgroundColor: 'var(--color-muted)',
                              borderRadius: 'var(--radius-full)'
                            }}
                          >
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ 
                                width: `${dream.progress}%`,
                                background: 'linear-gradient(90deg, #00D1FF 0%, #00E0FF 100%)',
                                boxShadow: '0 0 8px rgba(0, 224, 255, 0.4)'
                              }}
                            />
                          </div>
                          
                          <div className="flex items-baseline justify-between">
                            <div>
                              <p className="text-[7px] sm:text-[9px] md:text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Saved</p>
                              <p className="text-[10px] sm:text-sm md:text-lg font-semibold" style={{ color: 'var(--color-primary)' }}>
                                ${currentSaved.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] sm:text-[9px] md:text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Remaining</p>
                              <p className="text-[9px] sm:text-xs md:text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                                ${remaining.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-[8px] sm:text-[9px] md:text-xs mt-1 sm:mt-1.5" style={{ color: 'var(--color-muted-foreground)' }}>
                            Target: ${targetAmount.toLocaleString()}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[8px] sm:text-[9px] md:text-xs h-5 sm:h-6 md:h-8"
                          onClick={() => setRecordSavingsDream(dream)}
                          style={{
                            borderColor: 'var(--color-primary)',
                            color: 'var(--color-primary)',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <Plus className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5" />
                          <span className="hidden md:inline">Record Savings</span>
                          <span className="md:hidden">Record</span>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Record Savings Dialog */}
        <Dialog open={!!recordSavingsDream} onOpenChange={(open) => !open && setRecordSavingsDream(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Savings</DialogTitle>
              <DialogDescription>
                Add to your savings progress for "{recordSavingsDream?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm mb-2 block" style={{ color: 'var(--color-foreground)' }}>
                  Amount Saved
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {recordSavingsDream && (
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Current Progress:</span>
                    <span style={{ color: 'var(--color-foreground)' }}>{recordSavingsDream.progress.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Current Saved:</span>
                    <span style={{ color: 'var(--color-foreground)' }}>
                      ${((recordSavingsDream.progress / 100) * (recordSavingsDream.targetAmount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRecordSavingsDream(null);
                    setSavingsAmount('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordSavings}
                  className="flex-1"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Record
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bank Balance Subtraction Dialog */}
        <Dialog open={showSubtractDialog} onOpenChange={setShowSubtractDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--color-foreground)' }}>
                Update Bank Balance?
              </DialogTitle>
              <DialogDescription>
                Would you like to subtract this ${pendingSavingsData?.amount.toLocaleString()} from your manual bank balance?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {pendingSavingsData && (
                <div 
                  className="p-4 rounded-lg space-y-2"
                  style={{ 
                    backgroundColor: 'var(--color-muted)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Dream:</span>
                    <span style={{ color: 'var(--color-foreground)' }} className="font-medium">
                      {pendingSavingsData.dream.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Amount Saved:</span>
                    <span style={{ color: 'var(--color-primary)' }} className="font-semibold">
                      ${pendingSavingsData.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Current Balance:</span>
                    <span style={{ color: 'var(--color-foreground)' }}>
                      ${financeData?.bankBalance?.balance?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div 
                    className="flex items-center justify-between text-sm pt-2 mt-2"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <span style={{ color: 'var(--color-muted-foreground)' }}>New Balance (if yes):</span>
                    <span style={{ color: 'var(--color-foreground)' }} className="font-semibold">
                      ${((financeData?.bankBalance?.balance || 0) - pendingSavingsData.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSubtractNo}
                  className="flex-1"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)'
                  }}
                >
                  No
                </Button>
                <Button
                  onClick={handleSubtractYes}
                  className="flex-1"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                  }}
                >
                  Yes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Refresh Balance Confirmation Dialog */}
        <Dialog open={!!showRefreshConfirm} onOpenChange={(open) => !open && setShowRefreshConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Balance Refresh</DialogTitle>
              <DialogDescription>
                <span className="block mb-2">Are you sure you want to refresh your bank balance?</span>
                <span className="block text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ You can refresh your balance once every 24 hours for free. Additional refreshes within 24 hours will use 10 credits.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowRefreshConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showRefreshConfirm?.itemId) {
                    refreshBankBalance(showRefreshConfirm.itemId);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sync Transactions Confirmation Dialog */}
        <Dialog open={!!showSyncConfirm} onOpenChange={(open) => !open && setShowSyncConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Load Transactions</DialogTitle>
              <DialogDescription>
                <span className="block mb-2">Load recent transactions from your connected bank account.</span>
                <span 
                  className="block text-sm"
                  style={{ 
                    color: 'var(--color-warning)',
                    padding: 'var(--spacing-2)',
                    backgroundColor: 'var(--color-warning-soft)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-warning)'
                  }}
                >
                  ⚠️ You can load transactions once every 24 hours. Additional loads within 24 hours will use 10 credits.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div 
              className="flex justify-end mt-4"
              style={{ gap: 'var(--spacing-3)' }}
            >
              <Button
                variant="outline"
                onClick={() => setShowSyncConfirm(null)}
                style={{
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-2) var(--spacing-4)'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showSyncConfirm?.itemId) {
                    syncBankTransactions(showSyncConfirm.itemId);
                  }
                }}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-foreground)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-2) var(--spacing-4)'
                }}
              >
                Load Transactions
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Skeleton while main content loads */}
      {!contentLoaded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <div 
            className="animate-pulse"
            style={{ 
              height: '48px', 
              backgroundColor: 'var(--color-muted)', 
              borderRadius: 'var(--radius-xl)' 
            }}
          />
          <div 
            className="animate-pulse"
            style={{ 
              height: '300px', 
              backgroundColor: 'var(--color-muted)', 
              borderRadius: 'var(--radius-lg)' 
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)' }}>
            <div 
              className="animate-pulse"
              style={{ 
                height: '120px', 
                backgroundColor: 'var(--color-muted)', 
                borderRadius: 'var(--radius-lg)' 
              }}
            />
            <div 
              className="animate-pulse"
              style={{ 
                height: '120px', 
                backgroundColor: 'var(--color-muted)', 
                borderRadius: 'var(--radius-lg)' 
              }}
            />
            <div 
              className="animate-pulse"
              style={{ 
                height: '120px', 
                backgroundColor: 'var(--color-muted)', 
                borderRadius: 'var(--radius-lg)' 
              }}
            />
          </div>
        </div>
      )}

      {/* Tabs - Single Cofounder Finance Tab - Progressive loading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: contentLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="auto-bookkeeping">
            Cofounder Finance
          </TabsTrigger>
        </TabsList>



        <TabsContent value="auto-bookkeeping">
          {/* Nested tabs inside Cofounder Finance */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList 
              className="grid w-full grid-cols-7 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/20"
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
                value="overview"
                className="data-[state=active]:bg-white/50 data-[state=active]:text-blue-600 text-[10px] sm:text-sm flex items-center justify-center"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Over</span>
              </TabsTrigger>
              <TabsTrigger 
                value="transactions"
                className="data-[state=active]:bg-white/50 data-[state=active]:text-blue-600 text-[10px] sm:text-sm flex items-center justify-center"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span className="hidden sm:inline">Transactions</span>
                <span className="sm:hidden">Trans</span>
              </TabsTrigger>
              <TabsTrigger 
                value="projections"
                className="data-[state=active]:bg-white/50 data-[state=active]:text-blue-600 text-[10px] sm:text-sm flex items-center justify-center"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span className="hidden sm:inline">Projections</span>
                <span className="sm:hidden">Proj</span>
              </TabsTrigger>
              <TabsTrigger 
                value="budgets"
                className="data-[state=active]:bg-white/50 data-[state=active]:text-blue-600 text-[10px] sm:text-sm flex items-center justify-center"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                Budgets
              </TabsTrigger>
              <TabsTrigger 
                value="quick-actions"
                className="data-[state=active]:bg-white/50 data-[state=active]:text-blue-600 text-[10px] sm:text-sm flex items-center justify-center"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span className="hidden sm:inline">Actions</span>
                <span className="sm:hidden">Acts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="receipts"
                className="data-[state=active]:bg-white/50 data-[state=active]:text-blue-600 text-[10px] sm:text-sm flex items-center justify-center"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <span className="hidden sm:inline">Receipts</span>
                <span className="sm:hidden">Rcpt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chat"
                className="data-[state=active]:bg-white/50 data-[state=active]:text-blue-600 text-[10px] sm:text-sm flex items-center justify-center"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                Chat
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - Main Dashboard */}
            <TabsContent value="overview" style={{ 
              marginTop: isMobile ? 0 : 'var(--spacing-4)',
              padding: 'var(--spacing-4)'
            }}>
              <FinanceOverviewTab 
                transactions={financeData.transactions}
                bankBalance={financeData.bankBalance}
              />
            </TabsContent>

            <TabsContent value="chat" style={{ marginTop: isMobile ? 0 : 'var(--spacing-4)' }}>
              <div style={{
                ...(isMobile && {
                  height: 'calc(100dvh - 160px)', 
                  maxHeight: 'calc(100dvh - 160px)',
                  overflow: 'hidden'
                })
              }}>
                <FinanceChat user={user} />
              </div>
            </TabsContent>

            <TabsContent value="quick-actions" style={{ padding: 'var(--spacing-4)' }}>
              {/* Info banner removed */}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {[
                  {
                    id: 'quarterly-tax-estimate',
                    label: 'Quarterly Tax Estimate',
                    description: 'Get quarterly tax calculations',
                    category: 'Tax Services',
                    icon: Calculator,
                    color: '#6c5ce7',
                  },
                  {
                    id: 'tax-deductions',
                    label: 'Find Tax Deductions',
                    description: 'Discover deduction opportunities',
                    category: 'Tax Services',
                    icon: Receipt,
                    color: '#00b894',
                  },
                  {
                    id: 'profitability-analysis',
                    label: 'Profitability Analysis',
                    description: 'Deep dive into profit margins',
                    category: 'Financial Analysis',
                    icon: TrendingUp,
                    color: '#0984e3',
                  },
                  {
                    id: 'cash-flow-review',
                    label: 'Cash Flow Review',
                    description: 'Assess cash health',
                    category: 'Financial Analysis',
                    icon: DollarSign,
                    color: '#e17055',
                  },
                  {
                    id: 'expense-optimization',
                    label: 'Expense Optimization',
                    description: 'Find cost savings',
                    category: 'Financial Analysis',
                    icon: PieChart,
                    color: '#fd79a8',
                  },
                  {
                    id: 'reconciliation-check',
                    label: 'Reconciliation Check',
                    description: 'Verify account accuracy',
                    category: 'Bookkeeping',
                    icon: Scale,
                    color: '#fdcb6e',
                  },
                  {
                    id: 'financial-statements',
                    label: 'Financial Statements',
                    description: 'Get complete statements',
                    category: 'Bookkeeping',
                    icon: FileText,
                    color: '#636e72',
                  },
                  {
                    id: 'business-health',
                    label: 'Business Health Check',
                    description: 'Overall health assessment',
                    category: 'Business Advisory',
                    icon: Briefcase,
                    color: '#d63031',
                  },
                  {
                    id: 'compliance-check',
                    label: 'Compliance Review',
                    description: 'Stay compliant',
                    category: 'Compliance',
                    icon: ShieldCheck,
                    color: '#2d3436',
                  },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={action.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-none relative"
                      style={{
                        background: 'var(--background)',
                        borderRadius: 'var(--radius-xl)',
                      }}
                      onClick={() => {
                        handleQuickAction(action.id, action.label, action.category);
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
                          <Icon className="w-6 h-6" style={{ color: action.color }} />
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
                            {action.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Financial Reports Section */}
              <FinanceReportsSection
                reports={reports}
                generatingReport={generatingReport}
                onDeleteReport={deleteReport}
              />

              {/* Automation Reports */}
              <div style={{ marginTop: isMobile ? 'var(--spacing-6)' : 'var(--spacing-8)' }}>
                <AutomationReportsWidget 
                  category="finance" 
                  categoryColor="var(--chart-3)"
                  maxResults={5}
                />
              </div>
            </TabsContent>

            <TabsContent value="projections" className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* 6-Month Bank Balance Projection Chart - TOP */}
              <ProjectionChart 
                transactions={financeData?.transactions || []}
                bankBalance={financeData?.bankBalance}
              />

              {/* Scenario Planning & Projections - Recurring cash flow analysis */}
              <ScenarioPlanning 
                transactions={financeData?.transactions || []}
                financialDreams={financialDreams || []}
                currentBankBalance={financeData?.bankBalance?.balance || 0}
              />

              {/* Runway Projections - Scenario Modeling */}
              <RunwayProjections
                transactions={financeData?.transactions || []}
                bankBalance={financeData?.bankBalance || 0}
              />

              {/* Burn Rate Calculator */}
              <BurnRateCalculator
                transactions={financeData?.transactions || []}
                bankBalance={financeData?.bankBalance || 0}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-2 sm:space-y-4 md:space-y-6">
              {/* Transactions List - Now includes comprehensive filters */}
              <Card>
                <CardHeader className="p-2 sm:p-4 md:p-6">
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex justify-between items-center gap-2">
                      <CardTitle className="text-xs sm:text-base md:text-lg">All Transactions</CardTitle>
                      <div className="flex gap-1 sm:gap-2">
                        <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
                          <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-[10px] sm:text-xs h-6 sm:h-8 md:h-9 px-1.5 sm:px-3">
                              <Plus className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline ml-1">Add Transaction</span>
                              <span className="sm:hidden ml-0.5">New</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add New Transaction</DialogTitle>
                              <DialogDescription>
                                Record a new income or expense transaction for your business.
                              </DialogDescription>
                            </DialogHeader>
                            <TransactionFormEnhanced
                              onTransactionAdded={handleTransactionAdded}
                              selectedBusiness={selectedBusiness}
                              user={user}
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={exportToExcel}
                          disabled={!financeData?.transactions || financeData.transactions.length === 0}
                          className="text-[10px] sm:text-xs h-6 sm:h-8 md:h-9 px-1.5 sm:px-3"
                        >
                          <FileSpreadsheet className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline ml-1">Export Excel</span>
                          <span className="sm:hidden ml-0.5">Export</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Cofounder Finance Categorization Button - Separate row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCofounderCategorization}
                        disabled={cofounderCategorizing || !financeData?.transactions || financeData.transactions.length === 0}
                        className="text-[10px] sm:text-xs border-[#4B00FF] text-[#4B00FF] hover:bg-[#4B00FF]/10 h-6 sm:h-8 md:h-9 px-1.5 sm:px-3 md:px-4 w-auto"
                      >
                        <Sparkles className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {cofounderCategorizing ? 'Categorizing...' : 'Categorize with Cofounder Finance'}
                        </span>
                      </Button>
                      {uncategorizedCount > 0 && !cofounderCategorizing && (
                        <span className="text-xs text-muted-foreground">
                          {Math.min(uncategorizedCount, 300)} transaction{Math.min(uncategorizedCount, 300) !== 1 ? 's' : ''} ready to categorize (10 credits)
                          {uncategorizedCount > 300 && ` • ${uncategorizedCount - 300} more available`}
                        </span>
                      )}
                      {uncategorizedCount === 0 && financeData?.transactions && financeData.transactions.length > 0 && (
                        <span className="text-xs text-success">
                          ✓ All transactions categorized with Cofounder Finance
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 md:p-6">
                  {financeData?.transactions && financeData.transactions.length > 0 ? (
                    <TransactionListEnhanced 
                      transactions={financeData.transactions} 
                      showFilters={true}
                      onTransactionEdit={handleTransactionEdit}
                      onTransactionDelete={handleTransactionDelete}
                      onBulkDelete={handleBulkDelete}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                    />
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <Receipt className="w-6 sm:w-8 md:w-12 h-6 sm:h-8 md:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-xs sm:text-sm md:text-base">No transactions found</p>
                      <p className="text-xs mt-1 sm:mt-2">Add a new transaction to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budgets" className="space-y-2 sm:space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-3">
                <div>
                  <h3 className="text-xs sm:text-base md:text-lg font-semibold">Budget Management</h3>
                  <p className="text-[10px] sm:text-xs text-gray-600">Track your spending against planned budgets</p>
                </div>
                <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto h-6 sm:h-8 md:h-9 text-[10px] sm:text-xs px-1.5 sm:px-3">
                      <Plus className="w-2.5 h-2.5 sm:w-4 sm:h-4 mr-0.5 sm:mr-2" />
                      Add Budget
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Budget</DialogTitle>
                      <DialogDescription>
                        Set up a new budget to track your spending against planned amounts.
                      </DialogDescription>
                    </DialogHeader>
                    <BudgetForm
                      selectedBusiness={selectedBusiness}
                      user={user}
                      onBudgetAdded={() => {
                        setShowAddBudget(false);
                        loadFinanceData();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Budget Cards */}
              {financeData?.budgets && financeData.budgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                  {financeData.budgets.filter(budget => budget && (budget.amount || budget.budget_amount)).map((budget, index) => (
                    <Card key={budget.id || index}>
                      <CardHeader className="p-2 sm:p-3 md:p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-xs sm:text-sm md:text-base truncate">{budget.name || 'Untitled Budget'}</CardTitle>
                            <p className="text-[10px] sm:text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>{budget.category || 'Uncategorized'}</p>
                          </div>
                          <Badge 
                            variant={budget.status === 'active' ? 'default' : 'secondary'}
                            className="text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 flex-shrink-0"
                          >
                            {budget.status || 'active'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
                        <div className="space-y-1 sm:space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Spent</span>
                            <span className="text-xs sm:text-sm md:text-base" style={{ fontWeight: 600 }}>
                              ${(budget.spent || budget.spent_amount || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Budget</span>
                            <span className="text-xs sm:text-sm md:text-base" style={{ fontWeight: 600 }}>
                              ${(budget.amount || budget.budget_amount || 0).toLocaleString()}
                            </span>
                          </div>
                          <Progress 
                            value={((budget.spent || budget.spent_amount || 0) / (budget.amount || budget.budget_amount || 1)) * 100} 
                            className="h-1 sm:h-1.5"
                          />
                          <div className="text-[9px] sm:text-xs text-center" style={{ color: 'var(--color-muted-foreground)' }}>
                            {(((budget.spent || budget.spent_amount || 0) / (budget.amount || budget.budget_amount || 1)) * 100).toFixed(1)}% used
                          </div>
                          
                          <div className="flex gap-1 sm:gap-1.5 pt-0.5 sm:pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-6 sm:h-7 md:h-8 text-[9px] sm:text-xs px-1 sm:px-2"
                              style={{
                                borderColor: 'var(--color-border)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                              onClick={() => {
                                setEditingBudget(budget);
                                setShowEditBudget(true);
                              }}
                            >
                              <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-6 sm:h-7 md:h-8 text-[9px] sm:text-xs px-1 sm:px-2 text-destructive hover:text-destructive"
                              style={{
                                borderColor: 'var(--color-border)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                              onClick={() => {
                                setDeletingBudget(budget);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <Target className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No budgets yet</h3>
                    <p className="text-xs sm:text-base text-gray-600 mb-3 sm:mb-4">
                      Create budgets to track your spending and stay on target
                    </p>
                    <Button onClick={() => setShowAddBudget(true)} className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Create Your First Budget
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="receipts" className="space-y-2 sm:space-y-4 md:space-y-6">
              <ReceiptsManagement
                businessId={selectedBusiness?.id || ''}
                userId={user?.id || ''}
                onTransactionsCreated={loadFinanceData}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      </motion.div>

      {/* Transaction Edit Modal */}
      <TransactionEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSave={handleTransactionSave}
        products={products}
      />

      {/* Budget Edit Modal */}
      {editingBudget && (
        <BudgetEditForm
          budget={editingBudget}
          isOpen={showEditBudget}
          onClose={() => {
            setShowEditBudget(false);
            setEditingBudget(null);
          }}
          onBudgetUpdated={handleBudgetUpdate}
          selectedBusiness={selectedBusiness}
          user={user}
        />
      )}

      {/* Budget Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Delete Budget
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the budget "{deletingBudget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingBudget(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleBudgetDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cofounder Finance Categorization Result Dialog */}
      <Dialog open={!!categorizationResult} onOpenChange={(open) => !open && setCategorizationResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6CFF6C]" />
              {categorizationResult?.processed === 0 ? 'All Categorized!' : 'Categorization Complete!'}
            </DialogTitle>
            <DialogDescription>
              {categorizationResult?.processed === 0 
                ? 'All transactions have been categorized with Cofounder Finance.' 
                : `Successfully categorized ${categorizationResult?.processed} transactions.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {categorizationResult?.processed === 0 ? (
              <>
                <div className="text-center space-y-2">
                  <div className="text-6xl">✅</div>
                  <p className="text-lg font-semibold text-foreground">
                    All transactions already categorized!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All your transactions have already been categorized with Cofounder Finance.
                  </p>
                </div>

                <div className="p-4 bg-muted border rounded-lg space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Want to recategorize specific transactions?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can manually edit any category by clicking on a transaction, or select specific transactions you'd like to recategorize for free.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCategorizationResult(null)}
                    className="w-full"
                  >
                    View Transactions
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <div className="text-6xl">✨</div>
                  <p className="text-lg font-semibold text-foreground">
                    Successfully categorized {categorizationResult?.processed} transaction{categorizationResult?.processed !== 1 ? 's' : ''}!
                  </p>
                </div>

                <div className="p-4 bg-muted border rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Transactions Processed:</span>
                    <span className="text-sm font-bold text-success">{categorizationResult?.processed}</span>
                  </div>
                  {(categorizationResult?.remaining ?? 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Remaining:</span>
                      <span className="text-sm font-bold text-[#FFCF00]">{categorizationResult?.remaining}</span>
                    </div>
                  )}
                </div>

                {(categorizationResult?.remaining ?? 0) > 0 && (
                  <div className="p-3 bg-[#FFCF00]/10 border border-[#FFCF00]/30 rounded-lg">
                    <p className="text-xs text-foreground">
                      🔄 <strong>{categorizationResult?.remaining} transaction{categorizationResult?.remaining !== 1 ? 's' : ''} remaining!</strong> Run Cofounder Finance again to continue (1 credit per batch).
                    </p>
                  </div>
                )}

                <div className="p-3 bg-accent/50 border rounded-lg">
                  <p className="text-xs text-foreground">
                    💡 <strong>Pro tip:</strong> You can manually edit any category by clicking on the transaction.
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setCategorizationResult(null)}
              className="bg-[#00E0FF] hover:bg-[#00E0FF]/80 text-white"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* IRS Categories Modal */}
      <Dialog open={showIRSCategories} onOpenChange={setShowIRSCategories}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>IRS Schedule C Expense Categories</DialogTitle>
            <DialogDescription>
              Common business expense categories for tax purposes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* IRS Categories List */}
            <div className="space-y-3">
              {[
                { name: "Advertising", description: "Marketing, promotions, business cards, website costs" },
                { name: "Car and Truck Expenses", description: "Vehicle costs for business use (mileage, gas, maintenance)" },
                { name: "Commissions and Fees", description: "Sales commissions, professional fees paid" },
                { name: "Contract Labor", description: "Payments to independent contractors" },
                { name: "Depletion", description: "Deduction for natural resource extraction" },
                { name: "Depreciation", description: "Equipment and property depreciation" },
                { name: "Employee Benefits", description: "Health insurance, retirement plans for employees" },
                { name: "Insurance", description: "Business insurance (liability, property, malpractice)" },
                { name: "Interest (Mortgage)", description: "Interest on business loans and mortgages" },
                { name: "Interest (Other)", description: "Other business-related interest payments" },
                { name: "Legal and Professional Services", description: "Attorney, accountant, consultant fees" },
                { name: "Office Expense", description: "Office supplies, postage, small equipment" },
                { name: "Pension and Profit-Sharing Plans", description: "Retirement plan contributions for employees" },
                { name: "Rent or Lease (Vehicles)", description: "Vehicle leasing costs" },
                { name: "Rent or Lease (Equipment)", description: "Equipment leasing or rental" },
                { name: "Rent or Lease (Property)", description: "Office or facility rent" },
                { name: "Repairs and Maintenance", description: "Business property and equipment repairs" },
                { name: "Supplies", description: "Business supplies and materials" },
                { name: "Taxes and Licenses", description: "Business licenses, permits, payroll taxes" },
                { name: "Travel", description: "Business travel costs (lodging, airfare)" },
                { name: "Meals", description: "Business meals (typically 50% deductible)" },
                { name: "Utilities", description: "Electricity, gas, water, phone, internet" },
                { name: "Wages", description: "Employee salaries and wages" },
                { name: "Other Expenses", description: "Miscellaneous business expenses not covered above" },
              ].map((category, idx) => (
                <div 
                  key={idx}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="font-medium text-sm">{category.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {category.description}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> These categories are based on IRS Schedule C. Consult with a tax professional for specific guidance on your business.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Action Result Dialog */}
      <QuickActionResultDialog
        open={showQuickActionResult}
        onOpenChange={setShowQuickActionResult}
        result={quickActionResult}
      />

    </div>
  );
}

// Bank Balance Update Form Component - Enhanced Calculator
const BankBalanceForm: React.FC<{
  currentBalance: number;
  connectedBanks: any[];
  recentTransactions: Transaction[];
  onUpdate: (balance: number) => void;
  onClose: () => void;
}> = ({ currentBalance, connectedBanks, recentTransactions, onUpdate, onClose }) => {
  const [balance, setBalance] = useState(currentBalance.toString());
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState<'set' | 'adjust'>('set');

  // Calculate total from connected banks
  const totalFromBanks = useMemo(() => {
    return connectedBanks.reduce((sum, bank) => sum + (bank.current_balance || 0), 0);
  }, [connectedBanks]);

  // Handle adding balance from other accounts
  const handleAddFromAccounts = () => {
    setBalance(totalFromBanks.toFixed(2));
    toast.success(`Added $${totalFromBanks.toLocaleString()} from ${connectedBanks.length} connected account(s)`);
  };

  // Handle adjustment (add/subtract)
  const handleAdjustBalance = (amount: number) => {
    const currentBal = parseFloat(balance) || 0;
    const newBalance = currentBal + amount;
    setBalance(newBalance.toFixed(2));
    setAdjustmentAmount('');
  };

  // Handle transaction quick add/subtract
  const handleTransactionAdjust = (transaction: Transaction) => {
    const currentBal = parseFloat(balance) || 0;
    let adjustment = 0;
    
    if (transaction.type === 'income') {
      adjustment = transaction.amount;
    } else {
      adjustment = -transaction.amount;
    }
    
    const newBalance = currentBal + adjustment;
    setBalance(newBalance.toFixed(2));
    
    toast.success(
      `${adjustment > 0 ? 'Added' : 'Subtracted'} $${Math.abs(adjustment).toLocaleString()} (${transaction.description})`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onUpdate(parseFloat(balance));
      onClose();
    } catch (error) {
      console.error('Error updating balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Mode Tabs */}
      <Tabs value={calculatorMode} onValueChange={(v) => setCalculatorMode(v as 'set' | 'adjust')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="set">Set Balance</TabsTrigger>
          <TabsTrigger value="adjust">Adjust Balance</TabsTrigger>
        </TabsList>

        {/* Set Balance Mode */}
        <TabsContent value="set" className="space-y-4">
          <div>
            <label htmlFor="balance" className="block text-sm font-medium mb-2">
              New Bank Balance
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current: ${currentBalance.toLocaleString()}
            </p>
          </div>

          {/* Add from Other Accounts */}
          {connectedBanks.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">Connected Bank Accounts</p>
                  <p className="text-xs text-muted-foreground">
                    Total: ${totalFromBanks.toLocaleString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFromAccounts}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Use Total
                </Button>
              </div>
              <div className="space-y-1">
                {connectedBanks.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {bank.institution_name} ••{bank.account_mask}
                    </span>
                    <span className="font-medium">
                      ${(bank.current_balance || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Adjust Balance Mode */}
        <TabsContent value="adjust" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Current Balance
            </label>
            <div className="text-2xl font-bold text-primary mb-4">
              ${parseFloat(balance || '0').toLocaleString()}
            </div>
          </div>

          {/* Quick Adjustment */}
          <div>
            <label htmlFor="adjustment" className="block text-sm font-medium mb-2">
              Add/Subtract Amount
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="adjustment"
                  type="number"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAdjustBalance(parseFloat(adjustmentAmount) || 0)}
                disabled={!adjustmentAmount}
                className="bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-500/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAdjustBalance(-(parseFloat(adjustmentAmount) || 0))}
                disabled={!adjustmentAmount}
                className="bg-red-500/10 border-red-500 text-red-700 dark:text-red-400 hover:bg-red-500/20"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Recent Transactions Quick Add */}
          {recentTransactions.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Recent Transactions
              </label>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`text-sm font-semibold ${
                          transaction.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}$
                        {transaction.amount.toLocaleString()}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTransactionAdjust(transaction)}
                        className="h-7 px-2"
                        title={`${transaction.type === 'income' ? 'Add' : 'Subtract'} this amount`}
                      >
                        {transaction.type === 'income' ? (
                          <Plus className="w-3 h-3 text-green-600" />
                        ) : (
                          <Minus className="w-3 h-3 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click the +/- button to quickly add or subtract transaction amounts from your balance
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Submit Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          New Balance: <span className="font-semibold text-foreground">${parseFloat(balance || '0').toLocaleString()}</span>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              'Update Balance'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default FinanceOperationsNew;