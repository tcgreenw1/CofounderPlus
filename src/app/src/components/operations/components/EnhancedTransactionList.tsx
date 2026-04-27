import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { ArrowUpDown, Edit, Trash2, Filter, Search, Calendar, DollarSign, Tag } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';
import { AGIActionBar } from '../../AGIActionBar';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status?: string;
  payment_method?: string;
  reference?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  // Future transaction fields
  scheduled_date?: string; // For future transactions
  is_future_transaction?: boolean;
}

interface Props {
  transactions: Transaction[];
  onTransactionUpdated: () => void;
  selectedBusiness: any;
}

type SortField = 'date' | 'amount' | 'description' | 'category' | 'type';
type SortOrder = 'asc' | 'desc';

export const EnhancedTransactionList: React.FC<Props> = ({ 
  transactions, 
  onTransactionUpdated,
  selectedBusiness
}) => {
  // Sorting and filtering states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Default: newest first
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTimeline, setFilterTimeline] = useState<'all' | 'current' | 'future'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRangeFrom, setDateRangeFrom] = useState('');
  const [dateRangeTo, setDateRangeTo] = useState('');

  // Editing states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: '',
    status: 'completed',
    payment_method: '',
    reference: ''
  });

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category))].filter(Boolean);
    return cats.sort();
  }, [transactions]);

  // Get unique statuses for filter dropdown
  const statuses = useMemo(() => {
    const stats = [...new Set(transactions.map(t => t.status || 'completed'))].filter(Boolean);
    return stats.sort();
  }, [transactions]);

  // Filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Text search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.reference?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => (t.status || 'completed') === filterStatus);
    }

    // Timeline filter (current vs future)
    if (filterTimeline !== 'all') {
      if (filterTimeline === 'future') {
        filtered = filtered.filter(t => t.is_future_transaction === true);
      } else if (filterTimeline === 'current') {
        filtered = filtered.filter(t => !t.is_future_transaction);
      }
    }

    // Date range filter
    if (dateRangeFrom) {
      filtered = filtered.filter(t => t.date >= dateRangeFrom);
    }
    if (dateRangeTo) {
      filtered = filtered.filter(t => t.date <= dateRangeTo);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterCategory, filterStatus, filterTimeline, dateRangeFrom, dateRangeTo, sortField, sortOrder]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending for new field
    }
  };

  // Handle edit
  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      status: transaction.status || 'completed',
      payment_method: transaction.payment_method || 'credit_card',
      reference: transaction.reference || ''
    });
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingTransaction || !selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions/${editingTransaction.id}?businessId=${selectedBusiness.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...editForm,
            amount: parseFloat(editForm.amount)
          })
        }
      );

      if (response.ok) {
        toast.success('Transaction updated successfully!');
        setEditingTransaction(null);
        onTransactionUpdated();
      } else {
        const error = await response.text();
        toast.error(`Failed to update transaction: ${error}`);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Network error. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async (transaction: Transaction) => {
    if (!selectedBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/finance/transactions/${transaction.id}?businessId=${selectedBusiness.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('Transaction deleted successfully!');
        onTransactionUpdated();
      } else {
        const error = await response.text();
        toast.error(`Failed to delete transaction: ${error}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Network error. Please try again.');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterTimeline('all');
    setDateRangeFrom('');
    setDateRangeTo('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Transaction History
          </span>
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedTransactions.length} of {transactions.length} transactions
          </span>
        </CardTitle>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTimeline} onValueChange={(value: any) => setFilterTimeline(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="current">Current Only</SelectItem>
                <SelectItem value="future">Scheduled Only</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From date"
              value={dateRangeFrom}
              onChange={(e) => setDateRangeFrom(e.target.value)}
              className="text-sm"
            />

            <Input
              type="date"
              placeholder="To date"
              value={dateRangeTo}
              onChange={(e) => setDateRangeTo(e.target.value)}
              className="text-sm"
            />

            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* AGI Action Bar */}
        <div className="mb-4">
          <AGIActionBar
            onTaskComplete={(taskType) => {
              console.log('Task completed:', taskType);
              onTransactionUpdated();
            }}
            businessId={selectedBusiness?.id}
            month={new Date().toISOString().slice(0, 7)} // YYYY-MM format
          />
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th 
                  className="pb-3 cursor-pointer hover:text-primary"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="pb-3 cursor-pointer hover:text-primary"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Description
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="pb-3 cursor-pointer hover:text-primary"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    Category
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="pb-3 cursor-pointer hover:text-primary"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="pb-3 cursor-pointer hover:text-primary text-right"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4" />
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTransactions.map((transaction) => (
                <tr key={transaction.id} className={`border-b hover:bg-muted/50 ${transaction.is_future_transaction ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                  <td className="py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {transaction.is_future_transaction ? (
                        <div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Scheduled</div>
                          <div>{formatDate(transaction.scheduled_date || transaction.date)}</div>
                        </div>
                      ) : (
                        formatDate(transaction.date)
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        {transaction.reference && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {transaction.reference}
                          </div>
                        )}
                      </div>
                      {transaction.is_future_transaction && (
                        <Calendar className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="text-xs">
                      {transaction.category}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant={transaction.type === 'income' ? 'default' : 'secondary'}
                        className="text-xs w-fit"
                      >
                        {transaction.type}
                      </Badge>
                      {transaction.is_future_transaction && (
                        <Badge 
                          variant="outline" 
                          className="text-xs w-fit bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                        >
                          Future
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className={`py-3 text-right font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </td>
                  <td className="py-3">
                    <Badge 
                      variant={(transaction.status || 'completed') === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {transaction.status || 'completed'}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction "{transaction.description}"? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(transaction)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSortedTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {transactions.length === 0 ? (
                <p>No transactions found. Add your first transaction to get started.</p>
              ) : (
                <p>No transactions match your current filters.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Transaction Modal */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details below. All changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
            
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Transaction description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <Input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select
                    value={editForm.type}
                    onValueChange={(value: 'income' | 'expense') => 
                      setEditForm({ ...editForm, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    value={editForm.status || 'completed'}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <Select
                    value={editForm.payment_method || 'credit_card'}
                    onValueChange={(value) => setEditForm({ ...editForm, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reference (Optional)</label>
                <Input
                  value={editForm.reference}
                  onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                  placeholder="Reference number or note"
                />
              </div>
            </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setEditingTransaction(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};