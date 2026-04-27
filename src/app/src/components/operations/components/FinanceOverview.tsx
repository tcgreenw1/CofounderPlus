import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled' | 'scheduled';
  recurrence_type?: 'one-time' | 'bi-weekly' | 'monthly' | 'annual';
  recurrence_interval?: number;
}

interface BankBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

interface SummaryData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  pendingInvoices: number;
  activeBudgets: number;
}

interface FinanceOverviewProps {
  summaryData: SummaryData;
  transactions?: Transaction[];
  bankBalance?: BankBalance;
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = React.memo(({ summaryData, transactions = [], bankBalance }) => {
  const { totalIncome, totalExpenses, netIncome, pendingInvoices, activeBudgets } = summaryData;
  
  // Calculate monthly averages for display cards
  const monthlyAverages = useMemo(() => {
    const currentBalance = bankBalance?.balance || 0;
    const now = new Date();
    
    // Calculate monthly income and expense averages
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const monthsAgo = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      // For income: only completed, for expenses: include all statuses (pending, completed, etc.)
      const includeTransaction = monthsAgo <= 12 && 
        (t.type === 'income' ? t.status === 'completed' : true);
      return includeTransaction;
    });
    
    // Group by month to get monthly totals
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    monthlyTransactions.forEach(t => {
      const month = new Date(t.date).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
    });
    
    // Calculate averages
    const months = Object.keys(monthlyData);
    const avgMonthlyIncome = months.length > 0 
      ? months.reduce((sum, month) => sum + monthlyData[month].income, 0) / months.length 
      : 0;
    const avgMonthlyExpenses = months.length > 0 
      ? months.reduce((sum, month) => sum + monthlyData[month].expenses, 0) / months.length 
      : 0;
    
    // Include recurring transactions in projections
    const recurringIncome = transactions
      .filter(t => t.type === 'income' && t.recurrence_type && t.recurrence_type !== 'one-time')
      .reduce((sum, t) => {
        // Convert to monthly equivalent
        if (t.recurrence_type === 'monthly') return sum + t.amount;
        if (t.recurrence_type === 'bi-weekly') return sum + (t.amount * 26 / 12);
        if (t.recurrence_type === 'annual') return sum + (t.amount / 12);
        return sum;
      }, 0);
    
    const recurringExpenses = transactions
      .filter(t => t.type === 'expense' && t.recurrence_type && t.recurrence_type !== 'one-time')
      .reduce((sum, t) => {
        // Convert to monthly equivalent
        if (t.recurrence_type === 'monthly') return sum + t.amount;
        if (t.recurrence_type === 'bi-weekly') return sum + (t.amount * 26 / 12);
        if (t.recurrence_type === 'annual') return sum + (t.amount / 12);
        return sum;
      }, 0);
    
    // Combine historical averages with recurring transactions
    const projectedMonthlyIncome = Math.max(avgMonthlyIncome, recurringIncome);
    const projectedMonthlyExpenses = Math.max(avgMonthlyExpenses, recurringExpenses);
    const projectedMonthlyNet = projectedMonthlyIncome - projectedMonthlyExpenses;
    
    return {
      monthlyIncome: projectedMonthlyIncome,
      monthlyExpenses: projectedMonthlyExpenses,
      monthlyNet: projectedMonthlyNet,
      currentBalance
    };
  }, [transactions, bankBalance]);

  const cards = [
    {
      title: 'Monthly Income',
      value: '$' + Math.round(monthlyAverages.monthlyIncome).toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Monthly Expenses',
      value: '$' + Math.round(monthlyAverages.monthlyExpenses).toLocaleString(),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Monthly Net',
      value: '$' + Math.round(monthlyAverages.monthlyNet).toLocaleString(),
      icon: BarChart3,
      color: monthlyAverages.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: monthlyAverages.monthlyNet >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 md:p-4 md:pb-2">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`p-1 sm:p-1.5 md:p-2 rounded-full ${card.bgColor}`}>
                <IconComponent className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-0 md:pt-0">
              <div className={`text-sm sm:text-lg md:text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
