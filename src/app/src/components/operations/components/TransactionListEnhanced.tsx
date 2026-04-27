import React, { useState, useMemo } from 'react';
import { useIsMobile } from '../../ui/use-mobile';
import { toast } from 'sonner@2.0.3';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Package,
  RepeatIcon,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';

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
  product_id?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  discount_percentage?: number;
  is_payroll_sync?: boolean;
  payroll_month?: number;
  payroll_year?: number;
  employee_count?: number;
  created_at: string;
}

interface TransactionListEnhancedProps {
  transactions: Transaction[];
  showFilters?: boolean;
  onTransactionEdit?: (transaction: Transaction) => void;
  onTransactionDelete?: (transactionId: string) => void;
  onBulkDelete?: (transactionIds: string[]) => void;
  onBulkStatusUpdate?: (transactionIds: string[], status: string) => void;
}

type SortField = 'date' | 'amount' | 'status' | 'description' | 'category';
type SortDirection = 'asc' | 'desc';

const TransactionRowEnhanced: React.FC<{ 
  transaction: Transaction; 
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}> = React.memo(({ transaction, onEdit, onDelete, isSelected, onSelect }) => {
  const isMobile = useIsMobile();
  const isIncome = transaction.type === 'income';
  const IconComponent = isIncome ? TrendingUp : TrendingDown;
  const isOverdue = transaction.due_date && new Date(transaction.due_date) < new Date() && transaction.status === 'pending';
  const isRecurring = transaction.recurrence_type && transaction.recurrence_type !== 'one-time';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatRecurrence = (type: string) => {
    switch (type) {
      case 'bi-weekly': return 'Every 2 weeks';
      case 'monthly': return 'Monthly';
      case 'annual': return 'Annually';
      default: return '';
    }
  };

  // Excel-style table row for both mobile and desktop
  return (
    <div 
      className={`
        grid items-center gap-1.5 py-1 px-1.5 border-b last:border-b-0
        ${isMobile ? 'grid-cols-[20px_28px_2fr_60px_65px_24px] text-[10px]' : 'grid-cols-[32px_32px_1fr_120px_100px_100px_80px_32px] text-xs'}
        ${isOverdue ? 'bg-red-50 dark:bg-red-900/10' : ''} 
        ${isSelected ? 'bg-[#00E0FF]/10 dark:bg-[#00E0FF]/20' : ''} 
        hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors
      `}
      style={{
        borderColor: 'var(--color-border)'
      }}
    >
      {/* Checkbox */}
      {onSelect && (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(transaction.id, checked as boolean)}
            className="w-3 h-3"
          />
        </div>
      )}
      
      {/* Type Icon */}
      <div className="flex items-center justify-center">
        <div 
          className={`${isMobile ? 'w-6 h-6' : 'w-6 h-6'} rounded-full flex items-center justify-center`}
          style={{
            backgroundColor: isIncome ? 'var(--success-soft)' : 'var(--destructive-soft)',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <IconComponent 
            className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
            style={{
              color: isIncome ? 'var(--success)' : 'var(--destructive)'
            }}
          />
        </div>
      </div>
      
      {/* Description */}
      <div className="min-w-0 overflow-hidden">
        <div className="flex items-center gap-1">
          <span className="truncate" style={{ fontWeight: 600 }}>
            {transaction.description}
          </span>
          {isOverdue && (
            <AlertCircle className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-red-500 flex-shrink-0`} />
          )}
          {isRecurring && !isMobile && (
            <RepeatIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          )}
        </div>
        {!isMobile && (
          <div className="text-[10px] truncate" style={{ color: 'var(--color-muted-foreground)' }}>
            {transaction.category}
          </div>
        )}
      </div>
      
      {/* Category - Desktop only */}
      {!isMobile && (
        <div className="truncate" style={{ color: 'var(--color-muted-foreground)' }}>
          {transaction.category}
        </div>
      )}
      
      {/* Date */}
      <div className={`truncate ${isMobile ? 'text-right' : ''}`} style={{ color: 'var(--color-muted-foreground)' }}>
        {new Date(transaction.date).toLocaleDateString(undefined, { 
          month: isMobile ? 'numeric' : 'short', 
          day: 'numeric', 
          year: isMobile ? '2-digit' : 'numeric' 
        })}
      </div>
      
      {/* Amount */}
      <div className="text-right">
        <span 
          style={{ 
            fontWeight: 600,
            color: isIncome ? 'var(--success)' : 'var(--destructive)'
          }}
        >
          {isIncome ? '+' : '-'}${(transaction.amount || 0).toLocaleString()}
        </span>
      </div>
      
      {/* Status - Desktop only, on mobile combined with actions */}
      {!isMobile && (
        <div>
          <Badge 
            className={`text-[9px] px-1.5 py-0.5 ${getStatusColor(transaction.status)}`}
            style={{
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {transaction.status}
          </Badge>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className={`${isMobile ? 'h-6 w-6' : 'h-6 w-6'} p-0`}
              type="button"
            >
              <MoreHorizontal className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(transaction);
              }}>
                Edit Transaction
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(transaction.id);
                  }}
                  className="text-red-600"
                >
                  Delete Transaction
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

// Sortable column header component
const SortableHeader: React.FC<{
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}> = ({ field, currentField, direction, onSort, children }) => {
  const isActive = currentField === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-2 hover:text-[#00E0FF] transition-colors group"
    >
      <span>{children}</span>
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="w-4 h-4 text-[#00E0FF]" />
        ) : (
          <ArrowDown className="w-4 h-4 text-[#00E0FF]" />
        )
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </button>
  );
};

export const TransactionListEnhanced: React.FC<TransactionListEnhancedProps> = ({ 
  transactions, 
  showFilters = false,
  onTransactionEdit,
  onTransactionDelete,
  onBulkDelete,
  onBulkStatusUpdate
}) => {
  const isMobile = useIsMobile();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPageSizeSelector, setShowPageSizeSelector] = useState(false);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Selection handlers - toggle behavior
  const handleSelectAll = (checked: boolean) => {
    if (selectedIds.size > 0) {
      // If any are selected, clear all
      setSelectedIds(new Set());
    } else {
      // If none selected, select all
      setSelectedIds(new Set(filteredAndSortedTransactions.map(t => t.id)));
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) {
      try {
        if (onBulkDelete) {
          await onBulkDelete(Array.from(selectedIds));
        } else if (onTransactionDelete) {
          // Fallback to individual deletes if bulk not available
          for (const id of selectedIds) {
            await onTransactionDelete(id);
          }
        }
        clearSelection();
        toast.success(`Deleted ${selectedIds.size} transaction(s)`);
      } catch (error) {
        toast.error('Failed to delete transactions');
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.size === 0) return;
    
    try {
      if (onBulkStatusUpdate) {
        await onBulkStatusUpdate(Array.from(selectedIds), status);
        clearSelection();
        toast.success(`Updated ${selectedIds.size} transaction(s) to ${status}`);
      } else {
        toast.error('Bulk status update not available');
      }
    } catch (error) {
      toast.error('Failed to update transactions');
    }
  };

  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      // Dynamically import XLSX only when needed
      const XLSX = await import('xlsx');
      
      const selectedTransactions = transactions.filter(t => selectedIds.has(t.id));
      
      const exportData = selectedTransactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString(),
        Description: t.description,
        Type: t.type,
        Category: t.category,
        Amount: t.amount,
        Status: t.status,
        'Payment Method': t.payment_method || '',
        Reference: t.reference || '',
        Tags: t.tags?.join(', ') || '',
        Notes: t.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      XLSX.writeFile(workbook, `transactions_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`Exported ${selectedIds.size} transaction(s)`);
    } catch (error) {
      toast.error('Failed to export transactions');
    }
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    console.log('🔍 Filtering transactions. Total:', transactions.length);
    console.log('🔍 Current filters:', { filterStatus, filterType, filterCategory, searchTerm });
    
    let filtered = transactions.filter(transaction => {
      // Basic text search - add null checks
      const matchesSearch = (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (transaction.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (transaction.product_name && transaction.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status, type, category filters
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
      
      // Frequency/Recurrence filter
      const matchesFrequency = filterFrequency === 'all' || 
                              (filterFrequency === 'recurring' && transaction.recurrence_type && transaction.recurrence_type !== 'one-time') ||
                              (filterFrequency === 'one-time' && (!transaction.recurrence_type || transaction.recurrence_type === 'one-time')) ||
                              (filterFrequency === 'bi-weekly' && transaction.recurrence_type === 'bi-weekly') ||
                              (filterFrequency === 'monthly' && transaction.recurrence_type === 'monthly') ||
                              (filterFrequency === 'annual' && transaction.recurrence_type === 'annual');
      
      // Payment method filter
      const matchesPaymentMethod = filterPaymentMethod === 'all' || 
                                   transaction.payment_method === filterPaymentMethod ||
                                   (!transaction.payment_method && filterPaymentMethod === 'none');
      
      // Tags filter (transaction must have ALL selected tags)
      const matchesTags = filterTags.length === 0 || 
                         (transaction.tags && filterTags.every(tag => transaction.tags?.includes(tag)));
      
      // Date range filter
      const transactionDate = new Date(transaction.date).getTime();
      const matchesDateFrom = !filterDateFrom || transactionDate >= new Date(filterDateFrom).getTime();
      const matchesDateTo = !filterDateTo || transactionDate <= new Date(filterDateTo).getTime();
      
      // Amount range filter
      const matchesAmountMin = !filterAmountMin || transaction.amount >= parseFloat(filterAmountMin);
      const matchesAmountMax = !filterAmountMax || transaction.amount <= parseFloat(filterAmountMax);
      
      return matchesSearch && matchesStatus && matchesType && matchesCategory && 
             matchesFrequency && matchesPaymentMethod && matchesTags && matchesDateFrom && matchesDateTo &&
             matchesAmountMin && matchesAmountMax;
    });

    // Sort transactions based on column
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    console.log('✅ Filtered transactions:', filtered.length, 'of', transactions.length);
    return filtered;
  }, [transactions, searchTerm, filterStatus, filterType, filterCategory, filterFrequency, 
      filterPaymentMethod, filterTags, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, sortField, sortDirection]);

  // Get unique values for filters
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    return uniqueCategories;
  }, [transactions]);

  const paymentMethods = useMemo(() => {
    const uniqueMethods = [...new Set(transactions.map(t => t.payment_method).filter(Boolean))];
    return uniqueMethods;
  }, [transactions]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    transactions.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [transactions]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterType !== 'all') count++;
    if (filterCategory !== 'all') count++;
    if (filterFrequency !== 'all') count++;
    if (filterPaymentMethod !== 'all') count++;
    if (filterTags.length > 0) count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    if (filterAmountMin) count++;
    if (filterAmountMax) count++;
    if (searchTerm) count++;
    return count;
  }, [filterStatus, filterType, filterCategory, filterFrequency, filterPaymentMethod, filterTags, 
      filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, searchTerm]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
    setFilterCategory('all');
    setFilterFrequency('all');
    setFilterPaymentMethod('all');
    setFilterTags([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setSearchTerm('');
  };

  // Summary statistics - ALWAYS uses ALL transactions (not filtered)
  const summary = useMemo(() => {
    // Use ALL transactions, not the filtered ones
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pending = transactions.filter(t => t.status === 'pending').length;
    const overdue = transactions.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status === 'pending'
    ).length;

    // Calculate monthly averages (last 12 months)
    const now = new Date();
    const monthlyIn = Math.round(transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const monthsAgo = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 12 && t.type === 'income' && t.status === 'completed';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0) / 12);
      
    const monthlyOut = Math.round(transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const monthsAgo = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo <= 12 && t.type === 'expense';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0) / 12);

    return { 
      totalIncome, 
      totalExpenses, 
      pending, 
      overdue, 
      net: totalIncome - totalExpenses,
      monthlyIn,
      monthlyOut,
      monthlyNet: monthlyIn - monthlyOut
    };
  }, [transactions]); // Only depends on transactions, NOT filteredAndSortedTransactions

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filteredAndSortedTransactions.length]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
    toast.success(`Showing ${newSize} transactions per page`);
  };

  const allSelected = selectedIds.size > 0 && selectedIds.size === paginatedTransactions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < paginatedTransactions.length;

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
          <p className="text-gray-600">
            Your transactions will appear here once you add them
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-green-600 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-green-700 dark:text-green-300">Income</p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-green-600 truncate`}>${summary.totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className="flex items-center gap-2">
              <TrendingDown className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-red-600 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-red-700 dark:text-red-300">Expenses</p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-red-600 truncate`}>${summary.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className="flex items-center gap-2">
              <Clock className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-yellow-600 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">Pending</p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-yellow-600`}>{summary.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-blue-600 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-blue-700 dark:text-blue-300">Net</p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold truncate ${summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${summary.net.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-green-600 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-green-700 dark:text-green-300">Monthly In</p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-green-600 truncate`}>${summary.monthlyIn.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className="flex items-center gap-2">
              <TrendingDown className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-red-600 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-red-700 dark:text-red-300">Monthly Out</p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-red-600 truncate`}>${summary.monthlyOut.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <CardContent className={isMobile ? "p-3" : "p-4"}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-blue-600 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs text-blue-700 dark:text-blue-300">Monthly Net</p>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} font-bold truncate ${summary.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${summary.monthlyNet.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card style={{ borderColor: 'var(--color-border)' }}>
          <CardHeader className="p-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" style={{ color: 'var(--color-muted-foreground)' }} />
                <CardTitle className="text-xs">Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge className="bg-gray-400 text-white text-[8px] px-1 py-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-[#FF4F4F] hover:text-[#FF4F4F] hover:bg-[#FF4F4F]/10 h-5 px-1.5 text-[8px]"
                  >
                    <X className="w-2.5 h-2.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  style={{ color: 'var(--color-muted-foreground)' }}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 h-5 px-1.5 text-[8px]"
                >
                  <SlidersHorizontal className="w-2.5 h-2.5" />
                  {showAdvancedFilters ? (
                    <ChevronUp className="w-2.5 h-2.5 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-1.5 pt-0">
            {/* Basic Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1">
              <div className="space-y-0.5">
                <label className="text-[8px]" style={{ fontWeight: 500 }}>Search</label>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-6 text-[9px] px-1.5"
                  style={{ 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                />
              </div>
              
              <div className="space-y-0.5">
                <label className="text-[8px]" style={{ fontWeight: 500 }}>Type</label>
                <Select value={filterType} onValueChange={(value) => {
                  console.log('Type filter changed to:', value);
                  setFilterType(value);
                }}>
                  <SelectTrigger className="h-6 text-[9px] px-1.5" style={{ 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="income">💰 Income</SelectItem>
                    <SelectItem value="expense">💸 Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px]" style={{ fontWeight: 500 }}>Status</label>
                <Select value={filterStatus} onValueChange={(value) => {
                  console.log('Status filter changed to:', value);
                  setFilterStatus(value);
                }}>
                  <SelectTrigger className="h-6 text-[9px] px-1.5" style={{ 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="completed">✅ Done</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="scheduled">📅 Scheduled</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px]" style={{ fontWeight: 500 }}>Category</label>
                <Select value={filterCategory} onValueChange={(value) => {
                  console.log('Category filter changed to:', value);
                  console.log('Available categories:', categories);
                  setFilterCategory(value);
                }}>
                  <SelectTrigger className="h-6 text-[9px] px-1.5" style={{ 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-0.5">
                <label className="text-[8px]" style={{ fontWeight: 500 }}>Frequency</label>
                <Select value={filterFrequency} onValueChange={(value) => {
                  console.log('Frequency filter changed to:', value);
                  setFilterFrequency(value);
                }}>
                  <SelectTrigger className="h-6 text-[9px] px-1.5" style={{ 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="one-time">📝 One-time</SelectItem>
                    <SelectItem value="recurring">🔁 Recurring</SelectItem>
                    <SelectItem value="bi-weekly">📆 Bi-weekly</SelectItem>
                    <SelectItem value="monthly">📅 Monthly</SelectItem>
                    <SelectItem value="annual">🗓️ Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="space-y-1 pt-1 mt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                {/* Date Range */}
                <div>
                  <label className="text-[8px] mb-0.5 block" style={{ fontWeight: 500 }}>Date Range</label>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="space-y-0.5">
                      <label className="text-[7px]" style={{ color: 'var(--color-muted-foreground)' }}>From</label>
                      <Input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="h-6 text-[9px] px-1"
                        style={{ 
                          borderColor: 'var(--color-border)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px]" style={{ color: 'var(--color-muted-foreground)' }}>To</label>
                      <Input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="h-6 text-[9px] px-1"
                        style={{ 
                          borderColor: 'var(--color-border)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="text-[8px] mb-0.5 block" style={{ fontWeight: 500 }}>Amount Range</label>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="space-y-0.5">
                      <label className="text-[7px]" style={{ color: 'var(--color-muted-foreground)' }}>Min</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filterAmountMin}
                        onChange={(e) => setFilterAmountMin(e.target.value)}
                        className="h-6 text-[9px] px-1"
                        style={{ 
                          borderColor: 'var(--color-border)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px]" style={{ color: 'var(--color-muted-foreground)' }}>Max</label>
                      <Input
                        type="number"
                        placeholder="Any"
                        value={filterAmountMax}
                        onChange={(e) => setFilterAmountMax(e.target.value)}
                        className="h-6 text-[9px] px-1"
                        style={{ 
                          borderColor: 'var(--color-border)',
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm" style={{ fontWeight: 500 }}>Payment Method</label>
                    <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                      <SelectTrigger style={{ 
                        borderColor: 'var(--color-border)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="none">No Method Set</SelectItem>
                        {paymentMethods.map(method => (
                          <SelectItem key={method} value={method}>
                            {method.replace('-', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags Filter */}
                  {allTags.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm" style={{ fontWeight: 500 }}>Tags</label>
                      <div style={{ 
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-3)',
                        maxHeight: '8rem',
                        overflowY: 'auto'
                      }}>
                        {allTags.length === 0 ? (
                          <p className="text-sm text-gray-500">No tags available</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => (
                              <Badge
                                key={tag}
                                variant={filterTags.includes(tag) ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${
                                  filterTags.includes(tag)
                                    ? 'bg-[#00E0FF] text-white hover:bg-[#00E0FF]/80'
                                    : 'border-[#00E0FF]/30 hover:bg-[#00E0FF]/10'
                                }`}
                                onClick={() => {
                                  setFilterTags(prev =>
                                    prev.includes(tag)
                                      ? prev.filter(t => t !== tag)
                                      : [...prev, tag]
                                  );
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-[#00E0FF] bg-[#00E0FF]/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">
                {selectedIds.size} selected
              </span>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('completed')}
                  className="border-[#6CFF6C] text-[#6CFF6C] hover:bg-[#6CFF6C]/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('pending')}
                  className="border-[#FFCF00] text-[#FFCF00] hover:bg-[#FFCF00]/10"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Mark Pending
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkExport}
                  className="border-[#00E0FF] text-[#00E0FF] hover:bg-[#00E0FF]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="border-[#FF4F4F] text-[#FF4F4F] hover:bg-[#FF4F4F]/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Alert */}
      {summary.overdue > 0 && (
        <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                {summary.overdue} overdue transaction{summary.overdue !== 1 ? 's' : ''} need attention
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <Card>
        <CardHeader className={isMobile ? "p-2 pb-1" : ""}>
          <div className="flex justify-between items-center">
            <CardTitle className={isMobile ? "text-sm" : ""}>
              Transactions ({filteredAndSortedTransactions.length})
            </CardTitle>
          </div>
          
          {/* Excel-style column headers for both mobile and desktop */}
          {filteredAndSortedTransactions.length > 0 && (
            <div 
              className={`
                grid items-center gap-1.5 py-1.5 px-1.5 border-b
                ${isMobile ? 'grid-cols-[20px_28px_2fr_60px_65px_24px] text-[8px]' : 'grid-cols-[32px_32px_1fr_120px_100px_100px_80px_32px] text-xs'}
                font-semibold
              `}
              style={{ 
                color: 'var(--color-muted-foreground)',
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-muted)'
              }}
            >
              {/* Checkbox header */}
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  className="w-3 h-3"
                />
              </div>
              
              {/* Type header */}
              <div className="text-center">{isMobile ? '+/-' : 'Type'}</div>
              
              {/* Description header */}
              <div>
                <SortableHeader
                  field="description"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  {isMobile ? 'Item' : 'Description'}
                </SortableHeader>
              </div>
              
              {/* Category - Desktop only */}
              {!isMobile && (
                <div>
                  <SortableHeader
                    field="category"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Category
                  </SortableHeader>
                </div>
              )}
              
              {/* Date header */}
              <div className={isMobile ? "text-right" : ""}>
                <SortableHeader
                  field="date"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  Date
                </SortableHeader>
              </div>
              
              {/* Amount header */}
              <div className="text-right">
                <SortableHeader
                  field="amount"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  {isMobile ? 'Amt' : 'Amount'}
                </SortableHeader>
              </div>
              
              {/* Status - Desktop only */}
              {!isMobile && (
                <div>
                  <SortableHeader
                    field="status"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Status
                  </SortableHeader>
                </div>
              )}
              
              {/* Actions header */}
              <div className="text-center">{isMobile ? '' : ''}</div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            console.log('🎨 RENDERING TRANSACTIONS:', filteredAndSortedTransactions.length, 'IDs:', filteredAndSortedTransactions.map(t => t.id).slice(0, 5));
            return null;
          })()}
          {filteredAndSortedTransactions.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedTransactions.map((transaction) => (
                <TransactionRowEnhanced
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={onTransactionEdit}
                  onDelete={onTransactionDelete}
                  isSelected={selectedIds.has(transaction.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions match your filters</p>
              <p className="text-sm mt-2">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {filteredAndSortedTransactions.length > pageSize && (
        <Card style={{ borderColor: 'var(--color-border)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronsLeft
                  className="w-4 h-4 cursor-pointer"
                  style={{ color: 'var(--color-muted-foreground)' }}
                  onClick={() => goToPage(1)}
                />
                <ChevronLeft
                  className="w-4 h-4 cursor-pointer"
                  style={{ color: 'var(--color-muted-foreground)' }}
                  onClick={() => goToPage(currentPage - 1)}
                />
                <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <ChevronRight
                  className="w-4 h-4 cursor-pointer"
                  style={{ color: 'var(--color-muted-foreground)' }}
                  onClick={() => goToPage(currentPage + 1)}
                />
                <ChevronsRight
                  className="w-4 h-4 cursor-pointer"
                  style={{ color: 'var(--color-muted-foreground)' }}
                  onClick={() => goToPage(totalPages)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm" style={{ fontWeight: 500 }}>Show</label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="h-7 text-[9px] px-1.5" style={{ 
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <label className="text-sm" style={{ fontWeight: 500 }}>per page</label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};