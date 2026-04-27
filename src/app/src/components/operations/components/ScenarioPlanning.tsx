import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpDown, ArrowUp, ArrowDown, Calculator, DollarSign } from 'lucide-react';
import { useIsMobile } from '../../ui/use-mobile';
import { Button } from '../../ui/button';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  recurrence_type?: 'one-time' | 'bi-weekly' | 'monthly' | 'annual';
  status: string;
  date: string;
}

interface FinancialDream {
  id: string;
  title: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  category?: string;
  status?: string;
}

interface ScenarioPlanningProps {
  transactions: Transaction[];
  financialDreams: FinancialDream[];
  currentBankBalance: number;
}

type SortField = 'name' | 'category' | 'date' | 'amount' | 'recurrence' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

export function ScenarioPlanning({ transactions, financialDreams, currentBankBalance }: ScenarioPlanningProps) {
  const isMobile = useIsMobile();
  
  // Filter for recurring transactions
  const recurringTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.recurrence_type && 
      t.recurrence_type !== 'one-time' && 
      t.status !== 'cancelled'
    );
  }, [transactions]);

  const recurringExpenses = useMemo(() => recurringTransactions.filter(t => t.type === 'expense'), [recurringTransactions]);
  const recurringIncome = useMemo(() => recurringTransactions.filter(t => t.type === 'income'), [recurringTransactions]);

  // Selection state for "what-if" analysis
  // Initialize with all selected
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(() => new Set(recurringExpenses.map(t => t.id)));
  const [selectedIncome, setSelectedIncome] = useState<Set<string>>(() => new Set(recurringIncome.map(t => t.id)));
  const [selectedDreams, setSelectedDreams] = useState<Set<string>>(() => new Set(financialDreams.map(d => d.id)));

  // Sorting state
  const [expenseSort, setExpenseSort] = useState<SortState>({ field: 'amount', direction: 'desc' });
  const [incomeSort, setIncomeSort] = useState<SortState>({ field: 'amount', direction: 'desc' });
  const [dreamSort, setDreamSort] = useState<SortState>({ field: 'amount', direction: 'desc' });

  const toggleExpense = (id: string) => {
    const newSet = new Set(selectedExpenses);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedExpenses(newSet);
  };

  const toggleIncome = (id: string) => {
    const newSet = new Set(selectedIncome);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIncome(newSet);
  };

  const toggleDream = (id: string) => {
    const newSet = new Set(selectedDreams);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDreams(newSet);
  };

  // Helper to convert recurrence to monthly multiplier
  const getMonthlyMultiplier = (recurrence?: string) => {
    switch (recurrence) {
      case 'bi-weekly': return 2; // Approx
      case 'monthly': return 1;
      case 'annual': return 1/12;
      default: return 0;
    }
  };

  const getMonthlyAmount = (t: Transaction) => {
    return t.amount * getMonthlyMultiplier(t.recurrence_type);
  };

  // Calculate projections
  const monthlyExpenseTotal = recurringExpenses
    .filter(t => selectedExpenses.has(t.id))
    .reduce((sum, t) => sum + getMonthlyAmount(t), 0);

  const monthlyIncomeTotal = recurringIncome
    .filter(t => selectedIncome.has(t.id))
    .reduce((sum, t) => sum + getMonthlyAmount(t), 0);

  // For dreams, assume a monthly contribution is needed to reach target by date, 
  const calculateDreamMonthlyContribution = (dream: FinancialDream) => {
    const target = dream.target_amount || 0;
    const current = dream.current_amount || 0;
    const remaining = Math.max(0, target - current);
    
    if (remaining === 0) return 0;

    if (dream.target_date) {
      const now = new Date();
      const targetDate = new Date(dream.target_date);
      const months = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
      const monthsRemaining = Math.max(1, months);
      return remaining / monthsRemaining;
    }
    
    // Default to 12 months if no date
    return remaining / 12;
  };

  const monthlyContributionsTotal = financialDreams
    .filter(d => selectedDreams.has(d.id))
    .reduce((sum, d) => sum + calculateDreamMonthlyContribution(d), 0);

  const netMonthlyFlow = monthlyIncomeTotal - monthlyExpenseTotal - monthlyContributionsTotal;
  const projectedSixMonthBalance = currentBankBalance + (netMonthlyFlow * 6);

  // Sort functions
  const sortData = (data: any[], sortState: SortState, type: 'transaction' | 'dream') => {
    return [...data].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortState.field) {
        case 'name':
          valA = type === 'transaction' ? a.description : a.title;
          valB = type === 'transaction' ? b.description : b.title;
          break;
        case 'category':
          valA = a.category || '';
          valB = b.category || '';
          break;
        case 'date':
          valA = type === 'transaction' ? a.date : (a.target_date || '');
          valB = type === 'transaction' ? b.date : (b.target_date || '');
          break;
        case 'amount':
          valA = type === 'transaction' ? getMonthlyAmount(a) : calculateDreamMonthlyContribution(a);
          valB = type === 'transaction' ? getMonthlyAmount(b) : calculateDreamMonthlyContribution(b);
          break;
        case 'recurrence':
          valA = type === 'transaction' ? (a.recurrence_type || '') : '';
          valB = type === 'transaction' ? (b.recurrence_type || '') : '';
          break;
        case 'status':
          valA = type === 'transaction' ? a.status : (a.status || '');
          valB = type === 'transaction' ? b.status : (b.status || '');
          break;
      }

      if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedExpenses = sortData(recurringExpenses, expenseSort, 'transaction');
  const sortedIncome = sortData(recurringIncome, incomeSort, 'transaction');
  const sortedDreams = sortData(financialDreams, dreamSort, 'dream');

  const handleSort = (field: SortField, setSort: React.Dispatch<React.SetStateAction<SortState>>) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const renderSortHeader = (label: string, field: SortField, currentSort: SortState, setSort: React.Dispatch<React.SetStateAction<SortState>>) => (
    <div 
      className="flex items-center gap-[var(--spacing-1)] cursor-pointer hover:text-primary transition-colors"
      onClick={() => handleSort(field, setSort)}
    >
      {label}
      {currentSort.field === field && (
        currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      )}
      {currentSort.field !== field && <ArrowUpDown className="w-3 h-3 opacity-20" />}
    </div>
  );

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-[var(--spacing-4)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[var(--spacing-4)]">
          <div>
            <CardTitle className="text-lg md:text-xl flex items-center gap-[var(--spacing-2)]">
              <Calculator className="w-5 h-5 text-primary" />
              Scenario Planning & Projections
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-[var(--spacing-1)]">
              Analyze recurring cash flow and contribution goals to project future bank balance.
              Uncheck items to exclude them from the projection.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-[var(--spacing-1)] bg-muted/30 p-[var(--spacing-3)] rounded-lg border border-border/50">
            <div className="text-xs text-muted-foreground">Projected 6-Month Balance</div>
            <div className={`text-xl md:text-2xl font-bold ${projectedSixMonthBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${projectedSixMonthBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-[var(--spacing-2)] text-xs">
              <span className="text-muted-foreground">Current: ${currentBankBalance.toLocaleString()}</span>
              <span className="text-muted-foreground">•</span>
              <span className={netMonthlyFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                {netMonthlyFlow >= 0 ? '+' : ''}${netMonthlyFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--spacing-6)]">
          {/* Recurring Expenses Column */}
          <div className="space-y-[var(--spacing-4)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-[var(--spacing-2)] text-red-600 dark:text-red-400">
                <TrendingDown className="w-4 h-4" /> Recurring Expenses
              </h3>
              <Badge variant="outline" className="text-xs font-normal">
                ${monthlyExpenseTotal.toLocaleString()}/mo
              </Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="bg-muted/50 p-[var(--spacing-2)] grid grid-cols-[24px_1fr_80px] gap-[var(--spacing-2)] text-xs font-medium text-muted-foreground border-b">
                <div></div>
                {renderSortHeader("Name", "name", expenseSort, setExpenseSort)}
                <div className="text-right">{renderSortHeader("Amount", "amount", expenseSort, setExpenseSort)}</div>
              </div>
              <div className="max-h-[300px] overflow-y-auto thin-scrollbar">
                {sortedExpenses.length > 0 ? sortedExpenses.map(t => (
                  <div key={t.id} className="p-[var(--spacing-2)] grid grid-cols-[24px_1fr_80px] gap-[var(--spacing-2)] items-center border-b last:border-0 hover:bg-muted/20 text-sm">
                    <Checkbox 
                      checked={selectedExpenses.has(t.id)} 
                      onCheckedChange={() => toggleExpense(t.id)}
                      className="w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.description}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-[var(--spacing-1)]">
                        {t.category} • {t.recurrence_type}
                      </div>
                    </div>
                    <div className="text-right font-medium text-red-600 dark:text-red-400">
                      -${getMonthlyAmount(t).toLocaleString()}
                    </div>
                  </div>
                )) : (
                  <div className="p-[var(--spacing-4)] text-center text-xs text-muted-foreground">
                    No recurring expenses found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recurring Income Column */}
          <div className="space-y-[var(--spacing-4)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-[var(--spacing-2)] text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4" /> Recurring Income
              </h3>
              <Badge variant="outline" className="text-xs font-normal">
                ${monthlyIncomeTotal.toLocaleString()}/mo
              </Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="bg-muted/50 p-[var(--spacing-2)] grid grid-cols-[24px_1fr_80px] gap-[var(--spacing-2)] text-xs font-medium text-muted-foreground border-b">
                <div></div>
                {renderSortHeader("Name", "name", incomeSort, setIncomeSort)}
                <div className="text-right">{renderSortHeader("Amount", "amount", incomeSort, setIncomeSort)}</div>
              </div>
              <div className="max-h-[300px] overflow-y-auto thin-scrollbar">
                {sortedIncome.length > 0 ? sortedIncome.map(t => (
                  <div key={t.id} className="p-[var(--spacing-2)] grid grid-cols-[24px_1fr_80px] gap-[var(--spacing-2)] items-center border-b last:border-0 hover:bg-muted/20 text-sm">
                    <Checkbox 
                      checked={selectedIncome.has(t.id)} 
                      onCheckedChange={() => toggleIncome(t.id)}
                      className="w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{t.description}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-[var(--spacing-1)]">
                        {t.category} • {t.recurrence_type}
                      </div>
                    </div>
                    <div className="text-right font-medium text-green-600 dark:text-green-400">
                      +${getMonthlyAmount(t).toLocaleString()}
                    </div>
                  </div>
                )) : (
                  <div className="p-[var(--spacing-4)] text-center text-xs text-muted-foreground">
                    No recurring income found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contributions / Dreams Column */}
          <div className="space-y-[var(--spacing-4)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-[var(--spacing-2)] text-blue-600 dark:text-blue-400">
                <PiggyBank className="w-4 h-4" /> Contributions
              </h3>
              <Badge variant="outline" className="text-xs font-normal">
                ${monthlyContributionsTotal.toLocaleString()}/mo
              </Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="bg-muted/50 p-[var(--spacing-2)] grid grid-cols-[24px_1fr_80px] gap-[var(--spacing-2)] text-xs font-medium text-muted-foreground border-b">
                <div></div>
                {renderSortHeader("Dream", "name", dreamSort, setDreamSort)}
                <div className="text-right">{renderSortHeader("Monthly", "amount", dreamSort, setDreamSort)}</div>
              </div>
              <div className="max-h-[300px] overflow-y-auto thin-scrollbar">
                {sortedDreams.length > 0 ? sortedDreams.map(d => (
                  <div key={d.id} className="p-[var(--spacing-2)] grid grid-cols-[24px_1fr_80px] gap-[var(--spacing-2)] items-center border-b last:border-0 hover:bg-muted/20 text-sm">
                    <Checkbox 
                      checked={selectedDreams.has(d.id)} 
                      onCheckedChange={() => toggleDream(d.id)}
                      className="w-4 h-4"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Target: ${(d.target_amount || 0).toLocaleString()}
                        {d.target_date && ` • ${new Date(d.target_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="text-right font-medium text-blue-600 dark:text-blue-400">
                      ${calculateDreamMonthlyContribution(d).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )) : (
                  <div className="p-[var(--spacing-4)] text-center text-xs text-muted-foreground">
                    No financial dreams found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
